const express = require('express');
const { z } = require('zod');
const Quiz = require('../models/Quiz');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const questionSchema = z.object({
  questionText: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).length(4),
  correctAnswer: z.number().int().min(0).max(3),
  timeLimit: z.number().int().min(5).max(120).default(20),
});

const quizSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional().default(''),
  questions: z.array(questionSchema).min(1),
});

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ hostId: req.user.id }).sort({ updatedAt: -1 });
    res.json({ quizzes });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = quizSchema.parse(req.body);
    const quiz = await Quiz.create({ ...data, hostId: req.user.id });
    res.status(201).json({ quiz });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, hostId: req.user.id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ quiz });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = quizSchema.parse(req.body);
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, hostId: req.user.id },
      data,
      { new: true }
    );
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ quiz });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await Quiz.findOneAndDelete({
      _id: req.params.id,
      hostId: req.user.id,
    });
    if (!result) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
