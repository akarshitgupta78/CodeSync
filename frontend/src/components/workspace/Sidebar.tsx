import React from 'react';
import { Files, Terminal, Users, Settings, Play } from 'lucide-react';

interface SidebarProps {
  activeTab: 'files' | 'users' | 'output' | 'settings';
  setActiveTab: (tab: 'files' | 'users' | 'output' | 'settings') => void;
  onRunCode: () => void;
  isRunning: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onRunCode,
  isRunning,
}) => {
  return (
    <aside className="w-12 bg-dark-900 border-r border-dark-600 flex flex-col items-center py-3 select-none justify-between">
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => setActiveTab('files')}
          title="Explorer (Files)"
          className={`p-2.5 rounded-lg transition ${
            activeTab === 'files'
              ? 'bg-accent-blue/15 text-accent-blue'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
          }`}
        >
          <Files className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('users')}
          title="Collaborators"
          className={`p-2.5 rounded-lg transition ${
            activeTab === 'users'
              ? 'bg-accent-blue/15 text-accent-blue'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
          }`}
        >
          <Users className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('output')}
          title="Terminal Output"
          className={`p-2.5 rounded-lg transition ${
            activeTab === 'output'
              ? 'bg-accent-blue/15 text-accent-blue'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
          }`}
        >
          <Terminal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onRunCode}
          disabled={isRunning}
          title="Run Code in Sandbox"
          className="p-2.5 bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border border-accent-green/30 rounded-lg transition disabled:opacity-50"
        >
          <Play className={`w-5 h-5 fill-current ${isRunning ? 'animate-pulse' : ''}`} />
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          title="Settings"
          className={`p-2.5 rounded-lg transition ${
            activeTab === 'settings'
              ? 'bg-accent-blue/15 text-accent-blue'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
