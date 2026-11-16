// ── ADDED (per request): show the uploaded Floor Plan / 2D Plan / 3D Plan inside Edit
// with View, Replace and Remove. Only the plans you change are sent when saving.
import React from 'react';
import toast from 'react-hot-toast';

export const PLAN_FIELDS = [
  { key: 'floor_plan', label: 'Floor Plan', icon: '📐' },
  { key: 'plan_2d',    label: '2D Plan',    icon: '📄' },
  { key: 'plan_3d',    label: '3D Plan',    icon: '🎨' },
];

// Saved value → { name, data } or null (handles object, JSON string or plain data URL)
export const normPlan = (v, fallbackName = 'File') => {
  if (!v) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return null;
    if (t.startsWith('data:')) return { name: fallbackName, data: t };
    try { const o = JSON.parse(t); return normPlan(o, fallbackName); } catch { return null; }
  }
  if (typeof v === 'object' && (v.data || v.base64)) return { name: v.name || fallbackName, data: v.data || v.base64 };
  return null;
};

const readFile = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });

const openFile = (p) => {
  try {
    const [head, b64] = String(p.data).split(',');
    const mime = (head.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64 || ''); const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([arr], { type: mime }));
    const w = window.open(url, '_blank');
    if (!w) { const a = document.createElement('a'); a.href = url; a.download = p.name || 'file'; document.body.appendChild(a); a.click(); a.remove(); }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch { toast.error('Could not open this file'); }
};

export default function EditPlanFiles({ plans, onChange }) {
  const refs = { floor_plan: React.useRef(null), plan_2d: React.useRef(null), plan_3d: React.useRef(null) };
  const pick = async (key, file) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast.error('File is too large (max 15 MB)'); return; }
    try { const data = await readFile(file); onChange(key, { name: file.name, data }); toast.success(`${PLAN_FIELDS.find(f => f.key === key).label} updated`); }
    catch { toast.error('Could not read the file'); }
  };
  return (
    <div className="plan-files-grid">
      {PLAN_FIELDS.map(({ key, label, icon }) => {
        const p = plans[key];
        return (
          <div key={key} className="plan-file-card">
            <div className="plan-file-icon">{icon}</div>
            <div className="plan-file-info">
              <div className="plan-file-label">{label}</div>
              {p ? (
                <div className="plan-file-name">
                  <span title={p.name}>{p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name}</span>
                  <button type="button" className="plan-file-remove" title="Remove"
                    onClick={() => { if (window.confirm(`Remove ${label}?`)) { onChange(key, null); toast.success(`${label} removed`); } }}>✕</button>
                </div>
              ) : (
                <div className="plan-file-empty">No file attached</div>
              )}
            </div>
            <input type="file" style={{ display: 'none' }} ref={refs[key]}
              onChange={e => { pick(key, e.target.files[0]); e.target.value = ''; }} />
            {p && <button type="button" className="plan-file-btn has-file" onClick={() => openFile(p)}>👁 View</button>}
            <button type="button" className={`plan-file-btn ${p ? 'has-file' : ''}`} onClick={() => refs[key].current?.click()}>
              {p ? '↩ Replace' : '+ Attach'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
