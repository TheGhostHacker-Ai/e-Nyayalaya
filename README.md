# e-Nyayalaya (ई-न्यायालय)
### Unified Tamper-Evident Digital Case Record Grid & e-Courts Management System
**Smart India Hackathon (SIH 26190)** | Aligned with **BNSS 2023**, **BNS 2023**, and **BSA 2023**

[![Deployment: Netlify](https://img.shields.io/badge/Deployment-Netlify-00C7B7?logo=netlify&logoColor=white)](https://github.com/TheGhostHacker-Ai/e-Nyayalaya)
[![Backend: Supabase](https://img.shields.io/badge/Backend-Supabase%20PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Cryptography: SHA-256](https://img.shields.io/badge/Integrity-SHA--256%20Chain-blue)](https://github.com/TheGhostHacker-Ai/e-Nyayalaya)
[![Compliance: GIGW 3.0](https://img.shields.io/badge/Standard-GIGW%203.0%20%2F%20BNSS-8A1E23)](https://github.com/TheGhostHacker-Ai/e-Nyayalaya)

---

## 👥 Core Project Team & Leadership

| Name | Role & Designation | Key Responsibilities |
| :--- | :--- | :--- |
| **Narendra Kumar** | **Team Lead & Chief Architect** | System Architecture, Full-Stack Integration, Netlify & Supabase Cloud Grid, Judicial State Engine |
| **Devesh Singh** | **Compliance, Documentation & QA Lead** | Statutory BNSS/BNS/BSA Alignment, GIGW 3.0 Guidelines, Security Auditing & End-to-End QA Testing |
| **Nishant Maurya** | **Security, Cryptography & Integrity Lead** | SHA-256 Hash Chaining, Tamper-Evident Audit Trails, Token Transits & Zero-Trust Database RLS Policies |
| **Pragati Jaiswal** | **Database & Backend Engineer** | Supabase/PostgreSQL Relational Schema, Triggers, RPC Procedures, Spatial Filtering & Real-time Subscriptions |
| **Arushi Bajpai** | **AI/ML Integration Lead** | Tesseract OCR Pipeline, Legal NLP Summarization, Automated Charge Sheet Drafting & Crime Analysis |
| **Mushkan Dubey** | **UI/UX & Frontend Experience Lead** | National Portal Theming, Accessibility (High Contrast / Font Scaling), Roster Tables & React Components |

---

## 📑 Detailed Documentation

- 📘 **[Full Project Report (PROJECT_REPORT.md)](PROJECT_REPORT.md)**: In-depth technical architecture, statutory legal alignment (BNSS, BNS, BSA), security and database matrices.
- 📙 **[Operational Workflow Specification (WORKFLOW.md)](WORKFLOW.md)**: End-to-end lifecycle diagrams, user journeys, state transition rules, and cryptographic auditing.

---

## 🌟 Key Platform Features

1. **Citizen e-FIR & Live Docket Tracking:** 3-step verified electronic FIR filing with client-side SHA-256 hashing and tracking receipts.
2. **Zero FIR Jurisdictional Handover (Sec 173(1) BNSS):** Instant digital handover between 1,900+ police stations with automated transfer memos.
3. **Investigating Officer (IO) Cadre & Witness Depositions (Sec 180 BNSS):** IO appointments, statement recording, and evidence ingestion.
4. **Automated Charge Sheet Drafting (Sec 193 BNSS / Sec 173 CrPC):** Digital police report synthesis forwarded to Judicial Magistrates.
5. **Multi-Tier Judicial Docketing:** Chief Judicial Magistrate & Sessions Courts, High Court Appellate Benches, and Supreme Court Registry.
6. **Inter-Agency Case Transfers (CBI, NIA, ED, CID, SFIO):** Single-use cryptographic transfer tokens for secure investigation handovers.
7. **Judicial Evidence Revocation Powers:** Exclusive bench authority to approve or revoke disputed evidence with statutory audit records.
8. **Cryptographic SHA-256 Hash Chaining:** Tamper-evident ledger guaranteeing electronic evidence admissibility under Section 63 of BSA 2023.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite 8, React Router v6, Lucide Icons, Vanilla CSS (Government Portal Theme GIGW 3.0).
- **Backend & Database:** Supabase (PostgreSQL 15), Realtime WebSockets, Row Level Security (RLS).
- **AI & OCR:** Tesseract OCR Engine, Client-side SHA-256 Web Crypto API, NLP Legal Synthesizer.
- **Hosting & CI/CD:** Netlify Cloud Deployment with GitHub Actions integration.

---

## 🚀 Quick Start & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/TheGhostHacker-Ai/e-Nyayalaya.git
cd e-Nyayalaya

# 2. Navigate to frontend directory
cd dms-frontend

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev

# 5. Build for production
npm run build
```

---

## ⚖️ Legal & Statutory Framework
- **Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023)** &mdash; Sec 173(1) (Zero FIR), Sec 180 (Witnesses), Sec 193 (Charge Sheet)
- **Bharatiya Nyaya Sanhita (BNS, 2023)** &mdash; Substantive criminal penal codes & offense classification
- **Bharatiya Sakshya Adhiniyam (BSA, 2023)** &mdash; Sec 63 & 65B (Admissibility of Electronic Records & Cryptographic Integrity)
