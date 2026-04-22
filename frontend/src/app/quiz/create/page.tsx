'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type DraftQuestion = Omit<Question, '_id'>;

const BLANK: DraftQuestion = {
  questionText: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  timeLimit: 20,
};

const ANSWER_TILES = [
  { bg: 'bg-answer-red', shadow: 'shadow-[0_4px_0_0_#CC2944]', icon: 'change_history' },
  { bg: 'bg-answer-blue', shadow: 'shadow-[0_4px_0_0_#0033B3]', icon: 'square' },
  { bg: 'bg-answer-yellow', shadow: 'shadow-[0_4px_0_0_#CC9900]', icon: 'circle' },
  { bg: 'bg-answer-green', shadow: 'shadow-[0_4px_0_0_#0DA352]', icon: 'square' },
];

export default function CreateQuizPage() {
  const router = useRouter();
  const hydrate = useAuth((s) => s.hydrate);
  const token = useAuth((s) => s.token);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    { ...BLANK, options: ['', '', '', ''] },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  function updateQuestion(i: number, patch: Partial<DraftQuestion>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function updateOption(qi: number, oi: number, val: string) {
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === qi
          ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) }
          : q
      )
    );
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, { ...BLANK, options: ['', '', '', ''] }]);
  }

  function removeQuestion(i: number) {
    setQuestions((qs) => (qs.length === 1 ? qs : qs.filter((_, idx) => idx !== i)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      router.push('/login');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/quizzes', { title, description, questions }, token);
      router.push('/host');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <form onSubmit={submit} className="space-y-8">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-display-xl text-on-surface">
              Create quiz
            </h1>
            <p className="text-body-lg text-on-surface-variant">
              Build a question deck. Players will see the shapes; you control
              the correct answer.
            </p>
          </div>
          <Button type="submit" variant="tactile" size="lg" disabled={saving}>
            <Icon name="save" />
            {saving ? 'Saving…' : 'Save quiz'}
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="description" className="text-primary" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Quiz title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What is this quiz about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {questions.map((q, qi) => (
          <Card key={qi}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {qi + 1}
                </span>
                Question {qi + 1}
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeQuestion(qi)}
                disabled={questions.length === 1}
              >
                <Icon name="delete" className="text-base" />
                Remove
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor={`q-${qi}-text`}>Question text</Label>
                <Textarea
                  id={`q-${qi}-text`}
                  placeholder="Start typing your question…"
                  value={q.questionText}
                  onChange={(e) =>
                    updateQuestion(qi, { questionText: e.target.value })
                  }
                  required
                  rows={2}
                  className="text-body-lg"
                />
              </div>

              <div className="space-y-3">
                <Label>Answers — click the circle to mark the correct one</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {q.options.map((o, oi) => {
                    const tile = ANSWER_TILES[oi];
                    const isCorrect = q.correctAnswer === oi;
                    return (
                      <div
                        key={oi}
                        className={cn(
                          'relative flex items-center gap-3 rounded-2xl border-2 border-white/20 p-3 pr-14 transition-all',
                          tile.bg,
                          tile.shadow
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white',
                            oi === 1 && 'rotate-45'
                          )}
                        >
                          <Icon
                            name={tile.icon}
                            filled
                            className={cn(oi === 1 && '-rotate-45')}
                          />
                        </span>
                        <input
                          className="h-12 flex-1 rounded-lg border-0 bg-white/90 px-3 font-semibold text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-white"
                          placeholder={`Answer ${oi + 1}`}
                          value={o}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => updateQuestion(qi, { correctAnswer: oi })}
                          aria-label={`Mark answer ${oi + 1} as correct`}
                          className={cn(
                            'absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-colors',
                            isCorrect
                              ? 'border-white bg-white text-emerald-600'
                              : 'border-white/60 text-white hover:bg-white/20'
                          )}
                        >
                          <Icon
                            name={isCorrect ? 'check_circle' : 'radio_button_unchecked'}
                            filled={isCorrect}
                            className="text-lg"
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`q-${qi}-time`} className="flex items-center gap-2">
                  <Icon name="timer" className="text-base text-tertiary" />
                  Timer (seconds)
                </Label>
                <Input
                  id={`q-${qi}-time`}
                  type="number"
                  min={5}
                  max={120}
                  className="w-28"
                  value={q.timeLimit}
                  onChange={(e) =>
                    updateQuestion(qi, { timeLimit: Number(e.target.value) })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex items-center justify-between">
          <Button type="button" variant="tactile-outline" onClick={addQuestion}>
            <Icon name="add_circle" />
            Add question
          </Button>
          <Button type="submit" variant="tactile" size="lg" disabled={saving}>
            <Icon name="save" />
            {saving ? 'Saving…' : 'Save quiz'}
          </Button>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </AppShell>
  );
}
