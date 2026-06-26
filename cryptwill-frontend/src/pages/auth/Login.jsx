import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/login', data);
      const { user } = res.data.data;
      login(user, null); // token is httpOnly cookie, store user info
      toast.success(`Welcome back, ${user.fullName}!`);
      navigate(user.isOnboarded ? '/app' : '/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome back</h2>
        <p className="text-text-secondary text-sm">
          Sign in to manage your crypto inheritance plan
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' }
            })}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none z-10 mt-3.5" />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="pl-10 pr-10"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 mt-3.5 text-text-muted hover:text-text-primary transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-brand hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full"
          size="md"
        >
          Sign In
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link to="/signup" className="text-brand font-medium hover:underline">
          Create one free
        </Link>
      </p>

      {/* Demo Notice */}
      <div className="mt-6 p-3 rounded-lg bg-brand/5 border border-brand/20 text-xs text-text-muted text-center">
        Demo: Use any registered credentials to sign in
      </div>
    </motion.div>
  );
}
