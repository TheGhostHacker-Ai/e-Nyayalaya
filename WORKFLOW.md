# WORKFLOW SPECIFICATION: e-Nyayalaya
## Complete Operational & Technical Lifecycle Guide
### Aligned with BNSS 2023, BNS 2023 & BSA 2023

---

## 1. Project Team & Key Responsibilities

- **Narendra Kumar** — Team Lead & Chief Architect *(System Design, State Engine, React 19 & Cloud CI/CD)*
- **Devesh Singh** — Compliance, Documentation & QA Lead *(Statutory Legal Workflows, GIGW 3.0 & QA)*
- **Nishant Maurya** — Security, Cryptography & Integrity Lead *(SHA-256 Hash Chaining, Tokens & RLS Policies)*
- **Pragati Jaiswal** — Database & Backend Engineer *(PostgreSQL Schemas, Triggers & Realtime RPCs)*
- **Arushi Bajpai** — AI/ML Integration Lead *(Google Gemini Vision & OCR Pipeline, NLP Legal Synthesis)*
- **Mushkan Dubey** — UI/UX & Frontend Experience Lead *(GIGW 3.0 Design Palette, Accessibility & Components)*

---

## 2. End-to-End Master Lifecycle Workflow

```mermaid
flowchart TD
    A([Citizen Lodges e-FIR]) --> B[Generate Client-Side SHA-256 Docket Hash & Tracking No]
    B --> C{Territorial Station Match?}
    
    C -- No (Jurisdictional Mismatch) --> D[Zero FIR Transfer under Sec 173(1) BNSS]
    D --> E[Receiving Police Station Inward Desk]
    
    C -- Yes (Competent Station) --> E
    
    E --> F[SHO Reviews e-FIR & Appoints Investigating Officer]
    F --> G[IO Records Section 180 BNSS Witness Depositions & Evidence]
    G --> H[Google Gemini Vision OCR & SHA-256 Cryptographic Sealing]
    H --> I[IO Prepares & Files Final Charge Sheet Sec 193 BNSS]
    
    I --> J[Judicial Magistrate / Sessions Court Takes Cognizance]
    J --> K[Schedule Hearing Sessions, Hear Bail Petitions & Examine Evidence]
    
    K --> L{Special Agency Transfer Ordered?}
    L -- Yes (High Court / Trial Court Order) --> M[Generate Single-Use Master Transfer Token]
    M --> N[CBI / NIA / ED Lead Claims Case via Token]
    N --> G
    
    L -- No --> O[Trial Concludes: Judge Pronounces Judgement]
    O --> P[Immutable Judgement Hash Written to Ledger]
    
    P --> Q{Appeal Filed in High Court?}
    Q -- Yes --> R[High Court Appellate Bench Takes Case on Roster]
    R --> S[High Court Inspects Lower Court Electronic Record & Issues Decree]
    S --> U{Apex Appeal to Supreme Court?}
    U -- Yes --> V[Supreme Court of India Takes Apex Docket on Roster]
    V --> W[Supreme Court Issues Final National Binding Decree]
    W --> T([Case Disposed & Archived in Public Ledger])
    U -- No --> T
    Q -- No --> T
```

---

## 3. Detailed Step-by-Step User Journeys

### Workflow 1: Citizen e-FIR Lodging & Tracking
1. **Initiation:** Citizen navigates to the public portal and clicks **"Register e-FIR"**.
2. **Step 1: Complainant Identification (Aadhaar Act 2016 Compliant):** Enters full name, phone number (OTP verified), email address, and official ID proof. In compliance with the **Aadhaar Act, 2016** and UIDAI circulars, raw 12-digit Aadhaar numbers are never collected; users provide masked Aadhaar (last 4 digits: `XXXX-XXXX-1234`) or alternate national IDs (Voter ID, DL, Passport, PAN).
3. **Step 2: Incident Classification & Jurisdictional Selection:**
   - Selects State (e.g. *Uttar Pradesh*), District (e.g. *Lucknow*), and territorial Police Station (from 1,900+ UP directory, expandable to all 36 States & UTs).
   - Selects incident category (*Cyber Crime, Theft, Physical Assault, Financial Fraud, etc.*).
   - Inputs incident date, time, and specific location.
