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

  if (loading) return <div className="text-gray-600">Loading session...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!session) return <div className="text-gray-600">Session not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Session Details</h1>
        <Link to="/analytics" className="text-blue-600 hover:underline">Back to Dashboard</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Date</div>
          <div className="text-lg">{new Date(session.createdAt).toLocaleString()}</div>
        </div>
        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Role</div>
          <div className="text-lg">{session.role || '-'}</div>
        </div>
        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Avg Time (s)</div>
          <div className="text-lg">{number(session.metrics?.avgAnswerTimeSec)}</div>
        </div>
      </div>

      <div className="bg-white shadow rounded p-4">
        <div className="font-semibold mb-2">AI Feedback</div>
        <div className="prose whitespace-pre-wrap">{session.feedback || '-'}</div>
      </div>

      <div className="bg-white shadow rounded p-4">
        <div className="font-semibold mb-2">Answers</div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-2 pr-6">Question</th>
                <th className="py-2 pr-6">Answer</th>
                <th className="py-2 pr-6">Duration (s)</th>
                <th className="py-2 pr-6">Confidence</th>
                <th className="py-2">Topics</th>
              </tr>
            </thead>
            <tbody>
              {(session.answers || []).map((a, idx) => (
                <tr key={idx} className="border-t align-top">
                  <td className="py-2 pr-6">{a.question}</td>
                  <td className="py-2 pr-6 whitespace-pre-wrap">{a.answer}</td>
                  <td className="py-2 pr-6">{number(a.durationSeconds)}</td>
                  <td className="py-2 pr-6">{number(a.confidenceScore)}</td>
                  <td className="py-2">{(a.topics || []).join(', ') || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;


