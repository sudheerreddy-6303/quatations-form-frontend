// ── ADDED (per request): Export a quotation to Excel (.xlsx) ──
// Sheet 1 "Quotation": header, client & site manager, every Room / Accessories / Interior Services /
//                      Other Works table, totals (same numbers as the PDF) and payment schedule.
// Sheet 2 "Summary":   one line per room / section with its total, and the grand total.
// exceljs is loaded only when Export Excel is clicked, so the app does not get slower.
import { calcArea, calcTotal, calcRateDiscountTotal } from './roomData';
import { SERVICE_KEYS, isServiceKey } from './interiorServices';
import { versionLabel } from './versionInfo';
import { getBranchDetails, BRANCH_DETAILS } from './branchDetails';

const parseObj = (v, d = {}) => { if (typeof v === 'string' && v) { try { return JSON.parse(v); } catch { return d; } } return v || d; };
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const dateStr = (d) => { try { const x = new Date(d || Date.now()); return x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return ''; } };

const ORANGE = 'FFE8471C', DARK = 'FF1A1A1A', PEACH = 'FFFFF1EC', GREY = 'FFF5F5F5', BORDER = 'FFE0E0E0', GREEN = 'FF059669';
// Indian grouping: ₹1,23,45,678.00
const MONEY = '[>=10000000]"₹"##\\,##\\,##\\,##0.00;[>=100000]"₹"##\\,##\\,##0.00;"₹"#,##0.00';
const MONEY_NEG = '"- ₹"#,##0.00'; // discounts (shown as a minus, in green)
const COLS = ['S.No', 'Particulars', 'W (in)', 'H (in)', 'Nos', 'Area (SFT)', 'Type', 'Rate (₹)', 'Disc. Rate (₹)', 'Total (₹)', 'Remarks'];
const LAST = COLS.length; // 11 → column K

const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const thin = { style: 'thin', color: { argb: BORDER } };
const box = { top: thin, left: thin, bottom: thin, right: thin };

// Does an item have anything worth exporting?
const hasValue = (it) => it && !it.excluded && (String(it.name || '').trim() || calcTotal(it) > 0);

