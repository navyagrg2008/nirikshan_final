# Nirikshan – Pure Vanilla HTML/CSS/JS Frontend Prototype

A complete, zero-dependency frontend prototype of **Nirikshan** (India's Legal Metrology Online Verification System), built strictly with **pure HTML5, CSS3, and Vanilla JavaScript**.

No backend frameworks, no external databases, and no external libraries required.

---

## 🚀 Quick Start

You can run the prototype in two ways:

### Option 1: Directly in your browser (No server needed)
Double-click [index.html](file:///w:/Innotech/nirikshan-main/nirikshan-frontend/index.html) or right-click and choose **Open with → Chrome / Edge / Firefox / Safari**.

### Option 2: Local HTTP Server (Included)
Run the bundled Node.js server:
```bash
node serve.js
```
Then visit: [http://127.0.0.1:3000/](http://127.0.0.1:3000/)

---

## 🔑 Test Credentials (Clickable in UI)

All roles have pre-loaded credentials displayed directly on the Sign In page for one-click testing:

| Role | Username / Mobile | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Owner** | `9876543210` | `owner@123` | Register instruments, apply for verification, download certificates, file grievances, track status |
| **Trader** | `9876543211` | `trader@123` | Manage fuel dispenser / commercial scales, submit verification requests, transfer requests |
| **Officer** | `officer001` | `officer@123` | Workload queue, review test trials & checklists, approve/reject/refer cases, issue digital certificates |
| **Senior Officer** | `srofficer001` | `srofficer@123` | Review referred cases, second-approver authorizations, system enforcement |
| **Inspector** | `inspector001` | `inspector@123` | Conduct on-site inspections, input test trials (observed vs reference loads), checklist verification, geo-tagged photos |
| **Admin** | `admin001` | `admin@123` | User approvals, audit logs, metrology rule sets, master data, system maintenance mode, DSAR privacy requests |

---

## 🌟 Key Features & Replicated Views

### 1. Public Portals
- **Home (`#home`)**: Quick certificate verification, interactive statistics counter, 3-step workflow guide, and legal metrology notices.
- **Rules (`#rules`)**: Official catalog of metrology categories, versioning, maximum permissible error (MPE), and inspection intervals.
- **Notices (`#notices`)**: Departmental notices filterable by tags (*Holiday, Policy, Maintenance, Regulation, Training*) with instant English/Hindi bilingual switching.
- **Certificate Verification (`#validate`)**: Public instant verification tool supporting direct lookup or QR code scanning URLs (e.g. `NRK/CERT/MUM/2024/000001`).
- **Global Search (`#search`)**: Real-time cross-catalog search across instruments, certificates, rules, and circulars.
- **Tampering Reporting (`#report-tampering`)**: Public whistleblowing tool for reporting seal tampering or fraudulent stickers.
- **Help (`#help`), Terms (`#terms`), Privacy (`#privacy`), Accessibility (`#accessibility`)**: Full WCAG-compliant legal and support sections.

### 2. Owner & Trader Experience
- **Dashboard (`#owner-dashboard`)**: Instrument portfolio summary, expiring certificate warnings, quick application triggers.
- **Instruments (`#owner-instruments`)**: Filterable registry, new instrument registration modal, and lifecycle change requests (transfer, deregistration, address update).
- **Applications (`#owner-applications`)**: Verification application filing and end-to-end timeline tracking (*Submitted → Scheduled → Inspected → Approved/Rejected*).
- **Certificates (`#owner-certificates`)**: Digital verification certificates featuring authentic seal graphics, QR verification links, and printer-friendly layout.
- **Grievances (`#owner-grievances`)**: Submit complaints and track officer replies.

### 3. Inspector Experience
- **Inspector Dashboard (`#inspector-dashboard`)**: Scheduled visits list with geofence proximity indicators.
- **Interactive Inspection Workflow**: Click **"Start inspection"** to launch the comprehensive on-site form:
  - 5-point critical checklist (platform level, load cells, seals, digital display, zero balance).
  - 3-stage load test table (reference load, observed weight, automatic MPE tolerance verification).
  - Serial sticker assignment and geo-tagged photo evidence simulation.
  - Overall verdict generation (*Pass / Fail*) submitting directly into the officer decision queue.
- **History (`#inspector-history`)**: Log of past inspections and recommendations.

### 4. Officer & Senior Officer Experience
- **Dashboard (`#officer-dashboard`)**: Officer metrics and case workload summaries.
- **Queue Tabs (`#officer-queue`)**: Filtered queues for Applications, Change/Transfer Requests, Grievances, and Tamper Reports.
- **Detailed Case Review (`#officer-cases/:id`)**: Inspector visit audit, test trial inspection, and decision workflow (*Approve with custom validity slider, Reject with statutory reason codes, Refer, or Reinspect*).
- **Decisions Record (`#officer-decisions`)**: Immutable audit history of all case resolutions.
- **Enforcement (`#officer-enforcement`)**: Market inspections and violation tracking.
- **Reports Suite (`#officer-reports`)**: Customizable analytical reports with tabular previews and simulated CSV/PDF exports.

### 5. Admin Console
- **User Management (`#admin-users`)**: Role assignments, account status toggling, and pending registration approvals.
- **Audit Log (`#admin-audit`)**: Security audit trail tracking actors, roles, actions, timestamps, and IP addresses.
- **Metrology Rule Sets (`#admin-rules`)**: Dynamic configuration of legal tolerances and validity intervals.
- **System Controls (`#admin-system`)**: Maintenance mode controls, security policies, and rate limits.
- **Privacy Center (`#admin-privacy`)**: GDPR / DPDP statutory compliance and data subject access requests (DSAR).

---

## 🎨 Design System & Accessibility
- **Bilingual Interface**: Seamless 1-click toggling between **English** and **Hindi (हिंदी)** across all navigation links, buttons, and system notices.
- **Dark Mode**: Instant theme switching adhering to system preferences with persistent storage.
- **Design Tokens**: Precise color harmony matching the official palette (`#0E7C7B` Primary Teal, `#B7791F` Brass, `#15803D` Success Green, `#B91C1C` Crimson).
- **Typography & Accessibility**: Inter & Noto Sans Devanagari typography, semantic HTML5, skip navigation links, and full keyboard navigation.
