/* ============================================================
   data.js – Nirikshan In-Memory Mock Data Store
   All data is synthetic / demonstration only
   ============================================================ */

/* ─── HARDCODED CREDENTIALS ────────────────────────────────
   Display these on the login screen for easy testing.

   Role         | Username (mobile)   | Password
   ─────────────────────────────────────────────────
   Owner        | 9876543210          | owner@123
   Sr. Officer  | srofficer001        | srofficer@123
   Inspector    | inspector001        | inspector@123
   Admin        | admin001            | admin@123
   ──────────────────────────────────────────────────────────── */

const CREDENTIALS = [
  { id: 'u1', username: '9876543210', password: 'owner@123',     role: 'OWNER',          fullName: 'Ramesh Kumar',                 home: 'owner-dashboard',          mobileMasked: '98765 XXXXX', emailMasked: 'r***h@gmail.com' },
  { id: 'u4', username: 'srofficer001', password: 'srofficer@123', role: 'SENIOR_OFFICER', fullName: 'Vikram Singh (Sr. Officer)', home: 'senior-officer-dashboard', mobileMasked: '98002 XXXXX', emailMasked: 'v***m@gov.in' },
  { id: 'u5', username: 'inspector001', password: 'inspector@123', role: 'INSPECTOR',    fullName: 'Pooja Mehta (Inspector)',     home: 'inspector-dashboard',      mobileMasked: '98003 XXXXX', emailMasked: 'p***a@gov.in' },
  { id: 'u6', username: 'admin001',   password: 'admin@123',     role: 'ADMIN',          fullName: 'System Admin',                 home: 'admin-dashboard',          mobileMasked: '98004 XXXXX', emailMasked: 'a***n@gov.in' },
];

/* ─── INSTRUMENTS ─────────────────────────────────────────── */
let INSTRUMENTS = [
  { id: 'inst1', instrumentNo: 'NRK/WB/MUM/2023/001234', serialNo: 'WB-SER-4521', category: 'Weighbridge', status: 'ACTIVE', certStatus: 'VALID', area: 'Mumbai Central Ward 12', address: '45, Industrial Area, Bandra East, Mumbai', ownerId: 'u1', firmName: 'Ramesh Kumar Trading', makeModel: 'Avery Weigh-Tronix / E1105', capacity: '60 tonnes', accuracyClass: 'III', lastVerifiedOn: '2024-03-15', validTill: '2025-03-14' },
  { id: 'inst2', instrumentNo: 'NRK/SF/MUM/2022/005678', serialNo: 'SF-SER-8821', category: 'Shop Scale (0–30 kg)', status: 'ACTIVE', certStatus: 'EXPIRED', area: 'Mumbai Central Ward 8', address: '12, Market Road, Dadar West, Mumbai', ownerId: 'u1', firmName: 'Ramesh Kumar Trading', makeModel: 'Essae / DS-852', capacity: '30 kg', accuracyClass: 'III', lastVerifiedOn: '2023-01-10', validTill: '2024-01-09' },
  { id: 'inst3', instrumentNo: 'NRK/FD/MUM/2024/000012', serialNo: 'FD-SER-1100', category: 'Fuel Dispenser', status: 'ACTIVE', certStatus: 'VALID', area: 'Mumbai Suburban Ward 5', address: 'Plot 7, Petrol Pump, Andheri West, Mumbai', ownerId: 'u1', firmName: 'Ramesh Kumar Trading', makeModel: 'Wayne / Helix 6000', capacity: '40 L/min', accuracyClass: 'II', lastVerifiedOn: '2024-06-01', validTill: '2025-05-31' },
  { id: 'inst4', instrumentNo: 'NRK/WB/PNE/2023/000450', serialNo: 'WB-SER-9012', category: 'Weighbridge', status: 'DEREGISTERED', certStatus: 'REVOKED', area: 'Pune Ward 3', address: '88, Old Factory Road, Hadapsar, Pune', ownerId: 'u1', firmName: 'Ramesh Kumar Trading', makeModel: 'Mettler Toledo / SCS-S', capacity: '80 tonnes', accuracyClass: 'III', lastVerifiedOn: '2022-11-20', validTill: '2023-11-19' },
];

