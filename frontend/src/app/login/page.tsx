'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { useAuth, type AuthUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState('teacher@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<{ token: string; user: AuthUser }>(
        '/api/auth/login',
        { email, password }
      );
      setAuth(data.token, data.user);
      router.push('/host');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="flex flex-1 items-center justify-center py-12">
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-3xl border-4 border-surface-container-highest bg-white p-8 shadow-[0_12px_0_0_#e2e0fc]"
        >
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2 font-label text-label-bold uppercase tracking-widest text-on-surface-variant">
              <Icon name="login" className="text-base text-primary" />
              Host login
            </div>
            <h1 className="font-display text-headline-lg text-on-surface">
              Welcome back
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Sign in to create and run quizzes.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" variant="tactile" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-center text-body-md text-on-surface-variant">
              No account?{' '}
              <Link href="/register" className="font-bold text-primary hover:underline">
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
