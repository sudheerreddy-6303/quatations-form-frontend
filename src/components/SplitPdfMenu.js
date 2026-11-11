// ── ADDED (per request): "Separate PDFs" dropdown — Wood Work / Accessories / Other Works / All ──
import React from 'react';
import ReactDOM from 'react-dom';
import { SPLIT_PARTS, availableParts, downloadSplitPDFs } from '../utils/splitQuotation';

export default function SplitPdfMenu({ data, getData, className, style, label = '⬇ Separate PDFs ▾' }) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const [avail, setAvail] = React.useState(null);
  const btnRef = React.useRef(null);
  const load = async () => (data || (getData ? await getData() : null));
  const toggle = async (e) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const r = btnRef.current.getBoundingClientRect();
    const left = Math.min(r.left, window.innerWidth - 300);
    setPos({ top: r.bottom + 6, left: Math.max(8, left) });
    setOpen(true);
    try { const d = await load(); setAvail(d ? availableParts(d).map(p => p.key) : []); } catch { setAvail([]); }
  };
  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close); window.addEventListener('scroll', close, true);
    return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true); };
  }, [open]);
  const go = async (which) => { setOpen(false); const d = await load(); if (d) downloadSplitPDFs(d, which); };
  const Item = ({ icon, title, hint, onClick, disabled }) => (
    <button type="button" onClick={(e) => { e.stopPropagation(); if (!disabled) onClick(); }} disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'none', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, fontFamily: 'inherit' }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#F5F5F5'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
      <span style={{ width: 28, height: 28, borderRadius: 6, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{icon}</span>
      <span><span style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#111' }}>{title}</span><span style={{ fontSize: 11, color: '#777' }}>{disabled ? 'No items in this quotation' : hint}</span></span>
    </button>
  );
  return (
    <>
      <button ref={btnRef} type="button" className={className || 'action-btn download'} style={style} onClick={toggle}>{label}</button>
      {open && ReactDOM.createPortal(
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 100001, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,.18)', padding: 6, width: 290 }}>
          {SPLIT_PARTS.map(p => (
            <Item key={p.key} icon={p.icon} title={`${p.label} PDF`} hint={p.hint} onClick={() => go(p.key)} disabled={avail !== null && !avail.includes(p.key)} />
          ))}
          <div style={{ height: 1, background: '#F0F0F0', margin: '4px 6px' }} />
          <Item icon="📦" title="All Separate PDFs" hint="Downloads each part as its own file" onClick={() => go('all')} disabled={avail !== null && avail.length === 0} />
        </div>, document.body)}
    </>
  );
}