/* ─── APPLICATIONS ──────────────────────────────────────────── */
let APPLICATIONS = [
  { id: 'app1', applicationNo: 'NRK/APP/MUM/2024/001001', instrumentId: 'inst2', instrumentNo: 'NRK/SF/MUM/2022/005678', category: 'Shop Scale (0–30 kg)', ownerId: 'u1', firmName: 'Ramesh Kumar Trading', status: 'INSPECTED', area: 'Mumbai Central Ward 8', submittedAt: '2024-08-01', assignedInspector: 'Pooja Mehta', scheduledAt: '2024-08-15T10:00:00', inspectionResult: 'PASS', officerDecision: null },
  { id: 'app2', applicationNo: 'NRK/APP/MUM/2024/001002', instrumentId: 'inst1', instrumentNo: 'NRK/WB/MUM/2023/001234', category: 'Weighbridge', ownerId: 'u1', firmName: 'Ramesh Kumar Trading', status: 'SUBMITTED', area: 'Mumbai Central Ward 12', submittedAt: '2024-09-10', assignedInspector: null, scheduledAt: null, inspectionResult: null, officerDecision: null },
  { id: 'app3', applicationNo: 'NRK/APP/MUM/2024/001003', instrumentId: 'inst3', instrumentNo: 'NRK/FD/MUM/2024/000012', category: 'Fuel Dispenser', ownerId: 'u1', firmName: 'Ramesh Kumar Trading', status: 'APPROVED', area: 'Mumbai Suburban Ward 5', submittedAt: '2024-07-01', assignedInspector: 'Pooja Mehta', scheduledAt: '2024-07-12T09:00:00', inspectionResult: 'PASS', officerDecision: 'APPROVE' },
  { id: 'app4', applicationNo: 'NRK/APP/PNE/2024/000200', instrumentId: 'inst4', instrumentNo: 'NRK/WB/PNE/2023/000450', category: 'Weighbridge', ownerId: 'u1', firmName: 'Ramesh Kumar Trading', status: 'REJECTED', area: 'Pune Ward 3', submittedAt: '2024-05-20', assignedInspector: 'Pooja Mehta', scheduledAt: '2024-06-01T14:00:00', inspectionResult: 'FAIL', officerDecision: 'REJECT' },
];

/* ─── CERTIFICATES ──────────────────────────────────────────── */
let CERTIFICATES = [
  { id: 'cert1', certNo: 'NRK/CERT/MUM/2024/000001', instrumentId: 'inst1', instrumentNo: 'NRK/WB/MUM/2023/001234', category: 'Weighbridge', ownerId: 'u1', holder: 'Ramesh Kumar', status: 'VALID', verifiedOn: '2024-03-15', validTill: '2025-03-14', validityMonths: 12, issuingOffice: 'Legal Metrology Office, Mumbai', issuedBy: 'Vikram Singh (Sr. Officer)', area: 'Mumbai Central Ward 12', makeModel: 'Avery Weigh-Tronix / E1105', capacity: '60 tonnes', accuracyClass: 'III', mpe: '±30 kg', stickerSerial: 'LM-2024-MUM-00201', ruleVersion: 4, marginal: false, qrUrl: 'https://nrk.gov.in/v/qr-abc123-cert1', signatureMatch: true, history: [], replacedBy: null, replacesCertificateId: null },
  { id: 'cert2', certNo: 'NRK/CERT/MUM/2022/000050', instrumentId: 'inst2', instrumentNo: 'NRK/SF/MUM/2022/005678', category: 'Shop Scale (0–30 kg)', ownerId: 'u1', holder: 'Ramesh Kumar', status: 'EXPIRED', verifiedOn: '2023-01-10', validTill: '2024-01-09', validityMonths: 12, issuingOffice: 'Legal Metrology Office, Mumbai', issuedBy: 'Vikram Singh (Sr. Officer)', area: 'Mumbai Central Ward 8', makeModel: 'Essae / DS-852', capacity: '30 kg', accuracyClass: 'III', mpe: '±15 g', stickerSerial: 'LM-2023-MUM-00099', ruleVersion: 3, marginal: false, qrUrl: 'https://nrk.gov.in/v/qr-xyz789-cert2', signatureMatch: true, history: [], replacedBy: null, replacesCertificateId: null },
  { id: 'cert3', certNo: 'NRK/CERT/MUM/2024/000002', instrumentId: 'inst3', instrumentNo: 'NRK/FD/MUM/2024/000012', category: 'Fuel Dispenser', ownerId: 'u1', holder: 'Ramesh Kumar Trading', status: 'VALID', verifiedOn: '2024-06-01', validTill: '2025-05-31', validityMonths: 12, issuingOffice: 'Legal Metrology Office, Mumbai', issuedBy: 'Vikram Singh (Sr. Officer)', area: 'Mumbai Suburban Ward 5', makeModel: 'Wayne / Helix 6000', capacity: '40 L/min', accuracyClass: 'II', mpe: '±0.3%', stickerSerial: 'LM-2024-MUM-00310', ruleVersion: 4, marginal: false, qrUrl: 'https://nrk.gov.in/v/qr-pqr456-cert3', signatureMatch: true, history: [], replacedBy: null, replacesCertificateId: null },
];

