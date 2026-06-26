import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useEffect } from 'react';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Public Pages
import Landing from './pages/public/Landing';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VerifyOtp from './pages/auth/VerifyOtp';

// Owner Pages
import Onboarding from './pages/owner/Onboarding';
import Dashboard from './pages/owner/Dashboard';
import Assets from './pages/owner/Assets';
import Vault from './pages/owner/Vault';
import Beneficiaries from './pages/owner/Beneficiaries';
import Guardians from './pages/owner/Guardians';
import Rulebook from './pages/owner/Rulebook';
import Settings from './pages/owner/settings/Settings';

// Beneficiary Pages
import BeneficiaryDashboard from './pages/beneficiary/BeneficiaryDashboard';

// Guardian Pages
import GuardianDashboard from './pages/guardian/GuardianDashboard';
import GuardianLogin from './pages/guardian/GuardianLogin';
import GuardianInvite from './pages/guardian/GuardianInvite';

// Checkin
import InstantCheckin from './pages/public/InstantCheckin';

// Protected Route Wrapper
const ProtectedRoute = ({ children, role = 'OWNER' }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Only check onboarding for OWNER role
  if (role === 'OWNER' && user && !user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

// Onboarding Guard
const ProtectedRouteOnboarding = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && user.isOnboarded) return <Navigate to="/app" replace />;
  return children;
};

function App() {
  const theme = useThemeStore(state => state.theme);

  useEffect(() => {
    // Apply theme on mount
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
        </Route>

        {/* Owner Onboarding */}
        <Route path="/onboarding" element={<ProtectedRouteOnboarding><Onboarding /></ProtectedRouteOnboarding>} />

        {/* Owner App Routes */}
        <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="vault" element={<Vault />} />
          <Route path="beneficiaries" element={<Beneficiaries />} />
          <Route path="guardians" element={<Guardians />} />
          <Route path="rulebook" element={<Rulebook />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Beneficiary Portal */}
        <Route path="/beneficiary" element={<ProtectedRoute role="BENEFICIARY"><MainLayout role="BENEFICIARY" /></ProtectedRoute>}>
          <Route index element={<BeneficiaryDashboard />} />
        </Route>

        {/* Guardian Public Routes */}
        <Route path="/guardian/login" element={<GuardianLogin />} />
        <Route path="/guardian/invite/:token" element={<GuardianInvite />} />

        {/* Guardian Portal */}
        <Route path="/guardian" element={<ProtectedRoute role="GUARDIAN"><MainLayout role="GUARDIAN" /></ProtectedRoute>}>
          <Route index element={<GuardianDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
