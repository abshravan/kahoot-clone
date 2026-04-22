import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold font-label transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-white',
        secondary:
          'border-transparent bg-surface-container-high text-primary',
        tertiary:
          'border-transparent bg-tertiary/10 text-tertiary border-2 border-tertiary/20',
        magenta:
          'border-transparent bg-secondary/10 text-secondary border-2 border-secondary/20',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'border-2 border-slate-200 text-on-surface bg-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
