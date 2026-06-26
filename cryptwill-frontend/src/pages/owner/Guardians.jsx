import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Plus, Trash2, Edit3, X, Mail, Phone,
  ShieldCheck, Clock, AlertCircle, CheckCircle2, Send, ThumbsUp, ThumbsDown, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/common/Button';

const statusColors = {
  ACTIVE: 'text-success bg-success/10',
  INVITED: 'text-warning bg-warning/10',
  DECLINED: 'text-danger bg-danger/10',
  REMOVED: 'text-text-muted bg-border/30',
};

function GuardianModal({ guardian, onClose, onSave }) {
  const isEdit = !!guardian?.id;
  const [formData, setFormData] = useState({
    fullName: guardian?.fullName || '',
    email: guardian?.email || '',
    phone: guardian?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) { toast.error('Name and email are required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const res = await api.put(`/guardians/${guardian.id}`, formData);
        onSave(res.data.data, 'edit');
      } else {
        const res = await api.post('/guardians', formData);
        onSave(res.data.data, 'add');
      }
      toast.success(isEdit ? 'Guardian updated!' : 'Guardian invited!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

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
            <ShieldCheck className="w-5 h-5 text-brand" />
            {isEdit ? 'Edit Guardian' : 'Add Guardian'}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {[
            { name: 'fullName', label: 'Full Name', placeholder: 'Alice Smith', icon: UserCheck, required: true },
            { name: 'email', label: 'Email', placeholder: 'alice@example.com', icon: Mail, type: 'email', required: true },
            { name: 'phone', label: 'Phone (optional)', placeholder: '+91 9876543210', icon: Phone },
          ].map(({ name, label, placeholder, icon: Icon, type = 'text', required }) => (
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
                  className="flex h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted"
                />
              </div>
            </div>
          ))}

          {/* Role explanation */}
          <div className="p-3 rounded-lg bg-background border border-border">
            <p className="text-xs font-medium text-text-primary mb-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-brand" />
              What guardians do:
            </p>
            <ul className="text-xs text-text-muted space-y-1">
              <li>• They confirm your passing after missed check-ins</li>
              <li>• Each guardian votes to trigger asset distribution</li>
              <li>• Their vote is recorded on the Stellar blockchain</li>
            </ul>
          </div>

          {!isEdit && (
            <div className="p-3 rounded-lg bg-brand/5 border border-brand/20 flex items-start gap-2">
              <Send className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
              <p className="text-xs text-text-secondary">
                An invitation email will be sent to this guardian to set up their account.
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

export default function Guardians() {
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState(null);

  useEffect(() => {
    api.get('/guardians').then(res => setGuardians(res.data.data || []))
      .catch(() => toast.error('Failed to load guardians'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (saved, mode) => {
    if (mode === 'add') setGuardians(p => [...p, saved]);
    else setGuardians(p => p.map(g => g.id === saved.id ? saved : g));
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this guardian?')) return;
    try {
      await api.delete(`/guardians/${id}`);
      setGuardians(p => p.filter(g => g.id !== id));
      toast.success('Guardian removed');
    } catch {
      toast.error('Failed to remove guardian');
    }
  };

  const activeGuardians = guardians.filter(g => g.status === 'ACTIVE');
  const invitedGuardians = guardians.filter(g => g.status === 'INVITED');

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand" />
            Guardians
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Trusted people who confirm your death to trigger inheritance
          </p>
        </div>
        <Button onClick={() => { setEditingGuardian(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Guardian
        </Button>
      </motion.div>

      {/* Status summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: 'Active', value: activeGuardians.length, color: 'success', icon: CheckCircle2 },
          { label: 'Pending', value: invitedGuardians.length, color: 'warning', icon: Clock },
          { label: 'Total', value: guardians.length, color: 'brand', icon: ShieldCheck },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-background-elevated border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-${color}/10 flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4.5 h-4.5 text-${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-text-primary">{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Quorum info */}
      {guardians.length > 0 && (
        <div className="p-4 rounded-xl bg-background-elevated border border-border">
          <p className="text-sm font-medium text-text-primary mb-2">Quorum Required</p>
          <div className="flex gap-2 mb-2">
            {guardians.map((g, i) => (
              <div
                key={g.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  g.status === 'ACTIVE' ? 'bg-success/20 text-success' : 'bg-border text-text-muted'
                }`}
              >
                {g.fullName[0]}
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted">
            At least 3 of {guardians.length} guardians must vote to confirm death before assets are distributed.
          </p>
        </div>
      )}

      {guardians.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-background-elevated border border-dashed border-border rounded-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-brand opacity-60" />
          </div>
          <h3 className="font-semibold text-text-primary mb-2">No guardians yet</h3>
          <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto">
            Add at least 3 trusted people to act as guardians for your inheritance plan
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Guardian
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {guardians.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                className="bg-background-elevated border border-border rounded-xl p-5 flex items-center gap-4 card-glow"
              >
                <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center text-success font-bold flex-shrink-0">
                  {g.fullName[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-text-primary">{g.fullName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[g.status] || ''}`}>
                      {g.status}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{g.email}</p>
                  {g.phone && <p className="text-xs text-text-muted">{g.phone}</p>}
                </div>

                {g.status === 'ACTIVE' && g.votes?.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-text-muted flex-shrink-0">
                    {g.votes[0]?.vote === 'APPROVE'
                      ? <ThumbsUp className="w-3.5 h-3.5 text-success" />
                      : <ThumbsDown className="w-3.5 h-3.5 text-danger" />
                    }
                    <span>Voted</span>
                  </div>
                )}

                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setEditingGuardian(g); setShowModal(true); }}
                    className="w-8 h-8 rounded-lg hover:bg-brand/10 flex items-center justify-center text-text-muted hover:text-brand transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="w-8 h-8 rounded-lg hover:bg-danger/10 flex items-center justify-center text-text-muted hover:text-danger transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <GuardianModal
            guardian={editingGuardian}
            onClose={() => { setShowModal(false); setEditingGuardian(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
