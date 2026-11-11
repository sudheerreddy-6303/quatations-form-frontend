// ── ADDED (per request): branch-wise address + bank details for Quotation PDF / Print / View ──
// The branch comes from the quotation's "Branch" field (site_manager_branch).
// A branch listed here shows ONLY its own address (and its own bank account when `bank` is set).
// Any branch NOT listed here (or an old quotation with no branch) keeps the original header with
// both addresses and the original bank details — nothing is removed.
export const BRANCH_DETAILS = {
  // Suchitra side office (Kompally / Jeedimetla)
  Kompally: {
    label: 'Kompally Branch',
    address: 'SECOND FLOOR, PLOT NO.119, KOMPALLY, JEEDIMETLA, GREEN PARK AVENUE, Hyderabad, Medchal Malkajgiri, Telangana, 500055',
    bank: [
      'Account Holder: DEERAJ INTERIORS',
      'Account Number: 50200068101762',
      'IFSC: HDFC0000696',
      'Branch: PETBASHEERABAD',
      'Account Type: Current Account',
    ],
  },
  // Nanakramguda office — keeps the present (existing) bank details
  Gachibowli: {
    label: 'Gachibowli Branch',
    address: 'PAVANI ENCORE BUILDING, BESIDE NANAKRAMGUDA TOLLGATE, ABOVE RATNADEEP, 1ST FLOOR, Hyderabad, Telangana',
    bank: null, // null = use the existing bank details exactly as they are today
  },
};

export const getBranchDetails = (branch) => BRANCH_DETAILS[String(branch || '').trim()] || null;
