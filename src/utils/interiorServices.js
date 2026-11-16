// ── ADDED (per request): Interior Services (False Ceiling / Granite / Lighting / Electrical)
// and "start empty" helpers shared by the New Quotation form and the Edit popup.
// Sections are stored in ceiling_data exactly like the existing Other Works sections,
// so totals, saving, View, Print and PDF keep working the same way.

export const SERVICE_KEYS = ['falseceiling', 'granite', 'lighting', 'electrical'];

export const SERVICE_DEFS = {
  falseceiling: { label: 'False Ceiling', icon: '⬜', color: '#6366F1', type: 'BOX',   hint: 'Gypsum / POP / PVC ceiling' },
  granite:      { label: 'Granite',       icon: '🪨', color: '#78716C', type: 'BOX',   hint: 'Kitchen platform, sills, flooring' },
  lighting:     { label: 'Lighting',      icon: '💡', color: '#EAB308', type: 'FIXED', hint: 'Profile lights, spots, strips' },
  electrical:   { label: 'Electrical',    icon: '⚡', color: '#F59E0B', type: 'FIXED', hint: 'Points, wiring, switch boards' },
};

// ADDED: custom services created with "＋ Add Service" are stored with a key that starts with "svc_"
export const CUSTOM_SERVICE = { icon: '🛠', color: '#0EA5E9', type: 'BOX' };
export const isCustomServiceKey = (k) => String(k || '').startsWith('svc_');
export const isServiceKey = (k) => SERVICE_KEYS.includes(k) || isCustomServiceKey(k);
export const newServiceKey = () => 'svc_' + Date.now();

// Quick-add chips
export const QUICK_ROOMS = [
  { key: 'mbr',     label: 'MBR Room', icon: '🛏', color: '#8B5CF6' },
  { key: 'cbr',     label: 'CBR',      icon: '🛏', color: '#3B82F6' },
  { key: 'hall',    label: 'Hall',     icon: '🛋', color: '#10B981' },
  { key: 'dining',  label: 'Dining',   icon: '🍽', color: '#F59E0B' },
  { key: 'kitchen', label: 'Kitchen',  icon: '🍳', color: '#EF4444' },
];
export const QUICK_OTHER = [
  { key: 'wooden',  label: 'Wooden Accessories', icon: '🪵', color: '#92400E' },
  { key: 'marble',  label: 'Marble & Plumbing',  icon: '🪨', color: '#64748B' },
  { key: 'general', label: 'General',            icon: '📦', color: '#14B8A6' },
];
export const QUICK_SERVICES = SERVICE_KEYS.map(k => ({ key: k, ...SERVICE_DEFS[k] }));

const BADGE_CLASS = { electrical: 'electrical-badge', wooden: 'wooden-badge', marble: 'marble-badge', general: 'general-badge' };

// One blank row
export const blankRow = (type = 'BOX') => ({ name: '', width: 0, height: 0, nos: 0, type, unitCost: 0, remarks: '' });

// A new (empty) room with one blank row
export const blankRoom = (label, color) => ({
  label, color, pdfFile: null, pdfName: '',
  items: [blankRow('BOX')],
});

// New empty Accessories card (one blank row)
export const blankAccessories = () => ({
  label: 'Accessories', color: '#C9A84C', pdfFile: null, pdfName: '',
  items: [{ name: '', nos: 0, unitCost: 0, remarks: '' }],
});

// A new section (service or other works) with one blank row
export const blankSection = (key, label) => {
  const def = SERVICE_DEFS[key] || (isCustomServiceKey(key) ? CUSTOM_SERVICE : null);
  const name = label || (def && def.label ? def.label : key);
  return {
    label: name,
    badge: ((def && def.icon) || '📦') + ' ' + name,
    badgeClass: BADGE_CLASS[key] || 'general-badge',
    sectionNum: '',
    items: [blankRow(def ? def.type : 'BOX')],
    color: def ? def.color : undefined,
  };
};

// Insert a room so it stays before the Accessories card
export const insertRoom = (prev, key, value) => {
  const entries = Object.entries(prev).filter(([k]) => k !== key);
  const accIdx = entries.findIndex(([k]) => k === 'accessories');
  entries.splice(accIdx === -1 ? entries.length : accIdx, 0, [key, value]);
  return Object.fromEntries(entries);
};

// Insert a section: services go after the last service (before Other Works sections); others go at the end
export const insertSection = (prev, key, value) => {
  const entries = Object.entries(prev).filter(([k]) => k !== key);
  if (!isServiceKey(key)) { entries.push([key, value]); return Object.fromEntries(entries); }
  let at = 0;
  entries.forEach(([k], i) => { if (isServiceKey(k)) at = i + 1; });
  entries.splice(at, 0, [key, value]);
  return Object.fromEntries(entries);
};

// Is ceiling_data in the "sections" format (any key holding an items array)?
export const isSectionsFormat = (cd) =>
  !!cd && typeof cd === 'object' && Object.values(cd).some(v => v && Array.isArray(v.items));
