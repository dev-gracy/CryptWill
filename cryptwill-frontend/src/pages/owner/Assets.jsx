import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, Plus, Trash2, Edit3, X, Check, Wallet, FileText,
  Image, Gem, DollarSign, Tag, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const assetTypeIcons = {
  STELLAR_WALLET: Wallet,
  CUSTOM_TOKEN: Coins,
  NFT: Gem,
  DOCUMENT: FileText,
};

const assetTypeLabels = {
  STELLAR_WALLET: 'Stellar Wallet',
  CUSTOM_TOKEN: 'Custom Token',
  NFT: 'NFT',
  DOCUMENT: 'Document',
};

const assetTypeColors = {
  STELLAR_WALLET: 'text-brand bg-brand/10',
  CUSTOM_TOKEN: 'text-warning bg-warning/10',
  NFT: 'text-purple-400 bg-purple-500/10',
  DOCUMENT: 'text-success bg-success/10',
};

function AssetModal({ asset, onClose, onSave }) {
  const isEdit = !!asset?.id;
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = {
    register: () => ({ onChange: () => {}, onBlur: () => {}, name: '', ref: () => {} }),
    handleSubmit: (fn) => (e) => { e.preventDefault(); fn(formData); },
    reset: () => {},
    formState: { isSubmitting: false, errors: {} }
  };

  const [formData, setFormData] = useState({
    assetName: asset?.assetName || '',
    assetType: asset?.assetType || 'STELLAR_WALLET',
    walletAddress: asset?.walletAddress || '',
    tokenCode: asset?.tokenCode || '',
    estimatedValueUsd: asset?.estimatedValueUsd || '',
    specialInstructions: asset?.specialInstructions || '',
    releaseDay: asset?.releaseDay || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.assetName.trim()) { toast.error('Asset name is required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const res = await api.put(`/assets/${asset.id}`, formData);
        onSave(res.data.data, 'edit');
      } else {
        const res = await api.post('/assets', formData);
        onSave(res.data.data, 'add');
      }
      toast.success(isEdit ? 'Asset updated!' : 'Asset added!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background-elevated border border-border rounded-2xl w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Coins className="w-5 h-5 text-brand" />
            {isEdit ? 'Edit Asset' : 'Add New Asset'}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Asset Name</label>
            <input
              name="assetName"
              value={formData.assetName}
              onChange={handleChange}
              placeholder="My Main Stellar Wallet"
              className="flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Asset Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(assetTypeLabels).map(([type, label]) => {
                const Icon = assetTypeIcons[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, assetType: type }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      formData.assetType === type
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border text-text-secondary hover:border-brand/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {(formData.assetType === 'STELLAR_WALLET' || formData.assetType === 'CUSTOM_TOKEN') && (
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1.5 block">Wallet Address</label>
              <input
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                placeholder="G... (Stellar public key)"
                className="flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted"
              />
            </div>
          )}

          {formData.assetType === 'CUSTOM_TOKEN' && (
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1.5 block">Token Code</label>
              <input
                name="tokenCode"
                value={formData.tokenCode}
                onChange={handleChange}
                placeholder="e.g. USDC, YXLM"
                className="flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1.5 block">Est. Value (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  name="estimatedValueUsd"
                  type="number"
                  value={formData.estimatedValueUsd}
                  onChange={handleChange}
                  placeholder="10000"
                  className="flex h-11 w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1.5 block">Release (Day)</label>
              <input
                name="releaseDay"
                type="number"
                min="0"
                value={formData.releaseDay}
                onChange={handleChange}
                placeholder="0 = immediate"
                className="flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Special Instructions</label>
            <textarea
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleChange}
              rows={3}
              placeholder="Any special notes for beneficiaries..."
              className="flex w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand placeholder:text-text-muted resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} className="flex-1">
              {isEdit ? 'Save Changes' : 'Add Asset'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  useEffect(() => {
    api.get('/assets').then(res => {
      setAssets(res.data.data || []);
    }).catch(() => toast.error('Failed to load assets')).finally(() => setLoading(false));
  }, []);

  const handleSave = (savedAsset, mode) => {
    if (mode === 'add') setAssets(p => [...p, savedAsset]);
    else setAssets(p => p.map(a => a.id === savedAsset.id ? savedAsset : a));
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await api.delete(`/assets/${id}`);
      setAssets(p => p.filter(a => a.id !== id));
      toast.success('Asset deleted');
    } catch {
      toast.error('Failed to delete asset');
    }
  };

  const totalValue = assets.reduce((sum, a) => sum + (parseFloat(a.estimatedValueUsd) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Coins className="w-6 h-6 text-brand" />
            Asset Registry
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Register all crypto assets you want to include in your inheritance plan
          </p>
        </div>
        <Button onClick={() => { setEditingAsset(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </motion.div>

      {/* Portfolio value */}
      {assets.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-2xl p-5"
        >
          <p className="text-sm text-text-secondary mb-1">Total Estimated Portfolio Value</p>
          <p className="text-3xl font-bold text-text-primary">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-text-muted mt-1">{assets.length} asset{assets.length !== 1 ? 's' : ''} registered</p>
        </motion.div>
      )}

      {/* Assets list */}
      {assets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-background-elevated border border-dashed border-border rounded-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-brand opacity-60" />
          </div>
          <h3 className="font-semibold text-text-primary mb-2">No assets yet</h3>
          <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto">
            Add your first crypto asset to start building your inheritance plan
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Asset
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {assets.map((asset, i) => {
              const Icon = assetTypeIcons[asset.assetType] || Coins;
              const colorClass = assetTypeColors[asset.assetType] || 'text-brand bg-brand/10';
              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="bg-background-elevated border border-border rounded-xl p-5 flex items-center gap-4 card-glow"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-text-primary">{asset.assetName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                        {assetTypeLabels[asset.assetType]}
                      </span>
                    </div>
                    {asset.walletAddress && (
                      <p className="text-xs text-text-muted font-mono truncate">{asset.walletAddress}</p>
                    )}
                    {asset.tokenCode && (
                      <p className="text-xs text-text-muted">Token: {asset.tokenCode}</p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    {asset.estimatedValueUsd && (
                      <p className="font-semibold text-text-primary text-sm">
                        ${parseFloat(asset.estimatedValueUsd).toLocaleString()}
                      </p>
                    )}
                    {asset.releaseDay > 0 && (
                      <p className="text-xs text-text-muted">Day {asset.releaseDay}</p>
                    )}
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => { setEditingAsset(asset); setShowModal(true); }}
                      className="w-8 h-8 rounded-lg hover:bg-brand/10 flex items-center justify-center text-text-muted hover:text-brand transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
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

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <AssetModal
            asset={editingAsset}
            onClose={() => { setShowModal(false); setEditingAsset(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
