import React, { useState, useEffect } from 'react';
import {
  FileText,
  Menu,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Share2,
  Trash2,
  Lock,
  Unlock,
  Download,
} from 'lucide-react';

export default function TopBar({
  doc,
  saveStatus,
  onTitleChange,
  onShareClick,
  onDeleteClick,
  onToggleSidebar,
  currentUserId,
}) {
  const [localTitle, setLocalTitle] = useState('');

  useEffect(() => {
    if (doc) {
      setLocalTitle(doc.title || 'Untitled Document');
    }
  }, [doc?.id, doc?.title]);

  if (!doc) return null;

  const isOwner = doc.owner_id === currentUserId;
  const isReadOnly = doc.permission === 'view';

  const handleTitleSubmit = () => {
    const trimmed = localTitle.trim();
    if (trimmed && trimmed !== doc.title) {
      onTitleChange(trimmed);
    } else {
      setLocalTitle(doc.title);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([doc.content || ''], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(doc.title || 'document').replace(/[^a-z0-9_-]/gi, '_')}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header style={topBarContainer}>
      <div style={leftSection}>
        <button onClick={onToggleSidebar} style={iconBtnStyle} title="Toggle sidebar">
          <Menu size={20} color="#475569" />
        </button>

        <div style={logoBadge}>
          <FileText size={20} color="#4f46e5" />
        </div>

        <div style={titleArea}>
          <input
            type="text"
            value={localTitle}
            disabled={isReadOnly}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleKeyDown}
            style={{
              ...titleInputStyle,
              cursor: isReadOnly ? 'default' : 'text',
            }}
            placeholder="Untitled Document"
            title={isReadOnly ? "Read-only document title" : "Click to rename document"}
          />

          <div style={metaSubtext}>
            {/* Status indicator */}
            {saveStatus === 'saving' && (
              <span style={{ ...statusBadge, color: '#d97706' }}>
                <Loader2 size={13} className="spin-animate" style={{ animation: 'spin 1s linear infinite' }} /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span style={{ ...statusBadge, color: '#16a34a' }}>
                <CheckCircle2 size={13} /> Saved to cloud
              </span>
            )}
            {saveStatus === 'error' && (
              <span style={{ ...statusBadge, color: '#dc2626' }}>
                <AlertCircle size={13} /> Save failed
              </span>
            )}

            {/* Permission badge */}
            <span style={permissionTagStyle(isOwner ? '#e0e7ff' : '#f1f5f9', isOwner ? '#4338ca' : '#475569')}>
              {isOwner ? 'Owner' : doc.permission === 'edit' ? 'Can edit' : 'View only'}
            </span>
          </div>
        </div>
      </div>

      <div style={rightSection}>
        {/* Export button */}
        <button onClick={handleDownload} style={actionBtnSecondary} title="Download document HTML">
          <Download size={16} />
          <span style={hideOnMobile}>Export</span>
        </button>

        {/* Share button */}
        <button onClick={onShareClick} style={shareBtnStyle} title="Manage sharing">
          <Share2 size={16} />
          <span>Share</span>
          {doc.shares && doc.shares.length > 0 && (
            <span style={shareCountBadge}>{doc.shares.length}</span>
          )}
        </button>

        {/* Delete button (Owner only) */}
        {isOwner && (
          <button onClick={onDeleteClick} style={deleteBtnStyle} title="Delete document">
            <Trash2 size={16} color="#ef4444" />
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}

const topBarContainer = {
  height: '60px',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 1.25rem',
  gap: '1rem',
  zIndex: 10,
};

const leftSection = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flex: 1,
  minWidth: 0,
};

const rightSection = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
};

const iconBtnStyle = {
  padding: '0.4rem',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const logoBadge = {
  width: '34px',
  height: '34px',
  borderRadius: '8px',
  backgroundColor: '#eef2ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const titleArea = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minWidth: 0,
};

const titleInputStyle = {
  fontSize: '1.05rem',
  fontWeight: 600,
  color: '#0f172a',
  border: '1px solid transparent',
  borderRadius: '4px',
  padding: '0.1rem 0.35rem',
  outline: 'none',
  backgroundColor: 'transparent',
  maxWidth: '380px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  transition: 'border 0.15s ease, background 0.15s ease',
};

const metaSubtext = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  paddingLeft: '0.35rem',
  marginTop: '-2px',
};

const statusBadge = {
  fontSize: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  fontWeight: 500,
};

const permissionTagStyle = (bg, color) => ({
  fontSize: '0.7rem',
  fontWeight: 600,
  backgroundColor: bg,
  color: color,
  padding: '0.1rem 0.45rem',
  borderRadius: '4px',
});

const actionBtnSecondary = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.45rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.85rem',
  fontWeight: 500,
  color: '#475569',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
};

const shareBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.45rem 0.875rem',
  borderRadius: '6px',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#ffffff',
  backgroundColor: '#4f46e5',
  boxShadow: '0 1px 2px 0 rgba(79, 70, 229, 0.2)',
};

const shareCountBadge = {
  fontSize: '0.72rem',
  backgroundColor: 'rgba(255, 255, 255, 0.25)',
  padding: '0.05rem 0.4rem',
  borderRadius: '9999px',
};

const deleteBtnStyle = {
  padding: '0.45rem',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fef2f2',
  border: '1px solid #fee2e2',
};

const hideOnMobile = {
  display: 'inline',
};
