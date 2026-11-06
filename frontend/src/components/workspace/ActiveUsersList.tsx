import React from 'react';
import { PresenceUser } from '../../hooks/useYjsProvider';
import { Users } from 'lucide-react';

interface ActiveUsersListProps {
  users: PresenceUser[];
  currentUsername?: string;
}

export const ActiveUsersList: React.FC<ActiveUsersListProps> = ({ users, currentUsername }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-dark-800/80 rounded-md border border-slate-200 dark:border-dark-600 text-xs transition-colors">
      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
        <Users className="w-3.5 h-3.5" />
        <span>Collaborators ({users.length}):</span>
      </div>

      <div className="flex items-center -space-x-1.5">
        {users.map((u, i) => {
          const isYou = u.username === currentUsername;
          return (
            <div
              key={i}
              title={`${u.username}${isYou ? ' (You)' : ''}`}
              style={{ borderColor: u.color }}
              className="w-6 h-6 rounded-full border-2 bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-dark-900 cursor-pointer uppercase transition hover:scale-110 hover:z-10"
            >
              {u.username.charAt(0)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
