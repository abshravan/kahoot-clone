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

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<{ token: string; user: AuthUser }>(
        '/api/auth/register',
        { email, password, name }
      );
      setAuth(data.token, data.user);
      router.push('/host');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
              <Icon name="person_add" className="text-base text-secondary" />
              Create an account
            </div>
            <h1 className="font-display text-headline-lg text-on-surface">
              Let&apos;s get hosting
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Takes about ten seconds.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
              <Label htmlFor="password">Password (min 6)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              variant="tactile-secondary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating…' : 'Register'}
            </Button>
            <p className="text-center text-body-md text-on-surface-variant">
              Have an account?{' '}
              <Link href="/login" className="font-bold text-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
