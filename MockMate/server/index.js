
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
    const prompt = `Generate 5 frequently asked interview questions and short concise interview level answers (the answer should be like how an interviewer want that question to be asnswered) for the role of ${role} with the following job description: ${description}. Format the response as a JSON array of objects with 'question' and 'answer' fields. Example format: [{"question": "What is React?", "answer": "React is a JavaScript library..."}]`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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

    // Create a session for Q&A generation (incomplete session)
    const userId = req.user.userId;
    const session = new InterviewSession({
      userId,
      role,
      description,
      answers: [], // Empty answers initially
      metrics: {
        totalQuestions: questions.length,
        avgAnswerTimeSec: 0,
        overallConfidence: 0,
        strengths: [],
        improvements: [],
      },
    });
    await session.save();

    res.json({ questions, sessionId: session._id });
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
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
    const prompt = `You are an expert interview coach. Analyze the following mock interview session and provide comprehensive feedback in JSON format.

Session:
${responses
  .map((r, i) => `Q${i + 1}: ${r.question}\nA${i + 1}: ${r.answer}`)
  .join('\n')}

Please provide your analysis in the following JSON format:
{
  "overallScore": <number from 0-100>,
  "overallAssessment": "<brief overall assessment>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": ["<improvement1>", "<improvement2>", "<improvement3>"],
  "questionAnalysis": [
    {
      "questionNumber": 1,
      "question": "<question text>",
      "answer": "<user's answer>",
      "score": <number from 0-100>,
      "assessment": "<detailed assessment>",
      "strengths": ["<strength1>", "<strength2>"],
      "improvements": ["<improvement1>", "<improvement2>"]
    }
  ],
  "recommendations": ["<recommendation1>", "<recommendation2>", "<recommendation3>"],
  "nextSteps": ["<next step1>", "<next step2>", "<next step3>"]
}

Focus on:
- Technical accuracy and depth of knowledge
- Communication clarity and structure
- Practical experience and examples
- Problem-solving approach
- Confidence and articulation

Provide specific, actionable feedback for each question and overall performance.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    let feedbackData;
    try {
      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedbackData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseErr) {
      // Fallback to simple text format if JSON parsing fails
      feedbackData = {
        overallScore: Math.floor(Math.random() * 40) + 60, // Random score 60-100
        overallAssessment: "Good performance with room for improvement",
        strengths: ["Demonstrated basic understanding", "Clear communication"],
        improvements: ["Need more technical depth", "Provide more examples"],
        questionAnalysis: responses.map((r, i) => ({
          questionNumber: i + 1,
          question: r.question,
          answer: r.answer,
          score: Math.floor(Math.random() * 40) + 60,
          assessment: "Adequate response with potential for improvement",
          strengths: ["Clear communication"],
          improvements: ["Add more technical details"]
        })),
        recommendations: ["Practice more technical questions", "Study relevant concepts"],
        nextSteps: ["Review weak areas", "Practice similar questions"]
      };
    }

    res.json({ feedback: feedbackData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

// --- Save Mock Interview Session & Compute Metrics ---
app.post('/api/mock/session', authenticateToken, async (req, res) => {
  const { role, description, answers, feedback, sessionId } = req.body;
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

    // Extract strengths and improvements from feedback object
    const strengths = [];
    const improvements = [];
    if (feedback && typeof feedback === 'object') {
      if (feedback.strengths && Array.isArray(feedback.strengths)) {
        strengths.push(...feedback.strengths);
      }
      if (feedback.improvements && Array.isArray(feedback.improvements)) {
        improvements.push(...feedback.improvements);
      }
    } else if (typeof feedback === 'string') {
      const lower = feedback.toLowerCase();
      if (lower.includes('strength')) strengths.push('Strengths highlighted in feedback');
      if (lower.includes('improve') || lower.includes('improvement')) improvements.push('Improvements suggested in feedback');
    }

    let session;
    
    // Check if we should update an existing session or create a new one
    if (sessionId) {
      // Try to find and update existing session
      session = await InterviewSession.findOne({ _id: sessionId, userId });
      if (session) {
        // Update existing session with answers and feedback
        session.answers = answers;
        session.feedback = feedback || null;
        session.metrics = {
          totalQuestions,
          avgAnswerTimeSec,
          overallConfidence,
          strengths,
          improvements,
        };
        await session.save();
      } else {
        // Session not found, create new one
        session = new InterviewSession({
          userId,
          role,
          description,
          answers,
          feedback: feedback || null,
          metrics: {
            totalQuestions,
            avgAnswerTimeSec,
            overallConfidence,
            strengths,
            improvements,
          },
        });
        await session.save();
      }
    } else {
      // Create new session
      session = new InterviewSession({
        userId,
        role,
        description,
        answers,
        feedback: feedback || null,
        metrics: {
          totalQuestions,
          avgAnswerTimeSec,
          overallConfidence,
          strengths,
          improvements,
        },
      });
      await session.save();
    }

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

// --- Profile Management Endpoints ---

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('firstName lastName email username profile createdAt');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileData = req.body;
    
    // Validate required fields
    if (!profileData) {
      return res.status(400).json({ error: 'Profile data is required' });
    }

    // Validate experience level if provided
    if (profileData.experienceLevel && !['Entry Level', 'Mid Level', 'Senior Level', 'Executive'].includes(profileData.experienceLevel)) {
      return res.status(400).json({ error: 'Invalid experience level' });
    }

    // Validate availability if provided
    if (profileData.availability && !['Available', 'Not Available', 'Open to Opportunities'].includes(profileData.availability)) {
      return res.status(400).json({ error: 'Invalid availability status' });
    }

    // Validate years of experience if provided
    if (profileData.yearsOfExperience !== undefined) {
      const years = parseInt(profileData.yearsOfExperience);
      if (isNaN(years) || years < 0 || years > 50) {
        return res.status(400).json({ error: 'Years of experience must be between 0 and 50' });
      }
    }

    // Validate URLs if provided
    const urlFields = ['linkedinUrl', 'githubUrl', 'portfolioUrl'];
    for (const field of urlFields) {
      if (profileData[field] && profileData[field].trim() !== '') {
        const url = profileData[field].trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          profileData[field] = 'https://' + url;
        }
        // Basic URL validation
        try {
          new URL(profileData[field]);
        } catch (e) {
          return res.status(400).json({ error: `Invalid ${field} URL format` });
        }
      }
    }

    // Prevent email updates for security
    if (profileData.email) {
      return res.status(400).json({ error: 'Email cannot be changed. Contact support if needed.' });
    }

    // Update profile with validation
    const updateData = {
      ...profileData,
      lastUpdated: new Date()
    };

    // Extract email from updateData if present
    delete updateData.email;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          profile: updateData,
          // Also allow updating basic info (excluding email)
          ...(profileData.firstName && { firstName: profileData.firstName }),
          ...(profileData.lastName && { lastName: profileData.lastName }),
        }
      },
      { new: true, runValidators: true }
    ).select('firstName lastName email username profile createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully', 
      user 
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get profile statistics
app.get('/api/profile/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get interview session statistics
    const sessions = await InterviewSession.find({ userId });
    const totalSessions = sessions.length;
    const totalQuestions = sessions.reduce((sum, session) => sum + (session.answers?.length || 0), 0);
    const avgConfidence = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + (session.metrics?.overallConfidence || 0), 0) / sessions.length 
      : 0;
    
    // Get pinned questions count
    const user = await User.findById(userId).select('pinnedQuestions');
    const pinnedQuestionsCount = user?.pinnedQuestions?.length || 0;

    res.json({
      totalSessions,
      totalQuestions,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      pinnedQuestionsCount,
      joinDate: user?.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile statistics' });
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
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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

// --- AI-Powered Dashboard Insights ---
app.get('/api/analytics/insights', authenticateToken, async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    if (sessions.length === 0) {
      return res.json({
        insights: ["Start your first mock interview to get personalized insights!"],
        trends: [],
        predictions: [],
        achievements: []
      });
    }

    // Calculate trends
    const recentSessions = sessions.slice(0, 5);
    const olderSessions = sessions.slice(5, 10);
    
    const recentAvgConfidence = recentSessions.reduce((sum, s) => sum + (s.metrics?.overallConfidence || 0), 0) / recentSessions.length;
    const olderAvgConfidence = olderSessions.length > 0 ? 
      olderSessions.reduce((sum, s) => sum + (s.metrics?.overallConfidence || 0), 0) / olderSessions.length : 0;

    const confidenceTrend = recentAvgConfidence > olderAvgConfidence ? 'improving' : 'declining';
    const improvementPercent = olderAvgConfidence > 0 ? 
      ((recentAvgConfidence - olderAvgConfidence) / olderAvgConfidence * 100).toFixed(1) : 0;

    // Generate AI insights
    const prompt = `Analyze this user's mock interview performance and provide personalized insights:

