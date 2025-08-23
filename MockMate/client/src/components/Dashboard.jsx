import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const Dashboard = () => {
  const { token, user } = useContext(AuthContext);
  const [protectedMsg, setProtectedMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProtected = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/protected", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setProtectedMsg(data.message);
        } else {
          setError(data.error || "Not authorized");
        }
      } catch (err) {
        setError("Server error");
      }
    };
    fetchProtected();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-green-700 mb-4">Welcome, {user?.username}!</h2>
        {protectedMsg && <p className="text-lg text-gray-700 mb-2">{protectedMsg}</p>}
        {error && <div className="text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default Dashboard;