export const buildQuotationWorkbook = (ExcelJS, data) => {
  const rooms = parseObj(data.rooms);
  const cd = parseObj(data.ceiling_data);
  const sections = Object.values(cd).some(v => v && Array.isArray(v.items)) ? cd : {};
  const stages = (() => { const p = parseObj(data.pay_stages, []); return Array.isArray(p) ? p : []; })();
  const branch = (() => { try { return getBranchDetails(data.site_manager_branch) || {}; } catch { return {}; } })();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Deeraj Interiors';
  wb.created = new Date();
  const ws = wb.addWorksheet('Quotation', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } },
    views: [{ showGridLines: false }],
  });
  ws.columns = [6, 34, 9, 9, 7, 11, 12, 12, 13, 15, 24].map(width => ({ width }));

  const merge = (r, c1, c2) => ws.mergeCells(r, c1, r, c2);
  const put = (r, c, v, style = {}) => { const cell = ws.getCell(r, c); cell.value = v; Object.assign(cell, style); return cell; };
  let row = 1;

  // ── Header ──
  merge(row, 1, LAST); put(row, 1, 'DEERAJ INTERIORS', { font: { bold: true, size: 18, color: { argb: ORANGE } } }); ws.getRow(row).height = 26; row++;
  const addr = branch.address ? `${branch.label ? branch.label + ': ' : ''}${branch.address}`
    : Object.values(BRANCH_DETAILS).map((b, i) => `Branch ${i + 1}: ${b.address}`).join('   |   ');
  merge(row, 1, LAST); put(row, 1, addr, { font: { size: 9, color: { argb: 'FF555555' } }, alignment: { wrapText: true, vertical: 'top' } }); ws.getRow(row).height = branch.address ? 24 : 36; row++;
  row++;
  merge(row, 1, 6); put(row, 1, `QUOTATION #${data.quotation_id || data.id || ''}`, { font: { bold: true, size: 13, color: { argb: 'FFFFFFFF' } }, fill: fill(DARK) });
  merge(row, 7, LAST); put(row, 7, `Date: ${dateStr(data.created_at)}   ·   Valid till: ${dateStr(new Date(new Date(data.created_at || Date.now()).getTime() + 30 * 864e5))}`, { font: { color: { argb: 'FFFFFFFF' } }, fill: fill(DARK), alignment: { horizontal: 'right' } });
  ws.getRow(row).height = 22; row++;
  const vl = (() => { try { return versionLabel(data); } catch { return ''; } })();
  if (vl) { merge(row, 1, LAST); put(row, 1, vl, { font: { italic: true, size: 9, color: { argb: 'FF777777' } } }); row++; }
  row++;

  // ── Client / Site manager ──
  const info = [
    ['Client', data.customer_name, 'Site Manager', data.site_manager_name],
    ['Phone', [data.customer_phone, data.customer_alt_phone].filter(Boolean).join(' / '), 'Phone', data.site_manager_phone],
    ['Site / Villa', [data.site_name, data.villa_number].filter(Boolean).join(' · '), 'Branch', data.site_manager_branch],
    ['Location', [data.location, data.full_address, data.pincode].filter(Boolean).join(', '), 'Project Type', data.project_type],
  ];
  const lv = (l, v) => ({ richText: [{ text: `${l}:  `, font: { bold: true, size: 9, color: { argb: 'FF777777' } } }, { text: String(v || '—'), font: { size: 10 } }] });
  info.forEach(([l1, v1, l2, v2]) => {
    merge(row, 1, 5); put(row, 1, lv(l1, v1));
    merge(row, 6, LAST); put(row, 6, lv(l2, v2));
    row++;
  });
  row++;

  // ── Tables ──
  const summary = []; // [group, name, total]
  const groupTitle = (t) => { merge(row, 1, LAST); put(row, 1, t, { font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }, fill: fill(ORANGE) }); ws.getRow(row).height = 20; row++; };
  const table = (group, title, items) => {
    const list = (items || []).filter(hasValue);
    if (!list.length) return 0;
    const total = r2(list.reduce((s, it) => s + calcTotal(it), 0));
    merge(row, 1, 9); put(row, 1, title, { font: { bold: true, size: 11 }, fill: fill(PEACH) });
    put(row, 10, total, { font: { bold: true, color: { argb: ORANGE } }, fill: fill(PEACH), numFmt: MONEY });
    put(row, 11, '', { fill: fill(PEACH) });
    row++;
    COLS.forEach((h, i) => put(row, i + 1, h, { font: { bold: true, size: 9, color: { argb: 'FFFFFFFF' } }, fill: fill(DARK), alignment: { horizontal: i >= 2 && i <= 9 ? 'center' : 'left', vertical: 'middle', wrapText: true }, border: box }));
    row++;
    list.forEach((it, i) => {
      const area = calcArea(it);
      const disc = num(it.discRate);
      const vals = [i + 1, it.name || '', num(it.width) || '', num(it.height) || '', num(it.nos) || '', area || '', it.type || '', num(it.unitCost) || '', disc || '', calcTotal(it), it.remarks || ''];
      vals.forEach((v, c) => {
        const cell = put(row, c + 1, v, { border: box, alignment: { vertical: 'top', wrapText: c === 1 || c === 10, horizontal: (c === 0 || (c >= 2 && c <= 6)) ? 'center' : undefined } });
        if (c === 7 || c === 8 || c === 9) cell.numFmt = MONEY;
        if (c === 9) cell.font = { bold: true };
        if (c === 7 && disc > 0) cell.font = { strike: true, color: { argb: 'FF999999' } };
        if (c === 8 && disc > 0) cell.font = { bold: true, color: { argb: GREEN } };
        if (i % 2 === 1) cell.fill = fill('FFFAFAFA');
      });
      row++;
    });
    row++;
    summary.push([group, title, total]);
    return total;
  };

  // Rooms (wood work)
  const woodRooms = Object.entries(rooms).filter(([k, r]) => k !== 'accessories' && r && Array.isArray(r.items) && r.items.some(hasValue));
  if (woodRooms.length) { groupTitle('ROOMS (WOOD WORK)'); woodRooms.forEach(([, r]) => table('Rooms', r.label || 'Room', r.items)); }
  // Accessories
  if (rooms.accessories && Array.isArray(rooms.accessories.items) && rooms.accessories.items.some(hasValue)) { groupTitle('ACCESSORIES'); table('Accessories', rooms.accessories.label || 'Accessories', rooms.accessories.items); }
  // Interior Services (fixed ones first, then custom, as saved)
  const svc = Object.entries(sections).filter(([k, s]) => isServiceKey(k) && s && Array.isArray(s.items) && s.items.some(hasValue))
    .sort((a, b) => { const ia = SERVICE_KEYS.indexOf(a[0]), ib = SERVICE_KEYS.indexOf(b[0]); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
  if (svc.length) { groupTitle('INTERIOR SERVICES'); svc.forEach(([, s]) => table('Interior Services', s.label || 'Service', s.items)); }
  // Other Works
  const other = Object.entries(sections).filter(([k, s]) => !isServiceKey(k) && s && Array.isArray(s.items) && s.items.some(hasValue));
  if (other.length) { groupTitle('OTHER WORKS'); other.forEach(([, s]) => table('Other Works', s.label || 'Section', s.items)); }

  // ── Totals (same stored numbers as the PDF) ──
  const totalInterior = num(data.total_interior), totalCeiling = num(data.total_ceiling);
  const subtotal = r2(totalInterior + totalCeiling);
  const rateDisc = calcRateDiscountTotal(rooms, sections);
  const discAmt = num(data.discount_amount), gstPct = num(data.gst_percent), gstAmt = num(data.gst_amount), grand = num(data.grand_total);
  const tot = [];
  if (rateDisc > 0) tot.push(['Subtotal (at Rate)', r2(subtotal + rateDisc)], ['Row discounts (Disc. Rate)', -rateDisc]);
  tot.push(['Subtotal', subtotal]);
  if (discAmt > 0) tot.push([`Extra Discount${num(data.discount_percent) > 0 ? ` (${num(data.discount_percent)}%)` : ''}`, -discAmt]);
  if (gstAmt > 0 || gstPct > 0) tot.push([`GST (${gstPct}%)`, gstAmt]);
  tot.push(['GRAND TOTAL', grand]);
  merge(row, 7, LAST); put(row, 7, 'TOTALS', { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: fill(DARK) }); row++;
  tot.forEach(([l, v], i) => {
    const isGrand = i === tot.length - 1;
    merge(row, 7, 9); put(row, 7, l, { font: { bold: isGrand, size: isGrand ? 12 : 10, color: { argb: isGrand ? ORANGE : DARK } }, border: box, fill: isGrand ? fill(PEACH) : undefined });
    merge(row, 10, LAST); put(row, 10, Math.abs(v), { numFmt: v < 0 ? MONEY_NEG : MONEY, font: { bold: true, size: isGrand ? 12 : 10, color: { argb: isGrand ? ORANGE : (v < 0 ? GREEN : DARK) } }, border: box, alignment: { horizontal: 'right' }, fill: isGrand ? fill(PEACH) : undefined });
    row++;
  });
  row++;

  // ── Payment schedule ──
  const st = stages.map(s => (typeof s === 'string' ? { stage: s } : s || {})).filter(s => String(s.stage || '').trim() || num(s.amount) > 0);
  if (st.length) {
    groupTitle('PAYMENT SCHEDULE');
    ['S.No', 'Stage', '', '', '', '', '', '', 'Amount (₹)', '', 'Notes'].forEach((h, i) => { if (h) put(row, i + 1, h, { font: { bold: true, size: 9, color: { argb: 'FFFFFFFF' } }, fill: fill(DARK) }); else put(row, i + 1, '', { fill: fill(DARK) }); });
    row++;
    st.forEach((s, i) => {
      put(row, 1, i + 1, { border: box }); merge(row, 2, 8); put(row, 2, s.stage || '', { border: box });
      merge(row, 9, 10); put(row, 9, num(s.amount) || '', { numFmt: MONEY, border: box }); put(row, 11, s.notes || '', { border: box, alignment: { wrapText: true } });
      row++;
    });
  }

  // ── Sheet 2: Summary ──
  const sm = wb.addWorksheet('Summary', { views: [{ showGridLines: false }] });
  sm.columns = [{ width: 22 }, { width: 34 }, { width: 18 }];
  sm.mergeCells(1, 1, 1, 3); Object.assign(sm.getCell(1, 1), { value: `Quotation #${data.quotation_id || data.id || ''} — ${data.customer_name || ''}`, font: { bold: true, size: 13, color: { argb: ORANGE } } });
  ['Group', 'Room / Section', 'Total (₹)'].forEach((h, i) => Object.assign(sm.getCell(3, i + 1), { value: h, font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: fill(DARK), border: box }));
  let sr = 4;
  summary.forEach(([g, n, t], i) => {
    [g, n, t].forEach((v, c) => { const cell = sm.getCell(sr, c + 1); cell.value = v; cell.border = box; if (c === 2) cell.numFmt = MONEY; if (i % 2) cell.fill = fill(GREY); });
    sr++;
  });
  sr++;
  tot.forEach(([l, v], i) => {
    const isGrand = i === tot.length - 1;
    sm.mergeCells(sr, 1, sr, 2);
    Object.assign(sm.getCell(sr, 1), { value: l, font: { bold: true, color: { argb: isGrand ? ORANGE : DARK } }, border: box });
    Object.assign(sm.getCell(sr, 3), { value: Math.abs(v), numFmt: v < 0 ? MONEY_NEG : MONEY, font: { bold: true, color: { argb: isGrand ? ORANGE : (v < 0 ? GREEN : DARK) } }, border: box });
    sr++;
  });
  return wb;
};

// Download the Excel file in the browser
export const exportQuotationExcel = async (data) => {
  const mod = await import('exceljs');
  const ExcelJS = mod.default || mod;
  const wb = buildQuotationWorkbook(ExcelJS, data);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Deeraj_Quotation_${String(data.customer_name || 'Client').replace(/\s+/g, '_')}_${data.quotation_id || data.id || ''}.xlsx`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};
