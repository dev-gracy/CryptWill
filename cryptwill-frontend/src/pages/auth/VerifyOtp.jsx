import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import Button from '../../components/common/Button';

export default function VerifyOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);

  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) { navigate('/signup'); return; }
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d) && !isLoading) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      const newOtp = paste.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleVerify(paste);
    }
  };

  const handleVerify = async (code) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code });
      toast.success('Email verified! Welcome to CryptWill 🎉');
      
      const { user, token } = res.data.data;
      login(user, token);
      if (user.isOnboarded) {
        navigate('/app');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP. Try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await api.post('/auth/signup', { email, resend: true });
      toast.success('New OTP sent to your email!');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (_) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-16 h-16 rounded-2xl bg-brand/15 flex items-center justify-center mx-auto mb-6"
      >
        <Shield className="w-8 h-8 text-brand" />
      </motion.div>

      <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
      <p className="text-text-secondary text-sm mb-2">
        We sent a 6-digit code to
      </p>
      <p className="font-semibold text-brand text-sm mb-8">{email}</p>

      {/* OTP Input */}
      <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <motion.input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.06 }}
            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background-elevated text-text-primary
              transition-all duration-200 outline-none focus:scale-105
              ${digit ? 'border-brand bg-brand/5 text-brand' : 'border-border focus:border-brand/70'}
              ${isLoading ? 'opacity-50 pointer-events-none' : ''}
            `}
          />
        ))}
      </div>

      <Button
        onClick={() => handleVerify(otp.join(''))}
        isLoading={isLoading}
        disabled={otp.some(d => !d) || isLoading}
        className="w-full mb-4"
      >
        Verify Email
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      {/* Resend */}
      <div className="text-sm text-text-secondary">
        Didn't receive the code?{' '}
        {countdown > 0 ? (
          <span className="text-text-muted">Resend in {countdown}s</span>
        ) : (
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-brand hover:underline font-medium inline-flex items-center gap-1"
          >
            {isResending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Resend code
          </button>
        )}
      </div>
    </motion.div>
  );
}
