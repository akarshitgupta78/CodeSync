import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { workspaceService, Workspace } from '../services/workspace';
import { Plus, Users, ArrowUpRight, FolderGit2, Calendar, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');

  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await workspaceService.getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      setCreating(true);
      const created = await workspaceService.createWorkspace(newWorkspaceName);
      setShowModal(false);
      setNewWorkspaceName('');
      navigate(`/workspace/${created.id}`);
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinRoomId.trim()) {
      navigate(`/workspace/${joinRoomId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-dark-800 to-dark-700 border border-dark-600 rounded-2xl p-8 mb-8 shadow-xl">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-xs font-semibold rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Collaborative CRDT Environment</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Your Workspaces</h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Create an isolated project or join an existing session to code together simultaneously with live keystrokes, remote cursors, and secure Docker execution.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white font-semibold text-xs rounded-lg transition flex items-center gap-2 shadow-lg shadow-accent-blue/20"
              >
                <Plus className="w-4 h-4" />
                Create New Workspace
              </button>

              <form onSubmit={handleJoinDirect} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste Room ID..."
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-blue"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-slate-200 text-xs font-medium rounded-lg transition"
                >
                  Join Room
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Workspace Cards */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Active Workspaces</h3>
          <span className="text-xs text-slate-500">{workspaces.length} Total</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-dark-800 border border-dark-600 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-dark-600 rounded-2xl bg-dark-800/40">
            <FolderGit2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-white">No workspaces found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Get started by creating your first collaborative workspace or join an existing room via an invite code.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition"
            >
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => navigate(`/workspace/${ws.id}`)}
                className="group relative bg-dark-800 hover:bg-dark-700 border border-dark-600 hover:border-accent-blue/50 rounded-xl p-5 cursor-pointer transition shadow-md hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-accent-blue/10 text-accent-blue border border-accent-blue/30">
                      {ws.currentUserRole}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-accent-blue transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <h4 className="text-base font-bold text-white mt-3 group-hover:text-accent-blue transition">
                    {ws.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Owner: {ws.ownerUsername}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-dark-600 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{ws.memberCount} Collaborators</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{new Date(ws.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-2">Create New Collaborative Workspace</h3>
              <p className="text-xs text-slate-400 mb-4">
                Choose a project name. You will be able to share the generated Room ID with collaborators.
              </p>

              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Workspace Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Distributed Algorithm Solver"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-accent-blue"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-slate-300 text-xs font-semibold rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create & Enter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
