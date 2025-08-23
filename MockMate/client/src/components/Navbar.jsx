import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Link to="/" className="font-bold text-xl hover:text-blue-200">MockMate</Link>
        <Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link>
        <Link to="/generate" className="hover:text-blue-200">Practice</Link>

      </div>
      <div className="flex items-center space-x-4">
        {!token ? (
          <>
            <Link to="/register" className="hover:text-blue-200">Register</Link>
            <Link to="/login" className="hover:text-blue-200">Login</Link>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Hello, {user?.username}!</span>
            <button onClick={handleLogout} className="bg-blue-800 px-3 py-1 rounded hover:bg-blue-700">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
