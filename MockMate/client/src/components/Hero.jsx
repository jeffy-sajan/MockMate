import React from "react";
import { Link } from "react-router-dom";

const Stat = ({ number, label }) => (
  <div className="text-center">
    <div className="text-3xl lg:text-4xl font-bold text-purple-600 mb-2">{number}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

const Hero = () => {
  const stats = [
    { number: "10K+", label: "Questions Generated" },
    { number: "5K+", label: "Users Helped" },
    { number: "95%", label: "Success Rate" },
    { number: "50+", label: "Job Roles Covered" },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="relative bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-medium">AI-Powered Interview Prep</span>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Master Your Next <span className="gradient-text">Interview</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-prose">
                  Get personalized questions, practice with AI mock interviews, and receive instant feedback to land your dream job.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="inline-flex items-center rounded-md bg-purple-600 text-white px-5 py-3 text-sm font-semibold shadow-sm hover:bg-purple-700">
                  Start Practicing Now
                </Link>
                <Link to="/login" className="inline-flex items-center rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Sign in
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="p-8 rounded-2xl border border-purple-200 bg-white shadow-sm">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                    <span className="text-xl font-bold text-purple-700"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
  <path fillRule="evenodd" d="M17.303 5.197A7.5 7.5 0 0 0 6.697 15.803a.75.75 0 0 1-1.061 1.061A9 9 0 1 1 21 10.5a.75.75 0 0 1-1.5 0c0-1.92-.732-3.839-2.197-5.303Zm-2.121 2.121a4.5 4.5 0 0 0-6.364 6.364.75.75 0 1 1-1.06 1.06A6 6 0 1 1 18 10.5a.75.75 0 0 1-1.5 0c0-1.153-.44-2.303-1.318-3.182Zm-3.634 1.314a.75.75 0 0 1 .82.311l5.228 7.917a.75.75 0 0 1-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 0 1-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 0 1-1.247-.606l.569-9.47a.75.75 0 0 1 .554-.68Z" clipRule="evenodd" />
</svg></span>
                  </div>
                  <h3 className="text-xl font-semibold">Live Mock Interview</h3>
                  <p className="text-gray-600">Practicing Software Engineer Role</p>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium">Current Question:</p>
                    <p className="text-sm text-gray-600">"Tell me about a challenging project you worked on..."</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-gray-600">Recording...</span>
                    </div>
                    <span className="text-xs rounded border px-2 py-1 text-gray-600">Question 3/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <Stat key={i} number={s.number} label={s.label} />
            ))}
          </div>
        </div>
      </div>

      {/* Features Section (mirrors repo layout) */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Everything You Need to Succeed</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform provides comprehensive interview preparation tailored to your role and experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[{
              title: 'AI-Generated Questions',
              description: 'Personalized questions based on your role and career stage',
              icon: '🧠'
            }, {
              title: 'Voice Mock Interviews',
              description: 'Practice with real-time voice interaction and instant feedback',
              icon: '🎙️'
            }, {
              title: 'Targeted Practice',
              description: 'Focus on skills and topics where you need improvement',
              icon: '🎯'
            }, {
              title: 'Progress Tracking',
              description: 'Track performance over time with clean analytics and insights',
              icon: '📈'
            }].map((f, idx) => (
              <div key={idx} className="card text-center hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 mb-4 text-xl">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;


