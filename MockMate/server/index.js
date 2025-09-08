
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');

const User = require('./models/User');
const InterviewSession = require('./models/InterviewSession');
const authenticateToken = require('./middleware');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Atlas connected!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Registration endpoint
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, username, password, confirmPassword } = req.body;
  if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  // Password strength validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ firstName, lastName, email, username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ user: { id: newUser._id, username: newUser.username, email: newUser.email, createdAt: newUser.createdAt } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, email: user.email, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected route example
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route!', user: req.user });
});

// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/questions', authenticateToken, async (req, res) => {
  const { role, description } = req.body;
  if (!role || !description) {
    return res.status(400).json({ error: "Role and description are required" });
  }

  try {
    const prompt = `Generate 5 interview questions and answers for the role of ${role} with the following job description: ${description}. Format the response as a JSON array of objects with 'question' and 'answer' fields. Example format: [{"question": "What is React?", "answer": "React is a JavaScript library..."}]`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the response as JSON
    let questions = [];
    try {
      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, return the raw text
        return res.json({ questions: text });
      }
    } catch (err) {
      // If parsing fails, return the raw text
      return res.json({ questions: text });
    }

    // Save the generated Q&A as a new InterviewSession for the user
    const userId = req.user.userId;
    const answers = questions.map(q => ({ question: q.question, answer: q.answer }));
    const session = new InterviewSession({
      userId,
      role,
      description,
      answers,
      createdAt: new Date()
    });
    await session.save();

    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// --- Learn More (Explanation) API ---
app.post('/api/explanation', authenticateToken, async (req, res) => {
  const { question, answer } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });
  try {
    const prompt = `Provide a detailed, educational explanation for the following interview question: "${question}". 
    
    Give a comprehensive explanation of the concept, technology, or topic being asked about. 
    Do NOT provide feedback on how to answer the question or what the interviewer wants.
    Instead, provide a thorough explanation of the actual subject matter.
    
    If an answer is provided, you may reference it, but focus on explaining the concept itself.`;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();
    res.json({ explanation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// --- Pinning Feature ---
// Add a pinnedQuestions array to the User model if not already present
// Pin a question
app.post('/api/pin', authenticateToken, async (req, res) => {
  const { question, answer } = req.body;
  const userId = req.user.userId;
  if (!question) return res.status(400).json({ error: 'Question is required' });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Prevent duplicate pins
    if (user.pinnedQuestions && user.pinnedQuestions.some(q => q.question === question)) {
      return res.status(409).json({ error: 'Question already pinned' });
    }
    user.pinnedQuestions = user.pinnedQuestions || [];
    user.pinnedQuestions.push({ question, answer });
    await user.save();
    res.json({ message: 'Question pinned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to pin question' });
  }
});

// Unpin a question
app.post('/api/unpin', authenticateToken, async (req, res) => {
  const { question } = req.body;
  const userId = req.user.userId;
  if (!question) return res.status(400).json({ error: 'Question is required' });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.pinnedQuestions = (user.pinnedQuestions || []).filter(q => q.question !== question);
    await user.save();
    res.json({ message: 'Question unpinned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unpin question' });
  }
});

// Get all pinned questions for the logged-in user
app.get('/api/pinned', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ pinnedQuestions: user.pinnedQuestions || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pinned questions' });
  }
});

