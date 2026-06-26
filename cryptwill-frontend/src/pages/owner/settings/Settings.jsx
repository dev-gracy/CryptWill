import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, Shield, Bell, CreditCard, Lock, ChevronRight,
  Save, Upload, Camera, LogOut, Zap, Check, AlertTriangle,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'contract', label: 'Contract', icon: Activity },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Lock },
];

function ProfileTab({ user, onUpdate }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    country: user?.country || '',
    walletAddress: user?.walletAddress || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/user/profile', form);
      onUpdate(res.data.data);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center text-2xl font-bold text-brand">
          {user?.fullName?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-text-primary">{user?.fullName}</p>
          <p className="text-sm text-text-muted">{user?.email}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
            user?.plan === 'PRO' ? 'bg-brand/15 text-brand' : 'bg-border text-text-muted'
          }`}>{user?.plan} Plan</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { name: 'fullName', label: 'Full Name', placeholder: 'John Doe' },
          { name: 'phone', label: 'Phone', placeholder: '+91 9876543210' },
          { name: 'country', label: 'Country', placeholder: 'India' },
          { name: 'walletAddress', label: 'Stellar Wallet Address', placeholder: 'G...', mono: true },
        ].map(({ name, label, placeholder, mono }) => (
          <div key={name}>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">{label}</label>
            <input
              name={name}
              value={form[name]}
              onChange={handleChange}
              placeholder={placeholder}
              className={`flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted ${mono ? 'font-mono text-xs' : ''}`}
            />
          </div>
        ))}
      </div>

      {/* KYC Status */}
      <div className="p-4 rounded-xl bg-background border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-text-primary text-sm">KYC Verification</p>
            <p className="text-xs text-text-muted">Identity verification status</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            user?.kycStatus === 'VERIFIED' ? 'bg-success/10 text-success' :
            user?.kycStatus === 'SUBMITTED' ? 'bg-warning/10 text-warning' :
            'bg-border text-text-muted'
          }`}>
            {user?.kycStatus?.replace('_', ' ') || 'NOT SUBMITTED'}
          </span>
        </div>
      </div>

      <Button type="submit" isLoading={saving}>
        <Save className="w-4 h-4 mr-2" />
        Save Changes
      </Button>
    </form>
  );
}

function ContractTab() {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [config, setConfig] = useState({ checkinIntervalDays: 30, guardianQuorum: 3 });

  useEffect(() => {
    api.get('/contract/status').then(res => setContract(res.data.data))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const res = await api.post('/contract/deploy', config);
      setContract(res.data.data);
      toast.success('Smart contract deployed on Stellar testnet!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {contract?.status && contract.status !== 'NOT_DEPLOYED' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-success/5 border border-success/30 flex items-start gap-3">
            <Check className="w-5 h-5 text-success mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">Contract Active</p>
              <p className="text-sm text-text-muted mt-0.5 font-mono">{contract.contractAddress || 'Simulated'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Status', value: contract.status },
              { label: 'Network', value: contract.network },
              { label: 'Check-in interval', value: `${contract.checkinIntervalDays} days` },
              { label: 'Guardian quorum', value: `${contract.guardianQuorum} guardians` },
              { label: 'Deployed at', value: contract.deployedAt ? new Date(contract.deployedAt).toLocaleDateString() : '—' },
              { label: 'Last check-in', value: contract.lastCheckinAt ? new Date(contract.lastCheckinAt).toLocaleDateString() : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-background-elevated border border-border rounded-xl p-3">
                <p className="text-text-muted text-xs mb-1">{label}</p>
                <p className="text-text-primary font-medium">{value}</p>
              </div>
            ))}
          </div>
          {contract.status === 'ACTIVE' && (
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirm('Cancel the contract? This cannot be undone.')) return;
                await api.post('/contract/cancel');
                toast.success('Contract cancelled');
              }}
            >
              Cancel Contract
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-warning/5 border border-warning/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">No contract deployed</p>
              <p className="text-sm text-text-muted mt-0.5">Deploy a Soroban smart contract to activate your dead man's switch.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1.5 block">Check-in interval</label>
              <select
                value={config.checkinIntervalDays}
                onChange={e => setConfig(p => ({ ...p, checkinIntervalDays: parseInt(e.target.value) }))}
                className="flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value={7}>Every 7 days</option>
                <option value={14}>Every 14 days</option>
                <option value={30}>Every 30 days (Free)</option>
                <option value={60}>Every 60 days</option>
                <option value={90}>Every 90 days</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1.5 block">Guardian quorum</label>
              <select
                value={config.guardianQuorum}
                onChange={e => setConfig(p => ({ ...p, guardianQuorum: parseInt(e.target.value) }))}
                className="flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} guardians</option>)}
              </select>
            </div>
          </div>
          <Button onClick={handleDeploy} isLoading={deploying} className="w-full">
            <Activity className="w-4 h-4 mr-2" />
            Deploy Smart Contract
          </Button>
        </div>
      )}
    </div>
  );
}

function SubscriptionTab({ user }) {
  const plans = [
    {
      id: 'FREE', name: 'Free', price: '$0', period: 'forever',
      features: ['4 beneficiaries', '5 guardians', '30-day check-in', '500MB vault', 'Email notifications']
    },
    {
      id: 'PRO', name: 'Pro', price: '$9.99', period: '/month',
      features: ['10 beneficiaries', '7 guardians', 'Custom intervals', '5GB vault', 'SMS alerts', 'PDF will export', 'Priority support'],
      highlight: true
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-5 relative ${
              plan.highlight ? 'border-brand bg-brand/5' : 'border-border bg-background-elevated'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs px-3 py-1 rounded-full font-semibold">
                Most Popular
              </div>
            )}
            <div className="mb-4">
              <p className="font-bold text-text-primary text-lg">{plan.name}</p>
              <p className="text-2xl font-bold text-text-primary">
                {plan.price}<span className="text-sm font-normal text-text-muted">{plan.period}</span>
              </p>
            </div>
            <ul className="space-y-2 mb-5">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {user?.plan === plan.id ? (
              <div className="text-center py-2 text-sm text-success font-medium flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Current Plan
              </div>
            ) : (
              <Button
                className="w-full"
                variant={plan.highlight ? 'primary' : 'outline'}
                onClick={() => toast.info('Payment integration coming soon!')}
              >
                {user?.plan === 'PRO' && plan.id === 'FREE' ? 'Downgrade' : `Upgrade to ${plan.name}`}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await api.put('/user/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-md">
      {[
        { name: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
        { name: 'newPassword', label: 'New Password', placeholder: 'Min. 8 characters' },
        { name: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
      ].map(({ name, label, placeholder }) => (
        <div key={name}>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">{label}</label>
          <input
            name={name}
            type="password"
            value={form[name]}
            onChange={handleChange}
            placeholder={placeholder}
            className="flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted"
          />
        </div>
      ))}
      <Button type="submit" isLoading={saving}>
        <Lock className="w-4 h-4 mr-2" />
        Change Password
      </Button>
    </form>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, updateUser } = useAuthStore();

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand" />
          Settings
        </h1>
        <p className="text-text-secondary text-sm mt-1">Manage your account, contract, and subscription</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-background-elevated border border-border rounded-xl p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === id ? 'bg-brand text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-background'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-background-elevated border border-border rounded-2xl p-6"
      >
        {activeTab === 'profile' && <ProfileTab user={user} onUpdate={updateUser} />}
        {activeTab === 'contract' && <ContractTab />}
        {activeTab === 'subscription' && <SubscriptionTab user={user} />}
        {activeTab === 'security' && <SecurityTab />}
      </motion.div>
    </div>
  );
}
