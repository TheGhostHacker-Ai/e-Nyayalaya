# PROJECT REPORT: e-Nyayalaya
## Unified Tamper-Evident Digital Case Record Grid & e-Courts Management System
### Designed for Smart India Hackathon (SIH 26190) | Aligned with BNSS 2023, BNS 2023 & BSA 2023

---

## 1. Executive Summary & Team Information

**e-Nyayalaya** is an enterprise-grade, cryptographically verifiable, tamper-evident judicial and police case record management grid designed to modernize and unify India's criminal and civil justice system under the **Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023)**, **Bharatiya Nyaya Sanhita (BNS, 2023)**, and **Bharatiya Sakshya Adhiniyam (BSA, 2023)** (which repealed and superseded the Code of Criminal Procedure, 1973, Indian Penal Code, 1860, and Indian Evidence Act, 1872 in July 2024).

The platform eliminates systemic delay, evidence tampering, and jurisdictional friction by creating a continuous, SHA-256 hash-chained digital custody record connecting:
1. **Citizens** (via verified online e-FIR lodging & real-time docket tracking),
2. **Police Stations & Investigating Officers** (1,900+ police stations seeded from official UP police directory, scalable nationally across all 36 States & UTs with Zero FIR routing under Section 173(1) BNSS),
3. **Subordinate Judicial Magistrate & Sessions Courts** (charge sheet cognizance under Section 193 BNSS, trial proceedings, bail & hearings),
4. **Appellate High Courts & The Supreme Court of India** (appellate record call-up, digital lower-court inspection, and constitutional judgements across all 28 States and 8 Union Territories),
5. **Specialized National & State Enforcement Agencies** (CBI, NIA, ED, CID, SFIO, DRI, NCB via single-use cryptographic master transfer tokens).

---

### Project Leadership & Team Roster

| Name | Role & Responsibility | Core Focus Areas |
| :--- | :--- | :--- |
| **Narendra Kumar** | **Team Lead & Chief Architect** | System Architecture, Full-Stack Integration, Netlify & Supabase Cloud Grid, Multi-tier Judicial State Engine |
| **Devesh Singh** | **Compliance, Documentation & QA Lead** | Statutory BNSS/BNS/BSA Alignment, GIGW 3.0 Compliance, Security Auditing & QA Test Engineering |
| **Nishant Maurya** | **Security, Cryptography & Integrity Lead** | SHA-256 Hash Chaining, Tamper-Evident Audit Trails, Cryptographic Token Transits & Zero-Trust RLS Policies |
| **Pragati Jaiswal** | **Database & Backend Engineer** | Supabase/PostgreSQL Relational Schema, Triggers, RPC Procedures, Spatial Filtering & Real-time Subscriptions |
| **Arushi Bajpai** | **AI/ML Integration Lead** | Google Gemini Multimodal Vision & OCR Engine, Legal NLP Summarization, Automated Charge Sheet Synthesizer |
| **Mushkan Dubey** | **UI/UX & Frontend Experience Lead** | National Portal Theming, Accessibility (High Contrast/Font Scaling), Responsive Roster Tables & React Components |

---

## 2. Problem Statement & Legal Mandate

### The Challenge in Traditional Systems
- **Jurisdictional Delays (Zero FIR Friction):** In the erstwhile system, when an FIR was filed outside territorial jurisdiction, physical paper dockets suffered bureaucratic transfer delays.
- **Evidence Tampering & Chain-of-Custody Breakdowns:** Physical case diaries and paper evidence lacked mathematical tamper-evidence, creating vulnerability to alteration.
- **Inter-Agency Data Silos:** Transitioning case custody to specialized bodies (CBI, NIA, ED) or transmitting lower court records to Appellate High Courts required physical paper transit.
- **Citizen Disconnect:** Complainants lacked transparent, real-time mechanisms to track statutory progress once an FIR was registered.

### The Statutory Legal Framework (New Criminal Laws, 2023)
- **Section 173(1), BNSS, 2023 (Electronic Information & Zero FIR):** Mandates recording information electronically irrespective of territorial jurisdiction and instant digital forwarding to the competent police station.
- **Section 193, BNSS, 2023 (Police Report / Charge Sheet):** Renumbered from Section 173 of the erstwhile CrPC; mandates digital submission of investigation findings and evidence grids directly to the Judicial Magistrate upon completion.
- **Section 180, BNSS, 2023 (Witness Examination):** Renumbered from Section 161 of the erstwhile CrPC; empowers Investigating Officers to record witness statements digitally on the investigation docket.
- **Section 63, Bharatiya Sakshya Adhiniyam, 2023 (Admissibility of Electronic Records):** Successor to Section 65B of the repealed Indian Evidence Act, 1872; establishes mathematical proof, cryptographic SHA-256 hashing, and tamper-evident audit logs as legal prerequisites for electronic evidence admissibility.

---

