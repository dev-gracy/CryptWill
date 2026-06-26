import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, Clock, Shield, AlertTriangle, ThumbsUp, ThumbsDown,
  User, FileText, Info, Vote, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/common/Button';

export default function GuardianDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    api.get('/guardians/my-portal').then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load guardian portal'))
      .finally(() => setLoading(false));
  }, []);

  const handleVote = async (approve) => {
    if (!confirm(`Are you sure you want to ${approve ? 'APPROVE' : 'DENY'} this death confirmation?`)) return;
    setVoting(true);
    try {
      await api.post(`/guardians/${data?.guardianId}/vote`, {
        contractId: data?.contract?.id,
        vote: approve ? 'APPROVE' : 'DENY',
      });
      toast.success(`Vote cast: ${approve ? 'Approved' : 'Denied'}`);
      // Refresh
      const res = await api.get('/guardians/my-portal');
      setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cast vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  const contract = data?.contract;
  const hasVoted = data?.hasVoted;
  const voteData = data?.myVote;
  const votes = data?.votes || [];
  const approveCount = votes.filter(v => v.vote === 'APPROVE').length;
  const denyCount = votes.filter(v => v.vote === 'DENY').length;

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand" />
          Guardian Portal
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          You are a trusted guardian for {data?.ownerName}'s inheritance plan
        </p>
      </motion.div>

      {/* Owner info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-background-elevated border border-border rounded-2xl p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-brand/15 flex items-center justify-center text-brand font-bold text-lg">
            {data?.ownerName?.[0]?.toUpperCase() || 'O'}
          </div>
          <div>
            <p className="font-semibold text-text-primary">{data?.ownerName}</p>
            <p className="text-sm text-text-muted">{data?.ownerEmail}</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          This person has appointed you as a guardian for their digital crypto inheritance. 
          If they miss check-ins, you'll be asked to confirm their passing.
        </p>
      </motion.div>

      {/* Contract status */}
      {contract && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl border p-5 ${
            contract.status === 'TRIGGERED' ? 'bg-warning/5 border-warning/30' :
            contract.status === 'ACTIVE' ? 'bg-success/5 border-success/30' :
            'bg-background-elevated border-border'
          }`}
        >
          <div className="flex items-start gap-3">
            {contract.status === 'TRIGGERED' ? (
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
            ) : contract.status === 'ACTIVE' ? (
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold text-text-primary">
                {contract.status === 'TRIGGERED' ? '🚨 Vote Required — Death Confirmation' :
                 contract.status === 'ACTIVE' ? '✅ Contract Active — Owner is Alive' :
                 'Contract Status: ' + contract.status}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {contract.status === 'TRIGGERED'
                  ? `${data?.ownerName} has missed ${contract.missedCheckinCount} consecutive check-ins. Guardians must vote to confirm.`
                  : `Last check-in: ${contract.lastCheckinAt ? new Date(contract.lastCheckinAt).toLocaleDateString() : 'N/A'}`
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Voting section */}
      {contract?.status === 'TRIGGERED' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-background-elevated border border-border rounded-2xl p-6"
        >
          <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Vote className="w-5 h-5 text-brand" />
            Cast Your Vote
          </h2>

          {/* Vote progress */}
          <div className="mb-5 p-4 bg-background rounded-xl">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-text-secondary">Approvals: <span className="text-success font-semibold">{approveCount}</span></span>
              <span className="text-text-secondary">Required: <span className="text-brand font-semibold">{contract.guardianQuorum}</span></span>
              <span className="text-text-secondary">Denials: <span className="text-danger font-semibold">{denyCount}</span></span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{ width: `${(approveCount / contract.guardianQuorum) * 100}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">
              {contract.guardianQuorum - approveCount > 0
                ? `${contract.guardianQuorum - approveCount} more approvals needed`
                : '🎯 Quorum reached!'
              }
            </p>
          </div>

          {hasVoted ? (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              voteData?.vote === 'APPROVE' ? 'bg-success/10 border border-success/30' : 'bg-danger/10 border border-danger/30'
            }`}>
              {voteData?.vote === 'APPROVE'
                ? <ThumbsUp className="w-5 h-5 text-success" />
                : <ThumbsDown className="w-5 h-5 text-danger" />
              }
              <div>
                <p className="font-medium text-text-primary">Vote Cast</p>
                <p className="text-sm text-text-muted">
                  You voted {voteData?.vote} on {new Date(voteData?.votedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 text-sm text-text-secondary flex items-start gap-2">
                <Info className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <span>This vote is permanent and recorded on the Stellar blockchain. Only vote if you are certain of the owner's passing.</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={voting}
                  onClick={() => handleVote(false)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-danger/30 bg-danger/5 text-danger font-semibold hover:bg-danger/10 transition-colors disabled:opacity-50"
                >
                  <ThumbsDown className="w-5 h-5" />
                  Deny — Still Alive
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={voting}
                  onClick={() => handleVote(true)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-success/30 bg-success/5 text-success font-semibold hover:bg-success/10 transition-colors disabled:opacity-50"
                >
                  <ThumbsUp className="w-5 h-5" />
                  Confirm — Passed
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* All votes */}
      {votes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-background-elevated border border-border rounded-2xl p-5"
        >
          <h3 className="font-semibold text-text-primary mb-4">All Guardian Votes</h3>
          <div className="space-y-2">
            {votes.map((v, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  v.vote === 'APPROVE' ? 'bg-success/15' : 'bg-danger/15'
                }`}>
                  {v.vote === 'APPROVE'
                    ? <Check className="w-3.5 h-3.5 text-success" />
                    : <X className="w-3.5 h-3.5 text-danger" />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{v.guardian?.fullName}</p>
                  <p className="text-xs text-text-muted">{new Date(v.votedAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold ${v.vote === 'APPROVE' ? 'text-success' : 'text-danger'}`}>
                  {v.vote}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
