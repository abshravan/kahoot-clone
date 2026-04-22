'use client';

import { Icon } from '@/components/Icon';
import { cn } from '@/lib/utils';

type Tile = {
  bg: string;
  shadow: string;
  icon: string;
  iconRotate?: string;
};

const TILES: Tile[] = [
  {
    bg: 'bg-answer-red',
    shadow: 'shadow-[0_8px_0_0_#CC2944] hover:shadow-[0_6px_0_0_#CC2944]',
    icon: 'change_history',
  },
  {
    bg: 'bg-answer-blue',
    shadow: 'shadow-[0_8px_0_0_#0033B3] hover:shadow-[0_6px_0_0_#0033B3]',
    icon: 'square',
    iconRotate: 'rotate-45',
  },
  {
    bg: 'bg-answer-yellow',
    shadow: 'shadow-[0_8px_0_0_#CC9900] hover:shadow-[0_6px_0_0_#CC9900]',
    icon: 'circle',
  },
  {
    bg: 'bg-answer-green',
    shadow: 'shadow-[0_8px_0_0_#0DA352] hover:shadow-[0_6px_0_0_#0DA352]',
    icon: 'square',
  },
];

export function AnswerButton({
  index,
  label,
  onClick,
  disabled,
  state,
}: {
  index: number;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  state?: 'default' | 'selected' | 'correct' | 'wrong';
}) {
  const tile = TILES[index] ?? TILES[0];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative group flex min-h-[110px] w-full items-center gap-5 rounded-3xl border-2 border-white/20 p-5 text-left text-headline-md font-bold text-white transition-all',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
        'active:translate-y-2 active:shadow-none',
        tile.bg,
        tile.shadow,
        state === 'selected' && 'ring-4 ring-white',
        state === 'correct' &&
          'ring-4 ring-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,0.4)]',
        state === 'wrong' && 'opacity-50 grayscale',
        disabled && 'cursor-not-allowed active:translate-y-0'
      )}
    >
      <span className="textured-overlay absolute inset-0 rounded-3xl opacity-25" />
      <span className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 transition-transform group-hover:scale-110">
        <Icon
          name={tile.icon}
          filled
          className={cn('text-3xl', tile.iconRotate)}
        />
      </span>
      <span className="z-10 flex-1">{label}</span>
    </button>
  );
}
