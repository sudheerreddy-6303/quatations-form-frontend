import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './ProjectManagement.css';

/* ── Section definitions ──────────────────────────────────────── */
const SECTIONS = [
  { id: 'ply', label: 'Plywood & Board',     icon: '🪵' },
  { id: 'lam', label: 'Laminates & Veneers', icon: '🎨' },
  { id: 'hdw', label: 'Hardware & Fittings', icon: '🔩' },
  { id: 'edg', label: 'Edge Banding',         icon: '📏' },
  { id: 'adh', label: 'Adhesives & Fillers', icon: '🧴' },
  { id: 'fns', label: 'Finish & Polish',      icon: '✨' },
  { id: 'ele', label: 'Electrical',           icon: '⚡' },
  { id: 'mbl', label: 'Marble & Stone',       icon: '🪨' },
];

/* ── Category & Sub-category master data ───────────────────────── */
const ORDER_CATEGORY_DATA = {
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
      'Hinges':              ['Concealed Hinge','Piano Hinge','Butterfly Hinge','Hydraulic Hinge','Soft-close Hinge'],
      'Handles & Knobs':     ['Profile Handle','Bar Handle','Flush Handle','Knob','Finger Pull'],
      'Drawer Systems':      ['Undermount Drawer','Telescopic Channel','Soft-close Drawer','Tandem Box'],
      'Channels':            ['Ball-bearing Channel','Roller Channel','Side Mount Channel','Bottom Mount Channel'],
      'Locks & Latches':     ['Cupboard Lock','Drawer Lock','Cam Lock','Magnetic Catch','Ball Catch'],
      'Screws & Fasteners':  ['Wood Screw','Dowel Pin','Confirmat Screw','Furniture Bolt','T-nut'],
      'Soft-close Mechanisms':['Door Damper','Drawer Damper','Flap Stay','Lid Support'],
      'Shelf Supports':      ['Shelf Pin','Shelf Bracket','Adjustable Shelf Clip'],
      'Casters & Wheels':    ['Swivel Caster','Fixed Caster','Leveling Leg','Glide Foot'],
      'Door Accessories':    ['Magnetic Door Stop','Door Bumper','Floor Spring','Door Closer'],
      'Wardrobe Fittings':   ['Hanging Rail','Trouser Rack','Tie Rack','Shoe Rack','Magic Corner'],
      'Miscellaneous Hardware':['Cabinet Jack','Edging Strip','PVC Edge Band','Aluminium Edge Band'],
    }
  },
  Laminates: {
    icon: '🎨',
    subcategories: {
      'High Pressure Laminate (HPL)':     ['0.8mm','1mm','1.5mm','Suede Finish','Gloss Finish','Matt Finish','Texture Finish'],
      'Compact Laminate':                 ['2mm','3mm','4mm','6mm','8mm','10mm'],
      'Low Pressure Laminate (LPL)':      ['0.5mm','0.8mm','Pre-laminated on Board'],
      'Acrylic Laminate / Acrylic Sheet': ['1mm','2mm','3mm','High Gloss','Matte'],
      'PVC Laminate / PVC Film':          ['0.3mm','0.5mm','0.8mm','1mm'],
      'Veneer':                           ['0.3mm Raw Veneer','0.6mm Raw Veneer','Pre-polished Veneer','Recon Veneer'],
      'Decorative Foil / Membrane':       ['Flat Foil','3D PVC Membrane','Vinyl Wrap'],
      'Sunmica (Brand Name - HPL)':       ['Matt','Gloss','Metallic','Woodgrain','Plain Colour'],
      'Merino / Century / Greenlam':      ['0.8mm Standard','1mm Standard','Designer Series'],
      'Cladding Sheet':                   ['Aluminium Cladding','ACP Sheet','Fibre Cement Board'],
    }
  },
  Transport: {
    icon: '🚚',
    subcategories: {
      'Material Transport':     ['Within City','Outstation','Site Delivery','Warehouse to Site'],
      'Labour Transport':       ['Daily Pick-up','Project Duration','Outstation'],
      'Equipment Transport':    ['Crane Hire','Forklift','Goods Lift','Truck Hire'],
      'Courier / Parcel':       ['Local Courier','Intercity Courier','Overnight Delivery'],
      'Loading & Unloading':    ['Manual Loading','Mechanized Loading','Crane Loading'],
      'Fuel & Vehicle Expense': ['Diesel','Petrol','Vehicle Maintenance','Toll & Parking'],
    }
  },
  Labour: {
    icon: '👷',
    subcategories: {
      'Carpenter':          ['Daily Wage','Contract Basis','Skilled Carpenter','Semi-skilled Carpenter'],
      'Helper / Mazdoor':   ['Daily Wage','Contract Basis','Helper','Unskilled Labour'],
      'Painter':            ['Per Day','Per SFT','Texture Work','Polish Work','PU Finish'],
      'Electrician':        ['Daily Wage','Point Basis','Wiring Work','Fitting Work'],
      'Plumber':            ['Daily Wage','Point Basis','Civil Plumbing','Sanitary Fitting'],
      'Civil Labour':       ['Masonry','Plastering','Tiling','Demolition','False Ceiling'],
      'Fabrication Labour': ['Steel Fabrication','Aluminium Fabrication','Glass Work'],
      'Polishing Labour':   ['Wood Polish','Melamine Finish','PU Polish','French Polish'],
      'Contractor':         ['Civil Contractor','Interior Contractor','Labour Contractor'],
      'Supervisor':         ['Site Supervisor','Project Manager','Quality Inspector'],
    }
  },
  'Civil & Masonry': {
    icon: '🏗',
    subcategories: {
      'Sand & Aggregates':      ['River Sand','M-Sand','P-Sand','Coarse Aggregate 20mm','Coarse Aggregate 10mm','Quarry Dust'],
      'Cement':                 ['OPC 43 Grade','OPC 53 Grade','PPC Cement','White Cement','Rapid Hardening Cement'],
      'Bricks & Blocks':        ['Red Brick','Fly Ash Brick','AAC Block','CLC Block','Paver Block','Curbstone'],
      'Steel & Reinforcement':  ['TMT Bar 8mm','TMT Bar 10mm','TMT Bar 12mm','TMT Bar 16mm','Binding Wire','Mesh'],
      'Tiles & Flooring':       ['Vitrified Tile','Ceramic Tile','Parking Tile','Mosaic Tile','Marble Slab','Granite Slab'],
      'Waterproofing':          ['Dr. Fixit','SBR Polymer','Bitumen','APP Membrane','Crystalline Compound'],
      'Admixtures':             ['Plasticizer','Superplasticizer','Retarder','Accelerator','Anti-shrink Compound'],
    }
  },
  Glass: {
    icon: '🪟',
    subcategories: {
      'Clear Float Glass':             ['3mm','4mm','5mm','6mm','8mm','10mm','12mm'],
      'Toughened Glass':               ['4mm','6mm','8mm','10mm','12mm'],
      'Frosted / Sandblasted':         ['4mm','6mm','8mm'],
      'Lacquered / Back-painted Glass':['4mm','6mm'],
      'Mirror':                        ['3mm','4mm','5mm'],
      'Spider Glass Fitting':          ['Clamp Fitting','Patch Fitting','Frame Fitting'],
      'Glass Partition':               ['Frameless','Framed Aluminium','UPVC Frame'],
      'Louver / Jalousie':             ['Clear','Frosted','Tinted'],
    }
  },
  Paints: {
    icon: '🖌',
    subcategories: {
      'Primer':            ['Wall Primer','Wood Primer','Metal Primer','Anti-corrosive Primer'],
      'Interior Emulsion': ['Flat / Matte','Eggshell','Satin','Washable Emulsion'],
      'Exterior Emulsion': ['Weather Coat','Elastomeric Paint','Textured Finish'],
      'Enamel / Gloss':    ['Oil-based Enamel','Acrylic Enamel','High Gloss','Semi-gloss'],
      'Wood Finish':       ['Melamine','PU (Polyurethane)','NC Lacquer','French Polish','Wax Polish'],
      'Putty & Filler':    ['Wall Putty','Wood Filler','Crack Filler','Gypsum Plaster'],
      'Texture Coat':      ['Sand Texture','Pebble Dash','Smooth Texture','Venetian Plaster'],
      'Waterproof Paint':  ['Bituminous Coating','Polymer Coating','Epoxy Coating'],
    }
  },
  Electrical: {
    icon: '⚡',
    subcategories: {
      'Wiring & Cables':     ['1.5 Sq mm','2.5 Sq mm','4 Sq mm','6 Sq mm','10 Sq mm','Armoured Cable'],
      'Switches & Sockets':  ['Modular Switch','Socket Outlet','MCB Switch','RCCB'],
      'Lights & Fittings':   ['LED Strip','Downlight','Spot Light','Chandelier','Batten Light','Panel Light'],
      'Distribution Board':  ['MCB Box','MCCB','ELCB / RCCB','Isolator','DB Board'],
      'Conduit & Accessories':['PVC Conduit','Flexible Conduit','Junction Box','Cable Tray'],
      'Fans & Exhaust':      ['Ceiling Fan','Exhaust Fan','Fresh Air Fan','HVLS Fan'],
      'AC & HVAC':           ['Split AC Unit','Cassette AC','Duct AC','Ventilation Unit'],
      'Generator & UPS':     ['Generator Hire','Inverter','UPS System','Battery','Solar Panel'],
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
      'Gypsum Board':         ['9mm Standard','12.5mm Standard','12.5mm Moisture Resistant','15mm Fire Rated'],
      'Grid Ceiling (T-Bar)': ['600x600 Mineral Fibre','600x600 PVC Tile','600x600 Metal Tile'],
      'PVC False Ceiling':    ['Plain','Printed','Wooden Finish','0.8mm','1mm'],
      'Metal / GI Ceiling':   ['Baffle Ceiling','Linear Ceiling','Cassette Panel','Perforated Panel'],
      'Wooden False Ceiling':  ['Solid Wood Panel','Engineered Wood','WPC Panel'],
      'Partition Wall':        ['Gypsum Partition','Glass Partition','Aluminium Partition','Wooden Partition'],
      'Suspension System':     ['Flat Hanger','Adjustable Hanger','Main Channel','Cross Channel','Wall Angle'],
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
      'Site Overhead':      ['Site Rent','Security','Housekeeping','Temporary Shed','Safety Equipment'],
      'Office Expense':     ['Printing','Stationery','Design Software','Travel Expense','Communication'],
      'Tools & Equipment':  ['Power Tools','Hand Tools','Scaffolding','Safety Harness','Measuring Instrument'],
      'Consumables':        ['Sand Paper','Masking Tape','Brush','Roller','Solvents','Cleaning Materials'],
      'Documentation':      ['NOC Charges','Approval Fees','Liaisoning','Permit','Registration'],
      'Bank & Finance':     ['Bank Charges','Interest','GST Payment','TDS','Professional Tax'],
      'Other':              ['As per Site Requirement','Contingency','Unforeseen Expense'],
    }
  },
};

