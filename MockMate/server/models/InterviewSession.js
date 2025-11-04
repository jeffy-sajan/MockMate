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

const feedbackSchema = new mongoose.Schema({
  overallScore: { type: Number, min: 0, max: 100 },
  overallAssessment: { type: String },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  questionAnalysis: [{
    questionNumber: { type: Number },
    question: { type: String },
    answer: { type: String },
    score: { type: Number, min: 0, max: 100 },
    assessment: { type: String },
    strengths: [{ type: String }],
    improvements: [{ type: String }]
  }],
  recommendations: [{ type: String }],
  nextSteps: [{ type: String }]
}, { _id: false });

const interviewSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String },
  description: { type: String },
  answers: [answerSchema],
  feedback: feedbackSchema,
  metrics: metricsSchema,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);


