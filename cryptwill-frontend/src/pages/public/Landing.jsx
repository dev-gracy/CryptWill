import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Shield, Lock, Users, CheckCircle, Zap, ArrowRight,
  Star, Globe, Code2, Clock, Key, Vault, ChevronDown
} from 'lucide-react';
import ThemeToggle from '../../components/common/ThemeToggle';
import HeroPortal from '../../components/landing/HeroPortal';

function AnimatedGradientOrb({ className }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.15, 0.3, 0.15],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function FeatureCard({ icon: Icon, title, desc, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-background-elevated border border-border rounded-2xl p-6 group hover:border-brand/40 transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
        <Icon className="w-6 h-6 text-brand" />
      </div>
      <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function StepCard({ step, title, desc, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay, duration: 0.4 }}
      className="flex gap-4"
    >
      <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5 shadow-lg shadow-brand/30">
        {step}
      </div>
      <div>
        <h4 className="font-semibold text-text-primary mb-1">{title}</h4>
        <p className="text-sm text-text-secondary">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  const features = [
    { icon: Shield, title: 'Dead Man\'s Switch', desc: 'Miss 3 consecutive check-ins and your guardians are notified. No action needed from you — the blockchain handles it.' },
    { icon: Users, title: 'Guardian Voting System', desc: 'Up to 7 trusted guardians vote to confirm your passing. A configurable quorum must be reached before assets transfer.' },
    { icon: Lock, title: 'Client-side Encryption', desc: 'Files encrypted with AES-256 before leaving your device. Your keys never touch our servers — not even us can decrypt them.' },
    { icon: Key, title: 'Shamir\'s Secret Sharing', desc: 'Split encryption keys into shards distributed to guardians. No single point of failure for your digital estate.' },
    { icon: Vault, title: 'Digital Vault', desc: 'Store wills, seed phrases, and documents encrypted on IPFS. Only accessible by designated beneficiaries after confirmation.' },
    { icon: Zap, title: 'Stellar Soroban', desc: 'Smart contracts on Stellar blockchain handle all transfers automatically. No lawyers, no probate courts, no fees.' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-md shadow-brand/30">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-text-primary font-serif">CryptWill</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#how" className="hover:text-text-primary transition-colors">How it works</a>
            <a href="#security" className="hover:text-text-primary transition-colors">Security</a>
            <a href="#plans" className="hover:text-text-primary transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Sign in</Link>
            <Link
              to="/signup"
              className="bg-brand text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-brand-hover transition-colors shadow-md shadow-brand/20"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden bg-slate-950/10">
        {/* Background orbs */}
        <AnimatedGradientOrb className="w-96 h-96 bg-brand -top-10 -left-10" />
        <AnimatedGradientOrb className="w-80 h-80 bg-brand/40 top-1/2 -right-20" />
        <AnimatedGradientOrb className="w-64 h-64 bg-brand/30 bottom-10 left-1/3" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(155,94,79,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(155,94,79,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center"
        >
          <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/30 px-4 py-2 rounded-full text-sm text-brand font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              Powered by Stellar Soroban Smart Contracts
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-5xl md:text-6xl font-bold font-serif text-white leading-tight mb-6"
          >
            Your crypto.<br />
            <span className="text-brand relative">
              Your legacy.
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              />
            </span>
            <br />
            Your rules.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg md:text-xl text-slate-200 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
          >
            CryptWill is a decentralized digital inheritance platform designed to feel like a calm, heavenly vault.
            Your crypto legacy is protected behind a serene gate of light, flowers, and secure smart contracts.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-sm text-slate-300 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
          >
            Works beautifully in both light and dark mode, reflecting safe wealth, peace, and trust through every step.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
          >
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 bg-brand text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-brand-hover transition-all duration-200 shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:-translate-y-0.5"
            >
              Start For Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 bg-background-elevated border border-border text-text-primary px-8 py-3.5 rounded-xl font-semibold text-base hover:border-brand/50 transition-colors"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-12 text-sm text-slate-300"
          >
            {['AES-256 Encrypted', 'No Intermediaries', 'Stellar Testnet', 'Open Source'].map(badge => (
              <div key={badge} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                {badge}
              </div>
            ))}
          </motion.div>
          </div>

          {/* Portal illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="hidden lg:block"
          >
            <HeroPortal />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-text-muted" />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand font-semibold text-sm mb-3 uppercase tracking-wide"
          >
            Platform Features
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold font-serif text-text-primary mb-4"
          >
            Everything your crypto estate needs
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-text-secondary max-w-xl mx-auto"
          >
            Built for the digital age, CryptWill combines blockchain security with human oversight.
          </motion.p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-24 max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand font-semibold text-sm mb-3 uppercase tracking-wide">Security</p>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-text-primary mb-4">
              Built so that even we can't see your secrets
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed mb-8">
              Every seed phrase, document, and key is encrypted before it ever leaves your browser.
              CryptWill is non-custodial by design — your assets stay yours until your smart contract
              says otherwise.
            </p>
            <div className="space-y-4">
              {[
                { icon: Lock, title: 'AES-256 client-side encryption', desc: 'Files are encrypted on your device. We only ever store ciphertext.' },
                { icon: Key, title: 'Shamir\'s Secret Sharing', desc: 'Recovery keys are split into shards — no single guardian or server holds the whole secret.' },
                { icon: Shield, title: 'Audited smart contracts', desc: 'Soroban contracts on Stellar enforce your rules exactly as written, with no manual override.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{item.title}</p>
                    <p className="text-sm text-text-secondary">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-background-elevated border border-border rounded-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--color-brand-glow),_transparent_60%)]" />
            <div className="relative space-y-5">
              {['Encrypting vault…', 'Splitting key into 5 shards…', 'Distributing to guardians…', 'Deploying Soroban contract…'].map((line, i) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center gap-3 font-mono text-sm text-text-secondary"
                >
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  {line}
                </motion.div>
              ))}
              <div className="pt-2 border-t border-border text-xs text-text-muted">
                Zero-knowledge by default — your private keys never touch our infrastructure.
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-background-secondary">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-brand font-semibold text-sm mb-3 uppercase tracking-wide">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-text-primary mb-4">Simple. Secure. Automatic.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-8">
            {[
              { step: '01', title: 'Register & Verify', desc: 'Sign up with email verification. Set up your Stellar wallet address.' },
              { step: '02', title: 'Add Your Assets', desc: 'Register all crypto wallets, tokens, and NFTs you want to include.' },
              { step: '03', title: 'Appoint Guardians', desc: 'Choose 3–7 trusted people who can confirm your passing by vote.' },
              { step: '04', title: 'Name Beneficiaries', desc: 'Add heirs and assign what percentage of each asset they receive.' },
              { step: '05', title: 'Deploy Smart Contract', desc: 'A Soroban contract is deployed on Stellar testnet with your settings.' },
              { step: '06', title: 'Check In Regularly', desc: 'Confirm you\'re alive monthly. One click from email — takes 5 seconds.' },
              { step: '07', title: 'Guardian Vote Triggers', desc: 'If you miss 3 check-ins, guardians vote. Quorum confirms the transfer.' },
              { step: '08', title: 'Assets Auto-Transfer', desc: 'Smart contract executes the staged release plan. Everything on-chain.' },
            ].map((s, i) => (
              <StepCard key={s.step} {...s} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="plans" className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-brand font-semibold text-sm mb-3 uppercase tracking-wide">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-text-primary mb-4">Simple, transparent pricing</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'Free',
              price: '$0',
              period: 'forever',
              color: 'border-border',
              features: ['4 beneficiaries', '5 guardians', '30-day check-in', '500MB encrypted vault', 'Email notifications', 'Stellar testnet']
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              period: 'contact us',
              highlight: true,
              color: 'border-brand',
              features: ['Unlimited beneficiaries', 'Unlimited guardians', 'Custom check-in intervals', 'Unlimited encrypted storage', 'Dedicated account manager', 'Priority support', 'On-chain enterprise SLA']
            },
            {
              name: 'Pro',
              price: '₹1,499',
              period: '/month',
              color: 'border-border',
              features: ['10 beneficiaries', '7 guardians', 'Custom intervals (7–90 days)', '5GB encrypted vault', 'SMS alerts', 'PDF will export', 'Priority support', 'Mainnet ready']
            },
          ].map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border-2 p-7 relative ${plan.color} ${plan.highlight ? 'bg-brand/5' : 'bg-background-elevated'}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand text-white text-xs px-4 py-1 rounded-full font-semibold">
                  Most Popular
                </div>
              )}
              <p className="font-bold text-2xl text-text-primary">{plan.name}</p>
              <p className="text-4xl font-bold text-text-primary mt-2 mb-1">
                {plan.price}<span className="text-base font-normal text-text-muted">{plan.period}</span>
              </p>
              <ul className="space-y-2.5 my-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  plan.highlight
                    ? 'bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/25'
                    : 'border border-border text-text-primary hover:border-brand/50 hover:text-brand'
                }`}
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center bg-gradient-to-br from-brand/20 via-brand/10 to-transparent border border-brand/30 rounded-3xl p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(79,110,247,0.15),_transparent_70%)]" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-text-primary mb-4">
              Don't let your crypto die with you
            </h2>
            <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
              Set up your decentralized inheritance plan in under 10 minutes. 
              It's free to start, and your loved ones will thank you.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-brand text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-brand-hover transition-all shadow-xl shadow-brand/30 hover:shadow-brand/50 hover:-translate-y-1 duration-200"
            >
              Create Your Will — Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-text-primary font-serif">CryptWill</span>
          </div>
          <p className="text-sm text-text-muted">© 2025 CryptWill · Built on Stellar Soroban · No intermediaries</p>
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}