4. **Step 3: Narrative & Accused Particulars:**
   - Details the sequence of events and names any known suspects or physical descriptions.
   - Uploads supporting digital attachments (images, PDFs, transaction receipts).
5. **Cryptographic Docket Creation:**
   - Web Crypto API generates a unique **SHA-256 fingerprint** of the entire filing payload.
   - Database registers case with prefix `EFIR-YYYY-XXXX` in stage `fir_registered`.
   - Citizen receives an official printable acknowledgment receipt containing the tracking number and cryptographic verification hash.
6. **Public Tracking:** Citizens track the real-time stage of their e-FIR at any time using the **View / Track FIR** lookup modal.

---

### Workflow 2: Police Station House Officer (SHO) & Investigating Officer (IO)
1. **Intake Queue:** Police Officer logs in with station credentials and opens **"Citizen e-FIRs"** inward desk.
2. **Action Decision:**
   - **Accept & Convert to Active Investigation:**
     - Appoints an assigned Investigating Officer (IO) with name, badge number, and statutory directive.
     - Case stage updates to `under_investigation`.
   - **Zero FIR Jurisdictional Handover (BNSS Sec 173(1)):**
     - If the incident occurred outside territorial limits, selects receiving State, District, and target Police Station.
     - System automatically generates a **Zero FIR Handover Order**, records an immutable audit trail entry, updates case stage to `transferred`, and retains the case in the transferring station's **Transferred Cases** roster.
3. **Investigating Officer Field Work:**
   - **Witness Statements (Sec 180 BNSS):** IO records witness statements, witness relation, and identification documents directly on the case timeline.
   - **Digital Evidence Ingestion:** IO uploads CCTV footage, seizure memos, and forensic certificates. Google Gemini Vision extracts text; SHA-256 checksums are recorded for Section 63 BSA compliance.
4. **Filing Police Report / Charge Sheet (Sec 193 BNSS):**
   - IO synthesizes gathered evidence and witness records into a final charge sheet under Section 193 BNSS (renumbered from Section 173 of the erstwhile CrPC).
   - Selects designated District Court / Chief Judicial Magistrate (CJM) Court and specifies applicable BNS sections.
   - The case is transmitted to the court's judicial queue with stage `in_trial`.

---

### Workflow 3: Trial & District Court Judicial Proceedings
1. **Cognizance & Judicial Docketing:**
   - Chief Judicial Magistrate / District Judge reviews the inward police charge sheet under Section 193 BNSS.
   - System registers the formal judicial trial docket.
2. **Hearing Scheduling & Bail Proceedings:**
   - Court Clerk / Judge schedules hearing dates and logs participant presence.
   - Bench records interim orders, bail grant/rejection memos, and procedural directives.
3. **Evidence Admissibility & Exclusive Statutory Revocation:**
   - Judge reviews all prosecution and defense document filings under BSA 2023.
   - If an evidence item is disputed or found inadmissible under Section 63 of BSA 2023, the Judge exercises exclusive statutory authority to **Revoke Evidence**, requiring a mandatory statutory justification which is permanently sealed into the audit log.
4. **Judgement Pronouncement:**
   - Judge drafts and signs the final decree/verdict.
   - Generates an immutable judgement hash and seals the docket with stage `disposed`.

---

### Workflow 4: Inter-Agency Jurisdictional Transfer (CBI, NIA, ED, CID, SFIO)
1. **Transfer Trigger:** Trial Court or High Court orders transfer of a high-profile case to a specialized investigation body (e.g. *Central Bureau of Investigation* or *National Investigation Agency*).
2. **Token Generation:**
   - The Judge / Bench initiates transfer from the **Agency Transfer Directory**.
   - System creates a row in `case_agency_transfers` with a cryptographically randomized **Master Transfer Token** (e.g. `TRF-NIA-9842-7104`) and status `pending`.
