import React from "react";
import { Link, useLocation } from "react-router-dom";

export const Tabs: React.FC = () => {
  const location = useLocation();
  const activeTab = location.pathname;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-8">
          <Link
            to="/calendar"
            className={`py-4 border-b-2 font-medium transition-colors ${
              activeTab === '/calendar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Calendar
          </Link>
          <Link
            to="/timesheet"
            className={`py-4 border-b-2 font-medium transition-colors ${
              activeTab === '/timesheet'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Timesheet
          </Link>
        </div>
      </div>
    </div>
  );
};