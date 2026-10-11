// API Client for Ajaia Docs
const API_BASE = '/api';

export const getStoredUserId = () => {
  return localStorage.getItem('ajaia_user_id') || 'user_alice';
};

export const setStoredUserId = (userId) => {
  localStorage.setItem('ajaia_user_id', userId);
};

const getHeaders = (customHeaders = {}) => {
  const userId = getStoredUserId();
  return {
    'X-User-Id': userId,
    ...customHeaders,
  };
};

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to fetch demo users');
  const data = await res.json();
  return data.users;
}

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}/documents`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch documents');
  }
  return res.json();
}

export async function fetchDocument(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch document');
  }
  return res.json();
}

export async function createDocument(title = 'Untitled Document', content = '<p></p>') {
  const res = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create document');
  }
  return res.json();
}

export async function updateDocument(docId, { title, content }) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'PUT',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update document');
  }
  return res.json();
}

export async function deleteDocument(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete document');
  }
  return res.json();
}

export async function shareDocument(docId, targetUserId, permission = 'edit') {
  const res = await fetch(`${API_BASE}/documents/${docId}/share`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ user_id: targetUserId, permission }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to share document');
  }
  return res.json();
}

export async function revokeShare(docId, targetUserId) {
  const res = await fetch(`${API_BASE}/documents/${docId}/share/${targetUserId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to revoke access');
  }
  return res.json();
}

export async function importDocumentFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/documents/import`, {
    method: 'POST',
    headers: getHeaders(), // note: don't set Content-Type header so browser sets multipart boundary
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to import document');
  }
  return res.json();
}
