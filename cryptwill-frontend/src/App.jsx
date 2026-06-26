import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useEffect } from 'react';
import api from './services/api';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Public Pages
import Landing from './pages/public/Landing';
import InstantCheckin from './pages/public/InstantCheckin';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VerifyOtp from './pages/auth/VerifyOtp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Owner Pages
import Dashboard from './pages/owner/Dashboard';
import Assets from './pages/owner/Assets';
import Vault from './pages/owner/Vault';
import Beneficiaries from './pages/owner/Beneficiaries';
import Guardians from './pages/owner/Guardians';
import Rulebook from './pages/owner/Rulebook';
import Settings from './pages/owner/settings/Settings';
import Checkin from './pages/owner/Checkin';
import ContractStatus from './pages/owner/ContractStatus';

// Beneficiary Pages
import BeneficiaryDashboard from './pages/beneficiary/BeneficiaryDashboard';
import BeneficiaryPortal from './pages/beneficiary/BeneficiaryPortal';

// Guardian Pages
import GuardianDashboard from './pages/guardian/GuardianDashboard';
import GuardianPortal from './pages/guardian/GuardianPortal';

// Enterprise Pages
import EnterprisePortal from './pages/enterprise/EnterprisePortal';

// Protected Route Wrapper
const ProtectedRoute = ({ children, role = 'OWNER' }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const theme = useThemeStore(state => state.theme);
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Apply theme on mount
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      if (isAuthenticated) return;
      try {
        const response = await api.post('/auth/refresh');
        if (cancelled) return;
        const { accessToken, user } = response.data.data;
        if (accessToken && user) {
          login(user, accessToken);
        }
      } catch (_) {
        if (!cancelled) {
          useAuthStore.getState().logout();
        }
      }
    }

    hydrateSession();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, login]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/checkin/instant/:token" element={<InstantCheckin />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Owner App Routes */}
        <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="checkin" element={<Checkin />} />
          <Route path="contract" element={<ContractStatus />} />
          <Route path="vault" element={<Vault />} />
          <Route path="beneficiaries" element={<Beneficiaries />} />
          <Route path="guardians" element={<Guardians />} />
          <Route path="rulebook" element={<Rulebook />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Beneficiary Portal */}
        <Route path="/beneficiary" element={<ProtectedRoute role="BENEFICIARY"><MainLayout role="BENEFICIARY" /></ProtectedRoute>}>
          <Route index element={<BeneficiaryDashboard />} />
          <Route path="portal" element={<BeneficiaryPortal />} />
        </Route>

        {/* Guardian Portal */}
        <Route path="/guardian" element={<ProtectedRoute role="GUARDIAN"><MainLayout role="GUARDIAN" /></ProtectedRoute>}>
          <Route index element={<GuardianDashboard />} />
          <Route path="portal" element={<GuardianPortal />} />
        </Route>

        <Route path="/enterprise" element={<ProtectedRoute role="ENTERPRISE"><EnterprisePortal /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
