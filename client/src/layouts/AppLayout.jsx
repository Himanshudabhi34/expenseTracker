import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Target,
  BarChart3,
  User,
  Bell,
  Moon,
  Sun,
  LogOut,
  Menu,
  Plus,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/common/index.jsx';
import NotificationsBell from '../components/notifications/NotificationsBell.jsx';
import AgentWidget from '../components/agent/AgentWidget.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/goals', label: 'Saving Goals', icon: Target },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

const TITLES = {
  '/': ['Dashboard', 'Your financial overview at a glance'],
  '/transactions': ['Transactions', 'Search, filter and manage your records'],
  '/budgets': ['Budgets', 'Track monthly and category budgets'],
  '/goals': ['Saving Goals', 'Plan and follow your savings targets'],
  '/reports': ['Reports & Analytics', 'Understand where your money goes'],
  '/notifications': ['Notifications', 'Budget alerts, goals and important activity'],
  '/profile': ['Profile', 'Manage your account and preferences'],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('det_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('det_theme', theme);
  }, [theme]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const initials = (user?.name || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const [title, subtitle] = TITLES[location.pathname] || ['', ''];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      {open ? <div className="scrim" onClick={() => setOpen(false)} /> : null}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__brand-mark">₹</div>
          <div className="sidebar__brand-text">
            Expense Agent
            <small>Daily Tracker</small>
          </div>
        </div>

        <nav className="sidebar__nav">
          <div className="nav-group-label">Menu</div>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
          <div className="nav-group-label">Account</div>
          <NavLink
            to="/notifications"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Bell size={18} />
            Notifications
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <User size={18} />
            Profile
          </NavLink>
        </nav>

        <div className="sidebar__footer">
          <div className="user-pill">
            <div className="avatar">{initials}</div>
            <div className="user-pill__meta">
              <div className="user-pill__name">{user?.name}</div>
              <div className="user-pill__email">{user?.email}</div>
            </div>
            <button
              className="icon-btn"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="flex">
            <button
              className="icon-btn mobile-nav-toggle"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="topbar__title">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
          <div className="topbar__actions">
            <NotificationsBell />
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => navigate('/transactions', { state: { openForm: true } })}
            >
              Add
            </Button>
            <button
              className="icon-btn"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <AgentWidget />
    </div>
  );
}

export function WalletBadge() {
  return (
    <span className="flex" style={{ color: 'var(--brand-1)' }}>
      <Wallet size={16} /> Balance
    </span>
  );
}
