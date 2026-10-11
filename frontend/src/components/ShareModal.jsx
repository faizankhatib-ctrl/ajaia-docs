import React, { useState } from 'react';
import { X, UserPlus, Trash2, Shield, Eye, Edit3, Check } from 'lucide-react';
import { shareDocument, revokeShare } from '../api';

export default function ShareModal({ doc, users, currentUserId, onClose, onShareUpdated }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permission, setPermission] = useState('edit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!doc) return null;

  const isOwner = doc.owner_id === currentUserId;

  // Filter users that are eligible to share with (exclude owner)
  const availableUsers = users.filter((u) => u.id !== doc.owner_id);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a user to share with');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await shareDocument(doc.id, selectedUserId, permission);
      setSuccessMsg('Document shared successfully!');
      setSelectedUserId('');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (onShareUpdated) onShareUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (targetUserId) => {
    try {
      setLoading(true);
      setError(null);
      await revokeShare(doc.id, targetUserId);
      setSuccessMsg('Access revoked.');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (onShareUpdated) onShareUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
              Share "{doc.title || 'Untitled'}"
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Manage access permissions for this document
            </p>
          </div>
          <button onClick={onClose} style={closeBtnStyle} title="Close">
            <X size={20} color="#64748b" />
          </button>
        </div>

        {error && <div style={errorStyle}>{error}</div>}
        {successMsg && <div style={successStyle}><Check size={16} /> {successMsg}</div>}

        {/* Owner Info */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={labelStyle}>Document Owner</div>
          <div style={userRowStyle}>
            <div style={avatarStyle(doc.owner?.avatar_color || '#6366f1')}>
              {(doc.owner?.name || 'User')[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: '0.925rem', color: '#0f172a' }}>
                {doc.owner?.name || 'Owner'} {doc.owner_id === currentUserId && '(You)'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{doc.owner?.email}</div>
            </div>
            <span style={badgeStyle('#e0e7ff', '#3730a3')}>Owner</span>
          </div>
        </div>

        {/* Existing Shares */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={labelStyle}>Collaborators ({doc.shares?.length || 0})</div>
          {(!doc.shares || doc.shares.length === 0) ? (
            <div style={emptySharesStyle}>No collaborators yet. Share this document below.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {doc.shares.map((share) => (
                <div key={share.user_id} style={userRowStyle}>
                  <div style={avatarStyle('#0d9488')}>
                    {(share.name || 'U')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#0f172a' }}>
                      {share.name} {share.user_id === currentUserId && '(You)'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{share.email}</div>
                  </div>
                  <span style={badgeStyle(share.permission === 'edit' ? '#f0fdf4' : '#f8fafc', share.permission === 'edit' ? '#166534' : '#475569')}>
                    {share.permission === 'edit' ? 'Can edit' : 'Can view'}
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => handleRevoke(share.user_id)}
                      disabled={loading}
                      style={iconActionBtnStyle}
                      title="Revoke access"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Share Section (Owner Only) */}
        {isOwner ? (
          <form onSubmit={handleShare} style={addShareBoxStyle}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={16} color="#4f46e5" /> Invite Collaborator
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select a demo user...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>

              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                style={{ ...selectStyle, width: '130px' }}
              >
                <option value="edit">Can edit</option>
                <option value="view">Can view</option>
              </select>

              <button
                type="submit"
                disabled={loading || !selectedUserId}
                style={{
                  ...primaryBtnStyle,
                  opacity: loading || !selectedUserId ? 0.6 : 1,
                }}
              >
                {loading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </form>
        ) : (
          <div style={readOnlyNoticeStyle}>
            <Shield size={16} /> Only the document owner ({doc.owner?.name}) can manage sharing permissions.
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.45)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const modalStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '520px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  padding: '1.75rem',
  border: '1px solid #e2e8f0',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1.25rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #f1f5f9',
};

const closeBtnStyle = {
  padding: '0.25rem',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const labelStyle = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 700,
  color: '#64748b',
  marginBottom: '0.5rem',
};

const userRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.625rem 0.75rem',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #f1f5f9',
};

const avatarStyle = (color) => ({
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: color,
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: '0.875rem',
});

const badgeStyle = (bg, color) => ({
  backgroundColor: bg,
  color: color,
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: '0.2rem 0.6rem',
  borderRadius: '9999px',
  border: '1px solid rgba(0,0,0,0.05)',
});

const emptySharesStyle = {
  fontSize: '0.875rem',
  color: '#94a3b8',
  padding: '0.75rem',
  textAlign: 'center',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px dashed #e2e8f0',
};

const addShareBoxStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '1rem',
};

const selectStyle = {
  flex: 1,
  minWidth: '180px',
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  fontSize: '0.875rem',
  color: '#1e293b',
  outline: 'none',
};

const primaryBtnStyle = {
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '0.875rem',
};

const iconActionBtnStyle = {
  padding: '0.35rem',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const errorStyle = {
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  padding: '0.625rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.85rem',
  marginBottom: '1rem',
  border: '1px solid #fecaca',
};

const successStyle = {
  backgroundColor: '#f0fdf4',
  color: '#15803d',
  padding: '0.625rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.85rem',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  border: '1px solid #bbf7d0',
};

const readOnlyNoticeStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  fontSize: '0.85rem',
  color: '#64748b',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};
