import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Shield, CreditCard, Wallet, Check, ArrowRight, ArrowLeft,
  Upload, FileText, Image, File, AlertTriangle, Key, Heart, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { encryptFileBuffer } from '../../utils/encryption';
import CryptoJS from 'crypto-js';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  // Step 1: Personal Details
  const [personalForm, setPersonalForm] = useState({
    dateOfBirth: '',
    country: user?.country || '',
    phone: user?.phone || '',
  });

  // Step 2: KYC Details
  const [kycType, setKycType] = useState('Aadhaar');
  const [kycFile, setKycFile] = useState(null);
  const [kycUploading, setKycUploading] = useState(false);
  const [kycUploaded, setKycUploaded] = useState(false);

  // Step 3: Bank Declaration
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
  });

  // Step 4: Plan Selection
  const [selectedPlan, setSelectedPlan] = useState('FREE');

  // Step 5: Wallet Connection
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '');
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [isDemoWallet, setIsDemoWallet] = useState(false);

  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    // Fetch fresh profile in case user details changed
    api.get('/user/profile')
      .then(res => {
        const freshUser = res.data.data.user;
        updateUser(freshUser);
        if (freshUser.isOnboarded) {
          navigate('/app');
        }
      })
      .catch(() => {});
  }, []);

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    if (!personalForm.dateOfBirth) {
      toast.error('Please enter your Date of Birth');
      return;
    }
    if (!personalForm.country) {
      toast.error('Please enter your Country');
      return;
    }
    try {
      const res = await api.put('/user/profile', {
        dateOfBirth: personalForm.dateOfBirth,
        country: personalForm.country,
        phone: personalForm.phone,
      });
      updateUser(res.data.data.user);
      setStep(2);
    } catch (err) {
      toast.error('Failed to update personal details.');
    }
  };

  const handleKycFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setKycFile(file);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycFile) {
      toast.error('Please upload your KYC document');
      return;
    }
    setKycUploading(true);
    try {
      // 1. Read file as buffer
      const buffer = await kycFile.arrayBuffer();

      // 2. Encrypt client side before uploading (using key derived from user email)
      const kycKey = CryptoJS.SHA256(user.email + '-kyc-salt').toString();
      const encryptedBlob = await encryptFileBuffer(buffer, kycKey);

      // 3. Prepare FormData
      const formData = new FormData();
      formData.append('file', encryptedBlob, `${kycFile.name}.enc`);
      formData.append('documentType', kycType);

      await api.post('/user/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('KYC document encrypted and uploaded successfully!');
      setKycUploaded(true);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'KYC upload failed. Please try again.');
    } finally {
      setKycUploading(false);
    }
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.ifsc) {
      toast.error('All bank fields are required');
      return;
    }
    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      toast.error('Account numbers do not match');
      return;
    }
    try {
      await api.post('/user/bank-declaration', {
        bankName: bankForm.bankName,
        accountNumber: bankForm.accountNumber,
        ifsc: bankForm.ifsc,
      });
      setStep(4);
    } catch (err) {
      toast.error('Failed to save bank declaration');
    }
  };

  const handleConnectFreighter = async () => {
    setWalletConnecting(true);
    try {
      // Dynamically import freighter to handle cases where it isn't available
      const freighter = await import('@stellar/freighter-api');
      
      const isInstalled = await freighter.isAuthorized();
      if (!isInstalled) {
        toast.error('Freighter wallet extension not found. Please install it or use the Demo Wallet generator below.');
        setWalletConnecting(false);
        return;
      }
      
      const address = await freighter.requestAccess();
      if (address) {
        setWalletAddress(address);
        setIsDemoWallet(false);
        toast.success('Freighter wallet connected successfully!');
      } else {
        toast.error('Failed to retrieve wallet address.');
      }
    } catch (err) {
      toast.error('Freighter wallet not found! Please install the extension or click "Generate Demo Wallet" below.');
    } finally {
      setWalletConnecting(false);
    }
  };

  const handleGenerateDemoWallet = async () => {
    // Generate a random mock Stellar keypair for demo convenience
    try {
      const { Keypair } = await import('stellar-sdk');
      const pair = Keypair.random();
      setWalletAddress(pair.publicKey());
      setIsDemoWallet(true);
      toast.success('Generated mock Stellar wallet address for demo! 🚀');
    } catch {
      // Fallback manual random key generator
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let mockAddr = 'G';
      for (let i = 0; i < 55; i++) {
        mockAddr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setWalletAddress(mockAddr);
      setIsDemoWallet(true);
      toast.success('Generated simulated Stellar wallet address! 🚀');
    }
  };

  const handleCompleteSetup = async () => {
    if (!walletAddress) {
      toast.error('Please connect or input a Stellar wallet address to complete setup');
      return;
    }
    setCompleting(true);
    try {
      // 1. Save wallet address to profile
      await api.put('/user/profile', { walletAddress });

      // 2. Complete onboarding
      const res = await api.post('/user/onboarding-complete');

      toast.success('🎉 Setup complete! Welcome to CryptWill.');
      updateUser({ isOnboarded: true, walletAddress });
      navigate('/app');
    } catch (err) {
      toast.error('Failed to complete onboarding setup.');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-text-primary">
      <div className="w-full max-w-xl bg-background-secondary border border-border rounded-2xl shadow-xl p-8 space-y-8 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">CryptWill Setup</h1>
            <p className="text-xs text-text-secondary">Complete 5 quick steps to secure your inheritance</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-text-muted">
            <span>Step {step} of 5</span>
            <span>{Math.round((step / 5) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Wizard Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handlePersonalSubmit}
              className="space-y-5"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 1: Personal Details</h3>
                <p className="text-xs text-text-secondary">We need a few details to verify your identity.</p>
              </div>

              <Input
                label="Date of Birth"
                type="date"
                value={personalForm.dateOfBirth}
                onChange={e => setPersonalForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                required
              />

              <Input
                label="Country of Residence"
                placeholder="e.g. India, United States"
                value={personalForm.country}
                onChange={e => setPersonalForm(p => ({ ...p, country: e.target.value }))}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={personalForm.phone}
                onChange={e => setPersonalForm(p => ({ ...p, phone: e.target.value }))}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" size="md">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleKycSubmit}
              className="space-y-5"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 2: KYC Document Upload</h3>
                <p className="text-xs text-text-secondary">
                  Upload an ID document (Aadhaar, PAN, or Passport). The file will be encrypted on your device before upload.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary block">Document Type</label>
                <div className="flex gap-2">
                  {['Aadhaar', 'PAN', 'Passport'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setKycType(type)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                        kycType === type ? 'border-brand bg-brand/10 text-brand' : 'border-border text-text-secondary'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Zone */}
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-background relative hover:border-brand/50 transition-colors">
                <input
                  type="file"
                  id="kyc-file-input"
                  onChange={handleKycFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
                  className="hidden"
                />
                <label htmlFor="kyc-file-input" className="cursor-pointer block space-y-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5 text-brand" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      {kycFile ? kycFile.name : 'Choose a file or drag here'}
                    </p>
                    <p className="text-xs text-text-muted">PDF, PNG, JPG, DOCX or TXT (Max 10MB)</p>
                  </div>
                </label>
              </div>

              {/* Encryption Notice */}
              <div className="p-3 bg-brand/5 border border-brand/20 rounded-xl flex gap-2.5 items-start">
                <Key className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  <strong>Client-Side Encrypted</strong>: Your ID is transformed with AES-256 before leaving your browser.
                  We cannot view it without your key.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" isLoading={kycUploading} disabled={!kycFile}>
                  Verify & Upload
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleBankSubmit}
              className="space-y-5"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 3: Bank Account Declaration</h3>
                <p className="text-xs text-text-secondary">
                  Declare a bank account as a backup estate record. This is for reference only and is never used for payment.
                </p>
              </div>

              <Input
                label="Bank Name"
                placeholder="e.g. HDFC Bank, SBI"
                value={bankForm.bankName}
                onChange={e => setBankForm(p => ({ ...p, bankName: e.target.value }))}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Account Number"
                  type="password"
                  placeholder="••••••••••••"
                  value={bankForm.accountNumber}
                  onChange={e => setBankForm(p => ({ ...p, accountNumber: e.target.value }))}
                  required
                />
                <Input
                  label="Confirm Account Number"
                  placeholder="Re-enter account number"
                  value={bankForm.confirmAccountNumber}
                  onChange={e => setBankForm(p => ({ ...p, confirmAccountNumber: e.target.value }))}
                  required
                />
              </div>

              <Input
                label="IFSC Code"
                placeholder="e.g. HDFC0001234"
                value={bankForm.ifsc}
                onChange={e => setBankForm(p => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
                required
              />

              <div className="flex justify-between pt-4">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button type="submit">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.form>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 4: Select Subscription Plan</h3>
                <p className="text-xs text-text-secondary">Choose a tier that fits your asset management needs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                {/* Free Plan */}
                <div
                  onClick={() => setSelectedPlan('FREE')}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between relative ${
                    selectedPlan === 'FREE' ? 'border-brand bg-brand/5 shadow-md shadow-brand/10' : 'border-border bg-background'
                  }`}
                >
                  <div className="space-y-2">
                    <p className="font-semibold text-text-primary">FREE Plan</p>
                    <p className="text-2xl font-bold">₹0 <span className="text-xs font-normal text-text-muted">forever</span></p>
                    <ul className="text-xs text-text-secondary space-y-1 pt-2">
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> 4 beneficiaries</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> 5 guardians</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> 30-day check-in</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> 500MB vault</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> Email notifications</li>
                    </ul>
                  </div>
                  {selectedPlan === 'FREE' && (
                    <div className="mt-4 bg-brand text-white text-xs py-1 rounded text-center font-semibold">
                      Selected
                    </div>
                  )}
                </div>

                {/* Pro Plan */}
                <div
                  onClick={() => setSelectedPlan('PRO')}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between relative z-10 scale-[1.02] ${
                    selectedPlan === 'PRO' ? 'border-brand bg-brand/5 shadow-lg shadow-brand/20' : 'border-border bg-background'
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs px-3 py-1 rounded-full font-semibold">
                    Most Popular
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-brand">PRO Plan</p>
                    <p className="text-2xl font-bold">₹1,499 <span className="text-xs font-normal text-text-muted">/ month</span></p>
                    <ul className="text-xs text-text-secondary space-y-1 pt-2">
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> 10 beneficiaries</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> 7 guardians</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> Custom intervals</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> 5GB vault</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> SMS alerts</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> PDF will export</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> Priority support</li>
                    </ul>
                  </div>
                  {selectedPlan === 'PRO' && (
                    <div className="mt-4 bg-brand text-white text-xs py-1 rounded text-center font-semibold">
                      Demo Mode Selected
                    </div>
                  )}
                </div>

                {/* Enterprise Plan */}
                <div
                  onClick={() => setSelectedPlan('ENTERPRISE')}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between relative ${
                    selectedPlan === 'ENTERPRISE' ? 'border-brand bg-brand/5 shadow-md shadow-brand/10' : 'border-border bg-background'
                  }`}
                >
                  <div className="space-y-2">
                    <p className="font-semibold text-text-primary">ENTERPRISE Plan</p>
                    <p className="text-2xl font-bold">₹3,999 <span className="text-xs font-normal text-text-muted">/ month</span></p>
                    <ul className="text-xs text-text-secondary space-y-1 pt-2">
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> Unlimited assets</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> Unlimited beneficiaries</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> Unlimited guardians</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> Lawyer management team</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> 50GB encrypted vault</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> Dedicated account manager</li>
                    </ul>
                  </div>
                  {selectedPlan === 'ENTERPRISE' && (
                    <div className="mt-4 bg-brand text-white text-xs py-1 rounded text-center font-semibold">
                      Selected
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="secondary" onClick={() => setStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setStep(5)}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 5: Connect Stellar Wallet</h3>
                <p className="text-xs text-text-secondary">
                  Connect your Freighter browser wallet to sign check-ins and deploy smart contracts.
                </p>
              </div>

              {walletAddress ? (
                <div className="bg-success/5 border border-success/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-success">
                    <Check className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-semibold">Wallet Connected!</p>
                  </div>
                  <div className="bg-background px-3 py-2 rounded-lg font-mono text-[10px] break-all select-all text-text-secondary border border-border">
                    {walletAddress}
                  </div>
                  {isDemoWallet && (
                    <p className="text-[10px] text-warning">
                      ⚠️ Operating with a simulated Stellar address (Developer Mode).
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    onClick={handleConnectFreighter}
                    isLoading={walletConnecting}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    Connect Freighter Wallet
                  </Button>

                  <div className="text-center text-xs text-text-muted">or</div>

                  <button
                    onClick={handleGenerateDemoWallet}
                    className="w-full py-2.5 px-4 rounded-lg bg-background-elevated hover:bg-border text-xs text-text-secondary font-semibold transition-colors flex items-center justify-center gap-2 border border-border"
                  >
                    🚀 Generate Demo Wallet (Testing)
                  </button>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-border">
                <Button type="button" variant="secondary" onClick={() => setStep(4)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleCompleteSetup}
                  isLoading={completing}
                  disabled={!walletAddress}
                >
                  Complete Setup
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
