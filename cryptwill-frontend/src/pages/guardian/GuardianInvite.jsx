import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function GuardianInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleAccept = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await api.post('/guardians/accept-invite', { token, password });
      setDone(true);
      toast.success('Guardian role accepted! You can now log in.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-background-elevated border border-border rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">You're a Guardian!</h1>
          <p className="text-text-secondary mb-6">
            You've accepted the guardian role. Log in to your guardian portal to get started.
          </p>
          <button
            onClick={() => navigate('/guardian/login')}
            className="w-full py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark transition-colors"
          >
            Go to Guardian Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-background-elevated border border-border rounded-2xl p-8 max-w-md w-full"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand/15 flex items-center justify-center">
            <Shield className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Accept Guardian Role</h1>
            <p className="text-sm text-text-muted">CryptWill — Trusted Guardian</p>
          </div>
        </div>

        <p className="text-text-secondary text-sm mb-6 p-4 bg-brand/5 border border-brand/20 rounded-xl">
          You've been invited to be a guardian on CryptWill. Set a password to create your guardian account and access the portal.
        </p>

        <form onSubmit={handleAccept} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Set a password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-background border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand"
            />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand"
          />
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Accepting...' : 'Accept & Create Account'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
