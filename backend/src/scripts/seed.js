/**
 * Seed script: creates a demo host and a sample quiz so you can try the
 * platform immediately.
 *
 *   Host email:    teacher@example.com
 *   Host password: password123
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Quiz = require('../models/Quiz');

const SAMPLE_QUIZ = {
  title: 'General Knowledge Starter',
  description: 'A quick 5-question sample quiz.',
  questions: [
    {
      questionText: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 2,
      timeLimit: 15,
    },
    {
      questionText: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 1,
      timeLimit: 15,
    },
    {
      questionText: 'What is 9 x 7?',
      options: ['56', '63', '72', '81'],
      correctAnswer: 1,
      timeLimit: 10,
    },
    {
      questionText: 'Who wrote "Hamlet"?',
      options: ['Dickens', 'Shakespeare', 'Austen', 'Twain'],
      correctAnswer: 1,
      timeLimit: 15,
    },
    {
      questionText: 'Which language is this platform written in?',
      options: ['Python', 'Rust', 'JavaScript', 'Go'],
      correctAnswer: 2,
      timeLimit: 10,
    },
  ],
};

async function main() {
  await mongoose.connect(env.MONGO_URI);
  console.log('[seed] connected');

  let user = await User.findOne({ email: 'teacher@example.com' });
  if (!user) {
    user = await User.create({
      email: 'teacher@example.com',
      password: 'password123',
      name: 'Demo Teacher',
    });
    console.log('[seed] created demo host');
  } else {
    console.log('[seed] demo host already exists');
  }

  const existing = await Quiz.findOne({ hostId: user._id, title: SAMPLE_QUIZ.title });
  if (!existing) {
    await Quiz.create({ ...SAMPLE_QUIZ, hostId: user._id });
    console.log('[seed] created sample quiz');
  } else {
    console.log('[seed] sample quiz already exists');
  }

  await mongoose.disconnect();
  console.log('[seed] done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
