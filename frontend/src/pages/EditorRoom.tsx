import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { CodeEditor } from '../components/editor/CodeEditor';
import { ExecutionPanel } from '../components/workspace/ExecutionPanel';
import { ActiveUsersList } from '../components/workspace/ActiveUsersList';
import { useAuth } from '../context/AuthContext';
import { useYjsProvider } from '../hooks/useYjsProvider';
import { workspaceService, Workspace, ExecutionResult } from '../services/workspace';
import * as Y from 'yjs';
import { Check } from 'lucide-react';

const COLORS = [
  '#58a6ff', '#3fb950', '#bc8cff', '#d29922', '#f778ba', '#79c0ff', '#56d364'
];

export const EditorRoom: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('python');
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Assign consistent random color per user session
  const userColor = useMemo(() => {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }, []);

  const username = user?.username || 'Guest';

  // Initialize real-time CRDT provider
  const { doc, synced, presenceUsers } = useYjsProvider(workspaceId || '', username, userColor);

  useEffect(() => {
    if (!workspaceId) return;

    workspaceService.getWorkspaceById(workspaceId)
      .then((data) => setWorkspace(data))
      .catch((err) => {
        console.error('Failed to load workspace:', err);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  // Periodic CRDT snapshot saver to backend MongoDB
  useEffect(() => {
    if (!workspaceId || !synced) return;

    const interval = setInterval(() => {
      const state = Y.encodeStateAsUpdate(doc);
      const base64State = btoa(String.fromCharCode(...state));

      fetch(`/api/workspaces/${workspaceId}/snapshot?docName=main`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ yjsStateBase64: base64State }),
      }).catch((e) => console.warn('Snapshot backup failed:', e));
    }, 30000); // Snapshot every 30 seconds

    return () => clearInterval(interval);
  }, [workspaceId, doc, synced]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
          <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
          Connecting to CodeSync Workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark-900 flex flex-col overflow-hidden">
      <Navbar workspaceName={workspace?.name} onShare={handleShare} />

      {/* Workspace Header Toolbar */}
      <div className="h-10 bg-dark-800/90 border-b border-dark-600 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ActiveUsersList users={presenceUsers} currentUsername={username} />

          {copied && (
            <span className="flex items-center gap-1 text-[11px] text-accent-green font-medium animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              Room link copied to clipboard!
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-dark-700 border border-dark-600 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
            CRDT Connected
          </span>
        </div>
      </div>

      {/* Editor & Execution Engine Split */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 relative overflow-hidden">
          <CodeEditor doc={doc} language={language} theme="vs-dark" />
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
