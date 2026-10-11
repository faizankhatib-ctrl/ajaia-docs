import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Upload,
  Folder,
  Share2,
  Trash2,
  ChevronDown,
  User,
  Activity,
  FileCode,
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  activeTab,
  setActiveTab,
  documents,
  currentDocId,
  onSelectDoc,
  onCreateDoc,
  onOpenImport,
  onDeleteDoc,
  currentUser,
  users,
  onSwitchUser,
  loading,
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const myDocs = documents.my_documents || [];
  const sharedDocs = documents.shared_with_me || [];
  const activeList = activeTab === 'my' ? myDocs : sharedDocs;

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <aside
      style={{
        ...sidebarContainer,
        width: isOpen ? '280px' : '0px',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      {/* Brand Header */}
      <div style={brandSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={logoIcon}>
            <FileText size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
              Ajaia Docs
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>AI-Native Workspace</div>
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div style={actionButtonsSection}>
        <button onClick={onCreateDoc} style={newDocBtnStyle}>
          <Plus size={18} />
          <span>New Document</span>
        </button>
        <button onClick={onOpenImport} style={importBtnStyle} title="Import .md or .txt file">
          <Upload size={16} />
          <span>Import (.md, .txt)</span>
        </button>
      </div>

      {/* Tabs: My Documents vs Shared with Me */}
      <div style={tabsContainer}>
        <button
          onClick={() => setActiveTab('my')}
          style={{
            ...tabBtnStyle,
            color: activeTab === 'my' ? '#4f46e5' : '#64748b',
            borderBottom: activeTab === 'my' ? '2px solid #4f46e5' : '2px solid transparent',
            fontWeight: activeTab === 'my' ? 600 : 500,
          }}
        >
          <Folder size={15} />
          <span>My Docs</span>
          <span style={countBadgeStyle(activeTab === 'my')}>{myDocs.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('shared')}
          style={{
            ...tabBtnStyle,
            color: activeTab === 'shared' ? '#4f46e5' : '#64748b',
            borderBottom: activeTab === 'shared' ? '2px solid #4f46e5' : '2px solid transparent',
            fontWeight: activeTab === 'shared' ? 600 : 500,
          }}
        >
          <Share2 size={15} />
          <span>Shared</span>
          <span style={countBadgeStyle(activeTab === 'shared')}>{sharedDocs.length}</span>
        </button>
      </div>

      {/* Document List */}
      <div style={docListContainer}>
        {loading ? (
          <div style={emptyMessageStyle}>Loading documents...</div>
        ) : activeList.length === 0 ? (
          <div style={emptyStateBox}>
            <FileCode size={28} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#475569' }}>
              {activeTab === 'my' ? 'No documents yet' : 'Nothing shared yet'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', textAlign: 'center' }}>
              {activeTab === 'my'
                ? 'Create a new document or import a file to start writing.'
                : 'Switch users or have another user share a document with you.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {activeList.map((d) => {
              const isActive = d.id === currentDocId;
              return (
                <div
                  key={d.id}
                  onClick={() => onSelectDoc(d.id)}
                  style={{
                    ...docItemStyle,
                    backgroundColor: isActive ? '#eef2ff' : 'transparent',
                    color: isActive ? '#4338ca' : '#1e293b',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={docItemTitleStyle}>
                      {d.title || 'Untitled Document'}
                    </div>
                    <div style={docItemSubtext}>
                      {activeTab === 'shared' ? (
                        <span>by {d.owner_name}</span>
                      ) : (
                        <span>Updated {formatDate(d.updated_at)}</span>
                      )}
                    </div>
                  </div>

                  {activeTab === 'my' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDoc(d.id);
                      }}
                      style={docDeleteActionBtn}
                      title="Delete document"
                    >
                      <Trash2 size={14} color="#94a3b8" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Switcher Footer */}
      <div style={userFooterContainer}>
        <div
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          style={userCardStyle}
          title="Switch demo user"
        >
          <div style={avatarStyle(currentUser?.avatar_color || '#6366f1')}>
            {(currentUser?.name || 'U')[0]}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.name || 'Demo User'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.email || ''}
            </div>
          </div>
          <ChevronDown size={16} color="#64748b" />
        </div>

        {/* Dropdown menu */}
        {showUserDropdown && (
          <div style={userDropdownMenu}>
            <div style={dropdownHeaderStyle}>Switch Demo User</div>
            {users.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  onSwitchUser(u.id);
                  setShowUserDropdown(false);
                }}
                style={{
                  ...userDropdownItem,
                  backgroundColor: u.id === currentUser?.id ? '#f1f5f9' : 'transparent',
                }}
              >
                <div style={avatarStyle(u.avatar_color, 24)}>
                  {u.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{u.email}</div>
                </div>
                {u.id === currentUser?.id && <span style={activeDot} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

const sidebarContainer = {
  backgroundColor: '#ffffff',
  borderRight: '1px solid #e2e8f0',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  transition: 'width 0.2s ease, opacity 0.15s ease',
  overflow: 'hidden',
  flexShrink: 0,
  zIndex: 20,
};

const brandSection = {
  padding: '1.25rem 1.25rem 1rem 1.25rem',
  borderBottom: '1px solid #f1f5f9',
};

const logoIcon = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  backgroundColor: '#4f46e5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const actionButtonsSection = {
  padding: '1rem 1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const newDocBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.625rem 1rem',
  borderRadius: '8px',
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  fontWeight: 600,
  fontSize: '0.875rem',
  boxShadow: '0 1px 2px 0 rgba(79, 70, 229, 0.25)',
};

const importBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#334155',
  fontWeight: 500,
  fontSize: '0.825rem',
};

const tabsContainer = {
  display: 'flex',
  borderBottom: '1px solid #e2e8f0',
  padding: '0 1.25rem',
};

const tabBtnStyle = {
  flex: 1,
  padding: '0.6rem 0.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  fontSize: '0.825rem',
  transition: 'all 0.15s ease',
};

const countBadgeStyle = (active) => ({
  fontSize: '0.7rem',
  padding: '0.1rem 0.4rem',
  borderRadius: '9999px',
  backgroundColor: active ? '#e0e7ff' : '#f1f5f9',
  color: active ? '#4338ca' : '#64748b',
});

const docListContainer = {
  flex: 1,
  overflowY: 'auto',
  padding: '0.75rem 0.75rem',
};

const emptyMessageStyle = {
  textAlign: 'center',
  color: '#94a3b8',
  fontSize: '0.825rem',
  padding: '2rem 1rem',
};

const emptyStateBox = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2.5rem 1rem',
};

const docItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.6rem 0.75rem',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'background 0.12s ease',
};

const docItemTitleStyle = {
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const docItemSubtext = {
  fontSize: '0.725rem',
  color: '#94a3b8',
  marginTop: '2px',
};

const docDeleteActionBtn = {
  padding: '0.25rem',
  borderRadius: '4px',
  opacity: 0.6,
  transition: 'opacity 0.15s ease',
};

const userFooterContainer = {
  borderTop: '1px solid #e2e8f0',
  padding: '0.75rem 1rem',
  position: 'relative',
  backgroundColor: '#ffffff',
};

const userCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  padding: '0.5rem',
  borderRadius: '8px',
  cursor: 'pointer',
  backgroundColor: '#f8fafc',
  border: '1px solid #f1f5f9',
};

const avatarStyle = (color, size = 30) => ({
  width: `${size}px`,
  height: `${size}px`,
  borderRadius: '50%',
  backgroundColor: color,
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: `${Math.round(size * 0.42)}px`,
  flexShrink: 0,
});

const userDropdownMenu = {
  position: 'absolute',
  bottom: '100%',
  left: '0.75rem',
  right: '0.75rem',
  marginBottom: '0.5rem',
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  padding: '0.5rem',
  zIndex: 100,
};

const dropdownHeaderStyle = {
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: '#94a3b8',
  padding: '0.35rem 0.5rem',
};

const userDropdownItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem',
  borderRadius: '6px',
  cursor: 'pointer',
};

const activeDot = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
};
