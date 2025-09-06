import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const Goals = () => {
  const { token } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetValue: "",
    unit: "sessions",
    deadline: ""
  });

  useEffect(() => {
    loadGoals();
  }, [token]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/goals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch goals");
      const json = await res.json();
      setGoals(json.goals || []);
    } catch (e) {
      setError(e.message || "Error loading goals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          targetValue: Number(formData.targetValue),
        }),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      setFormData({ title: "", description: "", targetValue: "", unit: "sessions", deadline: "" });
      setShowForm(false);
      loadGoals();
    } catch (e) {
      setError(e.message || "Error creating goal");
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete goal");
      loadGoals();
    } catch (e) {
      setError(e.message || "Error deleting goal");
    }
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) return <div className="text-gray-600">Loading goals...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Goals & Progress</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Goal"}
        </button>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <div className="bg-white shadow rounded p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Goal</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Value
                </label>
                <input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="sessions">Sessions</option>
                  <option value="questions">Questions</option>
                  <option value="confidence">Confidence %</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Goal
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="bg-white shadow rounded p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">No Goals Set</h3>
          <p className="text-gray-600 mb-4">
            Set your first goal to start tracking your interview preparation progress!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = getProgressPercentage(goal.currentValue, goal.targetValue);
            const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !goal.isCompleted;
            
            return (
              <div key={goal._id} className={`bg-white shadow rounded p-6 ${isOverdue ? 'border-l-4 border-red-500' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-gray-600 mt-1">{goal.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteGoal(goal._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {progress.toFixed(1)}% complete
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600">
                  <div>
                    {goal.deadline && (
                      <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div>
                    {goal.isCompleted ? (
                      <span className="text-green-600 font-semibold">✓ Completed</span>
                    ) : (
                      <span className="text-blue-600">In Progress</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Goals;
