'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, LogOut, Play, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Quiz } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

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
          {user && (
            <p className="text-sm text-muted-foreground">
              Signed in as {user.email}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/quiz/create">
              <Plus className="mr-2 h-4 w-4" />
              New quiz
            </Link>
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              clear();
              router.push('/');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <p className="text-muted-foreground">
              You don&apos;t have any quizzes yet.
            </p>
            <Button asChild>
              <Link href="/quiz/create">
                <Plus className="mr-2 h-4 w-4" />
                Create your first quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {quizzes.map((q) => (
            <li key={q._id}>
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{q.title}</CardTitle>
                    <Badge variant="secondary">
                      {q.questions.length} question
                      {q.questions.length === 1 ? '' : 's'}
                    </Badge>
                  </div>
                  {q.description && (
                    <CardDescription>{q.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1" />
                <CardFooter className="gap-2">
                  <Button className="flex-1" onClick={() => startGame(q._id)}>
                    <Play className="mr-2 h-4 w-4" />
                    Start game
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => deleteQuiz(q._id)}
                    aria-label="Delete quiz"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