/* ─── NOTICES ───────────────────────────────────────────────── */
const NOTICES = [
  { id: 'n1', title: 'Office closed on 15 August (Independence Day)', titleHi: '15 अगस्त (स्वतंत्रता दिवस) को कार्यालय बंद', tag: 'Holiday', publishedAt: '2024-08-10T09:00:00Z' },
  { id: 'n2', title: 'New fee schedule effective 1 October 2024', titleHi: '1 अक्टूबर 2024 से नया शुल्क कार्यक्रम प्रभावी', tag: 'Policy', publishedAt: '2024-09-15T09:00:00Z' },
  { id: 'n3', title: 'System maintenance Saturday 3:00–5:00 AM', titleHi: 'शनिवार सुबह 3:00–5:00 बजे सिस्टम रखरखाव', tag: 'Maintenance', publishedAt: '2024-10-01T09:00:00Z' },
  { id: 'n4', title: 'Rule Version 5 published for Weighbridges', titleHi: 'तुलापुल के लिए नियम संस्करण 5 प्रकाशित', tag: 'Regulation', publishedAt: '2024-10-10T09:00:00Z' },
  { id: 'n5', title: 'Inspector training camp: 25–27 November, Pune', titleHi: 'निरीक्षक प्रशिक्षण शिविर: 25–27 नवंबर, पुणे', tag: 'Training', publishedAt: '2024-10-18T09:00:00Z' },
];

/* ─── GRIEVANCES (owner-side) ───────────────────────────────── */
let GRIEVANCES = [
  { id: 'gr1', ref: 'GR-2024-MUM-00042', ownerId: 'u1', subject: 'Delay in scheduling inspection', body: 'My application (NRK/APP/MUM/2024/001001) was submitted 3 weeks ago but no inspector has visited yet.', status: 'CLOSED', reply: 'We apologise for the delay. The inspection has now been scheduled.', applicationNo: 'NRK/APP/MUM/2024/001001', createdAt: '2024-08-22T10:00:00Z', replyBy: '2024-09-22T10:00:00Z' },
  { id: 'gr2', ref: 'GR-2024-MUM-00087', ownerId: 'u1', subject: 'Certificate shows wrong capacity', body: 'My weighbridge certificate shows 60 tonnes but it should be 80 tonnes. Please correct.', status: 'ACTIVE', reply: null, applicationNo: null, createdAt: '2024-10-05T10:00:00Z', replyBy: '2024-11-05T10:00:00Z', overdue: false },
];

/* ─── REQUESTS (transfer / address / deregister) ──────────── */
let CHANGE_REQUESTS = [
  { id: 'req1', instrumentId: 'inst4', kind: 'DEREGISTER', status: 'APPROVED', reasonCode: 'DAMAGED_BEYOND_REPAIR', note: 'Machine heavily damaged in flood', toFirm: null, remark: null, decidedAt: '2024-06-15T10:00:00Z', createdAt: '2024-06-01T09:00:00Z' },
];

