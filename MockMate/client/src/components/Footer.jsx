import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-12 border-t border-white/10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <span className="text-xl font-bold">MM</span>
              </span>
              <span className="text-lg font-bold tracking-wide">MockMate</span>
            </div>
            <p className="mt-3 text-sm text-white/80 max-w-xs">
              AI-powered mock interviews and analytics to help you land your next role.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
              <li><Link to="/generate" className="hover:text-white">Practice</Link></li>
              <li><Link to="/mock-interview" className="hover:text-white">Mock Interview</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li><a className="hover:text-white" href="#about">About</a></li>
              <li><a className="hover:text-white" href="#careers">Careers</a></li>
              <li><a className="hover:text-white" href="#contact">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li><a className="hover:text-white" href="#privacy">Privacy Policy</a></li>
              <li><a className="hover:text-white" href="#terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="text-xs text-white/70">© {new Date().getFullYear()} MockMate. All rights reserved.</p>
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <a href="#twitter" className="px-3 py-2 hover:text-white">Twitter</a>
            <a href="#github" className="px-3 py-2 hover:text-white">GitHub</a>
            <a href="#linkedin" className="px-3 py-2 hover:text-white">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


