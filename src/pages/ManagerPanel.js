import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const initialForm = { username: '', password: '', display: '' };

export default function ManagerPanel() {
  const [managers,    setManagers]   = useState([]);
  const [pendingOtps, setPending]    = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState('');
  const [showPw,      setShowPw]     = useState({});
  const [copied,      setCopied]     = useState('');

  // Add manager form
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(initialForm);
  const [formErr,    setFormErr]    = useState('');
  const [formOk,     setFormOk]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const [showNewPw,  setShowNewPw]  = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null); // username
  const [deleting,     setDeleting]     = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [mRes, oRes] = await Promise.all([
        api.get('/managers'),
        api.get('/admin/pending-otps'),
      ]);
      setManagers(mRes.data.data || []);
      setPending(oRes.data.data  || []);
      setError('');
    } catch {
      setError('Failed to load data. Make sure the backend is running with the updated server.js.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 15000);
    return () => clearInterval(t);
  }, [loadData]);

  const togglePw = (u) => setShowPw(p => ({ ...p, [u]: !p[u] }));

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(''), 1800);
    });
  };

  const handleFormChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setFormErr('');
  };

  const handleAddManager = async (e) => {
    e.preventDefault();
    setFormErr(''); setFormOk('');
    if (!form.username.trim()) { setFormErr('Username is required.'); return; }
    if (!form.password.trim()) { setFormErr('Password is required.'); return; }
    if (!form.display.trim())  { setFormErr('Display name is required.'); return; }

    setSaving(true);
    try {
      const res = await api.post('/managers', {
        username: form.username.trim(),
        password: form.password.trim(),
        display:  form.display.trim(),
      });
      if (res.data.success) {
        setFormOk(res.data.message);
        setForm(initialForm);
        setShowNewPw(false);
        await loadData();
        setTimeout(() => { setFormOk(''); setShowForm(false); }, 2000);
      } else {
        setFormErr(res.data.message || 'Failed to add manager.');
      }
    } catch (err) {
      setFormErr(err?.response?.data?.message || 'Server error. Check that the backend is updated.');
    }
    setSaving(false);
  };

  const handleDelete = async (username) => {
    setDeleting(true);
    try {
      const res = await api.delete(`/managers/${username}`);
      if (res.data.success) {
        setDeleteTarget(null);
        await loadData();
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete manager.');
    }
    setDeleting(false);
  };

  if (loading) return <div style={S.center}>Loading manager data…</div>;
  if (error)   return <div style={{...S.center, color:'#B91C1C'}}>{error}</div>;

  return (
    <div style={S.wrap}>

      {/* ── Pending OTPs banner ── */}
      {pendingOtps.length > 0 && (
        <div style={S.otpBanner}>
          <div style={S.otpTitle}>🔐 Pending Password Change Requests</div>
          <p style={{color:'#92400e',fontSize:13,margin:'0 0 14px'}}>
            Share the OTP with the manager so they can complete their password change.
          </p>
          {pendingOtps.map(o => (
            <div key={o.username} style={S.otpRow}>
              <span style={S.otpName}>🏗️ {o.display} <code style={{fontSize:12,color:'#666'}}>({o.username})</code></span>
              <div style={S.otpCodeWrap}>
                <span style={S.otpCode}>{o.otp}</span>
                <span style={S.otpExpiry}>expires in {o.expiresIn}</span>
              </div>
              <button style={S.copyBtnYellow} onClick={() => copy(o.otp, 'otp_'+o.username)}>
                {copied==='otp_'+o.username ? '✅ Copied' : '📋 Copy OTP'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Header + Add button ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={S.h2}>👥 Manager Credentials</h2>
          <p style={S.sub}>Admin-only view — all manager accounts and passwords.</p>
        </div>
        <button style={S.addBtn} onClick={() => { setShowForm(f => !f); setFormErr(''); setFormOk(''); setForm(initialForm); }}>
          {showForm ? '✕ Cancel' : '+ Add Manager'}
        </button>
      </div>

      {/* ── Add Manager Form ── */}
      {showForm && (
        <div style={S.formCard}>
          <h3 style={{margin:'0 0 16px',fontSize:16,color:'#1a0a00'}}>➕ Add New Manager</h3>
          {formErr && <div style={S.errBox}>{formErr}</div>}
          {formOk  && <div style={S.okBox}>{formOk}</div>}
          <form onSubmit={handleAddManager} autoComplete="off">
            <div style={S.formGrid}>
              <div style={S.field}>
                <label style={S.label}>Display Name *</label>
                <input style={S.input} name="display" placeholder="e.g. Ravi Kumar"
                  value={form.display} onChange={handleFormChange} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Username *</label>
                <input style={S.input} name="username" placeholder="e.g. ravi (lowercase only)"
                  value={form.username} onChange={e => handleFormChange({target:{name:'username',value:e.target.value.toLowerCase()}})} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Password *</label>
                <div style={{position:'relative'}}>
                  <input style={{...S.input, paddingRight:40}}
                    name="password" type={showNewPw ? 'text' : 'password'}
                    placeholder="Min 4 characters"
                    value={form.password} onChange={handleFormChange} />
                  <button type="button" onClick={() => setShowNewPw(v => !v)}
                    style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
                      background:'none',border:'none',cursor:'pointer',fontSize:16}}>
                    {showNewPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button type="submit" style={S.saveBtn} disabled={saving}>
                {saving ? 'Adding…' : '✅ Add Manager'}
              </button>
              <button type="button" style={S.cancelBtn}
                onClick={() => { setShowForm(false); setFormErr(''); setFormOk(''); setForm(initialForm); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Manager Table ── */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              {['#','Display Name','Username','Password','Actions'].map((h,i) => (
                <th key={i} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {managers.length === 0 && (
              <tr><td colSpan={5} style={{padding:24,textAlign:'center',color:'#aaa'}}>No managers found.</td></tr>
            )}
            {managers.map((m, idx) => (
              <tr key={m.username}
                style={{background: idx%2===0?'#fff':'#fafaf9', transition:'background 0.15s'}}
                onMouseEnter={e => e.currentTarget.style.background='#fff4f0'}
                onMouseLeave={e => e.currentTarget.style.background=idx%2===0?'#fff':'#fafaf9'}>
                <td style={S.td}><span style={{color:'#bbb'}}>{idx+1}</span></td>
                <td style={S.td}><strong>🏗️ {m.display}</strong></td>
                <td style={S.td}><code style={S.code}>{m.username}</code></td>
                <td style={S.td}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <code style={{...S.code, background:'#fff4f0', color:'#c43a0a',
                      letterSpacing: showPw[m.username] ? 1 : 4, minWidth:90}}>
                      {showPw[m.username] ? m.password : '••••••••'}
                    </code>
                    <button style={S.iconBtn} onClick={() => togglePw(m.username)}
                      title={showPw[m.username]?'Hide':'Show'}>
                      {showPw[m.username] ? '🙈' : '👁️'}
                    </button>
                    <button style={S.iconBtn} onClick={() => copy(m.password,'pw_'+m.username)}
                      title="Copy password">
                      {copied==='pw_'+m.username ? '✅' : '📋'}
                    </button>
                  </div>
                </td>
                <td style={S.td}>
                  {deleteTarget === m.username ? (
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:12,color:'#B91C1C',fontWeight:600}}>Sure?</span>
                      <button style={S.confirmDelBtn} disabled={deleting}
                        onClick={() => handleDelete(m.username)}>
                        {deleting ? '…' : 'Yes, Delete'}
                      </button>
                      <button style={S.iconBtn} onClick={() => setDeleteTarget(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button style={S.delBtn} onClick={() => setDeleteTarget(m.username)}>
                      🗑️ Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{marginTop:14,color:'#bbb',fontSize:12,textAlign:'center'}}>
        🔄 Auto-refreshes every 15 seconds &nbsp;·&nbsp; OTPs expire after 10 minutes
      </p>
    </div>
  );
}

const S = {
  wrap:       { fontFamily:'DM Sans,Arial,sans-serif', padding:'28px 20px', maxWidth:960, margin:'0 auto' },
  center:     { textAlign:'center', padding:'60px', fontFamily:'DM Sans,sans-serif', color:'#888' },
  h2:         { margin:0, fontSize:21, fontWeight:700, color:'#1a0a00' },
  sub:        { margin:'5px 0 0', color:'#888', fontSize:13 },
  addBtn:     { background:'#E8471C', color:'#fff', border:'none', borderRadius:9,
                padding:'10px 20px', cursor:'pointer', fontWeight:700, fontSize:14,
                fontFamily:'DM Sans,sans-serif', whiteSpace:'nowrap' },
  tableWrap:  { overflowX:'auto', borderRadius:12, boxShadow:'0 2px 16px rgba(0,0,0,0.08)', border:'1px solid #ebebeb' },
  table:      { width:'100%', borderCollapse:'collapse', background:'#fff' },
  th:         { padding:'12px 16px', textAlign:'left', fontWeight:600, fontSize:12,
                letterSpacing:0.4, background:'#1a0a00', color:'#fff',
                borderBottom:'2px solid #E8471C', whiteSpace:'nowrap' },
  td:         { padding:'12px 16px', fontSize:13.5, borderBottom:'1px solid #f0f0f0', verticalAlign:'middle' },
  code:       { background:'#f3f3f3', padding:'3px 8px', borderRadius:5, fontSize:13, fontFamily:'monospace' },
  iconBtn:    { background:'none', border:'1px solid #ddd', borderRadius:6, padding:'4px 8px',
                cursor:'pointer', fontSize:13, lineHeight:1 },
  delBtn:     { background:'#fee2e2', color:'#B91C1C', border:'1px solid #fca5a5', borderRadius:7,
                padding:'5px 11px', cursor:'pointer', fontSize:12.5, fontWeight:600 },
  confirmDelBtn:{ background:'#B91C1C', color:'#fff', border:'none', borderRadius:7,
                padding:'5px 11px', cursor:'pointer', fontSize:12.5, fontWeight:700 },
  copyBtnYellow:{ background:'#f59e0b', color:'#fff', border:'none', borderRadius:7,
                padding:'7px 14px', cursor:'pointer', fontSize:13, fontWeight:600, whiteSpace:'nowrap' },
  // form
  formCard:   { background:'#fafaf9', border:'1px solid #e5e5e5', borderRadius:12,
                padding:'24px', marginBottom:24, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  formGrid:   { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 },
  field:      { display:'flex', flexDirection:'column', gap:6 },
  label:      { fontSize:12.5, fontWeight:600, color:'#444', letterSpacing:0.3 },
  input:      { padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:8,
                fontSize:14, fontFamily:'DM Sans,sans-serif', outline:'none',
                transition:'border-color 0.2s', background:'#fff' },
  saveBtn:    { background:'#E8471C', color:'#fff', border:'none', borderRadius:8,
                padding:'10px 22px', cursor:'pointer', fontWeight:700, fontSize:14,
                fontFamily:'DM Sans,sans-serif' },
  cancelBtn:  { background:'#f3f3f3', color:'#555', border:'1px solid #ddd', borderRadius:8,
                padding:'10px 18px', cursor:'pointer', fontWeight:600, fontSize:14,
                fontFamily:'DM Sans,sans-serif' },
  errBox:     { background:'#fee2e2', border:'1px solid #fca5a5', color:'#B91C1C',
                borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 },
  okBox:      { background:'#f0fdf4', border:'1px solid #86efac', color:'#166534',
                borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 },
  // OTP banner
  otpBanner:  { background:'#fffbeb', border:'2px solid #f59e0b', borderRadius:12,
                padding:'20px 24px', marginBottom:28 },
  otpTitle:   { fontWeight:700, fontSize:16, color:'#92400e', marginBottom:8 },
  otpRow:     { display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
                background:'#fff', borderRadius:8, padding:'12px 16px', marginBottom:10,
                border:'1px solid #fde68a' },
  otpName:    { flex:1, minWidth:160, fontWeight:600, color:'#1a0a00', fontSize:14 },
  otpCodeWrap:{ display:'flex', flexDirection:'column', alignItems:'center' },
  otpCode:    { fontSize:30, fontWeight:800, letterSpacing:8, color:'#E8471C', fontFamily:'monospace' },
  otpExpiry:  { fontSize:11, color:'#aaa', marginTop:2 },
};
