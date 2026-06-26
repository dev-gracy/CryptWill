import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  BookOpen, Plus, Trash2, Edit3, X, GripVertical, Check,
  Clock, DollarSign, Users, FileText, Heart, AlertTriangle,
  ChevronDown, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/common/Button';

const RULE_TYPES = [
  { value: 'MESSAGE', label: 'Personal Message', icon: Heart, color: 'text-pink-400 bg-pink-500/10' },
  { value: 'ASSET_INSTRUCTION', label: 'Asset Instruction', icon: DollarSign, color: 'text-warning bg-warning/10' },
  { value: 'CONDITION', label: 'Conditional Rule', icon: AlertTriangle, color: 'text-brand bg-brand/10' },
  { value: 'DOCUMENT_REF', label: 'Document Reference', icon: FileText, color: 'text-success bg-success/10' },
  { value: 'CONTACT', label: 'Key Contact', icon: Users, color: 'text-purple-400 bg-purple-500/10' },
  { value: 'TIMING', label: 'Timing Rule', icon: Clock, color: 'text-text-secondary bg-border' },
];

function RuleCard({ rule, onEdit, onDelete, index }) {
  const ruleType = RULE_TYPES.find(t => t.value === rule.type) || RULE_TYPES[0];
  const Icon = ruleType.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.04 }}
      className="bg-background-elevated border border-border rounded-xl p-4 flex items-start gap-3 group"
    >
      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        <GripVertical className="w-4 h-4 text-text-muted cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ruleType.color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs text-text-muted">{ruleType.label}</p>
        </div>
        <p className="text-sm font-medium text-text-primary leading-relaxed">{rule.title}</p>
        {rule.body && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{rule.body}</p>}
        {rule.conditions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {rule.conditions.map((c, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-brand/10 text-brand rounded-full">{c}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(rule)}
          className="w-7 h-7 rounded-lg hover:bg-brand/10 flex items-center justify-center text-text-muted hover:text-brand transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(rule.id)}
          className="w-7 h-7 rounded-lg hover:bg-danger/10 flex items-center justify-center text-text-muted hover:text-danger transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function RuleModal({ rule, onClose, onSave }) {
  const isEdit = !!rule?.id;
  const [form, setForm] = useState({
    type: rule?.type || 'MESSAGE',
    title: rule?.title || '',
    body: rule?.body || '',
    conditions: rule?.conditions?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Rule title is required'); return; }
    const ruleObj = {
      id: rule?.id || `rule_${Date.now()}`,
      type: form.type,
      title: form.title,
      body: form.body,
      conditions: form.conditions ? form.conditions.split(',').map(c => c.trim()).filter(Boolean) : [],
      createdAt: rule?.createdAt || new Date().toISOString(),
    };
    onSave(ruleObj, isEdit ? 'edit' : 'add');
    onClose();
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
          <h3 className="font-semibold text-text-primary">{isEdit ? 'Edit Rule' : 'Add Rule'}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Type selector */}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">Rule Type</label>
            <div className="grid grid-cols-2 gap-2">
              {RULE_TYPES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: value }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    form.type === value ? 'border-brand bg-brand/10 text-brand' : 'border-border text-text-secondary hover:border-brand/30'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Title / Heading <span className="text-danger">*</span></label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Send my Bitcoin to Alice after 1 year"
              className="flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Details / Message</label>
            <textarea
              value={form.body}
              onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              rows={4}
              placeholder="Write your full instruction, message, or condition details..."
              className="flex w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Conditions (comma-separated)</label>
            <input
              value={form.conditions}
              onChange={e => setForm(p => ({ ...p, conditions: e.target.value }))}
              placeholder="e.g. After 6 months, If Alice is 18+"
              className="flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1">{isEdit ? 'Save' : 'Add Rule'}</Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Rulebook() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api.get('/rulebook').then(res => setRules(res.data.data?.rules || []))
      .catch(() => toast.error('Failed to load rulebook'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (savedRule, mode) => {
    if (mode === 'add') setRules(p => [...p, savedRule]);
    else setRules(p => p.map(r => r.id === savedRule.id ? savedRule : r));
    setDirty(true);
  };

  const handleDelete = (id) => {
    setRules(p => p.filter(r => r.id !== id));
    setDirty(true);
  };

  const handlePersist = async () => {
    setSaving(true);
    try {
      await api.put('/rulebook', { rules });
      toast.success('Rulebook saved!');
      setDirty(false);
    } catch {
      toast.error('Failed to save rulebook');
    } finally {
      setSaving(false);
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
            <BookOpen className="w-6 h-6 text-brand" />
            Personal Rulebook
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Define your personal rules and messages to be applied when your will is executed
          </p>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <Button onClick={handlePersist} isLoading={saving} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save Rules
            </Button>
          )}
          <Button onClick={() => { setEditingRule(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </motion.div>

      {/* Info banner */}
      <div className="p-4 rounded-xl bg-background-elevated border border-border">
        <p className="text-sm font-medium text-text-primary mb-2">📜 What is a Rulebook?</p>
        <p className="text-sm text-text-secondary">
          Your rulebook is a set of personal instructions, messages, and conditions that will be executed when your digital will is triggered. 
          Think of it as a letter to your loved ones with specific guidelines for distributing your digital legacy.
        </p>
      </div>

      {rules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-background-elevated border border-dashed border-border rounded-2xl"
        >
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-brand opacity-30" />
          <h3 className="font-semibold text-text-primary mb-2">No rules yet</h3>
          <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto">
            Add personal messages, asset instructions, or conditions for your digital inheritance
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Rule
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {rules.map((rule, i) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                index={i}
                onEdit={(r) => { setEditingRule(r); setShowModal(true); }}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>

          {dirty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between p-3 rounded-xl bg-warning/5 border border-warning/30"
            >
              <p className="text-sm text-warning flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Unsaved changes
              </p>
              <Button size="sm" onClick={handlePersist} isLoading={saving}>Save Now</Button>
            </motion.div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <RuleModal
            rule={editingRule}
            onClose={() => { setShowModal(false); setEditingRule(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
