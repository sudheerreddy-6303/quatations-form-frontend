// printQuotation.js
// Generates a browser-printable HTML window from quotation data
// Uses the EXACT same layout as the ViewModal, plus watermark

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').trim();
const LOGO_URL = `${API_BASE}/logo.png`;

const SECTION_META = {
  ceiling:    { label: 'CEILING WORK',           color: '#1D4ED8', bg: '#EFF6FF' },
  electrical: { label: 'ELECTRICAL ACCESSORIES', color: '#A16207', bg: '#FEFCE8' },
  wooden:     { label: 'WOODEN ACCESSORIES',     color: '#9A3412', bg: '#FFF7ED' },
  marble:     { label: 'MARBLE & PLUMBING',      color: '#166534', bg: '#F0FDF4' },
  general:    { label: 'GENERAL',                color: '#6D28D9', bg: '#F5F3FF' },
};

function fmtINR(n) { return 'Rs. ' + Number(n||0).toLocaleString('en-IN'); }

function calcArea(item) {
  if (item.type === 'FIXED' || (!item.width && !item.height)) return 0;
  return parseFloat(((item.width * item.height * item.nos) / 144).toFixed(1));
}
function calcTotal(item) {
  if (item.type === 'FIXED') return (item.unitCost || 0) * (item.nos || 1);
  if (!item.width && !item.height) return item.nos * item.unitCost;
  return Math.round(calcArea(item) * item.unitCost);
}

const DEFAULT_NOTES = [
  'Sylvan 30 years for Kitchen and 21 years BWP 710 for other areas will be Provided.',
  'Hardware Hinges "Hettich Brand" Total House Soft closing will be Provided.',
  'Kitchen Tandem Baskets will be Provided Hettich brand.',
  'All civil works, granite & tiles will be extra costing.',
  'All electrical fittings and accessories not included in above quotation.',
  'Handles 4" & 6" and 8" (price range upto Rs.500 per Handle) will be provided.',
  'Only kitchen base will be g-profile or gola profile.',
  'Laminates (Price Range from Rs.2000 to Rs.2500) will be provided.',
  'It will be approximate estimation, based on actual Designs & dimensions it will be changed.',
  'Fully Factory finishing Except TV Unit, Partition, Wall Elevation.',
  'Booking Advance 10%.',
];

const PAY_STAGES = [
  'Booking Advance','After Design','Material Purchase time',
  'Carcas Installation','Doors Fitting','Handles Fitting',
  'Finishing and Hand Over',''
];

const PAY_TC = [
  ['Booking Advance:', 'A non-refundable commitment fee required to initiate the project.'],
  ['Post-Design Payment:', 'Due upon final approval of 2D/3D designs. Procurement begins only after this is cleared.'],
  ['Material Procurement:', 'Covers raw materials and hardware. Vendor orders placed only after funds are credited.'],
  ['Carcass Installation:', 'Due upon completion of basic structure. Finishing works commence after this payment.'],
  ['Work Suspension:', 'Work suspended if a stage payment is delayed by more than 3 business days.'],
  ['Material Price Escalation:', 'If "Material Purchase" is deferred 15+ days, any price increase will be billed additionally.'],
  ['Storage Charges:', 'If handover is deferred, a storage fee of 1% of invoice value per week applies.'],
  ['Warranty:', 'The 6-month hardware warranty is valid only after full payment.'],
];