## 3. High-Level System Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │             CITIZEN WEB PORTAL               │
                               │  - 3-Step Verified e-FIR Registration        │
                               │  - Live Docket Tracking & SHA-256 Receipt    │
                               └──────────────────────┬───────────────────────┘
                                                      │ HTTPS / Web Crypto API
                                                      ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   e-NYAYALAYA CENTRAL DATA GRID                                        │
 ├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                                        │
 │  ┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐   │
 │  │     POLICE      │       │ TRIAL & DISTRICT│       │    HIGH COURT    │       │  SUPREME COURT   │   │
 │  │  INVESTIGATION  │──────►│      COURT      │──────►│ (APPELLATE BENCH)│──────►│  OF INDIA (APEX) │   │
 │  │ - Zero FIR Route│(Sec193│ - Cognizance    │(Appeal│ - Appeal Review  │(Apex  │ - Apex Decrees   │   │
 │  │ - IO Witness Dep│Charge │ - Trial & Bail  │Record)│ - Lower Bench Ver│Appeal)│ - 36 States & UTs│   │
 │  │ - Gemini Vision │Sheet) │ - Evidence Mgmt │       │ - Decree Signing │       │ - Precedent Repo │   │
 │  └─────────────────┘       └────────┬────────┘       └────────┬─────────┘       └──────────────────┘   │
 │                                     │                         │                                        │
 │                         (Court Transfer Order)        (HC Transfer Order)                              │
 │                                     │                         │                                        │
 │                                     ▼                         ▼                                        │
 │                          ┌───────────────────────────────────────────────┐                             │
 │                          │          SPECIALIZED ENFORCEMENT HQ           │                             │
 │                          │         (CBI / NIA / ED / CID / SFIO)         │                             │
 │                          │  - Claims Single-Use Master Transfer Token    │                             │
 │                          │  - Conducts Independent Agency Investigation  │                             │
 │                          │  - Returns Report to Originating Court        │                             │
 │                          └───────────────────────────────────────────────┘                             │
 │                                                                                                        │
 └────────────────────────────────────────────┬───────────────────────────────────────────────────────────┘
                                              │ Real-Time WebSocket & REST (RLS Protected)
                                              ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                             SUPABASE POSTGRESQL & CRYPTOGRAPHIC LEDGER                                 │
 ├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │  • Tables: cases, documents, audit_log, case_participants, case_agency_transfers, court_sessions       │
 │  • Security: Zero-Trust Row Level Security (RLS) by cadre, organization ID, and token claims           │
 │  • Integrity: Recursive SHA-256 Hash Chain verification trigger & Audit Trail Ledger                   │
 │  • AI Pipeline: Google Gemini Multimodal Vision & OCR Engine + Statutory Legal Synthesis Engine       │
 └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Functional Modules & Implementation Details

### 4.1. Citizen e-FIR Inward Desk & Zero FIR Handover (Sec 173(1) BNSS)
- **3-Step Filing Wizard & Aadhaar Act, 2016 Compliance:** Citizens provide incident classification, geographical jurisdiction selection (seeded with 1,900+ Uttar Pradesh stations across all 75 districts, expandable to all 36 States & UTs nationally), suspect descriptions, and incident particulars. In strict compliance with the **Aadhaar Act, 2016** and UIDAI circulars, raw 12-digit Aadhaar numbers are never collected or stored; only masked Aadhaar (last 4 digits e.g., `XXXX-XXXX-1234`) or alternate national IDs (Voter ID, DL, Passport, PAN) are accepted.
- **Unauthenticated e-FIR RLS Policy:** PostgreSQL Row-Level Security explicitly permits unauthenticated citizens (`auth.uid() IS NULL` or `case_category = 'Criminal (e-FIR)'`) to lodge e-FIRs directly without login friction, immediately generating a public receipt while protecting judicial dossiers.
- **Client-Side SHA-256 Docket Hashing:** Upon filing, the Web Crypto API generates a unique SHA-256 cryptographic checksum embedded into the citizen's printable statutory receipt.
- **Zero FIR Territorial Handover:** If registered at Station A for an incident occurring under Station B's jurisdiction, Station A executes an instant digital Zero FIR Transfer under BNSS Section 173(1), transmitting the electronic case file, generating a statutory handover memo, and updating both stations' active and transferred rosters.

### 4.2. Investigating Officer (IO) Cadre & Witness Examination (Sec 180 BNSS)
- **IO Appointment:** Station House Officers (SHO) assign an Investigating Officer with badge credentials and statutory investigation directives.
- **Section 180 BNSS Witness Deposition:** IOs digitally record witness statements, ID proof verification, and examination notes on the case timeline.
- **Evidence Lockbox:** Digital and physical evidence records (CCTV footage, seizure memos, forensic lab reports) are processed through Google Gemini Vision & OCR, extracting searchable text and sealing the document with an SHA-256 checksum.

