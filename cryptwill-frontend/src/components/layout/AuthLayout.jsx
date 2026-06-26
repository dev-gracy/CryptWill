import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Users } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0 bg-background-secondary border-r border-border relative overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-brand/10"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-brand/5"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand/5 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">CryptWill</span>
          </Link>

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold text-text-primary leading-tight mb-4">
                Your crypto.<br />
                Your legacy.<br />
                <span className="text-brand">Your rules.</span>
              </h1>
              <p className="text-text-secondary text-base leading-relaxed mb-10">
                Decentralized crypto inheritance on the Stellar blockchain. No lawyers. No intermediaries. Just code.
              </p>
            </motion.div>

            {/* Feature bullets */}
            <div className="space-y-4">
              {[
                { icon: Lock, text: 'Client-side AES-256 encryption — your keys never leave your device' },
                { icon: Shield, text: 'Dead Man\'s Switch with 3-guardian confirmation quorum' },
                { icon: Users, text: 'Staged asset release to multiple beneficiaries via smart contract' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-sm text-text-secondary">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-text-muted mt-auto">
            © 2025 CryptWill · Powered by Stellar Soroban
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-text-primary">CryptWill</span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
