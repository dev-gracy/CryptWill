import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, CheckCircle, Flower2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PETALS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 6,
  duration: 7 + Math.random() * 7,
  size: 8 + Math.random() * 12,
  rotation: Math.random() * 360,
  opacity: 0.2 + Math.random() * 0.4,
  shape: i % 3,
}));

function Petal({ x, delay, duration, size, rotation, opacity, shape }) {
  const colors = ['#D4A57A', '#C8956B', '#B8836A', '#E8C4A8'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const petalPath =
    shape === 0 ? 'M10,0 C15,5 15,15 10,20 C5,15 5,5 10,0'
    : shape === 1 ? 'M10,0 C20,5 20,15 10,20 C0,15 0,5 10,0'
    : 'M10,5 L12,9 L17,9 L13,12 L15,17 L10,14 L5,17 L7,12 L3,9 L8,9 Z';
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 20 20"
      style={{ position: 'absolute', left: `${x}%`, top: -30, opacity, zIndex: 0 }}
      initial={{ y: -40, rotate: rotation, x: 0 }}
      animate={{ y: '110vh', rotate: rotation + 360, x: [0, 25, -15, 10, -25, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear', x: { duration: duration * 0.6, repeat: Infinity, ease: 'easeInOut' } }}
    >
      <path d={petalPath} fill={color} />
    </motion.svg>
  );
}

export default function GuardianInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleAccept = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await api.post('/guardians/accept-invite', { token, password });
      setDone(true);
      toast.success('Guardian role accepted!', { icon: '🌸' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    borderColor: focused === field ? '#c8956b' : 'rgba(200,149,107,0.3)',
    boxShadow: focused === field ? '0 0 0 4px rgba(200,149,107,0.12)' : 'none',
  });

  const inputBase = `w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 bg-white/70 backdrop-blur-sm
    text-[#3d2b1f] placeholder-[#b8a090] text-sm font-medium outline-none transition-all duration-300`;

  const bgPage = 'linear-gradient(135deg, #f5ebe0 0%, #edddd4 40%, #e8d5c4 70%, #f0e6d8 100%)';

  if (done) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center" style={{ background: bgPage }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {PETALS.map(p => <Petal key={p.id} {...p} />)}
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative z-10 max-w-md w-full mx-4"
        >
          <div
            className="rounded-3xl overflow-hidden text-center"
            style={{
              background: 'rgba(255,248,242,0.9)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 32px 80px rgba(120,70,40,0.18)',
              border: '1px solid rgba(212,165,122,0.4)',
            }}
          >
            <div className="h-3" style={{ background: 'linear-gradient(90deg, #c8956b, #d4a57a, #e8c4a8, #d4a57a, #c8956b)' }} />
            <div className="p-10">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #c8956b, #d4a57a)' }}
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <motion.h1
                className="text-2xl font-bold mb-2"
                style={{ color: '#3d2b1f', fontFamily: 'Georgia, serif' }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              >
                Welcome, Guardian
              </motion.h1>
              <motion.p
                className="text-sm mb-2" style={{ color: '#9a7060' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              >
                Your guardian account is ready. You can now log in to your portal.
              </motion.p>
              <motion.p
                className="text-xs italic mb-7" style={{ color: '#c4a898', fontFamily: 'Georgia, serif' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              >
                "Where flowers bloom, so does hope."
              </motion.p>
              <motion.button
                onClick={() => navigate('/guardian/login')}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-2xl font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, #c8956b 0%, #b8836a 50%, #d4a57a 100%)',
                  boxShadow: '0 8px 24px rgba(184,131,106,0.45)',
                }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              >
                Go to Guardian Login →
              </motion.button>
            </div>
            <div className="h-2" style={{ background: 'linear-gradient(90deg, #e8c4a8, #d4a57a, #c8956b, #d4a57a, #e8c4a8)' }} />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center" style={{ background: bgPage }}>
      {/* Blobs */}
      {[
        { cx: 10, cy: 10, r: 280, color: 'rgba(212,165,122,0.35)', delay: 0 },
        { cx: 75, cy: 5,  r: 260, color: 'rgba(200,149,107,0.28)', delay: 2 },
        { cx: 80, cy: 70, r: 320, color: 'rgba(232,196,168,0.40)', delay: 4 },
      ].map((b, i) => (
        <motion.div key={i} style={{ position: 'absolute', left: `${b.cx}%`, top: `${b.cy}%`, width: b.r, height: b.r, borderRadius: '50%', background: b.color, filter: 'blur(60px)', zIndex: 0 }}
          animate={{ scale: [1, 1.2, 0.9, 1.1, 1], opacity: [0.4, 0.6, 0.35, 0.55, 0.4] }}
          transition={{ duration: 8, delay: b.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PETALS.map(p => <Petal key={p.id} {...p} />)}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Glow ring */}
        <motion.div
          className="absolute -inset-1 rounded-3xl opacity-60"
          style={{ background: 'linear-gradient(135deg, #d4a57a, #c8956b, #e8c4a8, #d4a57a)', backgroundSize: '300% 300%' }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />

        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,248,242,0.88)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 32px 80px rgba(120,70,40,0.18), 0 8px 32px rgba(180,120,80,0.12)',
            border: '1px solid rgba(212,165,122,0.4)',
          }}
        >
          <div className="h-3 w-full" style={{ background: 'linear-gradient(90deg, #c8956b, #d4a57a, #e8c4a8, #d4a57a, #c8956b)' }} />

          <div className="p-8 pt-7">
            {/* Header */}
            <motion.div
              className="text-center mb-7"
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            >
              <div className="relative w-20 h-20 mx-auto mb-4">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  style={{ background: 'rgba(200,149,107,0.15)' }}
                >
                  {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                    <motion.div key={i} className="absolute w-2.5 h-2.5 rounded-full"
                      style={{
                        background: ['#d4a57a','#c8956b','#e8b89a','#b8836a','#d4b896','#c8956b'][i],
                        top: '50%', left: '50%',
                        transform: `rotate(${deg}deg) translateX(34px) translateY(-50%)`,
                        transformOrigin: '0 0',
                      }}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                    />
                  ))}
                </motion.div>
                <div className="absolute inset-2 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #c8956b, #d4a57a)' }}>
                  <Shield className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
              </div>

              <h1 className="text-2xl font-bold mb-1" style={{ color: '#3d2b1f', fontFamily: 'Georgia, serif' }}>
                Accept Guardian Role
              </h1>
              <p className="text-sm" style={{ color: '#9a7060' }}>
                Set a password to activate your guardian account
              </p>
            </motion.div>

            {/* Info banner */}
            <motion.div
              className="p-4 rounded-2xl mb-5 flex items-start gap-3"
              style={{ background: 'linear-gradient(135deg, rgba(200,149,107,0.12), rgba(212,165,122,0.08))', border: '1px solid rgba(200,149,107,0.25)' }}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            >
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#c8956b' }} />
              <p className="text-xs leading-relaxed" style={{ color: '#7a5a48' }}>
                You've been entrusted as a guardian on CryptWill. Your role is sacred — you'll help verify the passing of a loved one when the time comes.
              </p>
            </motion.div>

            {/* Form */}
            <motion.form onSubmit={handleAccept} className="space-y-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            >
              <motion.div animate={{ scale: focused === 'pw' ? 1.01 : 1 }} transition={{ duration: 0.2 }}>
                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: '#9a7060' }}>
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300"
                    style={{ color: focused === 'pw' ? '#c8956b' : '#b8a090' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('pw')}
                    onBlur={() => setFocused(null)}
                    required
                    className={`${inputBase} pr-11`}
                    style={inputStyle('pw')}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#b8a090' }}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              <motion.div animate={{ scale: focused === 'confirm' ? 1.01 : 1 }} transition={{ duration: 0.2 }}>
                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: '#9a7060' }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300"
                    style={{ color: focused === 'confirm' ? '#c8956b' : '#b8a090' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onFocus={() => setFocused('confirm')}
                    onBlur={() => setFocused(null)}
                    required
                    className={inputBase}
                    style={inputStyle('confirm')}
                  />
                </div>
                {confirm && password !== confirm && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs mt-1.5" style={{ color: '#c0614a' }}>
                    Passwords don't match
                  </motion.p>
                )}
              </motion.div>

              <motion.button
                type="submit"
                disabled={loading || (confirm && password !== confirm)}
                whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #c8956b 0%, #b8836a 50%, #d4a57a 100%)',
                  boxShadow: '0 8px 24px rgba(184,131,106,0.45)',
                }}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Activating account…
                    </motion.div>
                  ) : (
                    <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Accept & Become Guardian
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(180,130,90,0.2)' }} />
              <Flower2 className="w-4 h-4" style={{ color: '#c8956b', opacity: 0.6 }} />
              <div className="flex-1 h-px" style={{ background: 'rgba(180,130,90,0.2)' }} />
            </div>

            <p className="text-center text-[11px] italic" style={{ color: '#c4a898', fontFamily: 'Georgia, serif' }}>
              "The legacy we leave is the life we lead."
            </p>
          </div>

          <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #e8c4a8, #d4a57a, #c8956b, #d4a57a, #e8c4a8)' }} />
        </div>
      </motion.div>
    </div>
  );
}
