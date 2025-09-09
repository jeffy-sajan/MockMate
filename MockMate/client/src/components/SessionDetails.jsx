import React, { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const number = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(2));

const SessionDetails = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/analytics/session/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch session");
        const json = await res.json();
        if (!cancelled) setSession(json.session);
      } catch (e) {
        if (!cancelled) setError(e.message || "Error loading session");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Session</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Not Found</h3>
          <p className="text-gray-600 mb-4">The requested interview session could not be found.</p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreText = (score) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Interview Session Details
              </h1>
              <p className="text-gray-600 text-lg">
                Comprehensive analysis of your mock interview performance
              </p>
            </div>
            <div className="flex space-x-3">
              <Link 
                to="/dashboard" 
                className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                ← Back to Dashboard
              </Link>
              <Link 
                to="/analytics" 
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                View All Sessions
              </Link>
            </div>
          </div>

          {/* Session Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Date & Time</div>
                  <div className="font-semibold text-gray-900">{formatDate(session.createdAt)}</div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Job Role</div>
                  <div className="font-semibold text-gray-900">{session.role || 'General Interview'}</div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                  <div className="font-semibold text-gray-900">{session.metrics?.totalQuestions || 0}</div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Avg Answer Time</div>
                  <div className="font-semibold text-gray-900">
                    {session.metrics?.avgAnswerTimeSec ? Math.round(session.metrics.avgAnswerTimeSec) : 0}s
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setActiveTab("feedback")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "feedback"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🤖 AI Feedback
              </button>
              <button
                onClick={() => setActiveTab("qa")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "qa"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                💬 Q&A Details
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="card p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Performance Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {session.metrics?.overallConfidence ? Math.round(session.metrics.overallConfidence * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Confidence</div>
                  <div className={`text-xs font-medium mt-1 ${getScoreColor(session.metrics?.overallConfidence || 0)} px-2 py-1 rounded-full inline-block`}>
                    {getScoreText(session.metrics?.overallConfidence || 0)}
                  </div>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {session.metrics?.totalQuestions || 0}
                  </div>
                  <div className="text-sm text-gray-600">Questions Answered</div>
                  <div className="text-xs text-gray-500 mt-1">Complete session</div>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {session.metrics?.avgAnswerTimeSec ? Math.round(session.metrics.avgAnswerTimeSec) : 0}s
                  </div>
                  <div className="text-sm text-gray-600">Average Response Time</div>
                  <div className="text-xs text-gray-500 mt-1">Per question</div>
                </div>
              </div>
            </div>

            {/* Session Summary */}
            <div className="card p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Session Summary</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  This interview session was conducted on <strong>{formatDate(session.createdAt)}</strong> 
                  {session.role && ` for the position of ${session.role}`}. 
                  You answered <strong>{session.metrics?.totalQuestions || 0} questions</strong> with an average response time of 
                  <strong> {session.metrics?.avgAnswerTimeSec ? Math.round(session.metrics.avgAnswerTimeSec) : 0} seconds</strong> per question.
                  {session.metrics?.overallConfidence && (
                    <> Your overall confidence score was <strong>{Math.round(session.metrics.overallConfidence * 100)}%</strong>, 
                    which indicates <strong>{getScoreText(session.metrics.overallConfidence)}</strong> performance.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="space-y-6">
            <div className="card p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">AI-Powered Feedback</h2>
                  <p className="text-gray-600">Detailed analysis and recommendations from our AI system</p>
                </div>
              </div>
              
              {session.feedback ? (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6">
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {typeof session.feedback === 'string' ? session.feedback : JSON.stringify(session.feedback, null, 2)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Feedback Available</h3>
                  <p className="text-gray-600">AI feedback is being generated for this session. Please check back later.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "qa" && (
          <div className="space-y-6">
            <div className="card p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Question & Answer Details</h2>
              
              {session.answers && session.answers.length > 0 ? (
                <div className="space-y-6">
                  {session.answers.map((answer, index) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="mb-4">
                            <h3 className="font-semibold text-gray-900 text-lg mb-2">Question {index + 1}</h3>
                            <p className="text-gray-700 leading-relaxed">{answer.question}</p>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Your Answer</h4>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{answer.answer}</p>
                            </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-lg font-bold text-blue-600">{number(answer.durationSeconds)}s</div>
                              <div className="text-xs text-gray-600">Duration</div>
                            </div>
                            <div className="text-center p-3 bg-white border border-gray-200 rounded-lg">
                              <div className={`text-lg font-bold ${getScoreColor(answer.confidenceScore)}`}>
                                {answer.confidenceScore ? Math.round(answer.confidenceScore * 100) : 0}%
                              </div>
                              <div className="text-xs text-gray-600">Confidence</div>
        </div>
                            <div className="text-center p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="text-lg font-bold text-purple-600">
                                {answer.topics && answer.topics.length > 0 ? answer.topics.length : 0}
        </div>
                              <div className="text-xs text-gray-600">Topics</div>
        </div>
      </div>

                          {answer.topics && answer.topics.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-medium text-gray-900 mb-2">Identified Topics</h4>
                              <div className="flex flex-wrap gap-2">
                                {answer.topics.map((topic, topicIndex) => (
                                  <span key={topicIndex} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
      </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Q&A Data Available</h3>
                  <p className="text-gray-600">Question and answer details are not available for this session.</p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
  );
};

export default SessionDetails;


