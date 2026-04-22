import { Icon } from '@/components/Icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LeaderboardRow } from '@/lib/types';
import { cn } from '@/lib/utils';

export function Leaderboard({
  rows,
  title = 'Leaderboard',
  showPodium = true,
}: {
  rows: LeaderboardRow[];
  title?: string;
  showPodium?: boolean;
}) {
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="trophy" filled className="text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-on-surface-variant">No scores yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-8">
      <h2 className="flex items-center justify-center gap-2 font-display text-headline-lg text-on-surface">
        <Icon name="trophy" filled className="text-tertiary" />
        {title}
      </h2>

      {showPodium && podium.length > 0 && <Podium rows={podium} />}

      {rest.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4">
            {rest.map((r, i) => (
              <div
                key={r.playerId}
                className="flex items-center gap-3 rounded-xl border-2 border-slate-100 bg-white p-3"
              >
                <span className="w-6 text-right font-label text-label-bold text-slate-400">
                  {i + 4}
                </span>
                <span className="flex-1 truncate font-label text-on-surface">
                  {r.name}
                </span>
                <span className="font-display text-body-lg text-primary tabular-nums">
                  {r.score.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function Podium({ rows }: { rows: LeaderboardRow[] }) {
  // rows is already sorted desc by score. Arrange visually as [2nd, 1st, 3rd].
  const first = rows[0];
  const second = rows[1];
  const third = rows[2];

  return (
    <div className="grid items-end gap-4 md:grid-cols-3">
      <div className="order-2 md:order-1">
        {second && (
          <PodiumCard
            row={second}
            rank={2}
            accent="slate"
            heights="h-40"
            avatarSize="h-20 w-20"
          />
        )}
      </div>
      <div className="order-1 md:order-2 md:-translate-y-6">
        {first && (
          <PodiumCard
            row={first}
            rank={1}
            accent="gold"
            heights="h-56"
            avatarSize="h-28 w-28"
            showCrown
          />
        )}
      </div>
      <div className="order-3">
        {third && (
          <PodiumCard
            row={third}
            rank={3}
            accent="bronze"
            heights="h-32"
            avatarSize="h-20 w-20"
          />
        )}
      </div>
    </div>
  );
}

function PodiumCard({
  row,
  rank,
  accent,
  heights,
  avatarSize,
  showCrown,
}: {
  row: LeaderboardRow;
  rank: number;
  accent: 'gold' | 'slate' | 'bronze';
  heights: string;
  avatarSize: string;
  showCrown?: boolean;
}) {
  const theme =
    accent === 'gold'
      ? {
          ring: 'border-tertiary',
          badge: 'bg-tertiary text-white',
          podium: 'bg-tertiary-fixed',
          shadow: 'shadow-[0_12px_0_0_#e9c400]',
          number: 'text-tertiary/30',
        }
      : accent === 'slate'
        ? {
            ring: 'border-slate-300',
            badge: 'bg-slate-400 text-white',
            podium: 'bg-slate-200',
            shadow: 'shadow-[0_12px_0_0_#94a3b8]',
            number: 'text-slate-400/40',
          }
        : {
            ring: 'border-[#c98256]',
            badge: 'bg-[#c98256] text-white',
            podium: 'bg-orange-100',
            shadow: 'shadow-[0_12px_0_0_#fed7aa]',
            number: 'text-orange-300/40',
          };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div
          className={cn(
            avatarSize,
            'flex items-center justify-center rounded-full border-4 bg-primary-fixed font-display text-headline-lg text-primary shadow-xl',
            theme.ring
          )}
        >
          {row.name.charAt(0).toUpperCase()}
        </div>
        <span
          className={cn(
            'absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white font-label text-label-bold',
            theme.badge
          )}
        >
          {rank}
        </span>
        {showCrown && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce">
            <Icon
              name="workspace_premium"
              filled
              className="text-4xl text-tertiary"
            />
          </span>
        )}
      </div>
      <div className="text-center">
        <p className="font-display text-headline-md text-on-surface">{row.name}</p>
        <p className="font-label text-label-bold text-primary tabular-nums">
          {row.score.toLocaleString()} pts
        </p>
      </div>
      <div
        className={cn(
          'flex w-full items-center justify-center rounded-t-3xl',
          heights,
          theme.podium,
          theme.shadow
        )}
      >
        <span className={cn('font-display text-[56px] font-black', theme.number)}>
          {rank}
        </span>
      </div>
    </div>
  );
}
