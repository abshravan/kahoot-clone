import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Quizly — Real-time Quiz Platform',
  description: 'A Kahoot-style real-time quiz platform.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
