'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnswerButton } from '@/components/AnswerButton';
import { Leaderboard } from '@/components/Leaderboard';
import { TimerBar } from '@/components/TimerBar';
import { getSocket } from '@/lib/socket';
import type { LeaderboardRow, PublicQuestion } from '@/lib/types';

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

  const [name, setName] = useState(initialName);
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
      <main className="flex flex-1 items-center justify-center">
        <div className="card max-w-md text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-500">Playing as</p>
          <p className="text-lg font-semibold">{name}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500">PIN</p>
          <p className="font-mono">{pin}</p>
        </div>
      </header>

      {phase === 'waiting' && (
        <div className="card text-center">
          <p className="text-lg">You&apos;re in! Waiting for host to start…</p>
        </div>
      )}

      {phase === 'question' && question && (
        <>
          <div className="card">
            <p className="text-xl font-semibold">{question.questionText}</p>
          </div>
          <TimerBar startedAt={startedAt} durationMs={question.timeLimit * 1000} />
          <div className="grid gap-3 md:grid-cols-2">
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
          <div className="card text-center">
            <p className="text-lg">Answer locked in. Waiting for others…</p>
          </div>
          <TimerBar startedAt={startedAt} durationMs={question.timeLimit * 1000} />
          <div className="grid gap-3 md:grid-cols-2">
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
        <div className="card text-center">
          <h2
            className={
              result.correct
                ? 'text-2xl font-bold text-emerald-400'
                : 'text-2xl font-bold text-red-400'
            }
          >
            {result.correct ? 'Correct! 🎉' : 'Not quite.'}
          </h2>
          <p className="mt-2 text-slate-300">
            +{result.points} points · total {result.totalScore}
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Correct answer: {question.options[result.correctAnswer]}
          </p>
        </div>
      )}

      {phase === 'ended' && (
        <Leaderboard rows={leaderboard} title="Final results" />
      )}
    </main>
  );
}
