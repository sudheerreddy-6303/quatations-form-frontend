import React, { useState } from 'react';
import './Login.css';

const LOGO_URL =
  'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';

/* ─── Hardcoded credentials ────────────────────────────────── */
const VALID_USERS = [
  { username: 'admin',   password: 'deeraj@2024',  display: 'Administrator', role: 'admin'   },
  { username: 'deeraj',  password: 'interiors123',  display: 'Deeraj',        role: 'admin'   },
  { username: 'manager', password: 'manager@123',   display: 'Site Manager',  role: 'manager' },
  { username: 'chandu',  password: 'chandu@123',    display: 'Chandu',        role: 'manager' },
  { username: 'sony',    password: 'sony@123',      display: 'Sony',          role: 'manager' },
  { username: 'veera',   password: 'veera@123',     display: 'Veera',         role: 'manager' },
  { username: 'teja',    password: 'teja@123',      display: 'Teja',          role: 'manager' },
  { username: 'sakshi',  password: 'sakshi@123',    display: 'Sakshi',        role: 'manager' },
  { username: 'ramya',   password: 'ramya@123',     display: 'Ramya',         role: 'manager' },
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = VALID_USERS.find(
      u => u.username === username.trim() && u.password === password
    );
    if (user) {
      setError('');
      onLogin(user);
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <img src={LOGO_URL} alt="Deeraj Interiors" />
          <div className="login-divider" />
        </div>

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
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-login">Sign In</button>
        </form>

        <p className="login-footer">
          Deeraj Interiors &copy; {new Date().getFullYear()} —{' '}
          <span>Internal Portal</span>
        </p>
      </div>
    </div>
  );
}