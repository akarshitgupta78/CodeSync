import React from 'react';
import { PresenceUser } from '../../hooks/useYjsProvider';
import { Users } from 'lucide-react';

interface ActiveUsersListProps {
  users: PresenceUser[];
  currentUsername?: string;
}

export const ActiveUsersList: React.FC<ActiveUsersListProps> = ({ users, currentUsername }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800/80 rounded-md border border-dark-600 text-xs">
      <div className="flex items-center gap-1.5 text-slate-400">
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
              style={{ borderColor: u.color, backgroundColor: `${u.color}25` }}
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-dark-900 cursor-pointer uppercase transition hover:scale-110 hover:z-10"
            >
              {u.username.charAt(0)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
