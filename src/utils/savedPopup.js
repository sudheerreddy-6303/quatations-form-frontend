// savedPopup.js
// "✅ Quotation saved" popup — shown AFTER a quotation is saved successfully
// (New Quotation and Edit). Purely visual: it does not change any saving logic.
// Closes on OK, ✕-outside click, or Esc.

export function showQuotationSavedPopup({ id, customer, site, total, isEdit } = {}) {
  try {
    const old = document.querySelector('[data-saved-popup]');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    const amt = Number(total || 0);
    const wrap = document.createElement('div');
    wrap.setAttribute('data-saved-popup', '1');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:20000;display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit';
    wrap.innerHTML = `
      <div role="dialog" aria-modal="true" style="background:#fff;border-radius:16px;width:400px;max-width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden">
        <div style="padding:24px 22px 6px;text-align:center">
          <div style="width:56px;height:56px;border-radius:50%;background:#DCFCE7;color:#16A34A;font-size:28px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">✓</div>
          <div style="font-size:18px;font-weight:800;color:#1a1a1a">${isEdit ? 'Quotation updated' : 'Quotation saved'} successfully</div>
          <div style="font-size:13px;color:#6B7280;margin-top:6px">${isEdit ? 'Your changes have been saved.' : 'The new quotation has been created.'}</div>
        </div>
        <div style="margin:14px 22px 0;border:1px solid #F1F1F1;border-radius:10px;background:#FAFAFA;padding:12px 14px;font-size:13px;line-height:1.8;color:#374151">
          ${id ? `<div><b>Quotation:</b> #${esc(id)}</div>` : ''}
          ${customer ? `<div><b>Customer:</b> ${esc(customer)}</div>` : ''}
          ${site ? `<div><b>Project:</b> ${esc(site)}</div>` : ''}
          <div><b>Grand total:</b> ₹${Math.round(amt).toLocaleString('en-IN')}</div>
        </div>
        <div style="padding:18px 22px 22px">
          <button type="button" data-act="ok" style="width:100%;padding:11px;border-radius:9px;border:none;background:#16A34A;color:#fff;font-size:14px;font-weight:700;cursor:pointer">OK</button>
        </div>
      </div>`;
    const close = () => { document.removeEventListener('keydown', onKey, true); if (wrap.parentNode) wrap.parentNode.removeChild(wrap); };
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') { e.stopPropagation(); close(); } };
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
    wrap.querySelector('[data-act="ok"]').addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(wrap);
    setTimeout(() => { try { wrap.querySelector('[data-act="ok"]').focus(); } catch (_) {} }, 0);
  } catch (_) { /* popup is optional — never block saving */ }
}

// "Missing required fields" popup — shown when Save is clicked on a New Quotation
// and one or more mandatory fields are empty. Lists every missing field.
// onClose (optional) runs after OK — used to scroll to the first missing field.
export function showMissingFieldsPopup(missing = [], onClose) {
  try {
    const old = document.querySelector('[data-missing-popup]');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    const wrap = document.createElement('div');
    wrap.setAttribute('data-missing-popup', '1');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:20000;display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit';
    wrap.innerHTML = `
      <div role="dialog" aria-modal="true" style="background:#fff;border-radius:16px;width:400px;max-width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden">
        <div style="padding:24px 22px 6px;text-align:center">
          <div style="width:56px;height:56px;border-radius:50%;background:#FEF3C7;color:#D97706;font-size:28px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">!</div>
          <div style="font-size:18px;font-weight:800;color:#1a1a1a">Please fill the required fields</div>
          <div style="font-size:13px;color:#6B7280;margin-top:6px">The quotation was not saved. These fields are missing:</div>
        </div>
        <div style="margin:14px 22px 0;border:1px solid #FDE68A;border-radius:10px;background:#FFFBEB;padding:10px 14px">
          ${missing.map(m => `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:14px;font-weight:700;color:#92400E"><span style="color:#DC2626">✕</span>${esc(m)}</div>`).join('')}
        </div>
        <div style="padding:18px 22px 22px">
          <button type="button" data-act="ok" style="width:100%;padding:11px;border-radius:9px;border:none;background:#E8471C;color:#fff;font-size:14px;font-weight:700;cursor:pointer">OK, I'll fill them</button>
        </div>
      </div>`;
    const close = () => {
      document.removeEventListener('keydown', onKey, true);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      try { onClose && onClose(); } catch (_) {}
    };
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(); } };
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
    wrap.querySelector('[data-act="ok"]').addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(wrap);
    setTimeout(() => { try { wrap.querySelector('[data-act="ok"]').focus(); } catch (_) {} }, 0);
  } catch (_) {}
}
