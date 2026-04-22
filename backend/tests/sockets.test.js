/**
 * Integration tests for the Socket.IO game engine.
 *
 * Mongoose models and the PIN util are mocked so we can exercise event
 * wiring without a real MongoDB. If you have a local MongoDB, run the
 * full server instead — this test is narrow on purpose.
 */
const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

jest.mock('../src/models/GameSession', () => {
  const store = new Map();
  function makeDoc(data) {
    const scoresMap =
      data.scores instanceof Map ? data.scores : new Map(Object.entries(data.scores || {}));
    const doc = {
      ...data,
      scores: scoresMap,
      save: jest.fn(async function () {
        store.set(this.pin, this);
        return this;
      }),
    };
    return doc;
  }
  return {
    findOne: jest.fn(async (q) => store.get(q.pin) || null),
    __reset: () => store.clear(),
    __seed: (data) => {
      const doc = makeDoc(data);
      store.set(doc.pin, doc);
      return doc;
    },
  };
});

jest.mock('../src/models/Quiz', () => ({
  findById: jest.fn(),
}));

const GameSession = require('../src/models/GameSession');
const Quiz = require('../src/models/Quiz');
const { registerGameHandlers } = require('../src/sockets/gameEngine');

function makeQuiz() {
  return {
    _id: 'quiz-1',
    questions: [
      {
        _id: { toString: () => 'q1' },
        questionText: 'What is 2+2?',
        options: ['1', '2', '3', '4'],
        correctAnswer: 3,
        timeLimit: 15,
      },
      {
        _id: { toString: () => 'q2' },
        questionText: 'Capital of France?',
        options: ['Paris', 'Rome', 'Madrid', 'Berlin'],
        correctAnswer: 0,
        timeLimit: 15,
      },
    ],
  };
}

describe('socket game engine', () => {
  let httpServer;
  let io;
  let port;

  beforeAll((done) => {
    httpServer = http.createServer();
    io = new Server(httpServer);
    io.on('connection', (socket) => registerGameHandlers(io, socket));
    httpServer.listen(() => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    httpServer.close(done);
  });

  beforeEach(() => {
    GameSession.__reset();
    Quiz.findById.mockReset();
  });

  function connect() {
    return Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
  }

  function emitAsync(client, event, payload) {
    return new Promise((resolve) => client.emit(event, payload, resolve));
  }

  test('rejects joining with an invalid PIN', async () => {
    const client = connect();
    const res = await emitAsync(client, 'join_game', {
      pin: '000000',
      playerName: 'Alice',
    });
    expect(res.ok).toBe(false);
    client.close();
  });

  test('rejects duplicate player names in the same session', async () => {
    GameSession.__seed({
      pin: '123456',
      hostId: 'host-1',
      quizId: 'quiz-1',
      players: [],
      scores: {},
      currentQuestionIndex: -1,
      status: 'waiting',
    });

    const a = connect();
    const b = connect();
    try {
      const first = await emitAsync(a, 'join_game', {
        pin: '123456',
        playerName: 'Alice',
      });
      expect(first.ok).toBe(true);
      const dup = await emitAsync(b, 'join_game', {
        pin: '123456',
        playerName: 'alice',
      });
      expect(dup.ok).toBe(false);
      expect(dup.error).toMatch(/taken/i);
    } finally {
      a.close();
      b.close();
    }
  });

  test('full flow: join, start, answer, get result', async () => {
    const pin = '654321';
    GameSession.__seed({
      pin,
      hostId: 'host-1',
      quizId: 'quiz-1',
      players: [],
      scores: {},
      currentQuestionIndex: -1,
      status: 'waiting',
    });
    Quiz.findById.mockResolvedValue(makeQuiz());

    const host = connect();
    const player = connect();

    try {
      // Host joins
      const hostRes = await emitAsync(host, 'host_join', { pin, hostId: 'host-1' });
      expect(hostRes.ok).toBe(true);

      // Player joins
      const joinRes = await emitAsync(player, 'join_game', {
        pin,
        playerName: 'Alice',
      });
      expect(joinRes.ok).toBe(true);

      // When the first question lands, submit the correct answer
      const nextQuestion = new Promise((resolve) => player.once('next_question', resolve));
      const startRes = await emitAsync(host, 'host_start_game', {
        pin,
        hostId: 'host-1',
      });
      expect(startRes.ok).toBe(true);

      const q = await nextQuestion;
      expect(q.question.id).toBe('q1');

      const submit = await emitAsync(player, 'submit_answer', {
        pin,
        questionId: 'q1',
        answer: 3,
        timeTaken: 2,
      });
      expect(submit.ok).toBe(true);
      expect(submit.correct).toBe(true);
      // 1000 - 2*50 = 900
      expect(submit.points).toBe(900);
    } finally {
      host.close();
      player.close();
    }
  });
});
