import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vault, Upload, Trash2, Download, Lock, FileText, Image, File,
  Eye, EyeOff, Key, ShieldCheck, AlertTriangle, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { generateEncryptionKey, encryptFileBuffer, decryptFileBuffer } from '../../utils/encryption';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function FileIcon({ type }) {
  if (type?.startsWith('image/')) return <Image className="w-5 h-5 text-purple-400" />;
  if (type?.includes('pdf')) return <FileText className="w-5 h-5 text-danger" />;
  return <File className="w-5 h-5 text-text-muted" />;
}

function KeyWarningBanner() {
  return (
    <div className="p-4 rounded-xl bg-warning/5 border border-warning/30 flex items-start gap-3">
      <Key className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-text-primary mb-1">🔑 Save Your Encryption Keys!</p>
        <p className="text-xs text-text-secondary">
          Files are encrypted client-side with AES-256. <strong>Your encryption key is shown once — save it immediately.</strong> 
          Without it, no one can decrypt your files (not even us).
        </p>
      </div>
    </div>
  );
}

function UploadZone({ onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [encKey, setEncKey] = useState(null);
  const [showKey, setShowKey] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const key = generateEncryptionKey();
    setEncKey(key);
    setShowKey(true);
    setUploading(true);

    try {
      // Read file as ArrayBuffer
      const buffer = await file.arrayBuffer();

      // Encrypt client-side
      const encryptedBlob = await encryptFileBuffer(buffer, key);

      // Build form data with encrypted blob
      const formData = new FormData();
      formData.append('file', encryptedBlob, `${file.name}.enc`);
      formData.append('fileName', file.name);
      formData.append('fileType', file.type);
      formData.append('fileSizeBytes', file.size);
      formData.append('encryptionKeyRef', `LOCAL_KEY_${Date.now()}`); // reference only

      const res = await api.post('/vault', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onUpload(res.data.data, key);
      toast.success('File encrypted and uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
      setEncKey(null);
      setShowKey(false);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive ? 'border-brand bg-brand/5 scale-105' : 'border-border hover:border-brand/50 hover:bg-brand/5'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
          {uploading ? (
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-brand" />
          )}
        </div>
        <p className="font-medium text-text-primary mb-1">
          {isDragActive ? 'Drop file here' : uploading ? 'Encrypting & uploading...' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-sm text-text-muted">
          Max 50MB · All files are AES-256 encrypted before upload
        </p>
      </div>

      {/* Show encryption key */}
      <AnimatePresence>
        {encKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-success/5 border border-success/30"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-success flex items-center gap-2">
                <Key className="w-4 h-4" />
                Your Encryption Key — Copy Now!
              </p>
              <button onClick={() => setEncKey(null)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className={`flex-1 text-xs font-mono bg-background px-3 py-2 rounded-lg overflow-hidden ${!showKey ? 'blur-sm select-none' : ''}`}>
                {encKey}
              </code>
              <button
                onClick={() => setShowKey(s => !s)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(encKey); toast.success('Key copied!'); }}
                className="text-brand hover:text-brand-hover transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-warning mt-2">⚠ This key will NOT be shown again. Save it in a password manager.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VaultPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decryptKey, setDecryptKey] = useState('');
  const [decrypting, setDecrypting] = useState(null);

  useEffect(() => {
    api.get('/vault').then(res => setFiles(res.data.data?.files || []))
      .catch(() => toast.error('Failed to load vault files'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = (newFile) => {
    setFiles(p => [newFile, ...p]);
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this file?')) return;
    try {
      await api.delete(`/vault/${id}`);
      setFiles(p => p.filter(f => f.id !== id));
      toast.success('File deleted from vault');
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const handleDecryptDownload = async (file) => {
    const key = prompt('Enter your encryption key for this file:');
    if (!key) return;
    setDecrypting(file.id);
    try {
      // Fetch encrypted blob from IPFS via our API
      const res = await api.get(`/vault/${file.id}/download`, { responseType: 'blob' });
      const encryptedBlob = res.data;
      const decryptedBlob = await decryptFileBuffer(encryptedBlob, key, file.fileType);

      // Download
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('File decrypted and downloaded!');
    } catch (err) {
      toast.error('Decryption failed. Check your key.');
    } finally {
      setDecrypting(null);
    }
  };

  const totalSize = files.reduce((sum, f) => sum + (f.fileSizeBytes || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Vault className="w-6 h-6 text-brand" />
          Digital Vault
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Securely store encrypted documents for your beneficiaries
        </p>
      </motion.div>

      <KeyWarningBanner />

      {/* Storage usage */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-background-elevated border border-border rounded-xl p-4 flex items-center gap-4"
        >
          <Lock className="w-5 h-5 text-brand flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-text-primary font-medium">{files.length} encrypted files</span>
              <span className="text-text-muted">{formatBytes(totalSize)} / 500 MB</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalSize / (500 * 1024 * 1024)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Upload zone */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <UploadZone onUpload={handleUpload} />
      </motion.div>

      {/* Files list */}
      {files.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          No files in vault yet. Upload your first document above.
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {files.map((file, i) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 }}
                className="bg-background-elevated border border-border rounded-xl px-5 py-4 flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-lg bg-background-secondary flex items-center justify-center flex-shrink-0">
                  <FileIcon type={file.fileType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">{file.fileName}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatBytes(file.fileSizeBytes)} · {new Date(file.uploadedAt).toLocaleDateString()} · 
                    <Lock className="w-3 h-3 inline mx-1 text-success" />
                    Encrypted
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleDecryptDownload(file)}
                    disabled={decrypting === file.id}
                    className="w-8 h-8 rounded-lg hover:bg-brand/10 flex items-center justify-center text-text-muted hover:text-brand transition-colors"
                    title="Decrypt & Download"
                  >
                    {decrypting === file.id
                      ? <div className="w-3.5 h-3.5 border border-brand border-t-transparent rounded-full animate-spin" />
                      : <Download className="w-4 h-4" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="w-8 h-8 rounded-lg hover:bg-danger/10 flex items-center justify-center text-text-muted hover:text-danger transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
