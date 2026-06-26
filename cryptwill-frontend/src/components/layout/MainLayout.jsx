import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LayoutDashboard, Coins, Vault, Users, UserCheck,
  BookOpen, Settings, LogOut, Bell, ChevronRight, Menu, X,
  CheckCircle, Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import ThemeToggle from '../common/ThemeToggle';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ownerNav = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/assets', icon: Coins, label: 'Assets' },
  { to: '/app/beneficiaries', icon: Users, label: 'Beneficiaries' },
  { to: '/app/guardians', icon: UserCheck, label: 'Guardians' },
  { to: '/app/vault', icon: Vault, label: 'Digital Vault' },
  { to: '/app/rulebook', icon: BookOpen, label: 'Rulebook' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
];

const beneficiaryNav = [
  { to: '/beneficiary', icon: LayoutDashboard, label: 'My Inheritance', end: true },
];

const guardianNav = [
  { to: '/guardian', icon: LayoutDashboard, label: 'Guardian Portal', end: true },
];

export default function MainLayout({ role = 'OWNER' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = role === 'BENEFICIARY' ? beneficiaryNav : role === 'GUARDIAN' ? guardianNav : ownerNav;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleCheckin = async () => {
    try {
      await api.post('/checkin');
      toast.success('✅ Check-in recorded on Stellar blockchain!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed left-0 top-0 h-full z-50 flex flex-col bg-background-secondary border-r border-border transition-all duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:z-auto w-64`}
        initial={false}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <NavLink to="/app" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-text-primary text-lg">CryptWill</span>
          </NavLink>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Badge */}
        {user?.plan && (
          <div className="px-4 pt-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
              user.plan === 'PRO' ? 'bg-brand/15 text-brand' : 
              user.plan === 'ENTERPRISE' ? 'bg-purple-500/15 text-purple-400' :
              'bg-background-elevated text-text-muted'
            }`}>
              <Zap className="w-3.5 h-3.5" />
              {user.plan} Plan
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-brand/15 text-brand'
                    : 'text-text-secondary hover:bg-background-elevated hover:text-text-primary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand rounded-full"
                    />
                  )}
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Check-in Button (Owner only) */}
        {role === 'OWNER' && (
          <div className="p-4 border-t border-border">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckin}
              className="w-full flex items-center gap-2 bg-success/10 hover:bg-success/20 text-success border border-success/30 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
            >
              <CheckCircle className="w-4 h-4" />
              I'm Alive — Check In
            </motion.button>
          </div>
        )}

        {/* User + Logout */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-sm font-bold text-brand flex-shrink-0">
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.fullName}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30 flex items-center gap-4 px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-text-secondary hover:text-text-primary"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="relative w-9 h-9 rounded-lg hover:bg-background-elevated flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
