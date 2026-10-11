import React from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Type,
} from 'lucide-react';

export default function EditorToolbar({ editor, isReadOnly }) {
  if (!editor) return null;

  const btnStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: isActive ? '#e0e7ff' : 'transparent',
    color: isActive ? '#4338ca' : '#475569',
    transition: 'all 0.1s ease',
    opacity: isReadOnly ? 0.5 : 1,
    cursor: isReadOnly ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={toolbarContainerStyle}>
      {/* Undo / Redo */}
      <div style={groupStyle}>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || isReadOnly}
          style={btnStyle(false)}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || isReadOnly}
          style={btnStyle(false)}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      <div style={dividerStyle} />

      {/* Headings */}
      <div style={groupStyle}>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          style={btnStyle(editor.isActive('paragraph') && !editor.isActive('heading'))}
          disabled={isReadOnly}
          title="Normal text"
        >
          <Type size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={btnStyle(editor.isActive('heading', { level: 1 }))}
          disabled={isReadOnly}
          title="Heading 1"
        >
          <Heading1 size={17} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={btnStyle(editor.isActive('heading', { level: 2 }))}
          disabled={isReadOnly}
          title="Heading 2"
        >
          <Heading2 size={17} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          style={btnStyle(editor.isActive('heading', { level: 3 }))}
          disabled={isReadOnly}
          title="Heading 3"
        >
          <Heading3 size={17} />
        </button>
      </div>

      <div style={dividerStyle} />

      {/* Formatting */}
      <div style={groupStyle}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={btnStyle(editor.isActive('bold'))}
          disabled={isReadOnly}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={btnStyle(editor.isActive('italic'))}
          disabled={isReadOnly}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={btnStyle(editor.isActive('underline'))}
          disabled={isReadOnly}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={btnStyle(editor.isActive('strike'))}
          disabled={isReadOnly}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          style={btnStyle(editor.isActive('code'))}
          disabled={isReadOnly}
          title="Inline code"
        >
          <Code size={16} />
        </button>
      </div>

      <div style={dividerStyle} />

      {/* Lists & Quotes */}
      <div style={groupStyle}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={btnStyle(editor.isActive('bulletList'))}
          disabled={isReadOnly}
          title="Bullet list"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={btnStyle(editor.isActive('orderedList'))}
          disabled={isReadOnly}
          title="Numbered list"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={btnStyle(editor.isActive('blockquote'))}
          disabled={isReadOnly}
          title="Blockquote"
        >
          <Quote size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          style={btnStyle(false)}
          disabled={isReadOnly}
          title="Horizontal line"
        >
          <Minus size={16} />
        </button>
      </div>

      {isReadOnly && (
        <div style={readOnlyBadge}>
          Read-only mode
        </div>
      )}
    </div>
  );
}

const toolbarContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.4rem 1rem',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  flexWrap: 'wrap',
  userSelect: 'none',
  minHeight: '44px',
};

const groupStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.15rem',
};

const dividerStyle = {
  width: '1px',
  height: '20px',
  backgroundColor: '#e2e8f0',
  margin: '0 0.35rem',
};

const readOnlyBadge = {
  marginLeft: 'auto',
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: '0.2rem 0.6rem',
  borderRadius: '9999px',
  backgroundColor: '#f1f5f9',
  color: '#64748b',
};