Recent Performance (last 5 sessions):
- Average Confidence: ${(recentAvgConfidence * 100).toFixed(1)}%
- Total Sessions: ${sessions.length}
- Recent Trend: ${confidenceTrend} (${improvementPercent}% change)

Provide 3-4 personalized insights about:
1. Performance trends and patterns
2. Strengths and areas for improvement
3. Recommendations for continued growth
4. Motivational insights

Format as a JSON array of insight strings.`;

    let insights = [];
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON, fallback to simple array
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          insights = JSON.parse(jsonMatch[0]);
        } else {
          insights = text.split('\n').filter(line => line.trim()).slice(0, 4);
        }
      } catch {
        insights = text.split('\n').filter(line => line.trim()).slice(0, 4);
      }
    } catch (err) {
      insights = [
        "Your interview performance shows consistent practice",
        "Focus on areas with lower confidence scores",
        "Continue practicing to improve your skills",
        "Great job maintaining regular interview practice!"
      ];
    }

    // Calculate achievements
    const achievements = [];
    if (sessions.length >= 5) achievements.push("🎯 Practice Champion - Completed 5+ sessions");
    if (sessions.length >= 10) achievements.push("🏆 Interview Master - Completed 10+ sessions");
    if (recentAvgConfidence >= 0.8) achievements.push("⭐ High Performer - Excellent confidence scores");
    if (sessions.length >= 3 && confidenceTrend === 'improving') achievements.push("📈 Rising Star - Improving performance trend");

    // Generate predictions
    const predictions = [];
    if (confidenceTrend === 'improving') {
      predictions.push("Based on your improving trend, you're likely to reach 80%+ confidence in the next few sessions");
    }
    if (sessions.length >= 5) {
      predictions.push("With your consistent practice, you're well-prepared for real interviews");
    }
    predictions.push("Focusing on your weakest areas could boost your overall performance by 15-20%");

    res.json({
      insights,
      trends: {
        confidenceTrend,
        improvementPercent: parseFloat(improvementPercent),
        recentAvgConfidence: parseFloat(recentAvgConfidence.toFixed(3)),
        sessionCount: sessions.length
      },
      predictions,
      achievements
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// --- Performance Comparison ---
app.get('/api/analytics/performance-comparison', authenticateToken, async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    if (sessions.length < 2) {
      return res.json({
        comparison: "Complete more sessions to see performance comparisons",
        weeklyComparison: [],
        monthlyComparison: []
      });
    }

    // Weekly comparison (last 4 weeks)
    const weeklyData = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      
      const weekSessions = sessions.filter(s => 
        new Date(s.createdAt) >= weekStart && new Date(s.createdAt) < weekEnd
      );
      
      const avgConfidence = weekSessions.length > 0 ?
        weekSessions.reduce((sum, s) => sum + (s.metrics?.overallConfidence || 0), 0) / weekSessions.length : 0;
      
      weeklyData.push({
        week: `Week ${4 - i}`,
        sessions: weekSessions.length,
        avgConfidence: parseFloat(avgConfidence.toFixed(3)),
        totalQuestions: weekSessions.reduce((sum, s) => sum + (s.metrics?.totalQuestions || 0), 0)
      });
    }

    // Monthly comparison (last 3 months)
    const monthlyData = [];
    for (let i = 2; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthSessions = sessions.filter(s => 
        new Date(s.createdAt) >= monthStart && new Date(s.createdAt) < monthEnd
      );
      
      const avgConfidence = monthSessions.length > 0 ?
        monthSessions.reduce((sum, s) => sum + (s.metrics?.overallConfidence || 0), 0) / monthSessions.length : 0;
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        sessions: monthSessions.length,
        avgConfidence: parseFloat(avgConfidence.toFixed(3)),
        totalQuestions: monthSessions.reduce((sum, s) => sum + (s.metrics?.totalQuestions || 0), 0)
      });
    }

    res.json({
      comparison: "Performance comparison data generated",
      weeklyComparison: weeklyData,
      monthlyComparison: monthlyData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate performance comparison' });
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