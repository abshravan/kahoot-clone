import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white hover:bg-primary-dark',
        tactile:
          'bg-primary text-white rounded-2xl shadow-[0_4px_0_0_#0035bd] hover:translate-y-[1px] hover:shadow-[0_3px_0_0_#0035bd] active:translate-y-[4px] active:shadow-none',
        'tactile-secondary':
          'bg-secondary text-white rounded-2xl shadow-[0_4px_0_0_#87006b] hover:translate-y-[1px] hover:shadow-[0_3px_0_0_#87006b] active:translate-y-[4px] active:shadow-none',
        'tactile-outline':
          'bg-white text-on-surface border-2 border-slate-200 rounded-2xl shadow-[0_4px_0_0_#e2e8f0] hover:translate-y-[1px] hover:shadow-[0_3px_0_0_#e2e8f0] active:translate-y-[4px] active:shadow-none',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border-2 border-slate-200 bg-white text-on-surface hover:bg-surface-container',
        secondary:
          'bg-surface-container text-on-surface hover:bg-surface-container-high',
        ghost: 'text-on-surface-variant hover:bg-surface-container',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        xl: 'h-16 px-10 text-headline-md',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
