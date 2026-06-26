import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, LogIn, Flower2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

/* ── Floating petal shapes ── */
const PETALS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 6 + Math.random() * 8,
  size: 8 + Math.random() * 14,
  rotation: Math.random() * 360,
  opacity: 0.25 + Math.random() * 0.45,
  shape: i % 3, // 0=rose, 1=leaf, 2=daisy
}));

function Petal({ x, delay, duration, size, rotation, opacity, shape }) {
  const colors = ['#D4A57A', '#C8956B', '#B8836A', '#E8C4A8', '#D4B896'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const petalPath =
    shape === 0
      ? 'M10,0 C15,5 15,15 10,20 C5,15 5,5 10,0'     // rose petal
      : shape === 1
      ? 'M10,0 C20,5 20,15 10,20 C0,15 0,5 10,0'      // leaf
      : 'M10,5 L12,9 L17,9 L13,12 L15,17 L10,14 L5,17 L7,12 L3,9 L8,9 Z'; // star

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

/* ── Animated orb blobs ── */
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

export default function GuardianLogin() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/guardians/login', form);
      const guardian = res.data.data?.guardian;
      login({ ...guardian, role: 'GUARDIAN' }, null);
      toast.success(`Welcome, ${guardian.fullName}!`);
      navigate('/guardian');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
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

      {/* Decorative vine lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <motion.path
          d="M-20,200 Q100,120 200,180 Q320,240 420,160 Q520,80 620,140 Q720,200 820,120 Q920,40 1020,100 Q1120,160 1220,80 Q1320,0 1420,60"
          stroke="rgba(180,130,90,0.18)" strokeWidth="1.5" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, ease: 'easeOut' }}
        />
        <motion.path
          d="M-20,600 Q150,520 300,580 Q450,640 600,560 Q750,480 900,540 Q1050,600 1200,520 Q1350,440 1536,500"
          stroke="rgba(180,130,90,0.14)" strokeWidth="1.5" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.5, delay: 0.5, ease: 'easeOut' }}
        />
      </svg>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card glow ring */}
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
          {/* Top floral banner */}
          <div
            className="h-3 w-full"
            style={{ background: 'linear-gradient(90deg, #c8956b, #d4a57a, #e8c4a8, #d4a57a, #c8956b)' }}
          />

          <div className="p-8 pt-7">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center mb-8"
            >
              {/* Shield icon with floral ring */}
              <div className="relative w-20 h-20 mx-auto mb-4">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #d4a57a33, #c8956b44)' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  {/* Floral dots around ring */}
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
                  <Shield className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
              </div>

              <motion.h1
                className="text-2xl font-bold mb-1"
                style={{ color: '#3d2b1f', fontFamily: 'Georgia, serif' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              >
                Guardian Portal
              </motion.h1>
              <motion.p
                className="text-sm"
                style={{ color: '#9a7060' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              >
                A trusted keeper of what matters most
              </motion.p>
            </motion.div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            >
              {/* Email */}
              <motion.div
                animate={{ scale: focused === 'email' ? 1.01 : 1 }}
                transition={{ duration: 0.2 }}
              >
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
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
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

              {/* Password */}
              <motion.div
                animate={{ scale: focused === 'password' ? 1.01 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: '#9a7060' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300"
                    style={{ color: focused === 'password' ? '#c8956b' : '#b8a090' }}
                  />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Your secret password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
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

              {/* Submit button */}
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
                  fontSize: '0.95rem',
                  letterSpacing: '0.02em',
                }}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Entering portal…
                    </motion.div>
                  ) : (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Enter Guardian Portal
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

            {/* Footer note */}
            <motion.p
              className="text-center text-xs leading-relaxed"
              style={{ color: '#9a7060' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Received an invitation?{' '}
              <button
                type="button"
                onClick={() => toast('Please use the invitation link sent to your email to first create your account.', { icon: '🌸' })}
                className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
                style={{ color: '#b8836a' }}
              >
                Accept invite first →
              </button>
            </motion.p>

            <motion.p
              className="text-center text-[11px] mt-3 tracking-wide"
              style={{ color: '#c4a898', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              "To be trusted is a greater compliment than to be loved."
            </motion.p>
          </div>

          {/* Bottom floral banner */}
          <div
            className="h-2 w-full"
            style={{ background: 'linear-gradient(90deg, #e8c4a8, #d4a57a, #c8956b, #d4a57a, #e8c4a8)' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
