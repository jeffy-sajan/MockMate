import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiPost } from "../lib/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { ok, data } = await apiPost("/api/login", { email, password });
      if (ok) {
        login(data.token, { email: data.email, username: data.username });
        navigate("/generate");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="hidden lg:block">
          <h1 className="text-4xl font-bold leading-tight">Welcome back to <span className="gradient-text">MockMate</span></h1>
          <p className="mt-3 text-gray-600 max-w-prose">Sign in to continue practicing with AI-powered interviews and personalized analytics.</p>
        </div>
        <div className="card">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 mb-3">
              <span className="text-lg font-bold text-purple-700">MM</span>
            </div>
            <h2 className="text-2xl font-bold">Sign in</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" placeholder="you@example.com" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" placeholder="••••••••" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full">Sign in</button>
          </form>

          {error && <div className="text-red-600 mt-4 text-center text-sm">{error}</div>}

          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account? <Link to="/register" className="text-purple-700 hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Login;
