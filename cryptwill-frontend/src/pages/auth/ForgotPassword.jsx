import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ArrowRight, KeyRound, Lock, Mail, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const newPassword = watch('newPassword', '');

  const handleRequestOtp = async ({ email: submittedEmail }) => {
    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: submittedEmail });
      setEmail(submittedEmail);
      setStep('reset');
      toast.success('Reset code sent. Check your email for the OTP.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async ({ otp, newPassword: nextPassword }) => {
    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword: nextPassword,
      });
      toast.success('Password reset successfully. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password reset failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('A fresh reset code has been sent.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend reset code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {step === 'request' ? 'Reset your password' : 'Choose a new password'}
        </h2>
        <p className="text-text-secondary text-sm">
          {step === 'request'
            ? 'We will send a six-digit OTP to your registered email.'
            : `Enter the OTP sent to ${email} and set a new password.`}
        </p>
      </div>

      {step === 'request' ? (
        <form onSubmit={handleSubmit(handleRequestOtp)} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none z-10 mt-3.5" />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
              })}
            />
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Send Reset Code
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-5">
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none z-10 mt-3.5" />
            <Input
              label="OTP"
              inputMode="numeric"
              placeholder="123456"
              className="pl-10"
              error={errors.otp?.message}
              {...register('otp', {
                required: 'OTP is required',
                pattern: { value: /^\d{6}$/, message: 'Enter the 6-digit OTP' },
              })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none z-10 mt-3.5" />
            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 8 characters"
              className="pl-10"
              error={errors.newPassword?.message}
              {...register('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none z-10 mt-3.5" />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Repeat your new password"
              className="pl-10"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (value) => value === newPassword || 'Passwords do not match',
              })}
            />
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Reset Password
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="text-brand hover:underline inline-flex items-center gap-1 disabled:opacity-60"
            >
              {isResending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              Resend OTP
            </button>
            <button
              type="button"
              onClick={() => setStep('request')}
              className="text-text-secondary hover:text-text-primary"
            >
              Change email
            </button>
          </div>

          {import.meta.env.DEV ? (
            <p className="text-xs text-text-muted">
              Dev tip: use OTP <strong className="text-brand">123456</strong>.
            </p>
          ) : null}
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        Remembered it?{' '}
        <Link to="/login" className="text-brand font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </motion.div>
  );
}