/* ─── INSPECTOR VISITS ──────────────────────────────────────── */
const VISITS = [
  { id: 'v1', applicationId: 'app1', inspector: 'Pooja Mehta', status: 'SUBMITTED', window: { start: '2024-08-15T09:00:00', end: '2024-08-15T17:00:00' }, submittedAt: '2024-08-15T14:32:00Z', recommendation: 'APPROVE', overall: 'PASS', stickerSerial: 'LM-STICKER-2024-001',
    checklist: [
      { code: 'C01', textEn: 'Platform level and stable', critical: true, answer: 'YES', remark: null, failed: false },
      { code: 'C02', textEn: 'Load cells visually intact', critical: true, answer: 'YES', remark: null, failed: false },
      { code: 'C03', textEn: 'Digital display readable', critical: false, answer: 'YES', remark: null, failed: false },
      { code: 'C04', textEn: 'Seal marks intact', critical: true, answer: 'YES', remark: null, failed: false },
      { code: 'C05', textEn: 'Zero balance check', critical: true, answer: 'YES', remark: null, failed: false },
    ],
    trials: [
      { trialNo: 1, reference: '10.000', observed: '10.008', errorValue: '0.008', errorUnit: 'kg', errorPct: '0.08', mpeValue: '0.020', unit: 'kg', verdict: 'PASS' },
      { trialNo: 2, reference: '30.000', observed: '30.012', errorValue: '0.012', errorUnit: 'kg', errorPct: '0.04', mpeValue: '0.060', unit: 'kg', verdict: 'PASS' },
      { trialNo: 3, reference: '60.000', observed: '59.985', errorValue: '0.015', errorUnit: 'kg', errorPct: '0.025', mpeValue: '0.120', unit: 'kg', verdict: 'PASS' },
    ],
    evidence: [
      { id: 'ev1', kind: 'PHOTO_GENERAL', capturedAt: '2024-08-15T10:15:00Z', geoTagged: true },
      { id: 'ev2', kind: 'PHOTO_SEAL', capturedAt: '2024-08-15T10:20:00Z', geoTagged: true },
      { id: 'ev3', kind: 'PHOTO_DISPLAY', capturedAt: '2024-08-15T10:25:00Z', geoTagged: false },
    ],
    arrival: { at: '2024-08-15T10:02:00Z', distanceM: 45, geofenceOk: true, justification: null },
    note: 'Instrument is in good condition, minor cosmetic scratches on frame only.',
    hasTestSheet: true
  },
];

/* ─── INSPECTOR HISTORY ─────────────────────────────────────── */
const INSPECTOR_HISTORY = [
  { date: '2024-08-15', applicationNo: 'NRK/APP/MUM/2024/001001', category: 'Shop Scale (0–30 kg)', area: 'Mumbai Central Ward 8', recommendation: 'APPROVE', overall: 'PASS' },
  { date: '2024-08-10', applicationNo: 'NRK/APP/MUM/2024/000890', category: 'Weighbridge', area: 'Mumbai Central Ward 12', recommendation: 'REJECT', overall: 'FAIL' },
  { date: '2024-07-28', applicationNo: 'NRK/APP/MUM/2024/000750', category: 'Fuel Dispenser', area: 'Mumbai Suburban Ward 5', recommendation: 'APPROVE', overall: 'PASS' },
  { date: '2024-07-22', applicationNo: 'NRK/APP/PNE/2024/000180', category: 'Shop Scale (0–30 kg)', area: 'Pune Ward 2', recommendation: 'APPROVE', overall: 'PASS' },
];

/* ─── OFFICER DECISIONS ─────────────────────────────────────── */
let DECISIONS = [
  { id: 'd1', applicationId: 'app1', decision: 'APPROVE', status: 'FINAL', remarks: 'All readings within permitted error.', validityMonths: 12, reasonCode: null, decidedBy: 'Vikram Singh (Sr. Officer)', secondApprover: null, at: '2024-08-20T11:00:00Z', secondAt: null, secondRemarks: null },
  { id: 'd2', applicationId: 'app4', decision: 'REJECT', status: 'FINAL', remarks: 'Instrument fails MPE in 2 of 3 trials. Owner must repair before re-applying.', validityMonths: null, reasonCode: 'EXCESSIVE_ERROR', decidedBy: 'Vikram Singh (Sr. Officer)', secondApprover: null, at: '2024-06-15T14:00:00Z', secondAt: null, secondRemarks: null },
];

