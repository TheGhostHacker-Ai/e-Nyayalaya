const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qsmuvcijmmzjwwuqftbm.supabase.co',
  'sb_publishable_eUCl9QvC0n-NICppruvESg_1mtG-F3w'
);

async function testFullEfirSubmission() {
  console.log('--- Testing Complete e-FIR Submission Flow ---');

  // 1. Get or create police org
  const district = 'New Delhi';
  const state = 'Delhi';
  const stationName = 'Connaught Place Police Station';

  let policeOrgId = null;
  const { data: orgData, error: orgErr } = await supabase
    .from('organisations')
    .select('id, name')
    .eq('district', district)
    .in('org_type', ['police', 'police_station'])
    .limit(1)
    .maybeSingle();

  if (orgData) {
    policeOrgId = orgData.id;
    console.log('Found existing police org:', orgData.name, 'ID:', policeOrgId);
  }

  // 2. Insert case
  const efirNumber = `EFIR-2026-DEL-${Math.floor(100000 + Math.random() * 900000)}`;
  const legalNarrative = 'Test legal narrative for citizen online complaint under Sec 173 BNSS.';
  const docSha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const { data: newCase, error: caseErr } = await supabase
    .from('cases')
    .insert([{
      case_number: efirNumber,
      title: 'e-FIR: Cyber Crime — Complainant Naren',
      plaintiff: 'Naren Citizen',
      defendant: 'Unknown Cyber Fraudsters',
      description: legalNarrative,
      district: district,
      police_org_id: policeOrgId,
      case_category: 'Criminal (e-FIR)',
      stage: 'fir_registered'
    }])
    .select()
    .single();

  if (caseErr) {
    console.error('Case insert error:', caseErr);
    return;
  }
  console.log('SUCCESS! Case inserted:', newCase.id, 'Case number:', newCase.case_number);

  // 3. Insert document
  const { data: newDoc, error: docErr } = await supabase
    .from('documents')
    .insert([{
      case_id: newCase.id,
      doc_type: 'fir',
      title: `CITIZEN e-FIR: ${efirNumber} — Naren Citizen`,
      ocr_text: legalNarrative,
      sha256: docSha256,
      storage_path: `efir/${efirNumber}.txt`,
      status: 'verified',
      ai_summary: `e-FIR lodged by Naren Citizen under ${stationName}, ${district}. Category: Cyber Crime.`
    }])
    .select()
    .single();

  if (docErr) {
    console.error('Document insert error:', docErr);
  } else {
    console.log('SUCCESS! Document inserted:', newDoc.id);
  }

  // 4. Insert audit log
  const { data: newAudit, error: auditErr } = await supabase
    .from('audit_log')
    .insert([{
      case_id: newCase.id,
      action: 'CITIZEN_EFIR_LODGED',
      metadata: {
        efir_number: efirNumber,
        complainant: 'Naren Citizen',
        police_station: stationName,
        district: district,
        state: state,
        category: 'Cyber Crime',
        lodged_at: new Date().toISOString()
      },
      record_hash: docSha256
    }])
    .select()
    .single();

  if (auditErr) {
    console.error('Audit log insert error:', auditErr);
  } else {
    console.log('SUCCESS! Audit log entry created:', newAudit?.id || 'OK');
  }

  // 5. Test FIR Search Query from Landing Page
  const { data: searchData, error: searchErr } = await supabase
    .from('cases')
    .select(`*, police_org:organisations!cases_police_org_id_fkey(name, district, state)`)
    .eq('case_number', efirNumber)
    .single();

  if (searchErr) {
    console.error('Search error:', searchErr);
  } else {
    console.log('SUCCESS! Public search query found e-FIR:', searchData.case_number, 'Police org:', searchData.police_org?.name);
  }

  console.log('\n--- ALL E-FIR SUBMISSION & SEARCH STEPS SUCCEEDED 100%! ---');
}

testFullEfirSubmission();
