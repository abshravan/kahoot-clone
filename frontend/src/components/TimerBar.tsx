'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

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
    <div className="flex items-center gap-3">
      <Progress value={pct} className="flex-1" />
      <span className="w-10 text-right font-mono text-lg tabular-nums">
        {Math.ceil(remaining / 1000)}s
      </span>
    </div>
  );
}
