'use client';

import { cn } from '@/lib/utils';

const COLORS = [
  'bg-answer-red hover:brightness-110',
  'bg-answer-blue hover:brightness-110',
  'bg-answer-yellow hover:brightness-110',
  'bg-answer-green hover:brightness-110',
];

const SHAPES = ['▲', '◆', '●', '■'];

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
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex min-h-[110px] w-full items-center gap-4 rounded-xl p-5 text-left text-lg font-semibold text-white shadow-lg transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        COLORS[index] ?? 'bg-secondary',
        state === 'selected' && 'ring-4 ring-white',
        state === 'correct' && 'outline outline-4 outline-emerald-300',
        state === 'wrong' && 'opacity-50 grayscale',
        disabled && 'cursor-not-allowed'
      )}
    >
      <span className="text-3xl" aria-hidden>
        {SHAPES[index]}
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
}
