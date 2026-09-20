/**
 * server/routes/caseRecordPdf.js
 *
 * Generates a court-record PDF server-side with Puppeteer, using the
 * exact print template (order sheet / judgement) with case data
 * substituted in. No browser print dialog, no header/footer toggle,
 * no chance of the dashboard UI leaking into the output.
 *
 * npm install puppeteer
 */

import express from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Load the template once at startup, not per-request.
const TEMPLATE_PATH = path.join(process.cwd(), 'templates/court-record.html');
let templateHtml;
(async () => {
  templateHtml = await fs.readFile(TEMPLATE_PATH, 'utf-8');
})();

/**
 * Fill the template's placeholder markers with real case data.
 * Keep this in sync with the <!--REGION--> markers in the template file
 * (CAUSE_TITLE / PARTIES / META / BODY / OPERATIVE / CERTIFICATE from
 * the generation prompt) — or, simpler for a first pass, use literal
 * {{tokens}} in the HTML and replace them directly, as below.
 */
function fillTemplate(html, data) {
  return html
    .replace(/{{court_name}}/g, escapeHtml(data.courtName))
    .replace(/{{case_number}}/g, escapeHtml(data.caseNumber))
    .replace(/{{fir_reference}}/g, escapeHtml(data.firReference))
    .replace(/{{sections}}/g, escapeHtml(data.sections))
    .replace(/{{complainant}}/g, escapeHtml(data.complainant))
    .replace(/{{accused}}/g, escapeHtml(data.accused))
    .replace(/{{judge_name}}/g, escapeHtml(data.judgeName))
    .replace(/{{hearing_date}}/g, escapeHtml(data.hearingDate))
    .replace(/{{appearances}}/g, escapeHtml(data.appearances))
    .replace(/{{body_paragraphs}}/g, data.bodyParagraphsHtml) // pre-built <li> markup, trusted server-side content only
    .replace(/{{operative}}/g, data.operativeHtml)
    .replace(/{{sha256}}/g, escapeHtml(data.sha256))
    .replace(/{{signed_at}}/g, escapeHtml(data.signedAt))
    .replace(/{{audit_anchor}}/g, escapeHtml(data.auditAnchor));
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

router.get('/api/cases/:caseId/record.pdf', async (req, res) => {
  try {
    const caseId = req.params.caseId;

    // 1. Fetch the real case + session + judgement rows (Supabase, etc.)
    const data = await getCaseRecordData(caseId, req.user); // enforce your RLS/auth here too

    // 2. Fill the template
    const filledHtml = fillTemplate(templateHtml, data);

    // 3. Render to PDF with Puppeteer — no header/footer template supplied,
    //    so nothing extra is stamped on the page at all.
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(filledHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,   // <-- this is the whole fix
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    });

    await browser.close();

    // 4. Log the generation itself to your audit_log (who pulled this record, when)
    await logAudit({
      actorId: req.user.id,
      action: 'RECORD_PDF_GENERATED',
      caseId,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${data.caseNumber}-record.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation failed:', err);
    res.status(500).json({ error: 'Could not generate record PDF' });
  }
});

export default router;

// Stubs — wire these to your real Supabase queries and audit_log insert
async function getCaseRecordData(caseId, user) { /* ... */ }
async function logAudit(entry) { /* ... */ }
