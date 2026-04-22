import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { JoinForm } from '@/components/JoinForm';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center gap-12 py-8">
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-primary/20 bg-white px-4 py-1.5 font-label text-label-bold text-primary shadow-sm">
            <Icon name="bolt" filled className="text-base" />
            Real-time quizzes
          </div>
          <h1 className="mt-6 font-display text-display-xl text-on-surface">
            Turn any room into a{' '}
            <span className="text-primary">game show</span>.
          </h1>
          <p className="mt-4 max-w-xl font-body-lg text-body-lg text-on-surface-variant">
            Host quizzes in seconds. Players join from any device with a PIN. No
            downloads, no accounts, just pure chaos.
          </p>
        </section>

        <section className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
          <JoinForm />

          <div className="flex flex-col justify-between rounded-3xl border-4 border-surface-container-highest bg-white p-8 shadow-[0_12px_0_0_#b8c3ff]">
            <div>
              <div className="mb-6 flex items-center gap-2 font-label text-label-bold uppercase tracking-widest text-on-surface-variant">
                <Icon name="stars" filled className="text-base text-secondary" />
                Host a game
              </div>
              <h2 className="font-display text-headline-md text-on-surface">
                Build and run your own quizzes
              </h2>
              <p className="mt-2 text-body-md text-on-surface-variant">
                Create question decks, launch a session, and watch scores update
                live on the big screen.
              </p>
            </div>
            <div className="mt-8 flex gap-3">
              <Button asChild variant="tactile" size="lg" className="flex-1">
                <Link href="/login">
                  <Icon name="login" />
                  Login
                </Link>
              </Button>
              <Button
                asChild
                variant="tactile-outline"
                size="lg"
                className="flex-1"
              >
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
          <Feature icon="bolt" color="primary" title="Fast by design">
            Scores update in real-time over WebSockets.
          </Feature>
          <Feature icon="palette" color="secondary" title="Made to delight">
            Colorful, tactile UI that feels great on any device.
          </Feature>
          <Feature icon="shield" color="tertiary" title="Secure">
            Rate-limited, validated, and ready for a classroom.
          </Feature>
        </section>
      </div>
    </AppShell>
  );
}

function Feature({
  icon,
  color,
  title,
  children,
}: {
  icon: string;
  color: 'primary' | 'secondary' | 'tertiary';
  title: string;
  children: React.ReactNode;
}) {
  const tones = {
    primary: 'bg-primary-fixed text-primary',
    secondary: 'bg-secondary-fixed text-secondary',
    tertiary: 'bg-tertiary-fixed text-tertiary',
  }[color];
  return (
    <div className="rounded-2xl border-2 border-slate-100 bg-white p-6 shadow-sm">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tones}`}
      >
        <Icon name={icon} filled />
      </div>
      <h3 className="font-display text-body-lg text-on-surface">{title}</h3>
      <p className="text-body-md text-on-surface-variant">{children}</p>
    </div>
  );
}
