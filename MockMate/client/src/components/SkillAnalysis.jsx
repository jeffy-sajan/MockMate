import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SkillAnalysis = () => {
  const { token } = useContext(AuthContext);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/analytics/skill-gaps", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch skill analysis");
        const json = await res.json();
        if (!cancelled) setAnalysis(json);
      } catch (e) {
        if (!cancelled) setError(e.message || "Error loading skill analysis");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <div className="text-gray-600">Loading skill analysis...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!analysis) return <div className="text-gray-600">No analysis available</div>;

  const skillGapData = analysis.skillGaps.map(gap => ({
    topic: gap.topic,
    confidence: (gap.avgConfidence * 100).toFixed(1),
    questions: gap.totalQuestions,
    improvement: gap.improvement
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Skill Gap Analysis</h2>

      {/* Overall Performance Score */}
      <div className="bg-white shadow rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Overall Performance Score</h3>
          <div className="text-3xl font-bold text-blue-600">{analysis.overallScore}%</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${analysis.overallScore}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Based on {analysis.totalSessionsAnalyzed} recent sessions
        </p>
      </div>

      {/* Skill Gaps Chart */}
      {skillGapData.length > 0 && (
        <div className="bg-white shadow rounded p-6">
          <h3 className="text-lg font-semibold mb-4">Areas Needing Improvement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillGapData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="topic" type="category" width={120} />
              <Tooltip 
                formatter={(value, name) => [`${value}%`, 'Confidence']}
                labelFormatter={(label) => `Topic: ${label}`}
              />
              <Bar dataKey="confidence" fill="#ff6b6b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Skill Gaps List */}
      {analysis.skillGaps.length > 0 ? (
        <div className="bg-white shadow rounded p-6">
          <h3 className="text-lg font-semibold mb-4">Detailed Skill Gaps</h3>
          <div className="space-y-4">
            {analysis.skillGaps.map((gap, index) => (
              <div key={index} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg">{gap.topic}</h4>
                  <span className="text-sm text-gray-600">{gap.totalQuestions} questions</span>
                </div>
                <div className="flex items-center space-x-4 mb-2">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Current Confidence</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${gap.avgConfidence * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {(gap.avgConfidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Improvement Needed</div>
                    <div className="text-lg font-semibold text-orange-600">
                      +{gap.improvement}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded p-6">
          <h3 className="text-lg font-semibold mb-4">No Skill Gaps Identified</h3>
          <p className="text-gray-600">
            Great job! Your confidence levels are above 60% across all topics. 
            Keep practicing to maintain and improve your skills.
          </p>
        </div>
      )}

      {/* AI Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-white shadow rounded p-6">
          <h3 className="text-lg font-semibold mb-4">AI-Powered Recommendations</h3>
          <div className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <p className="text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillAnalysis;
