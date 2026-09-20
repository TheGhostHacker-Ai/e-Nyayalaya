# PROJECT REPORT: e-Nyayalaya
## Unified Tamper-Evident Digital Case Record Grid & e-Courts Management System
### Designed for Smart India Hackathon (SIH 26190) | Aligned with BNSS 2023, BNS 2023 & BSA 2023

---

## 1. Executive Summary & Team Information

**e-Nyayalaya** is an enterprise-grade, cryptographically verifiable, tamper-evident judicial and police case record management grid designed to modernize and unify India's criminal and civil justice system under the **Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023)**, **Bharatiya Nyaya Sanhita (BNS, 2023)**, and **Bharatiya Sakshya Adhiniyam (BSA, 2023)**.

The platform eliminates systemic delay, evidence tampering, and jurisdictional friction by creating a continuous, SHA-256 hash-chained digital custody record connecting:
1. **Citizens** (via verified online e-FIR lodging & real-time tracking),
2. **Police Stations & Investigating Officers** (1,900+ police stations directory with Zero FIR jurisdictional routing),
3. **Subordinate Judicial Magistrate & Sessions Courts** (charge sheet cognizance, trial proceedings, bail & hearings),
4. **Appellate High Courts & The Supreme Court of India** (appellate transfers, SLPs, and record call-ups),
5. **Specialized National & State Enforcement Agencies** (CBI, NIA, ED, CID, SFIO, DRI, NCB).

---

### Project Leadership & Team Roster

| Name | Role & Responsibility | Core Focus Areas |
| :--- | :--- | :--- |
| **Narendra Kumar** | **Team Lead & Chief Architect** | System Architecture, Full-Stack Integration, Netlify & Supabase Cloud Grid, Multi-tier Judicial State Engine |
| **Devesh Singh** | **Compliance, Documentation & QA Lead** | Statutory BNSS/BNS/BSA Alignment, GIGW 3.0 Compliance, Security Auditing & QA Test Engineering |
| **Nishant Maurya** | **Security, Cryptography & Integrity Lead** | SHA-256 Hash Chaining, Tamper-Evident Audit Trails, Cryptographic Token Transits & Zero-Trust RLS Policies |
| **Pragati Jaiswal** | **Database & Backend Engineer** | Supabase/PostgreSQL Relational Schema, Triggers, RPC Procedures, Spatial Filtering & Real-time Subscriptions |
| **Arushi Bajpai** | **AI/ML Integration Lead** | Tesseract OCR Pipeline, Legal NLP Summarization, Automated Charge Sheet Drafting & Crime Pattern Analysis |
| **Mushkan Dubey** | **UI/UX & Frontend Experience Lead** | National Portal Theming, Accessibility (High Contrast/Font Scaling), Responsive Roster Tables & React Components |

---

## 2. Problem Statement & Legal Mandate

### The Challenge in Existing Systems
- **Jurisdictional Delays (Zero FIR Delays):** FIRs lodged outside the territorial jurisdiction of a police station experience physical transit delays and bureaucratic bottlenecks.
- **Evidence Tampering & Chain-of-Custody Breakdowns:** Physical case diaries and paper documents lack mathematical proof of integrity, making them vulnerable to post-facto alterations.
- **Inter-Agency Data Silos:** Handing over cases from State Police to central agencies (CBI, NIA, ED) or transitioning cases from Subordinate Courts to High Courts requires physical paper transmission.
- **Citizen Friction:** Citizens struggle to track the statutory progress of their complaints once lodged.

### The Statutory Legal Solution
- **Section 173(1) BNSS (Zero FIR & Electronic Information):** Mandates the recording of electronic information irrespective of jurisdiction and timely forwarding to the competent station.
- **Section 193 BNSS / Section 173 CrPC (Police Report / Charge Sheet):** Mandates structured submission of investigation findings and digital document grids to the Judicial Magistrate upon completion.
- **Section 63 & 65B BSA (Admissibility of Electronic Records):** Enforces cryptographic hashing (SHA-256) and immutable audit timestamps to guarantee digital evidence admissibility without alteration.

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
 │   ┌───────────────────────┐   ┌────────────────────────┐   ┌───────────────────────────────────────┐   │
 │   │  POLICE INVESTIGATION │   │  TRIAL & DISTRICT CRT  │   │     APPELLATE HIGH / SUPREME COURT    │   │
 │   │  - Zero FIR Routing   │   │  - Cognizance Review   │   │  - Direct Appeal Records Inward       │   │
 │   │  - IO Assignment      │──►│  - Charge Sheet Trial  │──►│  - Lower Bench Record Inspection      │   │
 │   │  - Witness Exam (S180)│   │  - Bail / Session Log  │   │  - Constitutional Order Generation    │   │
 │   │  - Evidence Lockbox   │   │  - Evidence Admissib.  │   │  - Judgement Hash Signing             │   │
 │   └───────────┬───────────┘   └───────────┬────────────┘   └───────────────────┬───────────────────┘   │
 │               │                           │                                    │                       │
 │               │                           ▼                                    │                       │
 │               │           ┌────────────────────────────────┐                   │                       │
 │               │           │   SPECIALIZED ENFORCEMENT HQ   │                   │                       │
 │               └──────────►│   (CBI / NIA / ED / CID / SFIO)│◄──────────────────┘                       │
 │                           │   - Cryptographic Single-Use   │                                           │
 │                           │     Master Claim Token Transit │                                           │
 │                           └────────────────────────────────┘                                           │
 │                                                                                                        │
 └────────────────────────────────────────────┬───────────────────────────────────────────────────────────┘
                                              │ Real-Time WebSocket & REST (RLS Protected)
                                              ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                             SUPABASE POSTGRESQL & CRYPTOGRAPHIC LEDGER                                 │
 ├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │  • Tables: cases, documents, audit_log, case_participants, case_agency_transfers, court_sessions       │
 │  • Security: Row Level Security (RLS) by cadre, organization ID, and participation tokens             │
 │  • Integrity: Cryptographic SHA-256 Hash Chain verification trigger & Audit Trail Ledger              │
 │  • AI/OCR: Automated document text extraction, charge sheet synthesizer, and statutory summary engine   │
 └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Functional Modules & Implementation Details

### 4.1. Citizen e-FIR Inward Desk & Zero FIR Handover
- **3-Step Filing Wizard:** Citizens provide incident category, location, dynamic State-to-District-to-Station selection (from 1,900+ UP and National police stations), suspect details, and incident narration.
- **Client-Side SHA-256 Docket Hashing:** Before uploading, the incident record is digested into a unique SHA-256 fingerprint displayed on the citizen's statutory tracking receipt.
- **Jurisdictional Handover (Zero FIR):** When an e-FIR is registered at Station A but belongs to Station B, Station A can execute an automated Zero FIR Transfer under BNSS Section 173(1), creating an official handover memo, linking the receiving station, and maintaining transparency in the Transferred Cases roster.

### 4.2. Investigating Officer (IO) Cadre & Witness Examination (Sec 180 BNSS)
- **Investigating Officer Assignment:** Station House Officers (SHO) can officially appoint an Investigating Officer with an operational directive and badge number.
- **Section 180 BNSS Witness Examination:** Sub-Inspectors can record witness statements, ID proof type, examination notes, and attach verified evidence records directly to the case timeline.
- **Tamper-Evident Evidence Vault:** Physical and digital evidence items (CCTV footage, seizure memos, forensic reports) are hashed upon upload with OCR extraction and verified badges.

### 4.3. Automated Final Charge Sheet Generation (BNSS Sec 193 / CrPC Sec 173)
- IOs can file final investigation findings directly to the designated Judicial Magistrate or Sessions Court.
- Generates structured statutory narratives, applies relevant BNS/IPC sections, and transitions the case from `under_investigation` to `in_trial`.

### 4.4. Multi-Tier Judicial Docketing & Court Hearings
- **Trial Courts (District & Sessions):** Schedule daily court hearing sessions, log judicial orders, record bail decisions, and pronounce judgements.
- **Judicial Evidence Revocation Power:** Judges hold exclusive constitutional authority to approve or revoke disputed evidence from the docket with statutory reasons recorded in the immutable audit log.
- **High Court & Supreme Court Appellate Grid:** Appellate judges can view appealed dockets from subordinate courts across 30 States & UTs, inspect lower court evidence trails, and issue appellate decrees.

### 4.5. Inter-Agency Jurisdictional Transfer (CBI, NIA, ED, CID, SFIO)
- Allows Judges and High Courts to order specialized investigation transfers to national bodies.
- Generates a **Single-Use Cryptographic Transfer Token** (e.g. `TRF-CBI-XXXX-YYYY`).
- Agency Leads claim custody via the token, automatically transferring access to the agency command while preserving the complete preceding chain of custody.

---

## 5. Security, Cryptography & Compliance

### 5.1. Cryptographic SHA-256 Hash Chaining
Every document, e-FIR record, witness deposition, and transfer memo is cryptographically digested using SHA-256:
$$\text{Record Hash} = \text{SHA-256}(\text{Case ID} \parallel \text{Timestamp} \parallel \text{Actor} \parallel \text{Content})$$

The hash is stored alongside the record and published in the immutable `audit_log` ledger, ensuring that any unauthorized database alteration is immediately detectable upon mathematical verification.

### 5.2. Row Level Security (RLS) & Access Control Matrix

| Role | Cases Access Scope | Evidence Upload | Judgement Pronouncement | Agency Transfer Claim |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen** | Public e-FIR Tracking | Filing Only | Read Public Judgements | ❌ No Access |
| **Police SHO** | Territorial Station Cases | ✅ Yes | ❌ No Access | ❌ No Access |
| **Investigating Officer** | Assigned Investigation Dockets | ✅ Yes (Sec 180 BNSS) | ❌ No Access | ❌ No Access |
| **Trial Court Judge** | Subordinate Judicial Court Docket | ✅ Review & Revoke | ✅ Yes (Cognizance & Decrees) | ✅ Initiate Transfer |
| **High Court Judge** | State-Wide & Appellate Dockets | ✅ Review & Revoke | ✅ Yes (Appellate Decrees) | ✅ Initiate Transfer |
| **Agency Lead (CBI/NIA)** | Transferred Cases Only | ✅ Yes | ❌ No Access | ✅ Yes (Token Claim) |
| **Legal Counsel** | Retained Cases via Bar Token | ✅ Submissions | ❌ No Access | ❌ No Access |

---

## 6. Technical Stack & Deployment

- **Frontend Framework:** React 18, Vite 8, React Router v6, Lucide Icons, Vanilla CSS GIGW 3.0 Theme.
- **Backend & Realtime Database:** Supabase (PostgreSQL 15), Realtime WebSocket subscriptions, Row-Level Security, Database RPC Functions.
- **AI / Document Processing:** Tesseract OCR Engine, Client-side SHA-256 Web Crypto API, Natural Language Statutory Summarizer.
- **Hosting & CI/CD:** Netlify Automated Cloud Build from GitHub repository (`https://github.com/TheGhostHacker-Ai/e-Nyayalaya`).

---

## 7. Conclusion & Impact

**e-Nyayalaya** establishes a transparent, tamper-proof, and fast digital backbone for the Indian judicial ecosystem. By seamlessly uniting police investigations, court trials, appellate reviews, and enforcement agencies within a single cryptographically audited framework, it fulfills the digital vision of the **Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023)** and significantly enhances access to justice for millions of citizens.
