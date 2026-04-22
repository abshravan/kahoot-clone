'use client';

import clsx from './clsx';

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
  const baseColor = COLORS[index] ?? 'bg-slate-700';
  const stateCls =
    state === 'selected'
      ? 'ring-4 ring-white'
      : state === 'correct'
        ? 'outline outline-4 outline-emerald-300'
        : state === 'wrong'
          ? 'opacity-50 grayscale'
          : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex min-h-[110px] w-full items-center gap-4 rounded-2xl p-5 text-left text-lg font-semibold text-white shadow-lg transition',
        baseColor,
        stateCls,
        disabled && 'cursor-not-allowed'
      )}
    >
      <span className="text-3xl">{SHAPES[index]}</span>
      <span className="flex-1">{label}</span>
    </button>
  );
}
