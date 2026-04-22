import { Trophy } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { LeaderboardRow } from '@/lib/types';

export function Leaderboard({
  rows,
  title = 'Leaderboard',
}: {
  rows: LeaderboardRow[];
  title?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Trophy className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground">No scores yet.</p>
        ) : (
          <ol className="space-y-2">
            {rows.map((r, i) => (
              <li
                key={r.playerId}
                className="flex items-center justify-between rounded-lg bg-secondary/60 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 text-right font-mono text-lg text-primary">
                    {i + 1}.
                  </span>
                  <span className="font-medium">{r.name}</span>
                </div>
                <span className="font-mono text-lg tabular-nums">{r.score}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
