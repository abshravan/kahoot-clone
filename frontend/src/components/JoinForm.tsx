'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="text-xl font-bold">Join a game</h2>
      <input
        className="input text-center font-mono text-2xl tracking-widest"
        placeholder="PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
        maxLength={6}
        inputMode="numeric"
        required
      />
      <input
        className="input"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 24))}
        required
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button className="btn-primary w-full text-lg" disabled={loading}>
        {loading ? 'Joining…' : 'Enter'}
      </button>
    </form>
  );
}
