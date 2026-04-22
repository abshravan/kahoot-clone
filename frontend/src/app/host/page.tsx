'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Quiz } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const CARD_TONES = [
  { tint: 'bg-primary-fixed', accent: 'text-primary', shadow: 'shadow-[0_20px_40px_-12px_rgba(45,91,255,0.15)]' },
  { tint: 'bg-secondary-fixed', accent: 'text-secondary', shadow: 'shadow-[0_20px_40px_-12px_rgba(173,0,137,0.15)]' },
  { tint: 'bg-tertiary-fixed', accent: 'text-tertiary', shadow: 'shadow-[0_20px_40px_-12px_rgba(112,93,0,0.15)]' },
] as const;

export default function HostDashboard() {
  const router = useRouter();
  const hydrate = useAuth((s) => s.hydrate);
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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

  const filtered = search
    ? quizzes.filter((q) =>
        q.title.toLowerCase().includes(search.toLowerCase())
      )
    : quizzes;

  return (
    <AppShell>
      <section className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-display-xl text-on-surface">
            My Quizzes
          </h1>
          <p className="mt-2 max-w-xl font-body-lg text-on-surface-variant">
            Manage your library of high-energy learning sessions.
            {user && <> Signed in as <span className="font-bold">{user.email}</span>.</>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-64 rounded-2xl border-2 border-slate-200 bg-white pl-12 pr-4 text-body-md outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="Search your quizzes…"
            />
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
          <Button asChild variant="tactile">
            <Link href="/quiz/create">
              <Icon name="add" />
              New quiz
            </Link>
          </Button>
        </div>
      </section>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/quiz/create"
            className="group flex flex-col items-center justify-center rounded-3xl border-4 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed transition-transform group-hover:scale-110">
              <Icon name="add" className="text-4xl text-primary" />
            </div>
            <span className="font-display text-headline-md text-on-surface">
              New Session
            </span>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Start building a new <br /> interactive experience
            </p>
          </Link>

          {filtered.map((q, i) => {
            const tone = CARD_TONES[i % CARD_TONES.length];
            return (
              <article
                key={q._id}
                className={`group flex flex-col overflow-hidden rounded-3xl border-2 border-slate-100 bg-white transition-all hover:-translate-y-1 ${tone.shadow}`}
              >
                <div
                  className={`relative flex h-40 items-center justify-center overflow-hidden ${tone.tint}`}
                >
                  <Icon
                    name="quiz"
                    filled
                    className={`text-7xl opacity-50 transition-transform group-hover:scale-110 ${tone.accent}`}
                  />
                  <div className="absolute bottom-3 right-3">
                    <Badge variant="outline" className="shadow-sm">
                      <Icon name="quiz" className="text-sm" />
                      {q.questions.length} question
                      {q.questions.length === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-headline-md text-on-surface line-clamp-1">
                    {q.title}
                  </h3>
                  {q.description && (
                    <p className="mt-1 text-body-md text-on-surface-variant line-clamp-2">
                      {q.description}
                    </p>
                  )}
                  <div className="mt-auto flex gap-3 pt-6">
                    <Button
                      variant="tactile"
                      className="flex-1"
                      onClick={() => startGame(q._id)}
                    >
                      <Icon name="play_arrow" filled />
                      Play
                    </Button>
                    <Button
                      variant="tactile-outline"
                      size="icon"
                      aria-label="Delete quiz"
                      onClick={() => deleteQuiz(q._id)}
                    >
                      <Icon name="delete" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}

          {filtered.length === 0 && quizzes.length > 0 && (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <p className="text-on-surface-variant">
                No quizzes match “{search}”.
              </p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
