'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type DraftQuestion = Omit<Question, '_id'>;

const BLANK: DraftQuestion = {
  questionText: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  timeLimit: 20,
};

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
    <main className="flex flex-1 flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">Create quiz</h1>
      </header>

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
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
              <CardTitle>Question {qi + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeQuestion(qi)}
                disabled={questions.length === 1}
              >
                <X className="mr-1 h-4 w-4" />
                Remove
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`q-${qi}-text`}>Question</Label>
                <Input
                  id={`q-${qi}-text`}
                  placeholder="Question text"
                  value={q.questionText}
                  onChange={(e) =>
                    updateQuestion(qi, { questionText: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Options — pick the correct answer</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {q.options.map((o, oi) => (
                    <label
                      key={oi}
                      className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2"
                    >
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        className="h-4 w-4 accent-primary"
                        checked={q.correctAnswer === oi}
                        onChange={() => updateQuestion(qi, { correctAnswer: oi })}
                      />
                      <Input
                        className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder={`Option ${oi + 1}`}
                        value={o}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        required
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`q-${qi}-time`}>Timer (seconds)</Label>
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
          <Button type="button" variant="secondary" onClick={addQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            Add question
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save quiz'}
          </Button>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </main>
  );
}
