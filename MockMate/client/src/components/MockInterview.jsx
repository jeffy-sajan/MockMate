import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const MockInterview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  
  const { questions, role, description } = location.state || { questions: [], role: "", description: "" };
  
  const [currentStep, setCurrentStep] = useState("mic-test"); // mic-test, interview, summary
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micPermission, setMicPermission] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Web Speech API setup
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate('/generate');
      return;
    }

    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError('Speech recognition error: ' + event.error);
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    } else {
      setError('Speech recognition not supported in this browser');
    }
  }, [questions, navigate]);

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const startRecording = () => {
    if (recognition && micPermission) {
      setTranscript("");
      setIsRecording(true);
      recognition.start();
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const nextQuestion = () => {
    // Save current answer
    if (transcript.trim()) {
      const currentAnswer = {
        question: questions[currentQuestionIndex].question,
        answer: transcript.trim()
      };
      setUserAnswers(prev => [...prev, currentAnswer]);
      setTranscript("");
    }

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Interview complete
      setCurrentStep("summary");
    }
  };

  const getFeedback = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("http://localhost:5000/api/mock/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ responses: userAnswers }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.feedback);
      } else {
        setError(data.error || "Failed to get feedback");
      }
    } catch (err) {
      setError("Server error");
    }
    
    setLoading(false);
  };

  const resetInterview = () => {
    setCurrentStep("mic-test");
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setTranscript("");
    setFeedback("");
    setError("");
  };

  if (currentStep === "mic-test") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center text-green-700 mb-6">
            🎤 Mock Interview Setup
          </h2>
          
          <div className="text-center space-y-6">
            <p className="text-gray-700">
              Before starting your mock interview, let's test your microphone to ensure everything is working properly.
            </p>
            
            {!micPermission ? (
              <button
                onClick={testMicrophone}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Test Microphone
              </button>
            ) : (
              <div className="space-y-4">
                <div className="text-green-600 font-semibold">
                  ✅ Microphone access granted!
                </div>
                <p className="text-gray-600">
                  Read this sentence aloud to test your voice clarity:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg font-medium">
                  "The quick brown fox jumps over the lazy dog"
                </div>
                <button
                  onClick={() => setCurrentStep("interview")}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Start Interview
                </button>
              </div>
            )}
            
            {error && (
              <div className="text-red-600 mt-4">{error}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "interview") {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">
              Mock Interview - Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Question:</h3>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
              <p className="text-lg text-gray-700">{currentQuestion.question}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Answer:</h3>
            <div className="bg-gray-50 border rounded-lg p-4 min-h-[120px]">
              {transcript ? (
                <p className="text-gray-700">{transcript}</p>
              ) : (
                <p className="text-gray-500 italic">
                  {isRecording ? "Listening..." : "Click 'Start Answering' and speak your answer"}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                🎤 Start Answering
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                ⏹️ Stop Recording
              </button>
            )}
            
            {transcript.trim() && (
              <button
                onClick={nextQuestion}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Interview"}
              </button>
            )}
          </div>
          
          {error && (
            <div className="text-red-600 mt-4 text-center">{error}</div>
          )}
        </div>
      </div>
    );
  }

  if (currentStep === "summary") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-green-100">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center text-purple-700 mb-6">
            🎯 Interview Summary
          </h2>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Responses:</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {userAnswers.map((response, index) => (
                <div key={index} className="bg-gray-50 border rounded-lg p-4">
                  <div className="font-semibold text-gray-800 mb-2">
                    Q{index + 1}: {response.question}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-medium">Your Answer:</span> {response.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {!feedback ? (
            <div className="text-center">
              <button
                onClick={getFeedback}
                disabled={loading}
                className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? "Getting AI Feedback..." : "🎯 Get AI Feedback"}
              </button>
            </div>
          ) : (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">AI Feedback:</h3>
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-lg">
                <div className="whitespace-pre-wrap text-gray-700">{feedback}</div>
              </div>
            </div>
          )}
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={resetInterview}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              🔄 Start New Interview
            </button>
            <button
              onClick={() => navigate('/generate')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              📝 Generate New Questions
            </button>
          </div>
          
          {error && (
            <div className="text-red-600 mt-4 text-center">{error}</div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default MockInterview;