3. **Agency Claim & Custody Assumption:**
   - Agency Lead logs into the portal using the **Agency Claim** tab and enters the secure transfer token.
   - System verifies the token, binds the agency administrator to the case, updates transfer status to `claimed`, and grants full operational custody to the agency while retaining historical audit logs.

---

### Workflow 5: Appellate High Court & Supreme Court Review
1. **Appellate Filing:** Legal counsel or aggrieved party files a First Appeal / Special Leave Petition (SLP) against a subordinate court's judgement.
2. **Record Inspection:** High Court / Supreme Court bench calls for lower court case diaries, witness depositions, and forensic records without requiring physical transmission of paper files across all 36 States & UTs.
3. **Appellate Ruling:** High Court issues its decree, affirming, modifying, or reversing the lower court decision with full cryptographic audit logging.

---

## 4. System State Transitions Matrix

| Current Stage | Event / Action | Permitted Role | Next Stage | Audit Log Action |
| :--- | :--- | :--- | :--- | :--- |
| *None* | Citizen lodges e-FIR | Citizen / Public | `fir_registered` | `EFIR_CITIZEN_LODGED` |
| `fir_registered` | Station accepts e-FIR & appoints IO | Police SHO | `under_investigation` | `POLICE_EFIR_ACCEPTED_IO_APPOINTED` |
| `fir_registered` | Zero FIR Jurisdictional Handover (Sec 173(1)) | Police SHO | `transferred` | `ZERO_FIR_STATION_TRANSFERRED` |
| `under_investigation` | IO records witness examination (Sec 180) | Investigating Officer | `under_investigation` | `WITNESS_STATEMENT_RECORDED_SEC180` |
| `under_investigation` | IO submits evidence document | Investigating Officer | `under_investigation` | `DOCUMENT_EVIDENCE_UPLOADED` |
| `under_investigation` | IO files Final Charge Sheet (Sec 193) | Investigating Officer | `in_trial` | `POLICE_CHARGE_SHEET_FORWARDED_TO_COURT` |
| `in_trial` | Case transferred to Special Agency | Trial / High Court Judge | `in_trial` (Agency Custody)* | `CASE_AGENCY_TRANSFER_INITIATED` |
| `in_trial` | Evidence revoked under statutory authority | Judge | `in_trial` | `JUDGE_EVIDENCE_REVOKED` |
| `in_trial` | Judge pronounces final verdict | Judge | `disposed` | `JUDICIAL_JUDGEMENT_PRONOUNCED` |
| `disposed` | Appeal filed in High Court | Legal Counsel / Judge | `appealed` | `HIGH_COURT_APPEAL_ADMITTED` |
| `appealed` / `disposed` | Apex Appeal filed in Supreme Court | Legal Counsel / Judge | `appealed` | `SUPREME_COURT_APPEAL_ADMITTED` |

*\*Note on State Persistence: `"in_trial (Agency Custody)"` is an operational descriptor surfaced in the UI via `case_agency_transfers` while the underlying database enum retains `in_trial` for schema consistency with PostgreSQL enum constraints.*

---

## 5. Security & Cryptographic Verifications

### Mathematical Integrity Formula (Chained Audit Ledger)
$$\text{Block Hash}_i = \text{SHA-256}\left(\text{Case ID} \parallel \text{Doc ID} \parallel \text{Actor ID} \parallel \text{Action} \parallel \text{Payload Hash} \parallel \text{PreviousHash}_{i-1} \parallel \text{ISO Timestamp}\right)$$

This recursive mathematical chaining ensures that deleting, inserting, or altering any past record invalidates every succeeding hash in the ledger, making illicit database modifications mathematically impossible to hide under Section 63 of the Bharatiya Sakshya Adhiniyam (BSA, 2023).
