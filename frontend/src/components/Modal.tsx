'use client';

import { useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/utils';

/**
 * Minimal modal. We don't need a full Radix Dialog here — one overlay,
 * one dismiss-on-Escape, one dismiss-on-backdrop. Lockable body scroll
 * while open.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/30 p-4 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-2xl overflow-hidden rounded-3xl border-4 border-primary bg-surface shadow-[0_20px_50px_rgba(0,64,223,0.25)]',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between bg-primary px-6 py-5 text-white">
            <h2 className="font-display text-headline-md">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30 active:scale-90"
            >
              <Icon name="close" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
