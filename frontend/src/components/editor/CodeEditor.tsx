import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';

interface CodeEditorProps {
  doc: Y.Doc;
  language: string;
  theme?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ doc, language, theme = 'vs-dark' }) => {
  const editorRef = useRef<any>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    const yText = doc.getText('monaco');

    // Create MonacoBinding to synchronize Monaco's model with Yjs CRDT text
    const binding = new MonacoBinding(
      yText,
      editor.getModel()!,
      new Set([editor])
    );
    bindingRef.current = binding;
  };

  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-dark-900">
      <Editor
        height="100%"
        width="100%"
        language={language}
        theme={theme}
        onMount={handleEditorDidMount}
        options={{
          automaticLayout: true,
          fontFamily: "'Fira Code', monospace",
          fontSize: 14,
          lineHeight: 22,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          tabSize: 2,
        }}
      />
    </div>
  );
};
