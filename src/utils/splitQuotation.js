// ── ADDED (per request): separate PDFs for Wood Work / Accessories / Other Works ──
// Builds a copy of the quotation data that holds ONLY one part's items, with that part's own
// subtotal, its proportional share of the extra discount and GST, and its own total.
// The three part totals always add up exactly to the full quotation total.
// The full quotation PDF is not affected.
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import toast from 'react-hot-toast';
import { QuotationPDF } from '../components/QuotationPDF';
import { calcTotal, calcRoomTotal } from './roomData';

export const SPLIT_PARTS = [
  { key: 'wood',        label: 'Wood Work',   icon: '🪵', hint: 'MBR, CBR, Hall, Dining, Kitchen…' },
  { key: 'accessories', label: 'Accessories', icon: '🔩', hint: 'Tandum, Hardware, Transport…' },
  { key: 'other',       label: 'Other Works', icon: '⚡', hint: 'Electrical, Wooden Acc., Marble, General' },
];

const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const parseObj = (v) => { if (typeof v === 'string' && v) { try { return JSON.parse(v); } catch { return {}; } } return v || {}; };
const SECTION_KEYS = ['ceiling', 'electrical', 'wooden', 'marble', 'general'];

// Split the quotation's rooms / sections into the three parts
const splitContent = (data) => {
  const rooms = parseObj(data.rooms);
  const rawCd = parseObj(data.ceiling_data);
  const isNewFormat = SECTION_KEYS.some(k => rawCd[k]);
  const woodRooms = {}, accRooms = {};
  Object.entries(rooms).forEach(([k, room]) => { if (k === 'accessories') accRooms[k] = room; else woodRooms[k] = room; });
  const roomsTotal = (rs) => Object.values(rs).reduce((s, r) => s + calcRoomTotal((r && r.items) || []), 0);
  const secTotal = isNewFormat
    ? Object.values(rawCd).reduce((s, sec) => s + (((sec && Array.isArray(sec.items)) ? sec.items : []).reduce((ss, it) => ss + calcTotal(it), 0)), 0)
    : Number(data.total_ceiling || 0);   // old quotations: keep the stored ceiling total
  return {
    wood:        { rooms: woodRooms, ceiling_data: {}, sub: r2(roomsTotal(woodRooms)) },
    accessories: { rooms: accRooms,  ceiling_data: {}, sub: r2(roomsTotal(accRooms)) },
    other:       { rooms: {},        ceiling_data: rawCd, sub: r2(secTotal) },
  };
};

// Which parts actually have something in them
export const availableParts = (data) => {
  const c = splitContent(data);
  return SPLIT_PARTS.filter(p => c[p.key].sub > 0);
};

export const buildPartData = (data, partKey) => {
  const c = splitContent(data);
  const order = ['wood', 'accessories', 'other'];
  const fullSub = order.reduce((s, k) => s + c[k].sub, 0);
  const D = Number(data.discount_amount || 0);
  const G = Number(data.gst_amount || 0);
  const gstPct = Number(data.gst_percent || 0);
  // proportional shares; the last non-empty part takes the rounding remainder so totals add up exactly
  const nonEmpty = order.filter(k => c[k].sub > 0);
  const last = nonEmpty[nonEmpty.length - 1];
  const disc = {}, gst = {};
  let dAcc = 0, gAcc = 0;
  nonEmpty.forEach(k => {
    if (k === last) { disc[k] = r2(D - dAcc); }
    else { disc[k] = fullSub > 0 ? r2(D * c[k].sub / fullSub) : 0; dAcc += disc[k]; }
  });
  const afterAll = fullSub - D;
  nonEmpty.forEach(k => {
    if (k === last) { gst[k] = r2(G - gAcc); }
    else { gst[k] = afterAll > 0 ? r2(G * (c[k].sub - disc[k]) / afterAll) : 0; gAcc += gst[k]; }
  });
  const part = SPLIT_PARTS.find(p => p.key === partKey);
  const sub = c[partKey].sub, d = disc[partKey] || 0, g = gst[partKey] || 0;
  return {
    ...data,
    __part: partKey,
    __partLabel: part ? part.label : partKey,
    quotation_id: `${data.quotation_id || data.id || ''} · ${(part ? part.label : partKey).toUpperCase()}`,
    rooms: c[partKey].rooms,
    ceiling_data: c[partKey].ceiling_data,
    total_interior: partKey === 'other' ? 0 : sub,
    total_ceiling:  partKey === 'other' ? sub : 0,
    discount_amount: d,
    gst_percent: gstPct,
    gst_amount: g,
    grand_total: r2(sub - d + g),
  };
};

export const downloadPartPDF = async (data, partKey) => {
  const part = SPLIT_PARTS.find(p => p.key === partKey);
  const partData = buildPartData(data, partKey);
  const blob = await pdf(<QuotationPDF data={partData} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Deeraj_Quotation_${String(data.customer_name || '').replace(/\s+/g, '_')}_${data.id}_${(part ? part.label : partKey).replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

// Download one part (or 'all') with progress / result popups
export const downloadSplitPDFs = async (data, which) => {
  const parts = availableParts(data);
  const list = which === 'all' ? parts.map(p => p.key) : [which];
  if (!list.length || (which !== 'all' && !parts.some(p => p.key === which))) {
    const part = SPLIT_PARTS.find(p => p.key === which);
    toast.error(`No ${part ? part.label : ''} items in this quotation`, { id: 'split' });
    return;
  }
  toast.loading('Generating PDF…', { id: 'split' });
  try {
    for (const k of list) { await downloadPartPDF(data, k); await new Promise(r => setTimeout(r, 400)); }
    toast.success(list.length > 1 ? `${list.length} PDFs downloaded!` : 'Downloaded!', { id: 'split' });
  } catch (e) {
    console.error('split pdf', e);
    toast.error('Failed to generate PDF', { id: 'split' });
  }
};
