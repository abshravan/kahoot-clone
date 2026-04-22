'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Quiz } from '@/lib/types';

export default function HostDashboard() {
  const router = useRouter();
  const hydrate = useAuth((s) => s.hydrate);
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (token === null && typeof window !== 'undefined') {
      const raw = localStorage.getItem('quizly.auth');
      if (!raw) router.replace('/login');
    }
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ quizzes: Quiz[] }>('/api/quizzes', token)
      .then((data) => setQuizzes(data.quizzes))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [token]);

  async function startGame(quizId: string) {
    if (!token) return;
    setError(null);
    try {
      const { session } = await api.post<{ session: { pin: string } }>(
        '/api/games',
        { quizId },
        token
      );
      router.push(`/game/${session.pin}/host`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start');
    }
  }

  async function deleteQuiz(id: string) {
    if (!token) return;
    if (!confirm('Delete this quiz?')) return;
    await api.delete(`/api/quizzes/${id}`, token);
    setQuizzes((q) => q.filter((x) => x._id !== id));
  }

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your quizzes</h1>
          {user && <p className="text-slate-400">Signed in as {user.email}</p>}
        </div>
        <div className="flex gap-2">
          <Link href="/quiz/create" className="btn-primary">
            + New quiz
          </Link>
          <button
            className="btn-secondary"
            onClick={() => {
              clear();
              router.push('/');
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {error && <p className="text-red-400">{error}</p>}

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : quizzes.length === 0 ? (
        <div className="card text-center">
          <p className="text-slate-400">You don&apos;t have any quizzes yet.</p>
          <Link href="/quiz/create" className="btn-primary mt-4 inline-flex">
            Create your first quiz
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {quizzes.map((q) => (
            <li key={q._id} className="card flex flex-col gap-3">
              <div>
                <h2 className="text-xl font-semibold">{q.title}</h2>
                <p className="text-sm text-slate-400">
                  {q.questions.length} question{q.questions.length === 1 ? '' : 's'}
                </p>
                {q.description && (
                  <p className="mt-1 text-slate-300">{q.description}</p>
                )}
              </div>
              <div className="mt-auto flex gap-2">
                <button className="btn-primary flex-1" onClick={() => startGame(q._id)}>
                  Start game
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => deleteQuiz(q._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
