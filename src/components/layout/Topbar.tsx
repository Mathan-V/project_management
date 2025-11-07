import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Topbar: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="flex-shrink-0 flex h-16 bg-white shadow">
      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex items-center">
          {/* You can put your page title or logo here */}
        </div>

        {/* Right Section */}
        <div className="ml-4 flex items-center md:ml-6">
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-white px-3 py-2 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
