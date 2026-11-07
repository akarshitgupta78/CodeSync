import React, { useRef, useEffect, useState } from 'react';
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
  const [editorReady, setEditorReady] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
  });

  // Track window & viewport changes (e.g. mobile virtual keyboard showing/hiding)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768 || 'ontouchstart' in window;
      setIsMobile(mobile);
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Manage MonacoBinding lifecycle whenever editor mounts or doc / awareness reference changes
  useEffect(() => {
    if (!editorReady || !editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // Clean up existing binding before creating a new one
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const yText = doc.getText('monaco');

    // Create MonacoBinding with full Yjs CRDT text synchronization (without remote cursor decorations)
    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      null
    );
    bindingRef.current = binding;

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [editorReady, doc, awareness]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    setEditorReady(true);

    const model = editor.getModel();
    if (model) {
      // Strictly enforce uniform LF line endings (\n) across all platforms (Windows laptop, Android phone, iOS)
      // This prevents Windows CRLF (\r\n) vs Mobile LF (\n) line ending mismatch and phantom lines
      model.setEOL(monaco.editor.EndOfLineSequence.LF);
    }

    // Immediately calculate font glyph metrics
    try {
      monaco.editor.remeasureFonts();
    } catch (e) {
      // ignore
    }

    // Force Monaco to remeasure glyph widths once custom fonts load
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
  };

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
          fontSize: isMobile ? 13 : 14,
          lineHeight: 22,
          fontLigatures: true,
          minimap: { enabled: !isMobile }, // Disable minimap on phone screens to prevent touch jumps & line offset distortion
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          tabSize: 2,
          wordWrap: 'off', // Ensure 1 physical code line is strictly 1 visual line on all devices
          // Virtual keyboard and mobile IME stabilization options:
          quickSuggestions: !isMobile,
          acceptSuggestionOnEnter: 'off', // Fixes mobile Gboard / soft keyboard double newline on Enter
          tabCompletion: 'off',
          folding: !isMobile,
          lineNumbersMinChars: 3,
          glyphMargin: false,
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
};
