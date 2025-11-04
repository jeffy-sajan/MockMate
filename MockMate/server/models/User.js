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
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  pinnedQuestions: [pinnedQuestionSchema],
  goals: [goalSchema],
  // Profile fields
  profile: {
    preferredJobRole: { type: String, default: "" },
    experienceLevel: { 
      type: String, 
      enum: ["Entry Level", "Mid Level", "Senior Level", "Executive"], 
      default: "Entry Level" 
    },
    focusAreas: [{ type: String }], // Array of focus areas like ["Frontend", "Backend", "Full Stack"]
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    phone: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    portfolioUrl: { type: String, default: "" },
    skills: [{ type: String }], // Array of technical skills
    yearsOfExperience: { type: Number, min: 0, max: 50, default: 0 },
    currentCompany: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    availability: { 
      type: String, 
      enum: ["Available", "Not Available", "Open to Opportunities"], 
      default: "Open to Opportunities" 
    },
    lastUpdated: { type: Date, default: Date.now }
  }
});

module.exports = mongoose.model('User', userSchema);
