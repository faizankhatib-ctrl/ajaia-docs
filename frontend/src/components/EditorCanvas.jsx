import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import EditorToolbar from './EditorToolbar';
import { Lock } from 'lucide-react';

export default function EditorCanvas({
  doc,
  onContentChange,
  isReadOnly,
}) {
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
    ],
    content: doc?.content || '',
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return;
      const html = editor.getHTML();
      onContentChange(html);
    },
  });

  // When doc ID changes or content changes from an external source, update editor
  useEffect(() => {
    if (editor && doc) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== doc.content) {
        isUpdatingRef.current = true;
        editor.commands.setContent(doc.content || '<p></p>', false);
        isUpdatingRef.current = false;
      }
    }
  }, [doc?.id, doc?.content, editor]);

  // Update editable mode when permission changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  return (
    <div style={editorWrapperStyle}>
      <EditorToolbar editor={editor} isReadOnly={isReadOnly} />

      {/* Canvas scroll container */}
      <div style={canvasScrollContainer}>
        {isReadOnly && (
          <div style={readOnlyBannerStyle}>
            <Lock size={15} />
            <span>You have view-only access to this document. Contact the owner ({doc?.owner?.name}) to request editing permissions.</span>
          </div>
        )}

        {/* Paper Sheet */}
        <div style={paperSheetStyle}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

const editorWrapperStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 60px)',
  backgroundColor: '#f1f5f9',
  overflow: 'hidden',
};

const canvasScrollContainer = {
  flex: 1,
  overflowY: 'auto',
  padding: '2rem 1.5rem 4rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const readOnlyBannerStyle = {
  width: '100%',
  maxWidth: '820px',
  marginBottom: '1rem',
  padding: '0.625rem 1rem',
  borderRadius: '8px',
  backgroundColor: '#fffbeb',
  border: '1px solid #fef3c7',
  color: '#b45309',
  fontSize: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontWeight: 500,
};

const paperSheetStyle = {
  width: '100%',
  maxWidth: '820px',
  minHeight: '850px',
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05), 0 10px 25px -5px rgba(15, 23, 42, 0.05)',
  borderRadius: '4px',
  padding: '3.5rem 4rem',
  transition: 'box-shadow 0.2s ease',
  boxSizing: 'border-box',
};
