const express = require('express');
const { z } = require('zod');
const Quiz = require('../models/Quiz');
const GameSession = require('../models/GameSession');
const { requireAuth } = require('../middleware/auth');
const { generateUniquePin } = require('../utils/pin');

const router = express.Router();

const createSchema = z.object({ quizId: z.string().min(1) });

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { quizId } = createSchema.parse(req.body);
    const quiz = await Quiz.findOne({ _id: quizId, hostId: req.user.id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (!quiz.questions.length) {
      return res.status(400).json({ error: 'Quiz must contain at least one question' });
    }
    const pin = await generateUniquePin();
    const session = await GameSession.create({
      pin,
      hostId: req.user.id,
      quizId: quiz._id,
      players: [],
      scores: {},
      currentQuestionIndex: -1,
      status: 'waiting',
    });
    res.status(201).json({
      session: {
        id: session._id,
        pin: session.pin,
        status: session.status,
        quizId: session.quizId,
      },
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get('/:pin', async (req, res, next) => {
  try {
    const session = await GameSession.findOne({ pin: req.params.pin });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({
      session: {
        pin: session.pin,
        status: session.status,
        players: session.players.map((p) => ({ id: p.id, name: p.name })),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
