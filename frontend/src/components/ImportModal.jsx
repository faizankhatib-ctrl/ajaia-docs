import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { importDocumentFile } from '../api';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXTS = ['.txt', '.md'];

export default function ImportModal({ onClose, onImportSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;
    const name = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTS.some((ext) => name.endsWith(ext));
    if (!hasValidExt) {
      setError(`Invalid file format. Only Markdown (.md) and Plain Text (.txt) files are supported.`);
      return false;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`File size exceeds 2MB limit (selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      setError(null);
      const newDoc = await importDocumentFile(selectedFile);
      if (onImportSuccess) {
        onImportSuccess(newDoc);
      }
      onClose();
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
              Import Document
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Upload an existing file to create a new editable document
            </p>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {error && (
          <div style={errorStyle}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            ...dropZoneStyle,
            borderColor: dragActive ? '#4f46e5' : '#cbd5e1',
            backgroundColor: dragActive ? '#f5f3ff' : '#f8fafc',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div style={uploadIconContainer}>
            <Upload size={28} color="#4f46e5" />
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <span style={{ fontWeight: 600, color: '#4f46e5' }}>Click to browse</span> or drag and drop
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
            Supported formats: <strong>.md</strong> (Markdown), <strong>.txt</strong> (Plain text)
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Maximum file size: 2 MB
          </div>
        </div>

        {/* Selected File Details */}
        {selectedFile && (
          <div style={fileDetailsCard}>
            <FileText size={20} color="#4f46e5" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
            </div>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
        )}

        {/* Footer actions */}
        <div style={footerStyle}>
          <button onClick={onClose} style={cancelBtnStyle} disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            style={{
              ...primaryBtnStyle,
              opacity: !selectedFile || loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Importing...' : 'Create Document from File'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  maxWidth: '480px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  padding: '1.75rem',
  border: '1px solid #e2e8f0',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1.25rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid #f1f5f9',
};

const closeBtnStyle = {
  padding: '0.25rem',
  borderRadius: '6px',
};

const dropZoneStyle = {
  border: '2px dashed #cbd5e1',
  borderRadius: '10px',
  padding: '2rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  marginBottom: '1rem',
};

const uploadIconContainer = {
  width: '54px',
  height: '54px',
  borderRadius: '50%',
  backgroundColor: '#eef2ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const fileDetailsCard = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  marginBottom: '1.25rem',
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '1rem',
};

const cancelBtnStyle = {
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  fontSize: '0.875rem',
  color: '#64748b',
  fontWeight: 500,
  backgroundColor: '#f1f5f9',
};

const primaryBtnStyle = {
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  padding: '0.5rem 1.25rem',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '0.875rem',
};

const errorStyle = {
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  padding: '0.625rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.825rem',
  marginBottom: '1rem',
  border: '1px solid #fecaca',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};
