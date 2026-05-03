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
  const w = parseFloat(item.width) || 0;
  const h = parseFloat(item.height) || 0;
  const n = parseFloat(item.nos) || 1;
  if (item.type === 'FIXED' || (!w && !h)) return 0;
  return parseFloat(((w * h * n) / 144).toFixed(2));
};

export const calcTotal = (item) => {
  const nos      = parseFloat(item.nos)      || 0;
  const unitCost = parseFloat(item.unitCost) || 0;
  const w        = parseFloat(item.width)    || 0;
  const h        = parseFloat(item.height)   || 0;
  if (item.type === 'FIXED') return Math.round(unitCost * (nos || 1) * 100) / 100;
  if (!w && !h) return Math.round(nos * unitCost * 100) / 100;
  return Math.round(calcArea(item) * unitCost * 100) / 100;
};

export const calcRoomTotal = (items) => items.reduce((s, i) => s + calcTotal(i), 0);