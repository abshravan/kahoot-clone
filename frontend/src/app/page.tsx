import Link from 'next/link';
import { JoinForm } from '@/components/JoinForm';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12">
      <section className="text-center">
        <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
          <span className="bg-gradient-to-r from-brand-light to-fuchsia-400 bg-clip-text text-transparent">
            Quizly
          </span>
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Real-time quizzes. No downloads. Just a PIN.
        </p>
      </section>

      <section className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <JoinForm />
        <div className="card flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold">Host a game</h2>
            <p className="mt-2 text-slate-400">
              Sign in to create quizzes and launch live sessions for your class
              or team.
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <Link href="/login" className="btn-primary flex-1 text-center">
              Login
            </Link>
            <Link href="/register" className="btn-secondary flex-1 text-center">
              Sign up
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
