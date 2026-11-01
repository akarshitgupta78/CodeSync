import React from 'react';
import { Play, Terminal, Clock, CheckCircle2, AlertTriangle, XCircle, RotateCcw } from 'lucide-react';
import { ExecutionResult } from '../../services/workspace';

interface ExecutionPanelProps {
  onRun: () => void;
  isRunning: boolean;
  result: ExecutionResult | null;
  language: string;
  onLanguageChange: (lang: string) => void;
  onClear: () => void;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  onRun,
  isRunning,
  result,
  language,
  onLanguageChange,
  onClear,
}) => {
  return (
    <div className="h-64 border-t border-dark-600 bg-dark-900 flex flex-col">
      {/* Top action bar */}
      <div className="h-10 bg-dark-800 border-b border-dark-600 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-accent-blue" />
            <span>Terminal Output</span>
          </div>

          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-dark-900 text-xs border border-dark-600 rounded px-2 py-0.5 text-slate-200 focus:outline-none focus:border-accent-blue"
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript (Node.js)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <div className="flex items-center gap-3 text-xs mr-2">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                {result.executionTimeMs}ms
              </span>

              {result.status === 'SUCCESS' && (
                <span className="flex items-center gap-1 text-accent-green font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Exit Code: {result.exitCode}
                </span>
              )}
              {result.status === 'TIMED_OUT' && (
                <span className="flex items-center gap-1 text-accent-orange font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Timed Out
                </span>
              )}
              {result.status === 'ERROR' && (
                <span className="flex items-center gap-1 text-red-400 font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  Exit Code: {result.exitCode}
                </span>
              )}
            </div>
          )}

          <button
            onClick={onClear}
            title="Clear output"
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-dark-700 rounded transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border border-accent-green/40 rounded text-xs font-semibold transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-pulse' : ''}`} />
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* Console output display */}
      <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-dark-900 selection:bg-accent-blue/20">
        {isRunning && (
          <div className="text-slate-400 flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-accent-blue"></span>
            Executing code inside isolated sandbox container...
          </div>
        )}

        {!isRunning && !result && (
          <div className="text-slate-500 italic">
            Click "Run Code" to execute script in an isolated container.
          </div>
        )}

        {result && (
          <div className="space-y-2">
            {result.stdout && (
              <pre className="text-slate-200 whitespace-pre-wrap">{result.stdout}</pre>
            )}
            {result.stderr && (
              <pre className="text-red-400 whitespace-pre-wrap">{result.stderr}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
