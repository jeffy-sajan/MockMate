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
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-2 gap-10 items-start">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Generate Interview Q&A</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              placeholder="Job Role (e.g., Frontend Developer)"
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            />
            <textarea
              placeholder="Paste the full job description here..."
              className="input min-h-[140px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Q&A"}
            </button>
          </form>
        </div>
        {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
        {pinError && <div className="text-red-600 mt-4 text-center">{pinError}</div>}
        {questions && Array.isArray(questions) && questions.length > 0 && (
          <div className="card space-y-4">
            <h3 className="text-xl font-bold mb-2">Results</h3>
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
            <div className="pt-2 text-center">
              <button
                onClick={startMockTest}
                className="btn-primary"
              >
                🎤 Start Mock Test
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GenerateQuestions;