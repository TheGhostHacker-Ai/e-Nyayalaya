# e-Nyayalaya (ई-न्यायालय)
### Unified Tamper-Evident Digital Case Record Grid & e-Courts Management System
**Smart India Hackathon (SIH 26190)** | Aligned with **BNSS 2023**, **BNS 2023**, and **BSA 2023**

[![Deployment: Netlify](https://img.shields.io/badge/Deployment-Netlify-00C7B7?logo=netlify&logoColor=white)](https://github.com/TheGhostHacker-Ai/e-Nyayalaya)
[![Backend: Supabase](https://img.shields.io/badge/Backend-Supabase%20PostgreSQL%2015-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Frontend: React 19](https://img.shields.io/badge/Frontend-React%2019%20%2F%20Vite%208-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![AI Engine: Google Gemini](https://img.shields.io/badge/AI%20Engine-Google%20Gemini-8E75B2?logo=google&logoColor=white)](https://ai.google.dev)
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
| **Arushi Bajpai** | **AI/ML Integration Lead** | Google Gemini Multimodal Vision & OCR Engine, Legal NLP Summarization, Automated Charge Sheet Synthesizer |
| **Mushkan Dubey** | **UI/UX & Frontend Experience Lead** | National Portal Theming, Accessibility (High Contrast / Font Scaling), Roster Tables & React Components |

---

## 📑 Detailed Documentation

- 📘 **[Full Technical Project Report (PROJECT_REPORT.md)](PROJECT_REPORT.md)**: In-depth technical architecture, statutory legal alignment (BNSS, BNS, BSA), security formulas, and database RLS matrices.
- 📙 **[Operational Workflow Specification (WORKFLOW.md)](WORKFLOW.md)**: End-to-end lifecycle diagrams, user journeys, state transition rules, and cryptographic auditing.

---

## 🌟 Key Platform Capabilities

1. **Citizen e-FIR & Live Docket Tracking:** 3-step verified electronic FIR filing with client-side SHA-256 hashing and instant printable tracking receipts.
2. **Zero FIR Jurisdictional Handover (Sec 173(1) BNSS):** Instant digital handover between police stations (seeded with 1,900+ Uttar Pradesh stations across all 75 districts, expandable to all 36 States & UTs nationally).
3. **Investigating Officer (IO) Cadre & Witness Depositions (Sec 180 BNSS):** Official IO appointments, Section 180 witness examination recording, and evidence ingestion.
4. **Automated Charge Sheet Drafting (Sec 193 BNSS):** Digital police report synthesis under Section 193 BNSS (renumbered from Section 173 of erstwhile CrPC) forwarded to Judicial Magistrates.
5. **Multi-Tier Judicial Docketing:** Subordinate Trial Courts (CJM & Sessions), High Court Appellate Benches, and Supreme Court National Registry.
6. **Inter-Agency Case Transfers (CBI, NIA, ED, CID, SFIO):** Single-use cryptographic transfer tokens for secure investigation handovers.
7. **Judicial Evidence Revocation Powers:** Exclusive statutory bench authority under BNSS/BSA to review and revoke disputed evidence with immutable audit logs.
8. **Cryptographic SHA-256 Hash Chaining:** Tamper-evident ledger guaranteeing electronic evidence admissibility under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023.

---

## 🛠️ Technology Stack

- **Frontend:** React 19 (`^19.2.8`), Vite 8 (`^8.3.0`), React Router DOM v7 (`^7.18.4`), Lucide React Icons (`^1.47.0`), GIGW 3.0 Government Design System.
- **Backend & Database:** Supabase (PostgreSQL 15), Realtime WebSockets, Row Level Security (RLS), Stored RPCs.
- **AI & Document Processing:** Google Gemini Multimodal Vision & OCR Engine, Client-side SHA-256 Web Crypto API, Gemini NLP Statutory Legal Summarizer.
- **Hosting & CI/CD:** Netlify Cloud Deployment with automated GitHub branch sync.

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

## ⚖️ Statutory Legal Alignment (New Criminal Laws, 2023)
- **Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023)** &mdash; Sec 173(1) (Electronic FIR & Zero FIR), Sec 180 (Witness Examination), Sec 193 (Police Charge Sheet)
- **Bharatiya Nyaya Sanhita (BNS, 2023)** &mdash; Substantive criminal penal codes & offense classifications
- **Bharatiya Sakshya Adhiniyam (BSA, 2023)** &mdash; Sec 63 (Admissibility of Electronic Records & Cryptographic Integrity; successor to Section 65B of the repealed Indian Evidence Act, 1872)
