'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';

export function JoinForm() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.get(`/api/games/${pin}`);
      const encodedName = encodeURIComponent(name.trim());
      router.push(`/game/${pin}/player?name=${encodedName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join a game</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="join-pin">Game PIN</Label>
            <Input
              id="join-pin"
              className="text-center font-mono text-2xl tracking-widest h-14"
              placeholder="000000"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="join-name">Your name</Label>
            <Input
              id="join-name"
              placeholder="e.g. Alice"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 24))}
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Joining…' : 'Enter'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
