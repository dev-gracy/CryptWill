import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Shield, Zap, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export default function InstantCheckin() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid or missing token.'); return; }

    api.get(`/checkin/instant/${token}`)
      .then(res => {
        setStatus('success');
        setMessage(res.data.data?.message || 'Check-in recorded successfully!');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Check-in failed. Token may be expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-text-primary">CryptWill</span>
        </div>

        {status === 'loading' && (
          <>
            <motion.div
              className="w-20 h-20 rounded-full border-4 border-brand border-t-transparent mx-auto mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <h2 className="text-xl font-bold text-text-primary mb-2">Verifying Check-in...</h2>
            <p className="text-text-secondary text-sm">Recording your Proof of Life on Stellar blockchain</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-24 h-24 rounded-full bg-success/15 border-2 border-success/40 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-success" />
            </motion.div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">You're Alive! ✅</h2>
            <p className="text-text-secondary mb-4">{message}</p>
            <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-sm text-text-secondary">
              <Zap className="w-4 h-4 text-success inline mr-2" />
              A Proof of Life (PoL) token has been minted on Stellar testnet. Your Dead Man's Switch has been reset.
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-24 h-24 rounded-full bg-danger/15 border-2 border-danger/40 flex items-center justify-center mx-auto mb-6"
            >
              <AlertTriangle className="w-12 h-12 text-danger" />
            </motion.div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Check-in Failed</h2>
            <p className="text-text-secondary mb-4">{message}</p>
            <p className="text-sm text-text-muted">
              The link may have expired or already been used. Please log in to your account and check in manually.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
