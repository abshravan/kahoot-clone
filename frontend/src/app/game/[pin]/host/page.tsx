'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AnswerButton } from '@/components/AnswerButton';
import { Leaderboard } from '@/components/Leaderboard';
import { TimerBar } from '@/components/TimerBar';
import { useAuth } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import type { LeaderboardRow, Player, PublicQuestion } from '@/lib/types';

export default function HostGamePage() {
  const params = useParams<{ pin: string }>();
  const pin = params.pin;
  const router = useRouter();
  const hydrate = useAuth((s) => s.hydrate);
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);

  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<'waiting' | 'live' | 'ended'>('waiting');
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [lastLeaderboard, setLastLeaderboard] = useState<LeaderboardRow[]>([]);
  const [answerCounts, setAnswerCounts] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    socket.emit('host_join', { pin, hostId: user.id }, (res: { ok: boolean; error?: string; session?: { status: 'waiting' | 'live' | 'ended'; players: Player[] } }) => {
      if (!res.ok) {
        setError(res.error || 'Failed to join session');
        return;
      }
      if (res.session) {
        setStatus(res.session.status);
        setPlayers(res.session.players);
      }
    });

    const onPlayerJoined = ({ players }: { players: Player[] }) => setPlayers(players);
    const onPlayerLeft = ({ playerId }: { playerId: string }) =>
      setPlayers((p) => p.filter((x) => x.id !== playerId));
    const onGameStarted = ({ totalQuestions }: { totalQuestions: number }) => {
      setStatus('live');
      setTotalQuestions(totalQuestions);
    };
    const onNextQuestion = (payload: {
      index: number;
      total: number;
      question: PublicQuestion;
      startedAt: number;
    }) => {
      setQuestion(payload.question);
      setQuestionIndex(payload.index);
      setTotalQuestions(payload.total);
      setStartedAt(payload.startedAt);
      setAnswerCounts([]);
      setCorrectAnswer(null);
    };
    const onLeaderboard = (payload: {
      leaderboard: LeaderboardRow[];
      answerCounts: number[];
      correctAnswer: number;
    }) => {
      setLastLeaderboard(payload.leaderboard);
      setAnswerCounts(payload.answerCounts);
      setCorrectAnswer(payload.correctAnswer);
    };
    const onGameEnded = (payload: { leaderboard: LeaderboardRow[] }) => {
      setStatus('ended');
      setLastLeaderboard(payload.leaderboard);
      setQuestion(null);
    };

    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('game_started', onGameStarted);
    socket.on('next_question', onNextQuestion);
    socket.on('leaderboard_update', onLeaderboard);
    socket.on('game_ended', onGameEnded);

    return () => {
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('game_started', onGameStarted);
      socket.off('next_question', onNextQuestion);
      socket.off('leaderboard_update', onLeaderboard);
      socket.off('game_ended', onGameEnded);
    };
  }, [pin, user]);

  function startGame() {
    if (!user) return;
    const socket = getSocket();
    socket.emit('host_start_game', { pin, hostId: user.id }, (res: { ok: boolean; error?: string }) => {
      if (!res.ok) setError(res.error || 'Failed to start');
    });
  }

  function nextQuestion() {
    if (!user) return;
    const socket = getSocket();
    socket.emit('host_next_question', { pin, hostId: user.id }, (res: { ok: boolean; error?: string }) => {
      if (!res.ok) setError(res.error || 'Failed to advance');
    });
  }

  const joinUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?pin=${pin}`;
  }, [pin]);

  if (!token) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p>You must be signed in as host.</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Game PIN</p>
          <p className="font-mono text-5xl tracking-widest">{pin}</p>
          <p className="mt-1 text-xs text-slate-500">{joinUrl}</p>
        </div>
        <button className="btn-secondary" onClick={() => router.push('/host')}>
          Back to dashboard
        </button>
      </header>

      {error && <p className="text-red-400">{error}</p>}

      {status === 'waiting' && (
        <section className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h2 className="text-xl font-bold">Players ({players.length})</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {players.map((p) => (
                <li
                  key={p.id}
                  className="rounded-full bg-slate-800 px-3 py-1 text-sm"
                >
                  {p.name}
                </li>
              ))}
            </ul>
            {players.length === 0 && (
              <p className="mt-2 text-slate-400">Waiting for players…</p>
            )}
          </div>
          <div className="card flex flex-col justify-center gap-4 text-center">
            <p className="text-lg">Ready when you are.</p>
            <button
              className="btn-primary text-lg"
              disabled={players.length === 0}
              onClick={startGame}
            >
              Start game
            </button>
          </div>
        </section>
      )}

      {status === 'live' && question && (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-slate-400">
            <span>
              Question {questionIndex + 1} / {totalQuestions}
            </span>
            <span>{players.length} players</span>
          </div>
          <div className="card">
            <h2 className="text-2xl font-semibold">{question.questionText}</h2>
          </div>
          <TimerBar startedAt={startedAt} durationMs={question.timeLimit * 1000} />
          <div className="grid gap-3 md:grid-cols-2">
            {question.options.map((o, i) => (
              <AnswerButton
                key={i}
                index={i}
                label={o}
                disabled
                state={
                  correctAnswer === null
                    ? 'default'
                    : correctAnswer === i
                      ? 'correct'
                      : 'wrong'
                }
              />
            ))}
          </div>
          {answerCounts.length > 0 && (
            <div className="card">
              <h3 className="mb-2 font-semibold">Answer distribution</h3>
              <div className="flex items-end gap-3">
                {answerCounts.map((c, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center">
                    <div
                      className="w-full rounded-t bg-brand"
                      style={{ height: `${Math.max(c * 30, 4)}px` }}
                    />
                    <span className="mt-1 text-xs">{c}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary mt-4" onClick={nextQuestion}>
                Next question →
              </button>
            </div>
          )}
        </section>
      )}

      {(status === 'ended' || lastLeaderboard.length > 0) && (
        <Leaderboard
          rows={lastLeaderboard}
          title={status === 'ended' ? 'Final results' : 'Standings'}
        />
      )}
    </main>
  );
}
