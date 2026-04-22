'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <form
      onSubmit={submit}
      className="rounded-3xl border-4 border-surface-container-highest bg-white p-8 shadow-[0_12px_0_0_#e2e0fc]"
    >
      <div className="mb-6 flex items-center gap-2 font-label text-label-bold uppercase tracking-widest text-on-surface-variant">
        <Icon name="play_circle" className="text-base text-primary" />
        Join a game
      </div>
      <div className="space-y-4">
        <Input
          className="h-16 text-center font-display text-4xl font-black tracking-[0.3em]"
          placeholder="000000"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          inputMode="numeric"
          required
        />
        <Input
          className="h-12 text-body-md"
          placeholder="Your nickname"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 24))}
          required
        />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          variant="tactile"
          size="lg"
          className="w-full text-body-lg"
          disabled={loading}
        >
          {loading ? 'Joining…' : 'Enter'}
          <Icon name="arrow_forward" />
        </Button>
      </div>
    </form>
  );
}
