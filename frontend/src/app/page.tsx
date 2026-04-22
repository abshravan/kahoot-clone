import Link from 'next/link';
import { JoinForm } from '@/components/JoinForm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12">
      <section className="text-center">
        <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
          <span className="bg-gradient-to-r from-primary to-fuchsia-400 bg-clip-text text-transparent">
            Quizly
          </span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Real-time quizzes. No downloads. Just a PIN.
        </p>
      </section>

      <section className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <JoinForm />
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Host a game</CardTitle>
            <CardDescription>
              Sign in to create quizzes and launch live sessions for your class
              or team.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1" />
          <CardFooter className="flex gap-3">
            <Button asChild className="flex-1">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="secondary" className="flex-1">
              <Link href="/register">Sign up</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
