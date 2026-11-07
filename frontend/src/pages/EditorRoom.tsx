import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { CodeEditor } from '../components/editor/CodeEditor';
import { ExecutionPanel } from '../components/workspace/ExecutionPanel';
import { ActiveUsersList } from '../components/workspace/ActiveUsersList';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useYjsProvider } from '../hooks/useYjsProvider';
import { workspaceService, Workspace, ExecutionResult } from '../services/workspace';
import * as Y from 'yjs';
import { Check, FolderX, Plus } from 'lucide-react';
import { uint8ArrayToBase64 } from '../utils/binary';

const COLORS = [
  '#58a6ff', '#3fb950', '#bc8cff', '#d29922', '#f778ba', '#79c0ff', '#56d364'
];

export const EditorRoom: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);

  const [language, setLanguage] = useState('python');
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Assign consistent random color per user session
  const userColor = useMemo(() => {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }, []);

  const username = user?.username || 'Guest';

  // Only connect to Yjs if room is verified to exist
  const activeRoomId = notFound ? '' : (workspaceId || '');
  const { doc, awareness, synced, presenceUsers } = useYjsProvider(activeRoomId, username, userColor);

  useEffect(() => {
    if (!workspaceId) return;

    workspaceService.getWorkspaceById(workspaceId)
      .then((data) => {
        setWorkspace(data);
        setNotFound(false);
      })
      .catch((err) => {
        console.error('Failed to load workspace:', err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  // Periodic & event-driven CRDT snapshot saver to backend MongoDB
  useEffect(() => {
    if (!workspaceId || !synced || notFound) return;

    const saveSnapshotNow = () => {
      try {
        const state = Y.encodeStateAsUpdate(doc);
        // Never save empty or uninitialized document snapshots
        if (state.byteLength <= 4) {
          return;
        }
        const base64State = uint8ArrayToBase64(state);

        fetch(`/api/workspaces/${workspaceId}/snapshot?docName=main`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: JSON.stringify({ yjsStateBase64: base64State }),
          keepalive: true, // Ensures request completes even if user refreshes or closes the tab
        }).catch((e) => console.warn('Snapshot backup failed:', e));
      } catch (e) {
        console.error('Failed to create CRDT snapshot:', e);
      }
    };

    // Backup snapshot every 15 seconds
    const interval = setInterval(saveSnapshotNow, 15000);

    // Debounced snapshot 1.5s after local document edits
    let debounceTimer: any = null;
    const handleDocUpdate = (_: Uint8Array, origin: any) => {
      if (origin !== 'remote' && origin !== 'initial-sync') {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(saveSnapshotNow, 1500);
      }
    };
    doc.on('update', handleDocUpdate);

    // Save snapshot on browser refresh / page close
    window.addEventListener('beforeunload', saveSnapshotNow);

    return () => {
      clearInterval(interval);
      clearTimeout(debounceTimer);
      window.removeEventListener('beforeunload', saveSnapshotNow);
      doc.off('update', handleDocUpdate);
      saveSnapshotNow();
    };
  }, [workspaceId, doc, synced, notFound]);

  const handleRunCode = async () => {
    const yText = doc.getText('monaco');
    const rawCode = yText.toString();

    if (!rawCode.trim()) {
      setExecResult({
        stdout: '',
        stderr: 'Code editor is empty. Write some code before executing.',
        exitCode: 1,
        executionTimeMs: 0,
        status: 'ERROR',
      });
      return;
    }

    try {
      setExecuting(true);
      const result = await workspaceService.executeCode(language, rawCode);
      setExecResult(result);
    } catch (err: any) {
      setExecResult({
        stdout: '',
        stderr: err.response?.data?.message || err.message || 'Execution error.',
        exitCode: 1,
        executionTimeMs: 0,
        status: 'ERROR',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      setCreating(true);
      const created = await workspaceService.createWorkspace(newWorkspaceName.trim());
      setShowCreateModal(false);
      navigate(`/workspace/${created.id}`);
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex items-center justify-center transition-colors">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm font-medium">
          <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
          Connecting to CodeSync Workspace...
        </div>
      </div>
    );
  }

  // Room restriction: if room doesn't exist, show not found screen and prompt to create
  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex flex-col transition-colors">
        <Navbar />

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4 shadow-lg animate-fade-in">
            <FolderX className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace Not Found</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
            The room with ID <span className="font-mono font-semibold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">"{workspaceId}"</span> does not exist. Please create new workspace.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-accent-blue hover:bg-blue-600 text-white font-semibold text-xs rounded-lg transition flex items-center gap-2 shadow-lg shadow-accent-blue/20"
            >
              <Plus className="w-4 h-4 text-white" />
              Create New Workspace
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2.5 bg-slate-200 dark:bg-dark-700 hover:bg-slate-300 dark:hover:bg-dark-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg transition"
            >
              Go to Dashboard
            </button>
          </div>

          {/* Modal to create workspace directly from not found screen */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
              <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-600 rounded-xl p-6 max-w-md w-full shadow-2xl transition-colors">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Create New Collaborative Workspace</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                  Choose a project name to start a new collaborative room.
                </p>

                <form onSubmit={handleCreateWorkspace}>
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
                      onClick={() => setShowCreateModal(false)}
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
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-dark-900 flex flex-col overflow-hidden transition-colors">
      <Navbar workspaceName={workspace?.name} onShare={handleShare} />

      {/* Workspace Header Toolbar */}
      <div className="h-10 bg-white dark:bg-dark-800/90 border-b border-slate-200 dark:border-dark-600 px-4 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <ActiveUsersList users={presenceUsers} currentUsername={username} />

          {copied && (
            <span className="flex items-center gap-1 text-[11px] text-accent-green font-medium animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              Room link copied to clipboard!
            </span>
          )}
        </div>
      </div>

      {/* Editor & Execution Engine Split */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 relative overflow-hidden">
          <CodeEditor doc={doc} awareness={awareness} language={language} theme={isDark ? 'vs-dark' : 'vs'} />
        </div>

        <ExecutionPanel
          onRun={handleRunCode}
          isRunning={executing}
          result={execResult}
          language={language}
          onLanguageChange={setLanguage}
          onClear={() => setExecResult(null)}
        />
      </div>
    </div>
  );
};
