'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';

export function TimerBar({
  startedAt,
  durationMs,
  onComplete,
}: {
  startedAt: number;
  durationMs: number;
  onComplete?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, now - startedAt);
  const remaining = Math.max(0, durationMs - elapsed);
  const pct = Math.max(0, Math.min(100, (remaining / durationMs) * 100));

  useEffect(() => {
    if (remaining === 0) onComplete?.();
  }, [remaining, onComplete]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5 font-label text-headline-md text-tertiary">
        <Icon name="timer" filled />
        <span className="tabular-nums">{Math.ceil(remaining / 1000)}s</span>
      </div>
      <div className="h-6 flex-1 overflow-hidden rounded-full border-2 border-white bg-surface-container p-1 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-answer-green via-answer-yellow to-answer-red transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