const ORDER_CATEGORIES   = Object.keys(ORDER_CATEGORY_DATA);
const ORDER_PAYMENT_MODES = ['Cash','UPI','NEFT','RTGS','Cheque','Bank Transfer','Card','Credit'];
const ORDER_BUILD_BY      = ['In-house Team','Sub-contractor','Vendor','Direct Labour'];
const ORDER_APPROVED_BY   = ['Manager','Director','Site Supervisor','Owner','Project Head'];
const ORDER_GST_OPTIONS   = ['No GST','5%','12%','18%','28%'];

const STATUS_COLORS = {
  Pending:   { bg:'#FFF9E6', color:'#B45309', border:'#FCD34D' },
  Ordered:   { bg:'#EFF6FF', color:'#1D4ED8', border:'#93C5FD' },
  Received:  { bg:'#F0FDF4', color:'#15803D', border:'#86EFAC' },
  Cancelled: { bg:'#FFF0F0', color:'#B91C1C', border:'#FECACA' },
};

const fmt = n => Number(n||0).toLocaleString('en-IN');

/* ── Row helpers ──────────────────────────────────────────────── */
const newGenericRow  = () => ({ id: Date.now()+Math.random(), name:'', qty:'', unit:'', unitPrice:'' });
const newLaminateRow = () => ({ id: Date.now()+Math.random(), catalog:'', colourCode:'', qty:'', unit:'', unitPrice:'' });

