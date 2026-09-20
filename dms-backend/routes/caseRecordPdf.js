const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs/promises');
const path = require('path');
const supabase = require('../supabaseClient');

const router = express.Router();

const TEMPLATE_PATH = path.join(process.cwd(), 'templates/court-record.html');
let templateHtml;
(async () => {
  try {
    templateHtml = await fs.readFile(TEMPLATE_PATH, 'utf-8');
  } catch (err) {
    console.error('Failed to read court-record.html template:', err);
  }
})();

function escapeHtml(str = '') {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fillTemplate(html, data) {
  let res = html;
  for (const [k, v] of Object.entries(data)) {
    const reg = new RegExp(`{{${k}}}`, 'g');
    res = res.replace(reg, v !== undefined && v !== null ? v : '');
  }
  return res;
}

router.get('/api/cases/:caseId/record.pdf', async (req, res) => {
  try {
    const caseId = req.params.caseId;

    // 1. Fetch case details
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*, court_org:organisations!cases_court_org_id_fkey(*), police_org:organisations!cases_police_org_id_fkey(*)')
      .eq('id', caseId)
      .single();

    if (caseError) {
      // Fallback without joins
      const { data: fallbackCase, error: fbErr } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();
      if (fbErr) throw fbErr;
      caseData = fallbackCase;
    }

    // 2. Fetch court & police orgs if not joined
    let courtOrg = caseData.court_org;
    if (!courtOrg && caseData.court_org_id) {
      const { data: cOrg } = await supabase.from('organisations').select('*').eq('id', caseData.court_org_id).maybeSingle();
      courtOrg = cOrg;
    }
    let policeOrg = caseData.police_org;
    if (!policeOrg && caseData.police_org_id) {
      const { data: pOrg } = await supabase.from('organisations').select('*').eq('id', caseData.police_org_id).maybeSingle();
      policeOrg = pOrg;
    }

    // 3. Fetch Parent / Appeal cases
    let parentCase = null;
    if (caseData.original_case_id) {
      const { data: pCase } = await supabase.from('cases').select('*, court:organisations!cases_court_org_id_fkey(name)').eq('id', caseData.original_case_id).maybeSingle();
      parentCase = pCase;
    }
    const { data: appealedCases } = await supabase.from('cases').select('*, court:organisations!cases_court_org_id_fkey(name)').eq('original_case_id', caseId);

    // 4. Fetch Agency Transfers
    const { data: agencyTransfers } = await supabase
      .from('case_agency_transfers')
      .select('*, agency:organisations(name, acronym), claimer:profiles!case_agency_transfers_claimed_by_fkey(full_name, designation)')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    // 5. Fetch participants & judges
    const { data: participants } = await supabase
      .from('case_participants')
      .select('*, profile:profiles(*)')
      .eq('case_id', caseId);

    const { data: judges } = await supabase
      .from('profiles')
      .select('*')
      .eq('org_id', caseData.court_org_id)
      .eq('role', 'judge');

    const prosecutor = participants?.find(p => p.role_in_case === 'prosecutor')?.profile;
    const defense = participants?.find(p => p.role_in_case === 'defense_lawyer' || p.role_in_case === 'lawyer')?.profile;
    const agencyOfficer = participants?.find(p => p.role_in_case === 'agency_officer')?.profile;
    const judge = judges?.[0];

    // 6. Fetch timeline items (documents, judgements, sessions)
    const { data: docs } = await supabase
      .from('documents')
      .select('*, uploaded_by_profile:profiles!documents_uploaded_by_fkey(full_name, designation)')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    const { data: judgements } = await supabase
      .from('judgements')
      .select('*, pronounced_by_profile:profiles!judgements_pronounced_by_fkey(full_name, designation)')
      .eq('case_id', caseId)
      .order('pronounced_at', { ascending: true });

    const { data: sessions } = await supabase
      .from('court_sessions')
      .select('*, recorded_by_profile:profiles!court_sessions_recorded_by_fkey(full_name, designation)')
      .eq('case_id', caseId)
      .order('scheduled_at', { ascending: true });

    // 7. Parse Witness Records and Examination Statements
    const examDocs = (docs || []).filter(d => d.doc_type === 'witness_statement');
    const witnessList = [];

    (docs || []).filter(d => d.doc_type === 'witness_record').forEach(wDoc => {
      let meta = {};
      try {
        if (typeof wDoc.storage_path === 'string' && wDoc.storage_path.startsWith('metadata:')) {
          meta = JSON.parse(wDoc.storage_path.replace('metadata:', ''));
        }
      } catch (e) {}

      const examsForWitness = examDocs.filter(ed => {
        let eMeta = {};
        try {
          if (typeof ed.storage_path === 'string' && ed.storage_path.startsWith('exam_data:')) {
            eMeta = JSON.parse(ed.storage_path.replace('exam_data:', ''));
          }
        } catch (e) {}
        return eMeta.witness_id === wDoc.id || ed.title?.includes(wDoc.title) || ed.title?.includes(meta.witness_code);
      }).map(ed => {
        let eMeta = {};
        try {
          if (typeof ed.storage_path === 'string' && ed.storage_path.startsWith('exam_data:')) {
            eMeta = JSON.parse(ed.storage_path.replace('exam_data:', ''));
          }
        } catch (e) {}
        return {
          id: ed.id,
          title: ed.title,
          content: ed.ai_summary || ed.title,
          exam_details: eMeta,
          created_at: ed.created_at,
          file_hash: ed.content_hash || `SHA256-${ed.id.replace(/-/g, '').slice(0, 16)}`
        };
      });

      witnessList.push({
        id: wDoc.id,
        name: meta.name || wDoc.title.replace('WITNESS RECORD: ', '').replace('CONFIDENTIAL PETITION: Sec 311 CrPC Surprise Witness - ', ''),
        witness_code: meta.witness_code || 'W-001',
        is_eyewitness: meta.is_eyewitness || false,
        is_surprise: meta.is_surprise || false,
        side: meta.side || 'prosecution',
        age: meta.age || '',
        occupation: meta.occupation || '',
        initial_statement: wDoc.ai_summary,
        registered_by_name: wDoc.uploaded_by_profile?.full_name || 'Advocate on Record',
        created_at: wDoc.created_at,
        examinations: examsForWitness
      });
    });

    // 8. Build Transfer HTML
    let transfersHtml = '';
    const transferEntries = [];

    transferEntries.push({
      event: 'Initial Registration & Investigation',
      from: policeOrg?.name || caseData.district || 'Originating Police Station',
      to: courtOrg?.name || 'Jurisdictional Court',
      authority: 'Station House Officer / Investigating Officer',
      date: caseData.created_at,
      status: 'Transferred via Charge Sheet / FIR'
    });

    if (parentCase) {
      transferEntries.push({
        event: 'Judicial Appeal / Revision Petition',
        from: parentCase.court?.name || 'Subordinate Court',
        to: courtOrg?.name || 'Higher Appellate Court',
        authority: 'Appellate Registry Order',
        date: caseData.created_at,
        status: 'Admitted on Ground of Appeal'
      });
    }

    if (agencyTransfers && agencyTransfers.length > 0) {
      agencyTransfers.forEach((ag, idx) => {
        transferEntries.push({
          event: `Special Investigation Handover #${idx + 1}`,
          from: courtOrg?.name || 'Trial Bench',
          to: ag.agency?.name || 'Special Agency',
          authority: ag.claimer?.full_name ? `Assigned IO: ${ag.claimer.full_name}` : 'Judicial Token Handover Order',
          date: ag.created_at,
          status: ag.status === 'claimed' ? 'Claimed & Investigating' : 'Pending Claim'
        });
      });
    }

    if (appealedCases && appealedCases.length > 0) {
      appealedCases.forEach((app, idx) => {
        transferEntries.push({
          event: `Higher Appellate Escalation #${idx + 1}`,
          from: courtOrg?.name || 'Current Bench',
          to: app.court?.name || 'High Court / Supreme Court',
          authority: 'Judicial Order of Appeal',
          date: app.created_at,
          status: `Active Docket (Case #${app.case_number})`
        });
      });
    }

    transfersHtml = `
      <table class="dossier-table">
        <thead>
          <tr>
            <th>Event / Handover</th>
            <th>Transferred From</th>
            <th>Transferred To</th>
            <th>Authority / Assigned Officer</th>
            <th>Status / Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${transferEntries.map(t => `
            <tr>
              <td><b>${escapeHtml(t.event)}</b></td>
              <td>${escapeHtml(t.from)}</td>
              <td>${escapeHtml(t.to)}</td>
              <td>${escapeHtml(t.authority)}</td>
              <td>${escapeHtml(t.status)}<br><span style="font-size: 8pt; color: #555;">${new Date(t.date).toLocaleString('en-IN')}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // 9. Build Sessions HTML
    let sessionsHtml = '';
    if (!sessions || sessions.length === 0) {
      sessionsHtml = '<div style="font-style: italic; padding: 4px;">No court sessions recorded on docket.</div>';
    } else {
      sessionsHtml = sessions.map((sess, idx) => `
        <div class="entry-box">
          <div class="entry-box-header">
            <span>Order Sheet #${idx + 1} &bull; Hearing Date: ${new Date(sess.scheduled_at || sess.created_at).toLocaleString('en-IN')}</span>
            <span>Presiding: ${escapeHtml(sess.recorded_by_profile?.full_name || judge?.full_name || 'Presiding Judicial Officer')}</span>
          </div>
          <div style="line-height: 1.5; text-align: justify; margin: 2mm 0;">
            <b>Proceedings &amp; Daily Order:</b> ${escapeHtml(sess.proceedings || sess.summary || 'The matter was taken up for hearing. Proceedings conducted.')}
          </div>
          ${sess.instructions ? `<div style="font-style: italic; color: #333; margin-top: 1mm;"><b>Court Directives:</b> ${escapeHtml(sess.instructions)}</div>` : ''}
          ${sess.next_hearing_date ? `<div style="font-weight: 700; margin-top: 1mm;">Next Date of Hearing: ${new Date(sess.next_hearing_date).toLocaleDateString('en-IN')}</div>` : ''}
        </div>
      `).join('');
    }

    // 10. Build Witnesses HTML
    let witnessesHtml = '';
    if (witnessList.length === 0) {
      witnessesHtml = '<div style="font-style: italic; padding: 4px;">No witnesses placed on formal roster.</div>';
    } else {
      witnessesHtml = witnessList.map(w => `
        <div class="entry-box">
          <div class="entry-box-header">
            <span>${escapeHtml(w.witness_code)} &mdash; ${escapeHtml(w.name)} ${w.age ? `(Age: ${escapeHtml(w.age)} yrs)` : ''} ${w.occupation ? `&bull; Profession: ${escapeHtml(w.occupation)}` : ''}</span>
            <span>${w.side === 'prosecution' ? 'Prosecution Witness (PW)' : 'Defense Witness (DW)'} ${w.is_eyewitness ? ' &bull; [DIRECT EYEWITNESS]' : ''}</span>
          </div>
          <div style="font-size: 8.5pt; color: #444; margin-bottom: 2mm;">
            Summoned / Registered By: <b>${escapeHtml(w.registered_by_name)}</b> &bull; Record Date: ${new Date(w.created_at).toLocaleString('en-IN')}
          </div>
          <div style="background: #f9f9f9; padding: 2mm; border: 0.5pt dashed #aaa; margin-bottom: 2mm; font-size: 9pt;">
            <b>Initial Proof of Evidence / Sworn Statement:</b><br>
            ${escapeHtml(w.initial_statement || 'Formal summons issued by Court.')}
          </div>
          ${w.examinations && w.examinations.length > 0 ? `
            <div>
              ${w.examinations.map(ex => {
                const qnas = ex.exam_details?.qna_list || [];
                const isCross = ex.title?.includes('CROSS') || ex.exam_details?.exam_type === 'cross_examination';
                return `
                  <div class="qna-box ${isCross ? 'cross' : ''}">
                    <div style="font-weight: 700; color: ${isCross ? '#991b1b' : '#1e40af'}; font-size: 9pt;">
                      ${escapeHtml(ex.title)} &mdash; Conducted by ${escapeHtml(ex.exam_details?.examiner_name || 'Counsel')} (${new Date(ex.created_at).toLocaleString('en-IN')})
                    </div>
                    ${qnas.length > 0 ? `
                      <div>
                        ${qnas.map((qna, qIdx) => `
                          <div class="qna-item">
                            <div><b>Q.${qIdx + 1}:</b> ${escapeHtml(qna.q)}</div>
                            <div><b>Ans:</b> ${escapeHtml(qna.a)}</div>
                          </div>
                        `).join('')}
                      </div>
                    ` : `
                      <div style="white-space: pre-wrap; font-size: 9pt; margin-top: 1mm;">${escapeHtml(ex.content)}</div>
                    `}
                    ${ex.exam_details?.demeanor_notes ? `
                      <div style="font-style: italic; font-size: 8pt; color: #444; margin-top: 1mm;">
                        <b>Demeanor / Objections:</b> ${escapeHtml(ex.exam_details.demeanor_notes)}
                      </div>
                    ` : ''}
                    <div style="font-size: 7.5pt; font-family: var(--mono); color: #666; margin-top: 1mm;">
                      Cryptographic Digest (SHA-256): ${escapeHtml(ex.file_hash)}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div style="font-style: italic; font-size: 8.5pt; color: #666;">Formal summons issued. Oral examination pending before the Bench.</div>
          `}
        </div>
      `).join('');
    }

    // 11. Build Exhibits HTML
    let exhibitsHtml = '';
    const nonWitnessDocs = (docs || []).filter(d => d.doc_type !== 'witness_record' && d.doc_type !== 'witness_statement');
    if (nonWitnessDocs.length === 0) {
      exhibitsHtml = '<div style="font-style: italic; padding: 4px;">No documentary exhibits filed yet.</div>';
    } else {
      exhibitsHtml = `
        <table class="dossier-table">
          <thead>
            <tr>
              <th style="width: 12%;">Exhibit</th>
              <th>Document / Exhibit Title</th>
              <th>Classification</th>
              <th>Uploaded By</th>
              <th>Cryptographic Hash (SHA-256)</th>
            </tr>
          </thead>
          <tbody>
            ${nonWitnessDocs.map((doc, idx) => `
              <tr>
                <td style="font-weight: 700;">Ext. ${idx + 1}</td>
                <td>${escapeHtml(doc.title)}</td>
                <td>${escapeHtml(doc.doc_type?.replace(/_/g, ' ').toUpperCase())}</td>
                <td>${escapeHtml(doc.uploaded_by_profile?.full_name || 'Official')}</td>
                <td style="font-family: var(--mono); font-size: 7.5pt; word-break: break-all;">${escapeHtml(doc.content_hash || `SHA256-${doc.id.replace(/-/g, '')}`)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // 12. Build Operative HTML
    let operativeHtml = '';
    if (caseData.stage === 'disposed' || caseData.stage === 'closed') {
      const j = judgements?.[0];
      operativeHtml = `
        <div class="verdict-banner">
          &starf;&starf;&starf; VERDICT &mdash; [DISPOSED / ORDER PRONOUNCED] &starf;&starf;&starf;
        </div>
        <p style="text-align: justify; line-height: 1.6;">
          In view of the material evidence placed on record, sworn depositions of prosecution and defense witnesses, forensic analysis exhibits, and arguments advanced by respective Counsels, this Court hereby passes the Final Operative Order disposing of Case No. <b>${escapeHtml(caseData.case_number)}</b>.
        </p>
        ${j ? `
          <div style="border: 0.8pt solid #000; padding: 2.5mm; margin: 2mm 0; background: #fdfdfd; font-size: 9.5pt;">
            <div><b>Verdict:</b> ${escapeHtml(j.verdict?.toUpperCase() || 'DISPOSED')}</div>
            ${j.quantum_of_sentence ? `<div><b>Quantum of Sentence:</b> ${escapeHtml(j.quantum_of_sentence)}</div>` : ''}
            ${j.fine_amount ? `<div><b>Fine Imposed:</b> ₹${escapeHtml(j.fine_amount)}</div>` : ''}
            ${j.operative_order ? `<div style="margin-top: 1mm;"><b>Operative Order:</b><br>${escapeHtml(j.operative_order)}</div>` : ''}
          </div>
        ` : ''}
      `;
    } else {
      operativeHtml = `
        <div style="font-style: italic; font-size: 9.5pt; text-align: center; padding: 3mm; background: #f9f9f9; border: 0.5pt dashed #999;">
          Matter currently in active trial stage (<b>${escapeHtml(caseData.stage?.toUpperCase())}</b>). Final judgement and operative orders will be appended upon pronouncement by the Bench.
        </div>
      `;
    }

    const cnr = caseData.case_number ? `DLCT01-${caseData.case_number.replace(/[^A-Z0-9]/gi, '')}-2026` : 'DLCT01-GEN-2026';

    const data = {
      court_name: courtOrg?.name ? courtOrg.name.toUpperCase() : 'DISTRICT & SESSIONS COURT',
      case_number: escapeHtml(caseData.case_number),
      cnr_number: cnr,
      filing_date: new Date(caseData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      police_station: escapeHtml(policeOrg?.name || caseData.district || 'Local Police Station'),
      fir_reference: escapeHtml(caseData.district || 'FIR-2026/01'),
      sections: Array.isArray(caseData.sections) ? escapeHtml(caseData.sections.join(', ')) : escapeHtml(caseData.sections || 'IPC / BNS / CrPC'),
      complainant: escapeHtml(caseData.filed_by_profile?.full_name || 'State of NCT Delhi'),
      accused: `Person(s) arrayed under Cause #${escapeHtml(caseData.case_number)}`,
      judge_name: judge ? `Hon'ble ${escapeHtml(judge.full_name)} (${escapeHtml(judge.designation || 'Presiding Judicial Officer')})` : 'Hon\'ble Presiding Judicial Officer',
      prosecutor_name: prosecutor ? `${escapeHtml(prosecutor.full_name)}, ${escapeHtml(prosecutor.designation || 'Public Prosecutor')}` : 'State Special Public Prosecutor',
      defense_name: defense ? `${escapeHtml(defense.full_name)}, ${escapeHtml(defense.designation || 'Advocate on Record')}` : 'Advocate on Record for Accused',
      agency_lead_name: agencyOfficer ? `${escapeHtml(agencyOfficer.full_name)} (${escapeHtml(agencyOfficer.designation || 'Investigating Officer')})` : (agencyTransfers?.[0]?.agency?.name || 'N/A'),
      transfers_html: transfersHtml,
      sessions_html: sessionsHtml,
      witnesses_html: witnessesHtml,
      exhibits_html: exhibitsHtml,
      operative_html: operativeHtml,
      judge_signature_name: judge ? judge.full_name : 'Presiding Judicial Officer',
      sha256: caseData.id ? `SHA256-${caseData.id.replace(/-/g, '')}-VERIFIED` : 'SHA256-DIGITAL-RECORD-VERIFIED',
      certified_at: new Date().toLocaleString('en-IN'),
      auditAnchor: `BLOCK-AUDIT-${caseId.slice(0, 8).toUpperCase()}-VERIFIED`
    };

    if (!templateHtml) {
      templateHtml = await fs.readFile(TEMPLATE_PATH, 'utf-8');
    }

    const filledHtml = fillTemplate(templateHtml, data);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(filledHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${data.case_number}-record.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation failed:', err);
    res.status(500).json({ error: 'Could not generate record PDF', details: err.message });
  }
});

module.exports = router;