function pageHeader(invoiceDate, smPhone, showLabel, quotationId) {
  return `
    <div class="page-header-bar">
      <img src="${LOGO_URL}" alt="Deeraj Interiors" class="logo-img" referrerpolicy="no-referrer"/>
      <div style="text-align:right">
        ${showLabel ? `<div class="quotation-label">QUOTATION #${quotationId||''}</div>` : ''}
        <div class="header-meta">Date: ${invoiceDate}</div>
        <div class="header-meta">${smPhone ? 'Mobile: '+smPhone : 'Mobile: 9000700930 / 910'}</div>
        ${showLabel ? '<div class="header-meta">Interior work Estimation for the proposed plan.</div>' : ''}
      </div>
    </div>
    <div class="brand-line"></div>
  `;
}

function tableSection(label, items, isAccessory, color='#E8471C', bg='#FFF0EC') {
  if (!items || !items.length) return '';
  const total = isAccessory
    ? items.reduce((s,it) => s + (it.nos * it.unitCost), 0)
    : items.reduce((s,it) => s + calcTotal(it), 0);

  const header = isAccessory
    ? `<th style="width:38%;text-align:left">ITEM</th>
       <th style="width:12%;text-align:center">QTY</th>
       <th style="width:20%;text-align:right">UNIT COST (Rs.)</th>
       <th style="width:14%;text-align:right">TOTAL (Rs.)</th>
       <th style="width:16%;text-align:left">REMARKS</th>`
    : `<th style="width:26%;text-align:left">PARTICULARS</th>
       <th style="width:6%;text-align:center">W(in)</th>
       <th style="width:6%;text-align:center">H(in)</th>
       <th style="width:5%;text-align:center">NOS</th>
       <th style="width:7%;text-align:center">AREA sft</th>
       <th style="width:9%;text-align:center">TYPE</th>
       <th style="width:12%;text-align:right">RATE(Rs.)</th>
       <th style="width:13%;text-align:right">TOTAL(Rs.)</th>
       <th style="width:16%;text-align:left">REMARKS</th>`;

  const rows = items.map((it, i) => {
    const area = calcArea(it);
    const tot  = calcTotal(it);
    const bg2  = i % 2 === 1 ? '#FAFAFA' : '#fff';
    if (isAccessory) {
      return `<tr style="background:${bg2}">
        <td>${it.name||''}</td>
        <td style="text-align:center">${it.nos||0}</td>
        <td style="text-align:right">${(it.unitCost||0).toLocaleString('en-IN')}</td>
        <td style="text-align:right;color:#E8471C;font-weight:700">${(it.nos*it.unitCost).toLocaleString('en-IN')}</td>
        <td>${it.remarks||''}</td>
      </tr>`;
    }
    return `<tr style="background:${bg2}">
      <td>${it.name||''}</td>
      <td style="text-align:center">${it.type!=='FIXED'?(it.width||''):''}</td>
      <td style="text-align:center">${it.type!=='FIXED'?(it.height||''):''}</td>
      <td style="text-align:center">${it.nos||0}</td>
      <td style="text-align:center">${area||'—'}</td>
      <td style="text-align:center">${it.type||''}</td>
      <td style="text-align:right">${(it.unitCost||0).toLocaleString('en-IN')}</td>
      <td style="text-align:right;color:#E8471C;font-weight:700">${tot.toLocaleString('en-IN')}</td>
      <td>${it.remarks||''}</td>
    </tr>`;
  }).join('');

  return `
    <div class="section-label-bar" style="border-left:3px solid ${color};background:${bg}">
      <span style="font-weight:700;font-size:9pt;color:#1A1A1A;letter-spacing:0.3px">${label.toUpperCase()}</span>
      <span style="font-weight:700;font-size:9pt;color:${color}">${fmtINR(total)}</span>
    </div>
    <table class="data-table">
      <colgroup><col/></colgroup>
      <thead><tr>${header}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function printQuotation(data, transactions=[]) {
  const NOTES = (() => {
    const n = Array.isArray(data.note_items) ? data.note_items
      : (typeof data.note_items === 'string' && data.note_items ? (()=>{ try { return JSON.parse(data.note_items); } catch { return null; } })() : null);
    return (Array.isArray(n) && n.length) ? n : DEFAULT_NOTES;
  })();
  // Build transaction map by stage
  const txnByStage = {};
  (transactions||[]).forEach(t => {
    const key = (t.stage_name||'').trim().toLowerCase();
    if (!txnByStage[key]) txnByStage[key] = { paid:0, txns:[] };
    txnByStage[key].paid += Number(t.paid_amount||0);
    txnByStage[key].txns.push(t);
  });
  const getStageTxn = (name) => txnByStage[(name||'').trim().toLowerCase()] || { paid:0, txns:[] };
  const totalTxnPaid = (transactions||[]).reduce((s,t)=>s+Number(t.paid_amount||0),0);

  const rooms  = data.rooms || {};
  const rawCd  = data.ceiling_data || {};
  const isNewFmt = rawCd.ceiling||rawCd.electrical||rawCd.wooden||rawCd.marble||rawCd.general;
  const sections = isNewFmt ? rawCd : null;
  const cd = !isNewFmt ? rawCd : {};

  const totalInterior = Number(data.total_interior||0);
  const totalCeiling  = Number(data.total_ceiling ||0);
  const subtotal      = totalInterior + totalCeiling;
  const gstPercent    = Number(data.gst_percent||0);
  const gstAmount     = Number(data.gst_amount ||0);
  const grandTotal    = Number(data.grand_total ||0);

  const smName   = data.site_manager_name || '';
  const smDesig  = data.site_manager_designation || 'Site Manager';
  const smPhone  = data.site_manager_phone || '';
  const smBranch = data.site_manager_branch || '';

  const dash = (v) => (v && String(v).trim()) ? String(v).trim() : '—';

  const clientAltPhone  = dash(data.customer_alt_phone);
  const clientAddress   = dash(data.full_address);
  const clientPincode   = dash(data.pincode);
  const clientVilla     = dash(data.villa_number);
  const clientSiteName  = dash(data.site_name);
  const clientLocation  = dash(data.location);
  const projectType     = dash(data.project_type);

  const createdAt   = new Date(data.created_at||Date.now());
  const invoiceDate = createdAt.toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
  const validDate   = new Date(createdAt.getTime()+30*24*60*60*1000).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
  const quotationId = data.quotation_id || data.id || '';

  // Resolve T&C — always use form data; fall back to defaults only if truly empty
  let tcItems = data.tc_items;
  if (typeof tcItems === 'string' && tcItems) {
    try { tcItems = JSON.parse(tcItems); } catch { tcItems = null; }
  }
  if (!Array.isArray(tcItems) || !tcItems.length) {
    tcItems = [
      'Payment Terms: Invoice must be paid within 25 days from the issue date.',
      'Delivery Estimate: Orders will be delivered within 45–60 business days after confirmation.',
      'Quotation Validity: This quotation remains valid until ' + validDate + '.',
      'Warranty: Hardware includes a standard one year warranty.',
      'Cost is inclusive of all channels, Hinges and Handles.',
      'Shipping Policy: Shipping fees may vary based on destination.',
      'The payment received corresponds to the specific items or milestones listed in this quotation.',
      'Any changes to the design or materials requested after payment will incur additional costs.',
    ];
  }

  // Interior room sections
  const roomHTML = Object.entries(rooms).map(([k,room],i) => {
    if (!room||!room.items||!room.items.length) return '';
    return tableSection(room.label||k, room.items, k==='accessories');
  }).join('');

  // Extra sections (ceiling/electrical/wooden/marble/general)
  const sectionsHTML = isNewFmt
    ? Object.entries(sections).map(([k,sec]) => {
        if (!sec||!sec.items||!sec.items.length) return '';
        const meta = SECTION_META[k]||{label:(sec&&sec.label)||k,color:'#888',bg:'#F5F5F5'};
        return tableSection(meta.label, sec.items, false, meta.color, meta.bg);
      }).join('')
    : `
      <div class="section-label-bar" style="border-left:3px solid #E8471C;background:#FFF0EC">
        <span style="font-weight:700;font-size:9pt;color:#1A1A1A">CEILING WORK ESTIMATION</span>
        <span style="font-weight:700;font-size:9pt;color:#E8471C">${fmtINR(totalCeiling)}</span>
      </div>
      <table class="data-table">
        <thead><tr>
          <th style="text-align:left">PARTICULARS</th>
          <th style="width:14%;text-align:center">QTY/AREA</th>
          <th style="width:12%;text-align:center">RATE</th>
          <th style="width:16%;text-align:right">AMOUNT (Rs.)</th>
          <th style="width:20%;text-align:left">REMARKS</th>
        </tr></thead>
        <tbody>
          <tr><td>Plain Area</td><td style="text-align:center">${cd.plainArea||0} sft</td><td style="text-align:center">${cd.plainRate||0}</td><td style="text-align:right;color:#E8471C;font-weight:700">${((cd.plainArea||0)*(cd.plainRate||0)).toLocaleString('en-IN')}</td><td>Incl. 2 cot Putti &amp; Painting</td></tr>
          <tr style="background:#FAFAFA"><td>Strip Light Cutting</td><td style="text-align:center">${cd.stripLength||0} ft</td><td style="text-align:center">${cd.stripRate||0}</td><td style="text-align:right;color:#E8471C;font-weight:700">${((cd.stripLength||0)*(cd.stripRate||0)).toLocaleString('en-IN')}</td><td></td></tr>
          <tr><td>Electrical Labour Charges</td><td style="text-align:center">—</td><td style="text-align:center">—</td><td style="text-align:right;color:#E8471C;font-weight:700">${(cd.electricalLabour||0).toLocaleString('en-IN')}</td><td></td></tr>
        </tbody>
      </table>`;

  // Watermark SVG (diagonal "DEERAJ INTERIORS" repeated)
  const watermark = `
    <div class="watermark" aria-hidden="true">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="wm" x="0" y="0" width="320" height="220" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)">
            <image href="${LOGO_URL}" x="20" y="30" width="200" height="70" opacity="0.07"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wm)"/>
      </svg>
    </div>`;

  const commonPageStyles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10pt; color: #1A1A1A; background: #fff; }
    .page { position: relative; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 0; background: #fff; page-break-after: always; overflow: hidden; }
    .page:last-child { page-break-after: auto; }
    .watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
    .page-content { position: relative; z-index: 1; }
    .page-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 28px; background: #fff; border-bottom: 1px solid #E0E0E0; }
    .logo-img { height: 48px; width: auto; object-fit: contain; }
    .brand-line { height: 3px; background: #E8471C; }
    .quotation-label { font-size: 13pt; color: #E8471C; font-weight: 700; letter-spacing: 2px; }
    .header-meta { font-size: 7.5pt; color: #AAAAAA; margin-top: 2px; }
    .info-section { display: flex; background: #F5F5F5; border-bottom: 1px solid #E0E0E0; padding: 10px 28px; gap: 0; }
    .info-col { flex: 1; }
    .info-col-title { font-size: 7pt; font-weight: 700; color: #AAA; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #E0E0E0; padding-bottom: 3px; }
    .info-row { display: flex; gap: 6px; margin-bottom: 3px; }
    .info-label { font-size: 7.5pt; color: #555; min-width: 60px; }
    .info-value { font-size: 10pt; font-weight: 700; }
    .info-divider { width: 1px; background: #E0E0E0; margin: 0 16px; }
    .body-pad { padding: 4px 24px 24px; }
    .section-label-bar { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; margin-top: 10px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; table-layout: fixed; margin-top: 0; }
    .data-table thead tr { background: #1A1A1A; }
    .data-table th { padding: 5px 7px; color: #fff; font-size: 8pt; font-weight: 700; border: 1px solid #111; white-space: nowrap; }
    .data-table td { padding: 5px 7px; border: 1px solid #E0E0E0; vertical-align: top; word-break: break-word; }
    .interior-total { display: flex; justify-content: space-between; align-items: center; background: rgba(232,71,28,0.10); border-radius: 3px; padding: 7px 12px; margin-top: 10px; }
    .interior-total-label { font-weight: 700; font-size: 10pt; }
    .interior-total-value { font-weight: 700; font-size: 11pt; color: #E8471C; }
    .totals-block { margin: 10px 0; border: 1px solid #E0E0E0; border-radius: 3px; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 14px; font-size: 9.5pt; }
    .subtotal-row { background: #F5F5F5; border-bottom: 1px solid #E0E0E0; }
    .gst-row { background: #FFF0EC; border-bottom: 1px solid #E0E0E0; color: #92400E; font-weight: 600; }
    .grand-row { background: #1A1A1A; color: #E8471C; font-weight: 700; font-size: 11pt; }
    .notes-box { background: #F5F5F5; border: 0.5px solid #E0E0E0; border-radius: 3px; padding: 8px 12px; margin-top: 8px; }
    .notes-title { font-size: 8pt; font-weight: 700; margin-bottom: 4px; }
    .note-item { font-size: 7.5pt; color: #555; line-height: 1.4; margin-bottom: 1.5px; }
    .sign-row { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 8px; border-top: 0.5px solid #E0E0E0; }
    .sign-block { text-align: center; min-width: 110px; }
    .sign-space { height: 30px; }
    .sign-line { height: 1px; background: #1A1A1A; margin-bottom: 3px; }
    .sign-label { font-size: 7pt; color: #888; }
    .sign-name { font-size: 8.5pt; font-weight: 700; }
    .tc-box { background: #FFF0EC; border: 1px solid #FDE8E2; border-radius: 4px; padding: 12px 16px; margin-bottom: 8px; }
    .tc-list { margin: 0; padding-left: 16px; list-style: disc; }
    .tc-list li { font-size: 9.5pt; color: #333; line-height: 1.65; margin-bottom: 3px; }
    .pay-table { width: 100%; border-collapse: collapse; font-size: 8pt; }
    .pay-table th { background: #1A1A1A; color: #fff; padding: 5px 6px; font-size: 7.5pt; font-weight: 700; border: 1px solid #111; }
    .pay-table td { padding: 8px 6px; border: 1px solid #E0E0E0; height: 26px; font-size: 8.5pt; }
    .section-title-big { font-size: 12pt; font-weight: 800; color: #1A1A1A; margin-bottom: 10px; letter-spacing: 0.5px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; box-shadow: none; }
    }`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="referrer" content="no-referrer"/>
  <title>Quotation — ${data.customer_name}</title>
  <style>${commonPageStyles}</style>
</head>
<body>

<!-- ══════════════ PAGE 1 — QUOTATION ══════════════ -->
<div class="page">
  ${watermark}
  <div class="page-content">
    ${pageHeader(invoiceDate, smPhone, true, quotationId)}

    <!-- Company Details -->
    <div style="padding:6px 0 8px;line-height:1.5">
      <div style="font-size:13pt;font-weight:bold;color:#1A1A1A">DEERAJ INTERIORS</div>
      <div style="font-size:8.5pt;color:#333">SECOND FLOOR, PLOT NO.119, KOMPALLY, JEEDIMETLA, GREEN PARK AVENUE, Hyderabad, Medchal Malkajgiri, Telangana, 500055</div>
      <div style="font-size:8.5pt;color:#333">GSTIN/UIN: 36BDFPG9987H1ZY</div>
      <div style="font-size:8.5pt;color:#333">State Name : Telangana, Code : 36</div>
    </div>

    <!-- Client LEFT | Site Manager RIGHT -->
    <div class="info-section">
      <div class="info-col">
        <div class="info-col-title">Client Information</div>
        <div class="info-row"><span class="info-label">Name</span><span class="info-value">${dash(data.customer_name)}</span></div>
        <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${dash(data.customer_phone||data.mobile)}</span></div>
        <div class="info-row"><span class="info-label">Alt Phone</span><span class="info-value">${clientAltPhone}</span></div>
        <div class="info-row"><span class="info-label">Address</span><span class="info-value">${clientAddress}</span></div>
        <div class="info-row"><span class="info-label">Pincode</span><span class="info-value">${clientPincode}</span></div>
        <div class="info-row"><span class="info-label">Villa / Flat</span><span class="info-value">${clientVilla}</span></div>
        <div class="info-row"><span class="info-label">Site Name</span><span class="info-value">${clientSiteName}</span></div>
        <div class="info-row"><span class="info-label">Location</span><span class="info-value">${clientLocation}</span></div>
        <div class="info-row"><span class="info-label">Project Type</span><span class="info-value">${projectType}</span></div>
      </div>
      <div class="info-divider"></div>
      <div class="info-col">
        <div class="info-col-title">Site Manager Information</div>
        <div class="info-row"><span class="info-label">Name</span><span class="info-value">${dash(smName)}</span></div>
        <div class="info-row"><span class="info-label">Designation</span><span class="info-value">${dash(smDesig)}</span></div>
        <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${dash(smPhone)}</span></div>
        <div class="info-row"><span class="info-label">Branch</span><span class="info-value">${dash(smBranch)}</span></div>
      </div>
    </div>

    <div class="body-pad">
      ${roomHTML}

      <!-- Interior Total -->
      <div class="interior-total">
        <span class="interior-total-label">Total 1 — Interior Work</span>
        <span class="interior-total-value">${fmtINR(totalInterior)}</span>
      </div>

      ${sectionsHTML}

      <!-- Totals -->
      <div class="totals-block">
        <div class="totals-row subtotal-row"><span>Subtotal</span><span>${fmtINR(subtotal)}</span></div>
        ${gstPercent>0?`<div class="totals-row gst-row"><span>GST (${gstPercent}%)</span><span>+ ${fmtINR(gstAmount)}</span></div>`:''}
        <div class="totals-row grand-row">
          <span>GRAND TOTAL${gstPercent>0?' (incl. '+gstPercent+'% GST)':''}</span>
          <span>${fmtINR(grandTotal)}</span>
        </div>
      </div>

      <!-- Bank Details -->
      <div style="margin-top:10px;border:1px solid #E0E0E0;border-radius:4px;padding:8px 12px;line-height:1.5">
        <div style="font-size:9pt;font-weight:bold;color:#1A1A1A;margin-bottom:2px">BANK DETAILS</div>
        <div style="font-size:8.5pt;color:#333">Deeraj Interiors</div>
        <div style="font-size:8.5pt;color:#333">Account Number : 4623 0400 0001 80</div>
        <div style="font-size:8.5pt;color:#333">Bank of Baroda &mdash; Kompally Branch</div>
        <div style="font-size:8.5pt;color:#333">IFSC : 500012040</div>
      </div>

      <!-- Notes -->
      <div class="notes-box">
        <div class="notes-title">NOTE:</div>
        ${NOTES.map((n,i)=>`<div class="note-item">${i+1}. ${n}</div>`).join('')}
      </div>

      <!-- Signatures -->
      <div class="sign-row">
        <div class="sign-block"><div class="sign-space"></div><div class="sign-line"></div><div class="sign-label">CUSTOMER SIGN</div><div class="sign-name">${data.customer_name}</div></div>
        <div class="sign-block"><div class="sign-space"></div><div class="sign-line"></div><div class="sign-label">SITE MANAGER SIGN</div><div class="sign-name">${smName}</div><div class="sign-label">${smDesig}</div></div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════ PAGE 2 — TERMS & CONDITIONS ══════════════ -->
<div class="page">
  ${watermark}
  <div class="page-content">
    ${pageHeader(invoiceDate, smPhone, false)}
    <div class="body-pad" style="padding-top:20px">
      <div class="section-title-big">TERMS AND CONDITIONS</div>
      <div class="tc-box">
        <ul class="tc-list">
          ${tcItems.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>
      <div class="sign-row" style="margin-top:60px">
        <div class="sign-block"><div class="sign-space"></div><div style="font-size:8pt;color:#888;margin-bottom:30px">Prepared By</div><div class="sign-line"></div><div class="sign-name">${smName}</div><div class="sign-label">${smDesig}</div></div>
        <div class="sign-block"><div class="sign-space"></div><div style="font-size:8pt;color:#888;margin-bottom:30px">Customer Sign</div><div class="sign-line"></div><div class="sign-name">${data.customer_name}</div></div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════ PAGE 3 — PAYMENT SCHEDULE ══════════════ -->
<div class="page">
  ${watermark}
  <div class="page-content">
    ${pageHeader(invoiceDate, smPhone, false)}
    <div class="body-pad" style="padding-top:20px">
      <div class="section-title-big" style="text-align:center;letter-spacing:1px">STAGE WISE PAYMENT SCHEDULE</div>
      ${(()=>{
        let ps=data.pay_stages;
        if(typeof ps==='string'&&ps){try{ps=JSON.parse(ps);}catch{ps=null;}}
        if(!Array.isArray(ps)||!ps.length)ps=PAY_STAGES;
        const rows=ps.map(r=>typeof r==='string'?{stage:r,paymentAmount:'',paymentDate:''}:r);
        const totalSched=rows.reduce((s,r)=>s+(parseFloat(r.paymentAmount)||0),0);
        const toDisp=(d)=>{if(!d)return '-';const m=d.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m)return `${m[3]}/${m[2]}/${m[1]}`;return d;};
        const summaryBar=`<div style="display:flex;gap:12px;justify-content:center;margin-bottom:12px;">
          <div style="background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:6px;padding:5px 14px;text-align:center;">
            <div style="font-size:8px;color:#1D4ED8;font-weight:700;letter-spacing:0.5px;">TOTAL SCHEDULED</div>
            <div style="font-size:13px;font-weight:700;color:#1D4ED8;">&#8377;${totalSched.toLocaleString('en-IN')}</div>
          </div>
          <div style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:6px;padding:5px 14px;text-align:center;">
            <div style="font-size:8px;color:#15803D;font-weight:700;letter-spacing:0.5px;">TOTAL RECEIVED</div>
            <div style="font-size:13px;font-weight:700;color:#15803D;">&#8377;${totalTxnPaid.toLocaleString('en-IN')}</div>
          </div>
          <div style="background:${totalSched-totalTxnPaid>0?'#FFF5F5':'#F0FDF4'};border:1.5px solid ${totalSched-totalTxnPaid>0?'#FECACA':'#BBF7D0'};border-radius:6px;padding:5px 14px;text-align:center;">
            <div style="font-size:8px;font-weight:700;letter-spacing:0.5px;color:${totalSched-totalTxnPaid>0?'#DC2626':'#15803D'};">BALANCE</div>
            <div style="font-size:13px;font-weight:700;color:${totalSched-totalTxnPaid>0?'#DC2626':'#15803D'};">&#8377;${(totalSched-totalTxnPaid).toLocaleString('en-IN')}</div>
          </div>
        </div>`;
        const tableRows=rows.map((row,i)=>{
          const stxn=getStageTxn(row.stage);
          const totalPaid=stxn.paid;
          const scheduled=parseFloat(row.paymentAmount)||0;
          const latestTxn=stxn.txns[stxn.txns.length-1]||null;
          const isPaid=totalPaid>=scheduled&&scheduled>0;
          const isPartial=totalPaid>0&&totalPaid<scheduled;
          const rowBg=isPaid?'#F0FDF4':isPartial?'#FFFBEB':i%2===1?'#FAFAFA':'#fff';
          return `<tr style="background:${rowBg}">
            <td style="padding:7px;border:1px solid #E0E0E0;font-weight:700;font-size:9px;">${row.stage||''}${isPaid?' <span style="color:#15803D">&#10003;</span>':''}</td>
            <td style="padding:7px;border:1px solid #E0E0E0;font-size:9px;font-weight:${scheduled?700:400};color:${scheduled?'#1D4ED8':'#CCC'};text-align:right;">${scheduled?'&#8377;'+scheduled.toLocaleString('en-IN'):'-'}</td>
            <td style="padding:7px;border:1px solid #E0E0E0;font-size:9px;color:#555;">${toDisp(row.paymentDate)}</td>
            <td style="padding:7px;border:1px solid #E0E0E0;font-size:9px;font-weight:700;color:${totalPaid>0?'#15803D':'#CCC'};text-align:right;">${totalPaid>0?'&#8377;'+totalPaid.toLocaleString('en-IN'):'-'}</td>
            <td style="padding:7px;border:1px solid #E0E0E0;font-size:9px;color:#555;">${latestTxn&&latestTxn.paid_date?toDisp(latestTxn.paid_date):'-'}</td>
            <td style="padding:7px;border:1px solid #E0E0E0;font-size:9px;">${latestTxn&&latestTxn.payment_type?`<span style="background:#EFF6FF;color:#1D4ED8;border-radius:10px;padding:1px 6px;font-size:8px;font-weight:600;">${latestTxn.payment_type}</span>`:'-'}</td>
            <td style="padding:7px;border:1px solid #E0E0E0;font-size:9px;color:#555;max-width:80px;overflow:hidden;white-space:nowrap;">${latestTxn&&latestTxn.payment_details?latestTxn.payment_details:'-'}</td>
            <td style="padding:7px;border:1px solid #E0E0E0;font-size:9px;color:#555;">${latestTxn&&latestTxn.received_by?latestTxn.received_by:'-'}</td>
          </tr>`;
        }).join('');
        return summaryBar+`<table class="pay-table">
          <thead><tr>
            <th>Payment Stage</th><th>Scheduled (&#8377;)</th><th>Due Date</th>
            <th style="color:#86EFAC;">&#10003; Actual Paid (&#8377;)</th><th style="color:#86EFAC;">Paid Date</th>
            <th style="color:#86EFAC;">Mode</th><th style="color:#86EFAC;">Ref/Details</th><th style="color:#86EFAC;">Received By</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
          <tfoot><tr style="background:#F0FDF4;font-weight:700;">
            <td style="padding:7px;border:1px solid #E0E0E0;font-size:9px;">TOTAL</td>
            <td style="padding:7px;border:1px solid #E0E0E0;font-size:9px;color:#1D4ED8;text-align:right;">&#8377;${totalSched.toLocaleString('en-IN')}</td>
            <td style="padding:7px;border:1px solid #E0E0E0;"></td>
            <td style="padding:7px;border:1px solid #E0E0E0;font-size:9px;color:#15803D;text-align:right;">&#8377;${totalTxnPaid.toLocaleString('en-IN')}</td>
            <td colspan="4" style="padding:7px;border:1px solid #E0E0E0;font-size:9px;color:${totalSched-totalTxnPaid>0?'#DC2626':'#15803D'};font-weight:700;">Balance: &#8377;${(totalSched-totalTxnPaid).toLocaleString('en-IN')}</td>
          </tr></tfoot>
        </table>`;
      })()}
    </div>
  </div>
</div>

<!-- ══════════════ PAGE 4 — PAYMENT T&C ══════════════ -->
<div class="page">
  ${watermark}
  <div class="page-content">
    ${pageHeader(invoiceDate, smPhone, false)}
    <div class="body-pad" style="padding-top:20px">
      <div class="section-title-big">STAGE WISE PAYMENT — TERMS &amp; CONDITIONS</div>
      <ul class="tc-list" style="margin-top:8px">
        ${PAY_TC.map(([b,r])=>`<li><strong>${b}</strong> ${r}</li>`).join('')}
      </ul>
      <div class="sign-row" style="margin-top:60px">
        <div class="sign-block"><div style="font-size:8pt;color:#888;margin-bottom:30px">Prepared By</div><div class="sign-line"></div><div class="sign-name">${smName}</div><div class="sign-label">${smDesig}</div></div>
        <div class="sign-block"><div style="font-size:8pt;color:#888;margin-bottom:30px">Customer Sign</div><div class="sign-line"></div><div class="sign-name">${data.customer_name}</div></div>
      </div>
    </div>
  </div>
</div>

<script>
  // Wait for logo image to fully load AND paint before printing
  window.onload = function() {
    var imgs = Array.prototype.slice.call(document.querySelectorAll('img'));
    var fired = false;
    function go() {
      if (fired) return; fired = true;
      // small delay so the browser finishes decoding/painting the logo
      setTimeout(function() { window.print(); window.close(); }, 350);
    }
    if (imgs.length === 0) { go(); return; }
    var done = 0;
    function check() { done++; if (done >= imgs.length) go(); }
    // safety: never hang if the logo URL is slow or unreachable
    setTimeout(go, 5000);
    imgs.forEach(function(img) {
      if (img.complete && img.naturalWidth > 0) { check(); }
      else { img.onload = img.onerror = check; }
    });
  };
</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Please allow popups for this site to print.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}