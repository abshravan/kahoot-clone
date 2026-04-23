const crypto = require('crypto');
const Quiz = require('../models/Quiz');
const GameSession = require('../models/GameSession');
const { calculateScore, rankLeaderboard } = require('../utils/scoring');

/**
 * In-memory runtime state for active games.
 *
 * Persistence strategy: the GameSession document in MongoDB stores the
 * durable record (pin, players, scores, status). Per-question timers and
 * per-question answer tallies are volatile and kept here only. On
 * server restart in-flight games are cancelled — this matches Kahoot
 * semantics, where a closed game cannot be resumed.
 */
const activeGames = new Map();

function getRuntime(pin) {
  let rt = activeGames.get(pin);
  if (!rt) {
    rt = {
      pin,
      quiz: null,
      questionStartedAt: 0,
      answersThisQuestion: new Map(),
      questionTimer: null,
    };
    activeGames.set(pin, rt);
  }
  return rt;
}

function clearQuestionTimer(rt) {
  if (rt.questionTimer) {
    clearTimeout(rt.questionTimer);
    rt.questionTimer = null;
  }
}

function publicQuestion(q) {
  return {
    id: q._id.toString(),
    questionText: q.questionText,
    options: q.options,
    timeLimit: q.timeLimit,
  };
}

function playersPublic(session) {
  return session.players.map((p) => ({ id: p.id, name: p.name }));
}

function leaderboardFor(session) {
  return rankLeaderboard(session.scores, session.players);
}

