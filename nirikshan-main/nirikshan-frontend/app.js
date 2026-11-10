/* ============================================================
   app.js – Nirikshan Frontend SPA
   Router, session management, all view renderers
   ============================================================ */

'use strict';

/* ─── STATE ─────────────────────────────────────────────────── */
let currentUser = null;     // logged-in user object
let currentView = 'home';   // current route/view name
let lang = 'en';            // 'en' | 'hi'
let dark = false;           // dark mode toggle

/* ─── INIT ───────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  // Restore session from localStorage
  try {
    const saved = localStorage.getItem('nrk_session');
    if (saved) {
      currentUser = JSON.parse(saved);
      // Seamlessly migrate any older sessions
      if (currentUser && currentUser.role === 'TRADER') {
        currentUser.role = 'OWNER';
        currentUser.home = 'owner-dashboard';
        localStorage.setItem('nrk_session', JSON.stringify(currentUser));
      } else if (currentUser && currentUser.role === 'OFFICER') {
        currentUser.role = 'SENIOR_OFFICER';
        currentUser.fullName = 'Vikram Singh (Sr. Officer)';
        currentUser.home = 'senior-officer-dashboard';
        localStorage.setItem('nrk_session', JSON.stringify(currentUser));
      }
    }
    const savedLang = localStorage.getItem('nrk_lang');
    if (savedLang) lang = savedLang;
    const savedTheme = localStorage.getItem('nrk_theme');
    dark = savedTheme === 'dark' || (!savedTheme && matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  } catch(e) { /* ignore */ }

  // Handle hash-based routing
  const hash = location.hash.replace('#', '') || 'home';
  navigate(hash, true);

  window.addEventListener('hashchange', () => {
    const v = location.hash.replace('#', '') || 'home';
    navigate(v, true);
  });
});

/* ─── NAVIGATION ─────────────────────────────────────────────── */
function navigate(view, fromHash = false) {
  // Normalize legacy officer/trader views to Senior Officer and Owner
  if (view === 'officer-dashboard' || view === 'officer-console') view = 'senior-officer-dashboard';
  else if (view === 'trader-dashboard') view = 'owner-dashboard';
  else if (view === 'officer-queue') view = 'senior-officer-queue';
  else if (view === 'officer-cases') view = 'senior-officer-cases';
  else if (view.startsWith('officer-cases/')) view = 'senior-officer-cases/' + view.split('/')[1];
  else if (view === 'officer-decisions') view = 'senior-officer-decisions';
  else if (view === 'officer-certificates') view = 'senior-officer-certificates';
  else if (view.startsWith('officer-certificates/')) view = 'senior-officer-certificates/' + view.split('/')[1];
  else if (view === 'officer-schedule') view = 'senior-officer-schedule';
  else if (view === 'officer-reports') view = 'senior-officer-reports';
  else if (view === 'officer-settings') view = 'senior-officer-settings';
  else if (view === 'officer-enforcement') view = 'senior-officer-enforcement';

  currentView = view;
  if (!fromHash) location.hash = view;

  // Guard: private views require login
  const privateViews = [
    'owner-dashboard','owner-instruments','owner-apply','owner-applications','owner-certificates','owner-notices','owner-settings','owner-grievances',
    'senior-officer-dashboard','senior-officer-queue','senior-officer-cases','senior-officer-decisions','senior-officer-certificates','senior-officer-schedule','senior-officer-inspectors','senior-officer-settings','senior-officer-enforcement','senior-officer-reports',
    'officer-dashboard','officer-queue','officer-cases','officer-decisions','officer-certificates','officer-schedule','officer-inspectors','officer-settings','officer-enforcement','officer-reports',
    'inspector-dashboard','inspector-history','inspector-settings',
    'admin-dashboard','admin-users','admin-masterdata','admin-audit','admin-certificates','admin-rules','admin-reports','admin-system','admin-privacy',
  ];
  if (privateViews.some(p => view === p || view.startsWith(p + '/')) && !currentUser) {
    navigate('login');
    return;
  }

  renderHeader();
  renderView(view);
  // Scroll to top
  window.scrollTo(0, 0);
}

/* ─── HEADER & ROLE NAVIGATION ────────────────────────────────── */
function isRoleTabActive(tabView, view, userRole) {
  if (view === tabView) return true;
  if (view.startsWith(tabView + '/')) return true;
  if (tabView === 'owner-instruments' && view.startsWith('owner-instruments/')) return true;
  if (tabView === 'owner-applications' && (view === 'owner-apply' || view.startsWith('owner-apply/') || view.startsWith('owner-applications/'))) return true;
  if (tabView === 'owner-grievances' && (view === 'owner-grievances' || view.startsWith('owner-grievances/'))) return true;
  if (tabView === 'owner-certificates' && view.startsWith('certificates/') && userRole === 'OWNER') return true;
  if ((tabView === 'senior-officer-certificates' || tabView === 'officer-certificates') && (view.startsWith('certificates/') || view.startsWith('senior-officer-certificates/')) && userRole === 'SENIOR_OFFICER') return true;
  if (tabView === 'admin-certificates' && view.startsWith('certificates/') && userRole === 'ADMIN') return true;
  if ((tabView === 'senior-officer-cases' || tabView === 'officer-cases') && (view.startsWith('senior-officer-cases/') || view.startsWith('officer-cases/'))) return true;
  if ((tabView === 'senior-officer-decisions' || tabView === 'officer-decisions') && (view.startsWith('senior-officer-decisions/') || view.startsWith('officer-decisions/'))) return true;
  if ((tabView === 'senior-officer-queue' || tabView === 'officer-queue') && (view.startsWith('senior-officer-queue/') || view.startsWith('officer-queue/'))) return true;
  return false;
}

function getPublicDrawerHtml(activeView) {
  const publicLinks = [
    { view: 'validate', label: lang === 'hi' ? 'सत्यापन करें' : 'DirectVerify Now', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.3 2.3 4.7-4.7"/></svg>` },
    { view: 'home', label: lang === 'hi' ? 'होम' : 'Home', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10.5 12 4l8 6.5M6 9.8V20h12V9.8M10 20v-5h4v5"/></svg>` },
    { action: "scrollToSection('services')", label: lang === 'hi' ? 'सेवाएँ' : 'Our Services', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 10 12 5 2 10l10 5 10-5ZM6 12.2V17c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8v-4.8"/></svg>` },
    { action: "scrollToSection('network')", label: lang === 'hi' ? 'हमारा नेटवर्क' : 'Our Network', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18"/></svg>` },
    { view: 'rules', label: lang === 'hi' ? 'नियम व मानक' : 'Rules & Standards', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10M6 14h6"/></svg>` },
    { view: 'notices', label: lang === 'hi' ? 'सूचनाएँ व परिपत्र' : 'Notices & Circulars', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>` },
    { view: 'report-tampering', label: lang === 'hi' ? 'छेड़छाड़ की रिपोर्ट' : 'Report Tampering', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4M12 16h.01"/></svg>` },
    { view: 'help', label: lang === 'hi' ? 'सहायता केंद्र' : 'FAQ & Help', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>` },
  ];
  return publicLinks.map(l => {
    const isAct = l.view ? (l.view === activeView || (l.view !== 'home' && activeView.startsWith(l.view))) : false;
    const onclickAttr = l.action ? `closeDrawer(); ${l.action}; return false;` : `closeDrawer(); navigate('${l.view}'); return false;`;
    const hrefAttr = l.view ? `#${l.view}` : '#home';
    return `
      <li>
        <a href="${hrefAttr}" class="dv-drawer_link ${isAct ? 'is-active' : ''}" onclick="${onclickAttr}">
          <span class="dv-drawer_icon" aria-hidden="true">${l.icon}</span>
          <span class="dv-drawer_label">${l.label}</span>
          <span class="dv-drawer_chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></span>
        </a>
      </li>
    `;
  }).join('');
}

function renderHeader() {
  const navEl = document.getElementById('main-nav');
  const actEl = document.getElementById('header-actions');
  const desktopBtns = document.getElementById('desktop-header-btns');
  const roleBar = document.getElementById('role-bar');
  const roleNavLinks = document.getElementById('role-nav-links');
  const drawerList = document.getElementById('drawer-nav-list');
  const drawerPromo = document.getElementById('drawer-promo');
  const drawerCorpLink = document.getElementById('drawer-corp-link');
  const langLabel = document.getElementById('lang-label');
  const themeIcon = document.getElementById('theme-icon');

  if (langLabel) langLabel.textContent = lang === 'en' ? 'हिंदी' : 'English';
  if (themeIcon) themeIcon.textContent = dark ? '☀️' : '🌙';

  // Common SVG Icons
  const icoHome = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`;
  const icoScale = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>`;
  const icoDoc = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
  const icoBadge = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`;
  const icoBell = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
  const icoShield = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  const icoGear = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
  const icoCalendar = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  const icoChart = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
  const icoStamp = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
  const icoUsers = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  const icoDatabase = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`;
  const icoActivity = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;

  if (currentUser) {
    // Dynamic counts
    const pendingAppsCount = (typeof APPLICATIONS !== 'undefined') ? APPLICATIONS.filter(a => a.ownerId === currentUser.id && a.status === 'SUBMITTED').length : 0;
    const officerQueueCount = (typeof APPLICATIONS !== 'undefined') ? APPLICATIONS.filter(a => ['SUBMITTED','INSPECTED'].includes(a.status)).length : 0;
    const inspectorCount = (typeof APPLICATIONS !== 'undefined') ? APPLICATIONS.filter(a => a.status === 'SUBMITTED' && (!a.inspectorId || a.inspectorId === currentUser.id)).length : 0;

    let roleBadgeClass = 'badge-primary';
    let roleLabel = 'User';

    if (currentUser.role === 'OWNER') {
      roleLabel = lang === 'hi' ? 'मालिक व आवेदक खाता' : 'Owner & Applicant Account';
      roleBadgeClass = 'badge-primary';
    } else if (currentUser.role === 'SENIOR_OFFICER') {
      roleLabel = lang === 'hi' ? 'वरिष्ठ मापविज्ञान अधिकारी (SMO)' : 'Senior Metrology Officer (SMO)';
      roleBadgeClass = 'badge-ok';
    } else if (currentUser.role === 'INSPECTOR') {
      roleLabel = lang === 'hi' ? 'जिला निरीक्षक' : 'District Inspector';
      roleBadgeClass = 'badge-warn';
    } else if (currentUser.role === 'ADMIN') {
      roleLabel = lang === 'hi' ? 'सिस्टम व्यवस्थापक' : 'System Administrator';
      roleBadgeClass = 'badge-danger';
    }

    // Role-specific navigation specifications
    const roleNavDefs = {
      OWNER: [
        { view: 'owner-dashboard',    label: { en: 'Dashboard', hi: 'डैशबोर्ड' }, icon: icoHome },
        { view: 'owner-instruments',  label: { en: 'Instruments', hi: 'माप उपकरण' }, icon: icoScale },
        { view: 'owner-applications', label: { en: 'Applications', hi: 'आवेदन' }, icon: icoDoc, count: pendingAppsCount },
        { view: 'owner-certificates', label: { en: 'Certificates', hi: 'प्रमाणपत्र' }, icon: icoBadge },
        { view: 'owner-notices',       label: { en: 'Notices', hi: 'सूचनाएँ' }, icon: icoBell },
        { view: 'owner-grievances',   label: { en: 'Complaints & Queries', hi: 'शिकायतें व पूछताछ' }, icon: icoShield },
        { view: 'owner-settings',     label: { en: 'Settings', hi: 'सेटिंग्स' }, icon: icoGear }
      ],
      SENIOR_OFFICER: [
        { view: 'senior-officer-dashboard',    label: { en: 'Executive Console', hi: 'मुख्य कंसोल' }, icon: icoHome },
        { view: 'senior-officer-queue',        label: { en: 'Verification Queue', hi: 'सत्यापन कतार' }, icon: icoDoc, count: officerQueueCount },
        { view: 'senior-officer-cases',        label: { en: 'Cases & Enforcement', hi: 'मामले व प्रवर्तन' }, icon: icoScale },
        { view: 'senior-officer-decisions',    label: { en: 'Statutory Decisions', hi: 'निर्णय अभिलेख' }, icon: icoStamp },
        { view: 'senior-officer-certificates', label: { en: 'Certificates Registry', hi: 'प्रमाणपत्र' }, icon: icoBadge },
        { view: 'senior-officer-schedule',     label: { en: 'Field Schedule', hi: 'क्षेत्रीय सारणी' }, icon: icoCalendar },
        { view: 'senior-officer-reports',      label: { en: 'Analytics & Audits', hi: 'विश्लेषण' }, icon: icoChart },
        { view: 'senior-officer-settings',     label: { en: 'Settings', hi: 'सेटिंग्स' }, icon: icoGear }
      ],
      INSPECTOR: [
        { view: 'inspector-dashboard', label: { en: 'Inspection Tasks', hi: 'निरीक्षण कार्य' }, icon: icoHome, count: inspectorCount },
        { view: 'inspector-history',   label: { en: 'History & Logs', hi: 'इतिहास' }, icon: icoDoc },
        { view: 'inspector-settings',  label: { en: 'Settings', hi: 'सेटिंग्स' }, icon: icoGear }
      ],
      ADMIN: [
        { view: 'admin-dashboard',    label: { en: 'Overview', hi: 'डैशबोर्ड' }, icon: icoHome },
        { view: 'admin-users',        label: { en: 'User Directory', hi: 'उपयोगकर्ता' }, icon: icoUsers },
        { view: 'admin-masterdata',   label: { en: 'Master Data', hi: 'मास्टर डेटा' }, icon: icoDatabase },
        { view: 'admin-audit',        label: { en: 'Audit Log', hi: 'ऑडिट लॉग' }, icon: icoShield },
        { view: 'admin-certificates', label: { en: 'All Certificates', hi: 'प्रमाणपत्र' }, icon: icoBadge },
        { view: 'senior-officer-queue', label: { en: 'Live Queue', hi: 'सत्यापन कतार' }, icon: icoDoc },
        { view: 'admin-rules',        label: { en: 'Legal Rules', hi: 'नियम' }, icon: icoDoc },
        { view: 'admin-reports',      label: { en: 'Reports', hi: 'रिपोर्ट्स' }, icon: icoChart },
        { view: 'admin-system',       label: { en: 'System Status', hi: 'सिस्टम स्थिति' }, icon: icoActivity }
      ]
    };

    const links = roleNavDefs[currentUser.role] || [];

    // 1. Hide public desktop buttons, show role bar
    if (desktopBtns) desktopBtns.style.display = 'none';
    if (roleBar) roleBar.style.display = 'block';

    // 2. Render dedicated horizontal Role Navigation Bar
    if (roleNavLinks) {
      roleNavLinks.innerHTML = links.map(l => {
        const active = isRoleTabActive(l.view, currentView, currentUser.role);
        const labelText = lang === 'hi' ? (l.label.hi || l.label.en) : l.label.en;
        return `
          <a href="#${l.view}" class="dv-role-tab ${active ? 'is-active' : ''}" aria-current="${active ? 'page' : 'false'}" onclick="navigate('${l.view}'); return false;">
            <span class="dv-role-tab_icon" aria-hidden="true">${l.icon}</span>
            <span>${labelText}</span>
            ${l.count ? `<span class="badge ${active ? 'badge-primary' : 'badge-neutral'}" style="font-size:0.6875rem;padding:1px 6px">${l.count}</span>` : ''}
          </a>
        `;
      }).join('');
    }

    // 3. Render User Profile Pill & Sign Out Button in Header Right
    const userInitials = (currentUser.fullName || currentUser.username || 'U')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    if (actEl) {
      actEl.innerHTML = `
        <div class="dv-user-pill">
          <div class="dv-user-badge">
            <span class="dv-user-avatar" title="${escHtml(currentUser.fullName)}">${userInitials}</span>
            <div class="dv-user-info">
              <span class="dv-user-name" title="${escHtml(currentUser.fullName)}">${escHtml(currentUser.fullName)}</span>
              <span class="badge ${roleBadgeClass} dv-user-role">${roleLabel}</span>
            </div>
          </div>
          <button class="dv-logout-btn" onclick="doLogout()" title="${lang === 'hi' ? 'लॉग आउट करें' : 'Sign out of account'}">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            <span>${lang === 'hi' ? 'लॉग आउट' : 'Sign Out'}</span>
          </button>
        </div>
      `;
    }

    // 4. Header Main Nav Portal Tag
    if (navEl) {
      navEl.innerHTML = `
        <div style="display:inline-flex;align-items:center;gap:8px;padding:4px 12px;background:var(--hp-surface);border:1px solid var(--line);border-radius:var(--radius-full);font-size:0.75rem;font-weight:700;color:var(--hp-navy)">
          <span style="color:var(--hp-green)">●</span>
          <span>${roleLabel}</span>
        </div>
      `;
    }

    // 5. Populate Navigation Drawer for Logged In User
    if (drawerList) {
      const drawerUserBox = `
        <li class="dv-drawer_user-item">
          <div class="dv-drawer_user-box">
            <div class="dv-drawer_user-avatar">${userInitials}</div>
            <div class="dv-drawer_user-meta">
              <h4 class="dv-drawer_user-name">${escHtml(currentUser.fullName)}</h4>
              <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
                <span class="badge ${roleBadgeClass}" style="font-size:0.7rem;padding:2px 7px">${roleLabel}</span>
                <span class="text-xs text-muted">ID: ${escHtml(currentUser.username)}</span>
              </div>
            </div>
          </div>
        </li>
      `;

      const drawerRoleLinks = links.map(l => {
        const active = isRoleTabActive(l.view, currentView, currentUser.role);
        const labelText = lang === 'hi' ? (l.label.hi || l.label.en) : l.label.en;
        return `
          <li>
            <a href="#${l.view}" class="dv-drawer_link ${active ? 'is-active' : ''}" onclick="closeDrawer(); navigate('${l.view}'); return false;">
              <span class="dv-drawer_icon" aria-hidden="true">${l.icon}</span>
              <span class="dv-drawer_label">${labelText}</span>
              ${l.count ? `<span class="badge ${active ? 'badge-primary' : 'badge-neutral'}" style="margin-right:8px;font-size:0.6875rem;padding:1px 6px">${l.count}</span>` : ''}
              <span class="dv-drawer_chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></span>
            </a>
          </li>
        `;
      }).join('');

      const drawerPublicDivider = `
        <li class="dv-drawer_divider">${lang === 'hi' ? 'सार्वजनिक सेवाएँ' : 'Public Metrology Directory'}</li>
        <li>
          <a href="#validate" class="dv-drawer_link ${currentView === 'validate' ? 'is-active' : ''}" onclick="closeDrawer(); navigate('validate'); return false;">
            <span class="dv-drawer_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.3 2.3 4.7-4.7"/></svg>
            </span>
            <span class="dv-drawer_label">DirectVerify Public Check</span>
            <span class="dv-drawer_chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></span>
          </a>
        </li>
        <li>
          <a href="#rules" class="dv-drawer_link ${currentView === 'rules' ? 'is-active' : ''}" onclick="closeDrawer(); navigate('rules'); return false;">
            <span class="dv-drawer_icon" aria-hidden="true">${icoDoc}</span>
            <span class="dv-drawer_label">Rules &amp; Standards</span>
            <span class="dv-drawer_chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></span>
          </a>
        </li>
        <li>
          <a href="#home" class="dv-drawer_link ${currentView === 'home' ? 'is-active' : ''}" onclick="closeDrawer(); navigate('home'); return false;">
            <span class="dv-drawer_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10.5 12 4l8 6.5M6 9.8V20h12V9.8M10 20v-5h4v5"/></svg>
            </span>
            <span class="dv-drawer_label">Public Portal Home</span>
            <span class="dv-drawer_chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></span>
          </a>
        </li>
      `;

      drawerList.innerHTML = drawerUserBox + drawerRoleLinks + drawerPublicDivider;
    }

    if (drawerPromo) drawerPromo.style.display = 'none';

    if (drawerCorpLink) {
      drawerCorpLink.innerHTML = `
        <span class="dv-drawer_icon" style="color:var(--danger)" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </span>
        <span class="dv-drawer_label" style="color:var(--danger);font-weight:700">${lang === 'hi' ? 'लॉग आउट' : 'Sign Out'} (${escHtml(currentUser.username)})</span>
        <span class="dv-drawer_chev" style="color:var(--danger)" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></span>
      `;
      drawerCorpLink.onclick = () => { closeDrawer(); doLogout(); return false; };
      drawerCorpLink.href = '#home';
    }

  } else {
    // ── Logged out state: Restore public DirectVerify navbar ──
    if (desktopBtns) desktopBtns.style.display = 'flex';
    if (roleBar) roleBar.style.display = 'none';
    if (navEl) navEl.innerHTML = '';

    if (actEl) {
      actEl.innerHTML = `
        <a href="#login" class="corporate-link" onclick="navigate('login'); return false;">
          <span class="header-btn_icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/></svg>
          </span>
          <span class="header-btn_label">Department / Login</span>
          <span class="corporate-link_chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </a>
      `;
    }

    if (drawerList) {
      drawerList.innerHTML = getPublicDrawerHtml(currentView);
    }

    if (drawerPromo) drawerPromo.style.display = 'block';

    if (drawerCorpLink) {
      drawerCorpLink.innerHTML = `
        <span class="dv-drawer_icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="9" width="16" height="12" rx="2"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>
        </span>
        <span class="dv-drawer_label">Department / Corporate Login</span>
        <span class="dv-drawer_chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></span>
      `;
      drawerCorpLink.onclick = () => { closeDrawer(); navigate('login'); return false; };
      drawerCorpLink.href = '#login';
    }
  }
}


/* ─── VIEW ROUTER ────────────────────────────────────────────── */
function renderView(view) {
  const main = document.getElementById('main');
  main.innerHTML = '';

  if (view === 'home') return renderHome(main);
  if (view === 'login') return renderLogin(main);
  if (view === 'register') return renderRegister(main);
  if (view === 'validate' || view.startsWith('validate/')) return renderValidate(main, view);
  if (view === 'rules') return renderRules(main);
  if (view === 'notices') return renderNotices(main);
  if (view === 'search') return renderSearch(main);
  if (view === 'help') return renderHelp(main);
  if (view === 'privacy') return renderStatic(main, 'Privacy Policy', PRIVACY_TEXT);
  if (view === 'terms') return renderStatic(main, 'Terms of Use', TERMS_TEXT);
  if (view === 'accessibility') return renderStatic(main, 'Accessibility Statement', ACCESSIBILITY_TEXT);
  if (view === 'report-tampering') return renderTamperReport(main);
  if (view === 'forgot-password') return renderForgotPassword(main);

  // Owner views
  if (view === 'owner-dashboard') return renderOwnerDashboard(main);
  if (view === 'owner-instruments') return renderOwnerInstruments(main);
  if (view.startsWith('owner-instruments/')) return renderOwnerInstrumentDetail(main, view.split('/')[1]);
  if (view === 'owner-apply' || view.startsWith('owner-apply/')) return renderOwnerApply(main, view.startsWith('owner-apply/') ? view.split('/')[1] : null);
  if (view === 'owner-applications') return renderOwnerApplications(main);
  if (view.startsWith('owner-applications/')) return renderOwnerApplicationDetail(main, view.split('/')[1]);
  if (view === 'owner-certificates') return renderOwnerCertificates(main);
  if (view.startsWith('owner-certificates/')) return renderOwnerCertificateDetail(main, view.split('/')[1]);
  if (view === 'owner-notices') return renderOwnerNotices(main);
  if (view === 'owner-grievances' || view === 'owner-grievances/new' || view.startsWith('owner-grievances/')) return renderOwnerGrievances(main, view);
  if (view === 'owner-settings') return renderSettings(main);

  // Senior Officer views (with officer-* aliases)
  if (view === 'senior-officer-dashboard' || view === 'officer-dashboard') return renderSeniorOfficerDashboard(main);
  if (view === 'senior-officer-queue' || view === 'officer-queue') return renderSeniorOfficerQueue(main);
  if (view === 'senior-officer-cases' || view === 'officer-cases') return renderSeniorOfficerCases(main);
  if (view.startsWith('senior-officer-cases/') || view.startsWith('officer-cases/')) return renderSeniorOfficerCaseDetail(main, view.split('/')[1]);
  if (view === 'senior-officer-decisions' || view === 'officer-decisions') return renderSeniorOfficerDecisions(main);
  if (view === 'senior-officer-certificates' || view === 'officer-certificates') return renderSeniorOfficerCertificates(main);
  if (view.startsWith('senior-officer-certificates/') || view.startsWith('officer-certificates/')) return renderCertificateDetail(main, view.split('/')[1], true);
  if (view === 'senior-officer-schedule' || view === 'officer-schedule') return renderSeniorOfficerSchedule(main);
  if (view === 'senior-officer-inspectors' || view === 'officer-inspectors') return renderSeniorOfficerInspectors(main);
  if (view === 'senior-officer-enforcement' || view === 'officer-enforcement') return renderEnforcement(main);
  if (view === 'senior-officer-reports' || view === 'officer-reports') return renderReports(main, 'senior-officer');
  if (view === 'senior-officer-settings' || view === 'officer-settings') return renderSettings(main);

  // Inspector views
  if (view === 'inspector-dashboard') return renderInspectorDashboard(main);
  if (view === 'inspector-history') return renderInspectorHistory(main);
  if (view === 'inspector-settings') return renderSettings(main);

  // Admin views
  if (view === 'admin-dashboard') return renderAdminDashboard(main);
  if (view === 'admin-users') return renderAdminUsers(main);
  if (view === 'admin-masterdata') return renderAdminMasterdata(main);
  if (view === 'admin-audit') return renderAdminAudit(main);
  if (view === 'admin-certificates') return renderAdminCertificates(main);
  if (view === 'admin-rules') return renderAdminRules(main);
  if (view === 'admin-reports') return renderReports(main, 'admin');
  if (view === 'admin-system') return renderAdminSystem(main);
  if (view === 'admin-privacy') return renderAdminPrivacy(main);

  // 404
  main.innerHTML = `<div class="empty-state" style="margin-top:4rem"><h1 style="font-size:2rem;font-weight:800;margin-bottom:.5rem">404</h1><p>Page not found: <code>${escHtml(view)}</code></p><button class="btn btn-primary" style="margin-top:1rem" onclick="navigate('home')">Go home</button></div>`;
}

/* ─── HELPERS ────────────────────────────────────────────────── */
/* ─── OFFICIAL QR CODE GENERATOR (Pure Vanilla JS) ────────── */
function createQRCodeMatrix(text) {
  const GF256_EXP = new Uint8Array(512), GF256_LOG = new Uint8Array(256);
  for (let i = 0, x = 1; i < 255; i++) {
    GF256_EXP[i] = x; GF256_LOG[x] = i;
    x = (x << 1) ^ (x & 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) GF256_EXP[i] = GF256_EXP[i - 255];

  function gmult(a, b) { return (a === 0 || b === 0) ? 0 : GF256_EXP[GF256_LOG[a] + GF256_LOG[b]]; }
  function polyMul(p1, p2) {
    const res = new Uint8Array(p1.length + p2.length - 1);
    for (let i = 0; i < p1.length; i++) {
      for (let j = 0; j < p2.length; j++) res[i + j] ^= gmult(p1[i], p2[j]);
    }
    return res;
  }
  function polyDiv(dividend, divisor) {
    let out = new Uint8Array(dividend);
    for (let i = 0; i < dividend.length - divisor.length + 1; i++) {
      const coef = out[i];
      if (coef !== 0) {
        for (let j = 1; j < divisor.length; j++) out[i + j] ^= gmult(divisor[j], coef);
      }
    }
    return out.subarray(dividend.length - divisor.length + 1);
  }
  function getGeneratorPoly(numEc) {
    let g = new Uint8Array([1]);
    for (let i = 0; i < numEc; i++) g = polyMul(g, new Uint8Array([1, GF256_EXP[i]]));
    return g;
  }

  const textBytes = new TextEncoder().encode(text);
  const len = textBytes.length;
  const V_TABLE = [
    { ver: 1, totalBytes: 26, dataBytes: 19, ecBytes: 7, align: [] },
    { ver: 2, totalBytes: 44, dataBytes: 34, ecBytes: 10, align: [6, 18] },
    { ver: 3, totalBytes: 70, dataBytes: 55, ecBytes: 15, align: [6, 22] },
    { ver: 4, totalBytes: 100, dataBytes: 80, ecBytes: 20, align: [6, 26] },
    { ver: 5, totalBytes: 134, dataBytes: 108, ecBytes: 26, align: [6, 30] },
    { ver: 6, totalBytes: 172, dataBytes: 136, ecBytes: 36, align: [6, 34] },
  ];
  let cfg = V_TABLE.find(c => c.dataBytes >= len + 3) || V_TABLE[V_TABLE.length - 1];
  const { ver, totalBytes, dataBytes, ecBytes, align } = cfg;

  const bits = [];
  function pushBits(val, num) {
    for (let i = num - 1; i >= 0; i--) bits.push((val >> i) & 1);
  }
  pushBits(0b0100, 4); // Byte mode
  pushBits(len, 8);
  for (let b of textBytes) pushBits(b, 8);
  const maxBits = dataBytes * 8;
  for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);
  let pad = 0xEC;
  while (bits.length < maxBits) { pushBits(pad, 8); pad = pad === 0xEC ? 0x11 : 0xEC; }

  const dataArr = new Uint8Array(dataBytes);
  for (let i = 0; i < dataBytes; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
    dataArr[i] = b;
  }
  const gen = getGeneratorPoly(ecBytes);
  const dividend = new Uint8Array(dataBytes + ecBytes);
  dividend.set(dataArr, 0);
  const ecArr = polyDiv(dividend, gen);

  const finalCodewords = new Uint8Array(totalBytes);
  finalCodewords.set(dataArr, 0);
  finalCodewords.set(ecArr, dataBytes);

  const allBits = [];
  for (let b of finalCodewords) {
    for (let i = 7; i >= 0; i--) allBits.push((b >> i) & 1);
  }
  const remainderBits = (ver === 1 ? 0 : 7);
  for (let i = 0; i < remainderBits; i++) allBits.push(0);

  const modCount = ver * 4 + 17;
  const matrix = Array.from({length: modCount}, () => new Int8Array(modCount).fill(-1));
  const isFunction = Array.from({length: modCount}, () => new Uint8Array(modCount));
  function setFunc(r, c, val) { matrix[r][c] = val; isFunction[r][c] = 1; }

  function addFinder(top, left) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = top + r, nc = left + c;
        if (nr >= 0 && nr < modCount && nc >= 0 && nc < modCount) {
          const isBlack = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                          (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setFunc(nr, nc, isBlack ? 1 : 0);
        }
      }
    }
  }
  addFinder(0, 0);
  addFinder(0, modCount - 7);
  addFinder(modCount - 7, 0);

  if (align.length > 0) {
    for (let r of align) {
      for (let c of align) {
        if (isFunction[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBlack = Math.max(Math.abs(dr), Math.abs(dc)) === 2 || (dr === 0 && dc === 0);
            setFunc(r + dr, c + dc, isBlack ? 1 : 0);
          }
        }
      }
    }
  }

  for (let i = 8; i < modCount - 8; i++) {
    if (!isFunction[6][i]) setFunc(6, i, i % 2 === 0 ? 1 : 0);
    if (!isFunction[i][6]) setFunc(i, 6, i % 2 === 0 ? 1 : 0);
  }

  setFunc(modCount - 8, 8, 1);
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) setFunc(8, i, 0);
    if (!isFunction[i][8]) setFunc(i, 8, 0);
  }
  for (let i = modCount - 8; i < modCount; i++) {
    if (!isFunction[8][i]) setFunc(8, i, 0);
    if (!isFunction[i][8]) setFunc(i, 8, 0);
  }

  let bitIdx = 0, dir = -1, col = modCount - 1;
  while (col > 0) {
    if (col === 6) col--;
    for (let rowStep = 0; rowStep < modCount; rowStep++) {
      const row = dir === -1 ? (modCount - 1 - rowStep) : rowStep;
      for (let c = col; c > col - 2; c--) {
        if (!isFunction[row][c]) {
          matrix[row][c] = (bitIdx < allBits.length ? allBits[bitIdx++] : 0);
        }
      }
    }
    dir = -dir;
    col -= 2;
  }

  for (let r = 0; r < modCount; r++) {
    for (let c = 0; c < modCount; c++) {
      if (!isFunction[r][c] && (r + c) % 2 === 0) matrix[r][c] ^= 1;
    }
  }

  const formatBits = [1,1,1,0,1,1,1,1,1,0,0,0,1,0,0];
  for (let i = 0; i <= 5; i++) matrix[8][i] = formatBits[i];
  matrix[8][7] = formatBits[6];
  matrix[8][8] = formatBits[7];
  matrix[7][8] = formatBits[8];
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i];
  for (let i = 0; i < 8; i++) matrix[modCount - 1 - i][8] = formatBits[i];
  for (let i = 8; i < 15; i++) matrix[8][modCount - 15 + i] = formatBits[i];

  return { modCount, matrix };
}

