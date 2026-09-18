import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/hospitals', label: 'Hospitals', icon: '🏥' },
  { to: '/medicines', label: 'Medicines', icon: '💊' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/suppliers', label: 'Suppliers', icon: '🚚' },
  { to: '/purchases', label: 'Purchases', icon: '🛒' },
  { to: '/consumption', label: 'Consumption', icon: '📋' },
  { to: '/ai-insights', label: 'AI Insights', icon: '🤖' },
  { to: '/network', label: 'Hospital Network', icon: '🔗' },
  { to: '/transfers', label: 'Transfers', icon: '↔️' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div>
            <h1>MediTrack</h1>
            <span>AI Hospital Inventory</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <h2>MediTrack</h2>
          <div className="user-info">
            <span className="user-badge">{user?.role}</span>
            <span>{user?.name}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
