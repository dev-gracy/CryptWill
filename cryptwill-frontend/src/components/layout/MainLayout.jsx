import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const navItems = [
  { to: '/app', label: 'Dashboard' },
  { to: '/app/assets', label: 'Assets' },
  { to: '/app/checkin', label: 'Check-in' },
  { to: '/app/vault', label: 'Vault' },
  { to: '/app/beneficiaries', label: 'Beneficiaries' },
  { to: '/app/guardians', label: 'Guardians' },
  { to: '/app/contract', label: 'Contract' },
  { to: '/app/rulebook', label: 'Rulebook' },
  { to: '/app/settings', label: 'Settings' },
];

export default function MainLayout({ role = 'OWNER' }) {
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-border bg-bg-secondary/70 p-6 backdrop-blur">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">CryptWill</p>
            <h2 className="mt-2 text-xl font-semibold">{role === 'OWNER' ? 'Owner Console' : role === 'GUARDIAN' ? 'Guardian Portal' : 'Beneficiary Portal'}</h2>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-3 text-sm transition ${isActive ? 'bg-brand text-white' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-10 space-y-3">
            <button onClick={toggleTheme} className="w-full rounded-xl border border-border px-4 py-3 text-sm text-text-secondary hover:text-text-primary">
              {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white"
            >
              Sign out
            </button>
          </div>
        </aside>
        <main className="p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}