import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SkillAnalysis from "./SkillAnalysis";
import Goals from "./Goals";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const number = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(2));

const AnalyticsDashboard = () => {
  const { token } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [sRes, hRes] = await Promise.all([
          fetch("/api/analytics/summary", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/analytics/history", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!sRes.ok) throw new Error("Failed to fetch summary");
        if (!hRes.ok) throw new Error("Failed to fetch history");
        const sJson = await sRes.json();
        const hJson = await hRes.json();
        if (!cancelled) {
          setSummary(sJson);
          setHistory(hJson.sessions || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Error loading analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const perDayRows = useMemo(() => {
    if (!summary?.perDay) return [];
    return Object.entries(summary.perDay)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, count]) => ({ date, count }));
  }, [summary]);

  // Prepare data for charts
  const performanceTrendData = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.map(session => ({
      date: new Date(session.createdAt).toLocaleDateString(),
      confidence: session.metrics?.overallConfidence || 0,
      avgTime: session.metrics?.avgAnswerTimeSec || 0,
      questions: session.metrics?.totalQuestions || 0
    }));
  }, [history]);

  const topicDistribution = useMemo(() => {
    if (!history || history.length === 0) return [];
    const topicCount = {};
    history.forEach(session => {
      session.answers?.forEach(answer => {
        answer.topics?.forEach(topic => {
          topicCount[topic] = (topicCount[topic] || 0) + 1;
        });
      });
    });
    return Object.entries(topicCount).map(([topic, count]) => ({
      name: topic,
      value: count
    }));
  }, [history]);

  const confidenceData = useMemo(() => {
    if (!history || history.length === 0) return [];
    const ranges = [
      { range: '0.0-0.2', min: 0, max: 0.2, count: 0 },
      { range: '0.2-0.4', min: 0.2, max: 0.4, count: 0 },
      { range: '0.4-0.6', min: 0.4, max: 0.6, count: 0 },
      { range: '0.6-0.8', min: 0.6, max: 0.8, count: 0 },
      { range: '0.8-1.0', min: 0.8, max: 1.0, count: 0 }
    ];
    
    history.forEach(session => {
      const confidence = session.metrics?.overallConfidence;
      if (confidence !== undefined) {
        ranges.forEach(range => {
          if (confidence >= range.min && confidence < range.max) {
            range.count++;
          }
        });
      }
    });
    
    return ranges;
  }, [history]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) return <div className="text-gray-600">Loading analytics...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const tabs = [
    { id: "overview", label: "Overview", component: "overview" },
    { id: "skills", label: "Skill Analysis", component: "skills" },
    { id: "goals", label: "Goals", component: "goals" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "skills":
        return <SkillAnalysis />;
      case "goals":
        return <Goals />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">Total Sessions (30d)</div>
          <div className="text-2xl font-semibold">{summary?.totalSessions ?? 0}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Total Questions</div>
          <div className="text-2xl font-semibold">{summary?.totalQuestions ?? 0}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Avg Answer Time (s)</div>
          <div className="text-2xl font-semibold">{number(summary?.avgAnswerTimeSec)}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Avg Confidence</div>
          <div className="text-2xl font-semibold">{number(summary?.overallConfidence)}</div>
        </div>
      </div>

      {/* Performance Trends Chart */}
      {performanceTrendData.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="confidence" stroke="#8884d8" strokeWidth={2} name="Confidence" />
              <Line type="monotone" dataKey="avgTime" stroke="#82ca9d" strokeWidth={2} name="Avg Time (s)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Distribution Pie Chart */}
        {topicDistribution.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Topic Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topicDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topicDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Confidence Distribution Bar Chart */}
        {confidenceData.some(d => d.count > 0) && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Confidence Level Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="font-semibold mb-2">Sessions by Day (30d)</div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-2 pr-6">Date</th>
                <th className="py-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {perDayRows.length === 0 ? (
                <tr><td className="py-2 text-gray-500" colSpan={2}>No activity yet</td></tr>
              ) : (
                perDayRows.map((r) => (
                  <tr key={r.date} className="border-t">
                    <td className="py-2 pr-6">{r.date}</td>
                    <td className="py-2">{r.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <div className="font-semibold mb-2">Interview History</div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-2 pr-6">Date</th>
                <th className="py-2 pr-6">Role</th>
                <th className="py-2 pr-6">Questions</th>
                <th className="py-2 pr-6">Avg Time (s)</th>
                <th className="py-2 pr-6">Confidence</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td className="py-2 text-gray-500" colSpan={6}>No sessions yet</td></tr>
              ) : (
                history.map((s) => (
                  <tr key={s._id} className="border-t">
                    <td className="py-2 pr-6">{new Date(s.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-6">{s.role || "-"}</td>
                    <td className="py-2 pr-6">{s.metrics?.totalQuestions ?? "-"}</td>
                    <td className="py-2 pr-6">{number(s.metrics?.avgAnswerTimeSec)}</td>
                    <td className="py-2 pr-6">{number(s.metrics?.overallConfidence)}</td>
                    <td className="py-2"><Link to={`/analytics/session/${s._id}`} className="text-blue-600 hover:underline">View</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </section>
  );
};

export default AnalyticsDashboard;


