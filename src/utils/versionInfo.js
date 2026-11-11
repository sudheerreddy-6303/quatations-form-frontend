// ── ADDED (per request): version number + revised date + revision history for Print / PDF / View ──
// The backend adds data.version_history / data.current_version / data.revised_at to every quotation.
export const fmtVDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt) ? String(d) : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
// true when the quotation has been changed at least once (→ show the Revision History table)
export const hasVersions = (data) => !!(data && Array.isArray(data.version_history) && data.version_history.length > 1);
// header line — always shown: "Version V3 · Revised on 11 Nov 2026" or "Version V1 · Created on 25 Aug 2026"
export const versionLabel = (data) => {
  if (!data) return '';
  if (hasVersions(data)) return `Version V${data.current_version || data.version_history.length} · Revised on ${fmtVDate(data.revised_at)}`;
  return `Version V1 · Created on ${fmtVDate(data.created_at)}`;
};
export const fmtVAmt = (n) => 'Rs. ' + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-IN');