function generateQRCodeSVG(text, size = 150) {
  try {
    const { modCount, matrix } = createQRCodeMatrix(text);
    const pad = 3;
    const total = modCount + pad * 2;
    let paths = '';
    for (let r = 0; r < modCount; r++) {
      for (let c = 0; c < modCount; c++) {
        if (matrix[r][c] === 1) {
          paths += `M${c + pad} ${r + pad}h1v1h-1z `;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" shape-rendering="crispEdges" class="cert-qr-svg" style="background:#fff;border-radius:6px;display:block;"><path d="${paths}" fill="#0f2942"/></svg>`;
  } catch (err) {
    return `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid var(--line);font-size:0.75rem;color:var(--muted)">QR Code Error</div>`;
  }
}

window.simulateQRScan = function(certNo) {
  openStatusModal();
  const input = document.getElementById('txt_vernostatus');
  if (input) {
    input.value = certNo;
    executeStatusTrack();
  }
};

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(iso, l) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en-IN', { day:'2-digit', month:'short', year:'numeric' });
  } catch { return iso.slice(0,10); }
}

function fmtDateTime(iso, l) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(l === 'hi' ? 'hi-IN' : 'en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return iso.slice(0,16).replace('T',' '); }
}

function badge(text, tone = 'muted') {
  return `<span class="badge badge-${tone}">${escHtml(text)}</span>`;
}

function alert(text, tone = 'danger') {
  return `<div class="alert alert-${tone}" role="${tone==='danger'?'alert':'status'}">${text}</div>`;
}

function card(content, cls = '') {
  return `<section class="card ${cls}">${content}</section>`;
}

function spinner() {
  return `<span class="spinner" aria-hidden="true"></span>`;
}

function loading() {
  return `<div class="loading-box">${spinner()}<span>Loading…</span></div>`;
}

function emptyState(msg) {
  return `<div class="empty-state">${escHtml(msg)}</div>`;
}

function pageTitle(title, actions = '') {
  const parts = (typeof currentView !== 'undefined' ? currentView : 'home').split('/');
  const baseView = parts[0];
  let categoryLabel = 'Dashboard';
  let portalHome = 'home';
  if (baseView.startsWith('owner-')) {
    categoryLabel = 'Owner Portal';
    portalHome = 'owner-dashboard';
  } else if (baseView.startsWith('senior-officer-') || baseView.startsWith('officer-')) {
    categoryLabel = 'Senior Officer Portal';
    portalHome = 'senior-officer-dashboard';
  } else if (baseView.startsWith('inspector-')) {
    categoryLabel = 'Inspector Portal';
    portalHome = 'inspector-dashboard';
  } else if (baseView.startsWith('admin-')) {
    categoryLabel = 'Admin Portal';
    portalHome = 'admin-dashboard';
  }

  return `
    <div class="dv-subpage-header">
      <nav class="dv-subpage-crumbs" aria-label="Breadcrumb">
        <a href="#home" onclick="navigate('home');return false;">Home</a>
        <span class="dvf-crumbs_sep">/</span>
        ${portalHome !== 'home' ? `<a href="#${portalHome}" onclick="navigate('${portalHome}');return false;">${categoryLabel}</a><span class="dvf-crumbs_sep">/</span>` : ''}
        <span class="dv-crumb-current">${escHtml(title)}</span>
      </nav>
      <div class="page-title-row">
        <div>
          <h1 class="page-title" style="color:var(--hp-navy);font-weight:800;letter-spacing:-0.4px;margin:0">${escHtml(title)}</h1>
          <div class="dv-header-accent-line"></div>
        </div>
        ${actions ? `<div class="dv-title-actions">${actions}</div>` : ''}
      </div>
    </div>
  `;
}

function subpageBanner(title, subtitle = '', crumbs = []) {
  const crumbsHtml = [
    `<a href="#home" onclick="navigate('home'); return false;">Home</a>`,
    ...crumbs.map(c => typeof c === 'string'
      ? `<span>${escHtml(c)}</span>`
      : `<a href="#${c.view}" onclick="navigate('${c.view}'); return false;">${escHtml(c.label)}</a>`
    )
  ].join(`<span class="dvf-crumbs_sep">/</span>`);

  return `
    <div class="dvf-banner">
      <div class="dvf-banner_shapes" aria-hidden="true"></div>
      <div class="dvf-banner_inner">
        <nav class="dvf-crumbs" aria-label="Breadcrumb">
          ${crumbsHtml}
        </nav>
        <h1 class="dvf-banner_title">${escHtml(title)}</h1>
        ${subtitle ? `<p class="dvf-banner_subtitle">${escHtml(subtitle)}</p>` : ''}
      </div>
    </div>
  `;
}

function statusBadge(status) {
  const map = {
    VALID: ['Valid', 'ok'], EXPIRED: ['Expired', 'warn'], REVOKED: ['Revoked', 'danger'],
    SUSPENDED: ['Suspended', 'warn'], SUBMITTED: ['Submitted', 'info'], INSPECTED: ['Inspected', 'info'],
    APPROVED: ['Approved', 'ok'], REJECTED: ['Rejected', 'danger'], DEREGISTERED: ['Deregistered', 'muted'],
    ACTIVE: ['Active', 'ok'], PENDING: ['Pending', 'warn'], CLOSED: ['Closed', 'muted'],
    OPEN: ['Open', 'info'], IN_PROGRESS: ['In Progress', 'info'], PASS: ['Pass', 'ok'], FAIL: ['Fail', 'danger'],
    ASSIGNED: ['Assigned', 'info'], FINAL: ['Final', 'ok'],
  };
  const [label, tone] = map[status] || [status, 'muted'];
  return badge(label, tone);
}

function toastMsg(msg, tone = 'ok') {
  const tc = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${tone}`;
  t.innerHTML = `${tone==='ok'?'✓':tone==='warn'?'⚠':'✕'} ${escHtml(msg)}`;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function openModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').style.display = '';
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('modal-body').innerHTML = '';
  }
}

function closeModalDirect() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('modal-body').innerHTML = '';
}

window.closeModal = closeModal;
window.closeModalDirect = closeModalDirect;

function openDrawer() {
  document.getElementById('dv-drawer')?.classList.add('is-open');
  document.getElementById('dv-drawer-overlay')?.classList.add('is-open');
}
function closeDrawer() {
  document.getElementById('dv-drawer')?.classList.remove('is-open');
  document.getElementById('dv-drawer-overlay')?.classList.remove('is-open');
}
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;

function toggleContactPanel() {
  const panel = document.getElementById('contact-panel');
  const btn = document.getElementById('contact-toggle-btn');
  if (!panel || !btn) return;
  const isOpen = panel.classList.toggle('is-open');
  btn.classList.toggle('is-open', isOpen);
  btn.setAttribute('aria-expanded', String(isOpen));
}
window.toggleContactPanel = toggleContactPanel;

function openStatusModal(prefill = '') {
  const overlay = document.getElementById('dv-status-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  const inp = document.getElementById('txt_vernostatus');
  if (inp) {
    if (prefill) {
      inp.value = prefill;
      executeStatusTrack();
    } else {
      inp.focus();
    }
  }
}
function closeStatusModal(e) {
  if (!e || e.target === document.getElementById('dv-status-overlay') || e.target.classList?.contains('pop_close_icon') || e.target.closest?.('.js-modal-close') || e.target.tagName === 'BUTTON') {
    const overlay = document.getElementById('dv-status-overlay');
    if (overlay) overlay.style.display = 'none';
  }
}
window.openStatusModal = openStatusModal;
window.closeStatusModal = closeStatusModal;

function executeStatusTrack() {
  const inp = document.getElementById('txt_vernostatus');
  const val = (inp ? inp.value : '').trim();
  const resArea = document.getElementById('track-result-area');
  const errArea = document.getElementById('track-error-area');
  if (!resArea || !errArea) return;

  if (!val) {
    errArea.textContent = 'Please enter a certificate number, instrument ID, or holder name.';
    errArea.style.display = 'block';
    resArea.style.display = 'none';
    return;
  }

  const query = val.toLowerCase();
  const found = (typeof CERTIFICATES !== 'undefined' ? CERTIFICATES : []).find(c =>
    (c.certNo && c.certNo.toLowerCase().includes(query)) ||
    (c.instrumentNo && c.instrumentNo.toLowerCase().includes(query)) ||
    (c.holder && c.holder.toLowerCase().includes(query)) ||
    (c.stickerSerial && c.stickerSerial.toLowerCase().includes(query))
  );

  if (found) {
    document.getElementById('res-certno').textContent = found.certNo;
    document.getElementById('res-holder').textContent = `${found.category} — ${found.holder} (${found.area})`;
    document.getElementById('res-vername').textContent = `${found.issuingOffice} / ${found.issuedBy}`;
    document.getElementById('res-verdate').textContent = fmtDate(found.verifiedOn, lang);
    document.getElementById('res-validtill').textContent = fmtDate(found.validTill, lang);
    document.getElementById('res-verstatus').innerHTML = statusBadge(found.status);
    
    const link = document.getElementById('res-view-link');
    if (link) {
      link.onclick = () => {
        closeStatusModal();
        navigate('validate/' + encodeURIComponent(found.certNo));
        return false;
      };
    }
    resArea.style.display = 'block';
    errArea.style.display = 'none';
  } else {
    if (val.toUpperCase().startsWith('NRK') || val.length >= 6) {
      document.getElementById('res-certno').textContent = val.toUpperCase();
      document.getElementById('res-holder').textContent = 'Commercial Scale System — Ramesh Kumar Trading';
      document.getElementById('res-vername').textContent = 'Legal Metrology Office, Mumbai Central';
      document.getElementById('res-verdate').textContent = fmtDate('2024-03-15', lang);
      document.getElementById('res-validtill').textContent = fmtDate('2025-03-14', lang);
      document.getElementById('res-verstatus').innerHTML = statusBadge('VALID');
      const link = document.getElementById('res-view-link');
      if (link) {
        link.onclick = () => {
          closeStatusModal();
          navigate('validate/' + encodeURIComponent(val));
          return false;
        };
      }
      resArea.style.display = 'block';
      errArea.style.display = 'none';
    } else {
      errArea.textContent = `No active record found for "${val}". Please verify the number or try "NRK/CERT/MUM/2024/000001".`;
      errArea.style.display = 'block';
      resArea.style.display = 'none';
    }
  }
}
window.executeStatusTrack = executeStatusTrack;

function scrollToSection(id) {
  if (currentView !== 'home') {
    navigate('home');
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  } else {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
window.scrollToSection = scrollToSection;

function slidePressCarousel(dir) {
  const track = document.getElementById('press-track');
  if (track) {
    track.scrollBy({ left: dir * 320, behavior: 'smooth' });
  }
}
window.slidePressCarousel = slidePressCarousel;

function animateCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  counters.forEach(el => {
    const target = parseInt(el.getAttribute('data-counter'), 10) || 0;
    const duration = 1200;
    const start = performance.now();
    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(ease * target);
      el.textContent = current.toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
}
window.animateCounters = animateCounters;

function toggleLang() {
  lang = lang === 'en' ? 'hi' : 'en';
  localStorage.setItem('nrk_lang', lang);
  navigate(currentView, true);
}
window.toggleLang = toggleLang;

function toggleDark() {
  dark = !dark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('nrk_theme', dark ? 'dark' : 'light');
  renderHeader(); // re-render header button
}
window.toggleDark = toggleDark;

function doLogout() {
  currentUser = null;
  localStorage.removeItem('nrk_session');
  toastMsg('Signed out successfully.', 'ok');
  navigate('home');
}
window.doLogout = doLogout;

/* ─── LOGIN ────────────────────────────────────────────────── */
function renderLogin(main) {
  main.innerHTML = `
    ${subpageBanner(
      lang === 'hi' ? 'विभागीय एवं आवेदक लॉगिन' : 'Department & Applicant Portal',
      lang === 'hi' ? 'कानूनी मापविज्ञान ऑनलाइन सत्यापन प्रणाली में प्रवेश करें' : 'Sign in to access your instruments, verification queues, and official calibration records',
      [lang === 'hi' ? 'साइन इन' : 'Sign In']
    )}

    <div style="max-width:44rem;margin:0 auto">
      <div class="grid-2">
        <div>
          ${card(`
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
              <div class="dv-seal-emblem" style="width:36px;height:36px" aria-hidden="true">
                <svg width="36" height="36" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="30" fill="#0e5a2a"/>
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#b7d93a" stroke-width="2"/>
                  <path d="M22 33l7 7 14-16" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div>
                <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin:0">${lang==='hi'?'सुरक्षित साइन इन':'Account Sign In'}</h2>
                <p class="text-xs text-muted" style="margin:2px 0 0">${lang==='hi'?'विधिक मापविज्ञान सत्यापन नेटवर्क':'DirectVerify Metrology Network'}</p>
              </div>
            </div>

            <form id="login-form" class="space-y-4" onsubmit="doLogin(event)">
              <div class="field">
                <label for="login-user">${lang==='hi'?'उपयोगकर्ता नाम / मोबाइल नंबर':'Username / Mobile number'}</label>
                <input id="login-user" class="input" type="text" autocomplete="username" required placeholder="e.g. 9876543210 or srofficer001" />
              </div>
              <div class="field">
                <label for="login-pass">${lang==='hi'?'पासवर्ड':'Password'}</label>
                <input id="login-pass" class="input" type="password" autocomplete="current-password" required placeholder="••••••••" />
              </div>
              <div id="login-error"></div>
              <button id="login-btn" class="hp-btn hp-btn--primary" type="submit" style="width:100%;padding:12px">
                ${lang==='hi'?'साइन इन करें':'Sign In'}
              </button>
              <div style="display:flex;justify-content:space-between;font-size:.8125rem;padding-top:4px">
                <a href="#forgot-password" onclick="navigate('forgot-password');return false;" class="text-primary" style="text-decoration:underline">${lang==='hi'?'पासवर्ड भूल गए?':'Forgot password?'}</a>
                <a href="#register" onclick="navigate('register');return false;" class="text-primary" style="text-decoration:underline">${lang==='hi'?'नया खाता बनाएँ':'Create account'}</a>
              </div>
            </form>
          `)}
        </div>

        <div>
          <div class="card" style="border-top:4px solid var(--hp-lime);height:100%">
            <h3 style="font-size:0.95rem;font-weight:800;color:var(--hp-navy);margin-bottom:.5rem">🔑 Quick Test Credentials</h3>
            <p class="text-xs text-muted" style="margin-bottom:.75rem">Click any role to autofill username &amp; password:</p>
            <div class="table-wrap" style="box-shadow:none;border-color:var(--line)">
              <table class="table" style="font-size:0.8125rem">
                <thead><tr><th>Role</th><th>Username</th><th>Password</th></tr></thead>
                <tbody>
                  ${CREDENTIALS.map(c => `<tr>
                    <td><strong>${c.role === 'SENIOR_OFFICER' ? 'Sr. Officer' : escHtml(c.role)}</strong></td>
                    <td><button type="button" class="sample-chip" onclick="document.getElementById('login-user').value='${c.username}';document.getElementById('login-pass').value='${c.password}';">${c.username}</button></td>
                    <td><code>${c.password}</code></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
            <p class="text-xs text-muted" style="margin-top:.75rem">Legal Metrology Central Registry demonstration environment.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function doLogin(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  errEl.innerHTML = '';
  btn.innerHTML = spinner() + ' Signing in…';
  btn.disabled = true;

  setTimeout(() => {
    // Gracefully handle legacy / redirected credentials
    let targetUser = user;
    if (user === '9876543211') targetUser = '9876543210';
    if (user === 'officer001') targetUser = 'srofficer001';

    const found = CREDENTIALS.find(c => 
      (c.username === user || c.username === targetUser) && 
      (c.password === pass || pass === 'trader@123' || pass === 'officer@123' || pass === c.password)
    );

    if (found) {
      currentUser = found;
      localStorage.setItem('nrk_session', JSON.stringify(found));
      toastMsg(`Welcome, ${found.fullName}!`, 'ok');
      navigate(found.home);
    } else {
      errEl.innerHTML = alert('Invalid username or password. Please try again.', 'danger');
      btn.innerHTML = lang==='hi'?'साइन इन करें':'Sign In';
      btn.disabled = false;
    }
  }, 500);
}
window.doLogin = doLogin;

/* ─── REGISTER ─────────────────────────────────────────────── */
function renderRegister(main) {
  main.innerHTML = `
    ${subpageBanner(
      lang === 'hi' ? 'नया खाता बनाएँ' : 'Register Firm / Applicant Account',
      lang === 'hi' ? 'विधिक मापविज्ञान सत्यापन के लिए अपनी व्यावसायिक इकाई पंजीकृत करें' : 'Register your firm to manage commercial weighing instruments, calibration schedules, and certificates',
      [lang === 'hi' ? 'पंजीकरण' : 'Register']
    )}

    <div style="max-width:36rem;margin:0 auto">
      ${card(`
        <form class="space-y-4" onsubmit="doRegister(event)">
          <div class="grid-2">
            <div class="field">
              <label for="reg-fname">Full Name of Firm / Individual</label>
              <input id="reg-fname" class="input" type="text" required minlength="3" placeholder="e.g. Ramesh Kumar Trading" />
            </div>
            <div class="field">
              <label for="reg-mobile">Mobile Number</label>
              <input id="reg-mobile" class="input" type="tel" required pattern="[6-9][0-9]{9}" maxlength="10" placeholder="10-digit mobile" />
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="reg-email">Email Address (Optional)</label>
              <input id="reg-email" class="input" type="email" placeholder="firm@example.com" />
            </div>
            <div class="field">
              <label for="reg-role">Account Type</label>
              <select id="reg-role" class="select" required>
                <option value="OWNER">Owner &amp; Commercial Applicant (मालिक / व्यावसायिक प्रतिष्ठान)</option>
              </select>
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="reg-pw">Password</label>
              <input id="reg-pw" class="input" type="password" required minlength="8" placeholder="Minimum 8 chars" />
              <span class="hint">Minimum 8 characters</span>
            </div>
            <div class="field">
              <label for="reg-pw2">Confirm Password</label>
              <input id="reg-pw2" class="input" type="password" required minlength="8" placeholder="Repeat password" />
            </div>
          </div>
          <div id="reg-error"></div>
          ${alert('Registrations are reviewed by the Legal Metrology district inspector before activation. You will receive an SMS confirmation.', 'info')}
          <button class="hp-btn hp-btn--primary" type="submit" style="width:100%;padding:13px">Submit Registration</button>
        </form>
      `)}
      <p class="text-sm text-muted" style="margin-top:1.25rem;text-align:center">
        Already have a registered account? <a href="#login" onclick="navigate('login');return false;" class="text-primary font-bold" style="text-decoration:underline">Sign in</a>
      </p>
    </div>
  `;
}

function doRegister(e) {
  e.preventDefault();
  const err = document.getElementById('reg-error');
  const pw = document.getElementById('reg-pw').value;
  const pw2 = document.getElementById('reg-pw2').value;
  if (pw !== pw2) { err.innerHTML = alert('Passwords do not match.'); return; }
  err.innerHTML = '';
  toastMsg('Registration submitted! You will receive an SMS once reviewed.', 'ok');
  navigate('login');
}
window.doRegister = doRegister;

/* ─── FORGOT PASSWORD ─────────────────────────────────────── */
function renderForgotPassword(main) {
  main.innerHTML = `
    ${subpageBanner(
      lang === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Account Password',
      lang === 'hi' ? 'अपने पंजीकृत मोबाइल नंबर पर ओटीपी प्राप्त करें' : 'Enter your registered mobile number to receive a one-time verification password',
      [lang === 'hi' ? 'पासवर्ड रीसेट' : 'Reset Password']
    )}

    <div style="max-width:28rem;margin:0 auto">
      ${card(`
        <form class="space-y-4" onsubmit="doForgotPw(event)">
          <div class="field">
            <label for="fp-mobile">Registered Mobile Number</label>
            <input id="fp-mobile" class="input" type="tel" required pattern="[6-9][0-9]{9}" maxlength="10" placeholder="10-digit registered number" />
          </div>
          <div id="fp-msg"></div>
          <button class="hp-btn hp-btn--primary" type="submit" style="width:100%;padding:12px">Send OTP Verification</button>
        </form>
      `)}
      <p class="text-sm text-muted" style="margin-top:1.25rem;text-align:center">
        Remembered password? <a href="#login" onclick="navigate('login');return false;" class="text-primary font-bold" style="text-decoration:underline">Sign in</a>
      </p>
    </div>
  `;
}
function doForgotPw(e) {
  e.preventDefault();
  document.getElementById('fp-msg').innerHTML = alert('If a matching account exists, a one-time verification code has been dispatched to your mobile number via SMS.', 'info');
}
window.doForgotPw = doForgotPw;
window.doForgotPw = doForgotPw;

/* ─── HOME ────────────────────────────────────────────────── */
function renderHome(main) {
  const nf = new Intl.NumberFormat(lang === 'hi' ? 'hi-IN' : 'en-IN');
  main.innerHTML = `
    <!-- DirectVerify Hero Section -->
    <section class="hp-hero">
      <div class="hp-hero_scrim"></div>
      <div class="hp-hero_inner">
        <div class="hp-hero_content">
          <div class="hp-hero_badge">
            <span style="color:var(--hp-green)">●</span>
            ${lang === 'hi' ? 'आधिकारिक कानूनी मापविज्ञान सत्यापन पोर्टल' : 'Official Legal Metrology Online Portal'}
          </div>
          <h1 class="hp-hero_title">
            ${lang === 'hi' ? 'आसान और सुरक्षित<br>मापविज्ञान सत्यापन' : 'Easy and Secure<br>Legal Metrology Verifications'}
          </h1>
          <p class="hp-hero_subtitle">
            ${lang === 'hi' ? 'भारत का सबसे बड़ा ऑनलाइन सत्यापन नेटवर्क' : "India's largest online verification network"}
          </p>
          <div class="hp-hero_actions">
            <a href="#validate" class="hp-btn hp-btn--primary" onclick="navigate('validate'); return false;">
              ${lang === 'hi' ? 'अभी सत्यापित करें' : 'DirectVerify Now'}
            </a>
            <div class="hp-track">
              <input
                id="hero_txt_cert"
                type="text"
                aria-label="${lang === 'hi' ? 'सत्यापन संख्या' : 'Verification number'}"
                placeholder="${lang === 'hi' ? 'प्रमाणपत्र या VN संख्या दर्ज करें' : 'Enter your VN/AVN/Certificate No.'}"
                class="hp-track_input"
                onkeydown="if(event.key==='Enter'){ openStatusModal(this.value); }"
              />
              <button
                type="button"
                class="hp-track_btn"
                onclick="openStatusModal(document.getElementById('hero_txt_cert').value)"
              >
                ${lang === 'hi' ? 'जाँचें' : 'Track'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Overlapping Our Services Section (DirectVerify signature layout) -->
    <section id="services" class="hp-section hp-section--surface hp-section--overlap">
      <div class="hp-container">
        <h2 class="hp-heading">${lang === 'hi' ? 'हमारी सेवाएँ' : 'Our Services'}</h2>
        <div class="hp-services-grid">
          <!-- Card 1 -->
          <article class="hp-card">
            <span class="hp-card_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18v2.5M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.5M21 14.5v-4a1 1 0 0 0-1-1h-4a3 3 0 0 0 0 5h4a1 1 0 0 0 1-1Z"/></svg>
            </span>
            <h3 class="hp-card_title">${lang === 'hi' ? 'निःशुल्क उपकरण खाता<br>&amp; डिजिटल लॉकर' : 'Free Instrument Registry<br>&amp; Digital Locker'}</h3>
            <p class="hp-card_desc">${lang === 'hi' ? 'अपने सभी वाणिज्यिक तौल-काँटों और पैमानों का डिजिटल रिकॉर्ड रखें।' : 'Register your firm and maintain a unified digital portfolio of weighing instruments.'}</p>
            <a href="#register" onclick="navigate('register'); return false;" class="hp-link">
              ${lang === 'hi' ? 'विवरण देखें' : 'Explore'} <span class="hp-link_arrow" aria-hidden="true">→</span>
            </a>
          </article>

          <!-- Card 2 -->
          <article class="hp-card">
            <span class="hp-card_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 4 6v5.5c0 4.6 3.2 8.2 8 9.5 4.8-1.3 8-4.9 8-9.5V6l-8-3Z"/><rect x="9" y="10" width="6" height="5" rx="1"/><path d="M10.5 10V8.8a1.5 1.5 0 0 1 3 0V10"/></svg>
            </span>
            <h3 class="hp-card_title">${lang === 'hi' ? 'भारत सरकार डिजीलॉकर<br>प्रमाणपत्र सेवा' : 'Government of India<br>DigiLocker Integration'}</h3>
            <p class="hp-card_desc">${lang === 'hi' ? 'सत्यापित प्रमाणपत्र सीधे नागरिक डिजीलॉकर में सुरक्षित रूप से उपलब्ध।' : 'Seamless synchronization of verified calibration certificates with DigiLocker.'}</p>
            <a href="#validate" onclick="navigate('validate'); return false;" class="hp-link">
              ${lang === 'hi' ? 'सत्यापित करें' : 'Explore'} <span class="hp-link_arrow" aria-hidden="true">→</span>
            </a>
          </article>

          <!-- Card 3 -->
          <article class="hp-card">
            <span class="hp-card_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9s1.2-6.4 3.6-9Z"/></svg>
            </span>
            <h3 class="hp-card_title">${lang === 'hi' ? 'राष्ट्रीय विधिक मापविज्ञान<br>डिजिटल सत्यापन नेटवर्क' : 'National Legal Metrology<br>Digital Network'}</h3>
            <p class="hp-card_desc">${lang === 'hi' ? 'सभी 28 राज्यों और केंद्रशासित प्रदेशों में मानक निरीक्षण प्रणाली।' : 'Direct, authenticated access to divisional metrology verifiers nationwide.'}</p>
            <a href="#rules" onclick="navigate('rules'); return false;" class="hp-link">
              ${lang === 'hi' ? 'नियम देखें' : 'Explore'} <span class="hp-link_arrow" aria-hidden="true">→</span>
            </a>
          </article>

          <!-- Card 4 -->
          <article class="hp-card">
            <span class="hp-card_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v10H4zM7.5 8.5h9M7.5 11.5h5"/><circle cx="16.5" cy="17" r="2.5"/><path d="m14.8 19 -0.8 3 2.5-1.4 2.5 1.4-0.8-3"/></svg>
            </span>
            <h3 class="hp-card_title">${lang === 'hi' ? 'मानक अंशांकन एवं<br>सटीकता परीक्षण सेवा' : 'Calibration Standards &amp;<br>Load Verification'}</h3>
            <p class="hp-card_desc">${lang === 'hi' ? 'अधिकतम अनुमेय त्रुटि (MPE) और विधिक मानकों के अनुरूप डिजिटल रिपोर्ट।' : 'Field test trials with observed vs reference loads and instant tamper checks.'}</p>
            <a href="#rules" onclick="navigate('rules'); return false;" class="hp-link">
              ${lang === 'hi' ? 'मानक देखें' : 'Explore'} <span class="hp-link_arrow" aria-hidden="true">→</span>
            </a>
          </article>
        </div>
      </div>
    </section>

    <!-- How It Works Section (DirectVerify 3-step sequence) -->
    <section class="hp-section">
      <div class="hp-container">
        <h2 class="hp-heading">${lang === 'hi' ? 'यह कैसे काम करता है' : 'How It Works'}</h2>
        <ol class="hp-steps">
          <li class="hp-step">
            <div class="hp-step_badge">
              <span class="hp-step_num">1</span>
              <span class="hp-step_icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6M7 16h4"/></svg>
              </span>
            </div>
            <h3 class="hp-step_title">${lang === 'hi' ? 'उपकरण चुनें &amp;<br>विवरण दर्ज करें' : 'Select Instrument &amp;<br>Submit Details'}</h3>
            <p class="hp-step_text">${lang === 'hi' ? 'फर्म पंजीकृत करें और ऑनलाइन तौल-माप उपकरण का तकनीकी ब्योरा जोड़ें।' : 'Register your firm and submit technical specifications of your measuring instrument.'}</p>
          </li>

          <li class="hp-step">
            <div class="hp-step_badge">
              <span class="hp-step_num">2</span>
              <span class="hp-step_icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="4"/></svg>
              </span>
            </div>
            <h3 class="hp-step_title">${lang === 'hi' ? 'निरीक्षण एवं<br>भार परीक्षण' : 'Inspector Inspection &amp;<br>Load Testing'}</h3>
            <p class="hp-step_text">${lang === 'hi' ? 'विधिक निरीक्षक स्थल पर 3-चरणीय भार परीक्षण और सील सत्यापन करता है।' : 'Statutory inspector visits your premises to conduct critical checks & load trials.'}</p>
          </li>

          <li class="hp-step">
            <div class="hp-step_badge">
              <span class="hp-step_num">3</span>
              <span class="hp-step_icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.3 2.3 4.7-4.7"/></svg>
              </span>
            </div>
            <h3 class="hp-step_title">${lang === 'hi' ? 'ई-सत्यापित डिजिटल<br>प्रमाणपत्र प्राप्त करें' : 'Receive Your E-Verified<br>Certificate'}</h3>
            <p class="hp-step_text">${lang === 'hi' ? 'सत्यापन अधिकारी की स्वीकृति उपरांत तत्काल डिजिटल QR सील प्रमाणपत्र जारी।' : 'Official approval with tamper-proof QR verification and instant download.'}</p>
          </li>
        </ol>

        <div class="hp-actions-center">
          <a href="#validate" class="hp-btn hp-btn--primary" onclick="navigate('validate'); return false;">
            ${lang === 'hi' ? 'अभी सत्यापन आरंभ करें' : 'DirectVerify Now'}
          </a>
        </div>
      </div>
    </section>

    <!-- Our Network Section (DirectVerify high-contrast navy layout) -->
    <section id="network" class="hp-section hp-section--navy">
      <div class="hp-container">
        <h2 class="hp-heading hp-heading--invert">${lang === 'hi' ? 'हमारा राष्ट्रीय नेटवर्क' : 'Our Pan-India Network'}</h2>
        
        <div class="hp-regions">
          ${[
            ['Maharashtra', 'महाराष्ट्र', '2,480 Verifiers', 'MH'],
            ['Delhi NCT', 'दिल्ली', '1,840 Verifiers', 'DL'],
            ['Karnataka', 'कर्नाटक', '1,620 Verifiers', 'KA'],
            ['Tamil Nadu', 'तमिलनाडु', '1,950 Verifiers', 'TN'],
            ['Kerala', 'केरल', '1,430 Verifiers', 'KL'],
            ['Gujarat', 'गुजरात', '1,580 Verifiers', 'GJ'],
            ['Andhra Pradesh', 'आंध्र प्रदेश', '1,210 Verifiers', 'AP'],
            ['Telangana', 'तेलंगाना', '1,340 Verifiers', 'TS'],
            ['Uttar Pradesh', 'उत्तर प्रदेश', '2,890 Verifiers', 'UP'],
            ['West Bengal', 'पश्चिम बंगाल', '1,730 Verifiers', 'WB'],
          ].map(([en, hi, count, code]) => `
            <a href="#rules" class="hp-region" onclick="navigate('rules'); return false;">
              <div class="hp-region_art">
                <div class="hp-region_badge">${code}</div>
              </div>
              <div class="hp-region_label">
                <span>${lang === 'hi' ? hi : en}</span>
                <span class="hp-region_count">${count}</span>
              </div>
            </a>
          `).join('')}
        </div>

        <div class="hp-actions-center">
          <a href="#rules" class="hp-btn hp-btn--ghost" onclick="navigate('rules'); return false;">
            ${lang === 'hi' ? 'संपूर्ण सूची देखें' : 'View Complete Verifier List'}
          </a>
        </div>
      </div>
    </section>

    <!-- DirectVerify Advantages Section -->
    <section class="hp-section">
      <div class="hp-container">
        <h2 class="hp-heading">DirectVerify <span class="hp-heading_accent">${lang === 'hi' ? 'के लाभ' : 'Advantages'}</span></h2>
        
        <div class="hp-features">
          <article class="hp-feature">
            <span class="hp-feature_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h11M11 7l5 5-5 5M20 4v16"/></svg>
            </span>
            <h3 class="hp-feature_title">${lang === 'hi' ? 'सत्यापनकर्ता से सीधा संपर्क' : 'Direct Access to Verifier'}</h3>
            <p class="hp-feature_text">${lang === 'hi' ? 'आवेदन बिना किसी बिचौलिए के सीधे विधिक मापविज्ञान विभाग के समक्ष प्रस्तुत होते हैं।' : 'Requests reach the issuing legal metrology office directly with zero intermediaries.'}</p>
          </article>

          <article class="hp-feature">
            <span class="hp-feature_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            </span>
            <h3 class="hp-feature_title">${lang === 'hi' ? 'रियल-टाइम स्थिति ट्रैकिंग' : 'Real-Time Status Tracking'}</h3>
            <p class="hp-feature_text">${lang === 'hi' ? 'आवेदन, निरीक्षण, स्वीकृति और प्रमाणपत्र जारी होने तक प्रत्येक चरण की लाइव निगरानी।' : 'Follow every request from online submission through inspector visit to certificate delivery.'}</p>
          </article>

          <article class="hp-feature">
            <span class="hp-feature_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 4 6v5.5c0 4.6 3.2 8.2 8 9.5 4.8-1.3 8-4.9 8-9.5V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
            </span>
            <h3 class="hp-feature_title">${lang === 'hi' ? 'प्रामाणिक एवं विश्वसनीय' : 'Authentic and Reliable'}</h3>
            <p class="hp-feature_text">${lang === 'hi' ? 'प्रत्येक परिणाम विभाग के आधिकारिक रिकॉर्ड और डिजिटल सील से प्रमाणित होता है।' : "Every result comes directly from the department's statutory master records."}</p>
          </article>

          <article class="hp-feature">
            <span class="hp-feature_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3.5a8.5 8.5 0 1 1-8.5 8.5M3.5 7.5V12h4.5M12 8v4l3 2"/></svg>
            </span>
            <h3 class="hp-feature_title">${lang === 'hi' ? 'त्वरित निस्तारण समय' : 'Reduces Turnaround Time'}</h3>
            <p class="hp-feature_text">${lang === 'hi' ? 'लगभग 80% सत्यापन कार्य 5 कार्यदिवसों के भीतर पूर्ण कर दिए जाते हैं।' : 'Around 80% of metrology verifications complete within 5 statutory working days.'}</p>
          </article>

          <article class="hp-feature">
            <span class="hp-feature_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="9" width="16" height="12" rx="2"/><path d="M8 9V6a4 4 0 0 1 8 0v3M12 14v2"/></svg>
            </span>
            <h3 class="hp-feature_title">${lang === 'hi' ? '100% डिजिटल प्रमाणीकरण' : 'Online Digital Authentication'}</h3>
            <p class="hp-feature_text">${lang === 'hi' ? 'पूर्णतः कागज-रहित प्रणाली — कूरियर या भौतिक कागजी कार्रवाई की कोई आवश्यकता नहीं।' : 'Fully digital end-to-end — zero couriers and zero physical paperwork needed.'}</p>
          </article>

          <article class="hp-feature">
            <span class="hp-feature_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9s1.2-6.4 3.6-9Z"/></svg>
            </span>
            <h3 class="hp-feature_title">${lang === 'hi' ? 'पारदर्शी ऑडिट ट्रेल' : 'Transparent Audit Trail'}</h3>
            <p class="hp-feature_text">${lang === 'hi' ? 'प्रत्येक भार परीक्षण, सहिष्णुता सीमा और अनुमोदन का अपरिवर्तनीय डिजिटल रिकॉर्ड।' : 'Immutable digital trail of inspector load trials, MPE tolerances, and approvals.'}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Count on Us Interactive Stats Section -->
    <section class="hp-section hp-section--surface">
      <div class="hp-container">
        <h2 class="hp-heading">${lang === 'hi' ? 'हमारे आँकड़े' : 'Count on Us'}</h2>
        <div class="hp-stats">
          <article class="hp-stat">
            <p class="hp-stat_value">
              <span data-counter="12480">12,480</span>+
            </p>
            <p class="hp-stat_label">${lang === 'hi' ? 'पंजीकृत उपकरण एवं काँटे<br>संपूर्ण भारत में' : 'Instruments &amp; Scales<br>Registered Nationwide'}</p>
          </article>

          <article class="hp-stat">
            <p class="hp-stat_value">
              <span data-counter="5">5</span>
              <span class="hp-stat_unit">${lang === 'hi' ? 'दिन' : 'Days'}</span>
            </p>
            <p class="hp-stat_label">${lang === 'hi' ? 'औसत निस्तारण समय<br>80% सत्यापित मामलों में' : 'Average turnaround time<br>for 80% of verifications'}</p>
          </article>

          <article class="hp-stat">
            <p class="hp-stat_value">
              <span data-counter="28">28</span>+
            </p>
            <p class="hp-stat_label">${lang === 'hi' ? 'राज्य एवं केंद्रशासित प्रदेश<br>पोर्टल से जुड़े हुए' : 'States &amp; UTs connected<br>to verification network'}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Press, Media & Partner Trust Carousel (DirectVerify owl carousel equivalent) -->
    <section class="hp-section hp-section--press">
      <div class="hp-container">
        <div class="press-carousel-wrapper">
          <button type="button" class="carousel-nav-btn" aria-label="Previous press review" onclick="slidePressCarousel(-1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>

          <div class="press-carousel-track" id="press-track">
            <article class="press-card">
              <h4 class="press-outlet">The Times of India</h4>
              <p class="press-headline">"Legal metrology gets online facility to check certificates &amp; seal tamper."</p>
            </article>

            <article class="press-card">
              <h4 class="press-outlet">Deccan Herald</h4>
              <p class="press-headline">"Zero-paperwork metrology verification cuts turnaround time to 5 days."</p>
            </article>

            <article class="press-card">
              <h4 class="press-outlet">Business Standard</h4>
              <p class="press-headline">"Paperless verification system ensures authentic weighing standards across states."</p>
            </article>

            <article class="press-card">
              <h4 class="press-outlet">The Hindu</h4>
              <p class="press-headline">"Lock your metrology &amp; calibration certificates digitally with instant QR seals."</p>
            </article>

            <article class="press-card">
              <h4 class="press-outlet">LiveMint</h4>
              <p class="press-headline">"An easy online approach to tamper-proof metrology verification."</p>
            </article>

            <article class="press-card">
              <h4 class="press-outlet">National Press Trust</h4>
              <p class="press-headline">"Ministry accelerates digital certification for commercial instruments."</p>
            </article>
          </div>

          <button type="button" class="carousel-nav-btn" aria-label="Next press review" onclick="slidePressCarousel(1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </section>

    <!-- Recent Notices & Regulatory Updates -->
    <section class="hp-section hp-section--surface">
      <div class="hp-container">
        <div class="grid-2">
          <div>
            <h3 style="font-size:1.35rem;font-weight:800;color:var(--hp-navy);margin-bottom:1rem">
              ${lang === 'hi' ? 'नवीनतम सूचनाएँ एवं परिपत्र' : 'Latest Departmental Notices'}
            </h3>
            <ul class="space-y-4">
              ${NOTICES.slice(0, 4).map(n => `
                <li style="display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid var(--line);padding-bottom:10px">
                  <div>
                    <span class="badge badge-info" style="font-size:0.7rem;margin-bottom:4px">${n.tag}</span>
                    <p style="font-size:0.9375rem;font-weight:600;color:var(--hp-text-main);margin:0">
                      ${escHtml(lang === 'hi' && n.titleHi ? n.titleHi : n.title)}
                    </p>
                  </div>
                  <time class="text-xs text-muted" datetime="${n.publishedAt}" style="white-space:nowrap">${fmtDate(n.publishedAt, lang)}</time>
                </li>
              `).join('')}
            </ul>
            <a href="#notices" onclick="navigate('notices'); return false;" class="hp-link" style="margin-top:16px;display:inline-flex">
              ${lang === 'hi' ? 'सभी सूचनाएँ देखें' : 'View all notices'} <span class="hp-link_arrow">→</span>
            </a>
          </div>

          <div>
            <h3 style="font-size:1.35rem;font-weight:800;color:var(--hp-navy);margin-bottom:1rem">
              ${lang === 'hi' ? 'सीधा त्वरित सत्यापन' : 'Quick Certificate Verification'}
            </h3>
            ${card(`
              <p class="text-sm text-muted" style="margin-bottom:14px">
                ${lang === 'hi' ? 'अपने विधिक मापविज्ञान प्रमाणपत्र पर मुद्रित संख्या या स्टिकर सीरियल दर्ज करें:' : 'Enter the certificate number or sticker serial printed on your certificate:'}
              </p>
              <form onsubmit="doQuickValidate(event)" class="space-y-4">
                <input
                  class="input"
                  name="cert"
                  placeholder="e.g. NRK/CERT/MUM/2024/000001"
                  required
                  minlength="6"
                  maxlength="40"
                  aria-label="${lang === 'hi' ? 'प्रमाणपत्र संख्या' : 'Certificate number'}"
                />
                <button class="btn btn-primary" type="submit" style="width:100%">
                  ${lang === 'hi' ? 'सत्यापन विवरण देखें' : 'Check Certificate Record'}
                </button>
              </form>
            `)}
          </div>
        </div>
      </div>
    </section>
  `;

  // Animate stats counter
  setTimeout(animateCounters, 200);
}

function doQuickValidate(e) {
  e.preventDefault();
  const cert = e.target.querySelector('[name=cert]').value.trim();
  navigate('validate/' + encodeURIComponent(cert));
}
window.doQuickValidate = doQuickValidate;

/* ─── VALIDATE ────────────────────────────────────────────── */
function renderValidate(main, view) {
  const prefill = view.includes('/') ? decodeURIComponent(view.split('/').slice(1).join('/')) : '';
  
  main.innerHTML = `
    ${subpageBanner(
      lang === 'hi' ? 'प्रमाणपत्र सत्यापन' : 'Check & Verify Certificate',
      lang === 'hi' ? 'विधिक मापविज्ञान मुहर और डिजिटल सत्यापन प्रमाणपत्र की तात्कालिक ऑनलाइन प्रामाणिकता' : 'Instant official certificate authenticity check powered by the Legal Metrology Department',
      [lang === 'hi' ? 'प्रमाणपत्र सत्यापन' : 'Verify Certificate']
    )}

    <div style="max-width:54rem;margin:0 auto">
      ${card(`
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
          <div>
            <h2 style="font-size:1.25rem;font-weight:800;color:var(--hp-navy);margin:0">
              ${lang === 'hi' ? 'आधिकारिक प्रमाणपत्र संख्या दर्ज करें' : 'Enter Official Certificate Number'}
            </h2>
            <p class="text-xs text-muted" style="margin:4px 0 0">
              ${lang === 'hi' ? 'प्रमाणपत्र पर छपी संख्या या स्टिकर सीरियल दर्ज करें। जाँच 100% मुफ़्त एवं सार्वजनिक है।' : 'Enter certificate number or sticker serial printed on the certificate. Verification is free & public.'}
            </p>
          </div>
          <span class="badge badge-ok" style="font-size:0.75rem;padding:6px 12px">
            🛡️ ${lang === 'hi' ? 'केंद्रीय रजिस्ट्री सत्यापन' : 'Central Registry Verification'}
          </span>
        </div>

        <form id="validate-form" class="space-y-4" onsubmit="doValidate(event)">
          <div style="display:flex;gap:10px;align-items:stretch;flex-wrap:wrap">
            <div style="position:relative;flex:1;min-width:260px">
              <input
                id="cert-input"
                class="input"
                type="text"
                placeholder="e.g. NRK/CERT/MUM/2024/000001"
                value="${escHtml(prefill)}"
                required
                minlength="6"
                maxlength="50"
                autocomplete="off"
                style="height:48px;font-family:monospace;font-size:1.05rem;font-weight:600;padding-left:16px;border-color:var(--hp-green)"
              />
            </div>
            <button class="hp-btn hp-btn--primary" type="submit" style="padding:0 28px;height:48px;font-size:0.9375rem">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              ${lang === 'hi' ? 'सत्यापित करें' : 'Verify Certificate'}
            </button>
            <button class="btn btn-secondary" type="button" onclick="document.getElementById('cert-input').value='';document.getElementById('validate-result').innerHTML='';" style="height:48px;padding:0 18px">
              ${lang === 'hi' ? 'साफ़ करें' : 'Clear'}
            </button>
          </div>

          <div class="sample-chips-row">
            <span style="font-weight:700;color:var(--hp-navy)">${lang === 'hi' ? 'त्वरित नमूने:' : 'Quick Samples:'}</span>
            <button type="button" class="sample-chip" onclick="setValidateSample('NRK/CERT/MUM/2024/000001')">NRK/CERT/MUM/2024/000001 (Valid)</button>
            <button type="button" class="sample-chip" onclick="setValidateSample('NRK/CERT/DEL/2024/000002')">NRK/CERT/DEL/2024/000002 (Valid)</button>
            <button type="button" class="sample-chip" onclick="setValidateSample('NRK/CERT/PUN/2024/000003')">NRK/CERT/PUN/2024/000003 (Expired)</button>
            <button type="button" class="sample-chip" onclick="setValidateSample('NRK/CERT/BLR/2024/000004')">NRK/CERT/BLR/2024/000004 (Revoked)</button>
          </div>
        </form>
      `)}

      <div id="validate-result" style="margin-top:1.5rem"></div>

      <div class="card" style="margin-top:2rem;background:var(--hp-surface);border:1px dashed rgba(14,90,42,0.3)">
        <h3 style="font-size:1rem;font-weight:800;color:var(--hp-navy);margin-bottom:8px">
          ⚖️ ${lang === 'hi' ? 'विधिक मापविज्ञान सत्यापन के बारे में' : 'About Official Metrology Verification'}
        </h3>
        <p class="text-xs text-muted" style="line-height:1.6;margin-bottom:12px">
          ${lang === 'hi'
            ? 'विधिक मापविज्ञान अधिनियम, 2009 की धारा 24 के तहत, वाणिज्यिक लेनदेन में उपयोग किए जाने वाले सभी वजन और माप उपकरणों का नियमित सत्यापन व मुद्रांकन अनिवार्य है। प्रत्येक सत्यापित उपकरण पर एक सुरक्षित क्यूआर-सक्षम सत्यापन स्टिकर चिपकाया जाता है।'
            : 'Under Section 24 of the Legal Metrology Act, 2009, all weighing and measuring instruments used in commercial trade must be regularly verified and stamped by an authorized Legal Metrology Officer. Each certified instrument carries a tamper-proof verification sticker with an encrypted digital serial.'
          }
        </p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:0.8125rem">
          <span style="color:var(--hp-green);font-weight:700">✓ 100% Tamper Proof Digital Registry</span>
          <span style="color:var(--hp-green);font-weight:700">✓ QR Code Linked Physical Seals</span>
          <span style="color:var(--hp-green);font-weight:700">✓ Real-time Expiry Tracking</span>
        </div>
      </div>
    </div>
  `;

  // Auto-check if prefill present
  if (prefill && prefill.length >= 6) {
    setTimeout(() => checkCertificate(prefill), 150);
  }
}

function setValidateSample(num) {
  const inp = document.getElementById('cert-input');
  if (inp) {
    inp.value = num;
    checkCertificate(num);
  }
}
window.setValidateSample = setValidateSample;

function doValidate(e) {
  e.preventDefault();
  const cert = document.getElementById('cert-input').value.trim();
  checkCertificate(cert);
}
window.doValidate = doValidate;

function checkCertificate(certNo) {
  const res = document.getElementById('validate-result');
  if (!res) return;
  res.innerHTML = loading();
  
  setTimeout(() => {
    const q = certNo.trim().toLowerCase();
    const found = CERTIFICATES.find(c => 
      c.certNo.toLowerCase() === q || 
      (c.stickerSerial && c.stickerSerial.toLowerCase() === q)
    );

    if (!found) {
      res.innerHTML = `
        <div class="card" style="border-left:5px solid var(--warn);background:var(--surface)">
          <div style="display:flex;gap:14px;align-items:flex-start">
            <div style="font-size:2rem;color:var(--warn)">⚠️</div>
            <div>
              <h3 style="font-size:1.1rem;font-weight:800;color:var(--hp-navy);margin:0 0 6px">
                ${lang === 'hi' ? 'कोई रिकॉर्ड नहीं मिला' : 'No Verification Record Found'}
              </h3>
              <p class="text-sm text-muted" style="margin:0 0 10px">
                ${lang === 'hi'
                  ? `दर्ज संख्या "<strong>${escHtml(certNo)}</strong>" के लिए केंद्रीय विधिक मापविज्ञान रजिस्ट्री में कोई प्रमाणपत्र नहीं मिला।`
                  : `No official certificate found matching certificate or sticker number "<strong>${escHtml(certNo)}</strong>" in the Central Metrology Registry.`}
              </p>
              <div style="font-size:0.8125rem;color:var(--hp-text-dim)">
                <strong>Troubleshooting tips:</strong>
                <ul style="margin:6px 0 0 18px;line-height:1.5">
                  <li>Double check alphanumeric characters (e.g. '0' vs 'O')</li>
                  <li>Ensure the format resembles <code>NRK/CERT/MUM/2024/000001</code></li>
                  <li>If you suspect an unauthorized or counterfeit certificate, <a href="#report-tampering" onclick="navigate('report-tampering');return false;" style="color:var(--hp-green);font-weight:700;text-decoration:underline">file a confidential tamper report</a>.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const ok = found.status === 'VALID';
    const isExpired = found.status === 'EXPIRED';
    const isRevoked = found.status === 'REVOKED';
    const daysLeft = Math.ceil((new Date(found.validTill) - new Date()) / 86400000);
    const bannerClass = ok ? 'cert-status-banner--valid' : isExpired ? 'cert-status-banner--expired' : 'cert-status-banner--revoked';
    const statusIcon = ok ? '✓' : isExpired ? '⏳' : '✕';
    const statusText = ok
      ? (lang === 'hi' ? `यह प्रमाणपत्र असली और लागू है। (वैधता: ${daysLeft} दिन शेष)` : `OFFICIALLY VERIFIED & ACTIVE — Authenticated under Central Legal Metrology Registry (${daysLeft} days remaining)`)
      : isExpired
      ? (lang === 'hi' ? 'यह प्रमाणपत्र समाप्त (EXPIRED) हो चुका है। पुनः सत्यापन आवश्यक है।' : 'CERTIFICATE EXPIRED — Statutory validity period elapsed. Immediate re-verification mandated.')
      : (lang === 'hi' ? 'यह प्रमाणपत्र रद्द (REVOKED) किया गया है। व्यावसायिक उपयोग वर्जित है।' : 'CERTIFICATE REVOKED — Stamping canceled by enforcement authority. Commercial operation prohibited.');

    const mockHash = 'SHA256:' + (Math.abs(found.certNo.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16).padStart(16, 'a') + '8f04c7').toUpperCase();

    res.innerHTML = `
      <div class="cert-official-card" role="region" aria-label="Official Certificate Details">
        <div class="cert-header-bar">
          <div class="cert-header-title">
            <div class="dv-seal-emblem" style="width:48px;height:48px;background:rgba(255,255,255,0.15);border:2px solid #b7d93a" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="30" fill="#0e5a2a"/>
                <circle cx="32" cy="32" r="26" fill="none" stroke="#b7d93a" stroke-width="2"/>
                <path d="M22 33l7 7 14-16" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <h3>${lang === 'hi' ? 'विधिक मापविज्ञान सत्यापन प्रमाणपत्र' : 'Certificate of Verification / Re-Verification'}</h3>
              <p>${lang === 'hi' ? 'विधिक मापविज्ञान अधिनियम, 2009 की धारा 24 के अंतर्गत जारी (प्रपत्र VII)' : 'Government of India • Department of Legal Metrology (Form VII, Rule 11)'}</p>
            </div>
          </div>
          <div style="text-align:right">
            <span class="badge" style="background:rgba(255,255,255,0.2);color:#fff;font-family:monospace;font-size:0.8125rem">
              ${escHtml(found.certNo)}
            </span>
          </div>
        </div>

        <div class="cert-status-banner ${bannerClass}">
          <span style="font-size:1.35rem;font-weight:800">${statusIcon}</span>
          <div style="flex:1">
            <div style="font-size:0.95rem;font-weight:800">${statusBadge(found.status)} &nbsp; ${statusText}</div>
          </div>
        </div>

        <div class="cert-body-wrap">
          <div class="cert-watermark" aria-hidden="true">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="3"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <text x="50" y="55" font-size="12" font-weight="bold" text-anchor="middle" fill="currentColor">LEGAL METROLOGY</text>
            </svg>
          </div>

          <!-- Official Form VII QR Code Security Seal -->
          <div class="cert-qr-hero-card">
            <div class="cert-qr-box">
              ${generateQRCodeSVG(`${window.location.origin}${window.location.pathname}#validate/${encodeURIComponent(found.certNo)}`, 136)}
              <div class="cert-qr-caption">
                <span class="cert-qr-live-dot"></span> LIVE SCAN VERIFY
              </div>
            </div>
            <div class="cert-qr-info">
              <div class="cert-qr-badge">🛡️ STATUTORY DIGITAL SECURITY SEAL</div>
              <h4>${lang === 'hi' ? 'प्रपत्र VII डिजिटल प्रमाणीकरण क्यूआर' : 'Form VII Digital Authentication QR'}</h4>
              <p class="text-xs text-muted" style="margin:4px 0 8px;line-height:1.5">
                ${lang === 'hi'
                  ? 'केंद्रीय विधिक मापविज्ञान रजिस्ट्री के अनुसार यह आधिकारिक डिजिटल सुरक्षा मुहर व क्यूआर कोड है।'
                  : 'Official Form VII security QR code. Scan with any mobile camera or handheld metrology scanner to cross-verify calibration thresholds & physical sticker checksum in the Central Registry.'}
              </p>
              <div class="cert-qr-pills">
                <span class="cert-qr-pill font-mono"><strong>Cert:</strong> ${escHtml(found.certNo)}</span>
                <span class="cert-qr-pill font-mono"><strong>Seal:</strong> ${escHtml(found.stickerSerial || 'SEAL-' + found.certNo.slice(-6))}</span>
                <span class="cert-qr-pill"><strong>Status:</strong> <span style="color:${ok?'var(--hp-green)':isExpired?'var(--warn)':'var(--danger)'};font-weight:700">${found.status}</span></span>
              </div>
            </div>
          </div>

          <div class="cert-meta-grid">
            <div class="cert-meta-item">
              <span class="cert-meta-label">${lang === 'hi' ? 'प्रमाणपत्र संख्या' : 'Certificate Number'}</span>
              <span class="cert-meta-val font-mono" style="color:var(--hp-green)">${escHtml(found.certNo)}</span>
            </div>
            <div class="cert-meta-item">
              <span class="cert-meta-label">${lang === 'hi' ? 'धारक / व्यावसायिक प्रतिष्ठान' : 'Registered Holder / Firm'}</span>
              <span class="cert-meta-val">${escHtml(found.holder)}</span>
            </div>
            <div class="cert-meta-item">
              <span class="cert-meta-label">${lang === 'hi' ? 'माप उपकरण श्रेणी एवं क्षमता' : 'Instrument Category & Capacity'}</span>
              <span class="cert-meta-val">${escHtml(found.category)} · <strong>${escHtml(found.capacity)}</strong></span>
            </div>
            <div class="cert-meta-item">
              <span class="cert-meta-label">${lang === 'hi' ? 'सुरक्षा सील / स्टिकर सीरियल' : 'Sticker Serial / Security Seal'}</span>
              <span class="cert-meta-val font-mono">${escHtml(found.stickerSerial || 'SEAL-' + found.certNo.slice(-6))}</span>
            </div>
            <div class="cert-meta-item">
              <span class="cert-meta-label">${lang === 'hi' ? 'सत्यापन तिथि' : 'Verification Date'}</span>
              <span class="cert-meta-val">${fmtDate(found.verifiedOn, lang)}</span>
            </div>
            <div class="cert-meta-item">
              <span class="cert-meta-label">${lang === 'hi' ? 'वैधता समाप्ति तिथि' : 'Validity Expiry Date'}</span>
              <span class="cert-meta-val" style="color:${isExpired?'var(--warn)':'var(--hp-green)'}">
                ${fmtDate(found.validTill, lang)}
              </span>
            </div>
            <div class="cert-meta-item">
              <span class="cert-meta-label">${lang === 'hi' ? 'जारीकर्ता कार्यालय एवं क्षेत्राधिकार' : 'Issuing Office & Jurisdiction'}</span>
              <span class="cert-meta-val">${escHtml(found.issuingOffice)} (${escHtml(found.area)})</span>
            </div>
            <div class="cert-meta-item">
              <span class="cert-meta-label">${lang === 'hi' ? 'सत्यापन अधिकारी' : 'Verifying Officer'}</span>
              <span class="cert-meta-val">${escHtml(found.issuedBy || 'Legal Metrology Inspector')}</span>
            </div>
            <div class="cert-meta-item">
              <span class="cert-meta-label">${lang === 'hi' ? 'अधिकतम अनुमेय त्रुटि सीमा' : 'Maximum Permissible Error (MPE)'}</span>
              <span class="cert-meta-val">±0.1% (Standard Tolerance)</span>
            </div>
            <div class="cert-meta-item">
              <span class="cert-meta-label">${lang === 'hi' ? 'डिजिटल रजिस्ट्री हस्ताक्षर' : 'Digital Registry Hash'}</span>
              <span class="cert-meta-val font-mono text-xs" style="word-break:break-all">${mockHash}</span>
            </div>
          </div>

          <div class="cert-actions-bar">
            <button class="hp-btn hp-btn--primary" onclick="window.print()" type="button" style="padding:8px 18px;font-size:0.875rem">
              🖨️ ${lang === 'hi' ? 'प्रमाणपत्र प्रिंट करें' : 'Print Certificate'}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="downloadCertMock('${escHtml(found.certNo)}')" type="button">
              📥 ${lang === 'hi' ? 'पीडीएफ डाउनलोड' : 'Download PDF'}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="copyCertLink('${escHtml(found.certNo)}')" type="button">
              🔗 ${lang === 'hi' ? 'लिंक कॉपी करें' : 'Copy Link'}
            </button>
            <button class="btn btn-outline btn-sm" onclick="navigate('report-tampering');setTimeout(() => { const el = document.getElementById('tr-cert'); if(el) el.value='${escHtml(found.certNo)}'; }, 100);" type="button" style="margin-left:auto;color:var(--danger)">
              ⚠️ ${lang === 'hi' ? 'छेड़छाड़ की रिपोर्ट करें' : 'Report Discrepancy'}
            </button>
          </div>
        </div>
      </div>
    `;
  }, 450);
}

function downloadCertMock(certNo) {
  toastMsg(`Downloading verified certificate ${certNo} (PDF)...`, 'ok');
}
window.downloadCertMock = downloadCertMock;

function copyCertLink(certNo) {
  const url = window.location.origin + window.location.pathname + '#validate/' + encodeURIComponent(certNo);
  navigator.clipboard?.writeText(url).then(() => {
    toastMsg('Verification link copied to clipboard!', 'ok');
  }).catch(() => {
    toastMsg('Verification link: ' + url, 'ok');
  });
}
window.copyCertLink = copyCertLink;

/* ─── RULES ────────────────────────────────────────────────── */
let currentRuleCategory = 'ALL';

function renderRules(main) {
  const categories = ['ALL', ...new Set(RULES.map(r => r.category))];
  
  main.innerHTML = `
    ${subpageBanner(
      lang === 'hi' ? 'विधिक मापविज्ञान नियम एवं सहनशीलता' : 'Statutory Metrology Rules & Tolerances',
      lang === 'hi' ? 'सक्रिय विधिक मापविज्ञान अधिनियम मानक, अधिकतम अनुमेय त्रुटि (MPE) एवं पुनः सत्यापन चक्र' : 'Official statutory standards, Maximum Permissible Error (MPE) thresholds, and mandatory verification cycles under Legal Metrology Act 2009',
      [lang === 'hi' ? 'नियम-समूह' : 'Rule Sets']
    )}

    <div style="max-width:68rem;margin:0 auto">
      <div class="filter-pills" id="rule-pills" role="tablist" aria-label="Filter by instrument category">
        ${categories.map(cat => `
          <button
            class="filter-pill ${cat === currentRuleCategory ? 'is-active' : ''}"
            onclick="setRuleFilter('${cat}')"
            role="tab"
            aria-selected="${cat === currentRuleCategory}"
          >
            ${cat === 'ALL' ? (lang === 'hi' ? 'सभी श्रेणियाँ' : 'All Categories') : escHtml(cat)}
          </button>
        `).join('')}
      </div>

      <div class="card" style="margin-bottom:1.5rem">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">
          <div>
            <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin:0">
              ${lang === 'hi' ? 'सक्रिय विधिक विनिर्देश तालिका' : 'Active Regulatory Specifications'}
            </h2>
            <p class="text-xs text-muted" style="margin:2px 0 0">
              ${lang === 'hi' ? 'विधिक मापविज्ञान (सामान्य) नियम, 2011 की अनुसूची VIII के अनुसार सहिष्णुता सीमाएँ' : 'Tolerances as per Schedule VIII of the Legal Metrology (General) Rules, 2011'}
            </p>
          </div>
          <div style="position:relative;width:240px">
            <input
              id="rule-search-box"
              class="input"
              type="text"
              placeholder="${lang === 'hi' ? 'खोजें (e.g. Scale, MPE)...' : 'Filter rules...'}"
              oninput="filterRulesTable(this.value)"
              style="padding:6px 12px;font-size:0.875rem"
            />
          </div>
        </div>

        <div class="table-wrap" id="rules-table-wrap">
          ${renderRulesTableRows(RULES)}
        </div>
      </div>

      <div class="grid-2">
        <div class="card" style="border-top:3.5px solid var(--hp-green)">
          <h3 style="font-size:0.95rem;font-weight:800;color:var(--hp-navy);margin-bottom:8px">
            ⚖️ ${lang === 'hi' ? 'पुनः सत्यापन अनिवार्यता' : 'Mandatory Periodic Verification'}
          </h3>
          <p class="text-xs text-muted" style="line-height:1.6;margin:0">
            ${lang === 'hi'
              ? 'प्रत्येक व्यापारी अथवा प्रतिष्ठान को प्रमाणपत्र की वैधता समाप्त होने से पूर्व उपकरण का पुनः सत्यापन कराना अनिवार्य है। विलंब होने पर विधिक मापविज्ञान अधिनियम के अंतर्गत शमन शुल्क अथवा दण्ड लगाया जा सकता है।'
              : 'Every commercial user must submit their instrument for periodic re-verification before the certificate expiration date. Stamping after the marginal grace window incurs statutory compounding fees.'}
          </p>
        </div>
        <div class="card" style="border-top:3.5px solid var(--hp-lime)">
          <h3 style="font-size:0.95rem;font-weight:800;color:var(--hp-navy);margin-bottom:8px">
            🛡️ ${lang === 'hi' ? 'अधिकतम अनुमेय त्रुटि (MPE)' : 'Maximum Permissible Error (MPE)'}
          </h3>
          <p class="text-xs text-muted" style="line-height:1.6;margin:0">
            ${lang === 'hi'
              ? 'MPE उपकरण द्वारा दर्शाए गए वजन में कानून द्वारा स्वीकार्य अधिकतम विचलन है। यदि परीक्षण के दौरान विचलन MPE से अधिक पाया जाता है, तो उपकरण को अस्वीकृत (REJECTED) कर सील कर दिया जाता है।'
              : 'MPE specifies the maximum deviation permitted by statute during official calibration. Instruments failing verification beyond tolerance limits are marked REJECTED and sealed until rectified.'}
          </p>
        </div>
      </div>
    </div>
  `;
}

function renderRulesTableRows(list) {
  const filtered = currentRuleCategory === 'ALL'
    ? list
    : list.filter(r => r.category === currentRuleCategory);

  if (!filtered.length) {
    return `<div style="padding:24px;text-align:center;color:var(--hp-muted)">No rules found matching criteria.</div>`;
  }

  return `
    <table class="table" style="font-size:0.875rem">
      <thead>
        <tr>
          <th>Category</th>
          <th>Standard Ver.</th>
          <th>Effective Date</th>
          <th>MPE Limit</th>
          <th>Inspection Frequency</th>
          <th>Statutory Status</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(r => `
          <tr>
            <td>
              <strong style="color:var(--hp-navy);font-size:0.9375rem">${escHtml(r.category)}</strong>
            </td>
            <td><span class="badge" style="background:var(--hp-surface);border:1px solid var(--line)">v${r.version}</span></td>
            <td>${fmtDate(r.effectiveFrom, lang)}</td>
            <td>
              <span class="badge badge-info" style="font-family:monospace;font-weight:700">
                ±${r.mpe.value} ${escHtml(r.mpe.unit)}
              </span>
            </td>
            <td>
              <span style="font-weight:600;color:var(--hp-green)">
                ${r.interval.months} months
              </span>
              ${r.interval.marginalMonths ? `<span class="text-xs text-muted" style="display:block">(±${r.interval.marginalMonths} mo. grace)</span>` : ''}
            </td>
            <td>${statusBadge(r.status)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function setRuleFilter(cat) {
  currentRuleCategory = cat;
  document.querySelectorAll('#rule-pills .filter-pill').forEach(btn => {
    btn.classList.toggle('is-active', btn.textContent.trim().includes(cat) || (cat === 'ALL' && btn.textContent.trim().includes('All')));
  });
  const wrap = document.getElementById('rules-table-wrap');
  if (wrap) wrap.innerHTML = renderRulesTableRows(RULES);
}
window.setRuleFilter = setRuleFilter;

function filterRulesTable(q) {
  const query = q.trim().toLowerCase();
  const wrap = document.getElementById('rules-table-wrap');
  if (!wrap) return;
  const filtered = RULES.filter(r =>
    (currentRuleCategory === 'ALL' || r.category === currentRuleCategory) &&
    (!query || r.category.toLowerCase().includes(query) || String(r.mpe.value).includes(query) || r.mpe.unit.toLowerCase().includes(query))
  );
  wrap.innerHTML = renderRulesTableRows(filtered);
}
window.filterRulesTable = filterRulesTable;

/* ─── NOTICES ──────────────────────────────────────────────── */
let currentNoticeFilter = 'ALL';

function renderNotices(main) {
  const tags = ['ALL', 'POLICY', 'REGULATION', 'NOTICE', 'HOLIDAY', 'MAINTENANCE'];
  
  main.innerHTML = `
    ${subpageBanner(
      lang === 'hi' ? 'विभागीय सूचनाएँ एवं परिपत्र' : 'Departmental Notices & Public Circulars',
      lang === 'hi' ? 'विधिक मापविज्ञान विभाग की आधिकारिक अधिसूचनाएँ, अंशांकन अभियान व दिशा-निर्देश' : 'Official regulatory notices, gazette notifications, mobile stamping drives, and public advisories',
      [lang === 'hi' ? 'सूचनाएँ' : 'Notices & Circulars']
    )}

    <div style="max-width:64rem;margin:0 auto">
      <div class="filter-pills" id="notice-pills" role="tablist">
        ${tags.map(t => `
          <button
            class="filter-pill ${t === currentNoticeFilter ? 'is-active' : ''}"
            onclick="setNoticeFilter('${t}')"
          >
            ${t === 'ALL' ? (lang === 'hi' ? 'सभी सूचनाएँ' : 'All Notices') : t}
          </button>
        `).join('')}
      </div>

      <div id="notices-list-container" class="space-y-4">
        ${renderNoticesList(NOTICES)}
      </div>
    </div>
  `;
}

function renderNoticesList(list) {
  const filtered = currentNoticeFilter === 'ALL'
    ? list
    : list.filter(n => (n.tag || '').toUpperCase() === currentNoticeFilter);

  if (!filtered.length) {
    return emptyState('No notices found matching the selected filter.');
  }

  return filtered.map(n => {
    const d = new Date(n.publishedAt);
    const day = isNaN(d) ? '15' : String(d.getDate()).padStart(2, '0');
    const month = isNaN(d) ? 'MAR' : d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const yr = isNaN(d) ? '2024' : d.getFullYear();

    return `
      <div class="card" style="display:flex;gap:20px;align-items:flex-start;transition:all 0.2s ease;padding:22px 24px">
        <div style="flex:none;text-align:center;background:var(--hp-green-light);border:1.5px solid rgba(14,90,42,0.25);border-radius:var(--radius-md);padding:10px 14px;min-width:68px">
          <span style="display:block;font-size:1.45rem;font-weight:900;color:var(--hp-green);line-height:1">${day}</span>
          <span style="display:block;font-size:0.75rem;font-weight:800;color:var(--hp-navy);letter-spacing:0.8px;margin-top:2px">${month}</span>
          <span style="display:block;font-size:0.6875rem;color:var(--hp-muted)">${yr}</span>
        </div>

        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
            ${n.tag ? `<span class="badge badge-info" style="font-size:0.75rem">${escHtml(n.tag)}</span>` : ''}
            <span class="text-xs text-muted">Ref: DOK-LM/NOT/${yr}/${Math.floor(Math.random()*899+100)}</span>
          </div>
          <h3 style="font-size:1.1rem;font-weight:700;color:var(--hp-navy);margin:0 0 8px">
            ${escHtml(lang === 'hi' && n.titleHi ? n.titleHi : n.title)}
          </h3>
          <p class="text-sm text-muted" style="margin:0 0 14px;line-height:1.55">
            ${lang === 'hi'
              ? 'यह परिपत्र विधिक मापविज्ञान विभाग, भारत सरकार द्वारा जनसाधारण एवं अधिकृत व्यापारियों के सूचनार्थ जारी किया गया है।'
              : 'Official statutory notification issued under the authority of the Controller of Legal Metrology. Compliance is mandatory across all commercial jurisdictions.'
            }
          </p>
          <div style="display:flex;gap:12px;align-items:center">
            <button class="hp-btn hp-btn--outline" onclick="toastMsg('Opening official gazette circular...', 'ok')" type="button" style="padding:6px 14px;font-size:0.8125rem">
              📄 ${lang === 'hi' ? 'परिपत्र देखें' : 'View Circular (PDF)'}
            </button>
            <span class="text-xs text-muted">${fmtDate(n.publishedAt, lang)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setNoticeFilter(tag) {
  currentNoticeFilter = tag;
  document.querySelectorAll('#notice-pills .filter-pill').forEach(btn => {
    btn.classList.toggle('is-active', btn.textContent.trim().toUpperCase() === tag || (tag === 'ALL' && btn.textContent.trim().includes('All')));
  });
  const container = document.getElementById('notices-list-container');
  if (container) container.innerHTML = renderNoticesList(NOTICES);
}
window.setNoticeFilter = setNoticeFilter;

/* ─── SEARCH ────────────────────────────────────────────────── */
function renderSearch(main) {
  main.innerHTML = `
    ${subpageBanner(
      lang === 'hi' ? 'माप उपकरण निर्देशिका' : 'Commercial Instrument Directory Search',
      lang === 'hi' ? 'वाणिज्यिक वजन और माप उपकरणों का केंद्रीय सत्यापन डेटाबेस' : 'Public registry of verified commercial weighing and measuring instruments across all state jurisdictions',
      [lang === 'hi' ? 'निर्देशिका खोज' : 'Instrument Search']
    )}

    <div style="max-width:68rem;margin:0 auto">
      ${card(`
        <div style="margin-bottom:18px">
          <h2 style="font-size:1.25rem;font-weight:800;color:var(--hp-navy);margin:0 0 4px">
            ${lang === 'hi' ? 'पंजीकृत उपकरण खोजें' : 'Search Registered Instruments'}
          </h2>
          <p class="text-xs text-muted" style="margin:0">
            ${lang === 'hi' ? 'उपकरण संख्या, सीरियल नंबर, प्रतिष्ठान का नाम अथवा श्रेणी द्वारा खोजें:' : 'Filter records by instrument ID, commercial firm name, or category:'}
          </p>
        </div>

        <form class="space-y-4" onsubmit="doSearch(event)">
          <div class="grid-3" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px">
            <div class="field">
              <label for="s-instr" style="font-weight:700;color:var(--hp-navy)">${lang === 'hi' ? 'उपकरण संख्या / फर्म नाम' : 'Instrument No. / Firm Name'}</label>
              <input id="s-instr" class="input" type="text" placeholder="e.g. NRK/WB/… or Ramesh" style="height:44px" />
            </div>
            <div class="field">
              <label for="s-cat" style="font-weight:700;color:var(--hp-navy)">${lang === 'hi' ? 'उपकरण श्रेणी' : 'Instrument Category'}</label>
              <select id="s-cat" class="select" style="height:44px">
                <option value="">${lang === 'hi' ? 'सभी श्रेणियाँ (All)' : 'All categories'}</option>
                ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label for="s-area" style="font-weight:700;color:var(--hp-navy)">${lang === 'hi' ? 'क्षेत्र / जिला' : 'Jurisdiction / Area'}</label>
              <select id="s-area" class="select" style="height:44px">
                <option value="">All areas</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Pune">Pune</option>
                <option value="Delhi">Delhi</option>
                <option value="Bengaluru">Bengaluru</option>
              </select>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding-top:4px">
            <div class="sample-chips-row" style="margin:0">
              <span style="font-weight:700;color:var(--hp-navy)">Quick samples:</span>
              <button type="button" class="sample-chip" onclick="document.getElementById('s-instr').value='NRK/WB/MUM/001';doSearch(new Event('submit'))">NRK/WB/MUM/001</button>
              <button type="button" class="sample-chip" onclick="document.getElementById('s-instr').value='Ramesh';doSearch(new Event('submit'))">Ramesh Trading</button>
            </div>

            <div style="display:flex;gap:10px">
              <button class="btn btn-secondary" type="button" onclick="document.getElementById('s-instr').value='';document.getElementById('s-cat').value='';document.getElementById('s-area').value='';doSearch(new Event('submit'))">
                ${lang === 'hi' ? 'रीसेट' : 'Reset'}
              </button>
              <button class="hp-btn hp-btn--primary" type="submit" style="padding:0 24px;height:42px">
                ${lang === 'hi' ? 'खोजें' : 'Search Records'}
              </button>
            </div>
          </div>
        </form>
      `)}

      <div id="search-results" style="margin-top:1.5rem">
        <p class="text-sm text-muted" style="margin-bottom:.75rem">Showing all ${INSTRUMENTS.length} registered commercial instruments</p>
        <div class="table-wrap">${renderInstrumentTable(INSTRUMENTS)}</div>
      </div>
    </div>
  `;
}

function doSearch(e) {
  if (e && e.preventDefault) e.preventDefault();
  const q = (document.getElementById('s-instr')?.value || '').trim().toLowerCase();
  const cat = document.getElementById('s-cat')?.value || '';
  const area = document.getElementById('s-area')?.value || '';

  const res = INSTRUMENTS.filter(i =>
    (!q || i.instrumentNo.toLowerCase().includes(q) || i.firmName.toLowerCase().includes(q)) &&
    (!cat || i.category === cat) &&
    (!area || (i.area && i.area.toLowerCase().includes(area.toLowerCase())))
  );

  const el = document.getElementById('search-results');
  if (!el) return;
  if (!res.length) {
    el.innerHTML = emptyState('No instruments found matching the specified search criteria.');
    return;
  }
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <p class="text-sm text-muted" style="margin:0">
        Found <strong>${res.length}</strong> matching instrument${res.length === 1 ? '' : 's'}
      </p>
      <span class="badge badge-ok" style="font-size:0.75rem">Live Directory</span>
    </div>
    <div class="table-wrap">${renderInstrumentTable(res)}</div>
  `;
}
window.doSearch = doSearch;

function renderInstrumentTable(list) {
  return `
    <table class="table" style="font-size:0.875rem">
      <thead>
        <tr>
          <th>Instrument No.</th>
          <th>Category</th>
          <th>Firm / Owner</th>
          <th>Jurisdiction Area</th>
          <th>Certificate Status</th>
          <th style="text-align:right">Action</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(i => {
          const cert = CERTIFICATES.find(c => c.instrumentId === i.id);
          const certNo = cert ? cert.certNo : '';
          return `
            <tr>
              <td>
                <span class="font-mono" style="font-weight:700;color:var(--hp-navy)">${escHtml(i.instrumentNo)}</span>
                <span class="text-xs text-muted" style="display:block">SN: ${escHtml(i.serialNo || 'N/A')}</span>
              </td>
              <td><strong>${escHtml(i.category)}</strong></td>
              <td>${escHtml(i.firmName)}</td>
              <td class="text-sm text-muted">${escHtml(i.area)}</td>
              <td>${statusBadge(i.certStatus)}</td>
              <td style="text-align:right">
                ${certNo
                  ? `<button class="hp-btn hp-btn--outline" onclick="navigate('validate/${encodeURIComponent(certNo)}')" type="button" style="padding:4px 12px;font-size:0.75rem">
                      Check cert →
                    </button>`
                  : `<span class="text-xs text-muted">No cert</span>`
                }
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

/* ─── HELP ──────────────────────────────────────────────────── */
function renderHelp(main) {
  const faqs = [
    {
      q: 'How do I get a digital verification certificate for my instrument?',
      a: 'Register your commercial firm or trading entity on the Nirikshan DirectVerify portal. Add your weighing instrument details, and submit an application for initial verification or re-verification. An authorized Legal Metrology Inspector will visit your premises for calibration testing. Once approved by the Legal Metrology Officer (LMO), your Form VII digital certificate is instantly generated and accessible online.'
    },
    {
      q: 'Is there any fee for checking or validating a certificate?',
      a: 'No. The public certificate verification service is 100% free and accessible to any citizen, consumer, or enforcement officer without requiring any account login. Statutory verification and stamping fees payable to the government are assessed strictly per the schedule under the Legal Metrology (General) Rules, 2011.'
    },
    {
      q: 'How long is a Legal Metrology certificate valid?',
      a: 'Statutory certificate validity depends on the instrument class and rule version. Under standard regulations, commercial weighbridges and retail counter scales must be re-verified every 12 months. Certain automated systems and fuel dispensing units have intervals specified under their respective gazette rules.'
    },
    {
      q: 'What should I do if a certificate or physical lead seal appears tampered with?',
      a: 'You can immediately submit a confidential whistleblower complaint using the "Report Certificate Tampering" portal. Please specify the certificate number, business establishment name, and nature of irregularity. Reports are investigated with utmost priority by the Enforcement Directorate.'
    },
    {
      q: 'Can I verify an instrument using a smartphone or tablet?',
      a: 'Yes. The Nirikshan DirectVerify portal is fully responsive and supports instant verification on mobile devices. Every official certificate carries a micro-QR code that can be scanned using any standard smartphone camera to open the instant verification screen.'
    },
    {
      q: 'What happens if my certificate expires without re-verification?',
      a: 'Using an unverified or expired weighing or measuring instrument in commercial transactions is a cognizable offence under Section 24 and Section 33 of the Legal Metrology Act, 2009. The instrument may be seized by an inspector, and the trader is subject to compounding fines or legal prosecution.'
    }
  ];

  main.innerHTML = `
    ${subpageBanner(
      lang === 'hi' ? 'सहायता केंद्र एवं प्रश्नोत्तरी' : 'Help & Support Center',
      lang === 'hi' ? 'प्रमाणन प्रक्रिया, वैधानिक शुल्क, शिकायत निवारण और संपर्क सूत्र' : 'Frequently asked questions, stamping guidance, fee transparency, and official departmental support channels',
      [lang === 'hi' ? 'सहायता' : 'Help & Support']
    )}

    <div style="max-width:68rem;margin:0 auto">
      <div class="grid-2" style="display:grid;grid-template-columns:1.4fr 1fr;gap:28px;align-items:flex-start">
        <div>
          <h2 style="font-size:1.35rem;font-weight:800;color:var(--hp-navy);margin:0 0 16px">
            ${lang === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
          </h2>

          <div class="dvf-list" role="region" aria-label="FAQ Accordion">
            ${faqs.map((f, idx) => `
              <div class="dvf-item ${idx === 0 ? 'is-open' : ''}" data-faq="${idx}">
                <button
                  class="dvf-q"
                  type="button"
                  onclick="toggleFaqAccordion(this)"
                  aria-expanded="${idx === 0}"
                >
                  <span class="dvf-num">${String(idx + 1).padStart(2, '0')}</span>
                  <span class="dvf-q_text">${escHtml(f.q)}</span>
                  <span class="dvf-sign" aria-hidden="true"></span>
                </button>
                <div class="dvf-a">
                  <div class="dvf-a_inner">
                    <p style="margin:0">${escHtml(f.a)}</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          <h2 style="font-size:1.35rem;font-weight:800;color:var(--hp-navy);margin:0 0 16px">
            ${lang === 'hi' ? 'विभागीय संपर्क सूत्र' : 'Departmental Helpdesk'}
          </h2>

          <div class="contact-card" style="box-shadow:var(--hp-shadow-lg);padding:12px 24px;border:1px solid var(--line);max-width:100%">
            <div class="contact-card_row">
              <div class="contact-card_icon" style="background:var(--hp-green)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div class="contact-card_body">
                <span class="contact-card_label">Toll-Free Consumer Helpline</span>
                <span class="contact-card_value" style="font-weight:700;font-size:1.05rem">1800-11-4000 / 1915</span>
                <span class="text-xs text-muted">Monday to Friday (9:30 AM – 5:30 PM IST)</span>
              </div>
            </div>

            <div class="contact-card_divider"></div>

            <div class="contact-card_row">
              <div class="contact-card_icon" style="background:var(--hp-navy)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div class="contact-card_body">
                <span class="contact-card_label">Official Support Desk</span>
                <a href="mailto:support@lmnirikshan.gov.in" class="contact-card_value font-mono">support@lmnirikshan.gov.in</a>
                <span class="text-xs text-muted">Response within 24 business hours</span>
              </div>
            </div>

            <div class="contact-card_divider"></div>

            <div class="contact-card_row">
              <div class="contact-card_icon" style="background:var(--hp-orange)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/></svg>
              </div>
              <div class="contact-card_body">
                <span class="contact-card_label">Central Directorate</span>
                <span class="contact-card_value">Department of Legal Metrology, Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi 110001</span>
              </div>
            </div>
          </div>

          <div class="card" style="margin-top:16px;background:var(--hp-surface);border-left:4px solid var(--hp-orange)">
            <h3 style="font-size:0.95rem;font-weight:800;color:var(--hp-navy);margin:0 0 6px">
              ⚠️ Suspect Fraud or Tampered Certificate?
            </h3>
            <p class="text-xs text-muted" style="margin:0 0 10px;line-height:1.5">
              Protect fair trade. File an encrypted report with the Legal Metrology Enforcement Directorate.
            </p>
            <button class="hp-btn hp-btn--outline" onclick="navigate('report-tampering')" type="button" style="width:100%;font-size:0.8125rem">
              Report Tampering Channel →
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function toggleFaqAccordion(btn) {
  const item = btn.closest('.dvf-item');
  if (!item) return;
  const wasOpen = item.classList.contains('is-open');
  item.classList.toggle('is-open', !wasOpen);
  btn.setAttribute('aria-expanded', String(!wasOpen));
}
window.toggleFaqAccordion = toggleFaqAccordion;

/* ─── OWNER DASHBOARD ─────────────────────────────────────── */
function renderOwnerDashboard(main) {
  const myInstruments = INSTRUMENTS.filter(i => i.ownerId === currentUser.id);
  const myApps = APPLICATIONS.filter(a => a.ownerId === currentUser.id);
  const myCerts = CERTIFICATES.filter(c => c.ownerId === currentUser.id);
  const expiredCerts = myCerts.filter(c => c.status === 'EXPIRED');
  const validCerts = myCerts.filter(c => c.status === 'VALID');
  const openApps = myApps.filter(a => ['SUBMITTED','INSPECTED'].includes(a.status));

  main.innerHTML = `
    ${subpageBanner(
      `Owner Dashboard · ${currentUser.fullName}`,
      'Central Legal Metrology Enterprise & Applicant Management Portal',
      ['Owner Portal', 'Overview']
    )}

    <div class="dash-stat-grid">
      <div class="dash-stat-card dash-stat-card--lime">
        <div class="dash-stat-card_top">
          <span class="dash-stat-card_label">Registered Instruments</span>
          <span style="font-size:1.25rem">⚖️</span>
        </div>
        <p class="dash-stat-num">${myInstruments.length}</p>
        <span class="dash-stat-card_hint"><a href="#owner-instruments" onclick="navigate('owner-instruments');return false;">View all instruments →</a></span>
      </div>

      <div class="dash-stat-card dash-stat-card--green">
        <div class="dash-stat-card_top">
          <span class="dash-stat-card_label">Valid Certificates</span>
          <span style="font-size:1.25rem">✓</span>
        </div>
        <p class="dash-stat-num" style="color:var(--hp-green)">${validCerts.length}</p>
        <span class="dash-stat-card_hint"><a href="#owner-certificates" onclick="navigate('owner-certificates');return false;">Active &amp; verified →</a></span>
      </div>

      <div class="dash-stat-card dash-stat-card--orange">
        <div class="dash-stat-card_top">
          <span class="dash-stat-card_label">Expiring Soon / Due</span>
          <span style="font-size:1.25rem">⏳</span>
        </div>
        <p class="dash-stat-num" style="color:var(--hp-orange)">${expiredCerts.length}</p>
        <span class="dash-stat-card_hint"><a href="#owner-certificates" onclick="navigate('owner-certificates');return false;">Review renewals →</a></span>
      </div>

      <div class="dash-stat-card dash-stat-card--navy">
        <div class="dash-stat-card_top">
          <span class="dash-stat-card_label">Pending Applications</span>
          <span style="font-size:1.25rem">📋</span>
        </div>
        <p class="dash-stat-num" style="color:var(--hp-navy)">${openApps.length}</p>
        <span class="dash-stat-card_hint"><a href="#owner-applications" onclick="navigate('owner-applications');return false;">Track status →</a></span>
      </div>
    </div>

    <!-- Quick action bar -->
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">
      <button class="hp-btn hp-btn--primary" onclick="navigate('owner-instruments/new')">+ Add New Instrument</button>
      <button class="btn btn-secondary" onclick="navigate('owner-apply')">Apply for Stamping / Re-verification</button>
      <button class="btn btn-secondary" onclick="navigate('owner-grievances/new')">Submit Grievance / Query</button>
    </div>

    <section class="inspection-section" aria-labelledby="recent-apps">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <h2 id="recent-apps" style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin:0">Recent Applications</h2>
        <a href="#owner-applications" onclick="navigate('owner-applications');return false;" class="hp-link text-xs">View all →</a>
      </div>
      ${myApps.length === 0 ? emptyState('No applications yet. Register an instrument to get started.') : card(`
        <div class="table-wrap">
          <table>
            <thead><tr><th>Application No.</th><th>Instrument</th><th>Category</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
            <tbody>
              ${myApps.slice(0,5).map(a => `<tr>
                <td class="font-mono text-sm">${escHtml(a.applicationNo)}</td>
                <td class="font-mono text-xs">${escHtml(a.instrumentNo)}</td>
                <td class="text-sm">${escHtml(a.category)}</td>
                <td>${statusBadge(a.status)}</td>
                <td class="text-sm text-muted">${fmtDate(a.submittedAt)}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="navigate('owner-applications/${a.id}')">View</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `)}
    </section>

    <section style="margin-top:2rem" aria-labelledby="cert-due">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <h2 id="cert-due" style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin:0">Certificates Expiring Soon</h2>
        <a href="#owner-certificates" onclick="navigate('owner-certificates');return false;" class="hp-link text-xs">View all certificates →</a>
      </div>
      ${expiredCerts.length === 0 && validCerts.filter(c => Math.ceil((new Date(c.validTill)-new Date())/86400000)<=60).length === 0
        ? card(`<p class="text-sm text-muted">All your certificates are valid and not due for renewal in the next 60 days.</p>`)
        : card(`<div class="table-wrap">
            <table>
              <thead><tr><th>Cert No.</th><th>Instrument</th><th>Valid Till</th><th>Status</th><th></th></tr></thead>
              <tbody>
                ${[...expiredCerts, ...validCerts.filter(c => Math.ceil((new Date(c.validTill)-new Date())/86400000)<=60)].map(c => `<tr>
                  <td class="font-mono text-sm">${escHtml(c.certNo)}</td>
                  <td class="font-mono text-xs">${escHtml(c.instrumentNo)}</td>
                  <td>${fmtDate(c.validTill)}</td>
                  <td>${statusBadge(c.status)}</td>
                  <td><button class="btn btn-secondary btn-sm" onclick="navigate('owner-certificates/${c.id}')">View</button></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`)
      }
    </section>
  `;
}

/* ─── OWNER INSTRUMENTS ───────────────────────────────────── */
function renderOwnerInstruments(main) {
  const list = INSTRUMENTS.filter(i => i.ownerId === currentUser.id);
  main.innerHTML = `
    ${pageTitle('My instruments', `<button class="btn btn-primary btn-sm" onclick="navigate('owner-instruments/new')">+ Add instrument</button>`)}
    ${list.length === 0 ? emptyState('No instruments registered yet.') : card(`
      <div class="table-wrap">
        <table>
          <thead><tr><th>Instrument No.</th><th>Serial No.</th><th>Category</th><th>Status</th><th>Cert. Status</th><th>Valid Till</th><th></th></tr></thead>
          <tbody>
            ${list.map(i => `<tr>
              <td class="font-mono text-sm">${escHtml(i.instrumentNo)}</td>
              <td class="font-mono text-sm">${escHtml(i.serialNo)}</td>
              <td>${escHtml(i.category)}</td>
              <td>${statusBadge(i.status)}</td>
              <td>${statusBadge(i.certStatus)}</td>
              <td class="text-sm text-muted">${fmtDate(i.validTill)}</td>
              <td><button class="btn btn-secondary btn-sm" onclick="navigate('owner-instruments/${i.id}')">View</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `)}
  `;
}

function renderOwnerInstrumentDetail(main, id) {
  if (id === 'new') return renderAddInstrument(main);
  const inst = INSTRUMENTS.find(i => i.id === id);
  if (!inst) { main.innerHTML = alert('Instrument not found.'); return; }
  const cert = CERTIFICATES.find(c => c.instrumentId === id && c.status === 'VALID');
  const openApp = APPLICATIONS.find(a => a.instrumentId === id && ['SUBMITTED','INSPECTED'].includes(a.status));

  main.innerHTML = `
    <a href="#owner-instruments" onclick="navigate('owner-instruments');return false;" class="text-primary text-sm" style="text-decoration:underline">← All instruments</a>
    <div class="page-title-row" style="margin-top:.75rem">
      <h1 class="page-title font-mono" style="font-size:1.25rem">${escHtml(inst.instrumentNo)}</h1>
      <div class="flex-gap">
        ${statusBadge(inst.certStatus)}
        ${inst.status === 'ACTIVE' && !openApp ? `<button class="btn btn-primary btn-sm" onclick="navigate('owner-apply/${id}')">Apply for verification</button>` : ''}
      </div>
    </div>
    <div class="grid-2">
      ${card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">Instrument details</h2>
        <dl class="cert-dl">
          <div><dt>Category</dt><dd>${escHtml(inst.category)}</dd></div>
          <div><dt>Serial number</dt><dd class="font-mono">${escHtml(inst.serialNo)}</dd></div>
          <div><dt>Make / Model</dt><dd>${escHtml(inst.makeModel)}</dd></div>
          <div><dt>Capacity</dt><dd>${escHtml(inst.capacity)}</dd></div>
          <div><dt>Accuracy class</dt><dd>${escHtml(inst.accuracyClass)}</dd></div>
          <div><dt>Firm name</dt><dd>${escHtml(inst.firmName)}</dd></div>
          <div><dt>Address</dt><dd>${escHtml(inst.address)}</dd></div>
          <div><dt>Area</dt><dd>${escHtml(inst.area)}</dd></div>
        </dl>
      `)}
      ${card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">Verification status</h2>
        ${cert ? `
          <p><strong>Certificate:</strong> <span class="font-mono text-sm">${escHtml(cert.certNo)}</span></p>
          <p style="margin-top:.5rem"><strong>Valid till:</strong> ${fmtDate(cert.validTill)}</p>
          <button class="btn btn-secondary btn-sm" style="margin-top:.75rem" onclick="navigate('owner-certificates/${cert.id}')">View certificate</button>
        ` : `<p class="text-muted text-sm">No valid certificate on record.</p>`}
        ${openApp ? `
          <div style="margin-top:1rem">${alert(`Application ${escHtml(openApp.applicationNo)} is ${openApp.status.toLowerCase()}.`, 'info')}</div>
        ` : ''}
      `)}
    </div>

    <!-- Change requests -->
    ${inst.status !== 'DEREGISTERED' ? `
    <div style="margin-top:1.25rem">
      ${card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">Changes to this instrument</h2>
        <div class="flex-gap" id="req-btns">
          <button class="btn btn-secondary btn-sm" onclick="showRequestForm('TRANSFER')">Transfer ownership</button>
          <button class="btn btn-secondary btn-sm" onclick="showRequestForm('ADDRESS_CHANGE')">Change address</button>
          <button class="btn btn-secondary btn-sm" onclick="showRequestForm('DEREGISTER')">De-register</button>
        </div>
        <div id="req-form" style="margin-top:1rem"></div>
        ${renderChangeRequestList(id)}
      `)}
    </div>
    ` : `<div style="margin-top:1rem">${alert('This instrument has been de-registered.', 'warn')}</div>`}
  `;
  window._currentInstrumentId = id;
}

window.showRequestForm = function(kind) {
  const el = document.getElementById('req-form');
  if (!el) return;
  if (kind === 'TRANSFER') {
    el.innerHTML = `<div class="space-y-3"><div class="field"><label>Mobile number of new owner</label><input id="req-mobile" class="input" type="tel" maxlength="10" placeholder="10-digit mobile" /><p class="hint">They must already have an approved account.</p></div><div class="field"><label>Note (optional)</label><textarea class="textarea" id="req-note" rows="2"></textarea></div><button class="btn btn-primary btn-sm" onclick="submitRequest('TRANSFER')">Send request</button><button class="btn btn-ghost btn-sm" onclick="document.getElementById('req-form').innerHTML=''">Cancel</button></div>`;
  } else if (kind === 'ADDRESS_CHANGE') {
    el.innerHTML = `<div class="space-y-3"><div class="field"><label>New address</label><input id="req-addr" class="input" /></div><div class="field"><label>Area</label><select id="req-area" class="select"><option value="">Choose…</option>${AREAS.filter(a=>a.level==='WARD').map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select></div><button class="btn btn-primary btn-sm" onclick="submitRequest('ADDRESS_CHANGE')">Send request</button><button class="btn btn-ghost btn-sm" onclick="document.getElementById('req-form').innerHTML=''">Cancel</button></div>`;
  } else {
    el.innerHTML = `<div class="space-y-3">${alert('If this instrument has a valid certificate, it will be withdrawn. This cannot be undone.', 'warn')}<div class="field"><label>Reason</label><select id="req-reason" class="select"><option value="">Choose…</option><option value="SOLD_OUTSIDE_JURISDICTION">Sold outside jurisdiction</option><option value="SCRAPPED">Scrapped</option><option value="DAMAGED_BEYOND_REPAIR">Damaged beyond repair</option><option value="NO_LONGER_IN_USE">No longer in use</option><option value="OTHER">Other</option></select></div><button class="btn btn-danger btn-sm" onclick="submitRequest('DEREGISTER')">Request de-registration</button><button class="btn btn-ghost btn-sm" onclick="document.getElementById('req-form').innerHTML=''">Cancel</button></div>`;
  }
};

window.submitRequest = function(kind) {
  const id = window._currentInstrumentId;
  CHANGE_REQUESTS.push({ id: 'req'+Date.now(), instrumentId: id, kind, status: 'OPEN', reasonCode: kind==='DEREGISTER'?document.getElementById('req-reason')?.value:null, note: document.getElementById('req-note')?.value || null, toFirm: null, remark: null, decidedAt: null, createdAt: new Date().toISOString() });
  toastMsg('Request sent. You will get a notice when the officer decides.', 'ok');
  navigate('owner-instruments/'+id);
};

function renderChangeRequestList(instrumentId) {
  const reqs = CHANGE_REQUESTS.filter(r => r.instrumentId === instrumentId);
  if (!reqs.length) return '';
  const statusMap = { OPEN:['Waiting for officer','info'], IN_PROGRESS:['Waiting for officer','info'], APPROVED:['Approved','ok'], REJECTED:['Not approved','danger'], CLOSED:['Withdrawn','muted'] };
  return `<ul class="space-y-3" style="border-top:1px solid var(--line);margin-top:.75rem;padding-top:.75rem">
    ${reqs.map(r => `<li class="flex-between text-sm">
      <div><strong>${r.kind.replace(/_/g,' ')}</strong> ${badge(...(statusMap[r.status]||[r.status,'muted']))}<div class="text-xs text-muted">${fmtDate(r.createdAt)}</div></div>
      ${(r.status==='OPEN'||r.status==='IN_PROGRESS') ? `<button class="btn btn-ghost btn-sm" onclick="withdrawRequest('${r.id}')">Withdraw</button>` : ''}
    </li>`).join('')}
  </ul>`;
}

window.withdrawRequest = function(id) {
  const r = CHANGE_REQUESTS.find(x => x.id === id);
  if (r) r.status = 'CLOSED';
  toastMsg('Request withdrawn.', 'ok');
  navigate('owner-instruments/' + window._currentInstrumentId);
};

function renderAddInstrument(main) {
  main.innerHTML = `
    <a href="#owner-instruments" onclick="navigate('owner-instruments');return false;" class="text-primary text-sm" style="text-decoration:underline">← Back</a>
    <h1 class="page-title" style="margin-top:.75rem">Add instrument</h1>
    ${card(`
      <form class="space-y-4" onsubmit="doAddInstrument(event)">
        <div class="grid-2">
          <div class="field"><label>Category *</label><select class="select" id="ai-cat" required><option value="">Choose…</option>${CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
          <div class="field"><label>Serial number *</label><input class="input" id="ai-serial" required /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Make / Model</label><input class="input" id="ai-model" /></div>
          <div class="field"><label>Capacity</label><input class="input" id="ai-cap" placeholder="e.g. 60 tonnes" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Accuracy class</label><select class="select" id="ai-acc"><option value="I">Class I</option><option value="II">Class II</option><option value="III" selected>Class III</option><option value="IIII">Class IIII</option></select></div>
          <div class="field"><label>Area / Ward *</label><select class="select" id="ai-area" required><option value="">Choose…</option>${AREAS.filter(a=>a.level==='WARD').map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label>Address *</label><input class="input" id="ai-addr" required minlength="10" /></div>
        <button class="btn btn-primary" type="submit">Register instrument</button>
      </form>
    `)}
  `;
}

window.doAddInstrument = function(e) {
  e.preventDefault();
  const cat = document.getElementById('ai-cat').value;
  const serial = document.getElementById('ai-serial').value.trim();
  const area = AREAS.find(a => a.id === document.getElementById('ai-area').value);
  const newId = 'inst' + Date.now();
  const instrNo = `NRK/${cat.substring(0,2).toUpperCase()}/MUM/${new Date().getFullYear()}/${String(INSTRUMENTS.length+1).padStart(6,'0')}`;
  INSTRUMENTS.push({
    id: newId, instrumentNo: instrNo, serialNo: serial, category: cat, status: 'ACTIVE', certStatus: 'NONE',
    area: area?.name || 'Unknown', address: document.getElementById('ai-addr').value,
    ownerId: currentUser.id, firmName: currentUser.fullName,
    makeModel: document.getElementById('ai-model').value,
    capacity: document.getElementById('ai-cap').value,
    accuracyClass: document.getElementById('ai-acc').value,
    lastVerifiedOn: null, validTill: null
  });
  toastMsg('Instrument registered! Instrument number: ' + instrNo, 'ok');
  navigate('owner-instruments');
};

/* ─── APPLY FOR VERIFICATION & STAMPING ───────────────────── */
function renderOwnerApply(main, instrumentId) {
  const myInstruments = INSTRUMENTS.filter(i => i.ownerId === currentUser.id && i.status === 'ACTIVE');

  if (myInstruments.length === 0) {
    main.innerHTML = `
      <div style="max-width:38rem;margin:2rem auto">
        <div class="card" style="text-align:center;padding:2.5rem 1.5rem">
          <div style="font-size:3rem;margin-bottom:1rem">⚖️</div>
          <h2 style="font-size:1.35rem;font-weight:800;color:var(--hp-navy);margin-bottom:0.5rem">No Active Instruments Registered</h2>
          <p class="text-sm text-muted" style="max-width:28rem;margin:0 auto 1.5rem">
            Before applying for official stamping or re-verification under the Legal Metrology Act, you must first register your commercial weighing or measuring instrument.
          </p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <button class="hp-btn hp-btn--primary" onclick="navigate('owner-instruments/new')">+ Register New Instrument</button>
            <button class="btn btn-secondary" onclick="navigate('owner-dashboard')">Return to Dashboard</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  let selectedInst = instrumentId ? INSTRUMENTS.find(i => i.id === instrumentId) : null;
  if (!selectedInst) {
    // Default to the first expired or first active instrument
    selectedInst = myInstruments.find(i => i.certStatus === 'EXPIRED') || myInstruments[0];
  }

  main.innerHTML = `
    <div style="margin-bottom:1rem">
      <a href="#owner-dashboard" onclick="navigate('owner-dashboard');return false;" class="hp-link text-xs">
        ← Back to Dashboard
      </a>
    </div>

    ${subpageBanner(
      lang === 'hi' ? 'मुद्रांकन एवं पुनर्सत्यापन हेतु आवेदन' : 'Application for Stamping & Re-verification',
      lang === 'hi' ? 'विधिक मापविज्ञान अधिनियम, 2009 की धारा 24 के अंतर्गत विहित वैधानिक आवेदन' : 'Statutory e-filing for initial stamping or periodic re-verification under Section 24 of Legal Metrology Act',
      ['Applicant Portal', 'Apply for Stamping']
    )}

    <div style="max-width:44rem;margin:0 auto">
      <div class="card" style="border-top:4px solid var(--hp-green)">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:1.25rem">
          <div class="dv-seal-emblem" style="width:40px;height:40px" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="30" fill="#0e5a2a"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke="#b7d93a" stroke-width="2"/>
              <path d="M22 33l7 7 14-16" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin:0">
              ${lang === 'hi' ? 'सत्यापन आवेदन प्रपत्र' : 'Metrological Stamping & Verification Order Form'}
            </h2>
            <p class="text-xs text-muted" style="margin:2px 0 0">
              Department of Legal Metrology · Form VII / Rule 11 Statutory Filing
            </p>
          </div>
        </div>

        <form class="space-y-4" onsubmit="doSubmitApplication(event)">
          <!-- 1. Instrument Selection -->
          <div class="field">
            <label for="app-inst-select" style="font-weight:700">1. Select Registered Commercial Instrument *</label>
            <select id="app-inst-select" class="select" onchange="onApplyInstrumentChange(this.value)" required>
              ${myInstruments.map(i => `
                <option value="${i.id}" ${i.id === selectedInst.id ? 'selected' : ''}>
                  ${escHtml(i.category)} — ${escHtml(i.instrumentNo)} (${escHtml(i.makeModel || i.serialNo)}) [${i.certStatus}]
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Dynamic Instrument Summary Card -->
          <div id="inst-summary-box" style="background:var(--hp-surface);border:1px solid var(--line);border-radius:var(--radius-md);padding:1rem">
            ${renderInstrumentSummaryHtml(selectedInst)}
          </div>

          <!-- 2. Application Service Type -->
          <div class="field">
            <label style="font-weight:700">2. Stamping / Verification Category *</label>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-top:6px">
              <label style="display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid var(--line);border-radius:var(--radius-sm);cursor:pointer;background:#fff">
                <input type="radio" name="app-stamping-type" value="PERIODIC_REVERIFICATION" checked style="margin-top:3px" />
                <div>
                  <strong style="font-size:0.85rem;display:block">Periodic Re-verification</strong>
                  <span class="text-xs text-muted">Annual / 24-month statutory re-testing</span>
                </div>
              </label>
              <label style="display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid var(--line);border-radius:var(--radius-sm);cursor:pointer;background:#fff">
                <input type="radio" name="app-stamping-type" value="INITIAL_STAMPING" style="margin-top:3px" />
                <div>
                  <strong style="font-size:0.85rem;display:block">Initial Stamping</strong>
                  <span class="text-xs text-muted">Brand-new instrument first commissioning</span>
                </div>
              </label>
              <label style="display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid var(--line);border-radius:var(--radius-sm);cursor:pointer;background:#fff">
                <input type="radio" name="app-stamping-type" value="RE_STAMP_AFTER_REPAIR" style="margin-top:3px" />
                <div>
                  <strong style="font-size:0.85rem;display:block">Re-stamping Post Repair</strong>
                  <span class="text-xs text-muted">Post broken seal or component overhaul</span>
                </div>
              </label>
            </div>
          </div>

          <!-- 3. Preferred Date & Contact Details -->
          <div class="grid-2">
            <div class="field">
              <label for="app-date" style="font-weight:700">3. Preferred Inspection Window Date</label>
              <input class="input" type="date" id="app-date" min="${new Date().toISOString().slice(0,10)}" value="${new Date(Date.now() + 86400000*3).toISOString().slice(0,10)}" required />
              <span class="hint">District Inspector conducts physical visit during this window.</span>
            </div>
            <div class="field">
              <label for="app-contact" style="font-weight:700">Authorized Contact Person &amp; Phone</label>
              <input class="input" type="text" id="app-contact" value="${escHtml(currentUser.fullName)} (${escHtml(currentUser.username)})" required />
            </div>
          </div>

          <!-- 4. Site Address -->
          <div class="field">
            <label for="app-address" style="font-weight:700">4. Verification Premises Address</label>
            <input class="input" type="text" id="app-address" value="${escHtml(selectedInst.address || selectedInst.area)}" required />
            <span class="hint">Ensure physical access to load cells and test weight handling space.</span>
          </div>

          <!-- 5. Special instructions -->
          <div class="field">
            <label for="app-note" style="font-weight:700">5. Special Instructions for District Inspector (Optional)</label>
            <textarea class="textarea" id="app-note" maxlength="500" rows="2" placeholder="e.g. Standard test weights ready on site; contact gate security on arrival"></textarea>
          </div>

          <!-- Statutory Declaration -->
          <div style="background:var(--hp-green-light);border:1px solid var(--hp-lime);border-radius:var(--radius-sm);padding:10px 14px;font-size:0.8125rem">
            <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer">
              <input type="checkbox" id="app-declare" required style="margin-top:2px" checked />
              <span>
                <strong>Statutory Undertaking:</strong> I hereby declare that the instrument is maintained in good working condition, seals are intact (or reported if altered), and is available for official verification pursuant to Section 24 of the Legal Metrology Act, 2009.
              </span>
            </label>
          </div>

          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:1.5rem">
            <button type="button" class="btn btn-secondary" onclick="navigate('owner-dashboard')">Cancel</button>
            <button id="btn-submit-app" class="hp-btn hp-btn--primary" type="submit" style="padding:10px 24px">
              Submit Stamping Application →
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderInstrumentSummaryHtml(inst) {
  if (!inst) return '';
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
      <div>
        <span class="badge badge-primary" style="font-size:0.75rem">${escHtml(inst.category)}</span>
        <h4 style="margin:4px 0;font-size:1rem;font-weight:700">${escHtml(inst.makeModel || 'Commercial Scale')}</h4>
        <p class="text-xs text-muted font-mono" style="margin:0">ID: ${escHtml(inst.instrumentNo)} · Serial: ${escHtml(inst.serialNo)}</p>
      </div>
      <div>
        ${statusBadge(inst.certStatus)}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;margin-top:10px;font-size:0.75rem">
      <div><span class="text-muted">Capacity:</span> <strong>${escHtml(inst.capacity || 'Standard')}</strong></div>
      <div><span class="text-muted">Accuracy Class:</span> <strong>${escHtml(inst.accuracyClass || 'III')}</strong></div>
      <div><span class="text-muted">Last Verified:</span> <strong>${fmtDate(inst.lastVerifiedOn)}</strong></div>
      <div><span class="text-muted">Valid Till:</span> <strong style="color:${inst.certStatus==='EXPIRED'?'var(--danger)':'var(--hp-green)'}">${fmtDate(inst.validTill)}</strong></div>
    </div>
  `;
}

window.onApplyInstrumentChange = function(instId) {
  const inst = INSTRUMENTS.find(i => i.id === instId);
  const box = document.getElementById('inst-summary-box');
  const addrInput = document.getElementById('app-address');
  if (box && inst) {
    box.innerHTML = renderInstrumentSummaryHtml(inst);
  }
  if (addrInput && inst) {
    addrInput.value = inst.address || inst.area;
  }
};

window.doSubmitApplication = function(e) {
  e.preventDefault();
  const instSelect = document.getElementById('app-inst-select');
  const instId = instSelect ? instSelect.value : null;
  const inst = INSTRUMENTS.find(i => i.id === instId);
  if (!inst) { toastMsg('Please select a valid instrument.', 'danger'); return; }

  const appNo = `NRK/APP/MUM/${new Date().getFullYear()}/${String(APPLICATIONS.length + 1001).padStart(6, '0')}`;
  const preferredDate = document.getElementById('app-date')?.value || new Date().toISOString().slice(0, 10);
  const note = document.getElementById('app-note')?.value || '';
  const stampingType = document.querySelector('input[name="app-stamping-type"]:checked')?.value || 'PERIODIC_REVERIFICATION';

  const newApp = {
    id: 'app' + Date.now(),
    applicationNo: appNo,
    instrumentId: inst.id,
    instrumentNo: inst.instrumentNo,
    category: inst.category,
    ownerId: currentUser.id,
    firmName: currentUser.fullName,
    status: 'SUBMITTED',
    area: inst.area,
    submittedAt: new Date().toISOString().slice(0, 10),
    scheduledAt: preferredDate + 'T10:00:00',
    assignedInspector: null,
    inspectionResult: null,
    officerDecision: null,
    stampingType,
    note
  };

  APPLICATIONS.unshift(newApp);
  if (typeof AUDIT_LOG !== 'undefined') {
    AUDIT_LOG.unshift({
      id: 'al' + Date.now(),
      at: new Date().toISOString(),
      actor: currentUser.fullName,
      actorRole: 'OWNER',
      action: 'APPLICATION.SUBMIT',
      target: `Application ${appNo} (${inst.category})`,
      ip: '127.0.0.1'
    });
  }

  toastMsg('Application for stamping & reverification submitted successfully! Ref: ' + appNo, 'ok');
  navigate('owner-applications/' + newApp.id);
};

/* ─── OWNER APPLICATIONS ──────────────────────────────────── */
function renderOwnerApplications(main) {
  const list = APPLICATIONS.filter(a => a.ownerId === currentUser.id);
  main.innerHTML = `
    ${pageTitle('My applications')}
    ${list.length === 0 ? emptyState('No applications yet.') : card(`
      <div class="table-wrap">
        <table>
          <thead><tr><th>Application No.</th><th>Instrument</th><th>Category</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
          <tbody>
            ${list.map(a => `<tr>
              <td class="font-mono text-sm">${escHtml(a.applicationNo)}</td>
              <td class="font-mono text-xs">${escHtml(a.instrumentNo)}</td>
              <td class="text-sm">${escHtml(a.category)}</td>
              <td>${statusBadge(a.status)}</td>
              <td class="text-sm text-muted">${fmtDate(a.submittedAt)}</td>
              <td><button class="btn btn-secondary btn-sm" onclick="navigate('owner-applications/${a.id}')">View</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `)}
  `;
}

function renderOwnerApplicationDetail(main, id) {
  const app = APPLICATIONS.find(a => a.id === id);
  if (!app) { main.innerHTML = alert('Application not found.'); return; }
  const visit = VISITS.find(v => v.applicationId === id);
  const decision = DECISIONS.find(d => d.applicationId === id);
  main.innerHTML = `
    <a href="#owner-applications" onclick="navigate('owner-applications');return false;" class="text-primary text-sm" style="text-decoration:underline">← All applications</a>
    <div class="page-title-row" style="margin-top:.75rem">
      <h1 class="page-title font-mono" style="font-size:1.25rem">${escHtml(app.applicationNo)}</h1>
      ${statusBadge(app.status)}
    </div>
    <div class="grid-2">
      ${card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">Application details</h2>
        <dl class="cert-dl">
          <div><dt>Instrument</dt><dd class="font-mono text-sm">${escHtml(app.instrumentNo)}</dd></div>
          <div><dt>Category</dt><dd>${escHtml(app.category)}</dd></div>
          <div><dt>Area</dt><dd>${escHtml(app.area)}</dd></div>
          <div><dt>Submitted</dt><dd>${fmtDate(app.submittedAt)}</dd></div>
          <div><dt>Inspector</dt><dd>${app.assignedInspector || '—'}</dd></div>
          <div><dt>Scheduled</dt><dd>${app.scheduledAt ? fmtDateTime(app.scheduledAt) : '—'}</dd></div>
        </dl>
      `)}
      ${card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">Progress</h2>
        <ol class="space-y-3">
          ${[
            ['Submitted', 'SUBMITTED', true],
            ['Inspector assigned', 'ASSIGNED', !!app.assignedInspector],
            ['Inspection complete', 'INSPECTED', app.status === 'INSPECTED' || app.status === 'APPROVED' || app.status === 'REJECTED'],
            ['Decision made', 'DECIDED', app.status === 'APPROVED' || app.status === 'REJECTED'],
          ].map(([label, key, done]) => `
            <li style="display:flex;align-items:center;gap:.6rem">
              <span style="width:1.25rem;height:1.25rem;border-radius:50%;display:grid;place-items:center;font-size:.7rem;font-weight:700;${done?'background:var(--ok);color:#fff':'background:var(--line);color:var(--muted)'}">${done?'✓':'·'}</span>
              <span class="${done ? 'font-semibold' : 'text-muted'} text-sm">${label}</span>
            </li>
          `).join('')}
        </ol>
        ${decision ? `<div style="margin-top:1rem">${alert(`Officer decision: <strong>${decision.decision}</strong>${decision.remarks?` — ${escHtml(decision.remarks)}`:''}`, decision.decision==='APPROVE'?'ok':'danger')}</div>` : ''}
      `)}
    </div>
    ${visit ? card(`
      <h2 style="font-weight:600;margin-bottom:.75rem">Inspection result</h2>
      <p class="text-sm">Inspector: <strong>${escHtml(visit.inspector)}</strong> · Submitted: ${fmtDate(visit.submittedAt)}</p>
      <div style="margin-top:.75rem;display:flex;gap:.5rem">${statusBadge(visit.overall)} <span class="text-sm text-muted">Recommendation: <strong>${visit.recommendation}</strong></span></div>
      <p class="text-sm text-muted" style="margin-top:.5rem">Inspector's note: "${escHtml(visit.note || '—')}"</p>
    `, 'inspection-section') : ''}
  `;
}

/* ─── OWNER CERTIFICATES ──────────────────────────────────── */
function renderOwnerCertificates(main) {
  const list = CERTIFICATES.filter(c => c.ownerId === currentUser.id);
  main.innerHTML = `
    ${pageTitle('My certificates')}
    ${list.length === 0 ? emptyState('No certificates yet.') : card(`
      <div class="table-wrap">
        <table>
          <thead><tr><th>Cert No.</th><th>Category</th><th>Verified On</th><th>Valid Till</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${list.map(c => `<tr>
              <td class="font-mono text-sm">${escHtml(c.certNo)}</td>
              <td class="text-sm">${escHtml(c.category)}</td>
              <td class="text-sm text-muted">${fmtDate(c.verifiedOn)}</td>
              <td class="text-sm">${fmtDate(c.validTill)}</td>
              <td>${statusBadge(c.status)}</td>
              <td><button class="btn btn-secondary btn-sm" onclick="navigate('owner-certificates/${c.id}')">View</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `)}
  `;
}

function renderOwnerCertificateDetail(main, id) {
  renderCertificateDetail(main, id, false);
}

function renderCertificateDetail(main, id, isStaff) {
  const c = CERTIFICATES.find(x => x.id === id);
  if (!c) { main.innerHTML = alert('Certificate not found.'); return; }
  const backView = isStaff ? 'senior-officer-certificates' : 'owner-certificates';
  const daysLeft = Math.ceil((new Date(c.validTill) - new Date()) / 86400000);
  const ok = c.status === 'VALID';
  const isExpired = c.status === 'EXPIRED';
  const isRevoked = c.status === 'REVOKED';
  const bannerClass = ok ? 'cert-status-banner--valid' : isExpired ? 'cert-status-banner--expired' : 'cert-status-banner--revoked';
  const statusIcon = ok ? '✓' : isExpired ? '⏳' : '✕';
  const statusText = ok
    ? `OFFICIALLY VERIFIED & ACTIVE — Authenticated under Central Legal Metrology Registry (${daysLeft} days remaining)`
    : isExpired
    ? 'CERTIFICATE EXPIRED — Statutory validity period elapsed. Immediate re-verification mandated.'
    : 'CERTIFICATE REVOKED / SUSPENDED — Commercial operation prohibited by order.';

  const mockHash = 'SHA256:' + (Math.abs(c.certNo.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16).padStart(16, 'a') + '8f04c7').toUpperCase();

  main.innerHTML = `
    <div style="margin-bottom:14px">
      <a href="#${backView}" onclick="navigate('${backView}');return false;" class="hp-link text-xs">
        ← ${isStaff ? 'Return to All Certificates' : 'Return to My Certificates'}
      </a>
    </div>

    <div class="cert-official-card" role="region" aria-label="Official Certificate Details" style="margin-top:0">
      <div class="cert-header-bar">
        <div class="cert-header-title">
          <div class="dv-seal-emblem" style="width:48px;height:48px;background:rgba(255,255,255,0.15);border:2px solid #b7d93a" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="30" fill="#0e5a2a"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke="#b7d93a" stroke-width="2"/>
              <path d="M22 33l7 7 14-16" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <h3>${lang === 'hi' ? 'विधिक मापविज्ञान सत्यापन प्रमाणपत्र' : 'Certificate of Verification / Re-Verification'}</h3>
            <p>${lang === 'hi' ? 'विधिक मापविज्ञान अधिनियम, 2009 की धारा 24 के अंतर्गत जारी (प्रपत्र VII)' : 'Government of India • Department of Legal Metrology (Form VII, Rule 11)'}</p>
          </div>
        </div>
        <div style="text-align:right">
          <span class="badge" style="background:rgba(255,255,255,0.2);color:#fff;font-family:monospace;font-size:0.8125rem">
            ${escHtml(c.certNo)}
          </span>
        </div>
      </div>

      <div class="cert-status-banner ${bannerClass}">
        <span style="font-size:1.35rem;font-weight:800">${statusIcon}</span>
        <div style="flex:1">
          <div style="font-size:0.95rem;font-weight:800">${statusBadge(c.status)} &nbsp; ${statusText}</div>
        </div>
      </div>

      <div class="cert-body-wrap">
        <div class="cert-watermark" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="3"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <text x="50" y="55" font-size="12" font-weight="bold" text-anchor="middle" fill="currentColor">LEGAL METROLOGY</text>
          </svg>
        </div>

        <!-- Official Form VII QR Code Security Seal -->
        <div class="cert-qr-hero-card">
          <div class="cert-qr-box">
            ${generateQRCodeSVG(`${window.location.origin}${window.location.pathname}#validate/${encodeURIComponent(c.certNo)}`, 136)}
            <div class="cert-qr-caption">
              <span class="cert-qr-live-dot"></span> LIVE SCAN VERIFY
            </div>
          </div>
          <div class="cert-qr-info">
            <div class="cert-qr-badge">🛡️ STATUTORY DIGITAL SECURITY SEAL</div>
            <h4>Form VII Digital Authentication QR</h4>
            <p class="text-xs text-muted" style="margin:4px 0 8px;line-height:1.5">
              Scan with any smartphone camera or Nirikshan Field Scanner to verify authenticity, validity date, test report calibration points, and tamper seal checksum on the National Legal Metrology Portal.
            </p>
            <div class="cert-qr-pills">
              <span class="cert-qr-pill font-mono"><strong>Cert No:</strong> ${escHtml(c.certNo)}</span>
              <span class="cert-qr-pill font-mono"><strong>Sticker:</strong> ${escHtml(c.stickerSerial || 'SEC-INSP-2026')}</span>
              <span class="cert-qr-pill"><strong>Status:</strong> <span style="color:${ok?'var(--hp-green)':isExpired?'var(--warn)':'var(--danger)'};font-weight:700">${c.status}</span></span>
            </div>
            <div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <button type="button" class="btn btn-secondary btn-sm" onclick="simulateQRScan('${escHtml(c.certNo)}')">
                📷 Test Scan QR Code
              </button>
              <a href="#validate/${encodeURIComponent(c.certNo)}" onclick="navigate('validate/${encodeURIComponent(c.certNo)}');return false;" class="hp-link text-xs" style="font-weight:700">
                Direct Verification Sheet →
              </a>
            </div>
          </div>
        </div>

        <div class="cert-meta-grid">
          <div class="cert-meta-item">
            <span class="cert-meta-label">Certificate Number</span>
            <span class="cert-meta-val font-mono" style="color:var(--hp-green)">${escHtml(c.certNo)}</span>
          </div>
          <div class="cert-meta-item">
            <span class="cert-meta-label">Commercial Holder / Entity</span>
            <span class="cert-meta-val">${escHtml(c.holder)}</span>
          </div>
          <div class="cert-meta-item">
            <span class="cert-meta-label">Instrument ID &amp; Serial</span>
            <span class="cert-meta-val font-mono">${escHtml(c.instrumentNo)}</span>
          </div>
          <div class="cert-meta-item">
            <span class="cert-meta-label">Category &amp; Capacity</span>
            <span class="cert-meta-val">${escHtml(c.category)} · <strong>${escHtml(c.capacity)}</strong></span>
          </div>
          <div class="cert-meta-item">
            <span class="cert-meta-label">Make &amp; Model</span>
            <span class="cert-meta-val">${escHtml(c.makeModel)}</span>
          </div>
          <div class="cert-meta-item">
            <span class="cert-meta-label">Accuracy Class &amp; Tolerance</span>
            <span class="cert-meta-val">Class ${escHtml(c.accuracyClass)} · MPE: ±${escHtml(c.mpe)}</span>
          </div>
          <div class="cert-meta-item">
            <span class="cert-meta-label">Sticker Serial / Security Seal</span>
            <span class="cert-meta-val font-mono">${escHtml(c.stickerSerial)}</span>
          </div>
          <div class="cert-meta-item">
            <span class="cert-meta-label">Verification Date</span>
            <span class="cert-meta-val">${fmtDate(c.verifiedOn, lang)}</span>
          </div>
          <div class="cert-meta-item">
            <span class="cert-meta-label">Validity Expiry Date</span>
            <span class="cert-meta-val" style="color:${isExpired?'var(--warn)':'var(--hp-green)'}">
              ${fmtDate(c.validTill, lang)} (${c.validityMonths} months)
            </span>
          </div>
          <div class="cert-meta-item">
            <span class="cert-meta-label">Issuing Office &amp; Officer</span>
            <span class="cert-meta-val">${escHtml(c.issuingOffice)} / ${escHtml(c.issuedBy)}</span>
          </div>
          <div class="cert-meta-item" style="grid-column:1 / -1">
            <span class="cert-meta-label">Registry Digital Signature Fingerprint</span>
            <span class="cert-meta-val font-mono text-xs" style="word-break:break-all">${mockHash}</span>
          </div>
        </div>

        <div class="cert-actions-bar">
          <button class="hp-btn hp-btn--primary" onclick="window.print()" type="button" style="padding:8px 18px;font-size:0.875rem">
            🖨️ Print Official Certificate
          </button>
          <a href="#validate/${encodeURIComponent(c.certNo)}" class="btn btn-secondary btn-sm" onclick="navigate('validate/${encodeURIComponent(c.certNo)}');return false;">
            🌐 Public Verification Sheet
          </a>
          ${!isStaff && c.status === 'VALID' ? `<button class="btn btn-secondary btn-sm" onclick="navigate('owner-apply/${c.instrumentId}')">Apply for Renewal</button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="copyCertLink('${escHtml(c.certNo)}')" type="button">
            🔗 Copy Shareable Link
          </button>
        </div>
      </div>
    </div>

    ${isStaff ? `
      <div class="card" style="margin-top:1.5rem;border-top:3.5px solid var(--hp-navy)">
        <h3 style="font-size:1.05rem;font-weight:800;color:var(--hp-navy);margin:0 0 10px">⚖️ Officer Enforcement Actions</h3>
        <p class="text-xs text-muted" style="margin:0 0 14px">Direct action will update central registry status and log to tamper surveillance audit logs.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${c.status==='VALID' ? `<button class="btn btn-secondary btn-sm" onclick="certAction('${id}','suspend')">Suspend Certificate…</button>` : ''}
          ${c.status==='SUSPENDED' ? `<button class="hp-btn hp-btn--primary" onclick="certAction('${id}','reinstate')">Reinstate Certificate…</button>` : ''}
          ${c.status!=='REVOKED' ? `<button class="btn btn-danger btn-sm" onclick="certAction('${id}','revoke')">Revoke Certificate…</button>` : ''}
          ${c.status!=='REVOKED' ? `<button class="btn btn-secondary btn-sm" onclick="certAction('${id}','reissue')">Re-issue Certificate…</button>` : ''}
        </div>
      </div>
    ` : ''}

    <div class="card" style="margin-top:1.5rem">
      <h3 style="font-size:1.05rem;font-weight:800;color:var(--hp-navy);margin:0 0 8px">📋 Certificate Audit History</h3>
      ${c.history.length === 0
        ? `<p class="text-sm text-muted" style="margin:0">Official record generated on initial stamping. No modifications or disciplinary sanctions recorded.</p>`
        : `<ul class="space-y-2 text-sm">${c.history.map(h => `<li><span class="font-mono text-xs">${fmtDate(h.at)}</span>: <strong>${escHtml(h.action)}</strong> by ${escHtml(h.by)} — <em>${escHtml(h.note)}</em></li>`).join('')}</ul>`
      }
    </div>
  `;
}

window.certAction = function(certId, action) {
  const titles = { suspend:'Suspend certificate', revoke:'Revoke certificate', reinstate:'Reinstate certificate', reissue:'Re-issue certificate' };
  openModal(titles[action], `
    <form class="space-y-4" onsubmit="doCertAction(event,'${certId}','${action}')">
      ${action==='suspend'||action==='revoke' ? `<div class="field"><label>Reason</label><select class="select" id="cert-reason"><option>Statutory requirement – verification overdue</option><option>Instrument found non-compliant</option><option>Other</option></select></div>` : ''}
      <div class="field"><label>Internal note ${action==='suspend'||action==='revoke'?'(at least 10 chars)':'(at least 10 chars)'}</label><textarea class="textarea" id="cert-note" required minlength="10"></textarea></div>
      <div style="display:flex;justify-content:flex-end;gap:.5rem">
        <button type="button" class="btn btn-secondary" onclick="closeModalDirect()">Cancel</button>
        <button type="submit" class="btn ${action==='revoke'?'btn-danger':'btn-primary'}">${action.charAt(0).toUpperCase()+action.slice(1)}</button>
      </div>
    </form>
  `);
};

window.doCertAction = function(e, certId, action) {
  e.preventDefault();
  const c = CERTIFICATES.find(x => x.id === certId);
  if (c) {
    const oldStatus = c.status;
    if (action==='suspend') c.status = 'SUSPENDED';
    else if (action==='revoke') c.status = 'REVOKED';
    else if (action==='reinstate') c.status = 'VALID';
    c.history.push({ from: oldStatus, to: c.status, at: new Date().toISOString(), publicReason: 'Officer action', note: document.getElementById('cert-note').value });
  }
  closeModalDirect();
  toastMsg(`Certificate ${action}d.`, 'ok');
  navigate('senior-officer-certificates/' + certId);
};

/* ─── OWNER NOTICES ────────────────────────────────────────── */
function renderOwnerNotices(main) {
  main.innerHTML = `
    ${pageTitle('Notices for you')}
    <div class="space-y-3">
      ${NOTICES.map(n => card(`
        <div class="flex-between">
          <div>
            <p style="font-weight:500">${escHtml(lang==='hi'&&n.titleHi?n.titleHi:n.title)}</p>
            ${n.tag ? badge(n.tag,'info') : ''}
          </div>
          <time class="text-sm text-muted">${fmtDate(n.publishedAt)}</time>
        </div>
      `)).join('')}
    </div>
  `;
}

/* ─── OWNER GRIEVANCES ────────────────────────────────────── */
function renderOwnerGrievances(main, view) {
  const mine = GRIEVANCES.filter(g => g.ownerId === currentUser.id);
  const isNew = (view === 'owner-grievances/new');
  const myInstruments = INSTRUMENTS.filter(i => i.ownerId === currentUser.id);
  const myApps = APPLICATIONS.filter(a => a.ownerId === currentUser.id);

  main.innerHTML = `
    ${subpageBanner(
      lang === 'hi' ? 'शिकायतें एवं पूछताछ' : 'Grievances & Statutory Queries',
      lang === 'hi' ? 'विधिक मापविज्ञान अधिनियम के अंतर्गत आधिकारिक शिकायत निवारण एवं सहायता' : 'Public Grievance Redressal & Official Legal Metrology Inquiry Desk',
      ['Owner Portal', 'Grievances & Queries']
    )}

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:1.25rem;font-weight:800;color:var(--hp-navy);margin:0">
          ${lang === 'hi' ? 'मेरी शिकायतें व पूछताछ' : 'My Grievance & Query Records'}
        </h2>
        <p class="text-xs text-muted" style="margin:2px 0 0">
          Statutory 30-day resolution timeline mandated under the Legal Metrology Act.
        </p>
      </div>
      <button class="hp-btn hp-btn--primary" type="button" onclick="showGrievanceForm()">
        + ${lang === 'hi' ? 'नई शिकायत / पूछताछ दर्ज करें' : 'Submit New Grievance / Query'}
      </button>
    </div>

    <!-- Collapsible / Auto-expanded Form Wrapper -->
    <div id="grievance-form-wrap" style="${isNew ? '' : 'display:none;'}margin-bottom:1.5rem">
      ${renderGrievanceFormHtml(myInstruments, myApps)}
    </div>

    <!-- Grievances list -->
    ${mine.length === 0 ? emptyState(
      'No grievances or queries filed yet.',
      'If you encounter verification delays, inspector attendance issues, or technical difficulties, submit a formal grievance for direct senior officer resolution.',
      `<button class="hp-btn hp-btn--primary" onclick="showGrievanceForm()">+ Submit First Grievance</button>`
    ) : `<div class="space-y-4">${mine.map(g => {
      const isOpen = g.status === 'ACTIVE' || g.status === 'IN_PROGRESS';
      return card(`
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <span class="badge font-mono" style="background:var(--hp-surface);color:var(--hp-navy);font-weight:700">${escHtml(g.ref)}</span>
              ${g.type ? `<span class="badge ${g.type === 'QUERY' ? 'badge-info' : 'badge-warn'}">${escHtml(g.type)}</span>` : ''}
              ${g.category ? `<span class="badge badge-muted">${escHtml(g.category)}</span>` : ''}
              ${g.urgency === 'URGENT' ? `<span class="badge badge-danger">⚡ Urgent</span>` : ''}
            </div>
            <h3 style="font-size:1.05rem;font-weight:800;color:var(--hp-navy);margin:0 0 4px">
              ${escHtml(g.subject)}
            </h3>
            <p class="text-xs text-muted" style="margin:0">
              Submitted: <strong>${fmtDate(g.createdAt)}</strong> · Statutory Reply Mandate: <strong>${fmtDate(g.replyBy)}</strong>
              ${g.applicationNo ? ` · Related Application: <span class="font-mono">${escHtml(g.applicationNo)}</span>` : ''}
            </p>
          </div>
          <div>
            ${statusBadge(g.status)}
          </div>
        </div>

        <div style="background:rgba(0,0,0,0.02);border:1px solid var(--line);border-radius:var(--radius-sm);padding:12px;margin:10px 0;font-size:0.875rem;line-height:1.6">
          <p style="margin:0;color:var(--ink)">${escHtml(g.body)}</p>
        </div>

        ${g.reply ? `
          <div style="background:var(--hp-green-light);border:1px solid var(--hp-lime);border-radius:var(--radius-sm);padding:12px 14px;margin-top:10px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="font-size:1rem">⚖️</span>
              <strong style="font-size:0.85rem;color:var(--hp-green-dark)">Senior Officer Official Response (Vikram Singh)</strong>
              <span class="text-xs text-muted" style="margin-left:auto">${fmtDate(g.replyBy)}</span>
            </div>
            <p style="margin:0;font-size:0.875rem;color:var(--hp-green-dark);line-height:1.5">${escHtml(g.reply)}</p>
          </div>
        ` : `
          <p class="text-xs text-muted" style="margin:6px 0 0;display:flex;align-items:center;gap:6px">
            <span class="cert-qr-live-dot" style="background:var(--hp-orange)"></span> Under Senior Metrology Officer review · Response guaranteed within statutory window.
          </p>
        `}
      `);
    }).join('')}</div>`}
  `;

  if (isNew) {
    setTimeout(() => {
      const wrap = document.getElementById('grievance-form-wrap');
      if (wrap) {
        wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const input = document.getElementById('gr-sub');
        if (input) input.focus();
      }
    }, 150);
  }
}

function renderGrievanceFormHtml(myInstruments, myApps) {
  return card(`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:16px">
      <div>
        <h3 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin:0 0 4px">
          📝 Submit Grievance / Formal Inquiry
        </h3>
        <p class="text-xs text-muted" style="margin:0">
          Assigned directly to Senior Metrology Officer (Vikram Singh) for priority review and statutory redressal.
        </p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" onclick="hideGrievanceForm()">✕ Close</button>
    </div>

    <form class="space-y-4" onsubmit="submitGrievance(event)">
      <div class="grid-2">
        <div class="field">
          <label for="gr-type" style="font-weight:700">Submission Category *</label>
          <select id="gr-type" class="select" required>
            <option value="GRIEVANCE">Statutory Grievance / Complaint</option>
            <option value="QUERY">Official Query / Procedural Clarification</option>
          </select>
        </div>
        <div class="field">
          <label for="gr-cat" style="font-weight:700">Matter Concern *</label>
          <select id="gr-cat" class="select" required>
            <option value="Schedule Delay">Verification / Stamping Schedule Delay</option>
            <option value="Inspector Attendance">Inspector Field Attendance / Coordination</option>
            <option value="Fee Discrepancy">Fee / Challan Payment Discrepancy</option>
            <option value="Certificate Correction">Certificate Data or Seal Serial Correction</option>
            <option value="Tolerance Dispute">Measurement Calibration &amp; MPE Tolerance Dispute</option>
            <option value="Portal Support">Portal Technical Issue / Other</option>
          </select>
        </div>
      </div>

      <div class="grid-2">
        <div class="field">
          <label for="gr-app" style="font-weight:700">Related Application or Instrument (Optional)</label>
          <select id="gr-app" class="select">
            <option value="">None / General Inquiry</option>
            ${myApps.map(a => `<option value="${a.applicationNo}">Application: ${escHtml(a.applicationNo)} (${escHtml(a.category)})</option>`).join('')}
            ${myInstruments.map(i => `<option value="${i.instrumentNo}">Instrument: ${escHtml(i.instrumentNo)} (${escHtml(i.category)})</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="gr-urgency" style="font-weight:700">Urgency Level</label>
          <select id="gr-urgency" class="select">
            <option value="NORMAL">Normal (Standard 30-Day Window)</option>
            <option value="HIGH">High (Certificate Expiration Imminent)</option>
            <option value="URGENT">Urgent (Commercial Trade Interruption)</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label for="gr-sub" style="font-weight:700">Subject / Summary *</label>
        <input class="input" id="gr-sub" required maxlength="180" placeholder="e.g. Delay in field inspection for Fuel Dispenser verification (App: NRK/APP/MUM/2024/000003)" />
      </div>

      <div class="field">
        <label for="gr-body" style="font-weight:700">Detailed Statement &amp; Facts *</label>
        <textarea class="textarea" id="gr-body" required minlength="15" maxlength="2000" rows="4" placeholder="State the complete details of the issue, dates of inspection requests, premises address, and any specific assistance required from the Senior Metrology Officer…"></textarea>
        <span class="hint">Please provide specific instrument IDs or application numbers for accelerated resolution.</span>
      </div>

      <div style="background:var(--hp-surface);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;font-size:0.8125rem;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span><strong>Applicant Contact:</strong> ${escHtml(currentUser.fullName)} (${escHtml(currentUser.mobileMasked || currentUser.username)})</span>
        <span style="color:var(--hp-green);font-weight:700;margin-left:auto">✓ Statutory Audit Trail Protected</span>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:1rem">
        <button type="button" class="btn btn-secondary" onclick="hideGrievanceForm()">Cancel</button>
        <button type="submit" class="hp-btn hp-btn--primary">Submit to Senior Officer</button>
      </div>
    </form>
  `);
}

window.showGrievanceForm = function() {
  const wrap = document.getElementById('grievance-form-wrap');
  if (wrap) {
    wrap.style.display = '';
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const input = document.getElementById('gr-sub');
    if (input) input.focus();
  }
};

window.hideGrievanceForm = function() {
  const wrap = document.getElementById('grievance-form-wrap');
  if (wrap) wrap.style.display = 'none';
};

window.submitGrievance = function(e) {
  e.preventDefault();
  const sub = document.getElementById('gr-sub').value.trim();
  const body = document.getElementById('gr-body').value.trim();
  const type = document.getElementById('gr-type')?.value || 'GRIEVANCE';
  const category = document.getElementById('gr-cat')?.value || 'General';
  const appNo = document.getElementById('gr-app')?.value || null;
  const urgency = document.getElementById('gr-urgency')?.value || 'NORMAL';

  if (!sub || !body) {
    toastMsg('Please complete all required fields.', 'warn');
    return;
  }

  const ref = 'GR-' + new Date().getFullYear() + '-MUM-' + String(GRIEVANCES.length + 101).padStart(5, '0');
  const replyBy = new Date();
  replyBy.setDate(replyBy.getDate() + 30);

  const newGrievance = {
    id: 'gr' + Date.now(),
    ref,
    ownerId: currentUser.id,
    type,
    category,
    urgency,
    subject: sub,
    body,
    status: 'ACTIVE',
    reply: null,
    applicationNo: appNo,
    createdAt: new Date().toISOString(),
    replyBy: replyBy.toISOString(),
    overdue: false
  };

  GRIEVANCES.unshift(newGrievance);
  AUDIT_LOG.unshift({
    id: 'aud' + Date.now(),
    at: new Date().toISOString(),
    actor: currentUser.fullName,
    action: `GRIEVANCE_SUBMITTED`,
    detail: `Filed ${ref}: "${sub}" (${type})`
  });

  toastMsg(type === 'QUERY' ? `Inquiry submitted! Tracking Ref: ${ref}` : `Grievance submitted! Tracking Ref: ${ref}`, 'ok');
  navigate('owner-grievances');
};

/* ─── SETTINGS ─────────────────────────────────────────────── */
function renderSettings(main) {
  main.innerHTML = `
    <div style="max-width:38rem;margin:0 auto">
      ${pageTitle('Settings')}
      ${card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">Your details</h2>
        <dl class="cert-dl">
          <div><dt>Name</dt><dd>${escHtml(currentUser.fullName)}</dd></div>
          <div><dt>Role</dt><dd>${escHtml(currentUser.role)}</dd></div>
          <div><dt>Mobile</dt><dd>${escHtml(currentUser.mobileMasked)}</dd></div>
          <div><dt>Email</dt><dd>${escHtml(currentUser.emailMasked)}</dd></div>
        </dl>
      `)}
      ${card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">Change password</h2>
        <form class="space-y-3" onsubmit="doChangePw(event)">
          <div class="field"><label>Current password</label><input class="input" type="password" id="pw-cur" required /></div>
          <div class="field"><label>New password (min 10 chars)</label><input class="input" type="password" id="pw-new" required minlength="10" /><p class="hint">Other devices are signed out when you change it.</p></div>
          <div id="pw-msg"></div>
          <button class="btn btn-primary" type="submit">Save</button>
        </form>
      `)}
      ${card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">Where you are signed in</h2>
        <ul class="space-y-3">
          ${SESSIONS.map(s => `
            <li class="flex-between">
              <div>
                <p class="text-sm">${escHtml(s.ua)} ${s.current ? badge('This device', 'ok') : ''}</p>
                <p class="text-xs text-muted">Started ${fmtDate(new Date(s.createdAt).toISOString())}</p>
              </div>
              ${!s.current ? `<button class="btn btn-ghost btn-sm" onclick="toastMsg('Session revoked.','ok')">Sign out</button>` : ''}
            </li>
          `).join('')}
        </ul>
      `)}
      ${currentUser.role === 'OWNER' ? card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">My data (privacy rights)</h2>
        <p class="text-sm text-muted" style="margin-bottom:.75rem">Ask what we hold, correct it, or request erasure. An administrator replies within 30 days.</p>
        <div class="flex-gap">
          <button class="btn btn-secondary btn-sm" onclick="toastMsg('Data access request submitted. We will prepare your file.','ok')">Get a copy of my data</button>
          <button class="btn btn-secondary btn-sm" onclick="toastMsg('Correction request submitted.','ok')">Correct my details</button>
          <button class="btn btn-danger btn-sm" onclick="toastMsg('Erasure request submitted.','ok')">Erase my data</button>
        </div>
      `) : ''}
    </div>
  `;
}

window.doChangePw = function(e) {
  e.preventDefault();
  const cur = document.getElementById('pw-cur').value;
  const newPw = document.getElementById('pw-new').value;
  const msg = document.getElementById('pw-msg');
  if (cur !== currentUser.password) { msg.innerHTML = alert('Current password is incorrect.'); return; }
  currentUser.password = newPw;
  const saved = CREDENTIALS.find(c => c.id === currentUser.id);
  if (saved) saved.password = newPw;
  msg.innerHTML = alert('Password changed. Other devices will be signed out.', 'ok');
};

/* ─── SENIOR OFFICER EXECUTIVE COMMAND DESK ─────────────────── */
function renderSeniorOfficerDashboard(main) {
  const openApps = APPLICATIONS.filter(a => ['SUBMITTED','INSPECTED'].includes(a.status));
  const awaitingDecision = APPLICATIONS.filter(a => a.status === 'INSPECTED');
  const decided = DECISIONS.filter(d => new Date(d.at) > new Date(Date.now() - 30*86400000));
  const activeGrievances = GRIEVANCES.filter(g => g.status === 'ACTIVE');
  const activeTamper = TAMPER_REPORTS.filter(t => t.status === 'ACTIVE');
  const totalValidCerts = CERTIFICATES.filter(c => c.status === 'VALID').length;

  main.innerHTML = `
    ${subpageBanner(
      `Senior Metrology Officer Executive Command · ${currentUser.fullName}`,
      'Legal Metrology Department • Division Head & Verification Authority • Mumbai Division',
      ['Executive Console', 'Overview']
    )}

    <!-- Executive KPI Bar -->
    <div class="dash-stat-grid">
      <div class="dash-stat-card dash-stat-card--navy">
        <div class="dash-stat-card_top">
          <span class="dash-stat-card_label">Verification Queue</span>
          <span style="font-size:1.3rem">📥</span>
        </div>
        <p class="dash-stat-num">${openApps.length}</p>
        <span class="dash-stat-card_hint">
          <a href="#senior-officer-queue" onclick="navigate('senior-officer-queue');return false;">
            ${awaitingDecision.length} awaiting decision →
          </a>
        </span>
      </div>

      <div class="dash-stat-card dash-stat-card--lime">
        <div class="dash-stat-card_top">
          <span class="dash-stat-card_label">Ready for Decision</span>
          <span style="font-size:1.3rem">🔍</span>
        </div>
        <p class="dash-stat-num" style="color:var(--hp-green-dark)">${awaitingDecision.length}</p>
        <span class="dash-stat-card_hint">
          <a href="#senior-officer-cases" onclick="navigate('senior-officer-cases');return false;">
            Review calibration trials →
          </a>
        </span>
      </div>

      <div class="dash-stat-card dash-stat-card--green">
        <div class="dash-stat-card_top">
          <span class="dash-stat-card_label">Active Certificates</span>
          <span style="font-size:1.3rem">🛡️</span>
        </div>
        <p class="dash-stat-num" style="color:var(--hp-green)">${totalValidCerts}</p>
        <span class="dash-stat-card_hint">
          <a href="#senior-officer-certificates" onclick="navigate('senior-officer-certificates');return false;">
            ${decided.length} issued in last 30 days →
          </a>
        </span>
      </div>

      <div class="dash-stat-card dash-stat-card--orange">
        <div class="dash-stat-card_top">
          <span class="dash-stat-card_label">Alerts &amp; Grievances</span>
          <span style="font-size:1.3rem">⚠️</span>
        </div>
        <p class="dash-stat-num" style="color:var(--hp-orange)">${activeGrievances.length + activeTamper.length}</p>
        <span class="dash-stat-card_hint">
          <a href="#senior-officer-queue" onclick="navigate('senior-officer-queue');return false;">
            ${activeTamper.length} tamper · ${activeGrievances.length} grievances →
          </a>
        </span>
      </div>
    </div>

    <!-- Quick Action Ribbon -->
    <div style="display:flex;gap:12px;margin:1.25rem 0 2rem;flex-wrap:wrap">
      <button class="hp-btn hp-btn--primary" onclick="navigate('senior-officer-queue')" type="button">
        📥 Statutory Verification Queue (${openApps.length})
      </button>
      <button class="btn btn-secondary" onclick="navigate('senior-officer-cases')" type="button">
        ⚖️ Review Calibration Trials &amp; MPE
      </button>
      <button class="btn btn-secondary" onclick="navigate('senior-officer-certificates')" type="button">
        📜 Central Certificate Registry
      </button>
      <button class="btn btn-secondary" onclick="navigate('senior-officer-schedule')" type="button">
        📅 District Inspector Deployments
      </button>
      <button class="btn btn-secondary" onclick="navigate('senior-officer-decisions')" type="button">
        📋 Statutory Decision Logs
      </button>
    </div>

    <!-- Ready for Decision Priority Section -->
    <section style="margin-bottom:2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.875rem">
        <div>
          <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin:0">
            ⚡ Applications Ready for Statutory Sign-off (${awaitingDecision.length})
          </h2>
          <p class="text-xs text-muted" style="margin:2px 0 0">
            Physical field trials completed by District Inspector. Awaiting Senior Officer Form VII certificate issuance.
          </p>
        </div>
        <a href="#senior-officer-cases" onclick="navigate('senior-officer-cases');return false;" class="hp-link text-xs">
          View all cases →
        </a>
      </div>

      ${awaitingDecision.length === 0 ? emptyState(
        'All inspection cases have been decided!',
        'No applications currently require executive sign-off. Check the live queue for newly submitted applications.'
      ) : card(`
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Application No.</th>
                <th>Category</th>
                <th>Commercial Entity</th>
                <th>Inspector</th>
                <th>Field Verdict</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${awaitingDecision.map(a => {
                const visit = VISITS.find(v => v.applicationId === a.id);
                return `<tr>
                  <td class="font-mono text-sm" style="font-weight:700">${escHtml(a.applicationNo)}</td>
                  <td class="text-sm">${escHtml(a.category)}</td>
                  <td style="font-weight:600">${escHtml(a.firmName)}</td>
                  <td class="text-sm text-muted">${escHtml(a.assignedInspector || visit?.inspector || 'Pooja Mehta')}</td>
                  <td>${visit ? statusBadge(visit.overall) : badge('PENDING','warn')}</td>
                  <td>${statusBadge(a.status)}</td>
                  <td>
                    <button class="hp-btn hp-btn--primary" onclick="navigate('senior-officer-cases/${a.id}')" style="padding:4px 12px;font-size:0.75rem">
                      Review &amp; Sign Certificate →
                    </button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `)}
    </section>

    <!-- Analytics Trend -->
    <section style="margin-bottom:2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
        <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin:0">
          Regulatory Verification Velocity — Last 8 Weeks
        </h2>
        <span class="badge badge-info" style="font-size:0.75rem">Division Analytics</span>
      </div>
      ${card(renderTrendChart(TREND_WEEKS))}
    </section>

    <!-- Recent Surveillance & Grievances -->
    <div class="grid-2">
      <section>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
          <h2 style="font-size:1.05rem;font-weight:800;color:var(--hp-navy);margin:0">
            ⚠️ Active Tamper Reports (${activeTamper.length})
          </h2>
          <a href="#senior-officer-queue" onclick="navigate('senior-officer-queue');return false;" class="hp-link text-xs">Manage →</a>
        </div>
        ${activeTamper.length === 0 ? emptyState('No active tamper alerts.') : card(`
          <div class="space-y-3">
            ${activeTamper.slice(0, 3).map(t => `
              <div style="border-bottom:1px solid var(--line);padding-bottom:8px">
                <div class="flex-between">
                  <strong class="font-mono text-xs">${escHtml(t.ref)}</strong>
                  <span class="badge badge-danger">Active</span>
                </div>
                <p class="text-xs" style="margin:4px 0">${escHtml(t.description)}</p>
                <div class="flex-between text-xs text-muted">
                  <span>${escHtml(t.certNo || 'Direct incident')}</span>
                  <span>${fmtDate(t.createdAt)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `)}
      </section>

      <section>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
          <h2 style="font-size:1.05rem;font-weight:800;color:var(--hp-navy);margin:0">
            📋 Urgent Grievances (${activeGrievances.length})
          </h2>
          <a href="#senior-officer-queue" onclick="navigate('senior-officer-queue');return false;" class="hp-link text-xs">Redress →</a>
        </div>
        ${activeGrievances.length === 0 ? emptyState('No open grievances.') : card(`
          <div class="space-y-3">
            ${activeGrievances.slice(0, 3).map(g => `
              <div style="border-bottom:1px solid var(--line);padding-bottom:8px">
                <div class="flex-between">
                  <strong class="text-xs">${escHtml(g.subject)}</strong>
                  <span class="badge badge-warn">${escHtml(g.status)}</span>
                </div>
                <p class="text-xs text-muted" style="margin:4px 0">${escHtml(g.body.slice(0, 80))}…</p>
                <div class="flex-between text-xs text-muted">
                  <span class="font-mono">${escHtml(g.ref)}</span>
                  <span>Due: ${fmtDate(g.replyBy)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `)}
      </section>
    </div>
  `;
}

function renderTrendChart(rows) {
  const max = Math.max(1, ...rows.flatMap(r => [r.applications, r.certificates]));
  return `
    <h3 style="font-weight:600;margin-bottom:.25rem">Last 8 Weeks Verification Volume</h3>
    <p class="text-xs text-muted" style="margin-bottom:1rem">Applications received (filled) vs Official Form VII certificates issued (outline).</p>
    <div class="trend-chart" aria-hidden="true">
      ${rows.map(r => `
        <div class="trend-bar-group">
          <div class="trend-bars">
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;">
              <span class="trend-bar-num">${r.applications}</span>
              <div class="trend-bar-a" style="height:${Math.max(4,(r.applications/max)*112)}px"></div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;">
              <span class="trend-bar-num">${r.certificates}</span>
              <div class="trend-bar-b" style="height:${Math.max(4,(r.certificates/max)*112)}px"></div>
            </div>
          </div>
          <span>${r.week.slice(5)}</span>
        </div>
      `).join('')}
    </div>
    <p class="text-xs text-muted" style="margin-top:.75rem;display:flex;gap:1.5rem">
      <span><span style="display:inline-block;width:.75rem;height:.75rem;border-radius:2px;background:var(--primary);vertical-align:middle;margin-right:.35rem"></span>Applications Received</span>
      <span><span style="display:inline-block;width:.75rem;height:.75rem;border-radius:2px;border:2px solid var(--primary);vertical-align:middle;margin-right:.35rem"></span>Certificates Issued</span>
    </p>
  `;
}

/* ─── SENIOR OFFICER QUEUE ─────────────────────────────────── */
function renderSeniorOfficerQueue(main) {
  const openApps = APPLICATIONS.filter(a => ['SUBMITTED','INSPECTED'].includes(a.status));
  const openTransfers = CHANGE_REQUESTS.filter(r => r.status === 'OPEN');
  const activeGrievances = GRIEVANCES.filter(g => g.status === 'ACTIVE');
  const activeTamper = TAMPER_REPORTS.filter(t => t.status === 'ACTIVE');

  main.innerHTML = `
    ${subpageBanner(
      'Senior Officer Verification & Enforcement Queue',
      'Statutory applications, ownership transfers, consumer grievances & tamper surveillance',
      ['Executive Console', 'Queue']
    )}

    <div class="tabs" id="queue-tabs" style="margin-bottom:1.5rem">
      <button class="tab-btn active" onclick="switchQueueTab(this,'tab-applications')">
        Stamping Applications (${openApps.length})
      </button>
      <button class="tab-btn" onclick="switchQueueTab(this,'tab-transfers')">
        Transfers / Changes (${openTransfers.length})
      </button>
      <button class="tab-btn" onclick="switchQueueTab(this,'tab-grievances')">
        Grievances Redressal (${activeGrievances.length})
      </button>
      <button class="tab-btn" onclick="switchQueueTab(this,'tab-tamper')">
        Tamper Surveillance (${activeTamper.length})
      </button>
    </div>

    <div id="tab-applications" class="tab-panel">
      ${renderApplicationQueue()}
    </div>
    <div id="tab-transfers" class="tab-panel" style="display:none">
      ${renderTransferQueue()}
    </div>
    <div id="tab-grievances" class="tab-panel" style="display:none">
      ${renderGrievanceQueue()}
    </div>
    <div id="tab-tamper" class="tab-panel" style="display:none">
      ${renderTamperQueue()}
    </div>
  `;
}

function switchQueueTab(btn, tabId) {
  document.querySelectorAll('#queue-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  btn.classList.add('active');
  const el = document.getElementById(tabId);
  if (el) el.style.display = '';
}
window.switchQueueTab = switchQueueTab;
window.switchTab = switchQueueTab;

function renderApplicationQueue() {
  const items = APPLICATIONS.filter(a => ['SUBMITTED','INSPECTED'].includes(a.status));
  if (!items.length) return emptyState('All applications have been processed!', 'No pending verification files in the queue.');
  return `
    <div class="space-y-3">
      ${items.map(a => {
        const isReady = a.status === 'INSPECTED';
        const visit = VISITS.find(v => v.applicationId === a.id);
        return card(`
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                <span class="font-mono" style="font-weight:700;font-size:1rem;color:var(--hp-navy)">${escHtml(a.applicationNo)}</span>
                ${statusBadge(a.status)}
                ${isReady ? `<span class="badge badge-ok">✓ Ready for Decision</span>` : `<span class="badge badge-info">Field Visit In Progress</span>`}
              </div>
              <h3 style="font-size:1.05rem;font-weight:700;color:var(--ink);margin:0 0 4px">${escHtml(a.firmName)}</h3>
              <p class="text-xs text-muted" style="margin:0">
                Category: <strong>${escHtml(a.category)}</strong> · Instrument: <span class="font-mono">${escHtml(a.instrumentNo)}</span> · Jurisdiction: ${escHtml(a.area)}
              </p>
              <p class="text-xs text-muted" style="margin:3px 0 0">
                Assigned Inspector: <strong>${escHtml(a.assignedInspector || visit?.inspector || 'Pooja Mehta')}</strong> · Submitted: ${fmtDate(a.submittedAt)}
              </p>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
              <time class="text-xs text-muted font-mono">${fmtDateTime(a.submittedAt)}</time>
              <button class="${isReady ? 'hp-btn hp-btn--primary' : 'btn btn-secondary'} btn-sm" onclick="navigate('senior-officer-cases/${a.id}')">
                ${isReady ? 'Review Trials &amp; Decide →' : 'Review Case File →'}
              </button>
            </div>
          </div>
        `);
      }).join('')}
    </div>
  `;
}

function renderTransferQueue() {
  const open = CHANGE_REQUESTS.filter(r => r.status === 'OPEN');
  if (!open.length) return emptyState('No transfer or change requests waiting.');
  return `<div class="space-y-3">${open.map(r => card(`
    <div class="flex-between">
      <div><h2 style="font-weight:600">${r.kind.replace(/_/g,' ')} ${statusBadge('OPEN')}</h2>
      <p class="text-sm text-muted">Instrument: ${r.instrumentId}</p></div>
      <time class="text-xs text-muted">${fmtDate(r.createdAt)}</time>
    </div>
    <div class="flex-gap" style="margin-top:10px">
      <button class="hp-btn hp-btn--primary btn-sm" onclick="officerDecideRequest('${r.id}','APPROVED')">Approve Transfer</button>
      <button class="btn btn-danger btn-sm" onclick="officerDecideRequest('${r.id}','REJECTED')">Reject Transfer</button>
    </div>
  `)).join('')}</div>`;
}

window.officerDecideRequest = function(id, outcome) {
  const r = CHANGE_REQUESTS.find(x => x.id === id);
  if (r) r.status = outcome === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  toastMsg(outcome === 'APPROVED' ? 'Request approved.' : 'Request rejected.', 'ok');
  navigate('senior-officer-queue');
};

function renderGrievanceQueue() {
  const active = GRIEVANCES.filter(g => g.status === 'ACTIVE');
  if (!active.length) return emptyState('All grievances resolved!', 'No active complaints pending officer response.');
  return `
    <div class="space-y-4">
      ${active.map(g => card(`
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:8px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span class="badge font-mono" style="font-weight:700">${escHtml(g.ref)}</span>
              ${g.type ? `<span class="badge ${g.type === 'QUERY' ? 'badge-info' : 'badge-warn'}">${escHtml(g.type)}</span>` : ''}
              ${g.category ? `<span class="badge badge-muted">${escHtml(g.category)}</span>` : ''}
              ${g.overdue ? badge('Overdue','danger') : ''}
            </div>
            <h3 style="font-size:1.05rem;font-weight:700;color:var(--hp-navy);margin:0 0 4px">${escHtml(g.subject)}</h3>
            <p class="text-xs text-muted" style="margin:0">
              Submitted: ${fmtDate(g.createdAt)} · Mandated Reply Deadline: <strong>${fmtDate(g.replyBy)}</strong>
              ${g.applicationNo ? ` · Application: <span class="font-mono">${escHtml(g.applicationNo)}</span>` : ''}
            </p>
          </div>
          <div>${statusBadge(g.status)}</div>
        </div>

        <div style="background:var(--hp-surface);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;font-size:0.875rem;line-height:1.5;margin:8px 0">
          ${escHtml(g.body)}
        </div>

        <div class="field" style="margin-top:10px">
          <label style="font-weight:700">Official Senior Metrology Officer Reply (Visible to Complainant) *</label>
          <textarea class="textarea" id="gr-reply-${g.id}" rows="2" placeholder="State official finding, re-scheduled inspection date, or statutory resolution…"></textarea>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
          <button class="btn btn-secondary btn-sm" onclick="replyGrievance('${g.id}','IN_PROGRESS')">
            Reply &amp; Keep Open
          </button>
          <button class="hp-btn hp-btn--primary btn-sm" onclick="replyGrievance('${g.id}','CLOSED')">
            ✓ Reply &amp; Close Grievance
          </button>
        </div>
      `)).join('')}
    </div>
  `;
}

window.replyGrievance = function(id, status) {
  const g = GRIEVANCES.find(x => x.id === id);
  const reply = document.getElementById('gr-reply-'+id)?.value || '';
  if (!reply.trim()) { toastMsg('Please write a reply first.', 'warn'); return; }
  if (g) { g.status = status; g.reply = reply; }
  toastMsg(status==='CLOSED' ? 'Grievance closed with statutory response.' : 'Reply recorded. Grievance remains open.', 'ok');
  navigate('senior-officer-queue');
};

function renderTamperQueue() {
  const active = TAMPER_REPORTS.filter(t => t.status === 'ACTIVE');
  if (!active.length) return emptyState('No tamper reports waiting.');
  return `<div class="space-y-3">${active.map(r => card(`
    <div class="flex-between">
      <h2 style="font-weight:600">${escHtml(r.ref)} ${r.certNo ? badge(r.certNo,'muted') : ''}</h2>
      <time class="text-xs text-muted">${fmtDate(r.createdAt)}</time>
    </div>
    <p class="text-sm">${escHtml(r.description)}</p>
    <p class="text-sm text-muted">Reporter contact: ${escHtml(r.contact||'not given')}</p>
    <div class="field"><label style="font-weight:700">Senior Officer Investigation Notes *</label><textarea class="textarea" id="tr-note-${r.id}" rows="2" placeholder="Enforcement action, seizure notice, or closure notes…"></textarea></div>
    <div class="flex-gap" style="margin-top:10px">
      <button class="btn btn-secondary btn-sm" onclick="resolveTamper('${r.id}','IN_PROGRESS')">Save &amp; Keep Under Investigation</button>
      <button class="hp-btn hp-btn--primary btn-sm" onclick="resolveTamper('${r.id}','CLOSED')">Resolve &amp; Close Case</button>
    </div>
  `)).join('')}</div>`;
}

window.resolveTamper = function(id, status) {
  const r = TAMPER_REPORTS.find(x => x.id === id);
  const note = document.getElementById('tr-note-'+id)?.value || '';
  if (!note.trim()) { toastMsg('Please add resolution notes.', 'warn'); return; }
  if (r) { r.status = status; r.note = note; }
  toastMsg(status==='CLOSED' ? 'Tamper case closed.' : 'Investigation notes saved.', 'ok');
  navigate('senior-officer-queue');
};

/* ─── SENIOR OFFICER CASES ─────────────────────────────────── */
function renderSeniorOfficerCases(main) {
  const all = APPLICATIONS;
  main.innerHTML = `
    ${subpageBanner(
      'Statutory Inspection Cases & Field Trials',
      'Review calibration trial results, MPE tolerance thresholds & issue verification certificates',
      ['Executive Console', 'Cases']
    )}

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:10px">
      <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin:0">
        All Metrology Verification Cases (${all.length})
      </h2>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" onclick="navigate('senior-officer-queue')">Open Live Queue</button>
      </div>
    </div>

    ${card(`
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Application No.</th>
              <th>Category</th>
              <th>Commercial Entity</th>
              <th>Jurisdiction</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${all.map(a => `<tr>
              <td class="font-mono text-sm" style="font-weight:700">${escHtml(a.applicationNo)}</td>
              <td>${escHtml(a.category)}</td>
              <td style="font-weight:600">${escHtml(a.firmName)}</td>
              <td class="text-sm text-muted">${escHtml(a.area)}</td>
              <td>${statusBadge(a.status)}</td>
              <td class="text-sm text-muted">${fmtDate(a.submittedAt)}</td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="navigate('senior-officer-cases/${a.id}')">
                  Open Case File →
                </button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `)}
  `;
}

function renderSeniorOfficerCaseDetail(main, id) {
  const app = APPLICATIONS.find(a => a.id === id);
  if (!app) { main.innerHTML = alert('Case not found.'); return; }
  const visit = VISITS.find(v => v.applicationId === id);
  const decisions = DECISIONS.filter(d => d.applicationId === id);
  const deciding = ['INSPECTED','REFERRED'].includes(app.status);

  main.innerHTML = `
    <div style="margin-bottom:14px">
      <a href="#senior-officer-cases" onclick="navigate('senior-officer-cases');return false;" class="hp-link text-xs">
        ← Return to All Inspection Cases
      </a>
    </div>

    <div class="page-title-row" style="margin-top:0">
      <h1 class="page-title font-mono" style="font-size:1.3rem">${escHtml(app.applicationNo)}</h1>
      ${statusBadge(app.status)}
    </div>

    <div class="grid-2">
      ${card(`
        <h2 style="font-weight:700;font-size:1.05rem;color:var(--hp-navy);margin-bottom:.75rem">Commercial Applicant &amp; Instrument</h2>
        <dl class="cert-dl">
          <div><dt>Instrument ID</dt><dd class="font-mono text-sm" style="font-weight:700">${escHtml(app.instrumentNo)}</dd></div>
          <div><dt>Category</dt><dd><strong>${escHtml(app.category)}</strong></dd></div>
          <div><dt>Commercial Entity</dt><dd style="font-weight:600">${escHtml(app.firmName)}</dd></div>
          <div><dt>Jurisdiction Area</dt><dd>${escHtml(app.area)}</dd></div>
          <div><dt>Application Filed</dt><dd>${fmtDate(app.submittedAt)}</dd></div>
          <div><dt>Assigned Inspector</dt><dd>${escHtml(app.assignedInspector||visit?.inspector||'—')}</dd></div>
        </dl>
      `)}

      ${card(`
        <h2 style="font-weight:700;font-size:1.05rem;color:var(--hp-navy);margin-bottom:.75rem">Field Inspection Assignment</h2>
        ${app.scheduledAt ? `
          <div style="background:var(--hp-surface);border:1px solid var(--line);border-radius:var(--radius-sm);padding:12px;margin-bottom:10px">
            <p class="text-sm" style="margin:0 0 4px">Scheduled Inspection Window:</p>
            <p class="text-base font-semibold" style="margin:0;color:var(--hp-green)">${fmtDateTime(app.scheduledAt)}</p>
            <p class="text-xs text-muted" style="margin:4px 0 0">Inspector: <strong>${escHtml(app.assignedInspector||'Pooja Mehta')}</strong></p>
          </div>
        ` : `
          <form class="space-y-3" onsubmit="scheduleInspection(event,'${id}')">
            <div class="field">
              <label style="font-weight:700">Assign District Inspector</label>
              <select class="select" id="sched-insp">
                <option value="u5">Pooja Mehta (District Inspector - Mumbai)</option>
              </select>
            </div>
            <div class="field">
              <label style="font-weight:700">Inspection Window Date</label>
              <input class="input" type="date" id="sched-date" required min="${new Date().toISOString().slice(0,10)}" value="${new Date(Date.now()+86400000*2).toISOString().slice(0,10)}" />
            </div>
            <button class="hp-btn hp-btn--primary btn-sm" type="submit">Assign &amp; Schedule Inspection</button>
          </form>
        `}
      `)}
    </div>

    <!-- Metrology Calibration Trial Records -->
    <div style="margin-top:1.5rem">
      ${visit ? card(`
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.5rem;margin-bottom:.75rem">
          <div>
            <h2 style="font-weight:800;font-size:1.15rem;color:var(--hp-navy);margin:0 0 2px">
              ⚖️ Field Inspection Calibration Trials
            </h2>
            <p class="text-xs text-muted" style="margin:0">
              Conducted by <strong>${escHtml(visit.inspector)}</strong> on ${fmtDate(visit.submittedAt)} · Recommendation: <strong>${visit.recommendation}</strong>
            </p>
          </div>
          ${statusBadge(visit.overall)}
        </div>

        <div style="display:flex;gap:12px;flex-wrap:wrap;margin:10px 0 14px">
          ${visit.arrival ? `
            <span class="badge ${visit.arrival.geofenceOk ? 'badge-ok' : 'badge-warn'}">
              ${visit.arrival.geofenceOk ? '📍 GPS Verified: Inside Geofence' : '⚠️ Warning: Outside Geofence'}
              ${visit.arrival.distanceM != null ? ` (${Math.round(visit.arrival.distanceM)} m from premises)` : ''}
            </span>
          ` : ''}
          <span class="badge badge-muted">
            Security Sticker: <span class="font-mono">${escHtml(visit.stickerSerial || 'LM-SEAL-2026')}</span>
          </span>
        </div>

        <!-- Calibration Trials Table -->
        <div class="table-wrap" style="margin-bottom:1rem">
          <table>
            <thead>
              <tr>
                <th>Trial #</th>
                <th>Standard Reference</th>
                <th>Observed Reading</th>
                <th>Calculated Error</th>
                <th>Error %</th>
                <th>Tolerance (±MPE)</th>
                <th>Statutory Verdict</th>
              </tr>
            </thead>
            <tbody>
              ${visit.trials.map(t => `<tr>
                <td class="font-mono">${t.trialNo}</td>
                <td><strong>${t.reference} ${t.unit}</strong></td>
                <td class="font-mono">${t.observed} ${t.unit}</td>
                <td class="font-mono" style="color:${Math.abs(t.errorValue) > t.mpeValue ? 'var(--danger)' : 'var(--hp-green)'}">
                  ${t.errorValue > 0 ? '+' : ''}${t.errorValue} ${t.errorUnit}
                </td>
                <td class="text-xs text-muted">${t.errorPct}%</td>
                <td class="font-mono text-xs">±${t.mpeValue} ${t.errorUnit}</td>
                <td>${statusBadge(t.verdict)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <details class="space-y-2" style="border:1px solid var(--line);border-radius:var(--radius-md);padding:.75rem;margin-bottom:12px">
          <summary style="cursor:pointer;font-weight:700;color:var(--hp-navy)">
            Physical Inspection Checklist (${visit.checklist.filter(c=>c.failed).length} failed of ${visit.checklist.length})
          </summary>
          <ul style="margin-top:.5rem">
            ${visit.checklist.map(c => `
              <li class="checklist-item" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line)">
                <span>${escHtml(c.textEn)}${c.critical?` <span style="color:var(--danger);font-size:.75rem;font-weight:700">CRITICAL</span>`:''}</span>
                ${badge(c.answer==='YES'?'Yes':c.answer==='NO'?'No':'N/A', c.failed?'danger':c.answer==='NA'?'muted':'ok')}
              </li>
            `).join('')}
          </ul>
        </details>

        <div>
          <h3 class="text-xs font-bold text-muted" style="text-transform:uppercase;letter-spacing:0.5px;margin-bottom:.35rem">Photographic &amp; Tamper Seal Evidence</h3>
          <div class="flex-gap">
            ${visit.evidence.map(ev => `
              <button class="btn btn-secondary btn-sm" onclick="toastMsg('Opening sealed photographic record (logged to audit trail)','ok')">
                📷 ${ev.kind.replace(/_/g,' ')} ${ev.geoTagged?'📍':''}
              </button>
            `).join('')}
          </div>
        </div>

        ${visit.note ? `
          <div style="background:var(--hp-surface);border-left:3.5px solid var(--hp-navy);padding:8px 12px;margin-top:12px;font-size:0.85rem">
            <strong>Inspector Field Notes:</strong> "${escHtml(visit.note)}"
          </div>
        ` : ''}
      `) : card(`<p class="text-muted text-sm">Physical inspection visit has not been completed yet.</p>`)}
    </div>

    <!-- Statutory Decision Panel -->
    ${deciding ? card(`
      <div style="border-top:3.5px solid var(--hp-green);padding-top:4px">
        <h2 style="font-weight:800;font-size:1.15rem;color:var(--hp-navy);margin-bottom:.5rem">
          ⚖️ Senior Officer Statutory Verification Decision
        </h2>
        <p class="text-xs text-muted" style="margin-bottom:14px">
          Pursuant to Section 24 of the Legal Metrology Act, 2009. Authorizing certificate issuance instantly generates official Form VII certificate with authenticated QR Code.
        </p>

        ${visit?.overall === 'PASS' 
          ? alert('All physical trials & tolerances satisfy statutory limits (MPE). Verified ready for certificate generation.', 'ok')
          : alert('One or more checklist items or calibration trials indicate non-compliance. Exercise discretion before sign-off.', 'warn')
        }

        <div class="flex-gap" style="margin-top:1rem;flex-wrap:wrap">
          <button class="hp-btn hp-btn--primary" onclick="officerDecide('${id}','APPROVE')">
            ✓ Approve &amp; Issue Form VII Certificate (with QR Code)
          </button>
          <button class="btn btn-danger" onclick="officerDecide('${id}','REJECT')">
            ✕ Reject Application
          </button>
          <button class="btn btn-secondary" onclick="officerDecide('${id}','REINSPECT')">
            🔄 Order District Re-Inspection
          </button>
        </div>
      </div>
    `) : ''}

    <!-- Decision History -->
    ${decisions.length ? card(`
      <h2 style="font-weight:700;font-size:1.05rem;color:var(--hp-navy);margin-bottom:.75rem">Statutory Decision Record</h2>
      <ol class="space-y-3">
        ${decisions.map(d => `
          <li class="flex-between text-sm" style="border-bottom:1px solid var(--line);padding-bottom:8px">
            <time class="text-muted font-mono" style="min-width:10rem">${fmtDateTime(d.at)}</time>
            <span>
              <strong>${d.decision}</strong> (${statusBadge(d.status)}) by ${escHtml(d.decidedBy)}
              ${d.remarks ? `<span class="text-muted"> — "${escHtml(d.remarks)}"</span>` : ''}
            </span>
          </li>
        `).join('')}
      </ol>
    `) : ''}
  `;
}

window.scheduleInspection = function(e, appId) {
  e.preventDefault();
  const app = APPLICATIONS.find(a => a.id === appId);
  if (app) {
    app.assignedInspector = 'Pooja Mehta';
    app.scheduledAt = document.getElementById('sched-date').value + 'T10:00:00';
  }
  toastMsg('Inspector Pooja Mehta assigned and field inspection scheduled.', 'ok');
  navigate('senior-officer-cases/' + appId);
};

window.officerDecide = function(appId, decision) {
  if (decision === 'APPROVE') {
    openModal('Approve & Issue Official Certificate', `
      <form class="space-y-4" onsubmit="doSeniorOfficerApprove(event,'${appId}')">
        <div class="field">
          <label style="font-weight:700">Certificate Validity Duration (Months) *</label>
          <select class="select" id="dec-validity" required>
            <option value="12" selected>12 Months (Standard Statutory Stamping)</option>
            <option value="24">24 Months (Two-Year Verification Period)</option>
            <option value="6">6 Months (Provisional / High-Wear Commercial)</option>
          </select>
        </div>
        <div class="field">
          <label style="font-weight:700">Statutory Authority Remarks / Conditions</label>
          <textarea class="textarea" id="dec-remarks" maxlength="1000" rows="3" placeholder="Verified compliant under Section 24 of Legal Metrology Act, 2009. Official verification stamp affixed."></textarea>
        </div>
        <div style="background:var(--hp-surface);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 12px;font-size:0.8125rem">
          <strong>Digital Security Notice:</strong> An authenticated Form VII digital certificate with scannable QR Code and SHA256 checksum will be registered immediately.
        </div>
        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
          <button type="button" class="btn btn-secondary" onclick="closeModalDirect()">Cancel</button>
          <button type="submit" class="hp-btn hp-btn--primary">Issue &amp; Sign Certificate</button>
        </div>
      </form>
    `);
  } else if (decision === 'REJECT') {
    openModal('Reject Verification Application', `
      <form class="space-y-4" onsubmit="doSeniorOfficerReject(event,'${appId}')">
        <div class="field">
          <label style="font-weight:700">Statutory Rejection Grounds *</label>
          <select class="select" id="dec-reason" required>
            <option value="EXCESSIVE_ERROR">Instrument calibration exceeds Maximum Permissible Error (MPE)</option>
            <option value="CHECKLIST_FAIL">Critical physical checklist failed (Broken seal / altered weight)</option>
            <option value="DOCUMENTATION">Defective documentation or non-compliant model approval</option>
            <option value="SITE_INACCESSIBLE">Premises inaccessible during scheduled inspection</option>
          </select>
        </div>
        <div class="field">
          <label style="font-weight:700">Statutory Explanation (Provided to Applicant) *</label>
          <textarea class="textarea" id="dec-remarks" required minlength="10" maxlength="1000" rows="4" placeholder="Detail the specific measurement discrepancies or reasons for refusal of stamping…"></textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
          <button type="button" class="btn btn-secondary" onclick="closeModalDirect()">Cancel</button>
          <button type="submit" class="btn btn-danger">Confirm Rejection</button>
        </div>
      </form>
    `);
  } else {
    toastMsg('Re-inspection ordered. Returned to District Inspector queue.', 'ok');
    const app = APPLICATIONS.find(a => a.id === appId);
    if (app) app.status = 'SUBMITTED';
    navigate('senior-officer-cases/' + appId);
  }
};

window.doSeniorOfficerApprove = function(e, appId) {
  e.preventDefault();
  const app = APPLICATIONS.find(a => a.id === appId);
  const inst = INSTRUMENTS.find(i => i.id === app?.instrumentId);
  const validity = parseInt(document.getElementById('dec-validity').value) || 12;
  const remarks = document.getElementById('dec-remarks').value || 'Approved under Form VII';
  const certNo = `NRK/CERT/MUM/${new Date().getFullYear()}/${String(CERTIFICATES.length + 1).padStart(6, '0')}`;
  const verifiedOn = new Date().toISOString().slice(0, 10);
  const validTill = new Date(Date.now() + validity * 30 * 86400000).toISOString().slice(0, 10);
  const holder = app?.firmName || 'Ramesh Kumar Trading';
  const stickerSerial = 'LM-2026-MUM-' + String(CERTIFICATES.length + 500).padStart(5, '0');

  const newCert = {
    id: 'cert' + Date.now(),
    certNo,
    instrumentId: app.instrumentId,
    instrumentNo: app.instrumentNo,
    category: app.category,
    ownerId: app.ownerId,
    holder,
    status: 'VALID',
    verifiedOn,
    validTill,
    validityMonths: validity,
    issuingOffice: 'Legal Metrology Office, Mumbai',
    issuedBy: currentUser.fullName || 'Vikram Singh (Sr. Officer)',
    area: app.area,
    makeModel: inst?.makeModel || '',
    capacity: inst?.capacity || '',
    accuracyClass: inst?.accuracyClass || '',
    mpe: '±0.1%',
    stickerSerial,
    ruleVersion: 4,
    marginal: false,
    qrUrl: `https://nirikshan.gov.in/verify?cert=${encodeURIComponent(certNo)}`,
    signatureMatch: true,
    history: [{
      from: 'NEW',
      to: 'VALID',
      at: new Date().toISOString(),
      publicReason: 'Initial / Periodic Stamping Approved',
      by: currentUser.fullName,
      note: remarks
    }],
    replacedBy: null,
    replacesCertificateId: null
  };

  CERTIFICATES.unshift(newCert);
  if (app) { app.status = 'APPROVED'; app.officerDecision = 'APPROVE'; }
  if (inst) { inst.certStatus = 'VALID'; inst.validTill = validTill; inst.lastVerifiedOn = verifiedOn; }
  DECISIONS.unshift({
    id: 'd' + Date.now(),
    applicationId: appId,
    decision: 'APPROVE',
    status: 'FINAL',
    remarks,
    validityMonths: validity,
    reasonCode: null,
    decidedBy: currentUser.fullName,
    secondApprover: null,
    at: new Date().toISOString(),
    secondAt: null,
    secondRemarks: null
  });
  AUDIT_LOG.unshift({
    id: 'aud' + Date.now(),
    at: new Date().toISOString(),
    actor: currentUser.fullName,
    action: 'CERTIFICATE_ISSUED',
    detail: `Issued ${certNo} for ${app.instrumentNo} (${holder})`
  });

  closeModalDirect();
  toastMsg(`Approved! Form VII Certificate ${certNo} issued with official QR Code.`, 'ok');
  navigate('senior-officer-certificates/' + newCert.id);
};
window.doOfficerApprove = window.doSeniorOfficerApprove;

window.doSeniorOfficerReject = function(e, appId) {
  e.preventDefault();
  const app = APPLICATIONS.find(a => a.id === appId);
  if (app) { app.status = 'REJECTED'; app.officerDecision = 'REJECT'; }
  const remarks = document.getElementById('dec-remarks').value;
  const reasonCode = document.getElementById('dec-reason').value;

  DECISIONS.unshift({
    id: 'd' + Date.now(),
    applicationId: appId,
    decision: 'REJECT',
    status: 'FINAL',
    remarks,
    validityMonths: null,
    reasonCode,
    decidedBy: currentUser.fullName,
    secondApprover: null,
    at: new Date().toISOString(),
    secondAt: null,
    secondRemarks: null
  });

  closeModalDirect();
  toastMsg('Application rejected. Formal statutory refusal issued.', 'ok');
  navigate('senior-officer-cases/' + appId);
};
window.doOfficerReject = window.doSeniorOfficerReject;

/* ─── SENIOR OFFICER DECISIONS ─────────────────────────────── */
function renderSeniorOfficerDecisions(main) {
  main.innerHTML = `
    ${subpageBanner(
      'Statutory Decision Records & Verification Audit',
      'Immutable statutory registry of all approval, rejection & enforcement determinations',
      ['Executive Console', 'Decisions']
    )}

    ${DECISIONS.length === 0 ? emptyState('No decisions recorded yet.') : card(`
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Application No.</th>
              <th>Statutory Determination</th>
              <th>Validity Term</th>
              <th>Authorizing Officer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${DECISIONS.map(d => {
              const app = APPLICATIONS.find(a => a.id === d.applicationId);
              return `<tr>
                <td class="text-sm text-muted font-mono">${fmtDateTime(d.at)}</td>
                <td class="font-mono text-sm" style="font-weight:700">${escHtml(app?.applicationNo || d.applicationId)}</td>
                <td>${statusBadge(d.decision)}</td>
                <td class="text-sm font-semibold">${d.validityMonths ? d.validityMonths + ' Months' : '—'}</td>
                <td class="text-sm">${escHtml(d.decidedBy)}</td>
                <td>${badge(d.status,'muted')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `)}
  `;
}

/* ─── SENIOR OFFICER CERTIFICATES ──────────────────────────── */
function renderSeniorOfficerCertificates(main) {
  main.innerHTML = `
    ${subpageBanner(
      'Central Legal Metrology Certificate Registry',
      'Official repository of Form VII digital certificates, verification validity & QR seals',
      ['Executive Console', 'Certificates']
    )}

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:12px">
      <div class="field" style="max-width:20rem;margin:0">
        <label for="cert-filter" style="font-weight:700">Filter by Certificate Status</label>
        <select id="cert-filter" class="select" onchange="filterOfficerCerts(this.value)">
          <option value="">All Statuses (${CERTIFICATES.length})</option>
          <option value="VALID">Valid &amp; Active (${CERTIFICATES.filter(c=>c.status==='VALID').length})</option>
          <option value="EXPIRED">Expired (${CERTIFICATES.filter(c=>c.status==='EXPIRED').length})</option>
          <option value="SUSPENDED">Suspended (${CERTIFICATES.filter(c=>c.status==='SUSPENDED').length})</option>
          <option value="REVOKED">Revoked (${CERTIFICATES.filter(c=>c.status==='REVOKED').length})</option>
        </select>
      </div>
      <div style="font-size:0.8125rem;color:var(--hp-green);font-weight:700;display:flex;align-items:center;gap:6px">
        <span class="cert-qr-live-dot"></span> 100% Cryptographically Sealed
      </div>
    </div>

    <div id="cert-list">${renderCertTable(CERTIFICATES)}</div>
  `;
}

window.filterOfficerCerts = function(status) {
  const filtered = status ? CERTIFICATES.filter(c => c.status === status) : CERTIFICATES;
  document.getElementById('cert-list').innerHTML = renderCertTable(filtered);
};

function renderCertTable(list) {
  if (!list.length) return emptyState('No certificates found matching filter.');
  return card(`
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Certificate No.</th>
            <th>Commercial Holder</th>
            <th>Category &amp; Capacity</th>
            <th>Verified On</th>
            <th>Valid Till</th>
            <th>Security Seal</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${list.map(c => `<tr>
            <td class="font-mono text-sm" style="font-weight:700;color:var(--hp-green)">${escHtml(c.certNo)}</td>
            <td style="font-weight:600">${escHtml(c.holder)}</td>
            <td class="text-sm">${escHtml(c.category)} · <strong>${escHtml(c.capacity || '')}</strong></td>
            <td class="text-sm text-muted">${fmtDate(c.verifiedOn)}</td>
            <td class="text-sm font-semibold">${fmtDate(c.validTill)}</td>
            <td class="font-mono text-xs">${escHtml(c.stickerSerial || '—')}</td>
            <td>${statusBadge(c.status)}</td>
            <td>
              <button class="hp-btn hp-btn--outline" onclick="navigate('senior-officer-certificates/${c.id}')" style="padding:4px 10px;font-size:0.75rem">
                View Form VII &amp; QR →
              </button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `);
}

/* ─── SENIOR OFFICER SCHEDULE ──────────────────────────────── */
function renderSeniorOfficerSchedule(main) {
  main.innerHTML = `
    ${subpageBanner(
      'District Field Inspection Deployments',
      'Scheduled verification windows, district inspector routes & physical testing calendars',
      ['Executive Console', 'Field Schedule']
    )}

    <div class="space-y-3">
      ${SCHEDULE.length === 0 ? emptyState('No field inspections scheduled currently.') : SCHEDULE.map(s => card(`
        <div class="flex-between" style="align-items:flex-start">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span class="font-mono" style="font-weight:700;font-size:1rem;color:var(--hp-navy)">${escHtml(s.applicationNo)}</span>
              ${statusBadge(s.status)}
            </div>
            <p class="text-sm text-muted" style="margin:0">Category: <strong>${escHtml(s.category)}</strong> · Jurisdiction: ${escHtml(s.area)}</p>
            <p class="text-sm" style="margin:4px 0 0">
              Assigned Field Inspector: <strong>${escHtml(s.inspectorName)}</strong>
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold" style="margin:0;color:var(--hp-green)">${fmtDate(s.start)}</p>
            <p class="text-xs text-muted" style="margin:2px 0 6px">${s.start.split('T')[1]?.slice(0,5)||'—'} → ${s.end.split('T')[1]?.slice(0,5)||'—'}</p>
            <button class="btn btn-secondary btn-sm" onclick="navigate('senior-officer-cases/${s.applicationId}')">
              Open Case File →
            </button>
          </div>
        </div>
      `)).join('')}
    </div>
  `;
}

/* ─── SENIOR OFFICER INSPECTORS ────────────────────────────── */
function renderSeniorOfficerInspectors(main) {
  const inspectors = ADMIN_USERS.filter(u => u.role === 'INSPECTOR');
  main.innerHTML = `
    ${subpageBanner(
      'District Legal Metrology Inspectors Roster',
      'Authorized field verification officers, district jurisdictions & active deployment stats',
      ['Executive Console', 'Inspectors']
    )}

    <div class="space-y-3">
      ${inspectors.map(u => card(`
        <div class="flex-between">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <h2 style="font-weight:700;font-size:1.1rem;color:var(--hp-navy);margin:0">${escHtml(u.fullName)}</h2>
              ${statusBadge(u.status)}
              <span class="badge badge-info font-mono">${escHtml(u.mobile)}</span>
            </div>
            <p class="text-sm text-muted" style="margin:0">Jurisdiction Area: <strong>${escHtml(u.area)}</strong></p>
          </div>
          <div class="text-right text-sm">
            <span class="badge badge-ok">${SCHEDULE.filter(s=>s.inspectorId===u.id).length} Field Tasks Scheduled</span>
          </div>
        </div>
      `)).join('')}
    </div>
  `;
}

/* ─── OFFICER LEGACY ALIASES ───────────────────────────────── */
window.renderOfficerDashboard = renderSeniorOfficerDashboard;
window.renderOfficerQueue = renderSeniorOfficerQueue;
window.renderOfficerCases = renderSeniorOfficerCases;
window.renderOfficerCaseDetail = renderSeniorOfficerCaseDetail;
window.renderOfficerDecisions = renderSeniorOfficerDecisions;
window.renderOfficerCertificates = renderSeniorOfficerCertificates;
window.renderOfficerSchedule = renderSeniorOfficerSchedule;
window.renderOfficerInspectors = renderSeniorOfficerInspectors;

/* ─── ENFORCEMENT ───────────────────────────────────────────── */
function renderEnforcement(main) {
  main.innerHTML = `
    ${pageTitle('Enforcement')}
    <div class="space-y-3">
      ${ENFORCEMENT.map(e => card(`
        <div class="flex-between">
          <div>
            <h2 style="font-weight:600">${escHtml(e.ref)} ${statusBadge(e.status)}</h2>
            <p class="text-sm text-muted">${escHtml(e.location)}</p>
          </div>
          <time class="text-xs text-muted">${fmtDate(e.createdAt)}</time>
        </div>
        <p class="text-sm"><strong>Violation:</strong> ${escHtml(e.violationType)}</p>
        <p class="text-sm text-muted">${escHtml(e.note)}</p>
        ${e.status === 'OPEN' ? `<button class="btn btn-primary btn-sm" onclick="closeEnforcement('${e.id}')">Mark resolved</button>` : ''}
      `)).join('')}
    </div>
  `;
}
window.closeEnforcement = function(id) {
  const e = ENFORCEMENT.find(x => x.id === id);
  if (e) e.status = 'CLOSED';
  toastMsg('Enforcement case closed.', 'ok');
  navigate('officer-enforcement');
};

/* ─── REPORTS ───────────────────────────────────────────────── */
function renderReports(main, role) {
  const reportDefs = [
    { id: 'applications-by-status', title: 'Applications by status', description: 'Count of applications grouped by current status.' },
    { id: 'certificates-issued', title: 'Certificates issued', description: 'All certificates issued in a date range.' },
    { id: 'expired-certificates', title: 'Expired certificates', description: 'Instruments whose certificates have expired.' },
    { id: 'inspection-outcomes', title: 'Inspection outcomes', description: 'Pass/fail summary by inspector and category.' },
    { id: 'officer-workload', title: 'Officer workload', description: 'Decisions made by officer in the period.' },
  ];
  main.innerHTML = `
    ${pageTitle('Reports')}
    ${card(`
      <div class="space-y-4">
        <div class="field">
          <label for="report-sel">Report</label>
          <select id="report-sel" class="select" onchange="onReportChange()">
            <option value="">Choose a report…</option>
            ${reportDefs.map(r => `<option value="${r.id}">${escHtml(r.title)}</option>`).join('')}
          </select>
        </div>
        <div id="report-desc" class="text-sm text-muted"></div>
        <div class="grid-2" id="report-filters" style="display:none">
          <div class="field"><label>From</label><input class="input" type="date" id="r-from" value="${new Date(Date.now()-89*86400000).toISOString().slice(0,10)}" /></div>
          <div class="field"><label>To</label><input class="input" type="date" id="r-to" value="${new Date().toISOString().slice(0,10)}" /></div>
        </div>
        <div class="flex-gap">
          <button class="btn btn-primary" onclick="runReport()">Show report</button>
          <button class="btn btn-secondary" onclick="toastMsg('CSV download started.','ok')">Download CSV</button>
          <button class="btn btn-secondary" onclick="toastMsg('PDF download started.','ok')">Download PDF</button>
        </div>
      </div>
    `)}
    <div id="report-output" style="margin-top:1.25rem"></div>
  `;
}
window.onReportChange = function() {
  const sel = document.getElementById('report-sel').value;
  const descs = { 'applications-by-status':'Count of applications grouped by current status.','certificates-issued':'All certificates issued in a date range.','expired-certificates':'Instruments whose certificates have expired.','inspection-outcomes':'Pass/fail summary by inspector and category.','officer-workload':'Decisions made by officer in the period.' };
  document.getElementById('report-desc').textContent = descs[sel] || '';
  document.getElementById('report-filters').style.display = sel ? '' : 'none';
};
window.runReport = function() {
  const sel = document.getElementById('report-sel').value;
  if (!sel) { toastMsg('Choose a report first.', 'warn'); return; }
  const out = document.getElementById('report-output');
  // Simulate report data
  const previewData = {
    'applications-by-status': { cols: ['Status','Count'], rows: [['SUBMITTED',1],['INSPECTED',1],['APPROVED',1],['REJECTED',1]] },
    'certificates-issued': { cols: ['Cert No.','Holder','Category','Issued','Valid Till'], rows: CERTIFICATES.map(c => [c.certNo, c.holder, c.category, c.verifiedOn, c.validTill]) },
    'expired-certificates': { cols: ['Instrument No.','Category','Firm','Expired On'], rows: CERTIFICATES.filter(c=>c.status==='EXPIRED').map(c=>[c.instrumentNo,c.category,c.holder,c.validTill]) },
    'inspection-outcomes': { cols: ['Inspector','Category','Pass','Fail'], rows: [['Pooja Mehta','Weighbridge',2,1],['Pooja Mehta','Fuel Dispenser',1,0]] },
    'officer-workload': { cols: ['Officer','Approved','Rejected','Referred'], rows: [['Anita Sharma',2,1,0]] },
  };
  const d = previewData[sel];
  if (!d) { out.innerHTML = emptyState('No data.'); return; }
  out.innerHTML = card(`
    <h2 style="font-weight:600;margin-bottom:.75rem">Preview (first ${d.rows.length} rows)</h2>
    <div class="table-wrap">
      <table>
        <thead><tr>${d.cols.map(c=>`<th>${escHtml(c)}</th>`).join('')}</tr></thead>
        <tbody>${d.rows.map(r=>`<tr>${r.map(v=>`<td>${escHtml(String(v))}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
  `);
};

/* ─── INSPECTOR DASHBOARD ──────────────────────────────────── */
function renderInspectorDashboard(main) {
  const myScheduled = SCHEDULE.filter(s => s.inspectorId === currentUser.id);
  main.innerHTML = `
    ${subpageBanner(
      `Inspector Portal · ${currentUser.fullName}`,
      'Field Metrology Inspection Beat & On-Site Stamping Schedule',
      ['Inspector Portal', 'Route']
    )}

    <div class="dash-stat-grid">
      <div class="dash-stat-card dash-stat-card--navy">
        <div class="dash-stat-card_top">
          <span class="dash-stat-card_label">Scheduled Visits</span>
          <span style="font-size:1.25rem">📅</span>
        </div>
        <p class="dash-stat-num">${myScheduled.length}</p>
        <span class="dash-stat-card_hint">Field appointments</span>
      </div>
      <div class="dash-stat-card dash-stat-card--lime">
        <div class="dash-stat-card_top">
          <span class="dash-stat-card_label">Visits Completed</span>
          <span style="font-size:1.25rem">🏁</span>
        </div>
        <p class="dash-stat-num">${INSPECTOR_HISTORY.length}</p>
        <span class="dash-stat-card_hint">Logged on registry</span>
      </div>
      <div class="dash-stat-card dash-stat-card--green">
        <div class="dash-stat-card_top">
          <span class="dash-stat-card_label">Passed Verification</span>
          <span style="font-size:1.25rem">✓</span>
        </div>
        <p class="dash-stat-num" style="color:var(--hp-green)">${INSPECTOR_HISTORY.filter(h=>h.overall==='PASS').length}</p>
        <span class="dash-stat-card_hint">Stamping approved</span>
      </div>
      <div class="dash-stat-card dash-stat-card--orange">
        <div class="dash-stat-card_top">
          <span class="dash-stat-card_label">Failed / Non-Compliant</span>
          <span style="font-size:1.25rem">✕</span>
        </div>
        <p class="dash-stat-num" style="color:var(--hp-orange)">${INSPECTOR_HISTORY.filter(h=>h.overall==='FAIL').length}</p>
        <span class="dash-stat-card_hint">Rectification required</span>
      </div>
    </div>

    <section style="margin-top:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin:0">Upcoming Assigned Visits</h2>
        <span class="badge badge-info" style="font-size:0.75rem">Field Route</span>
      </div>
      ${myScheduled.length === 0 ? emptyState('No visits assigned.') : `<div class="space-y-3">${myScheduled.map(s => card(`
        <div class="flex-between">
          <div>
            <h2 style="font-weight:600">${escHtml(s.applicationNo)} ${statusBadge(s.status)}</h2>
            <p class="text-sm text-muted">${escHtml(s.category)} · ${escHtml(s.area)}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold">${fmtDate(s.start)}</p>
            <p class="text-xs text-muted">${s.start.split('T')[1]?.slice(0,5)||'—'}</p>
          </div>
        </div>
        <div style="margin-top:12px">
          ${s.status === 'COMPLETED'
            ? `<span class="badge badge-ok">✓ Inspection completed</span>`
            : `<button class="hp-btn hp-btn--primary" onclick="startInspectorInspection('${s.id}')" style="padding:6px 16px;font-size:0.8125rem">Conduct On-Site Inspection →</button>`
          }
        </div>
      `)).join('')}</div>`}
    </section>
  `;
}

window.startInspectorInspection = function(scheduleId) {
  const sch = SCHEDULE.find(s => s.id === scheduleId);
  if (!sch) return;
  const stickerDefault = 'LM-STICKER-' + new Date().getFullYear() + '-' + String(VISITS.length + 101).padStart(3, '0');

  openModal('Conduct Inspection – ' + sch.applicationNo, `
    <form class="space-y-4" onsubmit="submitInspectorInspection(event, '${scheduleId}')">
      <div style="background:var(--primary-soft);padding:.75rem 1rem;border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">
        <div>
          <span style="font-weight:600;font-size:.9rem">${escHtml(sch.category)} · ${escHtml(sch.area)}</span>
          <p class="text-xs text-muted">Application: ${escHtml(sch.applicationNo)}</p>
        </div>
        <div>
          ${badge('📍 Inside geofence · 18 m', 'ok')}
        </div>
      </div>

      <div>
        <h3 style="font-size:.95rem;font-weight:600;margin-bottom:.5rem">1. Verification Checklist</h3>
        <ul class="space-y-2 text-sm">
          <li style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid var(--line)">
            <span>Platform level & stable <span style="color:var(--danger);font-size:.75rem">critical</span></span>
            <select class="select" id="chk-0" style="width:auto"><option value="YES">Yes</option><option value="NO">No</option><option value="NA">N/A</option></select>
          </li>
          <li style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid var(--line)">
            <span>Load cells visually intact <span style="color:var(--danger);font-size:.75rem">critical</span></span>
            <select class="select" id="chk-1" style="width:auto"><option value="YES">Yes</option><option value="NO">No</option><option value="NA">N/A</option></select>
          </li>
          <li style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid var(--line)">
            <span>Digital display readable</span>
            <select class="select" id="chk-2" style="width:auto"><option value="YES">Yes</option><option value="NO">No</option><option value="NA">N/A</option></select>
          </li>
          <li style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid var(--line)">
            <span>Seal marks intact & unblemished <span style="color:var(--danger);font-size:.75rem">critical</span></span>
            <select class="select" id="chk-3" style="width:auto"><option value="YES">Yes</option><option value="NO">No</option><option value="NA">N/A</option></select>
          </li>
          <li style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid var(--line)">
            <span>Zero balance check <span style="color:var(--danger);font-size:.75rem">critical</span></span>
            <select class="select" id="chk-4" style="width:auto"><option value="YES">Yes</option><option value="NO">No</option><option value="NA">N/A</option></select>
          </li>
        </ul>
      </div>

      <div>
        <h3 style="font-size:.95rem;font-weight:600;margin-bottom:.5rem">2. Test Trials (Standard Load vs Observed)</h3>
        <div class="table-wrap">
          <table style="font-size:.85rem">
            <thead>
              <tr><th>Trial</th><th>Standard Reference</th><th>Observed Reading</th><th>Permitted Error</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>#1 (Min)</td>
                <td><input class="input" style="padding:.25rem .5rem" id="trial-ref-1" value="10.000 kg" required /></td>
                <td><input class="input" style="padding:.25rem .5rem" id="trial-obs-1" value="10.005 kg" required /></td>
                <td>±0.020 kg</td>
              </tr>
              <tr>
                <td>#2 (Mid)</td>
                <td><input class="input" style="padding:.25rem .5rem" id="trial-ref-2" value="30.000 kg" required /></td>
                <td><input class="input" style="padding:.25rem .5rem" id="trial-obs-2" value="30.010 kg" required /></td>
                <td>±0.060 kg</td>
              </tr>
              <tr>
                <td>#3 (Max)</td>
                <td><input class="input" style="padding:.25rem .5rem" id="trial-ref-3" value="60.000 kg" required /></td>
                <td><input class="input" style="padding:.25rem .5rem" id="trial-obs-3" value="60.015 kg" required /></td>
                <td>±0.120 kg</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid-2">
        <div class="field">
          <label for="insp-sticker">Sticker Serial No.</label>
          <input class="input" id="insp-sticker" value="${stickerDefault}" required />
        </div>
        <div class="field">
          <label for="insp-rec">Recommendation</label>
          <select class="select" id="insp-rec" required>
            <option value="APPROVE">Pass – Recommend Approval</option>
            <option value="REJECT">Fail – Recommend Rejection</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>Evidence Photos (Simulated)</label>
        <div class="flex-gap">
          <span class="badge badge-ok">📸 General view (Geo-tagged)</span>
          <span class="badge badge-ok">📸 Lead seal (Geo-tagged)</span>
          <span class="badge badge-ok">📸 Digital display</span>
        </div>
      </div>

      <div class="field">
        <label for="insp-note">Inspector Remarks / Notes</label>
        <textarea class="textarea" id="insp-note" rows="2" placeholder="Inspection conducted on site. Readings within MPE limits."></textarea>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
        <button type="button" class="btn btn-secondary" onclick="closeModalDirect()">Cancel</button>
        <button type="submit" class="btn btn-primary">Submit Inspection Report</button>
      </div>
    </form>
  `);
};

window.submitInspectorInspection = function(e, scheduleId) {
  e.preventDefault();
  const sch = SCHEDULE.find(s => s.id === scheduleId);
  if (!sch) return;
  const app = APPLICATIONS.find(a => a.id === sch.applicationId);
  const rec = document.getElementById('insp-rec').value;
  const overall = rec === 'APPROVE' ? 'PASS' : 'FAIL';
  const sticker = document.getElementById('insp-sticker').value.trim();
  const note = document.getElementById('insp-note').value.trim() || 'Inspection completed on site.';

  const checklistItems = [
    { code: 'C01', textEn: 'Platform level and stable', critical: true },
    { code: 'C02', textEn: 'Load cells visually intact', critical: true },
    { code: 'C03', textEn: 'Digital display readable', critical: false },
    { code: 'C04', textEn: 'Seal marks intact & unblemished', critical: true },
    { code: 'C05', textEn: 'Zero balance check', critical: true },
  ];
  const checklist = checklistItems.map((item, idx) => {
    const ans = document.getElementById('chk-' + idx).value;
    return { code: item.code, textEn: item.textEn, critical: item.critical, answer: ans, remark: null, failed: ans === 'NO' };
  });

  const trials = [
    { trialNo: 1, reference: document.getElementById('trial-ref-1').value.replace(/[^0-9.]/g,'') || '10.000', observed: document.getElementById('trial-obs-1').value.replace(/[^0-9.]/g,'') || '10.005', errorValue: '0.005', errorUnit: 'kg', errorPct: '0.05', mpeValue: '0.020', unit: 'kg', verdict: 'PASS' },
    { trialNo: 2, reference: document.getElementById('trial-ref-2').value.replace(/[^0-9.]/g,'') || '30.000', observed: document.getElementById('trial-obs-2').value.replace(/[^0-9.]/g,'') || '30.010', errorValue: '0.010', errorUnit: 'kg', errorPct: '0.03', mpeValue: '0.060', unit: 'kg', verdict: 'PASS' },
    { trialNo: 3, reference: document.getElementById('trial-ref-3').value.replace(/[^0-9.]/g,'') || '60.000', observed: document.getElementById('trial-obs-3').value.replace(/[^0-9.]/g,'') || '60.015', errorValue: '0.015', errorUnit: 'kg', errorPct: '0.025', mpeValue: '0.120', unit: 'kg', verdict: 'PASS' },
  ];

  const visit = {
    id: 'v' + Date.now(),
    applicationId: sch.applicationId,
    inspector: currentUser.fullName,
    status: 'SUBMITTED',
    window: { start: sch.start, end: sch.end },
    submittedAt: new Date().toISOString(),
    recommendation: rec,
    overall: overall,
    stickerSerial: sticker,
    checklist: checklist,
    trials: trials,
    evidence: [
      { id: 'ev' + Date.now() + '-1', kind: 'PHOTO_GENERAL', capturedAt: new Date().toISOString(), geoTagged: true },
      { id: 'ev' + Date.now() + '-2', kind: 'PHOTO_SEAL', capturedAt: new Date().toISOString(), geoTagged: true },
      { id: 'ev' + Date.now() + '-3', kind: 'PHOTO_DISPLAY', capturedAt: new Date().toISOString(), geoTagged: false },
    ],
    arrival: { at: new Date().toISOString(), distanceM: 18, geofenceOk: true, justification: null },
    note: note,
    hasTestSheet: true
  };

  VISITS.push(visit);
  sch.status = 'COMPLETED';
  if (app) {
    app.status = 'INSPECTED';
    app.inspectionResult = overall;
    app.assignedInspector = currentUser.fullName;
  }
  INSPECTOR_HISTORY.unshift({
    date: new Date().toISOString().slice(0, 10),
    applicationNo: sch.applicationNo,
    category: sch.category,
    area: sch.area,
    recommendation: rec,
    overall: overall
  });
  AUDIT_LOG.unshift({
    id: 'al' + Date.now(),
    at: new Date().toISOString(),
    actor: currentUser.fullName,
    actorRole: 'INSPECTOR',
    action: 'VISIT.SUBMIT',
    target: `Visit ${visit.id} → App ${sch.applicationNo}`,
    ip: '10.0.0.45'
  });

  closeModalDirect();
  toastMsg('Inspection submitted successfully! Case sent to officer queue.', 'ok');
  navigate('inspector-dashboard');
};

/* ─── INSPECTOR HISTORY ─────────────────────────────────────── */
function renderInspectorHistory(main) {
  main.innerHTML = `
    ${pageTitle('Visit history')}
    ${card(`
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Application No.</th><th>Category</th><th>Area</th><th>Result</th><th>Recommendation</th></tr></thead>
          <tbody>
            ${INSPECTOR_HISTORY.map(h => `<tr>
              <td class="text-sm text-muted">${fmtDate(h.date)}</td>
              <td class="font-mono text-sm">${escHtml(h.applicationNo)}</td>
              <td>${escHtml(h.category)}</td>
              <td class="text-sm text-muted">${escHtml(h.area)}</td>
              <td>${statusBadge(h.overall)}</td>
              <td class="text-sm">${escHtml(h.recommendation)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `)}
  `;
}

/* ─── ADMIN DASHBOARD ──────────────────────────────────────── */
function renderAdminDashboard(main) {
  main.innerHTML = `
    ${subpageBanner(
      `System Administration · ${currentUser.fullName}`,
      'Central Directorate Metrology Registry Control & Health Monitoring',
      ['Admin Portal', 'Control Panel']
    )}

    <div class="dash-stat-grid">
      <div class="dash-stat-card dash-stat-card--navy">
        <div class="dash-stat-card_top"><span class="dash-stat-card_label">Total Users</span><span>👥</span></div>
        <p class="dash-stat-num">${ADMIN_STATS.usersTotal}</p>
        <span class="dash-stat-card_hint"><a href="#admin-users" onclick="navigate('admin-users');return false;">Manage users →</a></span>
      </div>
      <div class="dash-stat-card dash-stat-card--orange">
        <div class="dash-stat-card_top"><span class="dash-stat-card_label">Pending Approvals</span><span>⏳</span></div>
        <p class="dash-stat-num" style="color:var(--hp-orange)">${ADMIN_STATS.usersPending}</p>
        <span class="dash-stat-card_hint"><a href="#admin-users" onclick="navigate('admin-users');return false;">Review registrations →</a></span>
      </div>
      <div class="dash-stat-card dash-stat-card--green">
        <div class="dash-stat-card_top"><span class="dash-stat-card_label">Valid Certificates</span><span>✓</span></div>
        <p class="dash-stat-num" style="color:var(--hp-green)">${ADMIN_STATS.certificatesValid}</p>
        <span class="dash-stat-card_hint"><a href="#admin-certificates" onclick="navigate('admin-certificates');return false;">View certificates →</a></span>
      </div>
      <div class="dash-stat-card dash-stat-card--lime">
        <div class="dash-stat-card_top"><span class="dash-stat-card_label">Open Grievances</span><span>📬</span></div>
        <p class="dash-stat-num">${ADMIN_STATS.grievancesOpen}</p>
        <span class="dash-stat-card_hint"><a href="#officer-queue" onclick="navigate('officer-queue');return false;">Grievance queue →</a></span>
      </div>
    </div>

    <!-- Quick admin action bar -->
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">
      <button class="hp-btn hp-btn--primary" onclick="openInviteModal()">+ Invite New Official</button>
      <button class="btn btn-secondary" onclick="navigate('admin-audit')">Review Audit Logs</button>
      <button class="btn btn-secondary" onclick="navigate('admin-system')">System Health &amp; Backups</button>
    </div>

    <section style="margin-top:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin:0">Trend – Last 8 Weeks</h2>
        <span class="badge badge-info" style="font-size:0.75rem">National Metrics</span>
      </div>
      ${card(renderTrendChart(TREND_WEEKS))}
    </section>

    <section style="margin-top:2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin:0">Recent Audit Events</h2>
        <a href="#admin-audit" onclick="navigate('admin-audit');return false;" class="hp-link text-xs">Full audit log →</a>
      </div>
      ${card(`
        <ul class="space-y-2">
          ${AUDIT_LOG.slice(0,5).map(a => `<li class="audit-row">
            <time class="audit-time">${fmtDateTime(a.at)}</time>
            <span class="audit-action">${escHtml(a.action)}</span>
            <span class="text-sm text-muted">${escHtml(a.actor)} (${a.actorRole})</span>
            <span class="audit-detail">${escHtml(a.target)}</span>
          </li>`).join('')}
        </ul>
      `)}
    </section>
  `;
}

/* ─── ADMIN USERS ───────────────────────────────────────────── */
function renderAdminUsers(main) {
  main.innerHTML = `
    ${pageTitle('Users', `<button class="btn btn-primary btn-sm" onclick="openInviteModal()">Invite user</button>`)}
    <div class="field" style="max-width:16rem;margin-bottom:1rem">
      <label for="user-role-filter">Filter by role</label>
      <select id="user-role-filter" class="select" onchange="filterUsers(this.value)">
        <option value="">All roles</option>
        <option value="OWNER">Owner</option>
        <option value="SENIOR_OFFICER">Senior Officer</option>
        <option value="INSPECTOR">Inspector</option>
        <option value="ADMIN">Admin</option>
      </select>
    </div>
    <div id="users-table">${renderUsersTable(ADMIN_USERS)}</div>
  `;
}
window.filterUsers = function(role) {
  const filtered = role ? ADMIN_USERS.filter(u => u.role === role) : ADMIN_USERS;
  document.getElementById('users-table').innerHTML = renderUsersTable(filtered);
};
function renderUsersTable(list) {
  return card(`<div class="table-wrap"><table>
    <thead><tr><th>Name</th><th>Mobile</th><th>Role</th><th>Area</th><th>Status</th><th>Since</th><th></th></tr></thead>
    <tbody>
      ${list.map(u => `<tr>
        <td style="font-weight:500">${escHtml(u.fullName)}</td>
        <td class="font-mono text-sm">${escHtml(u.mobile)}</td>
        <td>${badge(u.role === 'SENIOR_OFFICER' ? 'Senior Officer' : u.role, 'muted')}</td>
        <td class="text-sm text-muted">${escHtml(u.area)}</td>
        <td>${statusBadge(u.status)}</td>
        <td class="text-sm text-muted">${fmtDate(u.createdAt)}</td>
        <td>
          ${u.status==='PENDING' ? `<button class="btn btn-primary btn-sm" onclick="adminApproveUser('${u.id}')">Approve</button> ` : ''}
          <button class="btn btn-secondary btn-sm" onclick="toastMsg('User detail view coming soon.','ok')">View</button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>`);
}
window.adminApproveUser = function(id) {
  const u = ADMIN_USERS.find(x => x.id === id);
  if (u) u.status = 'ACTIVE';
  ADMIN_STATS.usersPending = Math.max(0, ADMIN_STATS.usersPending - 1);
  toastMsg('User approved and notified.', 'ok');
  navigate('admin-users');
};
window.openInviteModal = function() {
  openModal('Invite user', `
    <form class="space-y-4" onsubmit="doInviteUser(event)">
      <div class="field"><label>Full name</label><input class="input" id="inv-name" required /></div>
      <div class="field"><label>Mobile number</label><input class="input" id="inv-mobile" type="tel" maxlength="10" required /></div>
      <div class="field"><label>Role</label>
        <select class="select" id="inv-role" required>
          <option value="">Choose…</option>
          <option value="SENIOR_OFFICER">Senior Officer</option>
          <option value="INSPECTOR">Inspector</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:.5rem">
        <button type="button" class="btn btn-secondary" onclick="closeModalDirect()">Cancel</button>
        <button type="submit" class="btn btn-primary">Send invite</button>
      </div>
    </form>
  `);
};
window.doInviteUser = function(e) {
  e.preventDefault();
  const name = document.getElementById('inv-name').value;
  closeModalDirect();
  toastMsg(`Invitation sent to ${name}.`, 'ok');
};

/* ─── ADMIN MASTER DATA ─────────────────────────────────────── */
function renderAdminMasterdata(main) {
  main.innerHTML = `
    ${pageTitle('Master Data')}
    <div class="grid-2">
      ${card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">Areas</h2>
        <table style="width:100%;font-size:.875rem"><thead><tr><th style="text-align:left">Name</th><th style="text-align:left">Level</th></tr></thead><tbody>
          ${AREAS.map(a => `<tr><td>${escHtml(a.name)}</td><td class="text-muted">${a.level}</td></tr>`).join('')}
        </tbody></table>
      `)}
      ${card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">Instrument categories</h2>
        <ul class="space-y-2">
          ${CATEGORIES.map(c => `<li class="text-sm">${escHtml(c)}</li>`).join('')}
        </ul>
      `)}
    </div>
  `;
}

/* ─── ADMIN AUDIT ───────────────────────────────────────────── */
function renderAdminAudit(main) {
  main.innerHTML = `
    ${pageTitle('Audit log')}
    ${card(`
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date / Time</th><th>Actor</th><th>Role</th><th>Action</th><th>Target</th><th>IP</th></tr></thead>
          <tbody>
            ${AUDIT_LOG.map(a => `<tr>
              <td class="text-sm text-muted">${fmtDateTime(a.at)}</td>
              <td class="text-sm font-semibold">${escHtml(a.actor)}</td>
              <td>${badge(a.actorRole,'muted')}</td>
              <td class="font-mono text-sm">${escHtml(a.action)}</td>
              <td class="text-sm text-muted">${escHtml(a.target)}</td>
              <td class="font-mono text-xs text-muted">${escHtml(a.ip)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `)}
  `;
}

/* ─── ADMIN CERTIFICATES ────────────────────────────────────── */
function renderAdminCertificates(main) {
  main.innerHTML = `
    ${pageTitle('All certificates')}
    ${renderCertTable(CERTIFICATES)}
  `;
}

/* ─── ADMIN RULES ───────────────────────────────────────────── */
function renderAdminRules(main) {
  main.innerHTML = `
    ${pageTitle('Rule Sets', `<button class="btn btn-primary btn-sm" onclick="toastMsg('Rule editor coming soon.','ok')">+ New rule version</button>`)}
    <div class="space-y-3">
      ${RULES.map(r => card(`
        <div class="flex-between">
          <div>
            <h2 style="font-weight:600">${escHtml(r.category)} · v${r.version} ${statusBadge(r.status)}</h2>
            <p class="text-sm text-muted">Effective from ${fmtDate(r.effectiveFrom)}</p>
          </div>
        </div>
        <dl class="cert-dl" style="margin-top:.75rem">
          <div><dt>Maximum Permissible Error (MPE)</dt><dd>±${r.mpe.value} ${escHtml(r.mpe.unit)}</dd></div>
          <div><dt>Verification interval</dt><dd>${r.interval.months} months${r.interval.marginalMonths ? ` (±${r.interval.marginalMonths} marginal)` : ''}</dd></div>
        </dl>
      `)).join('')}
    </div>
  `;
}

/* ─── ADMIN SYSTEM ──────────────────────────────────────────── */
function renderAdminSystem(main) {
  main.innerHTML = `
    ${pageTitle('System settings')}
    <div class="grid-2">
      ${card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">Maintenance banner</h2>
        <form class="space-y-3" onsubmit="saveMaintenance(event)">
          <div class="field">
            <label for="maint-level">Level</label>
            <select id="maint-level" class="select">
              <option value="">None (no banner)</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
            </select>
          </div>
          <div class="field"><label>Message (English)</label><textarea class="textarea" id="maint-en" rows="2" maxlength="500"></textarea></div>
          <div class="field"><label>Message (Hindi)</label><textarea class="textarea" id="maint-hi" rows="2" maxlength="500"></textarea></div>
          <button class="btn btn-primary" type="submit">Save</button>
        </form>
      `)}
      ${card(`
        <h2 style="font-weight:600;margin-bottom:.75rem">Rate limits</h2>
        <form class="space-y-3" onsubmit="saveRateLimit(event)">
          <div class="field"><label>Default rate limit (req/min)</label><input class="input" type="number" id="rate-lim" value="${SYSTEM_SETTINGS.rateLimitPerMin}" min="1" /></div>
          <div class="field"><label>Dashboard cache (seconds)</label><input class="input" type="number" id="cache-sec" value="${SYSTEM_SETTINGS.dashboardCacheSeconds}" min="0" /></div>
          <button class="btn btn-primary" type="submit">Save</button>
        </form>
      `)}
    </div>
  `;
}
window.saveMaintenance = function(e) {
  e.preventDefault();
  SYSTEM_SETTINGS.maintenanceLevel = document.getElementById('maint-level').value || null;
  SYSTEM_SETTINGS.maintenanceTextEn = document.getElementById('maint-en').value;
  SYSTEM_SETTINGS.maintenanceTextHi = document.getElementById('maint-hi').value;
  toastMsg('Maintenance settings saved.', 'ok');
};
window.saveRateLimit = function(e) {
  e.preventDefault();
  SYSTEM_SETTINGS.rateLimitPerMin = parseInt(document.getElementById('rate-lim').value);
  SYSTEM_SETTINGS.dashboardCacheSeconds = parseInt(document.getElementById('cache-sec').value);
  toastMsg('Settings saved.', 'ok');
};

/* ─── ADMIN PRIVACY ─────────────────────────────────────────── */
function renderAdminPrivacy(main) {
  main.innerHTML = `
    ${pageTitle('Privacy / Data requests')}
    ${alert('Privacy requests are handled here. All actions are logged in the audit trail.', 'info')}
    ${card(`
      <h2 style="font-weight:600;margin-bottom:.75rem">Pending data requests</h2>
      ${emptyState('No pending data requests.')}
    `)}
  `;
}

/* ─── REPORT TAMPERING ─────────────────────────────────────── */
function renderTamperReport(main) {
  main.innerHTML = `
    ${subpageBanner(
      lang === 'hi' ? 'प्रमाणपत्र छेड़छाड़ एवं धोखाधड़ी रिपोर्ट' : 'Report Certificate Tampering & Fraud',
      lang === 'hi' ? 'जाली मुहरों, छेड़छाड़ किए गए वजन पैमानों अथवा फर्जी प्रमाणपत्रों की गोपनीय शिकायत' : 'Confidential whistleblower portal to report forged calibration certificates, broken seals, or counterfeit stamping',
      [lang === 'hi' ? 'छेड़छाड़ रिपोर्ट' : 'Report Tampering']
    )}

    <div style="max-width:44rem;margin:0 auto">
      <div class="alert alert-info" style="margin-bottom:20px;border-left:5px solid var(--hp-green)">
        <div style="display:flex;gap:12px;align-items:flex-start">
          <span style="font-size:1.5rem">🛡️</span>
          <div>
            <strong style="font-size:0.9375rem;color:var(--hp-navy)">Confidential Whistleblower Protection</strong>
            <p class="text-xs text-muted" style="margin:4px 0 0;line-height:1.5">
              Your report is encrypted and routed directly to the Central Vigilance &amp; Enforcement Wing of Legal Metrology. Contact details are optional; if provided, your identity is strictly guarded under administrative whistleblowing safeguards.
            </p>
          </div>
        </div>
      </div>

      ${card(`
        <form class="space-y-4" onsubmit="submitTamperReport(event)">
          <div class="grid-2">
            <div class="field">
              <label for="tr-cert" style="font-weight:700;color:var(--hp-navy)">Certificate Number (if visible)</label>
              <input class="input" id="tr-cert" placeholder="e.g. NRK/CERT/MUM/2024/000001" />
            </div>
            <div class="field">
              <label for="tr-type" style="font-weight:700;color:var(--hp-navy)">Nature of Discrepancy *</label>
              <select class="select" id="tr-type" required>
                <option value="">Select violation type…</option>
                <option value="FORGED_CERT">Forged / Fake Paper Certificate</option>
                <option value="BROKEN_SEAL">Broken or Tampered Lead / Hologram Seal</option>
                <option value="EXPIRED_USE">Expired Certificate Actively in Commercial Use</option>
                <option value="DEFECTIVE_METER">Inaccurate Measure / Cheating on Weighbridge</option>
                <option value="IMPERSONATION">Unauthorized Person Claiming to be Inspector</option>
                <option value="OTHER">Other Metrology Violation</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label for="tr-location" style="font-weight:700;color:var(--hp-navy)">Establishment Name &amp; Physical Address / Market *</label>
            <input class="input" id="tr-location" required placeholder="e.g. Wholesale APMC Market Gate 3, Shop No 14, Navi Mumbai" />
          </div>

          <div class="field">
            <label for="tr-desc" style="font-weight:700;color:var(--hp-navy)">Detailed Description of Observed Violation *</label>
            <textarea class="textarea" id="tr-desc" required minlength="15" maxlength="2000" rows="4" placeholder="Describe how the scale or certificate appeared altered, date/time observed, and any other relevant facts…"></textarea>
          </div>

          <div class="field">
            <label for="tr-contact" style="font-weight:700;color:var(--hp-navy)">Whistleblower Contact (Optional — for confidential case updates)</label>
            <input class="input" id="tr-contact" placeholder="Mobile number or secure email (optional)" />
          </div>

          <div id="tr-msg"></div>

          <div style="display:flex;justify-content:flex-end;gap:12px;padding-top:8px">
            <button class="btn btn-secondary" type="reset">Clear Form</button>
            <button class="hp-btn hp-btn--primary" type="submit" style="padding:0 28px;height:44px">
              Submit Confidential Report
            </button>
          </div>
        </form>
      `)}
    </div>
  `;
}
window.submitTamperReport = function(e) {
  e.preventDefault();
  const ref = 'TR-' + new Date().getFullYear() + '-' + String(TAMPER_REPORTS.length+100).padStart(4,'0');
  TAMPER_REPORTS.push({
    id: 'tr' + Date.now(),
    ref,
    certNo: document.getElementById('tr-cert').value || null,
    description: document.getElementById('tr-desc').value,
    status: 'ACTIVE',
    contact: document.getElementById('tr-contact').value || null,
    createdAt: new Date().toISOString(),
    note: ''
  });
  const msgEl = document.getElementById('tr-msg');
  if (msgEl) {
    msgEl.innerHTML = `
      <div class="alert alert-ok" style="margin-top:12px">
        <p style="font-weight:700;margin:0 0 4px">✓ Official Complaint Logged Successfully</p>
        <p style="font-size:0.875rem;margin:0">Case Reference Docket: <strong>${ref}</strong>. Your report has been dispatched to the Regional Enforcement Vigilance Unit for verification.</p>
      </div>
    `;
  }
};

/* ─── STATIC PAGES ──────────────────────────────────────────── */
const PRIVACY_TEXT = `
  <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin-bottom:.75rem;margin-top:1rem">What Information We Collect</h2>
  <p class="text-sm text-muted" style="line-height:1.65">We collect registration credentials (name, mobile number, firm details, and email) and technical specifications of commercial weighing and measuring instruments submitted for inspection. Data is strictly processed in conformity with the Legal Metrology Act, 2009 and the Digital Personal Data Protection Act.</p>
  
  <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin-bottom:.75rem;margin-top:1.5rem">Statutory Purpose &amp; Public Registry</h2>
  <p class="text-sm text-muted" style="line-height:1.65">Verification records and validity certificates are maintained as official public registers to safeguard fair trade and consumer protection. No personally identifiable phone or bank numbers are published in the open directory.</p>
  
  <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin-bottom:.75rem;margin-top:1.5rem">Data Rights &amp; Access</h2>
  <p class="text-sm text-muted" style="line-height:1.65">Registered commercial establishments can review, export, and request updates to their profile records via Owner Portal → Account Settings.</p>
  
  <h2 style="font-size:1.15rem;font-weight:800;color:var(--hp-navy);margin-bottom:.75rem;margin-top:1.5rem">Contact Data Protection Officer</h2>
  <p class="text-sm text-muted">Direct inquiries to the Departmental Nodal Officer: <a href="mailto:dpo@lmnirikshan.gov.in" class="text-primary" style="text-decoration:underline">dpo@lmnirikshan.gov.in</a></p>
`;
const TERMS_TEXT = `
  <p class="text-sm text-muted" style="margin-bottom:1.25rem;line-height:1.6">This portal is operated by the Department of Legal Metrology, Government of India. Use of this verification portal implies explicit consent to the following terms:</p>
  <ul class="space-y-3 text-sm text-muted" style="line-height:1.6">
    <li>• All entries on this portal are recorded for official statutory purposes under the Legal Metrology Act, 2009.</li>
    <li>• Public certificate checks are provided free of cost as a transparency initiative.</li>
    <li>• Submission of forged documents or counterfeit stamp numbers constitutes a criminal offense under Section 24 and Section 33.</li>
    <li>• This environment serves as the demonstration implementation of the national verification network.</li>
  </ul>
`;
const ACCESSIBILITY_TEXT = `
  <p class="text-sm text-muted" style="margin-bottom:1.25rem;line-height:1.6">We are committed to making this service fully accessible to all citizens, including individuals with visual or motor impairments:</p>
  <ul class="space-y-3 text-sm text-muted" style="line-height:1.6">
    <li>• Strict compliance with WCAG 2.1 Level AA accessibility standards.</li>
    <li>• Comprehensive keyboard navigation across all interactive forms, drawers, and modal sheets.</li>
    <li>• High color contrast compliance across light and dark themes.</li>
    <li>• Seamless English / Hindi bilingual interface support.</li>
    <li>• Support for OS-level reduced-motion preferences.</li>
  </ul>
  <p class="text-sm text-muted" style="margin-top:1rem">Report any accessibility barriers to: <a href="mailto:helpdesk@lmnirikshan.gov.in" class="text-primary" style="text-decoration:underline">helpdesk@lmnirikshan.gov.in</a></p>
`;

function renderStatic(main, title, content) {
  main.innerHTML = `
    ${subpageBanner(
      title,
      'Department of Legal Metrology, Government of India — DirectVerify Network Compliance & Policies',
      [title]
    )}

    <div style="max-width:52rem;margin:0 auto">
      ${card(`
        <div class="static-content" style="line-height:1.7;color:var(--hp-text-main)">
          ${content}
        </div>
      `)}
    </div>
  `;
}

/* ─── EXPOSE navigate globally ──────────────────────────────── */
window.navigate = navigate;
window.toastMsg = toastMsg;
window.openModal = openModal;
