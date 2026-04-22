export type Question = {
  _id?: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
};

export type Quiz = {
  _id: string;
  title: string;
  description?: string;
  questions: Question[];
};

export type PublicQuestion = {
  id: string;
  questionText: string;
  options: string[];
  timeLimit: number;
};

export type LeaderboardRow = { playerId: string; name: string; score: number };

export type Player = { id: string; name: string };