// --- Mock Interview Feedback API ---
app.post('/api/mock/feedback', authenticateToken, async (req, res) => {
  const { responses } = req.body; // [{ question, answer }, ...]
  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: 'Responses array is required' });
  }
  try {
    const prompt = `You are an expert interview coach. Analyze the following mock interview session. For each question and answer, assess the quality of the answer, point out strengths, and suggest specific areas for improvement. At the end, provide an overall summary of the candidate's performance and actionable advice for future interviews.\n\nSession:\n${responses
      .map((r, i) => `Q${i + 1}: ${r.question}\nA${i + 1}: ${r.answer}`)
      .join('\n')}\n\nFeedback:`;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const feedback = response.text();
    res.json({ feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

// --- Save Mock Interview Session & Compute Metrics ---
app.post('/api/mock/session', authenticateToken, async (req, res) => {
  const { role, description, answers, feedback } = req.body;
  const userId = req.user.userId;
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers array is required' });
  }

  try {
    const totalQuestions = answers.length;
    const totalTime = answers.reduce((sum, a) => sum + (a.durationSeconds || 0), 0);
    const avgAnswerTimeSec = totalQuestions > 0 ? totalTime / totalQuestions : 0;
    const confidences = answers.map(a => typeof a.confidenceScore === 'number' ? a.confidenceScore : null).filter(v => v !== null);
    const overallConfidence = confidences.length ? (confidences.reduce((s, v) => s + v, 0) / confidences.length) : undefined;

    // Simple strengths/improvements extraction from feedback (heuristic)
    const strengths = [];
    const improvements = [];
    if (typeof feedback === 'string') {
      const lower = feedback.toLowerCase();
      if (lower.includes('strength')) strengths.push('Strengths highlighted in feedback');
      if (lower.includes('improve') || lower.includes('improvement')) improvements.push('Improvements suggested in feedback');
    }

    const session = new InterviewSession({
      userId,
      role,
      description,
      answers,
      feedback,
      metrics: {
        totalQuestions,
        avgAnswerTimeSec,
        overallConfidence,
        strengths,
        improvements,
      },
    });

    await session.save();
    res.status(201).json({ sessionId: session._id, metrics: session.metrics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// --- Get Interview History for current user ---
app.get('/api/analytics/history', authenticateToken, async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .select('role createdAt metrics');
    res.json({ sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// --- Get a single session details ---
app.get('/api/analytics/session/:id', authenticateToken, async (req, res) => {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// --- Aggregated Summary for charts (rolling 30 days) ---
app.get('/api/analytics/summary', authenticateToken, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sessions = await InterviewSession.find({ userId: req.user.userId, createdAt: { $gte: thirtyDaysAgo } });

    const totalSessions = sessions.length;
    const totalQuestions = sessions.reduce((s, sess) => s + (sess.metrics?.totalQuestions || 0), 0);
    const avgAnswerTimeSec = totalSessions
      ? (sessions.reduce((s, sess) => s + (sess.metrics?.avgAnswerTimeSec || 0), 0) / totalSessions)
      : 0;
    const avgConfidenceDenom = sessions.filter(sess => typeof sess.metrics?.overallConfidence === 'number').length;
    const overallConfidence = avgConfidenceDenom
      ? (sessions.reduce((s, sess) => s + (sess.metrics?.overallConfidence || 0), 0) / avgConfidenceDenom)
      : undefined;

    // Per-day counts for charts
    const perDay = {};
    sessions.forEach(sess => {
      const key = new Date(sess.createdAt).toISOString().slice(0, 10);
      perDay[key] = (perDay[key] || 0) + 1;
    });

    res.json({
      totalSessions,
      totalQuestions,
      avgAnswerTimeSec,
      overallConfidence,
      perDay,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute summary' });
  }
});

// --- Skill Gap Analysis & Recommendations ---
app.get('/api/analytics/skill-gaps', authenticateToken, async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10); // Last 10 sessions for analysis

    if (sessions.length === 0) {
      return res.json({ 
        skillGaps: [], 
        recommendations: ["Start practicing mock interviews to identify skill gaps"],
        overallScore: 0
      });
    }

    // Analyze topics and confidence levels
    const topicAnalysis = {};
    const confidenceByTopic = {};
    
    sessions.forEach(session => {
      session.answers?.forEach(answer => {
        answer.topics?.forEach(topic => {
          if (!topicAnalysis[topic]) {
            topicAnalysis[topic] = { total: 0, confident: 0, avgConfidence: 0 };
            confidenceByTopic[topic] = [];
          }
          topicAnalysis[topic].total++;
          if (answer.confidenceScore) {
            confidenceByTopic[topic].push(answer.confidenceScore);
          }
        });
      });
    });

    // Calculate average confidence per topic
    Object.keys(topicAnalysis).forEach(topic => {
      const confidences = confidenceByTopic[topic];
      if (confidences.length > 0) {
        topicAnalysis[topic].avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
        topicAnalysis[topic].confident = confidences.filter(c => c >= 0.7).length;
      }
    });

    // Identify skill gaps (topics with low confidence)
    const skillGaps = Object.entries(topicAnalysis)
      .filter(([topic, data]) => data.avgConfidence < 0.6 && data.total >= 2)
      .map(([topic, data]) => ({
        topic,
        avgConfidence: data.avgConfidence,
        totalQuestions: data.total,
        improvement: ((0.7 - data.avgConfidence) * 100).toFixed(1)
      }))
      .sort((a, b) => a.avgConfidence - b.avgConfidence);

    // Generate AI-powered recommendations
    const prompt = `Based on the following skill gap analysis, provide 3 specific, actionable recommendations for improvement:

Skill Gaps:
${skillGaps.map(gap => `- ${gap.topic}: ${(gap.avgConfidence * 100).toFixed(1)}% confidence (${gap.totalQuestions} questions)`).join('\n')}

Provide specific study resources, practice exercises, or learning paths for each identified gap.`;

    let recommendations = [];
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      recommendations = text.split('\n').filter(line => line.trim()).slice(0, 5);
    } catch (err) {
      recommendations = [
        "Practice more questions in identified weak areas",
        "Review fundamental concepts for low-confidence topics",
        "Focus on practical applications and examples"
      ];
    }

    // Calculate overall performance score
    const allConfidences = sessions.flatMap(s => 
      s.answers?.map(a => a.confidenceScore).filter(c => c !== undefined) || []
    );
    const overallScore = allConfidences.length > 0 
      ? (allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length) * 100
      : 0;

    res.json({
      skillGaps,
      recommendations,
      overallScore: overallScore.toFixed(1),
      totalSessionsAnalyzed: sessions.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze skill gaps' });
  }
});

// --- Goal Setting & Tracking ---
app.post('/api/goals', authenticateToken, async (req, res) => {
  const { title, description, targetValue, unit, deadline } = req.body;
  const userId = req.user.userId;
  
  if (!title || !targetValue || !unit) {
    return res.status(400).json({ error: 'Title, target value, and unit are required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const goal = {
      title,
      description,
      targetValue,
      unit,
      deadline: deadline ? new Date(deadline) : undefined,
    };

    user.goals = user.goals || [];
    user.goals.push(goal);
    await user.save();

    res.status(201).json({ message: 'Goal created successfully', goalId: user.goals[user.goals.length - 1]._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

app.get('/api/goals', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ goals: user.goals || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

app.put('/api/goals/:goalId', authenticateToken, async (req, res) => {
  const { goalId } = req.params;
  const { currentValue, isCompleted } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const goal = user.goals.id(goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (currentValue !== undefined) goal.currentValue = currentValue;
    if (isCompleted !== undefined) goal.isCompleted = isCompleted;

    await user.save();
    res.json({ message: 'Goal updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

app.delete('/api/goals/:goalId', authenticateToken, async (req, res) => {
  const { goalId } = req.params;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.goals = user.goals.filter(goal => goal._id.toString() !== goalId);
    await user.save();

    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ...existing code...

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
  authenticateToken(req, res, async () => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      req.admin = user;
      next();
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
}

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user || !user.isAdmin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id, username: user.username, isAdmin: true }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all users
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Delete user
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});