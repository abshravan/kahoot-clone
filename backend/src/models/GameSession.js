const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    socketId: { type: String, default: '' },
  },
  { _id: false }
);

const gameSessionSchema = new mongoose.Schema(
  {
    pin: { type: String, required: true, unique: true, index: true },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    players: { type: [playerSchema], default: [] },
    scores: { type: Map, of: Number, default: {} },
    currentQuestionIndex: { type: Number, default: -1 },
    status: {
      type: String,
      enum: ['waiting', 'live', 'ended'],
      default: 'waiting',
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameSession', gameSessionSchema);
