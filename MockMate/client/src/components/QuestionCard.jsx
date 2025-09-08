import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Collapsible from "./ui/collapsible";
import Drawer from "./ui/drawer";

const QuestionCard = ({ question, answer, isPinned, onPin, onUnpin }) => {
  const { token } = useContext(AuthContext);
  const [showDrawer, setShowDrawer] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [explanationError, setExplanationError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLearnMore = async () => {
    console.log("Learn More clicked. Token:", token ? "Present" : "Missing");
    setShowDrawer(true);
    
    if (!explanation) {
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
    setIsAnimating(true);
    
    if (isPinned) {
      onUnpin(question);
    } else {
      onPin(question, answer);
    }
    
    // Reset animation state after a short delay
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <>
      <Collapsible title={
        <div className="flex items-center space-x-2">
          <span>{question}</span>
          {isPinned && (
            <svg 
              className="w-4 h-4 text-yellow-500 animate-pulse" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          )}
        </div>
      }>
        <div className="space-y-4">
          <div className="text-gray-700">
            <span className="font-semibold">A:</span> {answer}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleLearnMore}
              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Learn More</span>
            </button>
            <button
              onClick={handlePin}
              className={`px-3 py-1 rounded transition-all duration-300 flex items-center space-x-1 transform ${
                isPinned
                  ? "bg-yellow-400 text-black hover:bg-yellow-500"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              } ${
                isAnimating 
                  ? isPinned 
                    ? "scale-95 bg-red-400" 
                    : "scale-110 bg-green-500"
                  : "scale-100"
              }`}
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-300 ${
                  isAnimating ? "rotate-12 scale-110" : "rotate-0 scale-100"
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="transition-all duration-300">
                {isAnimating 
                  ? (isPinned ? "Unpinning..." : "Pinning...") 
                  : (isPinned ? "Unpin" : "Pin")
                }
              </span>
            </button>
          </div>
        </div>
      </Collapsible>

      <Drawer 
        isOpen={showDrawer} 
        onClose={() => setShowDrawer(false)}
        title="Detailed Explanation"
      >
        <div className="space-y-4" style={{ color: '#111827' }}>
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: '#f9fafb', 
              borderColor: '#e5e7eb',
              color: '#111827'
            }}
          >
            <h3 className="font-semibold mb-2 text-lg" style={{ color: '#111827' }}>Question:</h3>
            <p className="leading-relaxed" style={{ color: '#374151' }}>{question}</p>
          </div>
          
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: '#eff6ff', 
              borderColor: '#bfdbfe',
              color: '#111827'
            }}
          >
            <h3 className="font-semibold mb-2 text-lg" style={{ color: '#111827' }}>Answer:</h3>
            <p className="leading-relaxed" style={{ color: '#374151' }}>{answer}</p>
          </div>
          
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: '#faf5ff', 
              borderColor: '#d8b4fe',
              color: '#111827'
            }}
          >
            <h3 className="font-semibold mb-2 text-lg" style={{ color: '#111827' }}>Detailed Explanation:</h3>
            {loading ? (
              <div className="flex items-center space-x-2 py-4">
                <div 
                  className="animate-spin rounded-full h-5 w-5 border-b-2"
                  style={{ borderColor: '#9333ea' }}
                ></div>
                <span style={{ color: '#6b7280' }}>Loading explanation...</span>
              </div>
            ) : explanationError ? (
              <div className="py-4" style={{ color: '#dc2626' }}>{explanationError}</div>
            ) : explanation ? (
              <div 
                className="whitespace-pre-wrap leading-relaxed py-2"
                style={{ color: '#374151' }}
              >
                {explanation}
              </div>
            ) : (
              <div className="py-4" style={{ color: '#6b7280' }}>Click "Learn More" to get detailed explanation</div>
            )}
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default QuestionCard;

