import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { calcArea, calcTotal, calcRoomTotal } from '../utils/roomData';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').trim();
const LOGO_URL = `${API_BASE}/logo.png`;

const SECTION_META = {
  ceiling:    { label: 'Ceiling Work' },
  electrical: { label: 'Electrical Accessories' },
  wooden:     { label: 'Wooden Accessories' },
  marble:     { label: 'Marble & Plumbing' },
  general:    { label: 'General' },
};

const C = {
  brand:     '#E8471C',
  brandDark: '#C73A14',
  dark:      '#1A1A1A',
  gray:      '#555555',
  lightGray: '#F5F5F5',
  border:    '#DDDDDD',
  white:     '#FFFFFF',
  rowAlt:    '#FAFAFA',
  sectionBg: '#FFF0EC',
};

const s = StyleSheet.create({
  page: { fontSize: 8, color: C.dark, backgroundColor: C.white, paddingBottom: 50 },

  // Header
  header: { backgroundColor: C.white, padding: '14 30 10 30', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border },
  logo: { width: 130, height: 45 },
  headerMeta: { fontSize: 7, color: '#AAAAAA', marginTop: 2 },
  invoiceLabel: { fontSize: 11, color: C.brand, fontWeight: 'bold', letterSpacing: 2 },
  brandLine: { height: 3, backgroundColor: C.brand },

  // Client & SM info row — two columns
  infoSection: { flexDirection: 'row', padding: '10 30', backgroundColor: C.lightGray, borderBottomWidth: 1, borderBottomColor: C.border },
  infoCol: { flex: 1 },
  infoDivider: { width: 1, backgroundColor: C.border, marginHorizontal: 16 },
  infoLabel: { fontSize: 6.5, color: C.gray, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 9.5, fontWeight: 'bold', color: C.dark, marginBottom: 1 },
  infoSub:   { fontSize: 7, color: C.gray },

  // Section heading
  sectionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.sectionBg, borderLeftWidth: 3, borderLeftColor: C.brand, padding: '5 10 5 10', marginHorizontal: 16, marginTop: 8 },
  sectionLabel: { fontSize: 8.5, fontWeight: 'bold', color: C.dark, flex: 1, letterSpacing: 0.3 },
  sectionTotal: { fontSize: 8.5, fontWeight: 'bold', color: C.brand },

  // Table
  tableWrap: { marginHorizontal: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: C.dark, paddingVertical: 4, paddingHorizontal: 4 },
  th: { fontSize: 6.5, color: C.white, fontWeight: 'bold', letterSpacing: 0.3 },
  tableRow: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: C.border },
  tableRowAlt: { backgroundColor: C.rowAlt },
  td: { fontSize: 7, color: C.dark },
  tdBrand: { fontSize: 7, color: C.brand, fontWeight: 'bold' },

  // Room column widths — FIXED to prevent overlap
  colName:   { width: '26%' },
  colW:      { width: '6%',  textAlign: 'center' },
  colH:      { width: '6%',  textAlign: 'center' },
  colNos:    { width: '5%',  textAlign: 'center' },
  colArea:   { width: '7%',  textAlign: 'center' },
  colType:   { width: '9%',  textAlign: 'center' },
  colRate:   { width: '12%', textAlign: 'right' },
  colTotal:  { width: '13%', textAlign: 'right' },
  colRemark: { width: '16%', paddingLeft: 3 },

  // Totals
  totalInteriorRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF0EC', borderRadius: 2, padding: '6 10', marginHorizontal: 16, marginTop: 8 },
  totalInteriorLabel: { fontSize: 8.5, fontWeight: 'bold', color: C.dark },
  totalInteriorValue: { fontSize: 8.5, fontWeight: 'bold', color: C.brand },

  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: '5 10', backgroundColor: C.lightGray, borderBottomWidth: 0.5, borderBottomColor: C.border },
  subtotalLabel: { fontSize: 7.5, color: C.gray },
  subtotalValue: { fontSize: 7.5, color: C.dark, fontWeight: 'bold' },

  gstRow: { flexDirection: 'row', justifyContent: 'space-between', padding: '5 10', backgroundColor: '#FFF0EC', borderBottomWidth: 0.5, borderBottomColor: C.border },
  gstLabel: { fontSize: 7.5, color: C.brandDark, fontWeight: 'bold' },
  gstValue: { fontSize: 7.5, color: C.brandDark, fontWeight: 'bold' },

  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: C.dark, padding: '8 10' },
  grandLabel: { fontSize: 10, color: C.brand, fontWeight: 'bold', letterSpacing: 0.5 },
  grandValue: { fontSize: 12, color: C.brand, fontWeight: 'bold' },

  // Notes
  notesSection: { margin: '10 16 0 16', padding: '8 10', backgroundColor: C.lightGray, borderWidth: 0.5, borderColor: C.border, borderRadius: 2 },
  notesTitle: { fontSize: 7.5, fontWeight: 'bold', marginBottom: 3, color: C.dark },
  noteText: { fontSize: 6, color: C.gray, marginBottom: 1.5, lineHeight: 1.4 },

  // Signatures
  signSection: { flexDirection: 'row', justifyContent: 'space-between', margin: '14 16 0 16', paddingTop: 8, borderTopWidth: 0.5, borderTopColor: C.border },
  signBlock: { alignItems: 'center', minWidth: 100 },
  signLine: { width: 100, height: 0.5, backgroundColor: C.dark, marginBottom: 3 },
  signName: { fontSize: 7.5, fontWeight: 'bold', color: C.dark },
  signLabel: { fontSize: 6.5, color: C.gray },

  // Footer
  footerLine: { position: 'absolute', bottom: 28, left: 16, right: 16, height: 0.5, backgroundColor: C.border },
  pageNum: { position: 'absolute', bottom: 14, right: 24, fontSize: 6.5, color: '#AAAAAA' },

  // TC page
  tcPage: { fontSize: 8, color: C.dark, backgroundColor: C.white, padding: '32 36 40 36' },
  tcTitle: { fontSize: 12, fontWeight: 'bold', color: C.dark, marginBottom: 12, letterSpacing: 0.5 },
  tcBox: { backgroundColor: '#FFF0EC', borderWidth: 1, borderColor: '#FDE8E2', borderRadius: 3, padding: '10 14', marginBottom: 8 },
  tcItem: { fontSize: 8.5, color: '#333', lineHeight: 1.6, marginBottom: 3 },
  tcBullet: { width: 10, color: C.brand, fontWeight: 'bold' },

  payTitle: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1, marginBottom: 10 },
  payTh: { fontSize: 6.5, color: C.white, fontWeight: 'bold', letterSpacing: 0.3, padding: '4 5' },
  payTd: { fontSize: 7, color: C.dark, padding: '8 5', borderBottomWidth: 0.5, borderBottomColor: C.border },
});

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;
const dateStr = (d) => new Date(d || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

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

const DEFAULT_TC_ITEMS = [
  'Payment Terms: Invoice must be paid within 25 days from the issue date.',
  'Delivery Estimate: Orders will be delivered within 45–60 business days after confirmation.',
  'Warranty: Hardware includes a standard one year warranty.',
  'Cost is inclusive of all channels, Hinges and Handles.',
  'Shipping Policy: Shipping fees may vary based on destination.',
  'The payment received corresponds to the specific items or milestones listed in this quotation.',
  'Any changes to the design or materials requested after payment will incur additional costs.',
];

// PAY_STAGES is now per-quotation — resolved inside component

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

// ── Universal table section (rooms + new sections) ────────────
function ItemTableSection({ label, items, sno, isAccessory }) {
  if (!items || items.length === 0) return null;
  const total = isAccessory
    ? items.reduce((s, it) => s + (it.nos * it.unitCost), 0)
    : items.reduce((s, it) => s + calcTotal(it), 0);

  return (
    <View wrap={false}>
      <View style={s.sectionRow}>
        <Text style={s.sectionLabel}>{sno ? `${sno}   ` : ''}{label.toUpperCase()}</Text>
        <Text style={s.sectionTotal}>{fmt(total)}</Text>
      </View>
      <View style={s.tableWrap}>
        <View style={s.tableHeader}>
          {isAccessory ? (
            <>
              <Text style={[s.th, { width: '38%' }]}>ITEM</Text>
              <Text style={[s.th, { width: '12%', textAlign: 'center' }]}>QTY</Text>
              <Text style={[s.th, { width: '20%', textAlign: 'right' }]}>UNIT COST (Rs.)</Text>
              <Text style={[s.th, { width: '14%', textAlign: 'right' }]}>TOTAL (Rs.)</Text>
              <Text style={[s.th, { width: '16%', paddingLeft: 4 }]}>REMARKS</Text>
            </>
          ) : (
            <>
              <Text style={[s.th, s.colName]}>PARTICULARS</Text>
              <Text style={[s.th, s.colW]}>W(in)</Text>
              <Text style={[s.th, s.colH]}>H(in)</Text>
              <Text style={[s.th, s.colNos]}>NOS</Text>
              <Text style={[s.th, s.colArea]}>AREA sft</Text>
              <Text style={[s.th, s.colType]}>TYPE</Text>
              <Text style={[s.th, s.colRate]}>RATE(Rs.)</Text>
              <Text style={[s.th, s.colTotal]}>TOTAL(Rs.)</Text>
              <Text style={[s.th, s.colRemark]}>REMARKS</Text>
            </>
          )}
        </View>
        {items.map((item, idx) => (
          <View key={idx} style={[s.tableRow, idx % 2 === 1 && s.tableRowAlt]}>
            {isAccessory ? (
              <>
                <Text style={[s.td, { width: '38%' }]}>{item.name}</Text>
                <Text style={[s.td, { width: '12%', textAlign: 'center' }]}>{item.nos}</Text>
                <Text style={[s.td, { width: '20%', textAlign: 'right' }]}>{(item.unitCost || 0).toLocaleString('en-IN')}</Text>
                <Text style={[s.tdBrand, { width: '14%', textAlign: 'right' }]}>{(item.nos * item.unitCost).toLocaleString('en-IN')}</Text>
                <Text style={[s.td, { width: '16%', paddingLeft: 3 }]}>{item.remarks}</Text>
              </>
            ) : (
              <>
                <Text style={[s.td, s.colName]}>{item.name}</Text>
                <Text style={[s.td, s.colW]}>{item.type !== 'FIXED' ? item.width : ''}</Text>
                <Text style={[s.td, s.colH]}>{item.type !== 'FIXED' ? item.height : ''}</Text>
                <Text style={[s.td, s.colNos]}>{item.nos}</Text>
                <Text style={[s.td, s.colArea]}>{calcArea(item) || '—'}</Text>
                <Text style={[s.td, s.colType]}>{item.type}</Text>
                <Text style={[s.td, s.colRate]}>{(item.unitCost || 0).toLocaleString('en-IN')}</Text>
                <Text style={[s.tdBrand, s.colTotal]}>{calcTotal(item).toLocaleString('en-IN')}</Text>
                <Text style={[s.td, s.colRemark]}>{item.remarks || ''}</Text>
              </>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Header shared across pages ────────────────────────────────
function PageHeader({ invoiceDate, smPhone, showQuotationLabel, quotationId }) {
  return (
    <>
      <View style={s.header}>
        <Image style={s.logo} src={LOGO_URL} />
        <View style={{ alignItems: 'flex-end' }}>
          {showQuotationLabel && <Text style={s.invoiceLabel}>QUOTATION #{quotationId}</Text>}
          <Text style={[s.headerMeta, { marginTop: showQuotationLabel ? 4 : 0 }]}>Date: {invoiceDate}</Text>
          {smPhone ? <Text style={s.headerMeta}>Mobile: {smPhone}</Text> : <Text style={s.headerMeta}>Mobile: 9000700930 / 910</Text>}
          <Text style={s.headerMeta}>Interior work Estimation</Text>
        </View>
      </View>
      <View style={s.brandLine} />
    </>
  );
}

export function QuotationPDF({ data }) {
  const rooms = data.rooms || {};
  const rawCd = data.ceiling_data || {};
  const isNewFormat = rawCd.ceiling || rawCd.electrical || rawCd.wooden || rawCd.marble || rawCd.general;
  const sections = isNewFormat ? rawCd : null;

  // Legacy ceiling fallback
  const cd = !isNewFormat ? rawCd : {};
  const plainTotal = (cd.plainArea || 0) * (cd.plainRate || 0);
  const stripTotal = (cd.stripLength || 0) * (cd.stripRate || 0);

  const totalInterior = Number(data.total_interior || 0);
  const totalCeiling  = Number(data.total_ceiling  || 0);
  const subtotal      = totalInterior + totalCeiling;
  const gstPercent    = Number(data.gst_percent || 0);
  const gstAmount     = Number(data.gst_amount  || 0);
  const grandTotal    = Number(data.grand_total  || 0);

  let tcItems = data.tc_items;
  if (typeof tcItems === 'string' && tcItems) { try { tcItems = JSON.parse(tcItems); } catch { tcItems = null; } }
  if (!Array.isArray(tcItems) || !tcItems.length) tcItems = DEFAULT_TC_ITEMS;

  let NOTES = data.note_items;
  if (typeof NOTES === 'string' && NOTES) { try { NOTES = JSON.parse(NOTES); } catch { NOTES = null; } }
  if (!Array.isArray(NOTES) || !NOTES.length) NOTES = DEFAULT_NOTES;
  let rawPayStages = data.pay_stages;
  if (typeof rawPayStages === 'string' && rawPayStages) { try { rawPayStages = JSON.parse(rawPayStages); } catch { rawPayStages = null; } }
  if (!Array.isArray(rawPayStages) || !rawPayStages.length) rawPayStages = ['Booking Advance','After Design','Material Purchase time','Carcas Installation','Doors Fitting','Handles Fitting','Finishing and Hand Over',''];
  const payStages = rawPayStages.map(r => typeof r === 'string' ? {stage:r,amount:'',notes:''} : {stage:r.stage||'',amount:r.amount||'',notes:r.notes||''});
  const smName  = data.site_manager_name        || '';
  const smDesig = data.site_manager_designation || 'Site Manager';
  const smPhone = data.site_manager_phone       || '';
  const invoiceDate = dateStr(data.created_at);
  const quotationId = data.quotation_id || data.id || '';
  const validDate   = dateStr(new Date(new Date(data.created_at || Date.now()).getTime() + 30*24*60*60*1000));

  const roomEntries = Object.entries(rooms);

  return (
    <Document>
      {/* ══════════════════════════════════════════════
          PAGE 1 — QUOTATION
         ══════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <PageHeader invoiceDate={invoiceDate} smPhone={smPhone} showQuotationLabel quotationId={quotationId} />

        {/* Client left | Site Manager right */}
        <View style={s.infoSection}>
          {/* LEFT — Client Info */}
          <View style={s.infoCol}>
            <Text style={[s.infoLabel, { marginBottom: 5 }]}>Client Information</Text>
            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={[s.infoLabel, { width: 55 }]}>Name</Text>
              <Text style={s.infoValue}>{data.customer_name}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={[s.infoLabel, { width: 55 }]}>Phone</Text>
              <Text style={s.infoValue}>{data.customer_phone || data.mobile || '—'}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={[s.infoLabel, { width: 55 }]}>Location</Text>
              <Text style={s.infoValue}>{data.location || '—'}</Text>
            </View>
          </View>

          <View style={s.infoDivider} />

          {/* RIGHT — Site Manager Info */}
          <View style={s.infoCol}>
            <Text style={[s.infoLabel, { marginBottom: 5 }]}>Site Manager Information</Text>
            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={[s.infoLabel, { width: 65 }]}>Name</Text>
              <Text style={s.infoValue}>{smName || '—'}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={[s.infoLabel, { width: 65 }]}>Designation</Text>
              <Text style={s.infoValue}>{smDesig}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={[s.infoLabel, { width: 65 }]}>Phone</Text>
              <Text style={s.infoValue}>{smPhone || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Interior Rooms */}
        {roomEntries.map(([key, room], i) =>
          room ? (
            <ItemTableSection
              key={key}
              label={room.label || key}
              items={room.items}
              sno={i + 1}
              isAccessory={key === 'accessories'}
            />
          ) : null
        )}

        {/* Interior subtotal banner */}
        <View style={s.totalInteriorRow}>
          <Text style={s.totalInteriorLabel}>Total 1 — Interior Work</Text>
          <Text style={s.totalInteriorValue}>{fmt(totalInterior)}</Text>
        </View>

        {/* ── NEW SECTIONS or legacy ceiling ── */}
        {isNewFormat ? (
          Object.entries(sections).map(([secKey, secData]) => {
            const meta = SECTION_META[secKey];
            if (!secData || !secData.items || secData.items.length === 0) return null;
            return (
              <ItemTableSection
                key={secKey}
                label={meta ? meta.label : secKey}
                items={secData.items}
                sno={null}
                isAccessory={false}
              />
            );
          })
        ) : (
          /* Legacy ceiling */
          <>
            <View style={[s.sectionRow, { marginTop: 10 }]}>
              <Text style={s.sectionLabel}>Ceiling work Estimation</Text>
              <Text style={s.sectionTotal}>{fmt(totalCeiling)}</Text>
            </View>
            <View style={s.tableWrap}>
              <View style={s.tableHeader}>
                <Text style={[s.th, { flex: 2 }]}>PARTICULARS</Text>
                <Text style={[s.th, { width: '12%', textAlign: 'center' }]}>QTY/AREA</Text>
                <Text style={[s.th, { width: '12%', textAlign: 'center' }]}>RATE</Text>
                <Text style={[s.th, { width: '16%', textAlign: 'right' }]}>AMOUNT (Rs.)</Text>
                <Text style={[s.th, { width: '20%', paddingLeft: 4 }]}>REMARKS</Text>
              </View>
              <View style={s.tableRow}>
                <Text style={[s.td, { flex: 2 }]}>Plain Area</Text>
                <Text style={[s.td, { width: '12%', textAlign: 'center' }]}>{cd.plainArea} sft</Text>
                <Text style={[s.td, { width: '12%', textAlign: 'center' }]}>{cd.plainRate}</Text>
                <Text style={[s.tdBrand, { width: '16%', textAlign: 'right' }]}>{plainTotal.toLocaleString('en-IN')}</Text>
                <Text style={[s.td, { width: '20%', paddingLeft: 4 }]}>Incl. 2 cot Putti & Painting</Text>
              </View>
              <View style={[s.tableRow, s.tableRowAlt]}>
                <Text style={[s.td, { flex: 2 }]}>Strip Light Cutting</Text>
                <Text style={[s.td, { width: '12%', textAlign: 'center' }]}>{cd.stripLength} ft</Text>
                <Text style={[s.td, { width: '12%', textAlign: 'center' }]}>{cd.stripRate}</Text>
                <Text style={[s.tdBrand, { width: '16%', textAlign: 'right' }]}>{stripTotal.toLocaleString('en-IN')}</Text>
                <Text style={[s.td, { width: '20%', paddingLeft: 4 }]}></Text>
              </View>
              <View style={s.tableRow}>
                <Text style={[s.td, { flex: 2 }]}>Electrical Labour Charges</Text>
                <Text style={[s.td, { width: '12%', textAlign: 'center' }]}>—</Text>
                <Text style={[s.td, { width: '12%', textAlign: 'center' }]}>—</Text>
                <Text style={[s.tdBrand, { width: '16%', textAlign: 'right' }]}>{(cd.electricalLabour || 0).toLocaleString('en-IN')}</Text>
                <Text style={[s.td, { width: '20%', paddingLeft: 4 }]}></Text>
              </View>
            </View>
          </>
        )}

        {/* Subtotal / GST / Grand Total */}
        <View style={[s.tableWrap, { marginTop: 10, borderWidth: 0.5, borderColor: C.border, borderRadius: 2 }]}>
          <View style={s.subtotalRow}>
            <Text style={s.subtotalLabel}>Subtotal</Text>
            <Text style={s.subtotalValue}>{fmt(subtotal)}</Text>
          </View>
          {gstPercent > 0 && (
            <View style={s.gstRow}>
              <Text style={s.gstLabel}>GST ({gstPercent}%)</Text>
              <Text style={s.gstValue}>+ {fmt(gstAmount)}</Text>
            </View>
          )}
          <View style={s.grandTotalRow}>
            <Text style={s.grandLabel}>GRAND TOTAL{gstPercent > 0 ? ` (incl. ${gstPercent}% GST)` : ''}</Text>
            <Text style={s.grandValue}>{fmt(grandTotal)}</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={s.notesSection}>
          <Text style={s.notesTitle}>NOTE:</Text>
          {NOTES.map((n, i) => <Text key={i} style={s.noteText}>{i + 1}.  {n}</Text>)}
        </View>

        {/* Signatures */}
        <View style={s.signSection}>
          <View style={s.signBlock}>
            <View style={{ height: 28 }} />
            <View style={s.signLine} />
            <Text style={s.signName}>{data.customer_name}</Text>
            <Text style={s.signLabel}>CUSTOMER SIGN</Text>
          </View>
          <View style={s.signBlock}>
            <View style={{ height: 28 }} />
            <View style={s.signLine} />
            <Text style={s.signName}>{smName || 'Site Manager'}</Text>
            <Text style={s.signLabel}>{smDesig.toUpperCase()}</Text>
          </View>
        </View>

        <View style={s.footerLine} />
        <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* ══════════════════════════════════════════════
          PAGE 2 — TERMS & CONDITIONS
         ══════════════════════════════════════════════ */}
      <Page size="A4" style={s.tcPage}>
        <PageHeader invoiceDate={invoiceDate} smPhone={smPhone} showQuotationLabel={false} />
        <View style={{ padding: '20 0 0 0' }}>
          <Text style={s.tcTitle}>TERMS AND CONDITIONS</Text>
          <View style={s.tcBox}>
            {tcItems.map((t, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={s.tcBullet}>•  </Text>
                <Text style={s.tcItem}>{t}</Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={s.tcBullet}>•  </Text>
              <Text style={s.tcItem}>Quotation Validity: This quotation remains valid until {validDate}.</Text>
            </View>
          </View>
          <View style={[s.signSection, { marginTop: 36 }]}>
            <View style={s.signBlock}>
              <Text style={[s.signLabel, { marginBottom: 28 }]}>Prepared By</Text>
              <View style={s.signLine} />
              <Text style={s.signName}>{smName || 'Site Manager'}</Text>
              <Text style={s.signLabel}>{smDesig}</Text>
            </View>
            <View style={s.signBlock}>
              <Text style={[s.signLabel, { marginBottom: 28 }]}>Customer Sign</Text>
              <View style={s.signLine} />
              <Text style={s.signName}>{data.customer_name}</Text>
              <Text style={s.signLabel}>Customer</Text>
            </View>
          </View>
        </View>
        <View style={s.footerLine} />
        <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* ══════════════════════════════════════════════
          PAGE 3 — PAYMENT SCHEDULE
         ══════════════════════════════════════════════ */}
      <Page size="A4" style={s.tcPage}>
        <PageHeader invoiceDate={invoiceDate} smPhone={smPhone} showQuotationLabel={false} />
        <View style={{ padding: '20 0 0 0' }}>
          <Text style={s.payTitle}>STAGE WISE PAYMENT SCHEDULE</Text>
          <View style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 2 }}>
            <View style={s.tableHeader}>
              {['Payment Stages','Payment Amt','Payment Date','Paid Amt','Paid Date','Payment Type','Payment Details','Received By'].map(h => (
                <Text key={h} style={[s.payTh, { flex: 1 }]}>{h}</Text>
              ))}
            </View>
            {payStages.map((row, i) => (
              <View key={i} style={[{ flexDirection: 'row', backgroundColor: i % 2 === 1 ? C.rowAlt : C.white }]}>
                <Text style={[s.payTd, { flex: 1.2, fontWeight: row.stage ? 'bold' : 'normal' }]}>{row.stage||''}</Text>
                <Text style={[s.payTd, { flex: 1, color: row.amount ? C.brand : '#AAA', fontWeight: row.amount ? 'bold' : 'normal' }]}>{row.amount ? `Rs. ${Number(row.amount).toLocaleString('en-IN')}` : ''}</Text>
                <Text style={[s.payTd, { flex: 1 }]}> </Text>
                <Text style={[s.payTd, { flex: 1 }]}> </Text>
                <Text style={[s.payTd, { flex: 1 }]}> </Text>
                <Text style={[s.payTd, { flex: 1 }]}> </Text>
                <Text style={[s.payTd, { flex: 1.5 }]}>{row.notes||''}</Text>
                <Text style={[s.payTd, { flex: 1 }]}> </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.footerLine} />
        <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* ══════════════════════════════════════════════
          PAGE 4 — PAYMENT T&C
         ══════════════════════════════════════════════ */}
      <Page size="A4" style={s.tcPage}>
        <PageHeader invoiceDate={invoiceDate} smPhone={smPhone} showQuotationLabel={false} />
        <View style={{ padding: '20 0 0 0' }}>
          <Text style={s.tcTitle}>Stage Wise Payment — Terms & Conditions</Text>
          {PAY_TC.map(([bold, rest], i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Text style={s.tcBullet}>•  </Text>
              <Text style={s.tcItem}><Text style={{ fontWeight: 'bold', color: C.dark }}>{bold} </Text>{rest}</Text>
            </View>
          ))}
          <View style={[s.signSection, { marginTop: 36 }]}>
            <View style={s.signBlock}>
              <Text style={[s.signLabel, { marginBottom: 28 }]}>Prepared By</Text>
              <View style={s.signLine} />
              <Text style={s.signName}>{smName || 'Site Manager'}</Text>
              <Text style={s.signLabel}>{smDesig}</Text>
            </View>
            <View style={s.signBlock}>
              <Text style={[s.signLabel, { marginBottom: 28 }]}>Customer Sign</Text>
              <View style={s.signLine} />
              <Text style={s.signName}>{data.customer_name}</Text>
              <Text style={s.signLabel}>Customer</Text>
            </View>
          </View>
        </View>
        <View style={s.footerLine} />
        <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
