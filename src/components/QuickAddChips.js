// ── ADDED (per request): empty-state box + one-tap "＋ name" chips for Rooms / Accessories /
// Interior Services / Other Works. Used by the New Quotation form and the Edit popup.
import React from 'react';
import './QuickAddChips.css';

export default function QuickAddChips({ empty, emptyText, chips = [], onPick, actionLabel, onAction }) {
  if (!empty && !chips.length) return null;
  return (
    <div className={`qa-box${empty ? ' qa-empty' : ''}`}>
      {empty && <span className="qa-text">{emptyText}</span>}
      {empty && onAction && (
        <button type="button" className="qa-action" onClick={onAction}>＋ {actionLabel}</button>
      )}
      {chips.length > 0 && (
        <span className="qa-chips">
          {empty && <span className="qa-or">{onAction ? 'or pick:' : 'pick:'}</span>}
          {chips.map(c => (
            <button key={c.key} type="button" className="qa-chip" style={{ '--qa-color': c.color || '#888' }}
              onClick={() => onPick(c)} title={`Add ${c.label}`}>
              ＋ {c.icon ? c.icon + ' ' : ''}{c.label}
            </button>
          ))}
        </span>
      )}
    </div>
  );
}

// ADDED: "＋ Add Service" — type a new name, ✓ to create
export function AddNameInline({ label = 'Add', placeholder = 'Name…', onAdd }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const done = () => { const n = name.trim(); if (!n) return; if (onAdd(n) !== false) { setName(''); setOpen(false); } };
  if (!open) return <button type="button" className="qa-action" onClick={() => setOpen(true)}>＋ {label}</button>;
  return (
    <span className="qa-inline">
      <input autoFocus value={name} placeholder={placeholder} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); done(); } if (e.key === 'Escape') { setOpen(false); setName(''); } }} />
      <button type="button" className="qa-ok" onClick={done}>✓</button>
      <button type="button" className="qa-x" onClick={() => { setOpen(false); setName(''); }}>✕</button>
    </span>
  );
}
