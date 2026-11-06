import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { workspaceService, Workspace } from '../services/workspace';
import { Plus, Users, ArrowUpRight, FolderGit2, Calendar, Sparkles, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const confirmDelete = async () => {
    if (!workspaceToDelete) return;

    try {
      setDeleting(true);
      await workspaceService.deleteWorkspace(workspaceToDelete.id);
      setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceToDelete.id));
      setWorkspaceToDelete(null);
    } catch (err) {
      console.error('Failed to delete workspace:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleJoinDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = joinRoomId.trim();
    if (!roomId) return;

    try {
      setJoining(true);
      setJoinError(null);
      await workspaceService.getWorkspaceById(roomId);
      navigate(`/workspace/${roomId}`);
    } catch (err: any) {
      setJoinError(`Room "${roomId}" does not exist. No room has been created with this code.`);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex flex-col text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-white dark:bg-gradient-to-r dark:from-dark-800 dark:to-dark-700 border border-slate-200 dark:border-dark-600 rounded-2xl p-8 mb-8 shadow-sm dark:shadow-xl transition-colors">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-xs font-semibold rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Collaborative CRDT Environment</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Your Workspaces</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Create an isolated project or join an existing session to code together simultaneously with live keystrokes, remote cursors, and secure Docker execution.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white font-semibold text-xs rounded-lg transition flex items-center gap-2 shadow-lg shadow-accent-blue/20"
              >
                <Plus className="w-4 h-4 text-white" />
                Create New Workspace
              </button>

              <form onSubmit={handleJoinDirect} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste Room ID..."
                  value={joinRoomId}
                  onChange={(e) => {
                    setJoinRoomId(e.target.value);
                    if (joinError) setJoinError(null);
                  }}
                  className="px-3 py-2 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-accent-blue"
                />
                <button
                  type="submit"
                  disabled={joining}
                  className="px-3 py-2 bg-slate-100 dark:bg-dark-700 hover:bg-slate-200 dark:hover:bg-dark-600 border border-slate-200 dark:border-dark-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                  {joining ? 'Checking...' : 'Join Room'}
                </button>
              </form>
            </div>

            {joinError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-red-600 dark:text-red-400 animate-fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{joinError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setJoinError(null);
                    setShowModal(true);
                  }}
                  className="px-3 py-1 bg-accent-blue hover:bg-blue-600 text-white font-semibold rounded-lg transition shadow-sm shrink-0"
                >
                  Create New Workspace
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Workspace Cards */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Workspaces</h3>
          <span className="text-xs text-slate-500">{workspaces.length} Total</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-600 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-300 dark:border-dark-600 rounded-2xl bg-white/50 dark:bg-dark-800/40">
            <FolderGit2 className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">No workspaces found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
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
                className="group relative bg-white dark:bg-dark-800 hover:bg-slate-50 dark:hover:bg-dark-700 border border-slate-200 dark:border-dark-600 hover:border-accent-blue/50 rounded-xl p-5 cursor-pointer transition shadow-sm hover:shadow-md dark:shadow-md dark:hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-accent-blue/10 text-accent-blue border border-accent-blue/30">
                      {ws.currentUserRole}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {ws.currentUserRole === 'ADMIN' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWorkspaceToDelete(ws);
                          }}
                          title="Delete Workspace"
                          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-accent-blue transition" />
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-3 group-hover:text-accent-blue transition">
                    {ws.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Room: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{ws.id}</span> &bull; Owner: {ws.ownerUsername}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-dark-600 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{ws.memberCount} Collaborators</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    <span>{new Date(ws.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-600 rounded-xl p-6 max-w-md w-full shadow-2xl transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Create New Collaborative Workspace</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Choose a project name. You will be able to share the generated Room ID with collaborators.
              </p>

              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Workspace Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Distributed Algorithm Solver"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-accent-blue"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-dark-700 hover:bg-slate-200 dark:hover:bg-dark-600 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition"
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

        {/* Delete Confirmation Modal */}
        {workspaceToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-600 rounded-xl p-6 max-w-md w-full shadow-2xl transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Workspace</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{workspaceToDelete.name}"</span> (Room ID: <span className="font-mono text-accent-blue font-bold">{workspaceToDelete.id}</span>)? 
                This action is permanent and will remove all documents and collaborator access.
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setWorkspaceToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-dark-700 hover:bg-slate-200 dark:hover:bg-dark-600 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
