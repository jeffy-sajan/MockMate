import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const QuestionCard = ({ question, answer, isPinned, onPin, onUnpin }) => {
  const { token } = useContext(AuthContext);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [explanationError, setExplanationError] = useState("");

  const handleLearnMore = async () => {
    console.log("Learn More clicked. Token:", token ? "Present" : "Missing");
    setShowExplanation((prev) => !prev);
    if (!explanation && !showExplanation) {
      setLoading(true);
      setExplanationError("");
      try {
        console.log("Calling /api/explanation with:", { question, answer });
        const res = await fetch("http://localhost:5000/api/explanation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ question, answer }),
        });
        console.log("Response status:", res.status);
        const data = await res.json();
        console.log("Response data:", data);
        if (res.ok) {
          setExplanation(data.explanation);
        } else {
          setExplanationError(data.error || "Failed to fetch explanation");
        }
      } catch (err) {
        console.error("Error in handleLearnMore:", err);
        setExplanationError("Server error");
      }
      setLoading(false);
    }
  };

  const handlePin = () => {
    console.log("Pin/Unpin clicked. isPinned:", isPinned);
    if (isPinned) {
      onUnpin(question);
    } else {
      onPin(question, answer);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow relative">
      <div className="font-semibold text-blue-800 mb-2">{question}</div>
      <div className="text-gray-700 mb-2">
        <span className="font-semibold">A:</span> {answer}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleLearnMore}
          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
        >
          {showExplanation ? "Hide" : "Learn More"}
        </button>
        <button
          onClick={handlePin}
          className={`px-3 py-1 rounded transition ${
            isPinned
              ? "bg-yellow-400 text-black hover:bg-yellow-500"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isPinned ? "Unpin" : "Pin"}
        </button>
      </div>
      {showExplanation && (
        <div className="mt-4 bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
          {loading
            ? "Loading explanation..."
            : explanationError
            ? <span className="text-red-600">{explanationError}</span>
            : explanation}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
