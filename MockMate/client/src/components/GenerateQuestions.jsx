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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Generate Interview Q&A
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Job Role (e.g., Frontend Developer)"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />
          <textarea
            placeholder="Paste the full job description here..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Q&A"}
          </button>
        </form>
        {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
        {pinError && <div className="text-red-600 mt-4 text-center">{pinError}</div>}
        {questions && Array.isArray(questions) && questions.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-bold text-blue-700 mb-2">Results:</h3>
            {questions
              .sort((a, b) => {
                const aPinned = isQuestionPinned(a.question);
                const bPinned = isQuestionPinned(b.question);
                if (aPinned && !bPinned) return -1; // a goes first
                if (!aPinned && bPinned) return 1;  // b goes first
                return 0; // keep original order
              })
              .map((q, idx) => (
                <QuestionCard
                  key={idx}
                  question={q.question}
                  answer={q.answer}
                  isPinned={isQuestionPinned(q.question)}
                  onPin={handlePin}
                  onUnpin={handleUnpin}
                />
              ))}
            
            {/* Start Mock Test Button */}
            <div className="mt-6 text-center">
              <button
                onClick={startMockTest}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-lg"
              >
                🎤 Start Mock Test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateQuestions;