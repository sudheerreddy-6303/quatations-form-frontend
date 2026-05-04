import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { DEFAULT_ROOMS, calcArea, calcTotal, calcRoomTotal } from '../utils/roomData';
import './QuotationForm.css';


const DEFAULT_TC = [
  'Payment Terms: Invoice must be paid within 25 days from the issue date.',
  'Delivery Estimate: Orders will be delivered within 45–60 business days after confirmation.',
  'Warranty: Hardware includes a standard one year warranty.',
  'Cost is inclusive of all channels, Hinges and Handles.',
  'Shipping Policy: Shipping fees may vary based on destination.',
  'The payment received corresponds to the specific items or milestones listed in this quotation.',
  'Any changes to the design or materials requested after payment will incur additional costs.',
];

const DEFAULT_PAY_STAGES = [
  { stage: 'Booking Advance',          paymentAmount: '', paymentDate: '', paidAmount: '', paidDate: '', paymentType: '', paymentDetails: '', receivedBy: '' },
  { stage: 'After Design',             paymentAmount: '', paymentDate: '', paidAmount: '', paidDate: '', paymentType: '', paymentDetails: '', receivedBy: '' },
  { stage: 'Material Purchase time',   paymentAmount: '', paymentDate: '', paidAmount: '', paidDate: '', paymentType: '', paymentDetails: '', receivedBy: '' },
  { stage: 'Carcas Installation',      paymentAmount: '', paymentDate: '', paidAmount: '', paidDate: '', paymentType: '', paymentDetails: '', receivedBy: '' },
  { stage: 'Doors Fitting',            paymentAmount: '', paymentDate: '', paidAmount: '', paidDate: '', paymentType: '', paymentDetails: '', receivedBy: '' },
  { stage: 'Handles Fitting',          paymentAmount: '', paymentDate: '', paidAmount: '', paidDate: '', paymentType: '', paymentDetails: '', receivedBy: '' },
  { stage: 'Finishing and Hand Over',  paymentAmount: '', paymentDate: '', paidAmount: '', paidDate: '', paymentType: '', paymentDetails: '', receivedBy: '' },
];

const SECTION_ICONS = {
  electrical: '⚡', wooden: '🪵', marble: '🪨', general: '📦'
};
const SECTION_COLORS = {
  electrical: '#F59E0B', wooden: '#92400E', marble: '#64748B', general: '#14B8A6'
};

const ROOM_ICONS = {
  mbr: '🛏', cbr: '🛏', hall: '🛋', dining: '🍽', kitchen: '🍳', accessories: '🔧'
};

const ROOM_COLORS = ['#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444','#C9A84C','#EC4899','#06B6D4','#84CC16','#F97316'];

const newTableRow = () => ({ name: '', width: 0, height: 0, nos: 1, type: 'FIXED', unitCost: 0, remarks: '' });

const INITIAL_SECTIONS = {
  electrical: {
    label: 'Electrical Accessories', badge: '⚡ Electrical', badgeClass: 'electrical-badge', sectionNum: '05',
    items: [{ name: 'Switch Board', width: 0, height: 0, nos: 1, type: 'FIXED', unitCost: 0, remarks: '' }]
  },
  wooden: {
    label: 'Wooden Accessories', badge: '🪵 Wooden', badgeClass: 'wooden-badge', sectionNum: '06',
    items: [{ name: 'Wooden Panel', width: 0, height: 0, nos: 1, type: 'FIXED', unitCost: 0, remarks: '' }]
  },
  marble: {
    label: 'Marble & Plumbing', badge: '🪨 Marble', badgeClass: 'marble-badge', sectionNum: '07',
    items: [{ name: 'Marble Flooring', width: 0, height: 0, nos: 1, type: 'FIXED', unitCost: 0, remarks: '' }]
  },
  general: {
    label: 'General', badge: '📦 General', badgeClass: 'general-badge', sectionNum: '08',
    items: [{ name: 'Miscellaneous', width: 0, height: 0, nos: 1, type: 'FIXED', unitCost: 0, remarks: '' }]
  }
};

// Convert File to base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result); // includes data:...;base64, prefix
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// Allow decimal typing: store raw string, parse only on blur
function NumInput({ value, onChange, className }) {
  const [raw, setRaw] = React.useState(String(value ?? ''));
  React.useEffect(() => {
    // Only sync from outside if not currently focused
    setRaw(v => {
      const parsed = parseFloat(v);
      if (!isNaN(parsed) && parsed === value) return v; // keep user's text
      return value === 0 || value === '' ? '' : String(value);
    });
  }, [value]);
  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={raw}
      onChange={e => {
        const v = e.target.value;
        if (/^-?\d*\.?\d*$/.test(v)) { // only allow valid decimal chars
          setRaw(v);
          const n = parseFloat(v);
          if (!isNaN(n)) onChange(n);
          else if (v === '' || v === '-') onChange(0);
        }
      }}
      onBlur={e => {
        const n = parseFloat(e.target.value);
        const final = isNaN(n) ? 0 : n;
        setRaw(String(final));
        onChange(final);
      }}
    />
  );
}