function registerGameHandlers(io, socket) {
  // ---------- Player joins a game ----------
  socket.on('join_game', async ({ pin, playerName }, ack) => {
    try {
      if (!pin || !playerName) {
        return ack?.({ ok: false, error: 'pin and playerName required' });
      }
      const name = String(playerName).trim().slice(0, 24);
      if (!name) return ack?.({ ok: false, error: 'Name cannot be empty' });

      const session = await GameSession.findOne({ pin });
      if (!session) return ack?.({ ok: false, error: 'Invalid PIN' });
      if (session.status === 'ended')
        return ack?.({ ok: false, error: 'Game has ended' });

      const nameTaken = session.players.some(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (nameTaken) return ack?.({ ok: false, error: 'Name already taken' });

      const playerId = crypto.randomUUID();
      session.players.push({ id: playerId, name, socketId: socket.id });
      if (!session.scores.has(playerId)) session.scores.set(playerId, 0);
      await session.save();

      socket.data.pin = pin;
      socket.data.playerId = playerId;
      socket.data.role = 'player';
      socket.join(`game:${pin}`);

      io.to(`game:${pin}`).emit('player_joined', {
        player: { id: playerId, name },
        players: playersPublic(session),
      });

      ack?.({
        ok: true,
        player: { id: playerId, name },
        players: playersPublic(session),
      });
    } catch (err) {
      console.error('[join_game]', err);
      ack?.({ ok: false, error: 'Server error' });
    }
  });

  // ---------- Host joins the session room to receive events ----------
  socket.on('host_join', async ({ pin, hostId }, ack) => {
    try {
      const session = await GameSession.findOne({ pin });
      if (!session) return ack?.({ ok: false, error: 'Invalid PIN' });
      if (session.hostId.toString() !== String(hostId)) {
        return ack?.({ ok: false, error: 'Not the host of this session' });
      }
      socket.data.pin = pin;
      socket.data.role = 'host';
      socket.join(`game:${pin}`);
      socket.join(`host:${pin}`);
      ack?.({
        ok: true,
        session: {
          pin: session.pin,
          status: session.status,
          players: playersPublic(session),
          quizId: session.quizId.toString(),
        },
      });
    } catch (err) {
      console.error('[host_join]', err);
      ack?.({ ok: false, error: 'Server error' });
    }
  });

  // ---------- Host starts the game ----------
  socket.on('host_start_game', async ({ pin, hostId }, ack) => {
    try {
      const session = await GameSession.findOne({ pin });
      if (!session) return ack?.({ ok: false, error: 'Invalid PIN' });
      if (session.hostId.toString() !== String(hostId))
        return ack?.({ ok: false, error: 'Not the host' });
      if (session.status !== 'waiting')
        return ack?.({ ok: false, error: 'Game already started' });
      if (!session.players.length)
        return ack?.({ ok: false, error: 'No players have joined yet' });

      const quiz = await Quiz.findById(session.quizId);
      if (!quiz || !quiz.questions.length)
        return ack?.({ ok: false, error: 'Quiz has no questions' });

      session.status = 'live';
      session.startedAt = new Date();
      session.currentQuestionIndex = -1;
      await session.save();

      const rt = getRuntime(pin);
      rt.quiz = quiz;

      io.to(`game:${pin}`).emit('game_started', { totalQuestions: quiz.questions.length });
      ack?.({ ok: true });

      // push the first question immediately
      pushNextQuestion(io, pin).catch((err) => console.error('[next_question]', err));
    } catch (err) {
      console.error('[host_start_game]', err);
      ack?.({ ok: false, error: 'Server error' });
    }
  });

  // ---------- Host manually advances ----------
  socket.on('host_next_question', async ({ pin, hostId }, ack) => {
    try {
      const session = await GameSession.findOne({ pin });
      if (!session) return ack?.({ ok: false, error: 'Invalid PIN' });
      if (session.hostId.toString() !== String(hostId))
        return ack?.({ ok: false, error: 'Not the host' });
      if (session.status !== 'live')
        return ack?.({ ok: false, error: 'Game is not live' });
      ack?.({ ok: true });
      pushNextQuestion(io, pin).catch((err) => console.error('[next_question]', err));
    } catch (err) {
      console.error('[host_next_question]', err);
      ack?.({ ok: false, error: 'Server error' });
    }
  });

  // ---------- Player submits an answer ----------
  // Rate limit: at most one accepted answer per player per question.
  socket.on('submit_answer', async ({ pin, questionId, answer, timeTaken }, ack) => {
    try {
      if (!pin || typeof answer !== 'number') {
        return ack?.({ ok: false, error: 'Invalid payload' });
      }
      const playerId = socket.data.playerId;
      if (!playerId || socket.data.pin !== pin) {
        return ack?.({ ok: false, error: 'Not joined to this game' });
      }

      const rt = getRuntime(pin);
      if (!rt.quiz) return ack?.({ ok: false, error: 'No active question' });

      const session = await GameSession.findOne({ pin });
      if (!session || session.status !== 'live')
        return ack?.({ ok: false, error: 'Game is not live' });

      const question = rt.quiz.questions[session.currentQuestionIndex];
      if (!question || question._id.toString() !== String(questionId)) {
        return ack?.({ ok: false, error: 'Question not active' });
      }

      if (rt.answersThisQuestion.has(playerId)) {
        return ack?.({ ok: false, error: 'Already answered' });
      }

      const elapsed = (Date.now() - rt.questionStartedAt) / 1000;
      const effectiveTime = Math.min(
        Number.isFinite(timeTaken) ? timeTaken : elapsed,
        question.timeLimit
      );
      const correct = Number(answer) === question.correctAnswer;
      const points = calculateScore({
        correct,
        timeTaken: effectiveTime,
        timeLimit: question.timeLimit,
      });

      rt.answersThisQuestion.set(playerId, { answer, correct, points });

      const current = session.scores.get(playerId) || 0;
      session.scores.set(playerId, current + points);
      await session.save();

      ack?.({ ok: true, correct, points });

      // Live leaderboard tick for the host only — players must not see
      // standings change mid-question.
      io.to(`host:${pin}`).emit('host_leaderboard_update', {
        leaderboard: leaderboardFor(session),
        answeredCount: rt.answersThisQuestion.size,
        totalPlayers: session.players.length,
      });

      // If all players answered, end the question early.
      if (rt.answersThisQuestion.size >= session.players.length) {
        finishQuestion(io, pin).catch((err) => console.error('[finish_question]', err));
      }
    } catch (err) {
      console.error('[submit_answer]', err);
      ack?.({ ok: false, error: 'Server error' });
    }
  });

  // ---------- Disconnect ----------
  socket.on('disconnect', async () => {
    const { pin, playerId, role } = socket.data || {};
    if (!pin || role !== 'player' || !playerId) return;
    try {
      const session = await GameSession.findOne({ pin });
      if (!session) return;
      // Keep their score; just detach the socket id.
      const player = session.players.find((p) => p.id === playerId);
      if (player) {
        player.socketId = '';
        await session.save();
      }
      io.to(`game:${pin}`).emit('player_left', { playerId });
    } catch (err) {
      console.error('[disconnect]', err);
    }
  });
}

async function pushNextQuestion(io, pin) {
  const rt = getRuntime(pin);
  const session = await GameSession.findOne({ pin });
  if (!session || session.status !== 'live') return;
  if (!rt.quiz) rt.quiz = await Quiz.findById(session.quizId);

  clearQuestionTimer(rt);
  rt.answersThisQuestion = new Map();

  const nextIndex = session.currentQuestionIndex + 1;
  if (nextIndex >= rt.quiz.questions.length) {
    return endGame(io, pin);
  }

  session.currentQuestionIndex = nextIndex;
  await session.save();

  const question = rt.quiz.questions[nextIndex];
  rt.questionStartedAt = Date.now();

  io.to(`game:${pin}`).emit('next_question', {
    index: nextIndex,
    total: rt.quiz.questions.length,
    question: publicQuestion(question),
    startedAt: rt.questionStartedAt,
  });

  rt.questionTimer = setTimeout(() => {
    finishQuestion(io, pin).catch((err) => console.error('[finish_question]', err));
  }, question.timeLimit * 1000 + 500);
}

async function finishQuestion(io, pin) {
  const rt = getRuntime(pin);
  clearQuestionTimer(rt);

  const session = await GameSession.findOne({ pin });
  if (!session || session.status !== 'live' || !rt.quiz) return;

  const question = rt.quiz.questions[session.currentQuestionIndex];
  if (!question) return;

  const perPlayerResults = {};
  for (const [playerId, data] of rt.answersThisQuestion.entries()) {
    perPlayerResults[playerId] = data;
  }

  // Tell each player their individual result
  for (const player of session.players) {
    const r = perPlayerResults[player.id] || {
      answer: null,
      correct: false,
      points: 0,
    };
    if (player.socketId) {
      io.to(player.socketId).emit('answer_result', {
        questionId: question._id.toString(),
        correctAnswer: question.correctAnswer,
        correct: r.correct,
        points: r.points,
        totalScore: session.scores.get(player.id) || 0,
      });
    }
  }

  const leaderboard = leaderboardFor(session);
  io.to(`game:${pin}`).emit('leaderboard_update', {
    leaderboard,
    questionIndex: session.currentQuestionIndex,
    correctAnswer: question.correctAnswer,
    answerCounts: countAnswers(rt.answersThisQuestion, 4),
  });

  // Auto-advance after a short break. Host can also manually call next.
  rt.questionTimer = setTimeout(() => {
    pushNextQuestion(io, pin).catch((err) => console.error('[next_question]', err));
  }, 5000);
}

function countAnswers(answersMap, numOptions) {
  const counts = Array(numOptions).fill(0);
  for (const { answer } of answersMap.values()) {
    if (typeof answer === 'number' && answer >= 0 && answer < numOptions) {
      counts[answer]++;
    }
  }
  return counts;
}

async function endGame(io, pin) {
  const rt = getRuntime(pin);
  clearQuestionTimer(rt);
  const session = await GameSession.findOne({ pin });
  if (!session) return;

  session.status = 'ended';
  session.endedAt = new Date();
  await session.save();

  io.to(`game:${pin}`).emit('game_ended', {
    leaderboard: leaderboardFor(session),
  });

  activeGames.delete(pin);
}

module.exports = {
  registerGameHandlers,
  // Exposed for tests
  _internal: { activeGames, pushNextQuestion, finishQuestion, endGame },
};
