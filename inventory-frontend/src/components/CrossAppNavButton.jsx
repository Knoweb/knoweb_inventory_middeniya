import { useState, useEffect } from 'react';

const CrossAppNavButton = () => {
  const [loading, setLoading] = useState(false);

  const handleNavigateToDashboard = () => {
    // Navigate to Main SaaS Dashboard
    window.location.href = 'http://167.71.206.166:3000/dashboard';
  };

  // Simple loading state (optional - can be removed)
  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-5 h-5 bg-gray-300 rounded"></div>
        <div className="w-32 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <button
      onClick={handleNavigateToDashboard}
      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
      title="Return to Main Dashboard"
    >
      {/* Home/Dashboard Icon */}
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>

      {/* Button Text */}
      <span className="font-medium">Go to Main Dashboard</span>

      {/* Arrow Icon */}
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </button>
  );
};

export default CrossAppNavButton;
