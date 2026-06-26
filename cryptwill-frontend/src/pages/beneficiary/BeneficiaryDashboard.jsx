import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Coins, Lock, FileText, Clock, CheckCircle, Shield,
  Download, Eye, Key, AlertTriangle, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { decryptFileBuffer } from '../../utils/encryption';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function BeneficiaryDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(null);

  useEffect(() => {
    api.get('/beneficiaries/my-portal').then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load inheritance data'))
      .finally(() => setLoading(false));
  }, []);

  const handleDecryptDownload = async (file) => {
    const key = prompt('Enter the encryption key for this file (provided by the owner):');
    if (!key) return;
    setDecrypting(file.id);
    try {
      const res = await api.get(`/vault/${file.id}/download`, { responseType: 'blob' });
      const decryptedBlob = await decryptFileBuffer(res.data, key, file.fileType);
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('File decrypted!');
    } catch {
      toast.error('Decryption failed. Check your key.');
    } finally {
      setDecrypting(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  const assets = data?.assets || [];
  const files = data?.vaultFiles || [];
  const status = data?.inheritanceStatus || 'PENDING';

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Users className="w-6 h-6 text-brand" />
          My Inheritance Portal
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Assets from {data?.ownerName}'s CryptWill
        </p>
      </motion.div>

      {/* Status banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl border p-5 ${
          status === 'EXECUTED' ? 'bg-success/5 border-success/30' :
          status === 'EXECUTING' ? 'bg-brand/5 border-brand/30' :
          status === 'TRIGGERED' ? 'bg-warning/5 border-warning/30' :
          'bg-background-elevated border-border'
        }`}
      >
        <div className="flex items-start gap-3">
          {status === 'EXECUTED'
            ? <CheckCircle className="w-5 h-5 text-success mt-0.5" />
            : status === 'TRIGGERED' || status === 'EXECUTING'
            ? <Clock className="w-5 h-5 text-warning mt-0.5" />
            : <Shield className="w-5 h-5 text-brand mt-0.5" />
          }
          <div>
            <p className="font-semibold text-text-primary">
              {status === 'EXECUTED' ? '✅ Inheritance Transferred' :
               status === 'EXECUTING' ? '⏳ Transfer In Progress' :
               status === 'TRIGGERED' ? '🔔 Guardian Vote In Progress' :
               '🔒 Plan Active — No Action Needed'}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              {status === 'EXECUTED' ? 'Your designated assets have been transferred to your Stellar wallet.' :
               status === 'TRIGGERED' ? 'Guardians are currently voting to confirm the inheritance trigger.' :
               `${data?.ownerName} is active. Assets will be transferred only if their dead man's switch triggers.`
              }
            </p>
          </div>
        </div>
      </motion.div>

      {/* Assigned assets */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Coins className="w-4 h-4 text-brand" />
          Assets Assigned to You
        </h2>
        {assets.length === 0 ? (
          <div className="text-center py-8 bg-background-elevated border border-border rounded-xl text-text-muted text-sm">
            No assets assigned yet
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map((assignment, i) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-background-elevated border border-border rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <Coins className="w-4.5 h-4.5 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary">{assignment.asset?.assetName}</p>
                  <p className="text-xs text-text-muted capitalize">{assignment.asset?.assetType?.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-text-primary text-sm">
                    {assignment.percentage}%
                  </p>
                  {assignment.asset?.estimatedValueUsd && (
                    <p className="text-xs text-text-muted">
                      ~${(parseFloat(assignment.asset.estimatedValueUsd) * assignment.percentage / 100).toLocaleString()}
                    </p>
                  )}
                </div>
                {assignment.asset?.releaseDay > 0 && (
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Calendar className="w-3 h-3" />
                    Day {assignment.asset.releaseDay}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Vault files */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand" />
          Encrypted Documents
        </h2>
        {files.length === 0 ? (
          <div className="text-center py-8 bg-background-elevated border border-border rounded-xl text-text-muted text-sm">
            No documents assigned yet
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file, i) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-background-elevated border border-border rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{file.fileName}</p>
                  <p className="text-xs text-text-muted">{formatBytes(file.fileSizeBytes)} · Encrypted</p>
                </div>
                {status === 'EXECUTED' ? (
                  <button
                    onClick={() => handleDecryptDownload(file)}
                    disabled={decrypting === file.id}
                    className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-hover font-medium transition-colors"
                  >
                    {decrypting === file.id
                      ? <div className="w-3.5 h-3.5 border border-brand border-t-transparent rounded-full animate-spin" />
                      : <Download className="w-3.5 h-3.5" />
                    }
                    Decrypt & Download
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Lock className="w-3 h-3" />
                    Locked
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Info footer */}
      <div className="p-4 rounded-xl bg-background-elevated border border-border text-sm text-text-secondary">
        <p className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          Your inheritance will only be released if the owner's dead man's switch is triggered and guardians vote to confirm. No action needed on your part until then.
        </p>
      </div>
    </div>
  );
}
