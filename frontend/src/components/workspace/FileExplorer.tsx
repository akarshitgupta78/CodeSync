import React from 'react';
import { FileCode2, Plus, Folder } from 'lucide-react';

interface FileExplorerProps {
  files: string[];
  activeFile: string;
  onSelectFile: (file: string) => void;
  onAddFile: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFile,
  onSelectFile,
  onAddFile,
}) => {
  return (
    <div className="w-56 bg-dark-800 border-r border-dark-600 flex flex-col h-full select-none">
      <div className="p-3 border-b border-dark-600 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 text-accent-blue" />
          Workspace Files
        </span>
        <button
          onClick={onAddFile}
          title="New Document"
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-dark-700 rounded transition"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 py-2 overflow-y-auto space-y-0.5">
        {files.map((file) => {
          const isActive = file === activeFile;
          return (
            <button
              key={file}
              onClick={() => onSelectFile(file)}
              className={`w-full px-3 py-1.5 flex items-center gap-2 text-xs transition text-left ${
                isActive
                  ? 'bg-accent-blue/15 text-accent-blue font-semibold border-l-2 border-accent-blue'
                  : 'text-slate-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <FileCode2 className={`w-3.5 h-3.5 ${isActive ? 'text-accent-blue' : 'text-slate-500'}`} />
              <span className="truncate">{file}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
