import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const fmt  = n => Number(n||0).toLocaleString('en-IN');
const fmtK = n => {
  const v = Number(n||0);
  if (v >= 10000000) return `₹${(v/10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v/100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v/1000).toFixed(1)}K`;
  return `₹${v}`;
};

// ── Category & Sub-category master data ──────────────────────────
const CATEGORY_DATA = {
  Plywood: {
    icon: '🪵',
    subcategories: {
      'BWR Plywood (Boiling Water Resistant)': ['4mm','6mm','8mm','9mm','12mm','16mm','18mm','19mm','25mm'],
      'BWP Plywood (Marine Grade)':            ['4mm','6mm','8mm','9mm','12mm','16mm','18mm','19mm','25mm'],
      'Commercial Plywood':                    ['4mm','6mm','8mm','9mm','12mm','16mm','18mm','19mm','25mm'],
      'Flexi Plywood':                         ['4mm','6mm','8mm','9mm','12mm'],
      'Shuttering Plywood':                    ['12mm','18mm','25mm'],
      'Block Board':                           ['12mm','18mm','19mm','25mm'],
      'Particle Board / Chipboard':            ['8mm','12mm','16mm','18mm'],
      'MDF (Medium Density Fibreboard)':       ['3mm','6mm','8mm','9mm','12mm','16mm','18mm'],
      'HDF (High Density Fibreboard)':         ['3mm','6mm','8mm','12mm'],
      'Calibrated Plywood':                    ['12mm','16mm','18mm'],
      'Fire Retardant Plywood':                ['12mm','18mm'],
      'Zero Emission Plywood (E0/E1)':         ['12mm','16mm','18mm'],
    }
  },
  Hardware: {
    icon: '🔩',
    subcategories: {
      'Hinges':         ['Concealed Hinge','Piano Hinge','Butterfly Hinge','Hydraulic Hinge','Soft-close Hinge'],
      'Handles & Knobs':['Profile Handle','Bar Handle','Flush Handle','Knob','Finger Pull'],
      'Drawer Systems': ['Undermount Drawer','Telescopic Channel','Soft-close Drawer','Tandem Box'],
      'Channels':       ['Ball-bearing Channel','Roller Channel','Side Mount Channel','Bottom Mount Channel'],
      'Locks & Latches':['Cupboard Lock','Drawer Lock','Cam Lock','Magnetic Catch','Ball Catch'],
      'Screws & Fasteners':['Wood Screw','Dowel Pin','Confirmat Screw','Furniture Bolt','T-nut'],
      'Soft-close Mechanisms':['Door Damper','Drawer Damper','Flap Stay','Lid Support'],
      'Shelf Supports': ['Shelf Pin','Shelf Bracket','Adjustable Shelf Clip'],
      'Casters & Wheels':['Swivel Caster','Fixed Caster','Leveling Leg','Glide Foot'],
      'Door Accessories':['Magnetic Door Stop','Door Bumper','Floor Spring','Door Closer'],
      'Wardrobe Fittings':['Hanging Rail','Trouser Rack','Tie Rack','Shoe Rack','Magic Corner'],
      'Miscellaneous Hardware':['Cabinet Jack','Edging Strip','PVC Edge Band','Aluminium Edge Band'],
    }
  },
  Laminates: {
    icon: '🎨',
    subcategories: {
      'High Pressure Laminate (HPL)':  ['0.8mm','1mm','1.5mm','Suede Finish','Gloss Finish','Matt Finish','Texture Finish'],
      'Compact Laminate':              ['2mm','3mm','4mm','6mm','8mm','10mm'],
      'Low Pressure Laminate (LPL)':   ['0.5mm','0.8mm','Pre-laminated on Board'],
      'Acrylic Laminate / Acrylic Sheet':['1mm','2mm','3mm','High Gloss','Matte'],
      'PVC Laminate / PVC Film':       ['0.3mm','0.5mm','0.8mm','1mm'],
      'Veneer':                        ['0.3mm Raw Veneer','0.6mm Raw Veneer','Pre-polished Veneer','Recon Veneer'],
      'Decorative Foil / Membrane':    ['Flat Foil','3D PVC Membrane','Vinyl Wrap'],
      'Sunmica (Brand Name - HPL)':    ['Matt','Gloss','Metallic','Woodgrain','Plain Colour'],
      'Merino / Century / Greenlam':   ['0.8mm Standard','1mm Standard','Designer Series'],
      'Cladding Sheet':                ['Aluminium Cladding','ACP Sheet','Fibre Cement Board'],
    }
  },
  Transport: {
    icon: '🚚',
    subcategories: {
      'Material Transport':    ['Within City','Outstation','Site Delivery','Warehouse to Site'],
      'Labour Transport':      ['Daily Pick-up','Project Duration','Outstation'],
      'Equipment Transport':   ['Crane Hire','Forklift','Goods Lift','Truck Hire'],
      'Courier / Parcel':      ['Local Courier','Intercity Courier','Overnight Delivery'],
      'Loading & Unloading':   ['Manual Loading','Mechanized Loading','Crane Loading'],
      'Fuel & Vehicle Expense':['Diesel','Petrol','Vehicle Maintenance','Toll & Parking'],
    }
  },
  Labour: {
    icon: '👷',
    subcategories: {
      'Carpenter':         ['Daily Wage','Contract Basis','Skilled Carpenter','Semi-skilled Carpenter'],
      'Helper / Mazdoor':  ['Daily Wage','Contract Basis','Helper','Unskilled Labour'],
      'Painter':           ['Per Day','Per SFT','Texture Work','Polish Work','PU Finish'],
      'Electrician':       ['Daily Wage','Point Basis','Wiring Work','Fitting Work'],
      'Plumber':           ['Daily Wage','Point Basis','Civil Plumbing','Sanitary Fitting'],
      'Civil Labour':      ['Masonry','Plastering','Tiling','Demolition','False Ceiling'],
      'Fabrication Labour':['Steel Fabrication','Aluminium Fabrication','Glass Work'],
      'Polishing Labour':  ['Wood Polish','Melamine Finish','PU Polish','French Polish'],
      'Contractor':        ['Civil Contractor','Interior Contractor','Labour Contractor'],
      'Supervisor':        ['Site Supervisor','Project Manager','Quality Inspector'],
    }
  },
  'Civil & Masonry': {
    icon: '🏗',
    subcategories: {
      'Sand & Aggregates':  ['River Sand','M-Sand','P-Sand','Coarse Aggregate 20mm','Coarse Aggregate 10mm','Quarry Dust'],
      'Cement':             ['OPC 43 Grade','OPC 53 Grade','PPC Cement','White Cement','Rapid Hardening Cement'],
      'Bricks & Blocks':    ['Red Brick','Fly Ash Brick','AAC Block','CLC Block','Paver Block','Curbstone'],
      'Steel & Reinforcement':['TMT Bar 8mm','TMT Bar 10mm','TMT Bar 12mm','TMT Bar 16mm','Binding Wire','Mesh'],
      'Tiles & Flooring':   ['Vitrified Tile','Ceramic Tile','Parking Tile','Mosaic Tile','Marble Slab','Granite Slab'],
      'Waterproofing':      ['Dr. Fixit','SBR Polymer','Bitumen','APP Membrane','Crystalline Compound'],
      'Admixtures':         ['Plasticizer','Superplasticizer','Retarder','Accelerator','Anti-shrink Compound'],
    }
  },
  Glass: {
    icon: '🪟',
    subcategories: {
      'Clear Float Glass':    ['3mm','4mm','5mm','6mm','8mm','10mm','12mm'],
      'Toughened Glass':      ['4mm','6mm','8mm','10mm','12mm'],
      'Frosted / Sandblasted':['4mm','6mm','8mm'],
      'Lacquered / Back-painted Glass':['4mm','6mm'],
      'Mirror':               ['3mm','4mm','5mm'],
      'Spider Glass Fitting': ['Clamp Fitting','Patch Fitting','Frame Fitting'],
      'Glass Partition':      ['Frameless','Framed Aluminium','UPVC Frame'],
      'Louver / Jalousie':    ['Clear','Frosted','Tinted'],
    }
  },
  Paints: {
    icon: '🎨',
    subcategories: {
      'Primer':           ['Wall Primer','Wood Primer','Metal Primer','Anti-corrosive Primer'],
      'Interior Emulsion':['Flat / Matte','Eggshell','Satin','Washable Emulsion'],
      'Exterior Emulsion':['Weather Coat','Elastomeric Paint','Textured Finish'],
      'Enamel / Gloss':   ['Oil-based Enamel','Acrylic Enamel','High Gloss','Semi-gloss'],
      'Wood Finish':      ['Melamine','PU (Polyurethane)','NC Lacquer','French Polish','Wax Polish'],
      'Putty & Filler':   ['Wall Putty','Wood Filler','Crack Filler','Gypsum Plaster'],
      'Texture Coat':     ['Sand Texture','Pebble Dash','Smooth Texture','Venetian Plaster'],
      'Waterproof Paint': ['Bituminous Coating','Polymer Coating','Epoxy Coating'],
    }
  },
  Electrical: {
    icon: '⚡',
    subcategories: {
      'Wiring & Cables': ['1.5 Sq mm','2.5 Sq mm','4 Sq mm','6 Sq mm','10 Sq mm','Armoured Cable'],
      'Switches & Sockets':['Modular Switch','Socket Outlet','MCB Switch','RCCB'],
      'Lights & Fittings':['LED Strip','Downlight','Spot Light','Chandelier','Batten Light','Panel Light'],
      'Distribution Board':['MCB Box','MCCB','ELCB / RCCB','Isolator','DB Board'],
      'Conduit & Accessories':['PVC Conduit','Flexible Conduit','Junction Box','Cable Tray'],
      'Fans & Exhaust':   ['Ceiling Fan','Exhaust Fan','Fresh Air Fan','HVLS Fan'],
      'AC & HVAC':        ['Split AC Unit','Cassette AC','Duct AC','Ventilation Unit'],
      'Generator & UPS':  ['Generator Hire','Inverter','UPS System','Battery','Solar Panel'],
    }
  },
  Plumbing: {
    icon: '🚰',
    subcategories: {
      'CPVC / UPVC Pipes':   ['15mm','20mm','25mm','32mm','40mm','50mm','63mm'],
      'GI Pipes':            ['½ inch','¾ inch','1 inch','1.5 inch','2 inch'],
      'PVC Drainage Pipes':  ['50mm','75mm','100mm','110mm','150mm'],
      'Fittings & Valves':   ['Elbow','Tee','Reducer','Ball Valve','Gate Valve','Check Valve'],
      'Sanitary Ware':       ['WC / Closet','Wash Basin','Urinal','Kitchen Sink','Floor Trap'],
      'CP Fittings':         ['Faucet / Tap','Shower','Mixer','Health Faucet','Flush Valve'],
      'Water Tank':          ['Overhead Tank','Underground Sump','PVC Tank','RCC Tank'],
      'Water Treatment':     ['Water Softener','RO Unit','UV Filter','Sand Filter'],
    }
  },
  'False Ceiling & Partition': {
    icon: '🏠',
    subcategories: {
      'Gypsum Board':       ['9mm Standard','12.5mm Standard','12.5mm Moisture Resistant','15mm Fire Rated'],
      'Grid Ceiling (T-Bar)':['600x600 Mineral Fibre','600x600 PVC Tile','600x600 Metal Tile'],
      'PVC False Ceiling':  ['Plain','Printed','Wooden Finish','0.8mm','1mm'],
      'Metal / GI Ceiling': ['Baffle Ceiling','Linear Ceiling','Cassette Panel','Perforated Panel'],
      'Wooden False Ceiling':['Solid Wood Panel','Engineered Wood','WPC Panel'],
      'Partition Wall':     ['Gypsum Partition','Glass Partition','Aluminium Partition','Wooden Partition'],
      'Suspension System':  ['Flat Hanger','Adjustable Hanger','Main Channel','Cross Channel','Wall Angle'],
    }
  },
  'Furniture & Furnishing': {
    icon: '🛋',
    subcategories: {
      'Modular Furniture':  ['Kitchen Cabinet','Wardrobe','TV Unit','Study Unit','Shoe Cabinet'],
      'Loose Furniture':    ['Chair','Table','Sofa','Bed','Chest of Drawers'],
      'Upholstery':         ['Fabric','Leatherette','Foam','Rexine'],
      'Curtains & Blinds':  ['Roller Blind','Venetian Blind','Vertical Blind','Curtain Track','Curtain Rod'],
      'Mattress & Bedding': ['Foam Mattress','Spring Mattress','Coir Mattress','Pillow','Bedsheet'],
    }
  },
  Miscellaneous: {
    icon: '📦',
    subcategories: {
      'Site Overhead':  ['Site Rent','Security','Housekeeping','Temporary Shed','Safety Equipment'],
      'Office Expense': ['Printing','Stationery','Design Software','Travel Expense','Communication'],
      'Tools & Equipment':['Power Tools','Hand Tools','Scaffolding','Safety Harness','Measuring Instrument'],
      'Consumables':    ['Sand Paper','Masking Tape','Brush','Roller','Solvents','Cleaning Materials'],
      'Documentation':  ['NOC Charges','Approval Fees','Liaisoning','Permit','Registration'],
      'Bank & Finance': ['Bank Charges','Interest','GST Payment','TDS','Professional Tax'],
      'Other':          ['As per Site Requirement','Contingency','Unforeseen Expense'],
    }
  },
};

