const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  durationSeconds: { type: Number, default: 0 },
  confidenceScore: { type: Number, min: 0, max: 1 },
  topics: [{ type: String }],
});

const metricsSchema = new mongoose.Schema({
  totalQuestions: { type: Number, required: true },
  avgAnswerTimeSec: { type: Number, required: true },
  overallConfidence: { type: Number },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
});

const interviewSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String },
  description: { type: String },
  answers: [answerSchema],
  feedback: { type: String },
  metrics: metricsSchema,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);


