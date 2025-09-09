import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import QuestionCard from "./QuestionCard";

const GenerateQuestions = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pinned, setPinned] = useState([]);
  const [pinError, setPinError] = useState("");
  const [pinnedOrder, setPinnedOrder] = useState([]); // Track order of pinned questions

  // Fetch pinned questions on mount
  useEffect(() => {
    const fetchPinned = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/pinned", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setPinned(data.pinnedQuestions || []);
        }
      } catch (err) {
        // ignore
      }
    };
    if (token) fetchPinned();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setQuestions([]);
    setPinError("");
    try {
      const res = await fetch("http://localhost:5000/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ role, description }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
      } else {
        setError(data.error || "Failed to generate questions");
      }
    } catch (err) {
      setError("Server error");
    }
    setLoading(false);
  };

  const handlePin = async (question, answer) => {
    console.log("handlePin called with:", { question, answer });
    console.log("Token present:", token ? "Yes" : "No");
    setPinError("");
    try {
      const res = await fetch("http://localhost:5000/api/pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question, answer }),
      });
      console.log("Pin response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("Pin success:", data);
        setPinned((prev) => [...prev, { question, answer }]);
        // Add to pinned order with timestamp for proper ordering
        setPinnedOrder((prev) => [question, ...prev]);
      } else {
        const data = await res.json();
        console.log("Pin error:", data);
        setPinError(data.error || "Failed to pin question");
      }
    } catch (err) {
      console.error("Pin error:", err);
      setPinError("Server error");
    }
  };

  const handleUnpin = async (question) => {
    console.log("handleUnpin called with:", { question });
    console.log("Token present:", token ? "Yes" : "No");
    setPinError("");
    try {
      const res = await fetch("http://localhost:5000/api/unpin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      });
      console.log("Unpin response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("Unpin success:", data);
        setPinned((prev) => prev.filter((q) => q.question !== question));
        // Remove from pinned order
        setPinnedOrder((prev) => prev.filter((q) => q !== question));
      } else {
        const data = await res.json();
        console.log("Unpin error:", data);
        setPinError(data.error || "Failed to unpin question");
      }
    } catch (err) {
      console.error("Unpin error:", err);
      setPinError("Server error");
    }
  };

  const isQuestionPinned = (question) =>
    pinned.some((q) => q.question === question);

  // Get the proper order of questions with pinned ones at top
  const getOrderedQuestions = () => {
    const pinnedQuestions = questions.filter(q => isQuestionPinned(q.question));
    const unpinnedQuestions = questions.filter(q => !isQuestionPinned(q.question));
    
    // Sort pinned questions by their pin order (most recent first)
    const sortedPinned = pinnedQuestions.sort((a, b) => {
      const aIndex = pinnedOrder.indexOf(a.question);
      const bIndex = pinnedOrder.indexOf(b.question);
      return aIndex - bIndex;
    });
    
    return [...sortedPinned, ...unpinnedQuestions];
  };

  const startMockTest = () => {
    navigate('/mock-interview', { 
      state: { 
        questions: questions,
        role: role,
        description: description 
      } 
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Practice Interview Questions</h1>
        <p className="muted max-w-2xl mx-auto">Generate personalized interview questions based on your target role and get insights.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Generator card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-1">Generate Questions</h2>
            <p className="muted mb-4">Tell us about the role you're preparing for</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Job Role</label>
                <input type="text" className="input" placeholder="e.g., Software Engineer" value={role} onChange={(e)=>setRole(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Popular Roles</label>
                <div className="flex flex-wrap gap-2">
                  {["Software Engineer","Product Manager","Data Scientist","UX Designer"].map(r => (
                    <button type="button" key={r} className="badge badge-outline" onClick={()=>setRole(r)}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Job Description</label>
                <textarea className="input min-h-[120px]" placeholder="Paste the job description here for more targeted questions..." value={description} onChange={(e)=>setDescription(e.target.value)} />
              </div>
              <button type="submit" disabled={!role || loading} className="btn-primary w-full">
                {loading ? "Generating..." : "Generate Questions"}
              </button>
            </form>
          </div>


          {error && <div className="text-red-600 text-center">{error}</div>}
          {pinError && <div className="text-red-600 text-center">{pinError}</div>}
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="card text-center py-16">
              <div className="space-y-6">
                {/* AI Loading Animation */}
                <div className="relative">
                  <div className="w-20 h-20 mx-auto relative">
                    {/* Outer rotating ring */}
                    <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
                    
                    {/* Inner pulsing circle */}
                    <div className="absolute inset-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading Text */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold gradient-text">AI is Generating Questions</h3>
                  <p className="text-gray-600 text-lg">Our AI is analyzing your role and creating personalized interview questions...</p>
                </div>

                {/* Progress Steps */}
                <div className="max-w-md mx-auto">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-left">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">Analyzing job role: <strong>{role}</strong></span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-left">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">Processing job description</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-left">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">Generating personalized questions</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-left">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-500">Finalizing and optimizing</span>
                    </div>
                  </div>
                </div>

                {/* Fun Facts */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-purple-700">💡 Did you know?</span> Our AI analyzes thousands of successful interviews to create questions that match your specific role and experience level.
                  </p>
                </div>

                {/* Estimated Time */}
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Estimated time: <span className="font-semibold text-purple-600">15-30 seconds</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (!questions || questions.length === 0) ? (
            <div className="card text-center py-12">
              <div className="w-16 h-16 rounded-full muted-bg flex items-center justify-center mx-auto mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-1">Ready to Practice?</h3>
              <p className="muted max-w-md mx-auto">Enter your target job role and optionally add a job description to generate personalized interview questions.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {["Software Engineer","Product Manager","Data Scientist","UX Designer","Marketing Manager","Sales Representative","Business Analyst","DevOps Engineer"].map(r => (
                  <button type="button" key={r} className="badge badge-outline" onClick={()=>setRole(r)}>{r}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Questions for {role}</h2>
                <span className="badge badge-secondary">{questions.length} questions generated</span>
              </div>
              <div className="space-y-4">
                {getOrderedQuestions().map((q, idx) => (
                  <div 
                    key={`${q.question}-${idx}`}
                    className={`transition-all duration-700 ease-in-out transform ${
                      isQuestionPinned(q.question) 
                        ? 'animate-pulse-once border-l-4 border-yellow-400 bg-yellow-50' 
                        : ''
                    }`}
                    style={{
                      transform: 'translateY(0)',
                      opacity: 1,
                      animationDelay: `${idx * 100}ms`
                    }}
                  >
                    <QuestionCard 
                      question={q.question} 
                      answer={q.answer} 
                      isPinned={isQuestionPinned(q.question)} 
                      onPin={handlePin} 
                      onUnpin={handleUnpin} 
                    />
                  </div>
                ))}
              </div>
              <div className="card text-center">
                <h3 className="text-lg font-semibold mb-2">Ready for the next level?</h3>
                <p className="muted mb-4">Try a full mock interview with voice interaction and real-time feedback</p>
                <button className="btn-primary" onClick={startMockTest}>Start Mock Interview</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateQuestions;