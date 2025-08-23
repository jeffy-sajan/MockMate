const mongoose = require('mongoose');

const pinnedQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  pinnedQuestions: [pinnedQuestionSchema],
});

module.exports = mongoose.model('User', userSchema);
