import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Trash2, Edit3, X, Mail, Phone, Wallet,
  UserPlus, CheckCircle2, Clock, AlertCircle, Send, Percent
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/common/Button';

const statusColors = {
  ACTIVE: 'text-success bg-success/10',
  INVITED: 'text-warning bg-warning/10',
  DECLINED: 'text-danger bg-danger/10',
};

const statusIcons = {
  ACTIVE: CheckCircle2,
  INVITED: Clock,
  DECLINED: AlertCircle,
};

function BeneficiaryModal({ beneficiary, onClose, onSave }) {
  const isEdit = !!beneficiary?.id;
  const [formData, setFormData] = useState({
    fullName: beneficiary?.fullName || '',
    email: beneficiary?.email || '',
    phone: beneficiary?.phone || '',
    walletAddress: beneficiary?.walletAddress || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) { toast.error('Name and email are required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const res = await api.put(`/beneficiaries/${beneficiary.id}`, formData);
        onSave(res.data.data, 'edit');
      } else {
        const res = await api.post('/beneficiaries', formData);
        onSave(res.data.data, 'add');
      }
      toast.success(isEdit ? 'Beneficiary updated!' : 'Beneficiary invited!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { name: 'fullName', label: 'Full Name', placeholder: 'Jane Doe', icon: Users, required: true },
    { name: 'email', label: 'Email', placeholder: 'jane@example.com', icon: Mail, type: 'email', required: true },
    { name: 'phone', label: 'Phone (optional)', placeholder: '+91 9876543210', icon: Phone },
    { name: 'walletAddress', label: 'Stellar Wallet (optional)', placeholder: 'G...', icon: Wallet, mono: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background-elevated border border-border rounded-2xl w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand" />
            {isEdit ? 'Edit Beneficiary' : 'Add Beneficiary'}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {fields.map(({ name, label, placeholder, icon: Icon, type = 'text', required, mono }) => (
            <div key={name}>
              <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                {label} {required && <span className="text-danger">*</span>}
              </label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  name={name}
                  type={type}
                  value={formData[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className={`flex h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted ${mono ? 'font-mono' : ''}`}
                />
              </div>
            </div>
          ))}

          {!isEdit && (
            <div className="p-3 rounded-lg bg-brand/5 border border-brand/20 flex items-start gap-2">
              <Send className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
              <p className="text-xs text-text-secondary">
                An invitation email will be sent to this person to set up their beneficiary account.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving} className="flex-1">
              {isEdit ? 'Save Changes' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBen, setEditingBen] = useState(null);

  useEffect(() => {
    api.get('/beneficiaries').then(res => setBeneficiaries(res.data.data || []))
      .catch(() => toast.error('Failed to load beneficiaries'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (saved, mode) => {
    if (mode === 'add') setBeneficiaries(p => [...p, saved]);
    else setBeneficiaries(p => p.map(b => b.id === saved.id ? saved : b));
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this beneficiary?')) return;
    try {
      await api.delete(`/beneficiaries/${id}`);
      setBeneficiaries(p => p.filter(b => b.id !== id));
      toast.success('Beneficiary removed');
    } catch {
      toast.error('Failed to remove beneficiary');
    }
  };

  const handleResendInvite = async (id) => {
    try {
      await api.post(`/beneficiaries/${id}/resend-invite`);
      toast.success('Invitation resent!');
    } catch {
      toast.error('Failed to resend invite');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-brand" />
            Beneficiaries
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            People who will inherit your crypto assets
          </p>
        </div>
        <Button onClick={() => { setEditingBen(null); setShowModal(true); }}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Beneficiary
        </Button>
      </motion.div>

      {/* Plan limit reminder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand/5 border border-brand/20"
      >
        <Percent className="w-4 h-4 text-brand flex-shrink-0" />
        <p className="text-sm text-text-secondary">
          <span className="text-text-primary font-medium">{beneficiaries.length}/4</span> beneficiaries on Free plan. 
          <span className="text-brand font-medium ml-1 cursor-pointer hover:underline">Upgrade to Pro</span> for up to 10.
        </p>
      </motion.div>

      {beneficiaries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-background-elevated border border-dashed border-border rounded-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-brand opacity-60" />
          </div>
          <h3 className="font-semibold text-text-primary mb-2">No beneficiaries yet</h3>
          <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto">
            Add people who will receive your crypto assets after your passing
          </p>
          <Button onClick={() => setShowModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add First Beneficiary
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {beneficiaries.map((ben, i) => {
              const StatusIcon = statusIcons[ben.status] || Clock;
              const statusClass = statusColors[ben.status] || statusColors.INVITED;
              return (
                <motion.div
                  key={ben.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="bg-background-elevated border border-border rounded-xl p-5 flex items-center gap-4 card-glow"
                >
                  <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center text-brand font-bold flex-shrink-0">
                    {ben.fullName[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-text-primary">{ben.fullName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${statusClass}`}>
                        <StatusIcon className="w-3 h-3" />
                        {ben.status}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{ben.email}</p>
                    {ben.walletAddress && (
                      <p className="text-xs text-text-muted font-mono truncate mt-0.5">{ben.walletAddress}</p>
                    )}
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    {ben.status === 'INVITED' && (
                      <button
                        onClick={() => handleResendInvite(ben.id)}
                        className="w-8 h-8 rounded-lg hover:bg-warning/10 flex items-center justify-center text-text-muted hover:text-warning transition-colors"
                        title="Resend invite"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingBen(ben); setShowModal(true); }}
                      className="w-8 h-8 rounded-lg hover:bg-brand/10 flex items-center justify-center text-text-muted hover:text-brand transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ben.id)}
                      className="w-8 h-8 rounded-lg hover:bg-danger/10 flex items-center justify-center text-text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <BeneficiaryModal
            beneficiary={editingBen}
            onClose={() => { setShowModal(false); setEditingBen(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
