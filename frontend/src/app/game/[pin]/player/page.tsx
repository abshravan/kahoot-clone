'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AnswerButton } from '@/components/AnswerButton';
import { Leaderboard } from '@/components/Leaderboard';
import { TimerBar } from '@/components/TimerBar';
import { Icon } from '@/components/Icon';
import { getSocket } from '@/lib/socket';
import type { LeaderboardRow, PublicQuestion } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Phase =
  | 'joining'
  | 'waiting'
  | 'question'
  | 'answered'
  | 'result'
  | 'ended'
  | 'error';

export default function PlayerGamePage() {
  const params = useParams<{ pin: string }>();
  const search = useSearchParams();
  const pin = params.pin;
  const initialName = search.get('name') ?? '';

  const [name] = useState(initialName);
  const [phase, setPhase] = useState<Phase>(initialName ? 'joining' : 'error');
  const [error, setError] = useState<string | null>(
    initialName ? null : 'Missing player name. Please join from the home page.'
  );
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    points: number;
    totalScore: number;
    correctAnswer: number;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [streak, setStreak] = useState(0);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!initialName || joinedRef.current) return;
    joinedRef.current = true;
    const socket = getSocket();

    socket.emit(
      'join_game',
      { pin, playerName: initialName },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) {
          setError(res.error || 'Failed to join');
          setPhase('error');
          joinedRef.current = false;
          return;
        }
        setPhase('waiting');
      }
    );

    const onNextQuestion = (payload: {
      question: PublicQuestion;
      startedAt: number;
    }) => {
      setQuestion(payload.question);
      setStartedAt(payload.startedAt);
      setSelected(null);
      setResult(null);
      setPhase('question');
    };

    const onAnswerResult = (payload: {
      correct: boolean;
      points: number;
      totalScore: number;
      correctAnswer: number;
    }) => {
      setResult(payload);
      setStreak((s) => (payload.correct ? s + 1 : 0));
      setPhase('result');
    };

    const onLeaderboard = (payload: { leaderboard: LeaderboardRow[] }) => {
      setLeaderboard(payload.leaderboard);
    };

    const onGameEnded = (payload: { leaderboard: LeaderboardRow[] }) => {
      setLeaderboard(payload.leaderboard);
      setPhase('ended');
    };

    socket.on('next_question', onNextQuestion);
    socket.on('answer_result', onAnswerResult);
    socket.on('leaderboard_update', onLeaderboard);
    socket.on('game_ended', onGameEnded);

    return () => {
      socket.off('next_question', onNextQuestion);
      socket.off('answer_result', onAnswerResult);
      socket.off('leaderboard_update', onLeaderboard);
      socket.off('game_ended', onGameEnded);
    };
  }, [pin, initialName]);

  function submit(answer: number) {
    if (!question || selected !== null) return;
    setSelected(answer);
    setPhase('answered');
    const timeTaken = (Date.now() - startedAt) / 1000;
    const socket = getSocket();
    socket.emit(
      'submit_answer',
      { pin, questionId: question.id, answer, timeTaken },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) {
          setError(res.error || 'Failed to submit');
          setSelected(null);
          setPhase('question');
        }
      }
    );
  }

  if (phase === 'error') {
    return (
      <AppShell pin={pin}>
        <div className="flex flex-1 items-center justify-center py-12">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pin={pin}>
      <header className="mb-6 flex items-center justify-between rounded-2xl border-2 border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed font-display text-headline-md text-primary">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs uppercase text-on-surface-variant">Playing as</p>
            <p className="font-display text-body-lg font-bold">{name}</p>
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1.5 font-label text-label-bold text-secondary">
            <Icon name="local_fire_department" filled />
            {streak} streak
          </div>
        )}
      </header>

      {phase === 'waiting' && (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <Icon name="hourglass_top" filled className="text-3xl" />
            </div>
            <h2 className="font-display text-headline-md text-on-surface">
              You&apos;re in!
            </h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Waiting for the host to start…
            </p>
          </CardContent>
        </Card>
      )}

      {phase === 'question' && question && (
        <>
          <div className="mb-4 rounded-3xl border-4 border-white bg-white p-6 text-center shadow-[0_20px_50px_-12px_rgba(45,91,255,0.2)] ring-4 ring-slate-100">
            <p className="font-display text-headline-md text-on-surface">
              {question.questionText}
            </p>
          </div>
          <TimerBar startedAt={startedAt} durationMs={question.timeLimit * 1000} />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {question.options.map((o, i) => (
              <AnswerButton
                key={i}
                index={i}
                label={o}
                onClick={() => submit(i)}
                state={selected === i ? 'selected' : 'default'}
              />
            ))}
          </div>
        </>
      )}

      {phase === 'answered' && question && (
        <>
          <Card className="mb-4">
            <CardContent className="p-8 text-center">
              <Icon
                name="check_circle"
                filled
                className="text-4xl text-emerald-500"
              />
              <p className="mt-2 font-display text-headline-md text-on-surface">
                Answer locked in
              </p>
              <p className="text-body-md text-on-surface-variant">
                Waiting for the others…
              </p>
            </CardContent>
          </Card>
          <TimerBar startedAt={startedAt} durationMs={question.timeLimit * 1000} />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {question.options.map((o, i) => (
              <AnswerButton
                key={i}
                index={i}
                label={o}
                disabled
                state={selected === i ? 'selected' : 'default'}
              />
            ))}
          </div>
        </>
      )}

      {phase === 'result' && result && question && (
        <Card>
          <CardContent className="p-10 text-center">
            <div
              className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                result.correct
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              <Icon
                name={result.correct ? 'celebration' : 'sentiment_dissatisfied'}
                filled
                className="text-4xl"
              />
            </div>
            <h2
              className={`font-display text-headline-lg ${
                result.correct ? 'text-emerald-600' : 'text-destructive'
              }`}
            >
              {result.correct ? 'Correct!' : 'Not quite.'}
            </h2>
            <p className="mt-2 text-body-lg text-on-surface-variant">
              +{result.points} points · total{' '}
              <span className="font-bold text-primary">
                {result.totalScore.toLocaleString()}
              </span>
            </p>
            <p className="mt-3 text-body-md text-on-surface-variant">
              Correct answer: {question.options[result.correctAnswer]}
            </p>
          </CardContent>
        </Card>
      )}

      {phase === 'ended' && (
        <Leaderboard rows={leaderboard} title="Final results" />
      )}
    </AppShell>
  );
}
