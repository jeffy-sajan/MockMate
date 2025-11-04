import React, { useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? "text-black" : "text-gray-800 hover:text-black"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-white/20 backdrop-blur-md text-black">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <span className="text-xl font-bold"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
  <path fillRule="evenodd" d="M17.303 5.197A7.5 7.5 0 0 0 6.697 15.803a.75.75 0 0 1-1.061 1.061A9 9 0 1 1 21 10.5a.75.75 0 0 1-1.5 0c0-1.92-.732-3.839-2.197-5.303Zm-2.121 2.121a4.5 4.5 0 0 0-6.364 6.364.75.75 0 1 1-1.06 1.06A6 6 0 1 1 18 10.5a.75.75 0 0 1-1.5 0c0-1.153-.44-2.303-1.318-3.182Zm-3.634 1.314a.75.75 0 0 1 .82.311l5.228 7.917a.75.75 0 0 1-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 0 1-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 0 1-1.247-.606l.569-9.47a.75.75 0 0 1 .554-.68Z" clipRule="evenodd" />
</svg>
</span>
              </span>
              <span className="text-lg font-bold tracking-wide gradient-text">MockMate</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <NavLink to="/dashboard" className={navLinkClass} >Dashboard</NavLink>
            <NavLink to="/generate" className={navLinkClass}>Practice</NavLink>
            {/* <NavLink to="/mock-interview" className={navLinkClass}>Mock Interview</NavLink> */}
            {token && <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!token ? (
              <>
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-gray-800 hover:text-black">Login</Link>
                <Link to="/register" className="btn-primary">Get Started</Link>
              </>
            ) : (
              <>
                <span className="hidden lg:inline text-sm text-gray-800">Hello, {user?.username}!</span>
                <button onClick={handleLogout} className="px-3 py-2 text-sm font-medium text-gray-800 hover:text-black">Logout</button>
              </>
            )}
          </div>

          <button
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-800 hover:bg-white/20"
            aria-label="Toggle navigation menu"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="space-y-1 pt-2">
              <NavLink onClick={() => setIsOpen(false)} to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
              <NavLink onClick={() => setIsOpen(false)} to="/generate" className={navLinkClass}>Practice</NavLink>
              <NavLink onClick={() => setIsOpen(false)} to="/mock-interview" className={navLinkClass}>Mock Interview</NavLink>
              {token && <NavLink onClick={() => setIsOpen(false)} to="/profile" className={navLinkClass}>Profile</NavLink>}
            </div>
            <div className="mt-3 flex items-center gap-2">
              {!token ? (
                <>
                  <Link onClick={() => setIsOpen(false)} to="/login" className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white">Login</Link>
                  <Link onClick={() => setIsOpen(false)} to="/register" className="btn-primary">Get Started</Link>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