/* ─── ADMIN: USERS ──────────────────────────────────────────── */
const ADMIN_USERS = [
  { id: 'u1', fullName: 'Ramesh Kumar', mobile: '9876543210', role: 'OWNER', status: 'ACTIVE', createdAt: '2023-01-15', area: 'Mumbai' },
  { id: 'u4', fullName: 'Vikram Singh', mobile: '9800100002', role: 'SENIOR_OFFICER', status: 'ACTIVE', createdAt: '2022-05-01', area: 'Maharashtra' },
  { id: 'u5', fullName: 'Pooja Mehta', mobile: '9800100003', role: 'INSPECTOR', status: 'ACTIVE', createdAt: '2022-07-15', area: 'Mumbai' },
  { id: 'u6', fullName: 'System Admin', mobile: '9800100004', role: 'ADMIN', status: 'ACTIVE', createdAt: '2022-01-01', area: 'State' },
  { id: 'u7', fullName: 'Deepak Trades', mobile: '9912345678', role: 'OWNER', status: 'PENDING', createdAt: '2024-10-01', area: 'Pune' },
];

/* ─── ADMIN: AUDIT LOG ──────────────────────────────────────── */
const AUDIT_LOG = [
  { id: 'al1', at: '2024-10-23T14:32:00Z', actor: 'Vikram Singh', actorRole: 'SENIOR_OFFICER', action: 'DECISION.APPROVE', target: 'Application NRK/APP/MUM/2024/001001', ip: '10.0.0.12' },
  { id: 'al2', at: '2024-10-22T11:05:00Z', actor: 'Pooja Mehta', actorRole: 'INSPECTOR', action: 'VISIT.SUBMIT', target: 'Visit v1 → App NRK/APP/MUM/2024/001001', ip: '10.0.0.25' },
  { id: 'al3', at: '2024-10-21T09:15:00Z', actor: 'Ramesh Kumar', actorRole: 'OWNER', action: 'APPLICATION.SUBMIT', target: 'Application NRK/APP/MUM/2024/001002', ip: '192.168.1.55' },
  { id: 'al4', at: '2024-10-20T16:48:00Z', actor: 'System Admin', actorRole: 'ADMIN', action: 'USER.APPROVE', target: 'User u7 (Deepak Trades)', ip: '10.0.0.1' },
  { id: 'al5', at: '2024-10-19T10:00:00Z', actor: 'Vikram Singh', actorRole: 'SENIOR_OFFICER', action: 'CERTIFICATE.SUSPEND', target: 'Certificate NRK/CERT/OLD/2023/000009', ip: '10.0.0.12' },
];

/* ─── ADMIN: DASHBOARD STATS ────────────────────────────────── */
const ADMIN_STATS = {
  usersTotal: 5, usersPending: 1,
  instrumentsTotal: 4, instrumentsActive: 3,
  applicationsOpen: 2, applicationsThisMonth: 3,
  certificatesValid: 2, certificatesExpired: 1,
  grievancesOpen: 1,
};

const OFFICER_STATS = {
  queueOpen: 2, inspected: 1, decided: 2, overdueGrievances: 0,
};
const SENIOR_OFFICER_STATS = OFFICER_STATS;

/* ─── TRENDS (last 8 weeks) ─────────────────────────────────── */
const TREND_WEEKS = [
  { week: '2024-08-26', applications: 3, certificates: 2 },
  { week: '2024-09-02', applications: 5, certificates: 4 },
  { week: '2024-09-09', applications: 7, certificates: 5 },
  { week: '2024-09-16', applications: 4, certificates: 6 },
  { week: '2024-09-23', applications: 8, certificates: 3 },
  { week: '2024-09-30', applications: 6, certificates: 7 },
  { week: '2024-10-07', applications: 9, certificates: 5 },
  { week: '2024-10-14', applications: 5, certificates: 8 },
];

const HOME_STATS = { instrumentsRegistered: 12480, instrumentsVerified: 9210, divisionsCovered: 18 };

/* ─── RULES ─────────────────────────────────────────────────── */
const RULES = [
  { id: 'r1', category: 'Weighbridge', version: 5, effectiveFrom: '2024-10-01', mpe: { value: '0.5', unit: 'kg/tonne', direction: 'PLUS_MINUS' }, interval: { months: 12, marginalMonths: 2 }, status: 'ACTIVE' },
  { id: 'r2', category: 'Shop Scale (0–30 kg)', version: 4, effectiveFrom: '2024-01-01', mpe: { value: '0.5', unit: 'g/kg', direction: 'PLUS_MINUS' }, interval: { months: 12, marginalMonths: 2 }, status: 'ACTIVE' },
  { id: 'r3', category: 'Fuel Dispenser', version: 3, effectiveFrom: '2023-07-01', mpe: { value: '0.3', unit: '%', direction: 'PLUS_MINUS' }, interval: { months: 12, marginalMonths: 1 }, status: 'ACTIVE' },
];

