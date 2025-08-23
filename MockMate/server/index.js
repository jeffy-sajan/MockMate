const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');

const User = require('./models/User');
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
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ user: { id: newUser._id, username: newUser.username, createdAt: newUser.createdAt } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
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

app.post('/api/questions', async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});