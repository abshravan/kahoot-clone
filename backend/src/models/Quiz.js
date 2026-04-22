const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: [
        (arr) => Array.isArray(arr) && arr.length === 4,
        'Exactly 4 options are required',
      ],
      required: true,
    },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    timeLimit: { type: Number, required: true, min: 5, max: 120, default: 20 },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
