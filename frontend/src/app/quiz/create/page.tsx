'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Question } from '@/lib/types';

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
  const [questions, setQuestions] = useState<DraftQuestion[]>([{ ...BLANK, options: ['', '', '', ''] }]);
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
      await api.post(
        '/api/quizzes',
        { title, description, questions },
        token
      );
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
        <div className="card space-y-3">
          <input
            className="input text-lg"
            placeholder="Quiz title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="input"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Question {qi + 1}</h2>
              <button
                type="button"
                className="text-sm text-red-400 hover:underline"
                onClick={() => removeQuestion(qi)}
                disabled={questions.length === 1}
              >
                Remove
              </button>
            </div>
            <input
              className="input"
              placeholder="Question text"
              value={q.questionText}
              onChange={(e) => updateQuestion(qi, { questionText: e.target.value })}
              required
            />
            <div className="grid gap-2 md:grid-cols-2">
              {q.options.map((o, oi) => (
                <label key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correctAnswer === oi}
                    onChange={() => updateQuestion(qi, { correctAnswer: oi })}
                  />
                  <input
                    className="input"
                    placeholder={`Option ${oi + 1}`}
                    value={o}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    required
                  />
                </label>
              ))}
            </div>
            <label className="flex items-center gap-3 text-sm">
              Timer (seconds)
              <input
                type="number"
                min={5}
                max={120}
                className="input w-24"
                value={q.timeLimit}
                onChange={(e) => updateQuestion(qi, { timeLimit: Number(e.target.value) })}
              />
            </label>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <button type="button" className="btn-secondary" onClick={addQuestion}>
            + Add question
          </button>
          <button className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save quiz'}
          </button>
        </div>
        {error && <p className="text-red-400">{error}</p>}
      </form>
    </main>
  );
}