function RoomItemTableWithRemove({ items, onUpdate, onRemove }) {
  return (
    <div className="item-table-wrap">
      <table className="item-table">
        <thead>
          <tr>
            <th>Particulars</th><th>W (in)</th><th>H (in)</th><th>Nos</th>
            <th>Area sft</th><th>Type</th><th>Rate (₹)</th><th>Total (₹)</th><th>Remarks</th><th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="item-row">
              <td><input className="cell-input" value={item.name} onChange={e => onUpdate(idx, 'name', e.target.value)} /></td>
              <td><NumInput className="cell-input num" value={item.width}    onChange={v => onUpdate(idx, 'width',    v)} /></td>
              <td><NumInput className="cell-input num" value={item.height}   onChange={v => onUpdate(idx, 'height',   v)} /></td>
              <td><NumInput className="cell-input num" value={item.nos}      onChange={v => onUpdate(idx, 'nos',      v)} /></td>
              <td className="calc-cell">{calcArea(item) || '—'}</td>
              <td>
                <select className="cell-select" value={item.type} onChange={e => onUpdate(idx, 'type', e.target.value)}>
                  {['BOX','FRAME','PANELLING','GLASS','Others'].map(t => <option key={t}>{t}</option>)}
                </select>
              </td>
              <td><NumInput className="cell-input num" value={item.unitCost} onChange={v => onUpdate(idx, 'unitCost', v)} /></td>
              <td className="total-cell">₹{calcTotal(item).toLocaleString('en-IN')}</td>
              <td><input className="cell-input" value={item.remarks} onChange={e => onUpdate(idx, 'remarks', e.target.value)} /></td>
              <td><button type="button" className="btn-remove" onClick={() => onRemove(idx)}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionTable({ items, onUpdate, onRemove }) {
  return (
    <div className="item-table-wrap">
      <table className="item-table">
        <thead>
          <tr>
            <th>Particulars</th><th>W (in)</th><th>H (in)</th><th>Nos</th>
            <th>Area sft</th><th>Type</th><th>Rate (₹)</th><th>Total (₹)</th><th>Remarks</th><th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="item-row">
              <td><input className="cell-input" value={item.name} onChange={e => onUpdate(idx, 'name', e.target.value)} /></td>
              <td><NumInput className="cell-input num" value={item.width}    onChange={v => onUpdate(idx, 'width',    v)} /></td>
              <td><NumInput className="cell-input num" value={item.height}   onChange={v => onUpdate(idx, 'height',   v)} /></td>
              <td><NumInput className="cell-input num" value={item.nos}      onChange={v => onUpdate(idx, 'nos',      v)} /></td>
              <td className="calc-cell">{calcArea(item) || '—'}</td>
              <td>
                <select className="cell-select" value={item.type} onChange={e => onUpdate(idx, 'type', e.target.value)}>
                  {['BOX','FRAME','PANELLING','GLASS','FIXED'].map(t => <option key={t}>{t}</option>)}
                </select>
              </td>
              <td><NumInput className="cell-input num" value={item.unitCost} onChange={v => onUpdate(idx, 'unitCost', v)} /></td>
              <td className="total-cell">₹{calcTotal(item).toLocaleString('en-IN')}</td>
              <td><input className="cell-input" value={item.remarks} onChange={e => onUpdate(idx, 'remarks', e.target.value)} /></td>
              <td><button type="button" className="btn-remove" onClick={() => onRemove(idx)}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


const LOGO_URL_PAY = 'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';

const PAYMENT_TC = [
  ['Booking Advance:', 'A non-refundable commitment fee required to initiate the project and secure the design slot.'],
  ['Post-Design Payment:', 'Due immediately upon final approval of 2D/3D designs. Procurement of materials will only begin once this stage is cleared.'],
  ['Material Procurement:', 'This payment covers the cost of raw materials and hardware. Orders with vendors will be placed only after the funds are credited.'],
  ['Carcass Installation:', 'Due upon completion of the basic structure at the site. Finishing works (shutters, laminates, handles) will commence only after this payment.'],
  ['Work Suspension:', 'Work will be automatically suspended if a stage payment is delayed by more than 3 business days. The 45-day delivery commitment will be extended by the total number of days the payment was delayed.'],
  ['Material Price Escalation:', 'If a payment for "Material Purchase" is deferred by more than 15 days, any increase in the market price of raw materials (plywood, laminates, hardware) will be billed as an additional cost to the client.'],
  ['Storage Charges:', 'If the "Carcass Installation" or "Final Handover" payment is deferred and the finished goods must be held in the warehouse, a storage fee of 1% of the invoice value per week will apply.'],
  ['Rescheduling Fee:', 'Restarting a project after a payment delay of more than 30 days may incur a "Rescheduling Fee" to re-mobilize labor and installers who were moved to other active sites.'],
  ['Quotation Validity:', 'Prices are locked until the date specified; however, the delivery timeline is contingent on timely site access and payments.'],
  ['Warranty:', 'The 6-month hardware warranty is valid only if the project has been paid for in full. It does not cover damage due to water leakage or structural moisture at the site.'],
  ['Shipping & Handling:', 'Delivery estimates are based on standard site conditions. Any special requirements (e.g., manual lifting to high floors without elevator access) will incur extra charges.'],
];

const PAY_COLS = [
  { key: 'paymentAmount',  label: 'Payment\nAmnt',    type: 'number', flex: 1   },
  { key: 'paymentDate',    label: 'Payment\nDate',    type: 'date',   flex: 1.1 },
  { key: 'paidAmount',     label: 'Paid\nAmnt',       type: 'number', flex: 1   },
  { key: 'paidDate',       label: 'Paid\nDate',       type: 'date',   flex: 1.1 },
  { key: 'paymentType',    label: 'Payment\nType',    type: 'text',   flex: 1   },
  { key: 'paymentDetails', label: 'Payment\nDetails', type: 'text',   flex: 1.5 },
  { key: 'receivedBy',     label: 'Received\nBy',     type: 'text',   flex: 1   },
];

/* px widths for each col (stage col fixed 140px, rest share remaining) */
const STAGE_W   = 150;
const COL_WIDTHS = { paymentAmount:90, paymentDate:88, paidAmount:78, paidDate:88, paymentType:82, paymentDetails:110, receivedBy:82 };
const TOTAL_W    = STAGE_W + Object.values(COL_WIDTHS).reduce((a,b)=>a+b,0) + 28; // 28 for remove col

const C_PDF = { brand:'#E8471C', dark:'#1A1A1A', gray:'#666', border:'#DDDDDD', white:'#fff', rowAlt:'#FAFAFA', lightBg:'#F5F5F5' };

const cellBase = { border:'none', background:'transparent', fontFamily:'Arial,sans-serif', fontSize:11, color:C_PDF.dark, outline:'none', padding:'6px 6px', width:'100%', boxSizing:'border-box' };

function PaymentModal({ payStages, setPayStages, onClose, clientName, smName }) {
  const overlayRef = React.useRef(null);

  const update = (idx, key, val) =>
    setPayStages(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r));

  const addRow = () =>
    setPayStages(prev => [...prev, { stage:'', paymentAmount:'', paymentDate:'', paidAmount:'', paidDate:'', paymentType:'', paymentDetails:'', receivedBy:'' }]);

  const removeRow = (idx) =>
    setPayStages(prev => prev.filter((_, i) => i !== idx));

  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

  return (
    <div
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9999, display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'24px 12px' }}
    >
      <div style={{ background:C_PDF.white, borderRadius:4, width:'100%', maxWidth: TOTAL_W + 80, boxShadow:'0 20px 60px rgba(0,0,0,0.4)', fontFamily:'Arial,sans-serif', overflow:'hidden' }}>

        {/* ── PDF PAGE HEADER — exactly like PDF ── */}
        <div style={{ padding:'14px 30px 10px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${C_PDF.border}`, background:C_PDF.white }}>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:C_PDF.brand, letterSpacing:2 }}>QUOTATION</div>
            <div style={{ fontSize:9, color:'#AAA', marginTop:2 }}>Date: {today}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <img src={LOGO_URL_PAY} alt="Deeraj Interiors" style={{ height:45, width:'auto' }} crossOrigin="anonymous" />
            <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:C_PDF.gray, padding:'2px 6px', lineHeight:1 }}>✕</button>
          </div>
        </div>
        {/* Brand line */}
        <div style={{ height:3, background:C_PDF.brand }} />

        <div style={{ padding:'20px 30px 0' }}>
          {/* Page title */}
          <div style={{ textAlign:'center', fontWeight:700, fontSize:13, letterSpacing:1, marginBottom:14, color:C_PDF.dark }}>STAGE WISE PAYMENT SCHEDULE</div>

          {/* Table */}
          <div style={{ overflowX:'auto', marginBottom:20 }}>
            <table style={{ borderCollapse:'collapse', width:'100%', minWidth: TOTAL_W, fontSize:11 }}>
              <colgroup>
                <col style={{ width: STAGE_W }} />
                {PAY_COLS.map(c => <col key={c.key} style={{ width: COL_WIDTHS[c.key] }} />)}
                <col style={{ width:28 }} />
              </colgroup>
              {/* Dark header — same as PDF */}
              <thead>
                <tr style={{ background: C_PDF.dark }}>
                  <th style={{ padding:'6px 8px', textAlign:'left', color:C_PDF.white, fontWeight:700, fontSize:10, letterSpacing:0.3, borderRight:`1px solid #333` }}>Payment Stages</th>
                  {PAY_COLS.map(c => (
                    <th key={c.key} style={{ padding:'6px 6px', textAlign:'center', color:C_PDF.white, fontWeight:700, fontSize:10, letterSpacing:0.3, borderRight:`1px solid #333`, whiteSpace:'pre-line' }}>{c.label}</th>
                  ))}
                  <th style={{ background:C_PDF.dark }} />
                </tr>
              </thead>
              <tbody>
                {payStages.map((row, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 1 ? C_PDF.rowAlt : C_PDF.white }}>
                    {/* Stage name cell */}
                    <td style={{ borderBottom:`0.5px solid ${C_PDF.border}`, borderRight:`0.5px solid ${C_PDF.border}`, padding:'2px 2px' }}>
                      <input
                        value={row.stage}
                        onChange={e => update(idx, 'stage', e.target.value)}
                        style={{ ...cellBase, fontWeight:700 }}
                        placeholder="Stage name"
                      />
                    </td>
                    {PAY_COLS.map(c => (
                      <td key={c.key} style={{ borderBottom:`0.5px solid ${C_PDF.border}`, borderRight:`0.5px solid ${C_PDF.border}`, padding:'2px 2px' }}>
                        <input
                          type={c.type === 'number' ? 'text' : c.type}
                          inputMode={c.type === 'number' ? 'numeric' : undefined}
                          value={row[c.key]}
                          onChange={e => update(idx, c.key, e.target.value)}
                          style={{
                            ...cellBase,
                            color: c.type === 'number' && row[c.key] ? C_PDF.brand : C_PDF.dark,
                            fontWeight: c.type === 'number' && row[c.key] ? 700 : 400,
                            textAlign: c.type === 'number' ? 'right' : 'left',
                          }}
                          placeholder={c.type === 'date' ? 'dd/mm/yyyy' : c.type === 'number' ? '' : ''}
                        />
                      </td>
                    ))}
                    <td style={{ borderBottom:`0.5px solid ${C_PDF.border}`, textAlign:'center', padding:'2px' }}>
                      <button type="button" onClick={() => removeRow(idx)}
                        style={{ background:'none', border:'none', color:'#CCC', cursor:'pointer', fontSize:13, padding:'4px', lineHeight:1 }}
                        onMouseEnter={e => e.currentTarget.style.color='#E05A5A'}
                        onMouseLeave={e => e.currentTarget.style.color='#CCC'}>✕</button>
                    </td>
                  </tr>
                ))}
                {/* Empty add-row */}
                <tr>
                  <td colSpan={PAY_COLS.length + 2} style={{ borderTop:`0.5px solid ${C_PDF.border}`, padding:'8px 12px' }}>
                    <button type="button" onClick={addRow}
                      style={{ background:'none', border:`1.5px dashed ${C_PDF.border}`, borderRadius:4, padding:'4px 18px', fontSize:11, color:C_PDF.gray, cursor:'pointer', fontFamily:'Arial,sans-serif' }}>
                      + Add Row
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* T&C — exactly like PDF page 4 */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:12, color:C_PDF.dark, marginBottom:10, letterSpacing:0.3 }}>TERMS AND CONDITIONS</div>
            <div style={{ border:`1px solid ${C_PDF.border}`, borderRadius:2, padding:'12px 14px' }}>
              {PAYMENT_TC.map(([bold, rest], i) => (
                <div key={i} style={{ display:'flex', gap:6, marginBottom:6, lineHeight:1.65 }}>
                  <span style={{ color:C_PDF.brand, fontWeight:700, fontSize:11, flexShrink:0 }}>•</span>
                  <span style={{ fontSize:10, color:C_PDF.dark }}><strong>{bold}</strong> {rest}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures — same as PDF */}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'18px 0 24px', borderTop:`0.5px solid ${C_PDF.border}`, marginTop:8 }}>
            <div>
              <div style={{ fontSize:10, color:C_PDF.gray, marginBottom:28 }}>Prepared By</div>
              <div style={{ width:140, height:0.5, background:C_PDF.dark, marginBottom:4 }} />
              <div style={{ fontSize:11, fontWeight:700, color:C_PDF.dark }}>{smName || 'Site Manager'}</div>
              <div style={{ fontSize:9, color:C_PDF.gray }}>Site Manager</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:10, color:C_PDF.gray, marginBottom:28 }}>Customer Sign :</div>
              <div style={{ width:140, height:0.5, background:C_PDF.dark, marginBottom:4, marginLeft:'auto' }} />
              <div style={{ fontSize:11, fontWeight:700, color:C_PDF.dark }}>{clientName || 'Customer Name'}</div>
              <div style={{ fontSize:9, color:C_PDF.gray }}>Customer Name</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop:`1px solid ${C_PDF.border}`, padding:'14px 24px', display:'flex', justifyContent:'flex-end', gap:10, background:C_PDF.lightBg }}>
          <button type="button" onClick={onClose}
            style={{ padding:'9px 22px', border:`1.5px solid ${C_PDF.border}`, borderRadius:8, background:C_PDF.white, fontSize:13, fontWeight:600, color:C_PDF.gray, cursor:'pointer', fontFamily:'Arial,sans-serif' }}>
            Cancel
          </button>
          <button type="button" onClick={onClose}
            style={{ padding:'9px 22px', border:'none', borderRadius:8, background:C_PDF.brand, color:C_PDF.white, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Arial,sans-serif' }}>
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  );
}


