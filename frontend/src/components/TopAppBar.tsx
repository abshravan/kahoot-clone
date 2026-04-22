'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export function TopAppBar({ pin }: { pin?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrate = useAuth((s) => s.hydrate);
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const active = pathname === href || pathname?.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={cn(
          'font-display font-bold tracking-tight pb-1 transition-transform hover:-translate-y-0.5',
          active
            ? 'text-primary border-b-4 border-primary'
            : 'text-slate-400 hover:text-slate-600'
        )}
      >
        {children}
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b-4 border-slate-100 bg-white px-6 shadow-[0_4px_10px_-2px_rgba(45,91,255,0.2)]">
      <div className="flex items-center gap-8">
        <Link
          href="/"
          className="font-display text-2xl font-black italic tracking-tight text-primary"
        >
          QuizDash
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink href="/">Lobby</NavLink>
          {user && <NavLink href="/host">My Quizzes</NavLink>}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {pin && (
          <div className="hidden items-center gap-2 rounded-full bg-surface-container-high px-4 py-1.5 font-label text-label-bold text-primary shadow-sm sm:flex">
            <Icon name="stars" className="text-base" />
            <span>PIN: {formatPin(pin)}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-on-surface-variant sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => {
                  clear();
                  router.push('/');
                }}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                <Icon name="logout" className="text-base" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white shadow-[0_3px_0_0_#0035bd] transition-all hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#0035bd] active:translate-y-[3px] active:shadow-none"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function formatPin(pin: string) {
  return pin.length === 6 ? `${pin.slice(0, 3)} ${pin.slice(3)}` : pin;
}