function emptyRows() {
  const r = {};
  SECTIONS.forEach(s => { r[s.id] = []; });
  return r;
}

/* ── Quotation item renderer ──────────────────────────────────── */
function QuotationItems({ quotation }) {
  const rooms    = quotation?.rooms    || {};
  const sections = quotation?.ceiling_data || {};
  const hasRooms = Object.keys(rooms).length > 0;

  if (!hasRooms) return (
    <div style={{padding:'16px 20px',color:'#aaa',fontSize:13,textAlign:'center'}}>
      No room items found in this quotation.
    </div>
  );

  return (
    <div style={{padding:'0 0 4px'}}>
      {Object.entries(rooms).map(([key, room]) => {
        if (!room?.items?.length) return null;
        return (
          <div key={key} style={{marginBottom:8}}>
            <div style={{padding:'7px 16px',background:'#f8f8f8',borderLeft:'3px solid #E8471C',
              fontWeight:700,fontSize:12,color:'#1a1a1a',display:'flex',justifyContent:'space-between'}}>
              <span>{room.label || key}</span>
              <span style={{color:'#E8471C',fontFamily:'monospace'}}>
                ₹{fmt(room.items.reduce((s,it) => {
                  if (key==='accessories') return s + (it.nos||0)*(it.unitCost||0);
                  const w=parseFloat(it.width)||0, h=parseFloat(it.height)||0, n=parseFloat(it.nos)||0;
                  if (it.type==='FIXED') return s + (it.unitCost||0)*(n||1);
                  if (!w||!h) return s + n*(it.unitCost||0);
                  return s + parseFloat(((w*h*n)/144).toFixed(2))*(it.unitCost||0);
                }, 0))}
              </span>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead>
                <tr style={{background:'#fafafa'}}>
                  {key==='accessories'
                    ? ['Item','Nos','Unit Cost','Total'].map(h => <th key={h} style={TH}>{h}</th>)
                    : ['Item','W','H','Nos','SFT','Type','Rate','Total'].map(h => <th key={h} style={TH}>{h}</th>)
                  }
                </tr>
              </thead>
              <tbody>
                {room.items.map((it, i) => {
                  const w=parseFloat(it.width)||0, h=parseFloat(it.height)||0, n=parseFloat(it.nos)||0;
                  let area=0, total=0;
                  if (key==='accessories') {
                    total = (it.nos||0)*(it.unitCost||0);
                  } else if (it.type==='FIXED') {
                    total = (it.unitCost||0)*(n||1);
                  } else if (!w||!h) {
                    total = n*(it.unitCost||0);
                  } else {
                    area = parseFloat(((w*h*n)/144).toFixed(2));
                    total = area*(it.unitCost||0);
                  }
                  return (
                    <tr key={i} style={{background:i%2?'#fafafa':'#fff'}}>
                      <td style={TD}>{it.name}</td>
                      {key==='accessories' ? <>
                        <td style={{...TD,textAlign:'center'}}>{it.nos}</td>
                        <td style={{...TD,textAlign:'right'}}>₹{fmt(it.unitCost)}</td>
                        <td style={{...TD,textAlign:'right',fontWeight:700,color:'#E8471C'}}>₹{fmt(total)}</td>
                      </> : <>
                        <td style={{...TD,textAlign:'center'}}>{it.type!=='FIXED'?it.width:''}</td>
                        <td style={{...TD,textAlign:'center'}}>{it.type!=='FIXED'?it.height:''}</td>
                        <td style={{...TD,textAlign:'center'}}>{it.nos}</td>
                        <td style={{...TD,textAlign:'center',color:'#E8471C'}}>{area||'—'}</td>
                        <td style={{...TD,textAlign:'center',fontSize:10}}>{it.type}</td>
                        <td style={{...TD,textAlign:'right'}}>₹{fmt(it.unitCost)}</td>
                        <td style={{...TD,textAlign:'right',fontWeight:700,color:'#E8471C'}}>₹{fmt(total)}</td>
                      </>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
      {/* Sections (electrical, wooden, etc.) */}
      {Object.entries(sections).filter(([,sec])=>sec?.items?.length).map(([key,sec]) => (
        <div key={key} style={{marginBottom:8}}>
          <div style={{padding:'7px 16px',background:'#f5f0ff',borderLeft:'3px solid #7c3aed',
            fontWeight:700,fontSize:12,color:'#4c1d95',display:'flex',justifyContent:'space-between'}}>
            <span>{sec.label || key}</span>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr style={{background:'#fafafa'}}>
              {['Item','W','H','Nos','SFT','Type','Rate','Total'].map(h=><th key={h} style={TH}>{h}</th>)}
            </tr></thead>
            <tbody>
              {sec.items.map((it,i)=>{
                const w=parseFloat(it.width)||0, h=parseFloat(it.height)||0, n=parseFloat(it.nos)||0;
                let area=0, total=0;
                if (it.type==='FIXED') { total=(it.unitCost||0)*(n||1); }
                else if (!w||!h) { total=n*(it.unitCost||0); }
                else { area=parseFloat(((w*h*n)/144).toFixed(2)); total=area*(it.unitCost||0); }
                return (
                  <tr key={i} style={{background:i%2?'#fafafa':'#fff'}}>
                    <td style={TD}>{it.name}</td>
                    <td style={{...TD,textAlign:'center'}}>{it.type!=='FIXED'?it.width:''}</td>
                    <td style={{...TD,textAlign:'center'}}>{it.type!=='FIXED'?it.height:''}</td>
                    <td style={{...TD,textAlign:'center'}}>{it.nos}</td>
                    <td style={{...TD,textAlign:'center',color:'#7c3aed'}}>{area||'—'}</td>
                    <td style={{...TD,textAlign:'center',fontSize:10}}>{it.type}</td>
                    <td style={{...TD,textAlign:'right'}}>₹{fmt(it.unitCost)}</td>
                    <td style={{...TD,textAlign:'right',fontWeight:700,color:'#7c3aed'}}>₹{fmt(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

/* ── Order Form ───────────────────────────────────────────────── */
const newOrderItem = () => ({
  id: Date.now() + Math.random(),
  category: '', sub_category: '', item_name: '',
  qty: '', unit: 'PCS', unit_price: '',
});

function OrderForm({ project, existingOrder, onSaved, onCancel }) {
  const projectLabel = project.site_name || project.customer_name || 'Project';

  // Parse existing items into new row format
  const parseExistingItems = () => {
    if (!existingOrder?.items) return [newOrderItem()];
    let items = existingOrder.items;
    if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }
    if (!Array.isArray(items) || items.length === 0) return [newOrderItem()];
    return items.map(it => ({
      id: Date.now() + Math.random(),
      category:     it.category     || it.section || '',
      sub_category: it.sub_category || it.colourCode || '',
      item_name:    it.item_name    || it.name || it.catalog || '',
      qty:          it.qty          != null ? String(it.qty) : '',
      unit:         it.unit         || 'PCS',
      unit_price:   it.unit_price   != null ? String(it.unit_price)
                  : it.unitPrice    != null ? String(it.unitPrice) : '',
    }));
  };

  const [items,        setItems]        = useState(parseExistingItems);
  const [supplierName, setSupplierName] = useState(existingOrder?.supplier_name || '');
  const [deliveryDate, setDeliveryDate] = useState(existingOrder?.delivery_date || '');
  const [paymentMode,  setPaymentMode]  = useState(existingOrder?.payment_mode  || 'Cash');
  const [buildBy,      setBuildBy]      = useState(existingOrder?.build_by      || '');
  const [approvedBy,   setApprovedBy]   = useState(existingOrder?.approved_by   || '');
  const [gst,          setGst]          = useState(existingOrder?.gst           || 'No GST');
  const [billAttached, setBillAttached] = useState(existingOrder?.bill_attached || 'No');
  const [orderNotes,   setOrderNotes]   = useState(existingOrder?.notes         || '');
  const [status,       setStatus]       = useState(existingOrder?.status        || 'Pending');
  const [submitting,   setSubmitting]   = useState(false);

  const updateItem = (id, field, val) =>
    setItems(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  const updateItemCategory = (id, val) =>
    setItems(prev => prev.map(r => r.id === id ? { ...r, category: val, sub_category: '', item_name: '' } : r));
  const removeItem = (id) => setItems(prev => prev.filter(r => r.id !== id));
  const addItem    = ()   => setItems(prev => [...prev, newOrderItem()]);

  const grandTotal = items.reduce((s, r) => s + (parseFloat(r.qty)||0) * (parseFloat(r.unit_price)||0), 0);

  const handleSubmit = async () => {
    const validItems = items.filter(r => r.item_name || parseFloat(r.qty) > 0);
    if (validItems.length === 0) { toast.error('Add at least one item.'); return; }
    setSubmitting(true);
    try {
      const allItems = validItems.map(r => ({
        category:     r.category,
        sub_category: r.sub_category,
        item_name:    r.item_name,
        name:         r.item_name,
        section:      r.category,
        qty:          parseFloat(r.qty)        || 0,
        unit:         r.unit,
        unit_price:   parseFloat(r.unit_price) || 0,
        total:        (parseFloat(r.qty)||0) * (parseFloat(r.unit_price)||0),
      }));
      const payload = {
        quotation_id:  project.id,
        project_name:  projectLabel,
        customer_name: project.customer_name,
        supplier_name: supplierName,
        delivery_date: deliveryDate,
        payment_mode:  paymentMode,
        build_by:      buildBy,
        approved_by:   approvedBy,
        gst,
        bill_attached: billAttached,
        notes:         orderNotes,
        status,
        items:         allItems,
        total_estimate: grandTotal,
      };
      if (existingOrder) {
        await api.put(`/material-orders/${existingOrder.id}`, payload);
        toast.success('Order updated!');
      } else {
        await api.post('/material-orders', payload);
        toast.success('Order submitted!');
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save order');
    }
    setSubmitting(false);
  };

  const fieldStyle = {
    width: '100%', padding: '8px 11px', border: '1.5px solid #e8e8e8',
    borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans,sans-serif',
    outline: 'none', boxSizing: 'border-box', background: '#fff',
  };
  const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 700, color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  };
  const sectionDivider = {
    fontSize: 11, fontWeight: 700, color: '#E8471C', textTransform: 'uppercase',
    letterSpacing: 0.7, borderBottom: '1.5px solid #fde8e2', paddingBottom: 4, marginBottom: 10, marginTop: 4,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Date + Voucher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Order Date *</label>
            <input style={fieldStyle} type="date"
              defaultValue={new Date().toISOString().slice(0,10)} />
          </div>
          <div>
            <label style={labelStyle}>Voucher No.</label>
            <input style={{ ...fieldStyle, color: '#aaa' }} placeholder="(auto-generated)" disabled />
          </div>
        </div>

        {/* Project name banner */}
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
              PROJECT · AUTO-FILLED · CANNOT BE CHANGED
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{projectLabel}</div>
          </div>
        </div>

        {/* Supplier */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Supplier / Vendor</label>
            <input style={fieldStyle} placeholder="e.g. Sri Lakshmi Plywoods"
              value={supplierName} onChange={e => setSupplierName(e.target.value)} />
          </div>
        </div>

        {/* Build By + Payment Mode */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Build By</label>
            <select style={fieldStyle} value={buildBy} onChange={e => setBuildBy(e.target.value)}>
              <option value="">— Select Build By —</option>
              {ORDER_BUILD_BY.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Payment Mode</label>
            <select style={fieldStyle} value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
              {ORDER_PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* GST + Approved By */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>GST / Tax</label>
            <select style={fieldStyle} value={gst} onChange={e => setGst(e.target.value)}>
              {ORDER_GST_OPTIONS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Approved By</label>
            <select style={fieldStyle} value={approvedBy} onChange={e => setApprovedBy(e.target.value)}>
              <option value="">— Select —</option>
              {ORDER_APPROVED_BY.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* ── Item Lines ── */}
        <div style={sectionDivider}>📦 Order Items</div>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1.4fr 1.8fr 0.6fr 0.7fr 0.9fr 0.9fr 28px',
          gap: 6, padding: '0 2px',
        }}>
          {['Category','Sub-category','Item / Description','Qty','Unit','Unit Price','Total',''].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {/* Item rows */}
        {items.map((row) => {
          const catData    = row.category ? ORDER_CATEGORY_DATA[row.category] : null;
          const subCatList = catData ? Object.keys(catData.subcategories) : [];
          const mmSizes    = (catData && row.sub_category) ? (catData.subcategories[row.sub_category] || []) : [];
          const rowTotal   = (parseFloat(row.qty)||0) * (parseFloat(row.unit_price)||0);

          return (
            <div key={row.id} style={{
              border: '1.5px solid #eee', borderRadius: 10, padding: '10px 12px',
              background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {/* Main grid row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.4fr 1.8fr 0.6fr 0.7fr 0.9fr 0.9fr 28px',
                gap: 6, alignItems: 'center',
              }}>
                {/* Category */}
                <select style={{ ...fieldStyle, fontSize: 12 }}
                  value={row.category} onChange={e => updateItemCategory(row.id, e.target.value)}>
                  <option value="">— Category —</option>
                  {ORDER_CATEGORIES.map(c => (
                    <option key={c} value={c}>{ORDER_CATEGORY_DATA[c].icon} {c}</option>
                  ))}
                </select>

                {/* Sub-category */}
                <select
                  style={{ ...fieldStyle, fontSize: 12, opacity: subCatList.length ? 1 : 0.5 }}
                  value={row.sub_category}
                  onChange={e => updateItem(row.id, 'sub_category', e.target.value)}
                  disabled={!subCatList.length}>
                  <option value="">— Sub-cat —</option>
                  {subCatList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Item name */}
                <input style={{ ...fieldStyle, fontSize: 12 }}
                  placeholder="Item / description"
                  value={row.item_name}
                  onChange={e => updateItem(row.id, 'item_name', e.target.value)} />

                {/* Qty */}
                <input style={{ ...fieldStyle, fontSize: 12, textAlign: 'center' }}
                  type="number" min="0" placeholder="0"
                  value={row.qty} onChange={e => updateItem(row.id, 'qty', e.target.value)} />

                {/* Unit */}
                <input style={{ ...fieldStyle, fontSize: 12 }}
                  placeholder="PCS"
                  value={row.unit} onChange={e => updateItem(row.id, 'unit', e.target.value)} />

                {/* Unit price */}
                <input style={{ ...fieldStyle, fontSize: 12, textAlign: 'right' }}
                  type="number" min="0" placeholder="0"
                  value={row.unit_price} onChange={e => updateItem(row.id, 'unit_price', e.target.value)} />

                {/* Total */}
                <span style={{
                  fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                  color: rowTotal > 0 ? '#E8471C' : '#ccc', textAlign: 'right',
                }}>
                  {rowTotal > 0 ? '₹' + fmt(rowTotal) : '—'}
                </span>

                {/* Remove */}
                <button onClick={() => removeItem(row.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#ddd', fontSize: 16, padding: 0, lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#E8471C'}
                  onMouseLeave={e => e.currentTarget.style.color = '#ddd'}>✕</button>
              </div>

              {/* Size/spec quick-pick pills */}
              {mmSizes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 2 }}>
                  {mmSizes.map(sz => (
                    <button key={sz} type="button"
                      onClick={() => updateItem(row.id, 'item_name', `${row.sub_category} - ${sz}`)}
                      style={{
                        padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        border: row.item_name.includes(sz) ? '2px solid #E8471C' : '1.5px solid #e0e0e0',
                        background: row.item_name.includes(sz) ? '#fff0ec' : '#fff',
                        color: row.item_name.includes(sz) ? '#E8471C' : '#555',
                        cursor: 'pointer',
                      }}>
                      {sz}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Add item button */}
        <button onClick={addItem} style={{
          padding: '9px', background: '#fff', border: '2px dashed #E8471C',
          borderRadius: 10, color: '#E8471C', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', width: '100%',
        }}>
          + Add Item
        </button>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Order Notes / Instructions</label>
          <textarea style={{ ...fieldStyle, minHeight: 60, resize: 'vertical' }}
            placeholder="Delivery instructions, quality specs, etc."
            value={orderNotes} onChange={e => setOrderNotes(e.target.value)} />
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{
        padding: '14px 20px', borderTop: '2px solid #f0f0f0', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', bottom: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>ITEMS</div>
            <div style={{ fontWeight: 700, color: '#1a1a1a' }}>
              {items.filter(r => r.item_name || parseFloat(r.qty) > 0).length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>ORDER TOTAL</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#E8471C', fontSize: 18 }}>
              ₹{fmt(grandTotal)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            padding: '9px 18px', background: '#f5f5f5', border: 'none',
            borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#666',
          }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting} style={{
            padding: '9px 22px', background: '#E8471C', color: '#fff', border: 'none',
            borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 12px rgba(232,71,28,0.3)',
          }}>
            {submitting ? 'Saving…' : existingOrder ? '✅ Update Order' : '✅ Submit Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
function ProjectManagement({ onClose, preSelectedProjectId = null }) {
  const overlayRef = useRef(null);

  const [step,     setStep]     = useState('list'); // 'list' | 'project' | 'form'
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);   // selected project
  const [orders,   setOrders]   = useState([]);      // existing orders for selected project
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editingOrder,  setEditingOrder]  = useState(null); // null = new, else order object
  const [search,        setSearch]        = useState('');
  const [activeTab,     setActiveTab]     = useState('orders'); // 'orders' | 'quotation'
  const [fullQuotation, setFullQuotation] = useState(null);    // quotation with rooms data

  const loadProjects = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/quotations');
      const booked = (res.data?.data || []).filter(q => q.project_status === 'Booked');
      setProjects(booked);
      return booked;
    } catch { if (!silent) toast.error('Failed to load projects'); return []; }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => {
    loadProjects().then(booked => {
      if (preSelectedProjectId) {
        const proj = booked.find(p => p.id === preSelectedProjectId);
        if (proj) openProject(proj);
      }
    });
    return () => {};
  }, [preSelectedProjectId]);

  const loadOrders = useCallback(async (projectId, silent = false) => {
    if (!silent) setOrdersLoading(true);
    try {
      const [ordRes, quoRes] = await Promise.all([
        api.get('/material-orders', { params: { quotation_id: projectId } }),
        api.get(`/quotations/${projectId}`),
      ]);
      setOrders(ordRes.data.data || []);
      setFullQuotation(quoRes.data.data || null);
    } catch { if (!silent) toast.error('Failed to load orders'); }
    if (!silent) setOrdersLoading(false);
  }, []);

  const openProject = (proj) => {
    setSelected(proj);
    setStep('project');
    setEditingOrder(null);
    setActiveTab('orders');
    loadOrders(proj.id);
  };

  // Auto-refresh orders every 5s when a project is open
  useEffect(() => {
    if (!selected) return;
    return () => {};
  }, [selected, loadOrders]);

  const handleOrderSaved = () => {
    setStep('project');
    setEditingOrder(null);
    loadOrders(selected.id);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Delete this material order?')) return;
    try {
      await api.delete(`/material-orders/${orderId}`);
      toast.success('Order deleted.');
      loadOrders(selected.id);
    } catch { toast.error('Failed to delete.'); }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await api.patch(`/material-orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id===orderId ? {...o, status} : o));
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Failed to update status.'); }
  };

  const handleOverlayClick = e => { if (e.target === overlayRef.current) onClose(); };

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return (p.site_name||'').toLowerCase().includes(q)
        || (p.customer_name||'').toLowerCase().includes(q)
        || (p.location||'').toLowerCase().includes(q);
  });

  /* ── Totals for selected project ── */
  const totalOrdered  = orders.reduce((s,o) => s + Number(o.total_estimate||0), 0);
  const paidTotal     = Number(selected?.paid_total||0);
  const grandTotal    = Number(selected?.grand_total||0);

  return (
    <div className="pm-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="pm-modal">

        {/* Header */}
        <div className="pm-header">
          <div className="pm-header-left">
            {step !== 'list' && (
              <button className="pm-back-btn" onClick={() => {
                if (step==='form') { setStep('project'); setEditingOrder(null); }
                else { setStep('list'); setSelected(null); setOrders([]); setFullQuotation(null); }
              }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M8.5 2L3.5 6.5L8.5 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            <div>
              <h2 className="pm-title">
                {step==='list'    && '📋 Project Management'}
                {step==='project' && `🏗️ ${selected?.site_name || selected?.customer_name}`}
                {step==='form'    && (editingOrder ? '✏️ Edit Order' : '➕ New Order')}
              </h2>
              {step==='project' && selected && (
                <p className="pm-subtitle">
                  {selected.customer_name} · {selected.location||'—'} ·{' '}
                  <span style={{color:'#E8471C'}}>₹{fmt(selected.grand_total)}</span>
                </p>
              )}
              {step==='form' && editingOrder && (
                <p className="pm-subtitle">Order #{editingOrder.id} · {editingOrder.supplier_name||'—'}</p>
              )}
            </div>
          </div>
          <button className="pm-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* ── LIST VIEW ── */}
        {step==='list' && (
          <div className="pm-body">
            <input className="pm-search" placeholder="🔍  Search by project name, client, location…"
              value={search} onChange={e=>setSearch(e.target.value)} />
            {loading ? (
              <div className="pm-empty">Loading booked projects…</div>
            ) : filtered.length===0 ? (
              <div className="pm-empty">
                {projects.length===0 ? 'No booked projects. Mark a quotation as "Booked" first.' : 'No projects match your search.'}
              </div>
            ) : (
              <div className="pm-project-list">
                {filtered.map(p => {
                  const paid = Number(p.paid_total||0);
                  const total = Number(p.grand_total||0);
                  const pct = total > 0 ? Math.round((paid/total)*100) : 0;
                  return (
                    <button key={p.id} className="pm-project-card" onClick={() => openProject(p)}>
                      <div className="pm-project-card-left">
                        <div className="pm-project-avatar">{(p.site_name||p.customer_name||'?')[0].toUpperCase()}</div>
                        <div style={{flex:1}}>
                          <div className="pm-project-name">{p.site_name||p.customer_name}</div>
                          <div className="pm-project-meta">{p.customer_name} · {p.location||'—'} · {p.project_type||'Interior'}</div>
                          <div style={{marginTop:5,display:'flex',alignItems:'center',gap:8}}>
                            <div style={{flex:1,height:4,background:'#f0f0f0',borderRadius:99,overflow:'hidden'}}>
                              <div style={{height:'100%',width:pct+'%',background:'#E8471C',borderRadius:99}}/>
                            </div>
                            <span style={{fontSize:10,color:'#E8471C',fontWeight:700,flexShrink:0}}>{pct}% paid</span>
                          </div>
                        </div>
                      </div>
                      <div className="pm-project-arrow">
                        {overBudget && (
                        <span style={{background:'#DC2626',color:'#fff',borderRadius:6,
                          padding:'2px 7px',fontSize:10,fontWeight:700,marginRight:4}}>
                          ⚠ High Exp
                        </span>
                      )}
                      <span className="pm-booked-badge">Booked</span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 3l5 5-5 5" stroke="#E8471C" strokeWidth="1.7" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PROJECT DETAIL VIEW ── */}
        {step==='project' && selected && (() => {
          // Expense warning: if expenses > 70% of total paid
          const expPct      = paidTotal > 0 ? Math.round((totalOrdered / paidTotal) * 100) : 0;
          const isOverBudget = expPct > 70;
          return (
          <div className="pm-body" style={{padding:0,display:'flex',flexDirection:'column'}}>

            {/* Expense over-budget warning */}
            {isOverBudget && (
              <div style={{
                background:'#FEF2F2',
                border:'none',
                borderBottom:'3px solid #DC2626',
                padding:'10px 20px',
                display:'flex',
                alignItems:'center',
                gap:10,
                flexShrink:0,
              }}>
                <span style={{fontSize:20}}>🚨</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:13,color:'#B91C1C'}}>
                    High Expense Alert — {expPct}% of paid amount spent on materials!
                  </div>
                  <div style={{fontSize:12,color:'#DC2626',marginTop:2}}>
                    Expenses ₹{fmt(totalOrdered)} exceed 70% of total paid ₹{fmt(paidTotal)}.
                    Review material orders carefully.
                  </div>
                </div>
                <div style={{
                  background:'#DC2626',
                  color:'#fff',
                  borderRadius:8,
                  padding:'4px 12px',
                  fontWeight:800,
                  fontSize:14,
                  fontFamily:'monospace',
                  flexShrink:0,
                }}>
                  {expPct}%
                </div>
              </div>
            )}

            {/* Finance summary strip */}
            <div style={{display:'flex',gap:0,borderBottom:'1px solid #eee',flexShrink:0,
              background: isOverBudget ? '#FFF5F5' : '#fff'}}>
              {[
                {label:'Project Value', value:'₹'+fmt(grandTotal),  color:'#1a1a1a'},
                {label:'Total Paid',    value:'₹'+fmt(paidTotal),   color:'#10B981'},
                {label:'Balance Due',   value:'₹'+fmt(grandTotal-paidTotal), color:grandTotal-paidTotal>0?'#E8471C':'#10B981'},
                {label:'Expenses',      value:'₹'+fmt(totalOrdered), color: isOverBudget ? '#DC2626' : '#7c3aed'},
              ].map(s => (
                <div key={s.label} style={{flex:1,padding:'12px 16px',textAlign:'center',
                  borderRight:'1px solid #eee',
                  background: s.label==='Expenses' && isOverBudget ? '#FEF2F2' : 'transparent'}}>
                  <div style={{fontSize:10,color:'#aaa',marginBottom:3}}>{s.label}</div>
                  <div style={{fontFamily:'monospace',fontWeight:700,fontSize:15,color:s.color}}>{s.value}</div>
                  {s.label==='Expenses' && isOverBudget && (
                    <div style={{fontSize:9,color:'#DC2626',fontWeight:700,marginTop:2}}>
                      ⚠ {expPct}% of paid
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{display:'flex',borderBottom:'2px solid #f0f0f0',flexShrink:0}}>
              {[
                {id:'orders',    label:`📦 Material Orders (${orders.length})`},
                {id:'quotation', label:'📋 Booked Items'},
              ].map(t => (
                <button key={t.id} onClick={()=>setActiveTab(t.id)}
                  style={{padding:'10px 20px',border:'none',background:'none',cursor:'pointer',
                    fontWeight:activeTab===t.id?700:500,
                    color:activeTab===t.id?'#E8471C':'#888',
                    borderBottom:activeTab===t.id?'2px solid #E8471C':'2px solid transparent',
                    fontSize:13,fontFamily:'DM Sans,sans-serif',marginBottom:-2}}>
                  {t.label}
                </button>
              ))}
              <div style={{flex:1}}/>
              <button onClick={() => { setEditingOrder(null); setStep('form'); }}
                style={{margin:'6px 16px',padding:'7px 16px',background:'#E8471C',color:'#fff',
                  border:'none',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer'}}>
                + New Order
              </button>
            </div>

            {/* Tab content */}
            <div style={{flex:1,overflowY:'auto'}}>
              {activeTab==='orders' && (
                ordersLoading ? (
                  <div style={{padding:40,textAlign:'center',color:'#aaa'}}>Loading orders…</div>
                ) : orders.length===0 ? (
                  <div style={{padding:48,textAlign:'center'}}>
                    <div style={{fontSize:40,marginBottom:12}}>📦</div>
                    <div style={{fontWeight:700,fontSize:15,color:'#1a1a1a',marginBottom:6}}>No material orders yet</div>
                    <div style={{fontSize:13,color:'#aaa',marginBottom:20}}>Submit a material order for this project</div>
                    <button onClick={() => { setEditingOrder(null); setStep('form'); }}
                      style={{padding:'10px 24px',background:'#E8471C',color:'#fff',border:'none',
                        borderRadius:9,fontWeight:700,fontSize:14,cursor:'pointer'}}>
                      + Create First Order
                    </button>
                  </div>
                ) : (
                  <div style={{padding:'16px 20px'}}>
                    {orders.map(order => {
                      let items = order.items;
                      if (typeof items==='string') { try { items=JSON.parse(items); } catch { items=[]; } }
                      const sc = STATUS_COLORS[order.status] || STATUS_COLORS.Pending;
                      return (
                        <div key={order.id} style={{border:'1px solid #eee',borderRadius:12,
                          marginBottom:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
                          {/* Order header */}
                          <div style={{padding:'12px 16px',background:'#fafafa',
                            display:'flex',alignItems:'center',justifyContent:'space-between',
                            borderBottom:'1px solid #eee',flexWrap:'wrap',gap:10}}>
                            <div>
                              <div style={{fontWeight:700,fontSize:14,color:'#1a1a1a',display:'flex',alignItems:'center',gap:8}}>
                                📦 Order #{order.id}
                                <span style={{padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:700,
                                  background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>
                                  {order.status}
                                </span>
                              </div>
                              <div style={{fontSize:11,color:'#aaa',marginTop:3}}>
                                {order.supplier_name && <span>🏪 {order.supplier_name} · </span>}
                                {order.delivery_date && <span>📅 Due: {order.delivery_date} · </span>}
                                <span style={{fontFamily:'monospace',color:'#E8471C',fontWeight:700}}>₹{fmt(order.total_estimate)}</span>
                                {' · '}{new Date(order.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                              </div>
                            </div>
                            <div style={{display:'flex',gap:8,alignItems:'center'}}>
                              <select value={order.status}
                                onChange={e=>handleStatusChange(order.id,e.target.value)}
                                style={{padding:'5px 10px',border:'1px solid #e0e0e0',borderRadius:7,
                                  fontSize:12,fontFamily:'DM Sans,sans-serif',cursor:'pointer',
                                  background:sc.bg,color:sc.color}}>
                                {['Pending','Ordered','Received','Cancelled'].map(s=><option key={s}>{s}</option>)}
                              </select>

                              <button onClick={async () => {
                                  try {
                                    const res = await api.get('/material-orders/' + order.id);
                                    const fetchedOrder = res.data.success ? res.data.data : null;
                                    if (fetchedOrder && Array.isArray(fetchedOrder.items) && fetchedOrder.items.length > 0) {
                                      setEditingOrder(fetchedOrder);
                                    } else {
                                      let parsedItems = order.items;
                                      if (typeof parsedItems === 'string') {
                                        try { parsedItems = JSON.parse(parsedItems); } catch { parsedItems = []; }
                                      }
                                      if (!Array.isArray(parsedItems)) parsedItems = [];
                                      setEditingOrder({ ...order, items: parsedItems });
                                    }
                                    setStep('form');
                                  } catch {
                                    let parsedItems = order.items;
                                    if (typeof parsedItems === 'string') {
                                      try { parsedItems = JSON.parse(parsedItems); } catch { parsedItems = []; }
                                    }
                                    if (!Array.isArray(parsedItems)) parsedItems = [];
                                    setEditingOrder({ ...order, items: parsedItems });
                                    setStep('form');
                                  }
                                }}
                                style={{padding:'5px 12px',background:'#EFF6FF',border:'1px solid #BFDBFE',
                                  borderRadius:7,color:'#1D4ED8',fontWeight:700,fontSize:12,cursor:'pointer'}}>
                                ✏️ Edit
                              </button>
                              <button onClick={()=>handleDeleteOrder(order.id)}
                                style={{padding:'5px 10px',background:'#FFF0F0',border:'1px solid #FECACA',
                                  borderRadius:7,color:'#B91C1C',fontWeight:700,fontSize:12,cursor:'pointer'}}>
                                🗑️
                              </button>
                            </div>
                          </div>
                          {/* Items table */}
                          {items?.length > 0 && (
                            <div style={{overflowX:'auto'}}>
                              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                                <thead>
                                  <tr style={{background:'#f5f5f5'}}>
                                    {['Section','Item','Qty','Unit','Unit Price','Total'].map(h=>(
                                      <th key={h} style={{...TH,padding:'7px 12px'}}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.filter(it=>it.qty>0).map((it,i)=>(
                                    <tr key={i} style={{background:i%2?'#fafafa':'#fff'}}>
                                      <td style={{...TD,color:'#888',fontSize:10}}>{it.section||it.sec_id||'—'}</td>
                                      <td style={TD}>{it.name||it.catalog||'—'}{it.colourCode?` (${it.colourCode})`:''}</td>
                                      <td style={{...TD,textAlign:'center'}}>{it.qty}</td>
                                      <td style={{...TD,textAlign:'center'}}>{it.unit||'—'}</td>
                                      <td style={{...TD,textAlign:'right'}}>₹{fmt(it.unit_price||it.unitPrice)}</td>
                                      <td style={{...TD,textAlign:'right',fontWeight:700,color:'#E8471C'}}>₹{fmt(it.total)}</td>
                                    </tr>
                                  ))}
                                  <tr style={{background:'#fff8f5',fontWeight:700}}>
                                    <td colSpan={5} style={{...TD,textAlign:'right',fontWeight:700}}>Order Total</td>
                                    <td style={{...TD,textAlign:'right',color:'#E8471C',fontFamily:'monospace',fontSize:13}}>₹{fmt(order.total_estimate)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                          {order.notes && (
                            <div style={{padding:'8px 14px',background:'#fffbeb',fontSize:11,color:'#92400e',borderTop:'1px solid #fef3c7'}}>
                              📝 {order.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {activeTab==='quotation' && (
                <div>
                  <div style={{padding:'12px 16px',background:'#fff8f5',borderBottom:'1px solid #fde8e2',
                    fontSize:12,color:'#9a3412',fontWeight:600}}>
                    📋 Items from quotation — these are the booked interior works for this project
                  </div>
                  {fullQuotation ? (
                    <QuotationItems quotation={fullQuotation} />
                  ) : (
                    <div style={{padding:40,textAlign:'center',color:'#aaa'}}>Loading quotation items…</div>
                  )}
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* ── ORDER FORM ── */}
        {step==='form' && selected && (
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <OrderForm
              key={editingOrder ? `edit-${editingOrder.id}` : 'new'}
              project={selected}
              existingOrder={editingOrder}
              onSaved={handleOrderSaved}
              onCancel={() => { setStep('project'); setEditingOrder(null); }}
            />
          </div>
        )}

      </div>
    </div>
  );
}

export default ProjectManagement;

// Shared styles
const TH = { padding:'6px 10px', textAlign:'left', fontWeight:700, fontSize:10,
  color:'#888', letterSpacing:0.4, textTransform:'uppercase', borderBottom:'1px solid #eee' };
const TD = { padding:'7px 10px', borderBottom:'1px solid #f5f5f5', fontSize:11, color:'#333' };
const LS = { display:'block', fontSize:11, fontWeight:700, color:'#888',
  textTransform:'uppercase', letterSpacing:0.5, marginBottom:5 };
const IS = { width:'100%', padding:'8px 12px', border:'1.5px solid #e8e8e8',
  borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif',
  outline:'none', boxSizing:'border-box', background:'#fff' };
const RS = { width:'100%', padding:'6px 8px', border:'1px solid #e8e8e8',
  borderRadius:6, fontSize:12, fontFamily:'DM Sans,sans-serif',
  outline:'none', boxSizing:'border-box', background:'#fff' };