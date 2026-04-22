import type { LeaderboardRow } from '@/lib/types';

export function Leaderboard({ rows, title = 'Leaderboard' }: { rows: LeaderboardRow[]; title?: string }) {
  return (
    <div className="card">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-slate-400">No scores yet.</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.playerId}
              className="flex items-center justify-between rounded-lg bg-slate-800/70 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 text-right font-mono text-lg text-brand-light">
                  {i + 1}.
                </span>
                <span className="font-medium">{r.name}</span>
              </div>
              <span className="font-mono text-lg">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
