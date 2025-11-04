import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts';

const Dashboard = () => {
  const { token, user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [performanceComparison, setPerformanceComparison] = useState(null);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insightsCache, setInsightsCache] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Check if dashboard data is cached in sessionStorage
        const cachedDashboard = sessionStorage.getItem(`dashboard_${user?.username}`);
        const lastSessionCount = sessionStorage.getItem(`lastSessionCount_${user?.username}`);
        
        if (cachedDashboard) {
          const parsedData = JSON.parse(cachedDashboard);
          
          // Check if new interviews were completed by comparing session counts
          const currentSessionCount = parsedData.dashboardData?.totalSessions || 0;
          
          if (lastSessionCount === null || currentSessionCount > parseInt(lastSessionCount)) {
            // Session count increased, need to fetch fresh data
            sessionStorage.removeItem(`dashboard_${user?.username}`);
            sessionStorage.removeItem(`lastSessionCount_${user?.username}`);
        } else {
          // Use cached data to show dashboard instantly
          setDashboardData(parsedData.dashboardData);
          setInsights(parsedData.insights);
          setPerformanceComparison(parsedData.performanceComparison);
          setInterviewHistory(parsedData.interviewHistory);
          setLoading(false);
          
          // Show refreshing indicator
          setIsRefreshing(true);
          
          // Fetch fresh data in background
          setTimeout(async () => {
            await fetchFreshData();
            setIsRefreshing(false);
          }, 100);
          return;
        }
        }
        
        // Fetch fresh data
        await fetchFreshData();
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    const fetchFreshData = async () => {
      try {
        // Check if insights are cached in localStorage
        const cachedInsights = localStorage.getItem(`insights_${user?.username}`);
        let insightsData = null;
        
        if (cachedInsights && insightsCache) {
          // Use cached insights instead of fetching new ones
          insightsData = insightsCache;
        } else {
          // Fetch insights only once or when needed
          const insightsRes = await fetch("/api/analytics/insights", { 
            headers: { Authorization: `Bearer ${token}` } 
          });
          if (insightsRes.ok) {
            insightsData = await insightsRes.json();
            setInsightsCache(insightsData);
            localStorage.setItem(`insights_${user?.username}`, JSON.stringify(insightsData));
          }
        }
        
        const [summaryRes, comparisonRes, historyRes] = await Promise.all([
          fetch("/api/analytics/summary", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/analytics/performance-comparison", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/analytics/history", { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (!summaryRes.ok) throw new Error("Failed to fetch dashboard data");
        
        const summaryData = await summaryRes.json();
        const comparisonData = comparisonRes.ok ? await comparisonRes.json() : null;
        const historyData = historyRes.ok ? await historyRes.json() : { sessions: [] };

        setDashboardData(summaryData);
        setInsights(insightsData);
        setPerformanceComparison(comparisonData);
        setInterviewHistory(historyData.sessions || []);

        // Store dashboard data in sessionStorage for instant loading
        const dashboardCache = {
          dashboardData: summaryData,
          insights: insightsData,
          performanceComparison: comparisonData,
          interviewHistory: historyData.sessions || [],
          timestamp: Date.now()
        };
        sessionStorage.setItem(`dashboard_${user?.username}`, JSON.stringify(dashboardCache));
        sessionStorage.setItem(`lastSessionCount_${user?.username}`, summaryData.totalSessions || 0);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token, user, insightsCache]);

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your AI-powered dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <h1 className="text-4xl font-bold gradient-text">
              Welcome back, {user?.username}! 👋
            </h1>
            {isRefreshing && (
              <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your AI-powered interview analytics dashboard is ready. Track your progress, discover insights, and accelerate your interview success.
          </p>
        </div>

        {/* AI Insights Section */}
        {insights && (
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">AI-Powered Insights</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Performance Trend */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-green-800">Performance Trend</h3>
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">
                  {insights.trends?.confidenceTrend === 'improving' ? '📈 Improving' : '📉 Declining'}
                </div>
                <p className="text-sm text-green-600">
                  {insights.trends?.improvementPercent > 0 ? '+' : ''}{insights.trends?.improvementPercent || 0}% change
                </p>
              </div>

              {/* Current Confidence */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-blue-800">Current Confidence</h3>
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  {((insights.trends?.recentAvgConfidence || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-blue-600">Recent average</p>
              </div>

              {/* Total Sessions */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-purple-800">Total Sessions</h3>
                </div>
                <div className="text-2xl font-bold text-purple-700 mb-1">
                  {insights.trends?.sessionCount || 0}
                </div>
                <p className="text-sm text-purple-600">All time</p>
              </div>

              {/* Achievements */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-yellow-800">Achievements</h3>
                </div>
                <div className="text-2xl font-bold text-yellow-700 mb-1">
                  {insights.achievements?.length || 0}
                </div>
                <p className="text-sm text-yellow-600">Unlocked</p>
              </div>
            </div>

            {/* AI Insights Cards - Redesigned */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Performance Insights */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="font-bold text-indigo-900 text-lg flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span>Performance Insights</span>
                  </h4>
                </div>
                <div className="space-y-4">
                  {(insights.insights || []).map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-indigo-100 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed flex-1">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Future Predictions */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="font-bold text-emerald-900 text-lg flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span>Future Predictions</span>
                  </h4>
                </div>
                <div className="space-y-4">
                  {(insights.predictions || []).map((prediction, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-emerald-100 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed flex-1">{prediction}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Refresh Insights Button */}
            {/* <div className="flex justify-end mb-4">
              <button
                onClick={async () => {
                  try {
                    const insightsRes = await fetch("/api/analytics/insights", { 
                      headers: { Authorization: `Bearer ${token}` } 
                    });
                    if (insightsRes.ok) {
                      const freshInsights = await insightsRes.json();
                      setInsights(freshInsights);
                      setInsightsCache(freshInsights);
                      localStorage.setItem(`insights_${user?.username}`, JSON.stringify(freshInsights));
                    }
                  } catch (err) {
                    console.error("Failed to refresh insights:", err);
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium">Refresh AI Insights</span>
              </button>
            </div> */}

            {/* Achievements */}
            {insights.achievements && insights.achievements.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6">
                <h4 className="font-semibold text-yellow-800 mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span>Recent Achievements</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-yellow-200">
                      <div className="text-2xl">{achievement.split(' - ')[0]}</div>
                      <div>
                        <div className="font-medium text-yellow-800">{achievement.split(' - ')[1]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Performance Overview */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Performance Overview</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-blue-700 mb-1">{dashboardData?.totalSessions || 0}</div>
              <div className="text-sm text-blue-600">Total Sessions (30d)</div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-green-700 mb-1">{dashboardData?.totalQuestions || 0}</div>
              <div className="text-sm text-green-600">Total Questions</div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-purple-700 mb-1">
                {dashboardData?.avgAnswerTimeSec ? Math.round(dashboardData.avgAnswerTimeSec) : 0}s
              </div>
              <div className="text-sm text-purple-600">Avg Answer Time</div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-orange-700 mb-1">
                {dashboardData?.overallConfidence ? Math.round(dashboardData.overallConfidence * 100) : 0}%
              </div>
              <div className="text-sm text-orange-600">Avg Confidence</div>
            </div>
          </div>

          {/* Performance Trends Chart */}
          {performanceComparison && performanceComparison.weeklyComparison.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Performance Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceComparison.weeklyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="avgConfidence" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.3}
                    name="Confidence" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#06B6D4" 
                    fill="#06B6D4" 
                    fillOpacity={0.3}
                    name="Sessions" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Interview History */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Recent Interview Sessions</h2>
            <Link 
              to="/analytics" 
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All →
            </Link>
          </div>
          
          {interviewHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Interview Sessions Yet</h3>
              <p className="text-gray-600 mb-4">Start your first mock interview to see your history here.</p>
              <Link 
                to="/generate" 
                className="btn-primary"
              >
                Start Your First Interview
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {interviewHistory.slice(0, 5).map((session, index) => (
                <div key={session._id} className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {session.role || "Mock Interview"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(session.createdAt).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {session.metrics?.totalQuestions || 0}
                          </div>
                          <div className="text-xs text-gray-600">Questions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {session.metrics?.avgAnswerTimeSec ? Math.round(session.metrics.avgAnswerTimeSec) : 0}s
                          </div>
                          <div className="text-xs text-gray-600">Avg Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {session.metrics?.overallConfidence ? Math.round(session.metrics.overallConfidence * 100) : 0}%
                          </div>
                          <div className="text-xs text-gray-600">Confidence</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {session.feedback ? '✅' : '⏳'}
                          </div>
                          <div className="text-xs text-gray-600">Feedback</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Link
                        to={`/analytics/session/${session._id}`}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors text-center"
                      >
                        View Details
                      </Link>
                      {session.feedback && (
                        <button
                          onClick={() => {
                            // Create a modal or navigate to feedback view
                            const feedbackWindow = window.open('', '_blank', 'width=800,height=600');
                            feedbackWindow.document.write(`
                              <html>
                                <head>
                                  <title>AI Feedback - ${session.role || 'Mock Interview'}</title>
                                  <style>
                                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                                    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                                    .header { text-align: center; margin-bottom: 30px; }
                                    .title { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
                                    .subtitle { color: #6b7280; font-size: 14px; }
                                    .feedback { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; white-space: pre-wrap; line-height: 1.6; color: #374151; }
                                    .close-btn { position: absolute; top: 15px; right: 20px; background: #ef4444; color: white; border: none; border-radius: 6px; padding: 8px 12px; cursor: pointer; font-size: 12px; }
                                  </style>
                                </head>
                                <body>
                                  <button class="close-btn" onclick="window.close()">Close</button>
                                  <div class="container">
                                    <div class="header">
                                      <div class="title">🎯 AI Feedback</div>
                                      <div class="subtitle">${session.role || 'Mock Interview'} • ${new Date(session.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div class="feedback">${typeof session.feedback === 'string' ? session.feedback : JSON.stringify(session.feedback, null, 2)}</div>
                                  </div>
                                </body>
                              </html>
                            `);
                          }}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors text-center"
                        >
                          View AI Feedback
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {interviewHistory.length > 5 && (
                <div className="text-center pt-4">
                  <Link 
                    to="/analytics" 
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View All {interviewHistory.length} Sessions →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              to="/generate" 
              className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:shadow-lg transition-all duration-200 hover:border-blue-300"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-700 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Generate Questions</h4>
                  <p className="text-sm text-gray-600">Create new interview questions</p>
                </div>
              </div>
            </Link>

            <Link 
              to="/practice" 
              className="group p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl hover:shadow-lg transition-all duration-200 hover:border-green-300"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto group-hover:bg-green-700 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Start Practice</h4>
                  <p className="text-sm text-gray-600">Begin mock interview</p>
                </div>
              </div>
            </Link>

            <Link 
              to="/analytics" 
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
                  <p className="text-sm text-gray-600">Detailed performance analysis</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
