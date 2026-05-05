import React, { useState } from 'react';
import './Login.css';
import api from '../utils/api';

const LOGO_URL =
  'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';

// Admins are always local (no backend needed)
const ADMIN_USERS = [
  { username: 'admin',  password: 'deeraj@2024',  display: 'Administrator', role: 'admin' },
  { username: 'deeraj', password: 'interiors123',  display: 'Deeraj',        role: 'admin' },
];

// Fallback manager list if backend is unreachable
const FALLBACK_MANAGERS = [
  { username: 'manager', password: 'manager@123',  display: 'Site Manager',  role: 'manager' },
  { username: 'chandu',  password: 'chandu@123',   display: 'Chandu',        role: 'manager' },
  { username: 'sony',    password: 'sony@123',     display: 'Sony',          role: 'manager' },
  { username: 'veera',   password: 'veera@123',    display: 'Veera',         role: 'manager' },
  { username: 'teja',    password: 'teja@123',     display: 'Teja',          role: 'manager' },
  { username: 'sakshi',  password: 'sakshi@123',   display: 'Sakshi',        role: 'manager' },
  { username: 'ramya',   password: 'ramya@123',    display: 'Ramya',         role: 'manager' },
];

export default function Login({ onLogin }) {
  const [view,    setView]    = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const [cpUsername, setCpUsername] = useState('');
  const [cpCurrent,  setCpCurrent]  = useState('');
  const [cpNew,      setCpNew]      = useState('');
  const [cpConfirm,  setCpConfirm]  = useState('');
  const [cpError,    setCpError]    = useState('');
  const [cpSuccess,  setCpSuccess]  = useState('');
  const [cpStep,     setCpStep]     = useState('form');
  const [otp,        setOtp]        = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // ── Login ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const uname = username.trim();

    // 1. Check admins locally
    const admin = ADMIN_USERS.find(u => u.username === uname && u.password === password);
    if (admin) { setLoading(false); onLogin({ ...admin }); return; }

    // 2. Check managers via backend (supports newly added managers)
    try {
      const res = await api.post('/auth/login', { username: uname, password });
      if (res.data.success) { setLoading(false); onLogin(res.data.user); return; }
    } catch {
      // Backend unreachable — fall back to local list
      const fallback = FALLBACK_MANAGERS.find(u => u.username === uname && u.password === password);
      if (fallback) {
        setLoading(false);
        const { password: _p, ...safe } = fallback;
        onLogin(safe);
        return;
      }
    }

    setError('Invalid username or password. Please try again.');
    setLoading(false);
  };

  // ── Request OTP ───────────────────────────────────────────────
  const handleRequestOtp = async (e) => {
    e.preventDefault(); setCpError(''); setCpSuccess('');
    const uname = cpUsername.trim();
    if (!uname)   { setCpError('Enter your username.'); return; }
    if (!cpCurrent) { setCpError('Enter your current password.'); return; }
    if (!cpNew || cpNew.length < 6) { setCpError('New password must be at least 6 characters.'); return; }
    if (cpNew !== cpConfirm) { setCpError('Passwords do not match.'); return; }

    setOtpLoading(true);
    // Verify current password via backend
    try {
      const verify = await api.post('/auth/login', { username: uname, password: cpCurrent });
      if (!verify.data.success) { setCpError('Current password is incorrect.'); setOtpLoading(false); return; }
    } catch { setCpError('Could not verify password. Check your connection.'); setOtpLoading(false); return; }

    try {
      const res = await api.post('/auth/request-otp', { username: uname, newPassword: cpNew });
      if (res.data.success) { setCpSuccess(res.data.message); setCpStep('otp'); }
      else { setCpError(res.data.message || 'Failed to generate OTP.'); }
    } catch (err) { setCpError(err?.response?.data?.message || 'Server error.'); }
    setOtpLoading(false);
  };

  // ── Verify OTP ────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setCpError('');
    if (!otp.trim()) { setCpError('Enter the OTP.'); return; }
    setOtpLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { username: cpUsername.trim(), otp: otp.trim() });
      if (res.data.success) { setCpSuccess(res.data.message); setCpStep('done'); }
      else { setCpError(res.data.message || 'Invalid OTP.'); }
    } catch (err) { setCpError(err?.response?.data?.message || 'Server error.'); }
    setOtpLoading(false);
  };

  const resetChangePw = () => {
    setCpUsername(''); setCpCurrent(''); setCpNew(''); setCpConfirm('');
    setCpError(''); setCpSuccess(''); setCpStep('form'); setOtp('');
    setView('login');
  };

  // ════ Change Password View ════
  if (view === 'change-pw') {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo"><img src={LOGO_URL} alt="Deeraj Interiors" /><div className="login-divider" /></div>
          <h1 className="login-title">Change Password</h1>
          <p className="login-sub">
            {cpStep === 'form' && 'An OTP will be generated — ask your admin for the code.'}
            {cpStep === 'otp'  && 'Enter the OTP your admin shared with you.'}
            {cpStep === 'done' && 'Password updated successfully!'}
          </p>
          {cpError   && <div className="login-error"  style={{marginBottom:14}}>{cpError}</div>}
          {cpSuccess && cpStep !== 'done' && <div className="login-success" style={{marginBottom:14}}>{cpSuccess}</div>}

          {cpStep === 'form' && (
            <form onSubmit={handleRequestOtp} autoComplete="off">
              <div className="login-field"><label>Your Username</label>
                <input type="text" placeholder="e.g. chandu" value={cpUsername}
                  onChange={e => { setCpUsername(e.target.value); setCpError(''); }} /></div>
              <div className="login-field"><label>Current Password</label>
                <input type="password" placeholder="Current password" value={cpCurrent}
                  onChange={e => { setCpCurrent(e.target.value); setCpError(''); }} /></div>
              <div className="login-field"><label>New Password</label>
                <input type="password" placeholder="Min 6 characters" value={cpNew}
                  onChange={e => { setCpNew(e.target.value); setCpError(''); }} /></div>
              <div className="login-field"><label>Confirm New Password</label>
                <input type="password" placeholder="Repeat new password" value={cpConfirm}
                  onChange={e => { setCpConfirm(e.target.value); setCpError(''); }} /></div>
              <button type="submit" className="btn-login" disabled={otpLoading}>
                {otpLoading ? 'Sending…' : '📧 Request OTP'}
              </button>
            </form>
          )}

          {cpStep === 'otp' && (
            <form onSubmit={handleVerifyOtp} autoComplete="off">
              <div className="login-field"><label>OTP (get it from Admin)</label>
                <input type="text" placeholder="6-digit OTP" value={otp} maxLength={6}
                  onChange={e => { setOtp(e.target.value); setCpError(''); }}
                  style={{letterSpacing:8,fontSize:22,textAlign:'center',fontWeight:700}} /></div>
              <button type="submit" className="btn-login" disabled={otpLoading}>
                {otpLoading ? 'Verifying…' : '✅ Verify & Change Password'}
              </button>
              <button type="button" className="btn-link-subtle"
                onClick={() => { setCpStep('form'); setCpError(''); setCpSuccess(''); setOtp(''); }}>
                ← Request New OTP
              </button>
            </form>
          )}

          {cpStep === 'done' && (
            <div style={{textAlign:'center',padding:'12px 0'}}>
              <div style={{fontSize:52,marginBottom:12}}>✅</div>
              <p style={{color:'#1a7a1a',fontWeight:600,marginBottom:24}}>{cpSuccess}</p>
              <button className="btn-login" onClick={resetChangePw}>Back to Sign In</button>
            </div>
          )}

          {cpStep !== 'done' && (
            <button type="button" className="btn-link-subtle" onClick={resetChangePw} style={{marginTop:12}}>
              ← Back to Sign In
            </button>
          )}
        </div>
      </div>
    );
  }

  // ════ Normal Login View ════
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo"><img src={LOGO_URL} alt="Deeraj Interiors" /><div className="login-divider" /></div>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-sub">Sign in to manage your quotations</p>
        {error && (
          <div className="login-error">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="7" stroke="#B91C1C" strokeWidth="1.2" fill="none"/>
              <path d="M7.5 4.5V8M7.5 10.5V11" stroke="#B91C1C" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" placeholder="Enter username" value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }} autoFocus autoComplete="username" />
          </div>
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Enter password" value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }} autoComplete="current-password" />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div style={{textAlign:'center',marginTop:16}}>
          <button className="btn-link-subtle" onClick={() => { setView('change-pw'); setError(''); }}>
            🔑 Change My Password
          </button>
        </div>
        <p className="login-footer">
          Deeraj Interiors &copy; {new Date().getFullYear()} — <span>Internal Portal</span>
        </p>
      </div>
    </div>
  );
}
