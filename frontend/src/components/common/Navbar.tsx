import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Code2, LogOut, Share2, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  workspaceName?: string;
  onShare?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ workspaceName, onShare }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-white dark:bg-dark-800 border-b border-slate-200 dark:border-dark-600 px-4 flex items-center justify-between select-none transition-colors">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 text-accent-blue font-bold text-lg hover:opacity-90 transition">
          <div className="p-1.5 bg-accent-blue/10 rounded-lg border border-accent-blue/20">
            <Code2 className="w-5 h-5 text-accent-blue" />
          </div>
          <span>CodeSync</span>
        </Link>

        {workspaceName && (
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200 dark:border-dark-600 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Workspace:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{workspaceName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 rounded-lg border border-slate-200 dark:border-dark-600 bg-slate-100 dark:bg-dark-700 hover:bg-slate-200 dark:hover:bg-dark-600 text-slate-700 dark:text-slate-300 transition flex items-center justify-center shadow-sm"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-dark-700 hover:bg-slate-200 dark:hover:bg-dark-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-dark-600 rounded-md text-xs font-medium transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share Room
          </button>
        )}

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-md">
              <div className="w-6 h-6 rounded-full bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center text-accent-purple text-xs font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{user.username}</span>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-md transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
