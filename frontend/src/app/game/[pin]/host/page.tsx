'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AnswerButton } from '@/components/AnswerButton';
import { Leaderboard } from '@/components/Leaderboard';
import { TimerBar } from '@/components/TimerBar';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import type { LeaderboardRow, Player, PublicQuestion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const PLAYER_BADGE_TONES = [
  'shadow-[0_6px_0_0_rgba(0,64,223,0.15)]',
  'shadow-[0_6px_0_0_rgba(173,0,137,0.15)]',
  'shadow-[0_6px_0_0_rgba(112,93,0,0.15)]',
  'shadow-[0_6px_0_0_rgba(16,74,240,0.15)]',
] as const;

const AVATAR_TONES = [
  'bg-primary-fixed text-primary',
  'bg-secondary-fixed text-secondary',
  'bg-tertiary-fixed text-tertiary',
  'bg-surface-container-highest text-primary',
] as const;

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

    socket.emit(
      'host_join',
      { pin, hostId: user.id },
      (res: {
        ok: boolean;
        error?: string;
        session?: { status: 'waiting' | 'live' | 'ended'; players: Player[] };
      }) => {
        if (!res.ok) {
          setError(res.error || 'Failed to join session');
          return;
        }
        if (res.session) {
          setStatus(res.session.status);
          setPlayers(res.session.players);
        }
      }
    );

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
    getSocket().emit(
      'host_start_game',
      { pin, hostId: user.id },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) setError(res.error || 'Failed to start');
      }
    );
  }

  function nextQuestion() {
    if (!user) return;
    getSocket().emit(
      'host_next_question',
      { pin, hostId: user.id },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) setError(res.error || 'Failed to advance');
      }
    );
  }

  const joinUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?pin=${pin}`;
  }, [pin]);

  if (!token) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center py-24">
          <p className="text-on-surface-variant">You must be signed in as host.</p>
        </div>
      </AppShell>
    );
  }

  const formattedPin = pin.length === 6 ? `${pin.slice(0, 3)} ${pin.slice(3)}` : pin;

  return (
    <AppShell pin={pin}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {status === 'waiting' && (
        <>
          <section className="mb-10 flex flex-col items-center text-center">
            <div className="rounded-3xl border-4 border-surface-container-highest bg-white px-10 py-6 shadow-[0_12px_0_0_#e2e0fc]">
              <span className="mb-1 block font-label text-label-bold uppercase tracking-widest text-on-surface-variant">
                Join at the URL below
              </span>
              <div className="flex items-center gap-4">
                <span className="font-display text-display-xl text-primary tabular-nums">
                  {formattedPin}
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(joinUrl)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-low text-primary transition-colors hover:bg-primary hover:text-white"
                  aria-label="Copy join link"
                >
                  <Icon name="content_copy" />
                </button>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">{joinUrl}</p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <div className="flex items-center gap-2 rounded-full border-2 border-secondary/20 bg-secondary/10 px-4 py-2 font-label text-label-bold text-secondary">
                <Icon name="group" filled className="text-base" />
                {players.length} Player{players.length === 1 ? '' : 's'} Waiting
              </div>
              <div className="flex items-center gap-2 rounded-full border-2 border-tertiary/20 bg-tertiary/10 px-4 py-2 font-label text-label-bold text-tertiary">
                <Icon name="timer" className="text-base" />
                {players.length === 0 ? 'Waiting for players…' : 'Ready to Start'}
              </div>
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {players.map((p, i) => {
              const tone = AVATAR_TONES[i % AVATAR_TONES.length];
              const shadow = PLAYER_BADGE_TONES[i % PLAYER_BADGE_TONES.length];
              return (
                <div
                  key={p.id}
                  className={cn(
                    'group flex flex-col items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-4 transition-transform hover:-translate-y-1',
                    shadow
                  )}
                >
                  <div
                    className={cn(
                      'flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white font-display text-3xl shadow-lg transition-transform group-hover:scale-110',
                      tone
                    )}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate text-body-lg font-bold text-on-surface">
                    {p.name}
                  </span>
                </div>
              );
            })}
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-4 border-dashed border-outline-variant bg-surface-container/50 p-4 opacity-60">
              <div className="h-16 w-16 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            </div>
          </section>

          <div className="sticky bottom-6 mt-10 flex items-center justify-between gap-4 rounded-3xl border-2 border-slate-100 bg-white/80 p-5 backdrop-blur-lg shadow-xl">
            <div className="flex items-center gap-3 text-on-surface-variant">
              <div className="flex -space-x-2">
                <span className="h-8 w-8 rounded-full border-2 border-white bg-primary" />
                <span className="h-8 w-8 rounded-full border-2 border-white bg-secondary" />
                <span className="h-8 w-8 rounded-full border-2 border-white bg-tertiary" />
              </div>
              <p className="hidden text-body-md sm:block">
                Waiting for more players to join the chaos…
              </p>
            </div>
            <Button
              variant="tactile"
              size="xl"
              disabled={players.length === 0}
              onClick={startGame}
            >
              Start Game
              <Icon name="play_arrow" filled />
            </Button>
          </div>
        </>
      )}

      {status === 'live' && question && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="rounded-full border-2 border-primary/20 bg-primary/10 px-4 py-1.5 font-label text-label-bold uppercase tracking-widest text-primary">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
            <span className="font-label text-body-md text-on-surface-variant">
              {players.length} player{players.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="rounded-3xl border-4 border-white bg-white p-8 text-center shadow-[0_20px_50px_-12px_rgba(45,91,255,0.2)] ring-4 ring-slate-100">
            <h2 className="font-display text-headline-lg text-on-surface">
              {question.questionText}
            </h2>
          </div>

          <TimerBar startedAt={startedAt} durationMs={question.timeLimit * 1000} />

          <div className="grid gap-4 md:grid-cols-2">
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
            <Card>
              <CardContent className="space-y-4 p-6">
                <h3 className="flex items-center gap-2 font-display text-headline-md">
                  <Icon name="bar_chart" filled className="text-primary" />
                  Answer distribution
                </h3>
                <div className="flex items-end gap-3">
                  {answerCounts.map((c, i) => {
                    const tone = ['bg-answer-red', 'bg-answer-blue', 'bg-answer-yellow', 'bg-answer-green'][i];
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center">
                        <div
                          className={cn('w-full rounded-t-xl', tone)}
                          style={{ height: `${Math.max(c * 30, 8)}px` }}
                        />
                        <span className="mt-1 font-label text-sm text-on-surface-variant">
                          {c}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Button variant="tactile" onClick={nextQuestion}>
                  Next question
                  <Icon name="arrow_forward" />
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {(status === 'ended' || (status === 'live' && lastLeaderboard.length > 0)) && (
        <div className={status === 'ended' ? 'py-8' : 'mt-8'}>
          <Leaderboard
            rows={lastLeaderboard}
            title={status === 'ended' ? 'Victory Royale!' : 'Standings'}
            showPodium={status === 'ended'}
          />
          {status === 'ended' && (
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button variant="tactile" size="lg" onClick={() => router.push('/host')}>
                <Icon name="replay" />
                Play again
              </Button>
              <Button
                variant="tactile-outline"
                size="lg"
                onClick={() => router.push('/host')}
              >
                <Icon name="logout" />
                Exit
              </Button>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
