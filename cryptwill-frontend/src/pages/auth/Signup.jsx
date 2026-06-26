import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, Globe, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    if (!termsAccepted) {
      toast.error('Please accept the Terms & Conditions');
      return;
    }
    try {
      await api.post('/auth/signup', { ...data, termsAccepted });
      toast.success('Account created! Check your email for the OTP.');
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed. Please try again.');
    }
  };

  const passwordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = passwordStrength(password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-danger', 'bg-warning', 'bg-yellow-400', 'bg-success'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Create your account</h2>
        <p className="text-text-secondary text-sm">
          Set up your decentralized inheritance plan in minutes
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <User className="absolute left-3.5 top-9 w-4 h-4 text-text-muted pointer-events-none z-10" />
          <Input
            label="Full Name"
            placeholder="John Doe"
            className="pl-10"
            error={errors.fullName?.message}
            {...register('fullName', { required: 'Full name is required', minLength: { value: 2, message: 'Name too short' } })}
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3.5 top-9 w-4 h-4 text-text-muted pointer-events-none z-10" />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            className="pl-10"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
            })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Phone className="absolute left-3.5 top-9 w-4 h-4 text-text-muted pointer-events-none z-10" />
            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+91 9876543210"
              className="pl-10"
              {...register('phone')}
            />
          </div>
          <div className="relative">
            <Globe className="absolute left-3.5 top-9 w-4 h-4 text-text-muted pointer-events-none z-10" />
            <Input
              label="Country"
              placeholder="India"
              className="pl-10"
              error={errors.country?.message}
              {...register('country', { required: 'Country is required' })}
            />
          </div>
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-9 w-4 h-4 text-text-muted pointer-events-none z-10" />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            className="pl-10 pr-10"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Minimum 8 characters' }
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-9 text-text-muted hover:text-text-primary transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Password strength */}
        {password && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= strength ? strengthColors[strength] : 'bg-border'
                }`} />
              ))}
            </div>
            <p className={`text-xs ${strength >= 3 ? 'text-success' : strength >= 2 ? 'text-warning' : 'text-danger'}`}>
              {strengthLabels[strength]}
            </p>
          </div>
        )}

        <div className="relative">
          <Lock className="absolute left-3.5 top-9 w-4 h-4 text-text-muted pointer-events-none z-10" />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            className="pl-10"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: val => val === password || 'Passwords do not match'
            })}
          />
        </div>

        {/* Terms */}
        <button
          type="button"
          onClick={() => setTermsAccepted(!termsAccepted)}
          className="flex items-start gap-3 text-left w-full"
        >
          <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all duration-200 ${
            termsAccepted ? 'bg-brand border-brand' : 'border-border bg-background-elevated'
          }`}>
            {termsAccepted && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="text-sm text-text-secondary">
            I agree to the{' '}
            <span className="text-brand hover:underline">Terms & Conditions</span>
            {' '}and{' '}
            <span className="text-brand hover:underline">Privacy Policy</span>
          </span>
        </button>

        <Button type="submit" isLoading={isSubmitting} className="w-full" size="md">
          Create Account
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="text-brand font-medium hover:underline">Sign in</Link>
      </p>
    </motion.div>
  );
}
