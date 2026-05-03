import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import QuotationForm from './pages/QuotationForm';
import QuotationList from './pages/QuotationList';
import Login from './pages/Login';
import './App.css';

const LOGO_URL =
  'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="brand-icon">
          <img src={LOGO_URL} alt="Deeraj Interiors Logo" style={{ height: '48px', width: 'auto' }} />
        </div>
      </div>

      <div className="nav-links">
        <NavLink to="/quotations" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/>
            <path d="M5 6H11M5 9H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Dashboard
        </NavLink>
        {(
          <NavLink to="/new" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            New Quotation
          </NavLink>
        )}
      </div>

      <div className="nav-user-row">
        <span className="nav-username">
          {user.role === 'admin' ? '👑' : '🏗️'} {user.display}
          <span style={{marginLeft:6,fontSize:10,padding:'2px 8px',borderRadius:20,background:user.role==='admin'?'#E8471C':'#3B82F6',color:'#fff',fontWeight:700,letterSpacing:0.5}}>
            {user.role === 'admin' ? 'ADMIN' : 'MANAGER'}
          </span>
        </span>
        <button className="btn-nav-logout" onClick={onLogout}>Sign Out</button>
      </div>
    </nav>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin  = (u) => setUser(u);
  const handleLogout = () => setUser(null);

  if (!user) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1C1C1C', color: '#F0EDE8', border: '1px solid #2E2E2E', fontFamily: 'DM Sans, sans-serif' }, success: { iconTheme: { primary: '#E8471C', secondary: '#131313' } } }} />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1C1C1C', color: '#F0EDE8', border: '1px solid #2E2E2E', fontFamily: 'DM Sans, sans-serif' },
          success: { iconTheme: { primary: '#E8471C', secondary: '#131313' } },
        }}
      />
      <Navbar user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/"            element={<QuotationList user={user} />} />
          <Route path="/quotations"  element={<QuotationList user={user} />} />
          <Route path="/new"         element={<QuotationForm />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}