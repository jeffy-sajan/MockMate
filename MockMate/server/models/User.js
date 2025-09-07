const mongoose = require('mongoose');

const pinnedQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String },
});

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  targetValue: { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  unit: { type: String, required: true }, // e.g., "sessions", "questions", "confidence"
  deadline: { type: Date },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  pinnedQuestions: [pinnedQuestionSchema],
  goals: [goalSchema],
});

module.exports = mongoose.model('User', userSchema);
