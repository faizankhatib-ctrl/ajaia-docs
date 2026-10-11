import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import EditorCanvas from './components/EditorCanvas';
import ShareModal from './components/ShareModal';
import ImportModal from './components/ImportModal';
import {
  fetchUsers,
  fetchDocuments,
  fetchDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getStoredUserId,
  setStoredUserId,
} from './api';
import { FilePlus, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUserId, setCurrentUserId] = useState(getStoredUserId());
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState({ my_documents: [], shared_with_me: [] });
  const [currentDoc, setCurrentDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('my');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // States
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingDocDetail, setLoadingDocDetail] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);

  // Autosave debounce timer ref
  const autosaveTimerRef = useRef(null);
  const pendingUpdatesRef = useRef({ title: null, content: null });

  // Load demo users once
  useEffect(() => {
    fetchUsers()
      .then((userList) => {
        setUsers(userList);
      })
      .catch((err) => {
        console.error('Failed to load demo users:', err);
      });
  }, []);

  // Load documents whenever currentUserId changes
  const loadDocuments = useCallback(async (selectDocId = null) => {
    try {
      setLoadingDocs(true);
      setErrorMessage(null);
      const data = await fetchDocuments();
      setDocuments(data);

      const allDocs = [...data.my_documents, ...data.shared_with_me];

      if (selectDocId) {
        loadDocDetail(selectDocId);
      } else if (allDocs.length > 0) {
        // If currentDoc is still in the list, keep it; otherwise pick first
        const exists = currentDoc && allDocs.some((d) => d.id === currentDoc.id);
        if (!exists) {
          loadDocDetail(allDocs[0].id);
        }
      } else {
        setCurrentDoc(null);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoadingDocs(false);
    }
  }, [currentDoc]);

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, [currentUserId]);

  const loadDocDetail = async (docId) => {
    try {
      setLoadingDocDetail(true);
      setErrorMessage(null);
      const doc = await fetchDocument(docId);
      setCurrentDoc(doc);
    } catch (err) {
      setErrorMessage(`Cannot open document: ${err.message}`);
    } finally {
      setLoadingDocDetail(false);
    }
  };

  const handleSwitchUser = (newUserId) => {
    setStoredUserId(newUserId);
    setCurrentUserId(newUserId);
    setCurrentDoc(null);
    setSaveStatus('saved');
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
  };

  // Perform backend update
  const persistChanges = async (docId, updates) => {
    if (!docId) return;
    try {
      setSaveStatus('saving');
      const updated = await updateDocument(docId, updates);
      setSaveStatus('saved');

      // Update doc list metadata in background without disturbing active editing
      setDocuments((prev) => {
        const updateList = (list) =>
          list.map((d) => (d.id === docId ? { ...d, title: updated.title, updated_at: updated.updated_at } : d));
        return {
          my_documents: updateList(prev.my_documents),
          shared_with_me: updateList(prev.shared_with_me),
        };
      });
    } catch (err) {
      console.error('Autosave error:', err);
      setSaveStatus('error');
    }
  };

  // Queue debounced autosave
  const scheduleAutosave = (updates) => {
    if (!currentDoc || currentDoc.permission === 'view') return;

    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    setSaveStatus('saving');

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      const updatesToSend = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = { title: null, content: null };
      persistChanges(currentDoc.id, updatesToSend);
    }, 750);
  };

  const handleTitleChange = (newTitle) => {
    if (!currentDoc) return;
    setCurrentDoc((prev) => ({ ...prev, title: newTitle }));
    scheduleAutosave({ title: newTitle });
  };

  const handleContentChange = (newContent) => {
    if (!currentDoc) return;
    setCurrentDoc((prev) => ({ ...prev, content: newContent }));
    scheduleAutosave({ content: newContent });
  };

  const handleCreateDocument = async () => {
    try {
      setErrorMessage(null);
      const newDoc = await createDocument('Untitled Document', '<p></p>');
      // Reload documents and select new doc
      setActiveTab('my');
      await loadDocuments(newDoc.id);
    } catch (err) {
      setErrorMessage(`Failed to create document: ${err.message}`);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
    try {
      setErrorMessage(null);
      await deleteDocument(docId);
      if (currentDoc?.id === docId) {
        setCurrentDoc(null);
      }
      loadDocuments();
    } catch (err) {
      setErrorMessage(`Failed to delete document: ${err.message}`);
    }
  };

  const handleImportSuccess = (importedDoc) => {
    setActiveTab('my');
    loadDocuments(importedDoc.id);
  };

  const currentUserObj = users.find((u) => u.id === currentUserId) || {
    id: currentUserId,
    name: 'Demo User',
    email: 'user@ajaia.com',
    avatar_color: '#6366f1',
  };

  return (
    <div style={appContainerStyle}>
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        documents={documents}
        currentDocId={currentDoc?.id}
        onSelectDoc={loadDocDetail}
        onCreateDoc={handleCreateDocument}
        onOpenImport={() => setIsImportModalOpen(true)}
        onDeleteDoc={handleDeleteDocument}
        currentUser={currentUserObj}
        users={users}
        onSwitchUser={handleSwitchUser}
        loading={loadingDocs}
      />

      {/* Main Document Workspace */}
      <div style={mainWorkspaceStyle}>
        {errorMessage && (
          <div style={globalErrorBanner}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} style={{ marginLeft: 'auto', fontWeight: 600 }}>
              Dismiss
            </button>
          </div>
        )}

        {currentDoc ? (
          <>
            <TopBar
              doc={currentDoc}
              saveStatus={saveStatus}
              onTitleChange={handleTitleChange}
              onShareClick={() => setIsShareModalOpen(true)}
              onDeleteClick={() => handleDeleteDocument(currentDoc.id)}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              currentUserId={currentUserId}
            />

            {loadingDocDetail ? (
              <div style={loadingDocOverlay}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} color="#4f46e5" />
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading document...</span>
              </div>
            ) : (
              <EditorCanvas
                doc={currentDoc}
                onContentChange={handleContentChange}
                isReadOnly={currentDoc.permission === 'view'}
              />
            )}
          </>
        ) : (
          <div style={emptyWorkspaceContainer}>
            <div style={emptyCard}>
              <div style={emptyIconCircle}>
                <FilePlus size={36} color="#4f46e5" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                No Document Selected
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '380px', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Create a new document, choose an existing one from the sidebar, or import a Markdown / text file.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleCreateDocument} style={primaryActionBtn}>
                  Create Document
                </button>
                <button onClick={() => setIsImportModalOpen(true)} style={secondaryActionBtn}>
                  Import File (.md, .txt)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {isShareModalOpen && currentDoc && (
        <ShareModal
          doc={currentDoc}
          users={users}
          currentUserId={currentUserId}
          onClose={() => setIsShareModalOpen(false)}
          onShareUpdated={() => loadDocDetail(currentDoc.id)}
        />
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <ImportModal
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}

const appContainerStyle = {
  display: 'flex',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  backgroundColor: '#f8fafc',
};

const mainWorkspaceStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  minWidth: 0,
  position: 'relative',
};

const globalErrorBanner = {
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  padding: '0.625rem 1.25rem',
  fontSize: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  borderBottom: '1px solid #fecaca',
  zIndex: 100,
};

const loadingDocOverlay = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  backgroundColor: '#f8fafc',
};

const emptyWorkspaceContainer = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  backgroundColor: '#f8fafc',
};

const emptyCard = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: '3rem 2.5rem',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
};

const emptyIconCircle = {
  width: '72px',
  height: '72px',
  borderRadius: '50%',
  backgroundColor: '#eef2ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1.25rem',
};

const primaryActionBtn = {
  padding: '0.625rem 1.25rem',
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  fontWeight: 600,
  fontSize: '0.875rem',
  borderRadius: '8px',
};

const secondaryActionBtn = {
  padding: '0.625rem 1.25rem',
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  color: '#334155',
  fontWeight: 600,
  fontSize: '0.875rem',
  borderRadius: '8px',
};
