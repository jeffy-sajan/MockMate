import React, { useState, useEffect, useContext, useRef } from "react";
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
  const [sessionId, setSessionId] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [testTranscript, setTestTranscript] = useState("");
  const [micTestPassed, setMicTestPassed] = useState(false);
  const [accumulatedTranscript, setAccumulatedTranscript] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [recognitionTimeout, setRecognitionTimeout] = useState(null);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [restartAttempts, setRestartAttempts] = useState(0);

  // Use ref to maintain current transcript state
  const currentTranscriptRef = useRef("");
  const accumulatedTranscriptRef = useRef("");

  // Web Speech API setup
  const [recognition, setRecognition] = useState(null);
  const [testRecognition, setTestRecognition] = useState(null);

  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate('/generate');
      return;
    }

    // Initialize Enhanced Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 3; // Get multiple recognition alternatives
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            // Use auto-correction for final results
            const correctedTranscript = autoCorrectSpeech(transcript);
            finalTranscript += correctedTranscript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update refs immediately (synchronous)
        if (finalTranscript.trim()) {
          accumulatedTranscriptRef.current += finalTranscript;
        }
        
        // Update display transcript with accumulated + interim
        const fullTranscript = accumulatedTranscriptRef.current + interimTranscript;
        currentTranscriptRef.current = fullTranscript;
        setTranscript(fullTranscript);
        
        // Update state for React (for other components that need it)
        setAccumulatedTranscript(accumulatedTranscriptRef.current);
        
        // Reset restart attempts on successful recognition
        setRestartAttempts(0);
      };
      
      recognitionInstance.onend = () => {
        console.log('Recognition ended, isRecording:', isRecording, 'isPaused:', isPaused);
        
        // Always restart if we're still recording and not manually paused
        if (isRecording && !isPaused) {
          setIsRecognitionActive(false);
          
          // Immediate restart with exponential backoff
          const delay = Math.min(100 * Math.pow(2, restartAttempts), 2000);
          setTimeout(() => {
            if (isRecording && !isPaused) {
              console.log('Auto-restarting recognition, attempt:', restartAttempts + 1);
              setIsRecognitionActive(true);
              setRestartAttempts(prev => prev + 1);
              recognitionInstance.start();
            }
          }, delay);
        }
      };
      
      recognitionInstance.onstart = () => {
        console.log('Recognition started');
        setIsRecognitionActive(true);
        setRestartAttempts(0);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle specific errors
        if (event.error === 'no-speech') {
          // Don't show error for no speech, just restart
          if (isRecording && !isPaused) {
            setIsRecognitionActive(false);
            setTimeout(() => {
              if (isRecording && !isPaused) {
                console.log('Restarting after no-speech error');
                setIsRecognitionActive(true);
                recognitionInstance.start();
              }
            }, 1000);
          }
        } else if (event.error === 'network') {
          setError('Network error. Please check your internet connection.');
          setIsRecording(false);
        } else if (event.error === 'aborted') {
          // Recognition was aborted, restart if still recording
          if (isRecording && !isPaused) {
            setTimeout(() => {
              if (isRecording && !isPaused) {
                console.log('Restarting after abort');
                setIsRecognitionActive(true);
                recognitionInstance.start();
              }
            }, 100);
          }
        } else {
          setError('Speech recognition error: ' + event.error);
          setIsRecording(false);
        }
      };
      
      setRecognition(recognitionInstance);
    } else {
      setError('Speech recognition not supported in this browser');
    }
  }, [questions, navigate]);

  // Auto-correction function for speech recognition
  const autoCorrectSpeech = (text) => {
    // Common speech recognition mistakes and corrections
    const corrections = {
      // Technical terms
      'react': 'React',
      'javascript': 'JavaScript',
      'html': 'HTML',
      'css': 'CSS',
      'api': 'API',
      'sql': 'SQL',
      'json': 'JSON',
      'xml': 'XML',
      'http': 'HTTP',
      'https': 'HTTPS',
      'url': 'URL',
      'ui': 'UI',
      'ux': 'UX',
      'uxd': 'UXD',
      
      // Common words
      'uh': '',
      'um': '',
      'er': '',
      'ah': '',
      'like': '',
      'you know': '',
      'basically': '',
      'actually': '',
      'literally': '',
      
      // Interview-specific terms
      'interview': 'interview',
      'experience': 'experience',
      'project': 'project',
      'team': 'team',
      'management': 'management',
      'development': 'development',
      'software': 'software',
      'engineer': 'engineer',
      'developer': 'developer',
      'programmer': 'programmer',
      'coding': 'coding',
      'programming': 'programming',
      'algorithm': 'algorithm',
      'database': 'database',
      'frontend': 'frontend',
      'backend': 'backend',
      'fullstack': 'full-stack',
      'full stack': 'full-stack',
      
      // Common misrecognitions
      'there': 'their',
      'their': 'there',
      'to': 'too',
      'too': 'to',
      'two': 'to',
      'for': 'four',
      'four': 'for',
      'be': 'bee',
      'bee': 'be',
      'see': 'sea',
      'sea': 'see',
    };
    
    let correctedText = text.toLowerCase();
    
    // Apply corrections
    Object.entries(corrections).forEach(([wrong, correct]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      correctedText = correctedText.replace(regex, correct);
    });
    
    // Clean up extra spaces and punctuation
    correctedText = correctedText
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.!?])/g, '$1')
      .trim();
    
    return correctedText;
  };

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission(true);
      
      // Set up audio level monitoring
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      const updateAudioLevel = () => {
        if (isTestingMic) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      // Set up test recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const testRecognitionInstance = new SpeechRecognition();
        
        testRecognitionInstance.continuous = false;
        testRecognitionInstance.interimResults = false;
        testRecognitionInstance.lang = 'en-US';
        
        testRecognitionInstance.onresult = (event) => {
          const testResult = event.results[0][0].transcript;
          setTestTranscript(testResult);
          setMicTestPassed(true);
          setIsTestingMic(false);
        };
        
        testRecognitionInstance.onerror = (event) => {
          console.error('Test recognition error:', event.error);
          setError('Speech recognition test failed: ' + event.error);
          setIsTestingMic(false);
        };
        
        setTestRecognition(testRecognitionInstance);
      }
      
      // Store stream for cleanup
      window.testStream = stream;
      
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const startMicTest = () => {
    setIsTestingMic(true);
    setTestTranscript("");
    setMicTestPassed(false);
    setError("");
    
    // Start audio level monitoring
    if (window.testStream) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(window.testStream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      const updateAudioLevel = () => {
        if (isTestingMic) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    }
    
    if (testRecognition) {
      testRecognition.start();
    }
  };

  const stopMicTest = () => {
    setIsTestingMic(false);
    if (testRecognition) {
      testRecognition.stop();
    }
    if (window.testStream) {
      window.testStream.getTracks().forEach(track => track.stop());
    }
  };

  const startRecording = () => {
    if (recognition && micPermission) {
      // Reset both state and refs
      setTranscript("");
      setAccumulatedTranscript("");
      currentTranscriptRef.current = "";
      accumulatedTranscriptRef.current = "";
      setIsRecording(true);
      setIsPaused(false);
      setIsRecognitionActive(false);
      setRestartAttempts(0);
      console.log('Starting recording...');
      recognition.start();
    }
  };

  const stopRecording = () => {
    if (recognition) {
      console.log('Stopping recording...');
      setIsPaused(true); // Set paused first to prevent auto-restart
      recognition.stop();
      setIsRecording(false);
      setIsRecognitionActive(false);
      if (recognitionTimeout) {
        clearTimeout(recognitionTimeout);
      }
    }
  };

  const pauseRecording = () => {
    if (recognition && isRecording) {
      console.log('Pausing recording...');
      setIsPaused(true);
      recognition.stop();
      setIsRecognitionActive(false);
    }
  };

  const resumeRecording = () => {
    if (recognition && isRecording && isPaused) {
      console.log('Resuming recording...');
      setIsPaused(false);
      setIsRecognitionActive(false);
      setRestartAttempts(0);
      recognition.start();
    }
  };

  const nextQuestion = () => {
    // Save current answer using accumulated transcript from ref
    const finalAnswer = accumulatedTranscriptRef.current.trim() || currentTranscriptRef.current.trim();
    if (finalAnswer) {
      const currentAnswer = {
        question: questions[currentQuestionIndex].question,
        answer: finalAnswer
      };
      setUserAnswers(prev => [...prev, currentAnswer]);
      setTranscript("");
      setAccumulatedTranscript("");
      currentTranscriptRef.current = "";
      accumulatedTranscriptRef.current = "";
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
      // Get AI feedback
      const feedbackRes = await fetch("/api/mock/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ responses: userAnswers }),
      });
      
      const feedbackData = await feedbackRes.json();
      if (!feedbackRes.ok) {
        throw new Error(feedbackData.error || "Failed to get feedback");
      }
      
      setFeedback(feedbackData.feedback);
      
      // Save session to analytics
      const sessionData = {
        role,
        description,
        answers: userAnswers.map((answer, index) => ({
          question: answer.question,
          answer: answer.answer,
          durationSeconds: Math.floor(Math.random() * 60) + 30, // Mock duration
          confidenceScore: Math.random() * 0.4 + 0.5, // Mock confidence 0.5-0.9
          topics: ["interview", "practice"] // Mock topics
        })),
        feedback: feedbackData.feedback
      };
      
      const sessionRes = await fetch("/api/mock/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      });
      
      if (sessionRes.ok) {
        const sessionResult = await sessionRes.json();
        setSessionId(sessionResult.sessionId);
      }
      
    } catch (err) {
      setError(err.message || "Server error");
    }
    
    setLoading(false);
  };

  const resetInterview = () => {
    setCurrentStep("mic-test");
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setTranscript("");
    setAccumulatedTranscript("");
    setFeedback("");
    setError("");
    setAudioLevel(0);
    setIsTestingMic(false);
    setTestTranscript("");
    setMicTestPassed(false);
    setIsPaused(false);
    setIsRecognitionActive(false);
    setRestartAttempts(0);
    // Reset refs
    currentTranscriptRef.current = "";
    accumulatedTranscriptRef.current = "";
    if (recognitionTimeout) {
      clearTimeout(recognitionTimeout);
    }
    if (window.testStream) {
      window.testStream.getTracks().forEach(track => track.stop());
    }
  };

  if (currentStep === "mic-test") {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="card max-w-2xl mx-auto">
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
                Grant Microphone Access
              </button>
            ) : (
              <div className="space-y-6">
                <div className="text-green-600 font-semibold text-center">
                  ✅ Microphone access granted!
                </div>
                
                {/* Audio Level Indicator */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800 text-center">Audio Level Test</h3>
                  <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-full transition-all duration-100"
                      style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    {audioLevel > 10 ? "🎤 Microphone is working!" : "Speak to test your microphone"}
                  </p>
                </div>

                {/* Voice Recognition Test */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 text-center">Voice Recognition Test</h3>
                  <p className="text-gray-600 text-center">
                    Read this sentence aloud to test voice recognition:
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg font-medium text-center">
                    "The quick brown fox jumps over the lazy dog"
                  </div>
                  
                  {!isTestingMic && !micTestPassed && (
                    <button
                      onClick={startMicTest}
                      className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                    >
                      🎤 Start Voice Test
                    </button>
                  )}
                  
                  {isTestingMic && (
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="inline-block animate-pulse text-purple-600 font-semibold">
                          🎤 Listening... Speak now!
                        </div>
                      </div>
                      <button
                        onClick={stopMicTest}
                        className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                      >
                        ⏹️ Stop Test
                      </button>
                    </div>
                  )}
                  
                  {micTestPassed && testTranscript && (
                    <div className="space-y-3">
                      <div className="text-green-600 font-semibold text-center">
                        ✅ Voice recognition working!
                      </div>
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Recognized:</span> "{testTranscript}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Start Interview Button */}
                <div className="pt-4 border-t">
                  <button
                    onClick={() => setCurrentStep("interview")}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    🚀 Start Mock Interview
                  </button>
                </div>
              </div>
            )}
            
            {error && (
              <div className="text-red-600 mt-4">{error}</div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (currentStep === "interview") {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="card max-w-4xl mx-auto">
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
          
          <div className="space-y-4">
            {/* Recording Status */}
            <div className="text-center space-y-2">
              {isRecording && !isPaused && (
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-2 text-green-600 font-semibold">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>🎤 Recording... Speak naturally, all pauses are captured</span>
                  </div>
                  {isRecognitionActive && (
                    <div className="text-sm text-blue-600">
                      ✓ Voice recognition active - capturing continuously
                    </div>
                  )}
                  {!isRecognitionActive && (
                    <div className="text-sm text-orange-600">
                      ⚡ Restarting recognition...
                    </div>
                  )}
                </div>
              )}
              {isRecording && isPaused && (
                <div className="inline-flex items-center space-x-2 text-yellow-600 font-semibold">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>⏸️ Paused - Click Resume to continue</span>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  🎤 Start Answering
                </button>
              ) : (
                <div className="flex space-x-2">
                  {!isPaused ? (
                    <button
                      onClick={pauseRecording}
                      className="px-4 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition"
                    >
                      ⏸️ Pause
                    </button>
                  ) : (
                    <button
                      onClick={resumeRecording}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      ▶️ Resume
                    </button>
                  )}
                  <button
                    onClick={stopRecording}
                    className="px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    ⏹️ Stop
                  </button>
                </div>
              )}
              
              {(transcript.trim() || accumulatedTranscriptRef.current.trim()) && (
                <button
                  onClick={nextQuestion}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Interview"}
                </button>
              )}
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-600 space-y-1">
              <p>💡 <strong>Tips:</strong> Speak naturally with pauses of any length. The system continuously captures all your speech.</p>
              <p>🔄 <strong>Continuous Mode:</strong> Even 4-5 second pauses are automatically handled - your complete answer is preserved.</p>
            </div>
          </div>
          
          {error && (
            <div className="text-red-600 mt-4 text-center">{error}</div>
          )}
        </div>
      </section>
    );
  }

  if (currentStep === "summary") {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              🎯 Interview Summary
            </h2>
            <p className="text-lg muted max-w-2xl mx-auto">
              Review your responses and get AI-powered feedback to improve your interview skills.
            </p>
          </div>

          {/* Responses Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Your Responses</h3>
              <span className="badge badge-secondary">{userAnswers.length} questions answered</span>
            </div>
            
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              {userAnswers.map((response, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-3 text-lg">
                        {response.question}
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-600 mb-2">Your Answer:</div>
                        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {response.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Feedback Section */}
          {!feedback ? (
            <div className="card text-center">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Ready for AI Feedback?</h3>
                  <p className="text-gray-600 mb-6">
                    Get personalized insights and suggestions to improve your interview performance.
                  </p>
                </div>
                <button
                  onClick={getFeedback}
                  disabled={loading}
                  className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Getting AI Feedback...</span>
                    </div>
                  ) : (
                    "🎯 Get AI Feedback"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">AI Feedback</h3>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {feedback}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="card">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">What's Next?</h3>
              <p className="text-gray-600">Choose your next step to continue improving your interview skills.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={resetInterview}
                className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 hover:border-gray-300"
              >
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto group-hover:bg-gray-700 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Start New Interview</h4>
                    <p className="text-sm text-gray-600">Practice with the same questions again</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/generate')}
                className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:shadow-lg transition-all duration-200 hover:border-blue-300"
              >
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-700 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Generate New Questions</h4>
                    <p className="text-sm text-gray-600">Create fresh questions for different roles</p>
                  </div>
                </div>
              </button>

              {sessionId && (
                <button
                  onClick={() => navigate('/analytics')}
                  className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:shadow-lg transition-all duration-200 hover:border-purple-300"
                >
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto group-hover:bg-purple-700 transition-colors">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">View Analytics</h4>
                      <p className="text-sm text-gray-600">Track your progress and performance</p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="card">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return null;
};

export default MockInterview;