/* ─── INSPECTOR SCHEDULE ─────────────────────────────────────── */
const SCHEDULE = [
  { id: 'sch1', applicationId: 'app2', applicationNo: 'NRK/APP/MUM/2024/001002', inspectorId: 'u5', inspectorName: 'Pooja Mehta', start: '2024-11-05T09:00:00', end: '2024-11-05T17:00:00', area: 'Mumbai Central Ward 12', category: 'Weighbridge', status: 'ASSIGNED' },
];

/* ─── ENFORCEMENT ───────────────────────────────────────────── */
const ENFORCEMENT = [
  { id: 'enf1', ref: 'ENF-2024-MUM-001', location: 'Dharavi Market, Mumbai', violationType: 'Unverified weighing machine in use', status: 'OPEN', reportedBy: 'Public complaint', createdAt: '2024-10-10T09:00:00Z', note: 'Market inspector visit pending' },
  { id: 'enf2', ref: 'ENF-2024-MUM-002', location: 'Andheri Vegetable Market', violationType: 'Certificate expired – 6 months overdue', status: 'CLOSED', reportedBy: 'Scheduled check', createdAt: '2024-09-01T09:00:00Z', note: 'Owner fined; instrument re-submitted for verification' },
];

/* ─── TAMPER REPORTS ─────────────────────────────────────────── */
let TAMPER_REPORTS = [
  { id: 'tr1', ref: 'TR-2024-0041', certNo: 'NRK/CERT/MUM/2022/000050', description: 'QR code sticker appears to have been peeled and re-applied on my neighbour\'s scale. Seal mark missing.', status: 'ACTIVE', contact: '9900001234', createdAt: '2024-10-15T11:00:00Z', note: '' },
];

/* ─── SYSTEM SETTINGS (admin) ───────────────────────────────── */
const SYSTEM_SETTINGS = {
  maintenanceLevel: null, maintenanceTextEn: '', maintenanceTextHi: '',
  rateLimitPerMin: 600, dashboardCacheSeconds: 0,
  captchaEnabled: true, httpsRequired: true,
};

/* ─── MASTER DATA ─────────────────────────────────────────────── */
const AREAS = [
  { id: 'a1', name: 'Maharashtra', nameHi: 'महाराष्ट्र', level: 'STATE' },
  { id: 'a2', name: 'Mumbai Division', nameHi: 'मुंबई मंडल', level: 'DIVISION' },
  { id: 'a3', name: 'Mumbai Central', nameHi: 'मुंबई मध्य', level: 'DISTRICT' },
  { id: 'a4', name: 'Mumbai Suburban', nameHi: 'मुंबई उपनगरी', level: 'DISTRICT' },
  { id: 'a5', name: 'Pune District', nameHi: 'पुणे जिला', level: 'DISTRICT' },
  { id: 'a6', name: 'Mumbai Central Ward 8', nameHi: 'मुंबई मध्य वार्ड 8', level: 'WARD' },
  { id: 'a7', name: 'Mumbai Central Ward 12', nameHi: 'मुंबई मध्य वार्ड 12', level: 'WARD' },
  { id: 'a8', name: 'Mumbai Suburban Ward 5', nameHi: 'मुंबई उपनगरी वार्ड 5', level: 'WARD' },
  { id: 'a9', name: 'Pune Ward 3', nameHi: 'पुणे वार्ड 3', level: 'WARD' },
];

const CATEGORIES = [
  'Weighbridge', 'Shop Scale (0–30 kg)', 'Fuel Dispenser', 'Platform Scale', 'Analytical Balance', 'Tank Lorry', 'Water Meter', 'Electricity Meter'
];

/* ─── SESSIONS (for settings panel) ────────────────────────── */
const SESSIONS = [
  { ref: 'sess-current', createdAt: Date.now() - 3600000, lastSeen: Date.now(), ua: 'Chrome 120 / Windows 11', current: true },
  { ref: 'sess-mobile', createdAt: Date.now() - 86400000 * 3, lastSeen: Date.now() - 86400000 * 2, ua: 'Safari / iPhone iOS 17', current: false },
];