### 4.3. Automated Final Charge Sheet Generation (Sec 193 BNSS)
- The IO compiles witness statements and evidence into a structured Police Final Report under Section 193 BNSS (renumbered from Section 173 of the erstwhile CrPC).
- Transmits the charge sheet directly to the designated Judicial Magistrate / District Court, automatically transitioning the case stage from `under_investigation` to `in_trial`.

### 4.4. Multi-Tier Judicial Docketing & Evidence Admissibility
- **Subordinate Trial Courts (District & Sessions):** Magistrates review charge sheets, take judicial cognizance, schedule daily hearing sessions, record bail decisions, and log trial proceedings.
- **Exclusive Statutory Evidence Revocation:** Judges possess exclusive statutory authority under BNSS and BSA 2023 to review and revoke disputed evidence records from active trial proceedings, mandating a statutory justification that is permanently sealed into the audit log.
- **Appellate High Courts & Supreme Court of India:** Higher judicial benches review appealed dockets across all 36 States and Union Territories (28 States + 8 UTs), inspect lower court electronic evidence chains, and pronounce binding decrees.

### 4.5. Inter-Agency Jurisdictional Transfer (CBI, NIA, ED, CID, SFIO)
- Trial Courts and High Courts can order investigation transfer to specialized national/state enforcement agencies.
- The system generates a cryptographically secure **Single-Use Master Transfer Token** (e.g. `TRF-CBI-XXXX-YYYY`).
- Appointed Agency Administrators claim custody through the portal, transferring investigative authority to the agency headquarters while preserving the preceding chain of custody (tracked operationally as Agency Custody via `case_agency_transfers` while maintaining the core `in_trial` database state).

---

## 5. Security, Cryptography & Compliance

### 5.1. Cryptographic SHA-256 Hash Chaining
Every document, e-FIR entry, witness statement, and transfer action is cryptographically chained using SHA-256:

$$\text{Record Hash}_i = \text{SHA-256}\left(\text{Case ID} \parallel \text{Timestamp} \parallel \text{Actor ID} \parallel \text{Action} \parallel \text{Content Payload} \parallel \text{PreviousHash}_{i-1}\right)$$

Because each record includes the cryptographic digest of the preceding log entry ($\text{PreviousHash}_{i-1}$), altering or deleting any historical record breaks the mathematical chain for all subsequent entries, immediately exposing any tampering attempt during judicial verification under Section 63 of BSA 2023.

### 5.2. Row Level Security (RLS) & Access Control Matrix

| Role | Cases Access Scope | Evidence Upload | Judgement Pronouncement | Agency Transfer Initiation |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen** | Public e-FIR Docket Lookup | Filing Only | Read Public Judgements | ❌ No Access |
| **Police SHO** | Territorial Station Cases | ✅ Yes | ❌ No Access | ❌ No Access |
| **Investigating Officer** | Assigned Investigation Dockets | ✅ Yes (Sec 180 BNSS) | ❌ No Access | ❌ No Access |
| **Trial Court Judge** | Assigned Judicial Court Docket | ✅ Review & Revoke | ✅ Yes (Cognizance & Decrees) | ✅ Yes (Court Order) |
| **High Court Judge** | State-Wide & Appellate Dockets | ✅ Review & Revoke | ✅ Yes (Appellate Decrees) | ✅ Yes (Bench Order) |
| **Supreme Court Judge**| Apex National Registry | ✅ Review Only | ✅ Yes (Apex Decrees) | ❌ No (Direct Appellate) |
| **Agency Lead (CBI/NIA)** | Transferred Cases Only | ✅ Yes | ❌ No Access | ❌ No (Claims via Token) |
| **Legal Counsel** | Retained Cases via Bar Token | ✅ Submissions | ❌ No Access | ❌ No Access |

---

## 6. Technical Stack & Deployment Specification

- **Frontend Framework:** React 19 (`^19.2.8`), Vite 8 (`^8.3.0`), React Router DOM v7 (`^7.18.4`), Lucide React (`^1.47.0`), GIGW 3.0 Government Design System.
- **Backend & Database:** Supabase PostgreSQL 15, Row-Level Security (RLS), Realtime WebSocket subscriptions (`postgres_changes`), RPC stored procedures.
- **AI & Document Processing:** Google Gemini Multimodal Vision & OCR Engine, Client-side SHA-256 Web Crypto API, Gemini NLP Statutory Legal Summarizer.
- **Hosting & CI/CD:** Netlify Global Cloud CDN with automated branch deployment from GitHub repository (`https://github.com/TheGhostHacker-Ai/e-Nyayalaya`).

---

## 7. Conclusion & Impact

**e-Nyayalaya** establishes a transparent, tamper-evident digital case management infrastructure. By unifying police investigations, court trials, appellate reviews, and enforcement agencies within a single cryptographically audited framework, it delivers on the statutory vision of the **Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023)** and **Bharatiya Sakshya Adhiniyam (BSA, 2023)**, reducing case backlogs and securing electronic evidence for India's judicial future.
