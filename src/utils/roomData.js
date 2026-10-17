export const DEFAULT_ROOMS = {
  mbr: {
    label: 'MBR Room', color: '#8B5CF6',
    items: [
      { name: 'Wardrobe', width: 90, height: 84, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
      { name: 'Sit-out', width: 52, height: 18, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
      { name: 'Loft', width: 143, height: 22, nos: 1, type: 'FRAME', unitCost: 950, remarks: '21 years sylvan' },
      { name: 'L.B.P', width: 52, height: 22, nos: 1, type: 'PANELLING', unitCost: 750, remarks: '21 years sylvan' },
      { name: 'Dressing unit', width: 26, height: 83, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
      { name: 'Side Table', width: 18, height: 18, nos: 2, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
      { name: 'Bed', width: 74, height: 78, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
      { name: 'Bed Back Cushioning', width: 74, height: 48, nos: 1, type: 'FRAME', unitCost: 950, remarks: '21 years sylvan' },
      { name: 'Bathroom - Box', width: 24, height: 24, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
    ]
  },
  cbr: {
    label: 'CBR', color: '#3B82F6',
    items: [
      { name: 'Wardrobe', width: 40, height: 84, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
      { name: 'Loft', width: 40, height: 22, nos: 1, type: 'FRAME', unitCost: 950, remarks: '21 years sylvan' },
      { name: 'Study Unit', width: 36, height: 32, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
      { name: 'Dressing unit & Wardrobe', width: 71, height: 84, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
      { name: 'Loft (2)', width: 118, height: 22, nos: 1, type: 'FRAME', unitCost: 950, remarks: '21 years sylvan' },
      { name: 'L.B.P', width: 47, height: 22, nos: 1, type: 'PANELLING', unitCost: 750, remarks: '21 years sylvan' },
      { name: 'Sit-out', width: 47, height: 18, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
    ]
  },
  hall: {
    label: 'Hall', color: '#10B981',
    items: [
      { name: 'TV Unit', width: 144, height: 96, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
      { name: 'Shoe Rack', width: 60, height: 36, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
      { name: 'Storage Box', width: 24, height: 84, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
    ]
  },
  dining: {
    label: 'Dining', color: '#F59E0B',
    items: [
      { name: 'Crockery', width: 70, height: 84, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
      { name: 'Glass Door', width: 36, height: 24, nos: 1, type: 'GLASS', unitCost: 1200, remarks: '' },
      { name: 'Pooja Unit', width: 36, height: 84, nos: 1, type: 'BOX', unitCost: 1300, remarks: '21 years sylvan' },
      { name: 'Pooja Door', width: 36, height: 84, nos: 1, type: 'FRAME', unitCost: 950, remarks: '21 years sylvan' },
    ]
  },
  kitchen: {
    label: 'Kitchen', color: '#EF4444',
    items: [
      { name: 'Platform', width: 151, height: 33, nos: 1, type: 'BOX', unitCost: 1350, remarks: '30 years sylvan' },
      { name: 'Loft', width: 248, height: 24, nos: 1, type: 'FRAME', unitCost: 1050, remarks: '30 years sylvan' },
      { name: 'Overhead', width: 72, height: 24, nos: 1, type: 'BOX', unitCost: 1350, remarks: '30 years sylvan' },
      { name: 'Tall Box', width: 24, height: 84, nos: 1, type: 'BOX', unitCost: 1350, remarks: '30 years sylvan' },
      { name: 'Glass Door', width: 24, height: 48, nos: 1, type: 'GLASS', unitCost: 1200, remarks: '' },
      { name: 'Break-Fast Counter', width: 24, height: 39, nos: 1, type: 'BOX', unitCost: 1350, remarks: '30 years sylvan' },
      { name: 'Arch', width: 234, height: 12, nos: 1, type: 'FRAME', unitCost: 1050, remarks: '30 years sylvan' },
      { name: 'Kitchen Slab', width: 0, height: 0, nos: 1, type: 'FIXED', unitCost: 50000, remarks: 'With Labour' },
    ]
  },
  accessories: {
    label: 'Accessories', color: '#C9A84C',
    items: [
      { name: 'Tandum', nos: 5, unitCost: 7000, remarks: 'Hettich' },
      { name: 'Hardware', nos: 1, unitCost: 50000, remarks: 'Hettich' },
      { name: 'Transporting & lifting material', nos: 1, unitCost: 10000, remarks: '' },
    ]
  }
};

/**
 * CANONICAL calc functions — used by Form, View, Edit, PDF, Print.
 * FIXED type: total = unitCost * nos  (nos acts as qty/count)
 * Area-based: total = (W*H*nos/144) * unitCost
 * Qty-only (no W/H): total = nos * unitCost
 */
export const calcArea = (item) => {
  const w   = parseFloat(item.width)  || 0;
  const h   = parseFloat(item.height) || 0;
  const nos = parseFloat(item.nos);
  const n   = isNaN(nos) || nos === 0 ? 0 : nos;
  // SFT / manual area: when an SFT value is entered (or type is SFT), area is taken
  // directly from that value (Nos is an optional multiplier, default 1).
  const manualSft = parseFloat(item.sft) || 0;
  if (item.type !== 'FIXED' && (item.type === 'SFT' || manualSft > 0)) {
    if (!manualSft) return 0;
    const mult = (isNaN(nos) || nos === 0) ? 1 : nos;
    return parseFloat((manualSft * mult).toFixed(2));
  }
  // FIXED type never uses area
  if (item.type === 'FIXED') return 0;
  // No dimensions entered yet
  if (!w || !h) return 0;
  // No quantity entered yet
  if (n === 0) return 0;
  return parseFloat(((w * h * n) / 144).toFixed(2));
};

export const calcTotal = (item) => {
  if ((parseFloat(item && item.discRate) || 0) > 0 && !(item && item.__discApplied)) return calcTotal({ ...item, unitCost: parseFloat(item.discRate), __discApplied: true }); // ADDED: Discounted Rate — when entered, Total uses it instead of Rate
  const nos      = parseFloat(item.nos);
  const n        = isNaN(nos) ? 0 : nos;
  const unitCost = parseFloat(item.unitCost) || 0;
  const w        = parseFloat(item.width)    || 0;
  const h        = parseFloat(item.height)   || 0;

  // SFT / manual area: total = entered SFT (× Nos multiplier) × rate
  if (item.type !== 'FIXED' && (item.type === 'SFT' || (parseFloat(item.sft) || 0) > 0)) {
    return Math.round(calcArea(item) * unitCost * 100) / 100;
  }
  // FIXED: total = unitCost × nos (nos defaults to 1 if 0)
  if (item.type === 'FIXED') {
    return Math.round(unitCost * (n === 0 ? 1 : n) * 100) / 100;
  }
  // No dimensions: total = nos × unitCost (quantity-only pricing)
  if (!w || !h) {
    return Math.round(n * unitCost * 100) / 100;
  }
  // Area-based: total = area × unitCost
  if (n === 0) return 0;
  return Math.round(calcArea(item) * unitCost * 100) / 100;
};

export const calcRoomTotal = (items) => items.reduce((s, i) => s + (i && i.excluded ? 0 : calcTotal(i)), 0); // OFF rows not counted
// ── ADDED: total of all row discounts (Rate − Discounted Rate) for a quotation — DISPLAY ONLY ──
// Used by View / Print / PDF totals to show "Subtotal (at Rate)" and the discount breakdown.
export const calcRateDiscountTotal = (rooms, sections) => {
  const one = (it) => ((parseFloat(it && it.discRate) || 0) > 0 && !(it && it.excluded)) ? (calcTotal({ ...it, discRate: 0 }) - calcTotal(it)) : 0;
  const list = (x) => (x && Array.isArray(x.items)) ? x.items : [];
  const r = Object.entries(rooms || {}).reduce((s, [k, room]) => s + (k === 'accessories' ? 0 : list(room).reduce((ss, it) => ss + one(it), 0)), 0);
  const c = Object.values(sections || {}).reduce((s, sec) => s + list(sec).reduce((ss, it) => ss + one(it), 0), 0);
  return Math.round((r + c) * 100) / 100;
};
