import type { ReactNode } from 'react';
import { TopAppBar } from './TopAppBar';
import { cn } from '@/lib/utils';

export function AppShell({
  children,
  pin,
  className,
}: {
  children: ReactNode;
  pin?: string;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopAppBar pin={pin} />
      <main className={cn('mx-auto w-full max-w-7xl flex-1 px-6 py-8', className)}>
        {children}
      </main>
    </div>
  );
}
