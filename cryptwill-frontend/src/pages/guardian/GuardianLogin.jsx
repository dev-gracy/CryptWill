import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function GuardianLogin() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/guardians/login', form);
      const guardian = res.data.data?.guardian;
      // Store guardian session in auth store with GUARDIAN role
      login({ ...guardian, role: 'GUARDIAN' }, null);
      toast.success(`Welcome, ${guardian.fullName}!`);
      navigate('/guardian');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-background-elevated border border-border rounded-2xl p-8 max-w-md w-full"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand/15 flex items-center justify-center">
            <Shield className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Guardian Portal</h1>
            <p className="text-sm text-text-muted">CryptWill — Trusted Guardian Login</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="email"
              placeholder="Your email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Your password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-background border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-brand"
            />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-xl bg-brand text-white font-semibold flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Login to Guardian Portal
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center text-xs text-text-muted mt-6">
          Received an invitation?{' '}
          <button
            onClick={() => toast('Use the link in your invitation email to set up your account.')}
            className="text-brand hover:underline"
          >
            Accept invite first
          </button>
        </p>
      </motion.div>
    </div>
  );
}
