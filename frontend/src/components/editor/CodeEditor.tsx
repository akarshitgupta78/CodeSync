import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { Awareness } from 'y-protocols/awareness';

interface CodeEditorProps {
  doc: Y.Doc;
  awareness?: Awareness;
  language: string;
  theme?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ doc, awareness, language, theme = 'vs-dark' }) => {
  const editorRef = useRef<any>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Immediately calculate font glyph metrics
    try {
      monaco.editor.remeasureFonts();
    } catch (e) {
      // ignore
    }

    // When web fonts (e.g. Fira Code from Google Fonts) finish loading,
    // force Monaco to remeasure glyph widths to eliminate cursor placement drift.
    if (document.fonts) {
      document.fonts.ready.then(() => {
        try {
          monaco.editor.remeasureFonts();
          editor.layout();
        } catch (e) {
          // ignore
        }
      });
    }

    const yText = doc.getText('monaco');

    // Create MonacoBinding with full Yjs CRDT text and Awareness collaboration
    const binding = new MonacoBinding(
      yText,
      editor.getModel()!,
      new Set([editor]),
      awareness || null
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
  }, [doc, awareness]);

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
          fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
          fontSize: 14,
          lineHeight: 22,
          fontLigatures: true,
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
