import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, KeyRound, Flower2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

/* ── Floating petal shapes ── */
const PETAL_COLORS = ['#D4A57A', '#C8956B', '#B8836A', '#E8C4A8', '#D4B896'];
const PETALS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 6 + Math.random() * 8,
  size: 8 + Math.random() * 14,
  rotation: Math.random() * 360,
  opacity: 0.25 + Math.random() * 0.45,
  shape: i % 3,
  color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
}));

function Petal({ x, delay, duration, size, rotation, opacity, shape, color }) {
  const petalPath =
    shape === 0
      ? 'M10,0 C15,5 15,15 10,20 C5,15 5,5 10,0'
      : shape === 1
      ? 'M10,0 C20,5 20,15 10,20 C0,15 0,5 10,0'
      : 'M10,5 L12,9 L17,9 L13,12 L15,17 L10,14 L5,17 L7,12 L3,9 L8,9 Z';

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      style={{ position: 'absolute', left: `${x}%`, top: -30, opacity, zIndex: 0 }}
      initial={{ y: -40, rotate: rotation, x: 0 }}
      animate={{
        y: '110vh',
        rotate: rotation + 360,
        x: [0, 30, -20, 10, -30, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
        x: { duration: duration * 0.6, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <path d={petalPath} fill={color} />
    </motion.svg>
  );
}

function FloatOrb({ cx, cy, r, color, delay }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${cx}%`,
        top: `${cy}%`,
        width: r,
        height: r,
        borderRadius: '50%',
        background: color,
        filter: 'blur(60px)',
        zIndex: 0,
      }}
      animate={{ scale: [1, 1.2, 0.9, 1.1, 1], opacity: [0.4, 0.6, 0.35, 0.55, 0.4] }}
      transition={{ duration: 8, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export default function GuardianForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ otp: '', newPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/guardians/forgot-password', { email });
      toast.success('If the email exists, an OTP has been sent!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/guardians/reset-password', { email, ...form });
      toast.success('Password reset successfully! Please login.');
      navigate('/guardian/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const inputBase = `w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 bg-white/70 backdrop-blur-sm
    text-[#3d2b1f] placeholder-[#b8a090] text-sm font-medium outline-none
    transition-all duration-300`;

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #f5ebe0 0%, #edddd4 40%, #e8d5c4 70%, #f0e6d8 100%)' }}
    >
      {/* Ambient blobs */}
      <FloatOrb cx={10}  cy={10}  r={320} color="rgba(212,165,122,0.35)" delay={0} />
      <FloatOrb cx={75}  cy={5}   r={280} color="rgba(200,149,107,0.28)" delay={2} />
      <FloatOrb cx={85}  cy={65}  r={350} color="rgba(232,196,168,0.40)" delay={4} />
      <FloatOrb cx={5}   cy={70}  r={260} color="rgba(184,131,106,0.25)" delay={1} />

      {/* Falling petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PETALS.map(p => <Petal key={p.id} {...p} />)}
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
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
          <div
            className="h-3 w-full"
            style={{ background: 'linear-gradient(90deg, #c8956b, #d4a57a, #e8c4a8, #d4a57a, #c8956b)' }}
          />

          <div className="p-8 pt-7">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center mb-8"
            >
              <div className="relative w-20 h-20 mx-auto mb-4">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #d4a57a33, #c8956b44)' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  {[0,60,120,180,240,300].map((deg, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2.5 h-2.5 rounded-full"
                      style={{
                        background: ['#d4a57a','#c8956b','#e8b89a','#b8836a','#d4b896','#c8956b'][i],
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${deg}deg) translateX(34px) translateY(-50%)`,
                        transformOrigin: '0 0',
                      }}
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                    />
                  ))}
                </motion.div>
                <div
                  className="absolute inset-2 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #c8956b, #d4a57a)' }}
                >
                  <KeyRound className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
              </div>

              <motion.h1
                className="text-2xl font-bold mb-1"
                style={{ color: '#3d2b1f', fontFamily: 'Georgia, serif' }}
              >
                Reset Password
              </motion.h1>
              <motion.p className="text-sm" style={{ color: '#9a7060' }}>
                {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the code sent to your email'}
              </motion.p>
            </motion.div>

            {step === 1 ? (
              <motion.form onSubmit={handleRequestOtp} className="space-y-4">
                <motion.div animate={{ scale: focused === 'email' ? 1.01 : 1 }}>
                  <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: '#9a7060' }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300"
                      style={{ color: focused === 'email' ? '#c8956b' : '#b8a090' }}
                    />
                    <input
                      type="email"
                      placeholder="guardian@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      required
                      className={inputBase}
                      style={{
                        borderColor: focused === 'email' ? '#c8956b' : 'rgba(200,149,107,0.3)',
                        boxShadow: focused === 'email' ? '0 0 0 4px rgba(200,149,107,0.12)' : 'none',
                      }}
                    />
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2.5 mt-2 transition-shadow duration-300 disabled:opacity-70"
                  style={{
                    background: loading
                      ? '#c8956b'
                      : 'linear-gradient(135deg, #c8956b 0%, #b8836a 50%, #d4a57a 100%)',
                    boxShadow: loading ? 'none' : '0 8px 24px rgba(184,131,106,0.45)',
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form onSubmit={handleResetPassword} className="space-y-4">
                <motion.div animate={{ scale: focused === 'otp' ? 1.01 : 1 }}>
                  <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: '#9a7060' }}>
                    Reset Code (OTP)
                  </label>
                  <div className="relative">
                    <Shield
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300"
                      style={{ color: focused === 'otp' ? '#c8956b' : '#b8a090' }}
                    />
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={form.otp}
                      onChange={e => setForm(p => ({ ...p, otp: e.target.value }))}
                      onFocus={() => setFocused('otp')}
                      onBlur={() => setFocused(null)}
                      required
                      className={inputBase}
                      style={{
                        borderColor: focused === 'otp' ? '#c8956b' : 'rgba(200,149,107,0.3)',
                        boxShadow: focused === 'otp' ? '0 0 0 4px rgba(200,149,107,0.12)' : 'none',
                      }}
                    />
                  </div>
                </motion.div>

                <motion.div animate={{ scale: focused === 'password' ? 1.01 : 1 }}>
                  <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: '#9a7060' }}>
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300"
                      style={{ color: focused === 'password' ? '#c8956b' : '#b8a090' }}
                    />
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={form.newPassword}
                      onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      required
                      className={`${inputBase} pr-11`}
                      style={{
                        borderColor: focused === 'password' ? '#c8956b' : 'rgba(200,149,107,0.3)',
                        boxShadow: focused === 'password' ? '0 0 0 4px rgba(200,149,107,0.12)' : 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                      style={{ color: '#b8a090' }}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2.5 mt-2 transition-shadow duration-300 disabled:opacity-70"
                  style={{
                    background: loading
                      ? '#c8956b'
                      : 'linear-gradient(135deg, #c8956b 0%, #b8836a 50%, #d4a57a 100%)',
                    boxShadow: loading ? 'none' : '0 8px 24px rgba(184,131,106,0.45)',
                  }}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </motion.button>
              </motion.form>
            )}

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(180,130,90,0.2)' }} />
              <Flower2 className="w-4 h-4" style={{ color: '#c8956b', opacity: 0.6 }} />
              <div className="flex-1 h-px" style={{ background: 'rgba(180,130,90,0.2)' }} />
            </div>

            <motion.p
              className="text-center text-xs leading-relaxed"
              style={{ color: '#9a7060' }}
            >
              Remember your password?{' '}
              <Link
                to="/guardian/login"
                className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
                style={{ color: '#b8836a' }}
              >
                Log in here
              </Link>
            </motion.p>
          </div>

          <div
            className="h-2 w-full"
            style={{ background: 'linear-gradient(90deg, #e8c4a8, #d4a57a, #c8956b, #d4a57a, #e8c4a8)' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