export default function QuotationForm() {
  const navigate = useNavigate();
  const [projectType, setProjectType] = useState('');
  const [floorPlan, setFloorPlan] = useState(null);
  const [plan2D, setPlan2D] = useState(null);
  const [plan3D, setPlan3D] = useState(null);
  const floorPlanRef = useRef(null);
  const plan2DRef = useRef(null);
  const plan3DRef = useRef(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAltPhone, setClientAltPhone] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [villaNumber, setVillaNumber] = useState('');
  const [siteName, setSiteName] = useState('');
  const [location, setLocation] = useState('');
  const [smName, setSmName] = useState('');
  const [smPhone, setSmPhone] = useState('');
  const [smDesignation, setSmDesignation] = useState('');
  const [smBranch, setSmBranch] = useState('');
  const [tcItems, setTcItems] = useState([...DEFAULT_TC]);
  const [newTcText, setNewTcText] = useState('');
  const [payStages, setPayStages] = useState(DEFAULT_PAY_STAGES.map(s => ({ ...s })));
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeRoom, setActiveRoom] = useState('mbr');
  const [activeSection, setActiveSection] = useState(null); // null = rooms mode, else section key
  const [minimized, setMinimized] = useState({}); // track which room/section cards are collapsed
  const toggleMinimize = (key) => setMinimized(prev => ({ ...prev, [key]: !prev[key] }));
  const [rooms, setRooms] = useState(() => {
    const r = {};
    Object.entries(DEFAULT_ROOMS).forEach(([k, v]) => {
      r[k] = {
        ...v,
        items: v.items.map(i => ({ ...i, width: 0, height: 0, nos: 0, unitCost: 0, remarks: '' })),
        pdfFile: null,
        pdfName: '',
      };
    });
    return r;
  });
  const [sections, setSections] = useState(() => {
    const s = {};
    Object.entries(INITIAL_SECTIONS).forEach(([k, v]) => {
      s[k] = { ...v, items: v.items.map(i => ({ ...i, nos: 0, unitCost: 0 })) };
    });
    return s;
  });
  const [gstPercent,    setGstPercent]    = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const fileInputRefs = useRef({});

  const updateItem = (roomKey, idx, field, val) => {
    setRooms(prev => ({ ...prev, [roomKey]: { ...prev[roomKey], items: prev[roomKey].items.map((it, i) => i === idx ? { ...it, [field]: val } : it) } }));
  };
  const addItem = (roomKey) => {
    setRooms(prev => ({ ...prev, [roomKey]: { ...prev[roomKey], items: [...prev[roomKey].items, { name: 'New Item', width: 0, height: 0, nos: 1, type: 'BOX', unitCost: 1300, remarks: '' }] } }));
  };
  const removeItem = (roomKey, idx) => {
    setRooms(prev => ({ ...prev, [roomKey]: { ...prev[roomKey], items: prev[roomKey].items.filter((_, i) => i !== idx) } }));
  };
  const updateRoomLabel = (roomKey, newLabel) => {
    setRooms(prev => ({ ...prev, [roomKey]: { ...prev[roomKey], label: newLabel } }));
  };

  const updateSectionItem = (secKey, idx, field, val) => {
    setSections(prev => ({ ...prev, [secKey]: { ...prev[secKey], items: prev[secKey].items.map((it, i) => i === idx ? { ...it, [field]: val } : it) } }));
  };
  const addSectionItem = (secKey) => {
    setSections(prev => ({ ...prev, [secKey]: { ...prev[secKey], items: [...prev[secKey].items, newTableRow()] } }));
  };
  const removeSectionItem = (secKey, idx) => {
    setSections(prev => ({ ...prev, [secKey]: { ...prev[secKey], items: prev[secKey].items.filter((_, i) => i !== idx) } }));
  };

  const addNewSection = () => {
    const name = newSectionName.trim();
    if (!name) return;
    const key = 'custom_sec_' + Date.now();
    const color = ['#8B5CF6','#0EA5E9','#F97316','#10B981','#EC4899'][Object.keys(sections).length % 5];
    setSections(prev => ({
      ...prev,
      [key]: {
        label: name,
        badge: '📦 ' + name,
        badgeClass: 'general-badge',
        sectionNum: String(Object.keys(prev).length + 5),
        items: [{ name: 'Item', width: 0, height: 0, nos: 1, type: 'FIXED', unitCost: 0, remarks: '' }],
        isCustom: true,
        color,
      }
    }));
    SECTION_COLORS[key] = color;
    SECTION_ICONS[key] = '📦';
    setNewSectionName('');
    setShowAddSection(false);
  };

  const addNewRoom = () => {
    if (!newRoomName.trim()) { toast.error('Enter a room name'); return; }
    const key = `custom_${Date.now()}`;
    const colorIdx = Object.keys(rooms).length % ROOM_COLORS.length;
    setRooms(prev => ({
      ...prev,
      [key]: {
        label: newRoomName.trim(), color: ROOM_COLORS[colorIdx], isCustom: true,
        pdfFile: null, pdfName: '',
        items: [
          { name: 'New Item', width: 0, height: 0, nos: 0, type: 'BOX', unitCost: 0, remarks: '' },
        ]
      }
    }));
    setActiveRoom(key);
    setNewRoomName('');
    setShowAddRoom(false);
  };

  const deleteRoom = (roomKey) => {
    const keys = Object.keys(rooms).filter(k => k !== roomKey);
    setRooms(prev => { const updated = { ...prev }; delete updated[roomKey]; return updated; });
    setActiveRoom(keys[0] || 'mbr');
  };

  const handlePdfUpload = (roomKey, file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
    setRooms(prev => ({ ...prev, [roomKey]: { ...prev[roomKey], pdfFile: file, pdfName: file.name } }));
    toast.success(`PDF attached to ${rooms[roomKey].label}`);
  };

  // ── Auto-save draft to localStorage ──────────────────────────
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const autoSaveTimer = useRef(null);

  useEffect(() => {
    setAutoSaveStatus('unsaved');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try {
        const draft = {
          projectType, clientName, clientPhone, clientAltPhone, fullAddress,
          pincode, villaNumber, siteName, location,
          smName, smPhone, smDesignation, smBranch,
          rooms: Object.fromEntries(Object.entries(rooms).map(([k,v])=>{
            const {pdfFile,...rest}=v; return [k,rest];
          })),
          sections, gstPercent, tcItems, payStages,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem('deeraj_draft', JSON.stringify(draft));
        setAutoSaveStatus('saved');
      } catch {
        setAutoSaveStatus('unsaved');
      }
    }, 2000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [projectType, clientName, clientPhone, clientAltPhone, fullAddress,
      pincode, villaNumber, siteName, location, smName, smPhone, smDesignation, smBranch,
      rooms, sections, gstPercent, discountPercent, tcItems, payStages]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('deeraj_draft');
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.clientName) {
        if (d.projectType)    setProjectType(d.projectType);
        if (d.clientName)     setClientName(d.clientName);
        if (d.clientPhone)    setClientPhone(d.clientPhone);
        if (d.clientAltPhone) setClientAltPhone(d.clientAltPhone);
        if (d.fullAddress)    setFullAddress(d.fullAddress);
        if (d.pincode)        setPincode(d.pincode);
        if (d.villaNumber)    setVillaNumber(d.villaNumber);
        if (d.siteName)       setSiteName(d.siteName);
        if (d.location)       setLocation(d.location);
        if (d.smName)         setSmName(d.smName);
        if (d.smPhone)        setSmPhone(d.smPhone);
        if (d.smDesignation)  setSmDesignation(d.smDesignation);
        if (d.smBranch)       setSmBranch(d.smBranch);
        if (d.gstPercent)     setGstPercent(d.gstPercent);
        if (d.discountPercent) setDiscountPercent(d.discountPercent);
        if (d.tcItems?.length)setTcItems(d.tcItems);
        if (d.payStages?.length) setPayStages(d.payStages);
        if (d.rooms)  setRooms(prev => {
          const merged = {...prev};
          Object.entries(d.rooms).forEach(([k,v]) => {
            merged[k] = {...v, pdfFile: null};
          });
          return merged;
        });
        if (d.sections) setSections(prev => ({...prev, ...d.sections}));
        const ago = d.savedAt ? Math.round((Date.now()-new Date(d.savedAt))/60000) : null;
        toast.success(`Draft restored${ago!==null?' (saved '+ago+'m ago)':''}`, {duration:3000});
      }
    } catch {}
  }, []); // eslint-disable-line

  const totalInterior = Object.values(rooms).reduce((s, r) => s + calcRoomTotal(r.items), 0);
  const sectionTotals = {};
  Object.entries(sections).forEach(([k, sec]) => { sectionTotals[k] = sec.items.reduce((s, it) => s + calcTotal(it), 0); });
  const totalAllSections = Object.values(sectionTotals).reduce((s, v) => s + v, 0);
  const subtotal       = totalInterior + totalAllSections;
  const discountAmount = Math.round(subtotal * discountPercent / 100);
  const afterDiscount  = subtotal - discountAmount;
  const gstAmount      = Math.round(afterDiscount * gstPercent / 100);
  const grandTotal     = afterDiscount + gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName || !clientPhone) { toast.error('Please fill client name and phone number'); return; }
    setLoading(true);
    try {
      // Convert PDF files to base64 for storage
      const roomsToSave = {};
      for (const [k, v] of Object.entries(rooms)) {
        const { pdfFile, ...rest } = v;
        if (pdfFile) {
          rest.pdfBase64 = await fileToBase64(pdfFile);
        }
        roomsToSave[k] = rest;
      }

      // Convert plan files to base64
      const toB64 = (file) => file ? fileToBase64(file) : Promise.resolve(null);
      const [floorPlanB64, plan2DB64, plan3DB64] = await Promise.all([toB64(floorPlan), toB64(plan2D), toB64(plan3D)]);

      const payload = {
        customer_name: clientName, customer_phone: clientPhone,
        customer_alt_phone: clientAltPhone, full_address: fullAddress,
        pincode, villa_number: villaNumber, site_name: siteName,
        location, mobile: clientPhone,
        project_type: projectType,
        floor_plan: floorPlanB64 ? { name: floorPlan.name, data: floorPlanB64 } : null,
        plan_2d: plan2DB64 ? { name: plan2D.name, data: plan2DB64 } : null,
        plan_3d: plan3DB64 ? { name: plan3D.name, data: plan3DB64 } : null,
        site_manager_name: smName, site_manager_phone: smPhone,
        site_manager_designation: smDesignation, site_manager_branch: smBranch,
        rooms: roomsToSave, accessories: roomsToSave.accessories,
        pay_stages: payStages,
        ceiling_data: sections, tc_items: Array.isArray(tcItems) ? tcItems : (typeof tcItems === 'string' ? JSON.parse(tcItems) : []), discount_percent: discountPercent, discount_amount: discountAmount, gst_percent: gstPercent, gst_amount: gstAmount,
        total_interior: totalInterior, total_ceiling: totalAllSections, grand_total: grandTotal
      };
      const res = await api.post(`/quotations`, payload);
      toast.success(`Quotation #${res.data.quotation_id||res.data.id} saved successfully!`);
      localStorage.removeItem('deeraj_draft'); // clear draft after save
      setClientName(''); setClientPhone(''); setClientAltPhone(''); setFullAddress(''); setPincode(''); setVillaNumber(''); setSiteName(''); setLocation(''); setSmName(''); setSmPhone(''); setSmDesignation(''); setSmBranch(''); setProjectType(''); setFloorPlan(null); setPlan2D(null); setPlan3D(null); setTcItems([...DEFAULT_TC]); setPayStages(DEFAULT_PAY_STAGES.map(s => ({ ...s })));
      setRooms(() => { const r = {}; Object.entries(DEFAULT_ROOMS).forEach(([k, v]) => { r[k] = { ...v, items: v.items.map(i => ({ ...i, width:0, height:0, nos:0, unitCost:0, remarks:'' })), pdfFile: null, pdfName: '' }; }); return r; });
      setSections(() => { const s = {}; Object.entries(INITIAL_SECTIONS).forEach(([k, v]) => { s[k] = { ...v, items: v.items.map(i => ({ ...i })) }; }); return s; });
      setGstPercent(0); setDiscountPercent(0);
      navigate('/quotations');
    } catch (err) {
      if (err.response?.status === 422) {
        const errs = err.response.data.errors || [];
        errs.forEach(e => toast.error(e, { duration: 4000 }));
      } else if (err.response?.status === 401) {
        toast.error('Unauthorized: check your API key');
      } else {
        toast.error('Failed to save. Is the backend running?');
      }
    }
    setLoading(false);
  };

  const activeRoomData = rooms[activeRoom];
  const isAccessory = activeRoom === 'accessories';

  return (
    <div className="form-page fade-up">
      <div className="page-header">
        <div style={{display:'flex',alignItems:'flex-start',gap:'16px'}}>
          <button
            type="button"
            onClick={() => navigate('/quotations')}
            style={{
              display:'flex',alignItems:'center',gap:'6px',padding:'9px 16px',
              background:'transparent',border:'1.5px solid #E5E5E5',borderRadius:'9px',
              fontFamily:"'DM Sans',sans-serif",fontSize:'13px',fontWeight:'600',
              color:'#555',cursor:'pointer',transition:'all 0.2s',marginTop:'4px',flexShrink:0,
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#E8471C';e.currentTarget.style.color='#E8471C';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E5E5';e.currentTarget.style.color='#555';}}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 2L3.5 6.5L8.5 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            Back
          </button>
          <div>
            <h1 className="page-title">New Quotation</h1>
            <p className="page-subtitle">Create a detailed interior work estimation</p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          {autoSaveStatus && (
            <span style={{fontSize:11,fontFamily:"'DM Sans',sans-serif",fontWeight:600,
              color:autoSaveStatus==='saved'?'#10B981':autoSaveStatus==='saving'?'#F59E0B':'#94a3b8'}}>
              {autoSaveStatus==='saved'?'✓ Draft saved':autoSaveStatus==='saving'?'⏳ Saving…':'● Unsaved'}
            </span>
          )}
          <div className="grand-total-badge">
            <span className="gt-label">Grand Total</span>
            <span className="gt-amount">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Customer name display above form */}
      {clientName && (
        <div style={{
          marginBottom: '24px',
          padding: '16px 24px',
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2d1200 100%)',
          borderRadius: '14px',
          borderLeft: '4px solid #E8471C',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 4px 20px rgba(232,71,28,0.15)',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#E8471C', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '22px', fontWeight: '800',
            color: '#fff', fontFamily: "'Playfair Display', serif", flexShrink: 0,
          }}>
            {clientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{fontSize:'11px', color:'#aaa', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:'3px'}}>Quotation For</div>
            <div style={{fontSize:'26px', fontWeight:'800', color:'#fff', fontFamily:"'Playfair Display', serif", lineHeight:'1.1', letterSpacing:'-0.3px'}}>
              {clientName}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* PROJECT TYPE */}
        <section className="form-section fade-up-delay">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-badge project-badge">🏗️ Project</span>
              <span className="section-num">01</span>
              Project Type
            </h2>
          </div>
          <div className="project-type-grid">
            {['2BHK','3BHK','4BHK','Villa','Commercial Project','Others'].map(type => (
              <label key={type} className={`project-type-card ${projectType === type ? 'selected' : ''}`}>
                <input type="radio" name="projectType" value={type} checked={projectType === type} onChange={() => setProjectType(type)} />
                <span className="project-type-icon">
                  {type === '2BHK' ? '🏠' : type === '3BHK' ? '🏠' : type === '4BHK' ? '🏡' : type === 'Villa' ? '🏰' : type === 'Commercial Project' ? '🏢' : '📋'}
                </span>
                <span className="project-type-label">{type}</span>
              </label>
            ))}
          </div>
          <div className="plan-files-grid">
            {[
              { label: 'Floor Plan', ref: floorPlanRef, file: floorPlan, set: setFloorPlan, icon: '📐' },
              { label: '2D Plan', ref: plan2DRef, file: plan2D, set: setPlan2D, icon: '📄' },
              { label: '3D Plan', ref: plan3DRef, file: plan3D, set: setPlan3D, icon: '🎨' },
            ].map(({ label, ref, file, set, icon }) => (
              <div key={label} className="plan-file-card">
                <div className="plan-file-icon">{icon}</div>
                <div className="plan-file-info">
                  <div className="plan-file-label">{label}</div>
                  {file ? (
                    <div className="plan-file-name">
                      <span title={file.name}>{file.name.length > 20 ? file.name.slice(0,20)+'…' : file.name}</span>
                      <button type="button" className="plan-file-remove" onClick={() => set(null)}>✕</button>
                    </div>
                  ) : (
                    <div className="plan-file-empty">No file attached</div>
                  )}
                </div>
                <input type="file" style={{display:'none'}} ref={ref}
                  onChange={e => { if(e.target.files[0]) set(e.target.files[0]); }} />
                <button type="button" className={`plan-file-btn ${file ? 'has-file' : ''}`}
                  onClick={() => ref.current?.click()}>
                  {file ? '↩ Replace' : '+ Attach'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* CLIENT */}
        <section className="form-section fade-up-delay">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-badge client-badge">👤 Client</span>
              <span className="section-num">02</span>
              Client Details
            </h2>
          </div>
          <div className="person-grid three-col">
            <div className="field-group">
              <label className="field-label">Full Name <span className="req">*</span></label>
              <input className="field-input" placeholder="Mr. Sudharshan" value={clientName} onChange={e => setClientName(e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label">Phone Number <span className="req">*</span></label>
              <input className="field-input" placeholder="9000700930" value={clientPhone} onChange={e => setClientPhone(e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label">Alternate Phone Number</label>
              <input className="field-input" placeholder="9100000000" value={clientAltPhone} onChange={e => setClientAltPhone(e.target.value)} />
            </div>
            <div className="field-group full-width">
              <label className="field-label">Full Address</label>
              <input className="field-input" placeholder="House No., Street, Area, City" value={fullAddress} onChange={e => setFullAddress(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Pincode</label>
              <input className="field-input" placeholder="500032" value={pincode} onChange={e => setPincode(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Villa / Flat Number</label>
              <input className="field-input" placeholder="Villa 12 / Flat 4B" value={villaNumber} onChange={e => setVillaNumber(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Site Name / Project Name</label>
              <input className="field-input" placeholder="Aparna Palm Woods" value={siteName} onChange={e => setSiteName(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Location</label>
              <input className="field-input" placeholder="Kokapet, Hyderabad" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
          </div>
        </section>

        {/* SITE MANAGER */}
        <section className="form-section fade-up-delay">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-badge sm-badge">🏗️ Manager</span>
              <span className="section-num">03</span>
              Site Manager Details
            </h2>
          </div>
          <div className="person-grid three-col">
            <div className="field-group">
              <label className="field-label">Full Name</label>
              <input className="field-input" placeholder="e.g. Chandu" value={smName} onChange={e => setSmName(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Phone Number</label>
              <input className="field-input" placeholder="9000700910" value={smPhone} onChange={e => setSmPhone(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Designation</label>
              <input className="field-input" placeholder="e.g. Site Manager" value={smDesignation} onChange={e => setSmDesignation(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Branch</label>
              <select className="field-input field-select" value={smBranch} onChange={e => setSmBranch(e.target.value)}>
                <option value="">— Select Branch —</option>
                {['Kompally','Medchal','Gachibowli','Bheemavaram'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div> 
          </div>
        </section>

        {/* ROOMS — all cards stacked, each with minimize */}
        <section className="form-section fade-up-delay-2">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-badge room-badge">🏠 Rooms</span>
              <span className="section-num">04</span>
              Interior Work
            </h2>
            <div className="section-header-right">
              <div className="section-total">Total: <strong>₹{totalInterior.toLocaleString('en-IN')}</strong></div>
              {!showAddRoom ? (
                <button type="button" className="btn-add-room" onClick={() => setShowAddRoom(true)}>＋ Add Room</button>
              ) : (
                <div className="add-room-inline">
                  <input className="add-room-input" placeholder="Room name…" value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewRoom())} autoFocus />
                  <button type="button" className="btn-confirm-room" onClick={addNewRoom}>✓</button>
                  <button type="button" className="btn-cancel-room" onClick={() => { setShowAddRoom(false); setNewRoomName(''); }}>✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Quick-nav — single box */}
          <div className="nav-overview-box">
            <div className="nav-overview-group">
              <div className="nav-overview-group-title">🏠 Rooms</div>
              <div className="nav-overview-grid">
                {Object.entries(rooms).map(([key, room]) => {
                  const roomTotal = calcRoomTotal(room.items);
                  return (
                    <a key={key} href={"#room-card-" + key} className="nav-overview-item" style={{ '--chip-color': room.color }}>
                      <span className="nav-ov-icon">{ROOM_ICONS[key] || '🚪'}</span>
                      <span className="nav-ov-name">{room.label}</span>
                      <span className="nav-ov-amt">{roomTotal === 0 ? '—' : '₹' + roomTotal.toLocaleString('en-IN')}</span>
                    </a>
                  );
                })}
              </div>
            </div>
            <div className="nav-overview-divider" />
            <div className="nav-overview-group">
              <div className="nav-overview-group-title-row">
                <span className="nav-overview-group-title">📐 Other Works</span>
                {!showAddSection ? (
                  <button type="button" className="btn-add-section-sm" onClick={() => setShowAddSection(true)}>＋ Add Section</button>
                ) : (
                  <div className="add-room-inline">
                    <input className="add-room-input" placeholder="Section name…" value={newSectionName}
                      onChange={e => setNewSectionName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewSection())} autoFocus />
                    <button type="button" className="btn-confirm-room" onClick={addNewSection}>✓</button>
                    <button type="button" className="btn-cancel-room" onClick={() => { setShowAddSection(false); setNewSectionName(''); }}>✕</button>
                  </div>
                )}
              </div>
              <div className="nav-overview-grid">
                {Object.entries(sections).map(([key, sec]) => {
                  const secTotal = sectionTotals[key] || 0;
                  return (
                    <a key={key} href={"#room-card-sec_" + key} className="nav-overview-item" style={{ '--chip-color': SECTION_COLORS[key] }}>
                      <span className="nav-ov-icon">{SECTION_ICONS[key]}</span>
                      <span className="nav-ov-name">{sec.label}</span>
                      <span className="nav-ov-amt">{secTotal === 0 ? '—' : '₹' + secTotal.toLocaleString('en-IN')}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="all-rooms-stack">
            {Object.entries(rooms).map(([key, room]) => {
              const isMin = !!minimized[key];
              const isAcc = key === 'accessories';
              const roomTotal = isAcc
                ? room.items.reduce((s, i) => s + i.nos * i.unitCost, 0)
                : calcRoomTotal(room.items);
              return (
                <div key={key} id={"room-card-" + key} className={`room-card ${isMin ? 'minimized' : ''}`} style={{ '--room-color': room.color }}>
                  <div className="room-card-header">
                    <div className="room-card-title">
                      <span className="room-card-icon">{ROOM_ICONS[key] || '🚪'}</span>
                      {room.isCustom ? (
                        <input className="room-name-edit" value={room.label} onChange={e => updateRoomLabel(key, e.target.value)} style={{ borderColor: room.color }} />
                      ) : (
                        <span className="room-card-label">{room.label}</span>
                      )}
                      <span className="room-card-total" style={{ color: room.color }}>{roomTotal === 0 ? '—' : '₹' + roomTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="room-card-actions">
                      {!isAcc && (
                        <div className="pdf-upload-wrap">
                          <input type="file" accept=".pdf" style={{ display: 'none' }}
                            ref={el => fileInputRefs.current[key] = el}
                            onChange={e => handlePdfUpload(key, e.target.files[0])} />
                          <button type="button" className={`btn-upload-pdf ${room.pdfName ? 'has-file' : ''}`}
                            onClick={() => fileInputRefs.current[key]?.click()}>
                            📎 {room.pdfName ? room.pdfName.slice(0, 16) + (room.pdfName.length > 16 ? '…' : '') : 'Attach PDF'}
                          </button>
                          {room.pdfName && (
                            <button type="button" className="btn-remove-pdf"
                              onClick={() => setRooms(prev => ({ ...prev, [key]: { ...prev[key], pdfFile: null, pdfName: '' } }))}>✕</button>
                          )}
                        </div>
                      )}
                      {!isAcc && <button type="button" className="btn-add-item" onClick={() => addItem(key)}>+ Add Item</button>}
                      {isAcc && <button type="button" className="btn-add-item" onClick={() => addItem('accessories')}>+ Add Item</button>}
                      <button type="button" className="btn-delete-room"
                        onClick={() => { if (window.confirm(`Delete "${room.label}"?`)) deleteRoom(key); }}>
                        🗑 Delete
                      </button>
                      <button type="button" className="btn-minimize" onClick={() => toggleMinimize(key)} title={isMin ? 'Expand' : 'Minimize'}>
                        {isMin ? '＋' : '−'}
                      </button>
                    </div>
                  </div>
                  {!isMin && (
                    isAcc ? (
                      <div className="item-table-wrap">
                        <table className="item-table">
                          <thead>
                            <tr><th>Item</th><th>Nos / Qty</th><th>Unit Cost (₹)</th><th>Total (₹)</th><th>Remarks</th><th></th></tr>
                          </thead>
                          <tbody>
                            {room.items.map((item, idx) => (
                              <tr key={idx} className="item-row">
                                <td><input className="cell-input" value={item.name} onChange={e => updateItem('accessories', idx, 'name', e.target.value)} /></td>
                                <td><input type="text" inputMode="numeric" className="cell-input num" value={item.nos} onChange={e => updateItem('accessories', idx, 'nos', parseFloat(e.target.value)||0)} /></td>
                                <td><input type="text" inputMode="numeric" className="cell-input num" value={item.unitCost} onChange={e => updateItem('accessories', idx, 'unitCost', parseFloat(e.target.value)||0)} /></td>
                                <td className="total-cell">₹{(item.nos * item.unitCost).toLocaleString('en-IN')}</td>
                                <td><input className="cell-input" value={item.remarks} onChange={e => updateItem('accessories', idx, 'remarks', e.target.value)} /></td>
                                <td><button type="button" className="btn-remove" onClick={() => removeItem('accessories', idx)}>✕</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <RoomItemTableWithRemove items={room.items}
                        onUpdate={(idx, f, v) => updateItem(key, idx, f, v)}
                        onRemove={(idx) => removeItem(key, idx)} />
                    )
                  )}
                </div>
              );
            })}

            {/* SECTION CARDS — Electrical, Wooden, Marble, General */}
            {Object.entries(sections).map(([key, sec]) => {
              const isMin = !!minimized['sec_' + key];
              const secTotal = sectionTotals[key] || 0;
              return (
                <div key={key} id={"room-card-sec_" + key} className={`room-card section-card ${isMin ? 'minimized' : ''}`} style={{ '--room-color': SECTION_COLORS[key] }}>
                  <div className="room-card-header">
                    <div className="room-card-title">
                      <span className="room-card-icon">{SECTION_ICONS[key]}</span>
                      <span className="room-card-label">{sec.label}</span>
                      <span className="room-card-total" style={{ color: SECTION_COLORS[key] }}>{secTotal === 0 ? '—' : '₹' + secTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="room-card-actions">
                      <button type="button" className="btn-add-item" onClick={() => addSectionItem(key)}>+ Add Row</button>
                      <button type="button" className="btn-delete-room"
                        onClick={() => { if (window.confirm(`Delete "${sec.label}"?`)) setSections(prev => { const n={...prev}; delete n[key]; return n; }); }}>
                        🗑 Delete
                      </button>
                      <button type="button" className="btn-minimize" onClick={() => toggleMinimize('sec_' + key)} title={isMin ? 'Expand' : 'Minimize'}>
                        {isMin ? '＋' : '−'}
                      </button>
                    </div>
                  </div>
                  {!isMin && (
                    <SectionTable items={sec.items}
                      onUpdate={(idx, f, v) => updateSectionItem(key, idx, f, v)}
                      onRemove={(idx) => removeSectionItem(key, idx)} />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SUMMARY */}
        <section className="form-section summary-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-badge summary-badge">📊 Summary</span>
              <span className="section-num">09</span>
              Cost Summary
            </h2>
          </div>
          <div className="summary-grid">
            {Object.entries(rooms).map(([key, room]) => (
              <div key={key} className="summary-item" style={{ '--color': room.color }}>
                <span className="summary-room">{room.label}</span>
                <span className="summary-val">₹{calcRoomTotal(room.items).toLocaleString('en-IN')}</span>
              </div>
            ))}
            {Object.entries(sections).map(([key, sec]) => (
              <div key={key} className={`summary-item summary-${key}-item`}>
                <span className="summary-room">{sec.label}</span>
                <span className="summary-val">₹{sectionTotals[key].toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
          {/* TERMS & CONDITIONS */}
          <div className="tc-block">
            <div className="tc-header">
              <span className="tc-title">📋 Terms &amp; Conditions</span>
              <span className="tc-count">{tcItems.length} items</span>
            </div>
            <ol className="tc-list">
              {tcItems.map((item, idx) => (
                <li key={idx} className="tc-item">
                  <span className="tc-text">{item}</span>
                  <button type="button" className="tc-remove" onClick={() => setTcItems(prev => prev.filter((_,i) => i !== idx))} title="Remove">✕</button>
                </li>
              ))}
            </ol>
            <div className="tc-add-row">
              <input
                className="tc-input"
                placeholder="Add a new term or condition…"
                value={newTcText}
                onChange={e => setNewTcText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const t = newTcText.trim();
                    if (t) { setTcItems(prev => [...prev, t]); setNewTcText(''); }
                  }
                }}
              />
              <button type="button" className="tc-add-btn"
                onClick={() => { const t = newTcText.trim(); if (t) { setTcItems(prev => [...prev, t]); setNewTcText(''); } }}>
                + Add
              </button>
            </div>
          </div>

          <div className="totals-block">
            <div className="total-row subtotal-row">
              <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="total-row gst-row">
              <span className="gst-label-wrap">
                Discount
                <div className="gst-edit-wrap">
                  <input type="text" inputMode="numeric" className="gst-input" value={discountPercent} min="0" max="100" onChange={e => setDiscountPercent(parseFloat(e.target.value)||0)} placeholder="0" />
                  <span className="gst-pct-sym">%</span>
                </div>
              </span>
              <span className="gst-amount-val" style={{color:'#10B981'}}>- ₹{discountAmount.toLocaleString('en-IN')}</span>
            </div>
            {discountPercent > 0 && (
              <div className="total-row" style={{opacity:0.75}}>
                <span>After Discount</span><span>₹{afterDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="total-row gst-row">
              <span className="gst-label-wrap">
                GST
                <div className="gst-edit-wrap">
                  <input type="text" inputMode="numeric" className="gst-input" value={gstPercent} min="0" max="100" onChange={e => setGstPercent(parseFloat(e.target.value)||0)} placeholder="0" />
                  <span className="gst-pct-sym">%</span>
                </div>
              </span>
              <span className="gst-amount-val">+ ₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="total-row grand-total-row">
              <span>Grand Total
                {discountPercent > 0 && <span className="gst-incl-note"> ({discountPercent}% disc)</span>}
                {gstPercent > 0 && <span className="gst-incl-note"> (incl. {gstPercent}% GST)</span>}
              </span>
              <span className="gt-number">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button type="button" className="btn-payment" onClick={() => setShowPaymentModal(true)}>
            💳 Payment Schedule
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <span className="btn-loading"><span className="spinner"></span> Saving...</span>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Save Quotation</>
            )}
          </button>
        </div>
        {showPaymentModal && ReactDOM.createPortal(
          <PaymentModal
            payStages={payStages}
            setPayStages={setPayStages}
            onClose={() => setShowPaymentModal(false)}
            clientName={clientName}
            smName={smName}
            grandTotal={grandTotal}
          />,
          document.body
        )}
      </form>
    </div>
  );
}