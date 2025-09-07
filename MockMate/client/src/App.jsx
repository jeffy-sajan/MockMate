import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Register from "./components/Register";
import Login from "./components/Login";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import GenerateQuestions from "./components/GenerateQuestions";
import MockInterview from "./components/MockInterview";
import SessionDetails from "./components/SessionDetails";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/generate"
              element={
                <ProtectedRoute>
                  <GenerateQuestions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mock-interview"
              element={
                <ProtectedRoute>
                  <MockInterview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/session/:id"
              element={
                <ProtectedRoute>
                  <SessionDetails />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<div>Welcome to MockMate!</div>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;