const PAYMENT_MODES = ['Cash','UPI','NEFT','RTGS','Cheque','Bank Transfer','Card','Credit'];
const BUILD_BY_OPTIONS = ['In-house Team','Sub-contractor','Vendor','Direct Labour'];
const APPROVED_BY_OPTIONS = ['Manager','Director','Site Supervisor','Owner','Project Head'];
const GST_OPTIONS = ['No GST','5%','12%','18%','28%'];

const EXPENSE_CATS = Object.keys(CATEGORY_DATA);

/* ─── Shared input styles ────────────────────────────────────── */
const IS = {
  width:'100%', padding:'9px 12px', border:'1.5px solid #e8e8e8',
  borderRadius:8, fontSize:14, fontFamily:'DM Sans,sans-serif',
  outline:'none', boxSizing:'border-box', background:'#fff',
};
const LS = {
  display:'block', fontSize:11, fontWeight:700, color:'#888',
  textTransform:'uppercase', letterSpacing:0.5, marginBottom:5,
};

/* ─── Add Expense Modal ──────────────────────────────────────── */
function AddExpenseModal({ project, onClose, onSaved }) {
  const projectLabel = project.site_name || project.customer_name || 'Project';

  const [form, setForm] = useState({
    category: '', sub_category: '', description: '',
    amount: '', expense_date: new Date().toISOString().slice(0, 10),
    paid_by: '', notes: '', vendor: '',
    payment_mode: 'Cash', gst: 'No GST',
    bill_attached: 'No', approved_by: '', build_by: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // When category changes, reset sub_category
  const handleCategoryChange = (v) => {
    setForm(f => ({ ...f, category: v, sub_category: '' }));
  };

  const catData = form.category ? CATEGORY_DATA[form.category] : null;
  const subCatList = catData ? Object.keys(catData.subcategories) : [];
  const mmSizes = (form.category && form.sub_category && catData)
    ? (catData.subcategories[form.sub_category] || []) : [];

  const handleSave = async () => {
    if (!form.description || !form.amount) {
      toast.error('Description and amount are required.'); return;
    }
    setSaving(true);
    try {
      await api.post('/project-expenses', {
        quotation_id: project.id,
        project_name: projectLabel,
        ...form,
        amount: parseFloat(form.amount) || 0,
        created_by: projectLabel,
      });
      toast.success('Expense added!'); onSaved(); onClose();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed.'); }
    setSaving(false);
  };

  const fieldStyle = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e8e8e8',
    borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans,sans-serif',
    outline: 'none', boxSizing: 'border-box', background: '#fff',
    transition: 'border-color 0.2s',
  };
  const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 700, color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  };
  const sectionLabel = {
    fontSize: 11, fontWeight: 700, color: '#E8471C', textTransform: 'uppercase',
    letterSpacing: 0.7, marginBottom: 8, marginTop: 4,
    borderBottom: '1.5px solid #fde8e2', paddingBottom: 4,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 18, width: 620, maxWidth: '100%',
        maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
      }} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg,#fff8f6 0%,#fff 100%)',
          borderRadius: '18px 18px 0 0', position: 'sticky', top: 0, zIndex: 2,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a1a' }}>➕ New Expense Entry</div>
            <div style={{ fontSize: 12, color: '#E8471C', fontWeight: 600, marginTop: 3 }}>
              📁 {projectLabel}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#f5f5f5', border: 'none', borderRadius: 8, padding: '6px 12px',
            fontSize: 18, cursor: 'pointer', color: '#888', lineHeight: 1,
          }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Row 1 — Date + Voucher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date *</label>
              <input style={fieldStyle} type="date"
                value={form.expense_date} onChange={e => set('expense_date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Voucher No.</label>
              <input style={{ ...fieldStyle, color: '#aaa' }} placeholder="(auto-generated)" disabled />
            </div>
          </div>

          {/* Project name banner (replaces "Submitted By") */}
          <div style={{
            background: '#fff8f6', border: '1.5px solid #fde8e2', borderRadius: 10,
            padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, background: '#E8471C', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0,
            }}>
              {projectLabel.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                PROJECT  ·  AUTO-FILLED · CANNOT BE CHANGED
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{projectLabel}</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description *</label>
            <input style={fieldStyle} placeholder="e.g. Laminates — Lotus Marketing"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {/* Category + Sub-Category */}
          <div style={{ ...sectionLabel }}>Category Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={fieldStyle} value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
                <option value="">— Select Category —</option>
                {EXPENSE_CATS.map(c => (
                  <option key={c} value={c}>{CATEGORY_DATA[c].icon} {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sub-Category</label>
              <select style={{ ...fieldStyle, opacity: subCatList.length ? 1 : 0.5 }}
                value={form.sub_category} onChange={e => set('sub_category', e.target.value)}
                disabled={!subCatList.length}>
                <option value="">— Select Sub-category —</option>
                {subCatList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* MM / Size selector (shows when sub_category has sizes) */}
          {mmSizes.length > 0 && (
            <div>
              <label style={labelStyle}>Specification / Size / Finish</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                {mmSizes.map(sz => (
                  <button key={sz} type="button"
                    onClick={() => set('description', `${form.sub_category} - ${sz}`)}
                    style={{
                      padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      border: form.description.includes(sz) ? '2px solid #E8471C' : '1.5px solid #e8e8e8',
                      background: form.description.includes(sz) ? '#fff0ec' : '#fafafa',
                      color: form.description.includes(sz) ? '#E8471C' : '#555',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    {sz}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>
                💡 Clicking a size auto-fills description. You can still edit it manually.
              </div>
            </div>
          )}

          {/* Build By + Vendor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Build By</label>
              <select style={fieldStyle} value={form.build_by} onChange={e => set('build_by', e.target.value)}>
                <option value="">— Select Build By —</option>
                {BUILD_BY_OPTIONS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Vendor / Paid To</label>
              <input style={fieldStyle} placeholder="e.g. Lotus Marketing"
                value={form.vendor} onChange={e => set('vendor', e.target.value)} />
            </div>
          </div>

          {/* Paid By + Payment Mode */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Paid By</label>
              <input style={fieldStyle} placeholder="e.g. Chandu"
                value={form.paid_by} onChange={e => set('paid_by', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Payment Mode</label>
              <select style={fieldStyle} value={form.payment_mode} onChange={e => set('payment_mode', e.target.value)}>
                {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Amount + GST */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Amount (₹) *</label>
              <input style={{ ...fieldStyle, color: '#E8471C', fontWeight: 700 }}
                type="number" min="0" placeholder="0.00"
                value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>GST / Tax</label>
              <select style={fieldStyle} value={form.gst} onChange={e => set('gst', e.target.value)}>
                {GST_OPTIONS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Bill Attached + Approved By */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Bill Attached?</label>
              <select style={fieldStyle} value={form.bill_attached} onChange={e => set('bill_attached', e.target.value)}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Approved By</label>
              <select style={fieldStyle} value={form.approved_by} onChange={e => set('approved_by', e.target.value)}>
                <option value="">— Select Approved By —</option>
                {APPROVED_BY_OPTIONS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...fieldStyle, minHeight: 64, resize: 'vertical' }}
              placeholder="Context for unusual items, remarks…"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1, padding: 12, background: '#E8471C', color: '#fff',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving…' : '✅ Save Expense'}
            </button>
            <button onClick={onClose} style={{
              padding: '12px 20px', background: '#f5f5f5', border: 'none',
              borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#666',
            }}>
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Project Detail Drawer ──────────────────────────────────── */
function ProjectDetail({ projectId, onClose, onExpenseAdded }) {
  const [detail,       setDetail]      = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [showAddExp,   setShowAddExp]  = useState(false);
  const [deleting,     setDeleting]    = useState(null);
  const [visits,       setVisits]      = useState([]);
  const [completion,   setCompletion]  = useState(null);
  const [viewFile,     setViewFile]    = useState(null);
  const [addVisit,     setAddVisit]    = useState(false);
  const [visitForm,    setVisitForm]   = useState({ visit_date: new Date().toISOString().slice(0,10), visit_time:'', reported_by:'', notes:'' });
  const [visitFiles,   setVisitFiles]  = useState([]);
  const [visitSaving,  setVisitSaving] = useState(false);
  const [compPct,      setCompPct]     = useState(0);
  const [compNotes,    setCompNotes]   = useState('');
  const [compSaving,   setCompSaving]  = useState(false);
  const [compDragging, setCompDragging]= useState(false);
  const trackRef = useRef(null);
  const fileRef  = useRef(null);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([
      api.get(`/project-dashboard/${projectId}`),
      api.get('/visit-reports', { params: { quotation_id: projectId } }),
      api.get('/completion-status/' + projectId),
    ]).then(([det, vis, comp]) => {
      setDetail(det.data.data);
      setVisits(vis.data.data || []);
      const c = comp.data.data || { percentage: 0, notes: '' };
      setCompPct(c.percentage || 0);
      setCompNotes(c.notes || '');
    }).catch(() => { if (!silent) toast.error('Failed to load detail.'); })
      .finally(() => { if (!silent) setLoading(false); });
  }, [projectId]);

  useEffect(() => {
    load();
    return () => {};
  }, [load]);

  if (loading) return (
    <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#aaa',fontSize:14}}>
      Loading…
    </div>
  );
  if (!detail) return null;

  const { project: p, summary: s, transactions, orders, expenses } = detail;
  const paidPct = s.grand_total > 0 ? Math.min(Math.round((s.total_paid/s.grand_total)*100),100) : 0;
  const expPct  = s.grand_total > 0 ? Math.min(Math.round((s.total_expenses/s.grand_total)*100),100) : 0;

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#fff'}}>
      {showAddExp && (
        <AddExpenseModal project={p} onClose={()=>setShowAddExp(false)}
          onSaved={()=>{load();onExpenseAdded();}} />
      )}

      {/* Drawer header */}
      <div style={{padding:'18px 24px',borderBottom:'1px solid #f0f0f0',
        display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexShrink:0}}>
        <div>
          <div style={{fontWeight:800,fontSize:17,color:'#1a1a1a',lineHeight:1.2}}>
            {p.site_name||p.customer_name}
          </div>
          <div style={{fontSize:12,color:'#aaa',marginTop:4,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            <span>{p.customer_name}</span>
            {p.location && <><span>·</span><span>{p.location}</span></>}
            {p.project_type && <><span>·</span><span>{p.project_type}</span></>}
            {p.site_manager_name && <><span>·</span><span style={{color:'#555',fontWeight:600}}>{p.site_manager_name}</span></>}
          </div>
          {(p.project_start_date || p.project_end_date) && (
            <div style={{marginTop:6,display:'flex',gap:12,flexWrap:'wrap'}}>
              {p.project_start_date && (
                <span style={{display:'inline-flex',alignItems:'center',gap:4,
                  background:'#f0fdf4',border:'1px solid #86efac',borderRadius:6,
                  padding:'3px 10px',fontSize:11,fontWeight:700,color:'#15803d'}}>
                  ▶ Start: {new Date(p.project_start_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                </span>
              )}
              {p.project_end_date && (
                <span style={{display:'inline-flex',alignItems:'center',gap:4,
                  background:'#fff8f5',border:'1px solid rgba(232,71,28,0.3)',borderRadius:6,
                  padding:'3px 10px',fontSize:11,fontWeight:700,color:'#E8471C'}}>
                  ⏹ End: {new Date(p.project_end_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                </span>
              )}
            </div>
          )}
        </div>
        <button onClick={onClose}
          style={{background:'#f5f5f5',border:'none',borderRadius:8,width:32,height:32,
            cursor:'pointer',fontSize:16,color:'#888',flexShrink:0,marginLeft:12}}>✕</button>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>

        {/* Financial summary pills */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
          {[
            {label:'Total Cost',     value:fmt(s.grand_total),     color:'#1a1a1a', bg:'#f8f8f8'},
            {label:'Paid',           value:fmt(s.total_paid),      color:'#16a34a', bg:'#f0fdf4'},
            {label:'Balance Due',    value:fmt(s.balance_due),     color:'#E8471C', bg:'#fff8f5'},
            {label:'Total Expenses', value:fmt(s.total_expenses),  color:'#c23a16', bg:'#fff5f0'},
            {label:'Profit Est.',    value:(s.profit_estimate>=0?'+':'')+fmt(s.profit_estimate),
              color:s.profit_estimate>=0?'#16a34a':'#dc2626',
              bg:s.profit_estimate>=0?'#f0fdf4':'#fef2f2'},
          ].map(pill=>(
            <div key={pill.label} style={{background:pill.bg,borderRadius:10,padding:'12px 14px'}}>
              <div style={{fontSize:10,color:'#aaa',textTransform:'uppercase',letterSpacing:0.6,marginBottom:4}}>{pill.label}</div>
              <div style={{fontFamily:'monospace',fontSize:16,fontWeight:800,color:pill.color}}>₹{pill.value}</div>
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div style={{marginBottom:20,display:'flex',flexDirection:'column',gap:10}}>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#888',marginBottom:4}}>
              <span>Payment received</span><span style={{fontWeight:700,color:'#16a34a'}}>{paidPct}%</span>
            </div>
            <div style={{height:6,background:'#e8f5f0',borderRadius:99,overflow:'hidden'}}>
              <div style={{height:'100%',width:paidPct+'%',background:'#16a34a',borderRadius:99,transition:'width 0.6s'}}/>
            </div>
          </div>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#888',marginBottom:4}}>
              <span>Expenses vs project value</span><span style={{fontWeight:700,color:'#E8471C'}}>{expPct}%</span>
            </div>
            <div style={{height:6,background:'#fdecea',borderRadius:99,overflow:'hidden'}}>
              <div style={{height:'100%',width:expPct+'%',background:'#E8471C',borderRadius:99,transition:'width 0.6s'}}/>
            </div>
          </div>
        </div>

        {/* Payment Transactions */}
        <DrawerSection title={`💳 Payments (${transactions.length})`}>
          {!transactions.length ? <DrawerEmpty text="No payments recorded yet." /> :
            transactions.map(t=>(
              <DrawerRow key={t.id}
                left={<>
                  <div style={{fontWeight:600,fontSize:13,color:'#1a1a1a'}}>{t.stage_name||'Payment'}</div>
                  <div style={{fontSize:11,color:'#aaa',marginTop:2}}>{t.payment_date||'—'} · {t.payment_type||'Cash'} · {t.received_by||'—'}</div>
                </>}
                right={<span style={{fontFamily:'monospace',fontWeight:700,color:'#16a34a',fontSize:14}}>+₹{fmt(t.paid_amount)}</span>}
              />
            ))
          }
        </DrawerSection>

        {/* Material Orders */}
        <DrawerSection title={`📦 Material Orders (${orders.length})`}>
          {!orders.length ? <DrawerEmpty text="No material orders yet." /> :
            orders.map(o=>{
              let cnt=0; try{cnt=JSON.parse(o.items||'[]').length;}catch{}
              return (
                <DrawerRow key={o.id}
                  left={<>
                    <div style={{fontWeight:600,fontSize:13,color:'#1a1a1a'}}>{o.supplier_name||'Order #'+o.id}</div>
                    <div style={{fontSize:11,color:'#aaa',marginTop:2}}>
                      {o.delivery_date?`Due: ${o.delivery_date} · `:''}
                      <span style={{background:statusBg(o.status),color:statusColor(o.status),
                        padding:'1px 7px',borderRadius:10,fontSize:10,fontWeight:700}}>{o.status}</span>
                      {cnt>0?` · ${cnt} items`:''}
                    </div>
                  </>}
                  right={<span style={{fontFamily:'monospace',fontWeight:700,color:'#E8471C',fontSize:14}}>₹{fmt(o.total_estimate)}</span>}
                />
              );
            })
          }
        </DrawerSection>

        {/* Other Expenses */}
        <DrawerSection title={`🧾 Other Expenses (${expenses.length})`}
          action={<button onClick={()=>setShowAddExp(true)}
            style={{padding:'4px 12px',background:'#E8471C',color:'#fff',border:'none',
              borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700}}>+ Add</button>}>
          {!expenses.length ? <DrawerEmpty text="No expenses yet. Click + Add to record one." /> :
            expenses.map(e=>(
              <DrawerRow key={e.id}
                left={<>
                  <div style={{fontWeight:600,fontSize:13,color:'#1a1a1a'}}>{e.description}</div>
                  <div style={{fontSize:11,color:'#aaa',marginTop:2}}>
                    {e.expense_date||'—'} · {e.category||'—'} · {e.paid_by||'—'}
                  </div>
                </>}
                right={
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontFamily:'monospace',fontWeight:700,color:'#c23a16',fontSize:14}}>₹{fmt(e.amount)}</span>
                    <button disabled={deleting===e.id}
                      onClick={async()=>{
                        if(!window.confirm('Delete this expense?'))return;
                        setDeleting(e.id);
                        try{await api.delete(`/project-expenses/${e.id}`);load();onExpenseAdded();}
                        catch{toast.error('Failed.');}
                        setDeleting(null);
                      }}
                      style={{background:'none',border:'1px solid #eee',borderRadius:5,
                        padding:'2px 7px',cursor:'pointer',fontSize:11,color:'#bbb'}}>
                      {deleting===e.id?'…':'✕'}
                    </button>
                  </div>
                }
              />
            ))
          }
        </DrawerSection>

        {/* ── Visit Reports ── */}
        <DrawerSection title={`📸 Visit Reports (${visits.length})`} action={
          <button onClick={() => setAddVisit(v => !v)}
            style={{padding:'4px 12px',background: addVisit ? '#555' : '#E8471C',color:'#fff',border:'none',
              borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700}}>
            {addVisit ? '✕ Cancel' : '+ Add'}
          </button>
        }>
          {/* Add Visit Form */}
          {addVisit && (
            <div style={{padding:'14px 16px',borderBottom:'1px solid #f0f0f0',background:'#fafafa'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:'#aaa',marginBottom:4,textTransform:'uppercase'}}>Visit Date *</div>
                  <input type="date" value={visitForm.visit_date}
                    onChange={e=>setVisitForm(f=>({...f,visit_date:e.target.value}))}
                    style={{width:'100%',padding:'7px 10px',border:'1.5px solid #e0e0e0',borderRadius:7,fontSize:12,fontFamily:'DM Sans,sans-serif',outline:'none',boxSizing:'border-box'}} />
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:'#aaa',marginBottom:4,textTransform:'uppercase'}}>Visit Time</div>
                  <input type="time" value={visitForm.visit_time}
                    onChange={e=>setVisitForm(f=>({...f,visit_time:e.target.value}))}
                    style={{width:'100%',padding:'7px 10px',border:'1.5px solid #e0e0e0',borderRadius:7,fontSize:12,fontFamily:'DM Sans,sans-serif',outline:'none',boxSizing:'border-box'}} />
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:'#aaa',marginBottom:4,textTransform:'uppercase'}}>Reported By</div>
                  <input type="text" placeholder="Name" value={visitForm.reported_by}
                    onChange={e=>setVisitForm(f=>({...f,reported_by:e.target.value}))}
                    style={{width:'100%',padding:'7px 10px',border:'1.5px solid #e0e0e0',borderRadius:7,fontSize:12,fontFamily:'DM Sans,sans-serif',outline:'none',boxSizing:'border-box'}} />
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:'#aaa',marginBottom:4,textTransform:'uppercase'}}>Notes</div>
                <textarea value={visitForm.notes} onChange={e=>setVisitForm(f=>({...f,notes:e.target.value}))}
                  placeholder="Site observations…"
                  style={{width:'100%',padding:'7px 10px',border:'1.5px solid #e0e0e0',borderRadius:7,fontSize:12,fontFamily:'DM Sans,sans-serif',outline:'none',resize:'vertical',minHeight:56,boxSizing:'border-box'}} />
              </div>
              {/* Files */}
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:'#aaa',marginBottom:4,textTransform:'uppercase'}}>
                  Files <span style={{color:'#E8471C'}}>* min 3</span>
                  <span style={{marginLeft:6,fontSize:10,fontWeight:700,
                    color:visitFiles.length>=3?'#15803d':'#E8471C',
                    background:visitFiles.length>=3?'#f0fdf4':'#fff8f5',
                    padding:'1px 6px',borderRadius:8}}>
                    {visitFiles.length}/3+
                  </span>
                </div>
                {visitFiles.length>0 && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                    {visitFiles.map((f,i)=>(
                      <span key={i} style={{display:'inline-flex',alignItems:'center',gap:5,
                        padding:'3px 8px',background:'#fff4f0',border:'1px solid rgba(232,71,28,0.2)',
                        borderRadius:6,fontSize:11,fontWeight:600,color:'#E8471C'}}>
                        📎 {f.name?.length>14?f.name.slice(0,14)+'…':f.name}
                        <button onClick={()=>setVisitFiles(p=>p.filter((_,j)=>j!==i))}
                          style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:13,padding:0,lineHeight:1}}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <div onClick={()=>fileRef.current?.click()}
                  style={{border:'2px dashed #e0e0e0',borderRadius:8,padding:'12px',textAlign:'center',
                    cursor:'pointer',fontSize:12,color:'#888',background:'#fafafa'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='#E8471C'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='#e0e0e0'}>
                  📎 Click to add files (photos, PDFs)
                </div>
                <input ref={fileRef} type="file" multiple style={{display:'none'}}
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={async e=>{
                    const sel=Array.from(e.target.files);
                    const readers=await Promise.all(sel.map(f=>new Promise(res=>{
                      const r=new FileReader();
                      r.onload=()=>res({name:f.name,type:f.type,data:r.result});
                      r.readAsDataURL(f);
                    })));
                    setVisitFiles(p=>[...p,...readers]);
                    e.target.value='';
                  }} />
              </div>
              <button
                disabled={visitSaving||visitFiles.length<3}
                onClick={async()=>{
                  if(!visitForm.visit_date){toast.error('Visit date required.');return;}
                  if(visitFiles.length<3){toast.error('Minimum 3 files required.');return;}
                  setVisitSaving(true);
                  try{
                    await api.post('/visit-reports',{
                      quotation_id:projectId,
                      visit_date:visitForm.visit_date,visit_time:visitForm.visit_time,
                      reported_by:visitForm.reported_by,notes:visitForm.notes,
                      files:visitFiles,
                    });
                    toast.success('Visit report saved!');
                    setVisitForm({visit_date:new Date().toISOString().slice(0,10),visit_time:'',reported_by:'',notes:''});
                    setVisitFiles([]);
                    setAddVisit(false);
                    load(true);
                  }catch(err){toast.error(err?.response?.data?.message||'Failed.');}
                  setVisitSaving(false);
                }}
                style={{width:'100%',padding:9,background:'#E8471C',color:'#fff',border:'none',
                  borderRadius:8,fontWeight:700,fontSize:13,cursor:visitFiles.length<3?'not-allowed':'pointer',
                  opacity:visitSaving||visitFiles.length<3?0.6:1}}>
                {visitSaving?'Saving…':'✅ Save Visit Report'}
              </button>
            </div>
          )}

          {/* File preview */}
          {viewFile && (
            <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={()=>setViewFile(null)}>
              <div style={{background:'#fff',borderRadius:14,padding:18,maxWidth:680,width:'100%',maxHeight:'85vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:13}}>{viewFile.name}</div>
                  <div style={{display:'flex',gap:8}}>
                    <a href={viewFile.data} download={viewFile.name} style={{padding:'5px 12px',background:'#E8471C',color:'#fff',borderRadius:7,textDecoration:'none',fontSize:12,fontWeight:700}}>⬇ Download</a>
                    <button onClick={()=>setViewFile(null)} style={{padding:'5px 10px',background:'#f0f0f0',border:'none',borderRadius:7,cursor:'pointer'}}>✕</button>
                  </div>
                </div>
                {viewFile.type?.startsWith('image/')?<img src={viewFile.data} alt={viewFile.name} style={{width:'100%',borderRadius:8}}/>:
                 viewFile.type==='application/pdf'?<iframe src={viewFile.data} style={{width:'100%',height:'60vh',border:'none',borderRadius:8}} title="PDF"/>:
                 <div style={{textAlign:'center',padding:32,color:'#aaa'}}><div style={{fontSize:40,marginBottom:10}}>📄</div><a href={viewFile.data} download={viewFile.name} style={{color:'#E8471C',fontWeight:700}}>Download</a></div>}
              </div>
            </div>
          )}

          {/* Visit list */}
          {!visits.length ? <DrawerEmpty text="No visit reports yet. Click + Add." /> :
            visits.map(v=>(
              <div key={v.id} style={{borderBottom:'1px solid #f8f8f8'}}>
                <div style={{padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:'#1a1a1a'}}>
                      📅 {new Date(v.visit_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                      {v.visit_time&&<span style={{fontSize:11,color:'#888',marginLeft:8}}>🕐 {v.visit_time}</span>}
                    </div>
                    <div style={{fontSize:11,color:'#aaa',marginTop:2}}>by {v.reported_by||'—'}</div>
                    {v.notes&&<div style={{fontSize:12,color:'#555',marginTop:4,fontStyle:'italic'}}>"{v.notes}"</div>}
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:'#888',background:'#f5f5f5',padding:'2px 8px',borderRadius:10}}>{v.files?.length||0} files</span>
                </div>
                {v.files?.length>0&&(
                  <div style={{padding:'6px 14px 10px',display:'flex',gap:6,flexWrap:'wrap'}}>
                    {v.files.map(f=>(
                      <button key={f.id}
                        onClick={async()=>{
                          try{const r=await api.get('/visit-report-files/'+f.id);setViewFile({name:f.file_name,type:f.file_type,data:r.data.data.file_data});}
                          catch{toast.error('Failed to load file.');}
                        }}
                        style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',
                          background:'#fff4f0',border:'1px solid rgba(232,71,28,0.2)',borderRadius:7,
                          cursor:'pointer',fontSize:11,fontWeight:600,color:'#E8471C'}}>
                        📎 {f.file_name?.length>16?f.file_name.slice(0,16)+'…':f.file_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          }
        </DrawerSection>

        {/* ── Completion Status ── */}
        <DrawerSection title="📊 Completion Status">
          <div style={{padding:'16px'}}>
            {/* Big percentage */}
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:48,fontWeight:800,lineHeight:1,
                color:compPct>=100?'#15803d':compPct>=75?'#10B981':compPct>=50?'#F59E0B':compPct>=25?'#E8471C':'#EF4444'}}>
                {compPct}%
              </div>
              <div style={{fontSize:13,fontWeight:700,marginTop:4,
                color:compPct>=100?'#15803d':compPct>=75?'#10B981':compPct>=50?'#F59E0B':compPct>=25?'#E8471C':'#EF4444'}}>
                {compPct>=100?'🎉 Completed!':compPct>=75?'Almost Done':compPct>=50?'Halfway There':compPct>=25?'In Progress':'Just Started'}
              </div>
            </div>
            {/* Drag bar */}
            <div style={{marginBottom:12}}>
              <div ref={trackRef}
                onClick={e=>{const rect=trackRef.current.getBoundingClientRect();setCompPct(Math.round(Math.max(0,Math.min((e.clientX-rect.left)/rect.width,1))*100));}}
                onMouseDown={e=>{
                  e.preventDefault();setCompDragging(true);
                  const move=ev=>{if(trackRef.current){const rect=trackRef.current.getBoundingClientRect();setCompPct(Math.round(Math.max(0,Math.min((ev.clientX-rect.left)/rect.width,1))*100));}};
                  const up=()=>{setCompDragging(false);document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);};
                  document.addEventListener('mousemove',move);document.addEventListener('mouseup',up);
                }}
                style={{height:24,background:'#f0f0f0',borderRadius:99,cursor:'pointer',position:'relative',userSelect:'none',border:'2px solid #e0e0e0'}}>
                <div style={{position:'absolute',left:0,top:0,bottom:0,borderRadius:99,
                  width:compPct+'%',
                  background:compPct>=100?'#15803d':compPct>=75?'#10B981':compPct>=50?'#F59E0B':compPct>=25?'#E8471C':'#EF4444',
                  transition:compDragging?'none':'width 0.3s',minWidth:compPct>0?24:0}}/>
                {[25,50,75].map(m=>(
                  <div key={m} style={{position:'absolute',left:m+'%',top:'50%',transform:'translate(-50%,-50%)',width:2,height:12,background:compPct>=m?'rgba(255,255,255,0.6)':'#ccc',borderRadius:99}}/>
                ))}
                <div style={{position:'absolute',left:compPct+'%',top:'50%',transform:'translate(-50%,-50%)',
                  width:26,height:26,background:'#fff',borderRadius:'50%',
                  border:`3px solid ${compPct>=100?'#15803d':compPct>=75?'#10B981':compPct>=50?'#F59E0B':compPct>=25?'#E8471C':'#EF4444'}`,
                  boxShadow:'0 2px 6px rgba(0,0,0,0.2)',cursor:'grab',transition:compDragging?'none':'left 0.15s'}}/>
              </div>
              {/* Quick presets */}
              <div style={{display:'flex',gap:5,marginTop:8,flexWrap:'wrap'}}>
                {[0,25,50,75,100].map(v=>(
                  <button key={v} onClick={()=>setCompPct(v)}
                    style={{padding:'3px 9px',border:`1.5px solid ${compPct===v?'#E8471C':'#e0e0e0'}`,
                      borderRadius:6,background:compPct===v?'#E8471C':'#fff',
                      color:compPct===v?'#fff':'#555',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                    {v}%
                  </button>
                ))}
              </div>
            </div>
            {/* Notes */}
            <textarea value={compNotes} onChange={e=>setCompNotes(e.target.value)}
              placeholder="Completion notes…"
              style={{width:'100%',padding:'8px 10px',border:'1.5px solid #e0e0e0',borderRadius:7,
                fontSize:12,fontFamily:'DM Sans,sans-serif',outline:'none',resize:'vertical',
                minHeight:56,boxSizing:'border-box',marginBottom:10}}/>
            <button onClick={async()=>{
                setCompSaving(true);
                try{
                  await api.post('/completion-status',{quotation_id:projectId,percentage:compPct,notes:compNotes,updated_by:'Admin'});
                  toast.success(`Updated to ${compPct}%`);
                  load(true);
                }catch{toast.error('Failed.');}
                setCompSaving(false);
              }}
              disabled={compSaving}
              style={{width:'100%',padding:9,background:'#E8471C',color:'#fff',border:'none',
                borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',opacity:compSaving?0.7:1}}>
              {compSaving?'Saving…':`✅ Save — ${compPct}% Complete`}
            </button>
          </div>
        </DrawerSection>

      </div>
    </div>
  );
}

function DrawerSection({ title, children, action }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <div style={{fontWeight:700,fontSize:13,color:'#1a1a1a'}}>{title}</div>
        {action}
      </div>
      <div style={{background:'#fff',border:'1px solid #f0f0f0',borderRadius:12,overflow:'hidden'}}>
        {children}
      </div>
    </div>
  );
}
function DrawerRow({ left, right }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'10px 14px',borderBottom:'1px solid #f8f8f8'}}>
      <div style={{flex:1,overflow:'hidden'}}>{left}</div>
      <div style={{flexShrink:0,marginLeft:12}}>{right}</div>
    </div>
  );
}
function DrawerEmpty({ text }) {
  return <div style={{padding:'18px 14px',fontSize:12,color:'#ccc',textAlign:'center'}}>{text}</div>;
}
function statusColor(s){return s==='Received'?'#15803d':s==='Ordered'?'#1d4ed8':s==='Cancelled'?'#b91c1c':'#b45309';}
function statusBg(s){return s==='Received'?'#f0fdf4':s==='Ordered'?'#eff6ff':s==='Cancelled'?'#fff0f0':'#fefce8';}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════ */
/* Small cell that loads completion % for a project */
function CompletionCell({ projectId }) {
  const [pct, setPct] = React.useState(null);
  React.useEffect(() => {
    api.get('/completion-status/' + projectId)
      .then(r => setPct(r.data.data?.percentage ?? 0))
      .catch(() => setPct(0));
  }, [projectId]);

  if (pct === null) return <div style={{color:'#ccc',fontSize:11}}>…</div>;
  const color = pct>=100?'#15803d':pct>=75?'#10B981':pct>=50?'#F59E0B':pct>=25?'#E8471C':'#aaa';
  return (
    <div>
      <div style={{fontFamily:'monospace',fontWeight:700,fontSize:13,color,marginBottom:3}}>{pct}%</div>
      <div style={{height:5,background:'#f0f0f0',borderRadius:99,overflow:'hidden'}}>
        <div style={{height:'100%',width:pct+'%',background:color,borderRadius:99,transition:'width 0.5s'}}/>
      </div>
    </div>
  );
}

export default function ProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [sortBy,   setSortBy]   = useState('created_at');

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    api.get('/project-dashboard')
      .then(r => {
        if (r.data.success) { setProjects(r.data.data||[]); setSummary(r.data.summary); }
        else if (!silent) toast.error(r.data.message||'Failed to load.');
      })
      .catch(err => {
        if (!silent) {
          toast.error(err?.response?.data?.message||err.message||'Failed.');
          console.error('Project dashboard error:', err.message);
        }
      })
      .finally(() => { if (!silent) setLoading(false); });
  }, []);

  useEffect(() => {
    load();
    return () => {};
  }, [load]);

  const filtered = projects
    .filter(p => {
      const q = search.toLowerCase();
      return !q
        || (p.site_name||'').toLowerCase().includes(q)
        || (p.customer_name||'').toLowerCase().includes(q)
        || (p.location||'').toLowerCase().includes(q)
        || (p.site_manager_name||'').toLowerCase().includes(q);
    })
    .sort((a,b) => {
      if (sortBy==='grand_total')    return b.grand_total    - a.grand_total;
      if (sortBy==='total_paid')     return b.total_paid     - a.total_paid;
      if (sortBy==='balance_due')    return b.balance_due    - a.balance_due;
      if (sortBy==='total_expenses') return b.total_expenses - a.total_expenses;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const sumCol = (key) => filtered.reduce((s,p)=>s+Number(p[key]||0), 0);

  return (
    <div style={{fontFamily:'DM Sans,sans-serif',minHeight:'100vh',background:'#f9f9fb'}}>

      {/* Detail drawer overlay */}
      {selected && (
        <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex'}}
          onClick={()=>setSelected(null)}>
          {/* Dim backdrop */}
          <div style={{flex:1,background:'rgba(0,0,0,0.25)'}} />
          {/* Drawer */}
          <div style={{width:520,background:'#fff',boxShadow:'-8px 0 40px rgba(0,0,0,0.15)',
            display:'flex',flexDirection:'column'}}
            onClick={e=>e.stopPropagation()}>
            <ProjectDetail projectId={selected} onClose={()=>setSelected(null)} onExpenseAdded={load} />
          </div>
        </div>
      )}

      <div style={{padding:'32px 36px',maxWidth:1440,margin:'0 auto'}}>

        {/* ── Header ── */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',
          flexWrap:'wrap',gap:16,marginBottom:28}}>
          <div>
            <h1 style={{margin:0,fontSize:26,fontWeight:800,color:'#1a1a1a',
              display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:24}}>📊</span> Project Dashboard
            </h1>
            <p style={{margin:'5px 0 0',fontSize:13,color:'#aaa'}}>
              All booked projects — financials at a glance
            </p>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',
                fontSize:14,color:'#bbb'}}>🔍</span>
              <input placeholder="Search project, client, manager…"
                value={search} onChange={e=>setSearch(e.target.value)}
                style={{padding:'9px 14px 9px 36px',border:'1.5px solid #e8e8e8',
                  borderRadius:10,fontSize:13,outline:'none',minWidth:260,
                  fontFamily:'DM Sans,sans-serif',background:'#fff',
                  transition:'border-color 0.2s'}}
                onFocus={e=>e.target.style.borderColor='#E8471C'}
                onBlur={e=>e.target.style.borderColor='#e8e8e8'} />
            </div>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              style={{padding:'9px 14px',border:'1.5px solid #e8e8e8',borderRadius:10,
                fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif',
                background:'#fff',outline:'none',color:'#555'}}>
              <option value="created_at">Sort: Latest</option>
              <option value="grand_total">Sort: Total Cost</option>
              <option value="total_paid">Sort: Paid</option>
              <option value="balance_due">Sort: Balance</option>
              <option value="total_expenses">Sort: Expenses</option>
            </select>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {summary && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:28}}>
            {[
              {label:'Total Projects',  value:summary.project_count, isNum:true, accent:'#64748b'},
              {label:'Total Value',     value:fmtK(summary.total_value),    accent:'#1a1a1a'},
              {label:'Total Received',  value:fmtK(summary.total_paid),     accent:'#16a34a'},
              {label:'Total Balance',   value:fmtK(summary.total_balance),  accent:'#E8471C'},
              {label:'Total Expenses',  value:fmtK(summary.total_expenses), accent:'#c23a16'},
              {label:'Total Area',      value:(Number(summary.total_sft)||0).toLocaleString('en-IN')+' SFT', accent:'#7C3AED'},
              {label:'Profit Estimate', value:fmtK(summary.profit_estimate),
                accent:summary.profit_estimate>=0?'#16a34a':'#dc2626'},
            ].map(k=>(
              <div key={k.label} style={{background:'#fff',borderRadius:14,
                padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                border:'1px solid #f0f0f0',position:'relative',overflow:'hidden'}}>
                {/* top accent bar */}
                <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:k.accent}}/>
                <div style={{fontSize:10,fontWeight:700,color:'#aaa',textTransform:'uppercase',
                  letterSpacing:0.8,marginBottom:8}}>{k.label}</div>
                <div style={{fontFamily:k.isNum?'DM Sans,sans-serif':'monospace',
                  fontSize:k.isNum?28:20,fontWeight:800,color:k.accent,lineHeight:1}}>
                  {k.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Table ── */}
        {loading ? (
          <div style={{background:'#fff',borderRadius:16,padding:60,textAlign:'center',
            color:'#bbb',fontSize:14,border:'1px solid #f0f0f0'}}>
            <div style={{fontSize:32,marginBottom:12}}>⏳</div>
            Loading projects…
          </div>
        ) : !filtered.length ? (
          <div style={{background:'#fff',borderRadius:16,padding:60,textAlign:'center',
            border:'1px solid #f0f0f0'}}>
            <div style={{fontSize:40,marginBottom:12}}>📂</div>
            <div style={{fontSize:15,fontWeight:700,color:'#555',marginBottom:6}}>No booked projects found</div>
            <div style={{fontSize:13,color:'#aaa'}}>Mark a quotation as "Booked" to see it here.</div>
          </div>
        ) : (
          <>
            {/* ── Project Cards Grid ── */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:22,marginBottom:28}}>
              {filtered.map(p => {
                const paidPct   = p.grand_total>0 ? Math.min(Math.round((p.total_paid/p.grand_total)*100),100) : 0;
                const profitPos = p.profit_estimate >= 0;
                return (
                  <div key={p.id}
                    onClick={() => setSelected(p.id)}
                    style={{
                      background:'#fff', borderRadius:16,
                      border:'1.5px solid #f0ece8',
                      padding:'28px 30px',
                      cursor:'pointer',
                      boxShadow:'0 2px 10px rgba(0,0,0,0.06)',
                      transition:'box-shadow 0.18s, transform 0.18s, background 0.15s',
                      display:'flex', flexDirection:'column', gap:0,
                    }}
                    onMouseEnter={e=>{ e.currentTarget.style.background='#fff8f5'; e.currentTarget.style.boxShadow='0 6px 24px rgba(232,71,28,0.13)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background='#fff'; e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.06)'; e.currentTarget.style.transform='translateY(0)'; }}>

                    {/* Client name + BOOKED badge */}
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4}}>
                      <div style={{fontWeight:800,fontSize:22,color:'#E8471C',
                        fontFamily:"'DM Sans',sans-serif",lineHeight:1.2,
                        flex:1,minWidth:0,paddingRight:8,wordBreak:'break-word'}}>
                        {p.customer_name}
                      </div>
                      <span style={{background:'rgba(232,71,28,0.1)',color:'#E8471C',
                        padding:'3px 10px',borderRadius:6,fontSize:10,fontWeight:800,
                        flexShrink:0,letterSpacing:0.5}}>BOOKED</span>
                    </div>

                    {/* Site name */}
                    <div style={{fontSize:14,color:'#555',fontWeight:700,marginBottom:3}}>
                      {p.site_name || p.location || '—'}
                    </div>

                    {/* Location */}
                    {p.location && p.site_name && (
                      <div style={{fontSize:11,color:'#999',marginBottom:6}}>{p.location}</div>
                    )}

                    {/* Site manager */}
                    {p.site_manager_name && (
                      <div style={{fontSize:13,color:'#7C3AED',fontWeight:700,marginBottom:12,
                        display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontSize:13}}>👷</span>
                        <span>{p.site_manager_name}{p.site_manager_branch?` · ${p.site_manager_branch}`:''}</span>
                      </div>
                    )}

                    {/* Dates + SFT */}
                    {(p.project_start_date || p.project_end_date || Number(p.total_sft)>0) && (
                      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                        {p.project_start_date && (
                          <span style={{fontSize:10,fontWeight:700,color:'#15803d',
                            background:'#f0fdf4',padding:'2px 8px',borderRadius:5}}>
                            ▶ {new Date(p.project_start_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                          </span>
                        )}
                        {p.project_end_date && (
                          <span style={{fontSize:10,fontWeight:700,color:'#E8471C',
                            background:'#fff8f5',padding:'2px 8px',borderRadius:5}}>
                            ⏹ {new Date(p.project_end_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                          </span>
                        )}
                        {Number(p.total_sft)>0 && (
                          <span style={{fontSize:10,fontWeight:700,color:'#7C3AED',
                            background:'#f5f0ff',padding:'2px 8px',borderRadius:5}}>
                            📐 {Number(p.total_sft).toLocaleString('en-IN')} SFT
                          </span>
                        )}
                      </div>
                    )}

                    {/* Payment progress */}
                    <div style={{marginBottom:8}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#888',marginBottom:4}}>
                        <span style={{fontWeight:600}}>Payment Progress</span>
                        <span style={{fontWeight:800,color:paidPct===100?'#10B981':'#E8471C',fontSize:12}}>{paidPct}%</span>
                      </div>
                      <div style={{height:9,background:'#f0f0f0',borderRadius:99,overflow:'hidden'}}>
                        <div style={{height:'100%',width:paidPct+'%',
                          background:paidPct===100?'#10B981':'#E8471C',
                          borderRadius:99,transition:'width 0.5s'}}/>
                      </div>
                    </div>

                    {/* Project completion */}
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:11,color:'#888',fontWeight:600,marginBottom:4}}>Project Completion</div>
                      <CompletionCell projectId={p.id} />
                    </div>

                    {/* Divider */}
                    <div style={{height:1,background:'#f5f0ec',marginBottom:10}}/>

                    {/* Financial rows */}
                    <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:10}}>
                      {[
                        {label:'Total',    value:fmt(p.grand_total),     color:'#1a1a1a'},
                        {label:'Paid',     value:fmt(p.total_paid),      color:'#10B981'},
                        {label:'Balance',  value:fmt(p.balance_due),     color:p.balance_due>0?'#E8471C':'#10B981'},
                        {label:'Material', value:fmt(p.material_cost),   color:'#c23a16'},
                        {label:'Other Exp',value:fmt(p.other_expenses),  color:'#c23a16'},
                        {label:'Profit Est',value:(profitPos?'+':'')+fmt(p.profit_estimate), color:profitPos?'#16a34a':'#dc2626'},
                      ].map(row=>(
                        <div key={row.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:12,color:'#999'}}>{row.label}</span>
                          <span style={{fontWeight:700,fontSize:13,fontFamily:'monospace',color:row.color}}>₹{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* View button */}
                    <div style={{textAlign:'right',marginTop:'auto'}}>
                      <span style={{fontSize:12,color:'#E8471C',fontWeight:700,
                        padding:'5px 12px',background:'rgba(232,71,28,0.07)',
                        borderRadius:6,whiteSpace:'nowrap'}}>View →</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Totals summary ── */}
            {filtered.length > 1 && (() => {
              const profitTotal = sumCol('profit_estimate');
              const sftTotal    = sumCol('total_sft');
              const tiles = [
                { label:'Total Value',     value:fmt(sumCol('grand_total')),    color:'#1a1a1a', bg:'#f8f8f8',     icon:'💰', prefix:'₹' },
                { label:'Total Paid',      value:fmt(sumCol('total_paid')),     color:'#16a34a', bg:'#f0fdf4',     icon:'✅', prefix:'₹' },
                { label:'Total Balance',   value:fmt(sumCol('balance_due')),    color:'#E8471C', bg:'#fff8f5',     icon:'⏳', prefix:'₹' },
                { label:'Material Cost',   value:fmt(sumCol('material_cost')),  color:'#c23a16', bg:'#fff5f0',     icon:'🪵', prefix:'₹' },
                { label:'Other Expenses',  value:fmt(sumCol('other_expenses')), color:'#c23a16', bg:'#fff5f0',     icon:'🧾', prefix:'₹' },
                { label:'Profit Estimate', value:(profitTotal>=0?'+':'')+fmt(profitTotal),
                  color:profitTotal>=0?'#16a34a':'#dc2626',
                  bg:profitTotal>=0?'#f0fdf4':'#fef2f2',                                        icon:'📈', prefix:'₹' },
                ...(sftTotal>0
                  ? [{ label:'Total Area', value:sftTotal.toLocaleString('en-IN')+' SFT', color:'#7C3AED', bg:'#f5f0ff', icon:'📐', prefix:'' }]
                  : []),
              ];
              return (
                <div style={{borderRadius:16,overflow:'hidden',border:'1.5px solid #ebebeb',
                  boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
                  {/* Header strip */}
                  <div style={{background:'linear-gradient(135deg,#1a1a1a,#2d1200)',
                    padding:'14px 24px',display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:16}}>📊</span>
                    <div>
                      <div style={{fontWeight:800,fontSize:14,color:'#fff',
                        fontFamily:"'DM Sans',sans-serif"}}>
                        Portfolio Summary
                      </div>
                      <div style={{fontSize:11,color:'#aaa',marginTop:1}}>
                        {filtered.length} booked project{filtered.length>1?'s':''} · combined totals
                      </div>
                    </div>
                  </div>
                  {/* Tiles grid */}
                  <div style={{display:'grid',
                    gridTemplateColumns:`repeat(${tiles.length},1fr)`,
                    background:'#fff'}}>
                    {tiles.map((t, i) => (
                      <div key={t.label} style={{
                        padding:'20px 20px',
                        borderRight: i < tiles.length-1 ? '1px solid #f0f0f0' : 'none',
                        background:t.bg,
                        position:'relative',overflow:'hidden',
                      }}>
                        {/* top accent */}
                        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:t.color,opacity:0.5}}/>
                        <div style={{fontSize:11,color:'#aaa',fontWeight:700,
                          textTransform:'uppercase',letterSpacing:0.6,marginBottom:8,
                          display:'flex',alignItems:'center',gap:5}}>
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </div>
                        <div style={{fontFamily:'monospace',fontWeight:800,fontSize:18,
                          color:t.color,lineHeight:1}}>
                          {t.prefix}{t.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}

const TG   = '2fr 0.9fr 1fr 1.2fr 0.9fr 0.9fr 0.9fr 0.8fr 0.8fr 0.8fr 0.8fr 0.5fr';
const COLS = ['Project / Client','Manager','Total Cost','Paid','Balance','Material','Other Exp.','Profit Est.','SFT','Dates','Done',''];
