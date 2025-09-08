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
          {(!questions || questions.length === 0) ? (
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
              {questions
                .sort((a,b)=>{ const ap=isQuestionPinned(a.question); const bp=isQuestionPinned(b.question); if(ap&&!bp) return -1; if(!ap&&bp) return 1; return 0; })
                .map((q,idx)=> (
                  <QuestionCard key={idx} question={q.question} answer={q.answer} isPinned={isQuestionPinned(q.question)} onPin={handlePin} onUnpin={handleUnpin} />
                ))}
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