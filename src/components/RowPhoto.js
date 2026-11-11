// ── ADDED (per request): one photo per quotation row (e.g. TV unit design) ──
// The photo is shrunk to a small JPEG before saving and stored on the row as `item.photo`
// (inside the quotation's rooms / sections data — no database change needed).
import React from 'react';
import ReactDOM from 'react-dom';
import toast from 'react-hot-toast';

// Resize to max 700px on the longest side and save as JPEG (~50–150 KB)
export const compressPhoto = (file, maxSide = 700, quality = 0.72) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = () => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

export function RowPhotoCell({ value, onChange }) {
  const inputRef = React.useRef(null);
  const [big, setBig] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const pick = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!String(f.type || '').startsWith('image/')) { toast.error('Please choose a photo (JPG / PNG)'); return; }
    setBusy(true);
    try { onChange(await compressPhoto(f)); toast.success('Photo attached'); }
    catch { toast.error('Could not read this photo'); }
    finally { setBusy(false); }
  };
  return (
    <td className="row-photo-cell">
      {value ? (
        <span className="row-photo-wrap">
          <img src={value} alt="" className="row-photo-thumb" title="Click to view" onClick={() => setBig(true)} />
          <button type="button" className="row-photo-x" title="Remove photo" onClick={() => onChange('')}>✕</button>
        </span>
      ) : (
        <button type="button" className="row-photo-add" disabled={busy} onClick={() => inputRef.current && inputRef.current.click()}>{busy ? '…' : '📷 Add'}</button>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pick} />
      {big && value && ReactDOM.createPortal(
        <div onClick={() => setBig(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
          <img src={value} alt="" style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,.5)' }} />
        </div>, document.body)}
    </td>
  );
}
