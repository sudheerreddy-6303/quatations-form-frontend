import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import QuotationForm   from './pages/QuotationForm';
import QuotationList   from './pages/QuotationList';
import ManagerPanel    from './pages/ManagerPanel';
import ProjectDashboard from './pages/ProjectDashboard';
import Login           from './pages/Login';
import './App.css';

const LOGO_URL = 'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';

function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  React.useEffect(() => { setMenuOpen(false); }, [location]);

  const links = [
    { to: '/quotations', label: 'Dashboard', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/>
        <path d="M5 6H11M5 9H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    )},
    { to: '/new', label: 'New Quotation', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )},
    ...(user.role === 'admin' ? [
      { to: '/projects', label: 'Projects', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="9" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/>
          <rect x="6" y="5" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/>
          <rect x="11" y="1" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/>
        </svg>
      )},
      { to: '/managers', label: 'Managers', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" fill="none"/>
          <path d="M1 13c0-2.76 2.24-5 5-5h2c2.76 0 5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
          <path d="M12 2v4M10 4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      )},
    ] : []),
  ];

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <div className="nav-brand">
          <img src={LOGO_URL} alt="Deeraj Interiors" className="nav-logo" />
        </div>

        {/* Desktop links */}
        <div className="nav-links">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              {l.icon}{l.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop user info */}
        <div className="nav-user-row">
          <span className="nav-username">
            {user.role === 'admin' ? '👑' : '🏗️'} {user.display}
            <span className={`nav-role-badge ${user.role === 'admin' ? 'admin' : 'manager'}`}>
              {user.role === 'admin' ? 'ADMIN' : 'MANAGER'}
            </span>
          </span>
          <button className="btn-nav-logout" onClick={onLogout}>Sign Out</button>
        </div>

        {/* Hamburger button — mobile only */}
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span className={`ham-line ${menuOpen ? 'open' : ''}`}/>
          <span className={`ham-line ${menuOpen ? 'open' : ''}`}/>
          <span className={`ham-line ${menuOpen ? 'open' : ''}`}/>
        </button>
      </nav>

      {/* Mobile drawer menu */}
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            {/* User info */}
            <div className="mobile-menu-user">
              <div className="mobile-user-name">
                {user.role === 'admin' ? '👑' : '🏗️'} {user.display}
              </div>
              <span className={`nav-role-badge ${user.role === 'admin' ? 'admin' : 'manager'}`}>
                {user.role === 'admin' ? 'ADMIN' : 'MANAGER'}
              </span>
            </div>
            {/* Links */}
            <div className="mobile-menu-links">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}>
                  <span className="mobile-nav-icon">{l.icon}</span>
                  {l.label}
                </NavLink>
              ))}
            </div>
            <button className="mobile-logout-btn" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');
      if (saved && token) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const handleLogin  = (u) => setUser(u);
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const toastOpts = {
    style: { background: '#1C1C1C', color: '#F0EDE8', border: '1px solid #2E2E2E', fontFamily: 'DM Sans, sans-serif' },
    success: { iconTheme: { primary: '#E8471C', secondary: '#131313' } },
  };

  if (!user) return (
    <>
      <Toaster position="top-right" toastOptions={toastOpts} />
      <Login onLogin={handleLogin} />
    </>
  );

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={toastOpts} />
      <Navbar user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/"           element={<QuotationList user={user} />} />
          <Route path="/quotations" element={<QuotationList user={user} />} />
          <Route path="/new"        element={<QuotationForm user={user} />} />
          {user.role === 'admin' && <Route path="/managers" element={<ManagerPanel />} />}
          {user.role === 'admin' && <Route path="/projects" element={<ProjectDashboard />} />}
        </Routes>
      </main>
    </BrowserRouter>
  );
}
