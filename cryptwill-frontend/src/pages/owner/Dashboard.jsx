import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Coins, Users, UserCheck, Vault, CheckCircle, Clock,
  AlertTriangle, TrendingUp, ArrowRight, Zap, Activity, Lock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' }
  })
};

function StatCard({ icon: Icon, label, value, color = 'brand', suffix = '', index = 0 }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="bg-background-elevated border border-border rounded-2xl p-5 card-glow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-text-primary mb-0.5">
        {value}<span className="text-base font-normal text-text-muted ml-1">{suffix}</span>
      </p>
      <p className="text-sm text-text-secondary">{label}</p>
    </motion.div>
  );
}

function CheckinStatus({ contract }) {
  if (!contract || contract.status === 'NOT_DEPLOYED') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-warning/5 border border-warning/20">
        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
        <p className="text-sm text-text-secondary">Deploy your smart contract to start check-ins</p>
      </div>
    );
  }

  const now = new Date();
  const due = new Date(contract.nextCheckinDue);
  const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  const urgency = daysLeft <= 3 ? 'danger' : daysLeft <= 7 ? 'warning' : 'success';
  const colors = { danger: 'bg-danger/5 border-danger/20', warning: 'bg-warning/5 border-warning/20', success: 'bg-success/5 border-success/20' };
  const textColors = { danger: 'text-danger', warning: 'text-warning', success: 'text-success' };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${colors[urgency]} border`}>
      {urgency === 'success'
        ? <CheckCircle className={`w-4 h-4 ${textColors[urgency]} flex-shrink-0`} />
        : <Clock className={`w-4 h-4 ${textColors[urgency]} flex-shrink-0`} />
      }
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">
          {daysLeft > 0 ? `Next check-in due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'Check-in overdue!'}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          Due: {due.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
      </div>
      <span className={`text-xs font-bold ${textColors[urgency]}`}>
        {daysLeft > 0 ? `${daysLeft}d` : 'NOW'}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/assets').catch(() => ({ data: { data: [] } })),
      api.get('/beneficiaries').catch(() => ({ data: { data: [] } })),
      api.get('/guardians').catch(() => ({ data: { data: [] } })),
      api.get('/contract/status').catch(() => ({ data: { data: null } })),
      api.get('/vault').catch(() => ({ data: { data: { files: [] } } })),
    ]).then(([assets, bens, guards, cont, vault]) => {
      setStats({
        assets: assets.data.data?.length || 0,
        beneficiaries: bens.data.data?.length || 0,
        guardians: guards.data.data?.length || 0,
        vaultFiles: vault.data.data?.files?.length || 0,
      });
      setContract(cont.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleCheckin = async () => {
    try {
      await api.post('/checkin');
      toast.success('✅ Check-in recorded on Stellar!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    }
  };

  const quickActions = [
    { label: 'Add Asset', to: '/app/assets', icon: Coins, desc: 'Register crypto wallet or token' },
    { label: 'Add Beneficiary', to: '/app/beneficiaries', icon: Users, desc: 'Name your heirs' },
    { label: 'Add Guardian', to: '/app/guardians', icon: UserCheck, desc: 'Set trusted confirmers' },
    { label: 'Upload Document', to: '/app/vault', icon: Vault, desc: 'Encrypt & store files' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Welcome back, {user?.fullName?.split(' ')[0]} 👋
            </h1>
            <p className="text-text-secondary mt-1 text-sm">
              Your crypto inheritance plan at a glance
            </p>
          </div>
          {user?.plan === 'FREE' && (
            <Link
              to="/app/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand/10 border border-brand/30 text-brand text-sm font-medium hover:bg-brand/20 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Upgrade to Pro
            </Link>
          )}
        </div>
      </motion.div>

      {/* Check-in status */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <CheckinStatus contract={contract} />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Coins} label="Assets Registered" value={stats?.assets ?? 0} index={0} />
        <StatCard icon={Users} label="Beneficiaries" value={stats?.beneficiaries ?? 0} color="success" index={1} />
        <StatCard icon={UserCheck} label="Guardians" value={stats?.guardians ?? 0} color="warning" index={2} />
        <StatCard icon={Lock} label="Vault Files" value={stats?.vaultFiles ?? 0} color="danger" index={3} />
      </div>

      {/* Contract Status */}
      {contract && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-background-elevated border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand" />
              Smart Contract Status
            </h2>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              contract.status === 'ACTIVE' ? 'bg-success/15 text-success' :
              contract.status === 'TRIGGERED' ? 'bg-warning/15 text-warning' :
              contract.status === 'NOT_DEPLOYED' ? 'bg-border text-text-muted' :
              'bg-brand/15 text-brand'
            }`}>
              {contract.status?.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-text-muted text-xs mb-1">Network</p>
              <p className="text-text-primary font-medium capitalize">{contract.network || '—'}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs mb-1">Check-in interval</p>
              <p className="text-text-primary font-medium">{contract.checkinIntervalDays} days</p>
            </div>
            <div>
              <p className="text-text-muted text-xs mb-1">Guardian quorum</p>
              <p className="text-text-primary font-medium">{contract.guardianQuorum} of {stats?.guardians}</p>
            </div>
          </div>

          {contract.status === 'NOT_DEPLOYED' && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                to="/app/settings"
                className="inline-flex items-center gap-2 text-sm text-brand font-medium hover:underline"
              >
                Deploy Smart Contract <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(({ label, to, icon: Icon, desc }, i) => (
            <motion.div key={label} custom={i} variants={cardVariants} initial="hidden" animate="visible">
              <Link
                to={to}
                className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-background-elevated hover:border-brand/40 hover:bg-brand/5 transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center group-hover:bg-brand/20 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Manual check-in CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand/20 to-brand/5 border border-brand/30 p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_rgba(79,110,247,0.15),_transparent_60%)]" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-bold text-text-primary mb-1 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Proof of Life Check-In
            </h3>
            <p className="text-sm text-text-secondary">
              Confirm you're alive — this resets your Dead Man's Switch and mints a PoL token on Stellar.
            </p>
          </div>
          <button
            onClick={handleCheckin}
            className="flex items-center gap-2 bg-success hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-success/20 hover:shadow-success/40"
          >
            <CheckCircle className="w-4 h-4" />
            I'm Alive — Check In Now
          </button>
        </div>
      </motion.div>
    </div>
  );
}
