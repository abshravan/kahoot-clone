import { cn } from '@/lib/utils';

export function Icon({
  name,
  filled,
  className,
  ...props
}: {
  name: string;
  filled?: boolean;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>) {
  return (
    <span
      aria-hidden
      className={cn(
        'material-symbols-outlined select-none leading-none',
        filled && 'filled',
        className
      )}
      {...props}
    >
      {name}
    </span>
  );
}
