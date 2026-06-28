import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LayoutDashboard, Coins, Vault, Users, UserCheck,
  BookOpen, Settings, LogOut, Bell, ChevronRight, Menu, X,
  CheckCircle, Zap, AlertCircle, X as XIcon, Scale
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import ThemeToggle from '../common/ThemeToggle';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ownerNavBase = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/assets', icon: Coins, label: 'Assets' },
  { to: '/app/beneficiaries', icon: Users, label: 'Beneficiaries' },
  { to: '/app/guardians', icon: UserCheck, label: 'Guardians' },
  { to: '/app/vault', icon: Vault, label: 'Digital Vault' },
  { to: '/app/rulebook', icon: BookOpen, label: 'Rulebook' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
];

const enterpriseNavItem = { to: '/app/lawyer-team', icon: Scale, label: 'Legal Team' };

const beneficiaryNav = [
  { to: '/beneficiary', icon: LayoutDashboard, label: 'My Inheritance', end: true },
];

const guardianNav = [
  { to: '/guardian', icon: LayoutDashboard, label: 'Guardian Portal', end: true },
];

export function MainLayout({ role = 'OWNER' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();

  /* Sidebar theme tokens — aligned to the rose-gold vault palette */
  const ST = isDark ? {
    pageBg:      'var(--color-bg)',
    sidebarBg:   'linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-secondary) 100%)',
    sidebarBdr:  'var(--color-border)',
    logoBg:      'linear-gradient(135deg, rgba(198,143,130,0.18), rgba(255,255,255,0.06))',
    logoBdr:     'rgba(198,143,130,0.24)',
    logoShadow:  '0 0 16px rgba(198,143,130,0.18)',
    logoIconClr: 'var(--color-brand)',
    logoTextClr: 'var(--color-text-primary)',
    divClr:      'var(--color-border)',
    navActive:   'linear-gradient(135deg, rgba(198,143,130,0.12), rgba(198,143,130,0.06))',
    navActiveBdr:'rgba(198,143,130,0.25)',
    navActiveClr:'var(--color-brand)',
    navInactiveClr:'var(--color-text-secondary)',
    navIndicator:'var(--color-brand)',
    avatarBg:    'rgba(198,143,130,0.12)',
    avatarBdr:   'rgba(198,143,130,0.25)',
    avatarClr:   'var(--color-brand)',
    userNameClr: 'var(--color-text-primary)',
    userEmailClr:'var(--color-text-secondary)',
    logoutClr:   'var(--color-text-muted)',
    headerBg:    'rgba(21,13,10,0.85)',
    headerBdr:   'var(--color-border)',
    closeBtnClr: 'rgba(198,143,130,0.65)',
    badgePlanBg: 'rgba(198,143,130,0.1)',
    badgePlanBdr:'rgba(198,143,130,0.22)',
    badgePlanClr:'var(--color-brand)',
    checkinBg:   'rgba(143,190,155,0.1)',
    checkinBdr:  'rgba(143,190,155,0.3)',
    checkinClr:  'var(--color-success)',
  } : {
    pageBg:      'var(--color-bg)',
    sidebarBg:   'linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-secondary) 100%)',
    sidebarBdr:  'var(--color-border)',
    logoBg:      'linear-gradient(135deg, rgba(198,143,130,0.16), rgba(255,255,255,0.8))',
    logoBdr:     'rgba(198,143,130,0.24)',
    logoShadow:  '0 0 16px rgba(198,143,130,0.14)',
    logoIconClr: 'var(--color-brand)',
    logoTextClr: 'var(--color-text-primary)',
    divClr:      'var(--color-border)',
    navActive:   'linear-gradient(135deg, rgba(198,143,130,0.12), rgba(198,143,130,0.08))',
    navActiveBdr:'rgba(198,143,130,0.25)',
    navActiveClr:'var(--color-brand)',
    navInactiveClr:'var(--color-text-secondary)',
    navIndicator:'var(--color-brand)',
    avatarBg:    'rgba(198,143,130,0.12)',
    avatarBdr:   'rgba(198,143,130,0.28)',
    avatarClr:   'var(--color-brand)',
    userNameClr: 'var(--color-text-primary)',
    userEmailClr:'var(--color-text-secondary)',
    logoutClr:   'var(--color-text-muted)',
    headerBg:    'rgba(245,235,230,0.85)',
    headerBdr:   'var(--color-border)',
    closeBtnClr: 'rgba(198,143,130,0.65)',
    badgePlanBg: 'rgba(198,143,130,0.1)',
    badgePlanBdr:'rgba(198,143,130,0.22)',
    badgePlanClr:'var(--color-brand)',
    checkinBg:   'rgba(143,190,155,0.1)',
    checkinBdr:  'rgba(143,190,155,0.3)',
    checkinClr:  'var(--color-success)',
  };

  const navItems = role === 'BENEFICIARY'
    ? beneficiaryNav
    : role === 'GUARDIAN'
      ? guardianNav
      : user?.plan === 'ENTERPRISE'
        ? [
            ...ownerNavBase.slice(0, 6),
            enterpriseNavItem,
            ownerNavBase[6],
          ]
        : ownerNavBase;

  useEffect(() => {
    if (role !== 'OWNER') return;

    let active = true;

    const loadNotifications = async () => {
      try {
        const res = await api.get('/notifications?limit=5');
        if (!active) return;
        setNotifications(res.data.data?.notifications || []);
      } catch (_) {}
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [role]);

  const handleLogout = async () => {
    try {
      if (role === 'GUARDIAN') {
        await api.post('/guardians/logout');
      } else {
        await api.post('/auth/logout');
      }
    } catch (_) {}
    logout();
    navigate(role === 'GUARDIAN' ? '/guardian/login' : '/login');
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
    <div className="min-h-screen h-screen flex overflow-hidden" style={{ background: ST.pageBg, transition:'background .3s' }}>
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
        className={`fixed left-0 top-0 h-full z-50 flex flex-col border-r transition-all duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto w-64`}
        style={{ background: ST.sidebarBg, borderColor: ST.sidebarBdr }}
        initial={false}
      >
        {/* Logo */}
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: ST.divClr }}>
          <NavLink to={role === 'GUARDIAN' ? '/guardian' : '/app'} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: ST.logoBg, border: `1px solid ${ST.logoBdr}`, boxShadow: ST.logoShadow }}>
              <Shield className="w-5 h-5" style={{ color: ST.logoIconClr }} />
            </div>
            <span className="font-bold text-lg font-serif"
              style={{ color: ST.logoTextClr }}>
              CryptWill
            </span>
          </NavLink>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"
            style={{ color: ST.closeBtnClr, background: 'none', border: 'none', cursor: 'pointer' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan / Role Badge */}
        <div className="px-4 pt-4">
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, background:ST.badgePlanBg, border:`1px solid ${ST.badgePlanBdr}`, fontSize:'0.75rem', fontWeight:600, color:ST.badgePlanClr }}>
            {role === 'GUARDIAN' ? <Shield className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            {role === 'GUARDIAN' ? 'Guardian Account' : role === 'BENEFICIARY' ? 'Beneficiary' : `${user?.plan || 'FREE'} Plan`}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => {
            const MotionNavLink = motion(NavLink);
            return (
              <MotionNavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={() => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative`}
                whileHover={{ x: 6 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                style={({ isActive }) => ({
                  background: isActive ? ST.navActive : 'transparent',
                  color: isActive ? ST.navActiveClr : ST.navInactiveClr,
                  border: isActive ? `1px solid ${ST.navActiveBdr}` : '1px solid transparent',
                })}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div layoutId="nav-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                        style={{ background: ST.navIndicator }} />
                    )}
                    <Icon className="w-[18px] h-[18px] flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    <span className="flex-1 transition-all duration-300">{label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                  </>
                )}
              </MotionNavLink>
            );
          })}
        </nav>

        {/* Check-in Button (Owner only) */}
        {role === 'OWNER' && (
          <div className="p-4" style={{ borderTop: `1px solid ${ST.divClr}` }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCheckin}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{ background: ST.checkinBg, border: `1px solid ${ST.checkinBdr}`, color: ST.checkinClr }}>
              <CheckCircle className="w-4 h-4" />
              I'm Alive — Check In
            </motion.button>
          </div>
        )}

        {/* User + Logout */}
        <div className="p-4 space-y-2" style={{ borderTop: `1px solid ${ST.divClr}` }}>
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: ST.avatarBg, border: `1px solid ${ST.avatarBdr}`, color: ST.avatarClr }}>
              {user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: ST.userNameClr }}>{user?.fullName || user?.email}</p>
              <p className="text-xs truncate" style={{ color: ST.userEmailClr }}>{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: ST.logoutClr }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = ST.logoutClr; e.currentTarget.style.background = ''; }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b sticky top-0 z-30 flex items-center gap-4 px-6"
          style={{ background: ST.headerBg, backdropFilter: 'blur(20px)', borderColor: ST.headerBdr }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-text-secondary hover:text-text-primary"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {role === 'OWNER' && (
              <div className="relative">
                <button
                  onClick={() => setAlertsOpen(v => !v)}
                  className="relative w-9 h-9 rounded-lg hover:bg-background-elevated flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full" />}
                </button>

                <AnimatePresence>
                  {alertsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-background-elevated shadow-2xl overflow-hidden z-50"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <div>
                          <p className="font-semibold text-text-primary text-sm">Alerts</p>
                          <p className="text-xs text-text-muted">Recent email and system notifications</p>
                        </div>
                        <button onClick={() => setAlertsOpen(false)} className="text-text-muted hover:text-text-primary">
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="max-h-96 overflow-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-sm text-text-muted">No alerts yet.</div>
                        ) : notifications.map((notification) => (
                          <div key={notification.id} className="px-4 py-3 border-b border-border last:border-0 flex gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${notification.status === 'FAILED' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                              <AlertCircle className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">{notification.subject || notification.type}</p>
                              <p className="text-xs text-text-muted truncate">{notification.recipient || notification.channel}</p>
                              <p className="text-[11px] text-text-muted mt-1">{notification.status}{notification.sentAt ? ` • ${new Date(notification.sentAt).toLocaleString()}` : ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.985 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} // smooth cubic-bezier curve
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
