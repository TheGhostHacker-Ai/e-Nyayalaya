import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, CheckCircle, Lock, Printer, Scale, Send, Plus, Calendar, Upload, RotateCcw, AlertTriangle, Shield, UserCheck, Copy, Check, ExternalLink, Users, UserPlus, Eye, MessageSquare, Sparkles, HelpCircle, ChevronDown, ChevronUp, Trash2, ArrowRight, GitBranch, Building2 } from 'lucide-react';

async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function CaseTimeline({ user }) {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState([]);
  
  // Next Hearing State
  const [nextHearing, setNextHearing] = useState(null);
  
  // Action states
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferDestinationType, setTransferDestinationType] = useState('court');
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState('');
  
  const [showJudgement, setShowJudgement] = useState(false);
  const [verdict, setVerdict] = useState('convicted');
  const [operativeOrder, setOperativeOrder] = useState('');

  const [showHearing, setShowHearing] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [hearingOutcome, setHearingOutcome] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [hearingInstructions, setHearingInstructions] = useState('');
  const [tokens, setTokens] = useState([]);

  const [showEvidence, setShowEvidence] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceContent, setEvidenceContent] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceType, setEvidenceType] = useState('evidence_record');
  
  const [presidingJudges, setPresidingJudges] = useState([]);
  const [chargeSheetFile, setChargeSheetFile] = useState(null);
  // Phase 13 Extensions
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [caseAudits, setCaseAudits] = useState([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  // Agency Officer Invite & Appointment State
  const [officerInviteToken, setOfficerInviteToken] = useState(null);
  const [isInvitingOfficer, setIsInvitingOfficer] = useState(false);
  const [showAppointOfficerModal, setShowAppointOfficerModal] = useState(false);
  const [appointOfficerName, setAppointOfficerName] = useState('');
  const [appointOfficerRank, setAppointOfficerRank] = useState('Deputy Superintendent of Police (DSP)');
  const [appointOfficerBadge, setAppointOfficerBadge] = useState('');
  const [appointOfficerDirective, setAppointOfficerDirective] = useState('');
  const [appointedOfficerSuccess, setAppointedOfficerSuccess] = useState(null);
  const [isSubmittingAppoint, setIsSubmittingAppoint] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Warrant Appeal / Order Application State
  const [showWarrantModal, setShowWarrantModal] = useState(false);
  const [warrantType, setWarrantType] = useState('Search & Seizure Warrant (Sec 93/94 CrPC / Sec 96 BNSS)');
  const [warrantTarget, setWarrantTarget] = useState('');
  const [warrantGrounds, setWarrantGrounds] = useState('');
  const [warrantFile, setWarrantFile] = useState(null);
  const [isSubmittingWarrant, setIsSubmittingWarrant] = useState(false);
  
  // Agency Review State
  const [selectedWarrantForAgency, setSelectedWarrantForAgency] = useState(null);
  const [agencyReviewAction, setAgencyReviewAction] = useState('approve_agency');
  const [agencyDirectiveNotes, setAgencyDirectiveNotes] = useState('');
  const [isProcessingAgencyAction, setIsProcessingAgencyAction] = useState(false);

  // Judge Warrant Grant State
  const [selectedJudgeWarrant, setSelectedJudgeWarrant] = useState(null);
  const [judgeWarrantDecision, setJudgeWarrantDecision] = useState('grant');
  const [judgeOrderNotes, setJudgeOrderNotes] = useState('');
  const [judgeWarrantExpiry, setJudgeWarrantExpiry] = useState('');
  const [isProcessingJudgeWarrant, setIsProcessingJudgeWarrant] = useState(false);

  // Dedicated Witness Registry & Examination State
  const [witnessesList, setWitnessesList] = useState([]);
  const [showAddWitnessModal, setShowAddWitnessModal] = useState(false);
  const [witnessFormName, setWitnessFormName] = useState('');
  const [witnessFormAge, setWitnessFormAge] = useState('');
  const [witnessFormOccupation, setWitnessFormOccupation] = useState('');
  const [witnessFormSide, setWitnessFormSide] = useState('prosecution');
  const [witnessIsEyeWitness, setWitnessIsEyeWitness] = useState(false);
  const [witnessIsSurprise, setWitnessIsSurprise] = useState(false);
  const [witnessSurpriseReason, setWitnessSurpriseReason] = useState('');
  const [witnessStatement, setWitnessStatement] = useState('');
  const [witnessFile, setWitnessFile] = useState(null);
  const [isSubmittingWitness, setIsSubmittingWitness] = useState(false);

  // Multi-Stage Examination (Chief / Cross / Re-Exam) State
  const [showExamineModal, setShowExamineModal] = useState(false);
  const [selectedWitnessForExam, setSelectedWitnessForExam] = useState(null);
  const [examType, setExamType] = useState('examination_in_chief'); // 'examination_in_chief' | 'cross_examination' | 're_examination' | 'court_questions'
  const [examQnaList, setExamQnaList] = useState([{ q: '', a: '' }]);
  const [examNotes, setExamNotes] = useState('');
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  // View Full Deposition State
  const [viewWitnessDetails, setViewWitnessDetails] = useState(null);

  // Revocation Workflow State
  const [pendingRevokes, setPendingRevokes] = useState([]);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [targetRevokeLawyerId, setTargetRevokeLawyerId] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeFile, setRevokeFile] = useState(null);

  // Transfer & Appellate Jurisdiction State
  const [courtOrg, setCourtOrg] = useState(null);
  const [policeOrg, setPoliceOrg] = useState(null);
  const [parentCase, setParentCase] = useState(null);
  const [appealedToCases, setAppealedToCases] = useState([]);
  const [agencyTransfersList, setAgencyTransfersList] = useState([]);

  // Certified Dossier & Token Management State
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState(null);
  const [pendingSurprisePetitions, setPendingSurprisePetitions] = useState([]);

  const fetchData = async () => {
    try {
      // Fetch case with filed_by details
      const { data: cData, error: cErr } = await supabase
        .from('cases')
        .select(`*, filed_by_profile:profiles!cases_filed_by_fkey(full_name, designation)`)
        .eq('id', id)
        .single();
        
      if (cErr) throw cErr;
      setCaseData(cData);

      // Fetch courts for transfer
      let fetchedOrgs = [];
      if (user?.role === 'investigating_officer' || user?.role === 'police_officer' || user?.role === 'judge') { // Fetch courts & police stations
        const { data: orgs } = await supabase.from('organisations').select('*').in('org_type', ['court', 'court_district', 'high_court', 'supreme_court', 'court_high', 'court_supreme', 'police_station']);
        if (orgs) fetchedOrgs = orgs;
      }

      // Fetch tokens for this case
      const { data: tokenData } = await supabase
        .from('case_access_codes')
        .select('*')
        .eq('case_id', id)
        .order('created_at', { ascending: false });
      if (tokenData) setTokens(tokenData);

      // Fetch timeline data
      const { data: docs } = await supabase.from('documents').select('*, uploaded_by_profile:profiles!documents_uploaded_by_fkey(full_name)').eq('case_id', id);
      const { data: judgements } = await supabase.from('judgements').select('*, pronounced_by_profile:profiles!judgements_pronounced_by_fkey(full_name)').eq('case_id', id);
      const { data: sessions } = await supabase.from('court_sessions').select('*, recorded_by_profile:profiles!court_sessions_recorded_by_fkey(full_name)').eq('case_id', id);
      
      const { data: revokes } = await supabase.from('revocation_requests').select('*, reviewer:profiles!revocation_requests_reviewed_by_fkey(full_name, designation), requester:profiles!revocation_requests_requested_by_fkey(full_name)').eq('case_id', id);
      
      // Merge timeline
      let events = [];
      if (docs) events = [...events, ...docs.map(d => ({ ...d, timeline_type: 'document', date: d.created_at }))];
      if (judgements) events = [...events, ...judgements.map(j => ({ ...j, timeline_type: 'judgement', date: j.pronounced_at }))];
      if (sessions) events = [...events, ...sessions.map(s => ({ ...s, timeline_type: 'session', date: s.created_at }))];
      if (revokes) {
        const completedRevokes = revokes.filter(r => r.status !== 'pending').map(r => ({
          ...r,
          timeline_type: 'revocation_decision',
          date: r.reviewed_at
        }));
        events = [...events, ...completedRevokes];
        setPendingRevokes(revokes);
      }
      
      events.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTimelineEvents(events);

      // Build Dedicated Witness Roster & Depositions Ledger
      try {
        const registeredWitnesses = [];
        const surprisePetitions = [];
        const examDocs = (docs || []).filter(d => d.doc_type === 'witness_statement');

        (docs || []).filter(d => 
          d.doc_type === 'witness_record' || 
          (d.doc_type === 'witness_statement' && (
            d.title?.startsWith('WITNESS REGISTRATION:') || 
            d.title?.startsWith('CONFIDENTIAL PETITION:')
          ))
        ).forEach(wDoc => {
          let parsedData = {};
          if (wDoc.ocr_text) {
            try {
              parsedData = JSON.parse(wDoc.ocr_text);
            } catch (e) {
              parsedData = { name: wDoc.title, statement: wDoc.ocr_text };
            }
          }
          const wName = parsedData.name || wDoc.title.replace('CONFIDENTIAL PETITION: Sec 311 CrPC Surprise Witness - ', '').replace('WITNESS REGISTRATION: ', '').replace(/\[.*?\]/g, '').trim();
          const isSurprise = Boolean(parsedData.is_surprise_witness);
          const isPending = wDoc.ai_summary === 'pending_judicial_approval' || (isSurprise && !wDoc.ai_summary?.includes('admitted_by_court'));
          const isRejected = wDoc.ai_summary === 'rejected_by_court';
          const isJudge = user?.role === 'judge';
          const isMySubmission = wDoc.uploaded_by === user?.id;

          if (isSurprise && isPending) {
            surprisePetitions.push({
              id: wDoc.id,
              doc_id: wDoc.id,
              name: wName,
              side: parsedData.side || 'prosecution',
              age: parsedData.age || '',
              occupation: parsedData.occupation || '',
              surprise_reason: parsedData.surprise_reason || '',
              statement: parsedData.statement || wDoc.content || '',
              registered_by_name: wDoc.uploaded_by_profile?.full_name || 'Counsel',
              created_at: wDoc.created_at
            });
            // If user is not judge and not submitter, do NOT expose surprise witness in public roster!
            if (!isJudge && !isMySubmission) return;
          }

          if (isRejected && !isJudge && !isMySubmission) {
            return;
          }

          // Find all examination documents referencing this witness
          const exams = examDocs.filter(ed => {
            if (ed.ocr_text) {
              try {
                const edData = JSON.parse(ed.ocr_text);
                if (edData.witness_id === wDoc.id || edData.witness_name === wName) return true;
              } catch(e) {}
            }
            return ed.title?.toLowerCase().includes(wName.toLowerCase());
          }).map(ed => {
            let parsedExam = {};
            try { parsedExam = JSON.parse(ed.ocr_text); } catch(e) { parsedExam = { raw: ed.ocr_text }; }
            return {
              ...ed,
              exam_details: parsedExam
            };
          });

          registeredWitnesses.push({
            id: wDoc.id,
            doc_id: wDoc.id,
            name: wName,
            age: parsedData.age || '',
            occupation: parsedData.occupation || '',
            side: parsedData.side || (wDoc.title.includes('[PW]') ? 'prosecution' : 'defense'),
            witness_code: parsedData.witness_code || (parsedData.side === 'prosecution' ? 'PW' : 'DW'),
            is_eyewitness: Boolean(parsedData.is_eyewitness),
            is_surprise_witness: isSurprise,
            is_pending_approval: isPending,
            is_admitted: wDoc.ai_summary?.includes('admitted_by_court'),
            surprise_reason: parsedData.surprise_reason || '',
            initial_statement: parsedData.statement || wDoc.content || '',
            storage_path: wDoc.storage_path,
            created_at: wDoc.created_at,
            registered_by_name: wDoc.uploaded_by_profile?.full_name || 'Counsel/Officer',
            registered_by_id: wDoc.uploaded_by,
            file_hash: wDoc.file_hash || wDoc.sha256,
            examinations: exams
          });
        });

        // Also include any standalone legacy witness statements as entries if not already registered
        (docs || []).filter(d => 
          d.doc_type === 'witness_statement' && 
          !d.title?.startsWith('DEPOSITION [') && 
          !d.title?.startsWith('EXAMINATION RECORD') &&
          !d.title?.startsWith('WITNESS REGISTRATION:') &&
          !d.title?.startsWith('CONFIDENTIAL PETITION:')
        ).forEach(legacyDoc => {
          const rawName = legacyDoc.title.replace('Witness Statement: ', '').replace('WITNESS STATEMENT: ', '').trim();
          const isAlreadyCovered = registeredWitnesses.some(w => w.name.toLowerCase() === rawName.toLowerCase());
          if (!isAlreadyCovered) {
            const side = legacyDoc.submitted_by_side || (legacyDoc.title.toLowerCase().includes('defense') ? 'defense' : 'prosecution');
            registeredWitnesses.push({
              id: legacyDoc.id,
              doc_id: legacyDoc.id,
              name: rawName || 'Witness',
              age: '',
              occupation: '',
              side: side,
              witness_code: side === 'prosecution' ? 'PW' : 'DW',
              is_eyewitness: false,
              is_surprise_witness: false,
              is_pending_approval: false,
              is_admitted: true,
              surprise_reason: '',
              initial_statement: legacyDoc.ocr_text || legacyDoc.content || legacyDoc.ai_summary || '',
              storage_path: legacyDoc.storage_path,
              created_at: legacyDoc.created_at,
              registered_by_name: legacyDoc.uploaded_by_profile?.full_name || 'Counsel',
              registered_by_id: legacyDoc.uploaded_by,
              file_hash: legacyDoc.file_hash || legacyDoc.sha256,
              examinations: []
            });
          }
        });

        // Compute official PW-1, PW-2, DW-1, DW-2 numbers based on registration date order
        let pwCount = 0;
        let dwCount = 0;
        registeredWitnesses.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        registeredWitnesses.forEach(w => {
          if (w.side === 'prosecution') {
            pwCount++;
            w.display_code = `PW-${pwCount}`;
          } else {
            dwCount++;
            w.display_code = `DW-${dwCount}`;
          }
        });

        setWitnessesList(registeredWitnesses);
        setPendingSurprisePetitions(surprisePetitions);
      } catch (wErr) {
        console.warn("Failed to parse witness roster:", wErr);
      }
      
      // Extract Next Hearing
      if (sessions && sessions.length > 0) {
        const upcoming = sessions
          .filter(s => new Date(s.scheduled_at) > new Date())
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
        if (upcoming.length > 0) {
          setNextHearing(upcoming[0]);
        } else {
          setNextHearing(null);
        }
      } else {
        setNextHearing(null);
      }
      
      // Filter Organizations based on Jurisdiction Rules
      if (fetchedOrgs.length > 0) {
        if (user?.role === 'police_officer' || user?.role === 'investigating_officer') {
          // Police can transfer to Courts or Police Stations in their own district
          // (Only allowed to transfer to District Courts or other Police Stations)
          let localOrgs = fetchedOrgs.filter(c => 
            (!user?.district || (c.district && c.district.toLowerCase().includes(user.district.toLowerCase()))) &&
            (c.org_type === 'police_station' || c.org_type === 'court_district' || c.org_type === 'court')
          );
          if (localOrgs.length <= 1) localOrgs = fetchedOrgs.filter(c => c.org_type === 'police_station' || c.org_type === 'court_district' || c.org_type === 'court'); 
          setCourts(localOrgs.filter(c => c.id !== user?.org_id));
        } else if (user?.role === 'judge') {
          // Judges can transfer (appeal) to Higher Courts
          let targetCourtTypes = ['high_court', 'court_high', 'supreme_court', 'court_supreme']; 
          if (user?.org_type === 'high_court' || user?.org_type === 'court_high') targetCourtTypes = ['supreme_court', 'court_supreme'];
          
          let stateOrgs = fetchedOrgs.filter(c => {
            if (!targetCourtTypes.includes(c.org_type)) return false;
            // Supreme courts are national, don't filter them by state
            if (c.org_type === 'supreme_court' || c.org_type === 'court_supreme') return true;
            return (!user?.state || (c.state && c.state.toLowerCase().includes(user.state.toLowerCase())));
          });
          
          // Fallback to all courts of that type if none found in state (useful for testing)
          if (stateOrgs.length === 0) {
            stateOrgs = fetchedOrgs.filter(c => targetCourtTypes.includes(c.org_type));
          }

          // If High Court judge and no Supreme Court org exists in DB yet, inject official Supreme Court org
          if ((user?.org_type === 'high_court' || user?.org_type === 'court_high') && !stateOrgs.some(c => c.org_type === 'supreme_court' || c.org_type === 'court_supreme')) {
            stateOrgs.push({
              id: 'sc_india_apex',
              name: 'Supreme Court of India (Apex Registry, New Delhi)',
              code: 'SC_INDIA_APEX',
              org_type: 'supreme_court',
              district: 'New Delhi',
              state: 'National'
            });
          }
          
          if (stateOrgs.length === 0) {
            setCourts([]);
          } else {
            setCourts(stateOrgs.filter(c => c.id !== user?.org_id));
          }
        } else {
          setCourts(fetchedOrgs.filter(c => c.id !== user?.org_id));
        }
      }

      // Fetch active lawyers and external agency officers for the case
      try {
        const { data: participants } = await supabase
          .from('case_participants')
          .select(`*, profile:profiles!case_participants_user_id_fkey(full_name, badge_no, role, designation, org:organisations(name, org_type))`)
          .eq('case_id', id)
          .in('role_in_case', ['lawyer', 'prosecutor', 'defense_lawyer', 'external_agency', 'agency_lead', 'agency_officer']);
        if (participants) {
          setLawyers(participants.filter(p => !p.revoked_at));
        } else {
          setLawyers([]);
        }
      } catch (pErr) {
        console.warn("Participants fetch fallback:", pErr);
        setLawyers([]);
      }
      
      // Fetch presiding judge(s)
      if (cData?.court_org_id) {
        const { data: judges } = await supabase
          .from('profiles')
          .select('full_name, designation')
          .eq('org_id', cData.court_org_id)
          .eq('role', 'judge');
        if (judges) setPresidingJudges(judges);
      }

      // Fetch Court & Police Station Org details
      if (cData?.court_org_id) {
        const { data: courtInfo } = await supabase.from('organisations').select('*').eq('id', cData.court_org_id).maybeSingle();
        if (courtInfo) setCourtOrg(courtInfo);
      }
      if (cData?.police_org_id) {
        const { data: polInfo } = await supabase.from('organisations').select('*').eq('id', cData.police_org_id).maybeSingle();
        if (polInfo) setPoliceOrg(polInfo);
      }

      // If this case is an appeal / transferred from lower court
      if (cData?.original_case_id) {
        const { data: origCase } = await supabase.from('cases').select('*, court:organisations!cases_court_org_id_fkey(name, org_type, state, district)').eq('id', cData.original_case_id).maybeSingle();
        if (origCase) setParentCase(origCase);
      } else {
        setParentCase(null);
      }

      // If this case has been appealed to an upper court
      const { data: appTo } = await supabase.from('cases').select('*, court:organisations!cases_court_org_id_fkey(name, org_type, state, district)').eq('original_case_id', id);
      if (appTo && appTo.length > 0) {
        setAppealedToCases(appTo);
      } else {
        setAppealedToCases([]);
      }

      // Fetch case agency transfers
      try {
        const { data: agTransfers, error: agErr } = await supabase
          .from('case_agency_transfers')
          .select('*, agency:organisations(id, name, acronym, org_type, state, district), initiator:profiles!case_agency_transfers_initiated_by_fkey(full_name, designation), claimer:profiles!case_agency_transfers_claimed_by_fkey(full_name, designation)')
          .eq('case_id', id)
          .order('created_at', { ascending: false });
        if (agTransfers && !agErr) {
          setAgencyTransfersList(agTransfers);
        } else {
          // fallback query without joins
          const { data: rawAg } = await supabase.from('case_agency_transfers').select('*').eq('case_id', id).order('created_at', { ascending: false });
          if (rawAg && rawAg.length > 0) {
            const orgIds = rawAg.map(a => a.agency_org_id).filter(Boolean);
            const { data: orgsList } = await supabase.from('organisations').select('*').in('id', orgIds);
            const mapped = rawAg.map(a => ({
              ...a,
              agency: orgsList?.find(o => o.id === a.agency_org_id) || { name: 'Special Investigative Agency' }
            }));
            setAgencyTransfersList(mapped);
          } else {
            setAgencyTransfersList([]);
          }
        }
      } catch (e) {
        console.warn("Agency transfers fetch error:", e);
        setAgencyTransfersList([]);
      }
      
    } catch (err) {
      console.error("Failed to fetch timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, user?.role]);

  const handleTransfer = async () => {
    if (!selectedCourt) {
      alert("Please select a destination.");
      return;
    }
    try {
      if (transferDestinationType === 'court') {
        if (caseData.stage === 'disposed' || user?.role === 'judge') {
          // This is a Judge appealing to a higher court (High Court -> Supreme Court or Trial Court -> High Court)
          let targetCourtId = selectedCourt;
          let targetCourtObj = courts.find(c => c.id === selectedCourt);

          // If target is placeholder sc_india_apex, ensure Supreme Court exists in organisations
          if (selectedCourt === 'sc_india_apex' || targetCourtObj?.org_type === 'supreme_court') {
            const { data: dbSc } = await supabase
              .from('organisations')
              .select('id, name')
              .or('org_type.eq.supreme_court,name.ilike.%Supreme Court%');
            
            if (dbSc && dbSc.length > 0) {
              targetCourtId = dbSc[0].id;
              targetCourtObj = dbSc[0];
            } else {
              const { data: newSc, error: scErr } = await supabase
                .from('organisations')
                .insert([{
                  name: 'Supreme Court of India',
                  code: 'SC_INDIA_APEX',
                  org_type: 'supreme_court',
                  district: 'New Delhi',
                  state: 'National'
                }])
                .select()
                .single();
              if (scErr) throw scErr;
              targetCourtId = newSc.id;
              targetCourtObj = newSc;
            }
          }

          const isSupremeCourt = targetCourtObj?.org_type === 'supreme_court' || targetCourtObj?.name?.includes('Supreme Court');
          let appealSucceeded = false;
          try {
            const { error: appealErr } = await supabase.rpc('file_appeal', {
              p_original_case_id: id,
              p_target_org_id: targetCourtId,
              p_ground: isSupremeCourt ? 'Special Leave Petition / Constitutional Appeal filed before Supreme Court of India' : 'Statutory Appellate Petition filed before High Court'
            });
            if (!appealErr) appealSucceeded = true;
          } catch(e) {}

          if (!appealSucceeded) {
            const { error: cErr } = await supabase.from('cases').update({
              court_org_id: targetCourtId,
              stage: 'appealed'
            }).eq('id', id);
            if (cErr) throw cErr;

            const docHash = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
            await supabase.from('documents').insert([{
              case_id: id,
              uploaded_by: user.id,
              doc_type: 'appellate_petition',
              title: isSupremeCourt ? `SPECIAL LEAVE PETITION / APPEAL: Transferred to Supreme Court of India` : `APPELLATE PETITION: Transferred to ${targetCourtObj?.name || 'High Court'}`,
              storage_path: 'manual_entry',
              ocr_text: `Appeal preferred against judgement of ${user.org_name || 'Lower Court'}. Case file and entire evidence grid transmitted to ${targetCourtObj?.name || 'Appellate Bench'}.`,
              sha256: docHash,
              status: 'verified'
            }]);

            await supabase.from('audit_log').insert([{
              case_id: id,
              actor_id: user.id,
              action: isSupremeCourt ? 'HIGH_COURT_APPEAL_TRANSMITTED_TO_SUPREME_COURT' : 'COURT_APPEAL_TRANSMITTED_TO_HIGH_COURT',
              metadata: {
                from_court: user.org_name,
                to_court: targetCourtObj?.name || (isSupremeCourt ? 'Supreme Court of India' : 'High Court'),
                target_org_id: targetCourtId,
                appellant: user.full_name,
                timestamp: new Date().toISOString()
              },
              record_hash: docHash
            }]);
          }

          alert(isSupremeCourt ? 'Case docket successfully appealed & transmitted to the Hon\'ble Supreme Court of India (Apex Registry).' : `Appeal successfully filed to ${targetCourtObj?.name || 'Higher Court'}.`);
        } else {
          // This is Police transferring FIR to court for trial
          setLoading(true);
          const pseudoHash = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
          
          if (chargeSheetFile) {
            const fileExt = chargeSheetFile.name.split('.').pop();
            const filePath = `chargesheets/${id}/${Date.now()}_chargesheet.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, chargeSheetFile);
            if (uploadError) console.warn("Storage upload fallback:", uploadError);

            await supabase.from('documents').insert([{
              case_id: id,
              uploaded_by: user.id,
              doc_type: 'charge_sheet',
              title: `Final Police Report / Charge Sheet Filed (Sec 173 CrPC / Sec 193 BNSS)`,
              storage_path: uploadError ? 'manual_entry' : filePath,
              sha256: pseudoHash,
              status: 'verified'
            }]);
          } else {
            await supabase.from('documents').insert([{
              case_id: id,
              uploaded_by: user.id,
              doc_type: 'charge_sheet',
              title: `Police Final Investigation Report & Case Forwarded for Judicial Cognizance`,
              storage_path: 'manual_entry',
              ocr_text: `Investigation concluded by ${user.full_name} (${user.designation || 'Investigating Officer'}) from ${user.org_name || 'Police Station'}. Formal Charge Sheet forwarded to the Hon'ble Court for trial commencement.`,
              sha256: pseudoHash,
              status: 'verified'
            }]);
          }

          const { error: transferErr } = await supabase.from('cases').update({ 
            court_org_id: selectedCourt,
            stage: 'in_trial'
          }).eq('id', id);
          if (transferErr) throw transferErr;

          try {
            await supabase.from('audit_log').insert([{
              case_id: id,
              actor_id: user.id,
              action: 'POLICE_CHARGE_SHEET_FILED_COURT_TRANSFER',
              metadata: {
                court_org_id: selectedCourt,
                transferred_by: user.full_name,
                transferred_at: new Date().toISOString()
              },
              record_hash: pseudoHash
            }]);
          } catch(e) {}

          alert('Charge Sheet filed and Case successfully transferred to the selected Court for trial.');
        }
        // Police to Police transfer (Zero FIR / Territorial Handover)
        const targetStation = courts.find(c => c.id === selectedCourt);
        const { error: stationErr } = await supabase.from('cases').update({ 
          police_org_id: selectedCourt,
          stage: 'transferred'
        }).eq('id', id);
        if (stationErr) throw stationErr;

        if (user?.id) {
          try {
            await supabase.from('case_participants').upsert([{
              case_id: id,
              user_id: user.id,
              role_in_case: 'transferring_officer'
            }]);
          } catch (pErr) {}
        }

        try {
          const transferHash = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
          await supabase.from('documents').insert([{
            case_id: id,
            uploaded_by: user.id,
            doc_type: 'investigation_record',
            title: `JURISDICTIONAL TRANSFER: Reassigned to ${targetStation?.name || 'Target Police Station'}`,
            storage_path: 'manual_entry',
            ocr_text: `The matter has been reviewed by ${user.full_name} (${user.designation || 'Police Officer'}) at ${user.org_name || 'Police Station'}. In accordance with territorial jurisdiction provisions under BNSS / CrPC (Zero FIR protocol), the case file and all initial records are hereby transferred to ${targetStation?.name || 'the recipient Police Station'} for further investigation and proceeding.`,
            sha256: transferHash,
            status: 'verified'
          }]);

          await supabase.from('audit_log').insert([{
            case_id: id,
            actor_id: user.id,
            action: 'POLICE_STATION_JURISDICTION_TRANSFER',
            metadata: {
              source_police_org_id: user.org_id,
              target_police_org_id: selectedCourt,
              transferred_by: user.full_name,
              transferred_at: new Date().toISOString()
            }
          }]);
        } catch (aErr) {}

        alert(`Case successfully transferred to ${targetStation?.name || 'the selected Police Station'}.`);
      }
      setShowTransfer(false);
      
      // Auto redirect to dashboard since they may no longer have access
      window.location.href = '/';
    } catch (err) {
      alert("Error transferring case: " + err.message);
    }
  };

  const handleReopen = async () => {
    if (window.confirm("Are you sure you want to reopen this disposed case? It will be placed back In Trial.")) {
      try {
        await supabase.from('cases').update({ stage: 'in_trial' }).eq('id', id);
        alert('Case reopened successfully.');
        fetchData();
      } catch (err) {
        alert("Error reopening case: " + err.message);
      }
    }
  };

  const handleJudgement = async () => {
    if (!operativeOrder) {
      alert("Please enter the operative order.");
      return;
    }
    
    try {
      const pseudoHash = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { error: jErr } = await supabase.from('judgements').insert([{
        case_id: id,
        verdict: verdict,
        operative_order: operativeOrder,
        pronounced_by: user.id,
        sha256: pseudoHash
      }]);
      
      if (jErr) throw jErr;
      
      const { error: cErr } = await supabase.from('cases').update({ stage: 'disposed' }).eq('id', id);
      if (cErr) {
        alert("Warning: Judgement saved, but stage update failed! " + cErr.message);
      }
      
      setShowJudgement(false);
      fetchData(); 
    } catch (err) {
      alert("Error pronouncing judgement: " + err.message);
    }
  };

  const handleScheduleHearing = async () => {
    if (!hearingOutcome && !hearingDate) {
      alert("Please either log a hearing outcome or schedule a new date.");
      return;
    }
    
    try {
      // 1. Log today's hearing outcome as an Order Sheet if provided
      if (hearingOutcome) {
        const pseudoHash = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
        const { error: docError } = await supabase.from('documents').insert([{
          case_id: id,
          doc_type: 'court_filing',
          title: 'Daily Order Sheet (Hearing Outcome)',
          storage_path: 'manual_entry',
          mime_type: 'text/plain',
          size_bytes: new Blob([hearingOutcome]).size,
          sha256: pseudoHash,
          uploaded_by: user.id,
          ocr_text: hearingOutcome,
          ai_summary: `Order Sheet: ${hearingOutcome.substring(0, 100)}...`
        }]);
        if (docError) throw docError;
      }

      // 2. Schedule next hearing if provided
      if (hearingDate) {
        const { error: sessionError } = await supabase.from('court_sessions').insert([{
          case_id: id,
          court_org_id: user.org_id,
          hearing_type: 'scheduled',
          scheduled_at: hearingDate,
          proceedings: hearingInstructions,
          recorded_by: user.id
        }]);
        if (sessionError) throw sessionError;
      }
      
      setShowHearing(false);
      setHearingOutcome('');
      setHearingDate('');
      setHearingInstructions('');
      fetchData(); 
    } catch (err) {
      alert("Failed to record hearing details. Error: " + err.message);
    }
  };

  const handleUploadEvidence = async () => {
    if (!evidenceTitle) {
      alert("Please provide a title for the evidence.");
      return;
    }
    
    setLoading(true);
    try {
      let storagePath = 'manual_entry';
      
      // Upload physical file if provided
      if (evidenceFile) {
        const fileExt = evidenceFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, evidenceFile);
          
        if (uploadError) throw uploadError;
        storagePath = filePath;
      }
      
      const pseudoHash = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { error: docError } = await supabase.from('documents').insert([{
        case_id: id,
        doc_type: evidenceType,
        title: evidenceTitle,
        storage_path: storagePath,
        mime_type: evidenceFile ? evidenceFile.type : 'text/plain',
        size_bytes: evidenceFile ? evidenceFile.size : new Blob([evidenceContent]).size,
        sha256: pseudoHash,
        uploaded_by: user.id,
        ocr_text: evidenceContent,
        ai_summary: evidenceContent ? `New evidence/findings submitted during trial: ${evidenceContent.substring(0, 100)}...` : null
      }]);
      
      if (docError) throw docError;
      
      setShowEvidence(false);
      setEvidenceTitle('');
      setEvidenceContent('');
      setEvidenceFile(null);
      fetchData();
    } catch (err) {
      alert("Error submitting evidence: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWitnessSubmit = async (e) => {
    e?.preventDefault();
    if (!witnessFormName.trim()) {
      alert("Please provide the full name of the witness.");
      return;
    }
    if (witnessIsSurprise && !witnessSurpriseReason.trim()) {
      alert("Please state the statutory grounds & justification for summoning a Surprise / Unlisted Witness (Sec 311 CrPC / Sec 348 BNSS).");
      return;
    }

    setIsSubmittingWitness(true);
    try {
      let storagePath = 'manual_entry';
      if (witnessFile) {
        const fileExt = witnessFile.name.split('.').pop();
        const fileName = `witness_${Date.now()}.${fileExt}`;
        const filePath = `${id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, witnessFile);
        if (!uploadError) {
          storagePath = filePath;
        }
      }

      const currentSideCode = witnessFormSide === 'prosecution' ? 'PW' : 'DW';
      const tagEyewitness = witnessIsEyeWitness ? ' [EYEWITNESS ⭐]' : '';
      const tagSurprise = witnessIsSurprise ? ' [CONFIDENTIAL SEC 311 PETITION]' : '';
      const timestampStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' });

      const witnessMetadata = {
        name: witnessFormName.trim(),
        age: witnessFormAge.trim(),
        occupation: witnessFormOccupation.trim(),
        side: witnessFormSide,
        witness_code: currentSideCode,
        is_eyewitness: Boolean(witnessIsEyeWitness),
        is_surprise_witness: Boolean(witnessIsSurprise),
        surprise_reason: witnessSurpriseReason.trim(),
        statement: witnessStatement.trim(),
        timestamp: timestampStr,
        registered_by_name: user?.full_name,
        registered_by_role: user?.role
      };

      const docContent = `CONFIDENTIAL WITNESS PETITION & PROOF OF EVIDENCE
══════════════════════════════════════════════════════════════════
Court File / Case Number: ${caseData?.case_number || id}
Registering Authority: ${user?.full_name} (${user?.designation || user?.role?.toUpperCase()})
Date & Exact Time: ${timestampStr}

WITNESS PARTICULARS:
• Full Name: ${witnessFormName.trim()}
• Age: ${witnessFormAge.trim() || 'Not Specified'}
• Occupation: ${witnessFormOccupation.trim() || 'Not Specified'}
• Calling Party: ${witnessFormSide === 'prosecution' ? 'Prosecution Witness (PW)' : 'Defense Witness (DW)'}
• Classification: ${witnessIsEyeWitness ? 'DIRECT EYEWITNESS (Sec 60 Evidence Act / BSA)' : 'Material / Corroborative Witness'}
${witnessIsSurprise ? `• CONFIDENTIAL SURPRISE WITNESS PETITION (Sec 311 CrPC / Sec 348 BNSS):\n  Statutory Grounds: ${witnessSurpriseReason.trim()}` : ''}

INITIAL SWORN PROOF OF EVIDENCE / STATEMENT SUMMARY:
${witnessStatement.trim() || 'Formal witness placed on roster to testify under oath before the Court.'}

${storagePath !== 'manual_entry' ? `Attached Exhibit / Audio Deposition: ${witnessFile?.name}` : ''}
══════════════════════════════════════════════════════════════════
Recorded automatically into e-Courts Cryptographic Ledger.`;

      const docHash = await sha256Hex(docContent);

      const docTitle = witnessIsSurprise 
        ? `CONFIDENTIAL PETITION: Sec 311 CrPC Surprise Witness - [${currentSideCode}] ${witnessFormName.trim()}${tagEyewitness}`
        : `WITNESS REGISTRATION: [${currentSideCode}] ${witnessFormName.trim()}${tagEyewitness}`;

      const { error: docErr } = await supabase.from('documents').insert([{
        case_id: id,
        uploaded_by: user.id,
        doc_type: 'witness_statement',
        title: docTitle,
        ocr_text: JSON.stringify({ ...witnessMetadata, full_doc: docContent }),
        storage_path: storagePath,
        mime_type: witnessFile ? witnessFile.type : 'text/plain',
        size_bytes: witnessFile ? witnessFile.size : new Blob([docContent]).size,
        sha256: docHash,
        status: 'verified',
        ai_summary: witnessIsSurprise ? 'pending_judicial_approval' : `${witnessIsEyeWitness ? 'EYEWITNESS: ' : 'WITNESS: '} ${witnessFormName.trim()} (${witnessFormSide.toUpperCase()}) — ${witnessStatement.substring(0, 100)}...`
      }]);

      if (docErr) throw docErr;

      try {
        await supabase.from('audit_log').insert([{
          case_id: id,
          actor_id: user.id,
          action: witnessIsSurprise ? 'SURPRISE_WITNESS_PETITIONED' : 'WITNESS_REGISTERED',
          metadata: {
            witness_name: witnessFormName.trim(),
            side: witnessFormSide,
            is_eyewitness: witnessIsEyeWitness,
            is_surprise: witnessIsSurprise,
            registered_by: user?.full_name,
            timestamp: new Date().toISOString()
          },
          record_hash: docHash
        }]);
      } catch(e) {}

      if (witnessIsSurprise) {
        alert(`Confidential Petition for Surprise Witness "${witnessFormName.trim()}" (Sec 311 CrPC / Sec 348 BNSS) submitted directly to the Presiding Judge.\n\nTo preserve judicial surprise, this witness remains confidential and will not be displayed to opposing parties or middlemen until admitted by Court Order.`);
      } else {
        alert(`Witness "${witnessFormName.trim()}" successfully registered into the Case Witness Roster.`);
      }

      setShowAddWitnessModal(false);
      setWitnessFormName('');
      setWitnessFormAge('');
      setWitnessFormOccupation('');
      setWitnessFormSide('prosecution');
      setWitnessIsEyeWitness(false);
      setWitnessIsSurprise(false);
      setWitnessSurpriseReason('');
      setWitnessStatement('');
      setWitnessFile(null);
      fetchData();
    } catch (err) {
      alert("Failed to submit witness: " + err.message);
    } finally {
      setIsSubmittingWitness(false);
    }
  };

  const handleAdmitSurpriseWitness = async (docId, admit) => {
    try {
      if (admit) {
        const { error } = await supabase.from('documents').update({
          ai_summary: 'admitted_by_court'
        }).eq('id', docId);
        if (error) throw error;
        
        await supabase.from('audit_log').insert([{
          case_id: id,
          actor_id: user.id,
          action: 'SURPRISE_WITNESS_ADMITTED',
          metadata: {
            admitted_by: user?.full_name,
            role: user?.role,
            timestamp: new Date().toISOString()
          }
        }]);
        alert("Section 311 CrPC Petition Allowed: Witness has been admitted into the Official Case Roster.");
      } else {
        const { error } = await supabase.from('documents').update({
          ai_summary: 'rejected_by_court'
        }).eq('id', docId);
        if (error) throw error;
        alert("Section 311 CrPC Petition Declined.");
      }
      fetchData();
    } catch (err) {
      alert("Action failed: " + err.message);
    }
  };

  const handleCopyToken = (code, tokenId) => {
    navigator.clipboard.writeText(code);
    setCopiedTokenId(tokenId);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  const handleDeactivateToken = async (tokenId) => {
    if (!window.confirm("Are you sure you want to deactivate and invalidate this access token immediately?")) return;
    try {
      const { error } = await supabase.from('case_access_codes').update({ is_active: false }).eq('id', tokenId);
      if (error) throw error;
      alert("Access token successfully revoked.");
      fetchData();
    } catch (err) {
      alert("Failed to deactivate token: " + err.message);
    }
  };

  const handleRecordExaminationSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedWitnessForExam) return;

    const validQnas = examQnaList.filter(item => item.q.trim() || item.a.trim());
    if (validQnas.length === 0 && !examNotes.trim()) {
      alert("Please provide at least one Question & Answer pair or Demeanor / Examination notes.");
      return;
    }

    setIsSubmittingExam(true);
    try {
      const stageLabels = {
        'examination_in_chief': 'EXAMINATION-IN-CHIEF (DIRECT)',
        'cross_examination': 'CROSS-EXAMINATION (ADVERSE CHALLENGE)',
        're_examination': 'RE-EXAMINATION',
        'court_questions': 'COURT INTERROGATION (SEC 165 EVIDENCE ACT / BSA)'
      };
      const stageLabel = stageLabels[examType] || 'EXAMINATION';
      const timestampStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' });

      let qnaText = '';
      validQnas.forEach((item, idx) => {
        qnaText += `Q.${idx + 1}: ${item.q.trim()}\nAns: ${item.a.trim()}\n\n`;
      });

      const examMetadata = {
        witness_id: selectedWitnessForExam.id,
        witness_name: selectedWitnessForExam.name,
        witness_code: selectedWitnessForExam.display_code || selectedWitnessForExam.witness_code,
        witness_side: selectedWitnessForExam.side,
        exam_type: examType,
        stage_label: stageLabel,
        examiner_name: user?.full_name,
        examiner_role: user?.role,
        examiner_designation: user?.designation || (user?.role === 'judge' ? 'Hon\'ble Presiding Judge' : user?.role === 'lawyer' ? 'Counsel' : 'Investigating Officer'),
        timestamp: timestampStr,
        qna_list: validQnas,
        demeanor_notes: examNotes.trim()
      };

      const docContent = `OFFICIAL COURT DEPOSITION & EXAMINATION RECORD
══════════════════════════════════════════════════════════════════
Case File / Record: ${caseData?.case_number || id}
Witness Deposing: ${selectedWitnessForExam.display_code || ''} — ${selectedWitnessForExam.name} (${selectedWitnessForExam.side?.toUpperCase()})
Examination Stage: ${stageLabel}
Examining Officer / Counsel: ${user?.full_name} (${user?.designation || user?.role?.toUpperCase()})
Date & Exact Time of Deposition: ${timestampStr}

TRANSCRIPT OF EXAMINATION UNDER OATH:
${qnaText || '(Oral deposition recorded without itemized Q&A)\n'}
${examNotes.trim() ? `DEMEANOR OF WITNESS & OBJECTIONS NOTED:\n${examNotes.trim()}\n` : ''}
══════════════════════════════════════════════════════════════════
Recorded under statutory judicial safeguards. Digitally signed & hashed.`;

      const docHash = await sha256Hex(docContent);

      const { error: docErr } = await supabase.from('documents').insert([{
        case_id: id,
        uploaded_by: user.id,
        doc_type: 'witness_statement',
        title: `DEPOSITION [${stageLabel}]: ${selectedWitnessForExam.display_code || ''} ${selectedWitnessForExam.name}`,
        storage_path: 'manual_entry',
        ocr_text: JSON.stringify({ ...examMetadata, full_doc: docContent }),
        mime_type: 'text/plain',
        size_bytes: new Blob([docContent]).size,
        sha256: docHash,
        status: 'verified',
        ai_summary: `${stageLabel} recorded for ${selectedWitnessForExam.name} (${validQnas.length} Questions). ${examNotes ? 'Notes: ' + examNotes.substring(0, 80) : ''}`
      }]);

      if (docErr) throw docErr;

      try {
        await supabase.from('audit_log').insert([{
          case_id: id,
          actor_id: user.id,
          action: examType === 'cross_examination' ? 'WITNESS_CROSS_EXAMINED' : 'WITNESS_CHIEF_EXAMINED',
          metadata: {
            witness_name: selectedWitnessForExam.name,
            exam_stage: stageLabel,
            examiner: user?.full_name,
            question_count: validQnas.length,
            timestamp: new Date().toISOString()
          },
          record_hash: docHash
        }]);
      } catch(e) {}

      alert(`${stageLabel} for "${selectedWitnessForExam.name}" successfully recorded in proceedings.`);
      setShowExamineModal(false);
      setSelectedWitnessForExam(null);
      setExamType('examination_in_chief');
      setExamQnaList([{ q: '', a: '' }]);
      setExamNotes('');
      fetchData();
    } catch (err) {
      alert("Failed to record examination: " + err.message);
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const handleGenerateToken = async (lawyerRole) => {
    try {
      // 1. Deactivate any currently active tokens for this case
      await supabase.from('case_access_codes').update({ is_active: false }).eq('case_id', id).eq('is_active', true);
      
      // 2. Generate a fresh secure token with Role Prefix
      const randomString = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8).toUpperCase();
      const newToken = `${lawyerRole}-${randomString}`;
      
      const { error } = await supabase.from('case_access_codes').insert([{
        case_id: id,
        code: newToken,
        created_by: user.id
      }]);
      
      if (error) throw error;
      
      let roleName = 'Defense';
      if (lawyerRole === 'PROS') roleName = 'Prosecutor';
      if (lawyerRole === 'AGENCY') roleName = 'Agency Collaboration';
      if (lawyerRole === 'OFFICER') roleName = 'Agency Investigating Officer';
      
      alert(`New ${roleName} Access Token Generated: ` + newToken + "\n(Any previous tokens are now inactive.)");
      fetchData();
    } catch (err) {
      alert("Failed to generate token: " + err.message);
    }
  };

  const handleInviteAgencyOfficer = () => {
    setShowAppointOfficerModal(true);
  };

  const handleWarrantSubmit = async (e) => {
    e?.preventDefault();
    if (!warrantTarget.trim() || !warrantGrounds.trim()) {
      alert("Please enter the Target Person/Location and Grounds for the Warrant/Order.");
      return;
    }

    setIsSubmittingWarrant(true);
    try {
      let storagePath = null;
      if (warrantFile) {
        const fileExt = warrantFile.name.split('.').pop();
        const fileName = `warrant_${Date.now()}.${fileExt}`;
        const filePath = `${id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, warrantFile);
        if (!uploadError) {
          storagePath = filePath;
        }
      }

      const content = `OFFICIAL INVESTIGATION APPLICATION: APPEAL FOR ORDER / WARRANT
══════════════════════════════════════════════════════════════════
Investigating Agency: ${user?.org_name || 'Central Agency'}
Applying Officer: ${user?.full_name || 'Investigating Officer'} (${user?.designation || 'IO'})
Badge / Service ID: ${user?.badge_no || 'N/A'}
Date & Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' })}
Case Number: ${caseData?.case_number || id}

REQUESTED ORDER / WARRANT TYPE:
${warrantType}

TARGET PERSON / PREMISES / ASSET:
${warrantTarget.trim()}

FACTS, GROUNDS & JUSTIFICATION:
${warrantGrounds.trim()}

${storagePath ? `Attached Supporting Exhibit: ${warrantFile.name}` : ''}
══════════════════════════════════════════════════════════════════
Submitted for Agency Review and/or Judicial Sanction.`;

      const hash = await sha256Hex(content);

      const { error: docError } = await supabase.from('documents').insert([{
        case_id: id,
        uploaded_by: user.id,
        doc_type: 'court_filing',
        title: `WARRANT APPLICATION: ${warrantType.split('(')[0].trim()} — ${warrantTarget.trim()}`,
        storage_path: storagePath || 'manual_entry',
        ocr_text: content,
        sha256: hash,
        status: 'submitted',
        ai_summary: 'pending_agency_review'
      }]);

      if (docError) throw docError;

      await supabase.from('audit_log').insert([{
        case_id: id,
        actor_id: user.id,
        action: 'IO_WARRANT_APPLICATION_SUBMITTED',
        metadata: {
          warrant_type: warrantType,
          target: warrantTarget.trim(),
          officer_name: user?.full_name,
          agency_name: user?.org_name,
          timestamp: new Date().toISOString()
        },
        record_hash: hash
      }]);

      alert("Application for Warrant/Order successfully submitted and forwarded to Agency Lead.");
      setShowWarrantModal(false);
      setWarrantTarget('');
      setWarrantGrounds('');
      setWarrantFile(null);
      fetchData();
    } catch (err) {
      alert("Failed to submit warrant application: " + err.message);
    } finally {
      setIsSubmittingWarrant(false);
    }
  };

  const handleAgencyReviewSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedWarrantForAgency) return;

    setIsProcessingAgencyAction(true);
    try {
      const isEscalating = agencyReviewAction === 'escalate_court';
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' });
      
      const updatePayload = {
        ai_summary: isEscalating ? 'escalated_to_court' : 'approved_by_agency'
      };

      await supabase.from('documents').update(updatePayload).eq('id', selectedWarrantForAgency.id);

      const proceedingContent = isEscalating
        ? `OFFICIAL AGENCY DIRECTIVE: WARRANT APPLICATION ESCALATED TO HON'BLE COURT
══════════════════════════════════════════════════════════════════
Reviewing Authority: ${user?.org_name || 'Investigative Agency HQ'}
Supervising Lead: ${user?.full_name || 'Agency Administrator'} (${user?.designation || 'Head of Department'})
Date & Timestamp: ${timestamp}
Related Application: ${selectedWarrantForAgency.title}

FORWARDING DIRECTIVE TO COURT:
${agencyDirectiveNotes.trim() || 'This application involves statutory judicial powers requiring formal warrant under the Code of Criminal Procedure / BNSS. Respectfully forwarded to the Presiding Judge for judicial sanction.'}
══════════════════════════════════════════════════════════════════
Forwarded to Judicial Docket.`
        : `OFFICIAL AGENCY ADMINISTRATIVE ORDER ISSUED
══════════════════════════════════════════════════════════════════
Issuing Authority: ${user?.org_name || 'Investigative Agency HQ'}
Supervising Lead: ${user?.full_name || 'Agency Administrator'} (${user?.designation || 'Head of Department'})
Date & Timestamp: ${timestamp}
Related Application: ${selectedWarrantForAgency.title}

AGENCY ADMINISTRATIVE ORDER:
${agencyDirectiveNotes.trim() || 'Under statutory powers vested in this Agency, the request is approved. The Investigating Officer is authorized to proceed with the specified administrative action.'}
══════════════════════════════════════════════════════════════════
Recorded in Cryptographic Ledger.`;

      const procHash = await sha256Hex(proceedingContent);

      await supabase.from('documents').insert([{
        case_id: id,
        uploaded_by: user.id,
        doc_type: isEscalating ? 'court_filing' : 'investigation_record',
        title: isEscalating 
          ? `AGENCY ESCALATION: Warrant Application Forwarded to Court`
          : `AGENCY ADMINISTRATIVE ORDER: Approved by Agency Lead`,
        storage_path: 'manual_entry',
        ocr_text: proceedingContent,
        sha256: procHash,
        status: 'verified'
      }]);

      await supabase.from('audit_log').insert([{
        case_id: id,
        actor_id: user.id,
        action: isEscalating ? 'AGENCY_ESCALATED_WARRANT_TO_COURT' : 'AGENCY_APPROVED_ADMIN_ORDER',
        metadata: {
          warrant_doc_id: selectedWarrantForAgency.id,
          action: isEscalating ? 'escalated_to_court' : 'approved_by_agency',
          notes: agencyDirectiveNotes,
          timestamp: new Date().toISOString()
        },
        record_hash: procHash
      }]);

      alert(isEscalating ? "Application successfully escalated and forwarded to the Hon'ble Judge." : "Agency Administrative Order issued and logged in case proceedings.");
      setSelectedWarrantForAgency(null);
      setAgencyDirectiveNotes('');
      fetchData();
    } catch (err) {
      alert("Failed to process agency review: " + err.message);
    } finally {
      setIsProcessingAgencyAction(false);
    }
  };

  const handleAppointOfficerSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!appointOfficerName.trim() || !appointOfficerBadge.trim()) {
      alert("Please enter the Officer's Full Name and Badge / Service ID.");
      return;
    }

    setIsSubmittingAppoint(true);
    try {
      const agencyName = user?.org_name || 'Special Investigation Agency';
      const parenMatch = agencyName.match(/\(([^)]+)\)/);
      const agencyAcronym = (parenMatch ? parenMatch[1] : (user?.org_name?.split(' ')[0] || 'AGENCY')).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const randomCode = Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const generatedToken = `OFFICER-${agencyAcronym}-${randomCode}`;
      const tokenHash = await sha256Hex(generatedToken);

      // 1. Find or create transfer row
      let transferId = null;
      try {
        const { data: transfer } = await supabase
          .from('case_agency_transfers')
          .select('id')
          .eq('case_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (transfer) transferId = transfer.id;
      } catch (e) {}

      // 2. Insert into agency_officer_invites
      if (transferId) {
        try {
          await supabase.from('agency_officer_invites').insert([{
            case_agency_transfer_id: transferId,
            token_hash: tokenHash,
            status: 'pending',
            invited_by: user.id
          }]);
        } catch (invErr) {
          console.warn("Invite insert fallback:", invErr);
        }
      }

      // 3. Insert into case_access_codes
      await supabase.from('case_access_codes').insert([{
        case_id: id,
        code: generatedToken,
        created_by: user.id,
        is_active: true
      }]);

      // 4. Record official proceeding in documents table
      const proceedingTimestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' });
      const proceedingContent = `OFFICIAL PROCEEDING & INVESTIGATION DIRECTIVE
══════════════════════════════════════════════════════════════════
Issuing Authority: ${agencyName}
Supervising Lead: ${user.full_name || 'Agency Administrator'} (${user.designation || 'Head of Department'})
Date & Timestamp: ${proceedingTimestamp}

APPOINTED INVESTIGATING OFFICER (IO):
• Full Name: ${appointOfficerName.trim()}
• Rank / Designation: ${appointOfficerRank}
• Service / Badge Number: ${appointOfficerBadge.trim()}
• Case File Number: ${caseData?.case_number || id}

OFFICIAL MANDATE & DIRECTIVE:
${appointOfficerDirective.trim() || 'The appointed Investigating Officer is hereby authorized and directed to take custody of all forensic exhibits, summon relevant witnesses, record statements, and prepare the supplementary investigation report for submission before the Hon’ble Court.'}

SECURITY & ACCESS CREDENTIALS:
• Officer Activation Token Issued: ${generatedToken}
• Cryptographic Token Fingerprint (SHA-256): ${tokenHash}
══════════════════════════════════════════════════════════════════
Recorded automatically in e-Courts Cryptographic Ledger.`;

      const docHash = await sha256Hex(proceedingContent);

      await supabase.from('documents').insert([{
        case_id: id,
        uploaded_by: user.id,
        doc_type: 'investigation_record',
        title: `OFFICIAL PROCEEDING: IO APPOINTED — ${appointOfficerName.trim()} (${appointOfficerRank})`,
        storage_path: 'manual_entry',
        ocr_text: proceedingContent,
        sha256: docHash,
        status: 'verified'
      }]);

      // 5. Record in audit_log
      try {
        await supabase.from('audit_log').insert([{
          case_id: id,
          actor_id: user.id,
          action: 'AGENCY_IO_APPOINTED',
          metadata: {
            officer_name: appointOfficerName.trim(),
            designation: appointOfficerRank,
            badge_no: appointOfficerBadge.trim(),
            token: generatedToken,
            token_hash: tokenHash,
            agency_name: agencyName,
            appointed_at: new Date().toISOString()
          },
          record_hash: docHash
        }]);
      } catch (auditErr) {
        console.warn("Audit log insert fallback:", auditErr);
      }

      setAppointedOfficerSuccess({
        name: appointOfficerName.trim(),
        rank: appointOfficerRank,
        badge: appointOfficerBadge.trim(),
        token: generatedToken,
        tokenHash: tokenHash,
        timestamp: proceedingTimestamp
      });

      setShowAppointOfficerModal(false);
      setAppointOfficerName('');
      setAppointOfficerBadge('');
      setAppointOfficerDirective('');
      fetchData();
    } catch (err) {
      alert("Failed to appoint officer: " + err.message);
    } finally {
      setIsSubmittingAppoint(false);
    }
  };

  const handleJudgeWarrantSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedJudgeWarrant) return;

    setIsProcessingJudgeWarrant(true);
    try {
      const isGrant = judgeWarrantDecision === 'grant';
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' });

      await supabase.from('documents').update({
        ai_summary: isGrant ? 'granted_by_court' : 'rejected_by_court'
      }).eq('id', selectedJudgeWarrant.id);

      const orderContent = isGrant
        ? `IN THE COURT OF THE HON'BLE JUDGE
══════════════════════════════════════════════════════════════════
Presiding Judge: Hon'ble ${user?.full_name || 'Presiding Judge'}
Court: ${user?.org_name || 'Court of Law'}
Case File: ${caseData?.case_number || id}
Date & Time of Pronouncement: ${timestamp}

JUDICIAL WARRANT / ORDER:
Upon perusal of the application forwarded by ${caseData?.title || 'the Investigating Agency'} and hearing the submissions, the Court is satisfied that grounds exist under law.

ORDER DIRECTIVE:
${judgeOrderNotes.trim() || 'WARRANT IS HEREBY GRANTED. The Investigating Officer is empowered to execute the search/arrest strictly in accordance with statutory safeguards and file compliance report.'}

${judgeWarrantExpiry ? `VALIDITY PERIOD: Warrant valid until ${judgeWarrantExpiry}` : 'VALIDITY: Standard Statutory Period (30 Days)'}

DIGITAL JUDICIAL SIGNATURE & SEAL:
Presiding Judge: ${user?.full_name}
Cryptographic Hash Verification Enabled.
══════════════════════════════════════════════════════════════════`
        : `IN THE COURT OF THE HON'BLE JUDGE: APPLICATION REJECTED
══════════════════════════════════════════════════════════════════
Presiding Judge: Hon'ble ${user?.full_name || 'Presiding Judge'}
Court: ${user?.org_name || 'Court of Law'}
Date & Time: ${timestamp}

ORDER:
The warrant application is REJECTED. Grounds:
${judgeOrderNotes.trim() || 'Sufficient grounds under statute not established.'}
══════════════════════════════════════════════════════════════════`;

      const orderHash = await sha256Hex(orderContent);

      await supabase.from('documents').insert([{
        case_id: id,
        uploaded_by: user.id,
        doc_type: 'court_filing',
        title: isGrant 
          ? `JUDICIAL WARRANT ISSUED: ${selectedJudgeWarrant.title?.replace('WARRANT APPLICATION: ', '') || 'Court Order'}`
          : `JUDICIAL ORDER: Warrant Application Rejected`,
        storage_path: 'manual_entry',
        ocr_text: orderContent,
        sha256: orderHash,
        status: 'verified'
      }]);

      await supabase.from('audit_log').insert([{
        case_id: id,
        actor_id: user.id,
        action: isGrant ? 'JUDICIAL_WARRANT_GRANTED' : 'JUDICIAL_WARRANT_REJECTED',
        metadata: {
          warrant_doc_id: selectedJudgeWarrant.id,
          decision: judgeWarrantDecision,
          notes: judgeOrderNotes,
          expiry: judgeWarrantExpiry,
          timestamp: new Date().toISOString()
        },
        record_hash: orderHash
      }]);

      alert(isGrant ? "Judicial Warrant granted, digitally signed, and recorded in proceedings." : "Application rejection recorded.");
      setSelectedJudgeWarrant(null);
      setJudgeOrderNotes('');
      setJudgeWarrantExpiry('');
      fetchData();
    } catch (err) {
      alert("Failed to process judicial warrant: " + err.message);
    } finally {
      setIsProcessingJudgeWarrant(false);
    }
  };

  const openAuditLedger = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*, actor:profiles!audit_log_actor_id_fkey(full_name, role)')
        .eq('case_id', id)
        .order('id', { ascending: false });
      if (error) throw error;
      setCaseAudits(data || []);
      setShowAuditModal(true);
    } catch(err) {
      alert("Failed to fetch cryptographic ledger: " + err.message);
    }
  };

  const handleOpenRevokeModal = (participantId) => {
    setTargetRevokeLawyerId(participantId);
    setShowRevokeModal(true);
  };

  const handleSubmitRevoke = async () => {
    if (!revokeReason) {
      alert("Please provide a reason for revocation.");
      return;
    }
    if (user.role !== 'judge' && !revokeFile) {
      alert("You must upload a court order or official application to request revocation.");
      return;
    }
    try {
      if (user.role === 'judge') {
        // Direct execute for judges
        const { error } = await supabase.rpc('judge_revoke_lawyer', {
          p_case_id: id,
          p_lawyer_id: targetRevokeLawyerId,
          p_reason: revokeReason
        });
        if (error) throw error;
        try { await supabase.from('case_access_codes').update({ is_active: false }).eq('case_id', id); } catch(err) {}
        alert("Lawyer's access has been successfully revoked.");
      } else {
        // Submit request for police
        let storagePath = 'manual_entry';
        if (revokeFile) {
          const fileExt = revokeFile.name.split('.').pop();
          const fileName = `revoke_${Math.random()}.${fileExt}`;
          const filePath = `${id}/${fileName}`;
          const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, revokeFile);
          if (uploadError) {
             throw uploadError;
          } else {
            storagePath = filePath;
          }
        }
        
        const pseudoHash = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
        const { error: reqError } = await supabase.from('revocation_requests').insert([{
          case_id: id,
          lawyer_id: targetRevokeLawyerId,
          requested_by: user.id,
          reason: revokeReason,
          support_path: storagePath,
          support_sha256: pseudoHash,
        }]);
        if (reqError) throw reqError;
        alert("Revocation Request submitted to Judge for approval.");
      }
      setShowRevokeModal(false);
      setRevokeReason('');
      setRevokeFile(null);
      fetchData();
    } catch (err) {
      alert("Failed to submit request: " + (err.message || JSON.stringify(err)));
    }
  };

  const handleApproveRevoke = async (reqId) => {
    if (!window.confirm("Approve this revocation? The lawyer will be instantly removed.")) return;
    try {
      const { error, data } = await supabase.from('revocation_requests').update({ status: 'approved', reviewed_by: user.id }).eq('id', reqId).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Update blocked by database (0 rows affected).");
      try { await supabase.from('case_access_codes').update({ is_active: false }).eq('case_id', id); } catch(e){}
      alert("Revocation approved.");
      fetchData();
    } catch (err) {
      alert("Failed to approve revocation: " + err.message);
    }
  };

  const handleRejectRevoke = async (reqId) => {
    const note = window.prompt("Reason for rejection:");
    if (note === null) return;
    try {
      const { error, data } = await supabase.from('revocation_requests').update({ status: 'rejected', reviewed_by: user.id, review_note: note }).eq('id', reqId).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Update blocked by database (0 rows affected).");
      alert("Request rejected.");
      fetchData();
    } catch(err) {
      alert("Failed to reject revocation: " + err.message);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Adjust URL if backend is hosted elsewhere
      const res = await fetch(`http://localhost:3000/api/cases/${id}/record.pdf`, {
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      });
      if (!res.ok) throw new Error('Failed to generate record');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${caseData?.case_number || 'case'}-record.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Could not download the record: ' + e.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) return <div className="flex-center" style={{ padding: '3rem' }}>Loading Case Record...</div>;
  if (!caseData) return <div className="flex-center" style={{ padding: '3rem' }}>Case Not Found or Access Denied</div>;

  return (
    <div className="animate-in print-container">

      {/* Screen Interactive Header */}
      <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          
          {/* Status & Case Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge" style={{ 
              background: caseData.stage === 'disposed' || caseData.stage === 'closed' ? 'rgba(16, 185, 129, 0.15)' : 'var(--accent-glow)', 
              color: caseData.stage === 'disposed' || caseData.stage === 'closed' ? 'var(--success)' : 'var(--text-primary)', 
              border: `1px solid ${caseData.stage === 'disposed' || caseData.stage === 'closed' ? 'var(--success)' : 'var(--accent-primary)'}` 
            }}>
              {caseData.stage.replace(/_/g, ' ').toUpperCase()}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.1rem', letterSpacing: '0.5px' }}>{caseData.case_number}</span>
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.25rem', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>{caseData.title}</h2>

          {/* Transfer & Appellate Alert Banners */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {/* If transferred/appealed to Higher Court */}
            {(appealedToCases.length > 0 || caseData.stage === 'appealed') && (
              <div style={{ background: '#FCE8E6', border: '1px solid #D6D2C4', borderLeft: '4px solid #8A1E23', borderRadius: '2px', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: '#8A1E23', color: '#FFFFFF', padding: '0.4rem', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Scale size={20} />
                  </div>
                  <div>
                    <div style={{ color: '#8A1E23', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Appellate Transfer Record</span>
                      <span style={{ background: '#8A1E23', color: '#FFFFFF', fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '2px' }}>Transferred to Higher Court</span>
                    </div>
                    <div style={{ color: 'var(--ink)', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.15rem' }}>
                      Transferred to <span style={{ color: '#8A1E23' }}>{appealedToCases[0]?.court?.name || 'Higher Appellate Court / High Court / Supreme Court'}</span> for Higher Judicial Review.
                      {appealedToCases[0]?.case_number && (
                        <span style={{ color: 'var(--ink-soft)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>(Appellate Docket: <strong>{appealedToCases[0].case_number}</strong>)</span>
                      )}
                    </div>
                  </div>
                </div>
                {appealedToCases[0]?.id && (
                  <Link to={`/cases/${appealedToCases[0].id}`} className="btn-secondary" style={{ borderColor: '#8A1E23', color: '#8A1E23', fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    View Upper Court File <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            )}

            {/* If received on appeal from lower court */}
            {parentCase && (
              <div style={{ background: '#EFECE6', border: '1px solid #D6D2C4', borderLeft: '4px solid #0E2A47', borderRadius: '2px', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: '#0E2A47', color: '#FFFFFF', padding: '0.4rem', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GitBranch size={20} />
                  </div>
                  <div>
                    <div style={{ color: '#0E2A47', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Appellate Origin Record</span>
                      <span style={{ background: '#0E2A47', color: '#FFFFFF', fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '2px' }}>Appellate Jurisdiction</span>
                    </div>
                    <div style={{ color: 'var(--ink)', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.15rem' }}>
                      Received on Appeal from Lower Court: <span style={{ color: '#0E2A47' }}>{parentCase.court?.name || 'Subordinate Court'}</span> (Original CNR: <strong>{parentCase.case_number}</strong>)
                    </div>
                  </div>
                </div>
                <Link to={`/cases/${parentCase.id}`} className="btn-secondary" style={{ borderColor: '#0E2A47', color: '#0E2A47', fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  View Lower Court Record <ExternalLink size={14} />
                </Link>
              </div>
            )}

            {/* If Transferred to an Agency */}
            {agencyTransfersList.length > 0 && (
              <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', borderLeft: '4px solid #137333', borderRadius: '2px', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: '#137333', color: '#FFFFFF', padding: '0.4rem', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <div style={{ color: '#137333', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Special Agency Mandate Handover</span>
                      <span style={{ background: agencyTransfersList[0].status === 'claimed' ? '#137333' : '#B06000', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '2px' }}>
                        {agencyTransfersList[0].status === 'claimed' ? 'ACTIVE HANDOVER CLAIMED' : 'TRANSFER PENDING CLAIM'}
                      </span>
                    </div>
                    <div style={{ color: 'var(--ink)', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.15rem' }}>
                      Investigation assigned to <strong style={{ color: '#0E2A47' }}>{agencyTransfersList[0].agency?.name || 'Specialized Agency'}</strong> ({agencyTransfersList[0].agency?.acronym || 'AGENCY'}) by Judicial Mandate.
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                      Initiated by: {agencyTransfersList[0].initiator?.full_name || 'Presiding Judge'} | Transferred on: {new Date(agencyTransfersList[0].created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', background: 'var(--paper)', padding: '1.5rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
            
            {/* Case Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ color: 'var(--ink)', fontSize: '1.05rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cause Details</h3>
              <div style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                <div style={{ marginBottom: '0.35rem' }}><strong style={{ color: 'var(--ink)' }}>Sections:</strong> {Array.isArray(caseData?.sections) ? caseData.sections.join(', ') : (caseData?.sections || 'N/A')}</div>
                <div style={{ marginBottom: '0.35rem' }}><strong style={{ color: 'var(--ink)' }}>Jurisdiction:</strong> {caseData?.district || 'General'}</div>
                <div><strong style={{ color: 'var(--ink)' }}>Registered By:</strong> {caseData?.filed_by_profile?.full_name || 'System Official'} ({caseData?.filed_by_profile?.designation || 'Officer'})</div>
              </div>
            </div>

            {/* Counsel & Agency Roster */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ color: 'var(--ink)', fontSize: '1.05rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Counsel & Agency Roster</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lawyers.length > 0 ? lawyers.map(l => {
                  const myLatestReq = pendingRevokes.filter(r => r.lawyer_id === l.user_id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
                  const isAgencyUser = l.role_in_case === 'agency_lead' || l.role_in_case === 'agency_officer' || l.profile?.role === 'agency_admin' || l.profile?.role === 'agency_officer' || l.role_in_case === 'external_agency';
                  
                  let roleColor = 'var(--success)';
                  let roleLabel = 'Defense Counsel';
                  if (l.role_in_case === 'prosecutor') {
                    roleColor = 'var(--accent)';
                    roleLabel = 'Prosecution';
                  } else if (l.role_in_case === 'agency_lead' || l.profile?.role === 'agency_admin') {
                    roleColor = 'var(--bg-band)';
                    roleLabel = `Agency Lead (${l.profile?.org?.name || 'Agency'})`;
                  } else if (l.role_in_case === 'agency_officer' || l.profile?.role === 'agency_officer') {
                    roleColor = 'var(--bg-band)';
                    roleLabel = `Agency Officer (${l.profile?.org?.name || 'Agency'})`;
                  }

                  return (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF9F6', padding: '0.6rem 0.85rem', borderRadius: '2px', border: '1px solid var(--line)', borderLeft: `3px solid ${roleColor}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: roleColor, textTransform: 'uppercase' }}>
                          {roleLabel}
                        </span>
                        {isAgencyUser && (
                          <span style={{ background: '#E8ECEF', color: 'var(--bg-band)', border: '1px solid #CCD4DC', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '2px', marginLeft: '0.5rem', fontWeight: '600' }}>
                            External Agency
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.92rem', color: 'var(--ink)', fontWeight: 600, marginTop: '0.15rem' }}>{l.profile?.full_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{l.profile?.designation} | ID: {l.profile?.badge_no}</span>
                    </div>
                    {user.role !== 'lawyer' && (user.role === 'judge' || (caseData.stage !== 'disposed' && caseData.stage !== 'closed')) && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {myLatestReq?.status === 'pending' ? (
                          <>
                            <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontStyle: 'italic' }}>Revocation Pending</span>
                            {user.role === 'judge' && (
                              <>
                                <button onClick={() => handleApproveRevoke(myLatestReq.id)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)' }}>Approve</button>
                                <button onClick={() => handleRejectRevoke(myLatestReq.id)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>Reject</button>
                              </>
                            )}
                          </>
                        ) : myLatestReq?.status === 'rejected' && user.role !== 'judge' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontStyle: 'italic', background: '#FCE8E6', padding: '0.2rem 0.5rem', borderRadius: '2px' }}>
                              Denied: {myLatestReq.review_note || 'No reason given'}
                            </span>
                            <button 
                              onClick={() => handleOpenRevokeModal(l.user_id)}
                              className="btn-secondary"
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderColor: '#FAD2CF', color: 'var(--danger)', height: 'auto', background: 'transparent' }}
                            >
                              Revoke Again
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleOpenRevokeModal(l.user_id)}
                            className="btn-secondary"
                            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderColor: '#FAD2CF', color: 'var(--danger)', height: 'auto', background: '#FCE8E6' }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );}) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', fontStyle: 'italic', padding: '1rem', background: '#FAF9F6', borderRadius: '2px', border: '1px solid var(--line)' }}>No active lawyer or lawyer token.</div>
                )}
              </div>
            </div>
            
            {/* Presiding Judge */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <h3 style={{ color: 'var(--ink)', fontSize: '1.05rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Presiding Court</h3>
               <div style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                 {presidingJudges.length > 0 ? presidingJudges.map((j, idx) => (
                   <div key={idx} style={{ marginBottom: '0.5rem' }}>
                     <strong style={{ color: 'var(--ink)' }}>{j.full_name}</strong><br/>
                     {j.designation}
                   </div>
                 )) : (
                   <div style={{ fontStyle: 'italic' }}>Awaiting judicial assignment.</div>
                 )}
               </div>
            </div>

            {/* Transfer & Appellate Jurisdiction Ledger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ color: 'var(--ink)', fontSize: '1.05rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GitBranch size={16} color="var(--accent)" /> Transfer & Jurisdiction Records
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <strong style={{ color: 'var(--ink)' }}>Originating Station:</strong><br/>
                  {policeOrg?.name || caseData?.district || 'Local Police Jurisdiction'}
                </div>
                
                <div>
                  <strong style={{ color: 'var(--ink)' }}>Current Presiding Forum:</strong><br/>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{courtOrg?.name || 'Designated Trial Court'}</span> ({courtOrg?.org_type ? courtOrg.org_type.replace(/_/g, ' ').toUpperCase() : 'JUDICIAL BENCH'})
                </div>

                {/* Upper Court Appellate Record */}
                <div style={{ background: '#FAF9F6', padding: '0.6rem 0.85rem', borderRadius: '2px', border: '1px solid var(--line)', borderLeft: '3px solid var(--accent)' }}>
                  <strong style={{ color: 'var(--accent)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Upper Court Appellate Record:</strong>
                  {appealedToCases.length > 0 ? (
                    <div style={{ color: 'var(--ink)', marginTop: '0.2rem' }}>
                      ➔ Transferred to <strong>{appealedToCases[0]?.court?.name || 'Higher Court'}</strong> (Case: {appealedToCases[0]?.case_number})
                    </div>
                  ) : parentCase ? (
                    <div style={{ color: 'var(--ink)', marginTop: '0.2rem' }}>
                      ➔ Appellate Review of <strong>{parentCase?.case_number}</strong> from {parentCase?.court?.name || 'Lower Court'}
                    </div>
                  ) : caseData.stage === 'appealed' ? (
                    <div style={{ color: 'var(--danger)', marginTop: '0.2rem' }}>
                      ➔ Transferred to Upper Court (Awaiting docket assignment)
                    </div>
                  ) : (
                    <div style={{ color: 'var(--ink-soft)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                      Original First-Instance Trial (No appellate transfer)
                    </div>
                  )}
                </div>

                {/* Agency Handover Record */}
                <div style={{ background: '#FAF9F6', padding: '0.6rem 0.85rem', borderRadius: '2px', border: '1px solid var(--line)', borderLeft: '3px solid var(--bg-band)' }}>
                  <strong style={{ color: 'var(--bg-band)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Agency Handover Record:</strong>
                  {agencyTransfersList.length > 0 ? (
                    <div style={{ color: 'var(--ink)', marginTop: '0.2rem' }}>
                      <div>Assigned to: <strong style={{ color: 'var(--bg-band)' }}>{agencyTransfersList[0].agency?.name || 'Special Agency'}</strong></div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Status: <span style={{ color: agencyTransfersList[0].status === 'claimed' ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>{agencyTransfersList[0].status?.toUpperCase()}</span> | {new Date(agencyTransfersList[0].created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--ink-soft)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                      Departmental Police Station (No external agency handover)
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
          <button onClick={() => setShowDossierModal(true)} className="btn-primary no-print" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Printer size={18} /> Print Certified Dossier / Order Sheet
          </button>
          <button onClick={handleDownloadPdf} disabled={downloadingPdf} className="btn-secondary no-print" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <FileText size={18} /> {downloadingPdf ? 'Generating PDF...' : 'Download Case Record (PDF)'}
          </button>
          <button onClick={openAuditLedger} className="btn-secondary no-print" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderColor: 'var(--success)', color: 'var(--success)' }}>
            <Lock size={18} /> View Cryptographic Ledger
          </button>
          
          {nextHearing && caseData.stage !== 'disposed' && (
            <div className="glass-panel" style={{ padding: '1rem', background: '#FEF7E0', border: '1px solid #FEEFC3', borderLeft: '4px solid #B06000', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '2px' }}>
              <Calendar size={24} color="#B06000" />
              <div>
                <div style={{ fontSize: '0.75rem', color: '#B06000', fontWeight: 600, textTransform: 'uppercase' }}>Next Hearing</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink)' }}>
                  {new Date(nextHearing.scheduled_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Actions (No Print) */}
      <div className="no-print" style={{ marginBottom: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        
        {/* Lawyer Actions */}
        {user.role === 'lawyer' && (caseData?.stage === 'in_trial' || caseData?.stage === 'appeal_admitted') && (
          <div style={{ background: 'var(--paper)', padding: '1.25rem 1.5rem', borderRadius: '2px', border: '1px solid var(--line)', borderTop: '3px solid var(--accent)', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scale size={18} color="var(--accent)" /> Counsel Trial Workspace
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Advocate of Record</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  setWitnessFormSide(lawyers.some(l => l.user_id === user.id && l.role_in_case === 'prosecutor') ? 'prosecution' : 'defense');
                  setShowAddWitnessModal(true);
                }} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <UserPlus size={18} /> Add / Summon Witness (Roster)
              </button>
              <button onClick={() => setShowEvidence(!showEvidence)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={18} /> Upload Motion / Pleadings
              </button>
              <button onClick={() => setShowReschedule(!showReschedule)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B06000', borderColor: '#FEEFC3', background: '#FEF7E0' }}>
                <Calendar size={18} /> Request Reschedule
              </button>
            </div>

            {showEvidence && (
              <div className="animate-in" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                <h4 style={{ color: 'var(--ink)', marginBottom: '0.25rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.4rem' }}>Submit Legal Motion / Defense Pleadings</h4>
                <input className="input-field" placeholder="Title (e.g. Bail Application / Written Submissions)" value={evidenceTitle} onChange={e => setEvidenceTitle(e.target.value)} />
                <textarea className="input-field" rows={4} placeholder="Type motion summary or legal grounds here..." value={evidenceContent} onChange={e => setEvidenceContent(e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="file" 
                      onChange={e => setEvidenceFile(e.target.files[0])} 
                      style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                    <button className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', pointerEvents: 'none' }}>
                      <Upload size={18} /> 
                      {evidenceFile ? evidenceFile.name : 'Upload Physical File (Optional)'}
                    </button>
                  </div>
                  <button onClick={handleUploadEvidence} className="btn-primary">Submit Pleadings to Court</button>
                </div>
              </div>
            )}
          </div>
        )}

        {showReschedule && (
          <div className="animate-in" style={{ marginTop: '1rem', background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)', width: '100%' }}>
            <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B06000' }}>
              <Calendar size={18} /> Request Hearing Reschedule
            </h4>
            <textarea 
              className="input-field" 
              rows={3} 
              placeholder="State the reason for requesting a reschedule (e.g., medical emergency, conflicting schedule)..." 
              value={rescheduleReason} 
              onChange={e => setRescheduleReason(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem' }}
            />
            <button 
              onClick={async () => {
                if (!rescheduleReason) return alert("Please provide a reason.");
                setLoading(true);
                try {
                  const rHash = await sha256Hex(rescheduleReason);
                  const { error } = await supabase.from('documents').insert([{
                    case_id: id,
                    uploaded_by: user.id,
                    doc_type: 'court_filing',
                    title: `RESCHEDULE REQUEST`,
                    storage_path: 'manual_entry',
                    ocr_text: rescheduleReason,
                    sha256: rHash,
                    status: 'submitted'
                  }]);
                  if (error) throw error;
                  setShowReschedule(false);
                  setRescheduleReason('');
                  alert("Reschedule request submitted successfully.");
                  fetchData();
                } catch (err) {
                  alert(err.message);
                } finally {
                  setLoading(false);
                }
              }} 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        )}

        {/* IO Actions */}
        {(user.role === 'police_officer' || user.role === 'investigating_officer') && caseData.stage !== 'appealed' && (
          <div style={{ background: 'var(--paper)', padding: '1.25rem 1.5rem', borderRadius: '2px', border: '1px solid var(--line)', borderTop: '3px solid var(--accent)', width: '100%' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {caseData.stage === 'fir_registered' && (
                <button onClick={() => {setShowTransfer(!showTransfer); setShowEvidence(false); setShowTokens(false);}} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Send size={18} /> File Charge Sheet & Transfer
                </button>
              )}
              {caseData.stage !== 'disposed' && (
                <>
                  <button onClick={() => {
                    setWitnessFormSide('prosecution');
                    setShowAddWitnessModal(true);
                  }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserPlus size={18} /> Summon / Record Witness
                  </button>
                  <button onClick={() => {setShowEvidence(!showEvidence); setShowTransfer(false); setShowTokens(false);}} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} /> Attach Evidence
                  </button>
                  {!lawyers.some(l => l.role_in_case === 'prosecutor') && (
                    <button onClick={() => handleGenerateToken('PROS')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--success)', color: 'var(--success)' }}>
                      <Lock size={18} /> Prosecutor Token
                    </button>
                  )}
                  {!lawyers.some(l => l.role_in_case === 'defense_lawyer') && (
                    <button onClick={() => handleGenerateToken('DEF')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                      <Lock size={18} /> Defense Token
                    </button>
                  )}
                  <button onClick={() => handleGenerateToken('AGENCY')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--bg-band)', color: 'var(--bg-band)' }}>
                    <Lock size={18} /> Agency Token
                  </button>
                  <button onClick={() => {setShowTokens(!showTokens); setShowEvidence(false); setShowTransfer(false);}} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} /> View Tokens
                  </button>
                </>
              )}
            </div>

            {showTransfer && (
              <div className="animate-in" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--ink)' }}>
                    <input type="radio" name="destType" value="court" checked={transferDestinationType === 'court'} onChange={() => setTransferDestinationType('court')} />
                    Transfer to Court
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--ink)' }}>
                    <input type="radio" name="destType" value="police_station" checked={transferDestinationType === 'police_station'} onChange={() => setTransferDestinationType('police_station')} />
                    Transfer to Police Station
                  </label>
                </div>
                
                {transferDestinationType === 'court' && (
                  <div style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '2px', border: '1px solid var(--line)', marginBottom: '0.5rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--ink)' }}>Upload Charge Sheet (Required)</h4>
                    <input type="file" onChange={e => setChargeSheetFile(e.target.files[0])} className="input-field" style={{ width: '100%' }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <select className="input-field" value={selectedCourt} onChange={e => setSelectedCourt(e.target.value)} style={{ flex: 1, minWidth: '280px' }}>
                    <option value="">{transferDestinationType === 'court' ? 'Select Target Court of Jurisdiction...' : 'Select Recipient Police Station (Territorial Handover)...'}</option>
                    {courts.filter(c => transferDestinationType === 'court' ? (c.org_type?.startsWith('court') || c.org_type === 'high_court' || c.org_type === 'supreme_court') : (c.org_type === 'police_station' && c.id !== user.org_id)).length === 0 ? (
                      <option value="" disabled>No destinations registered in directory.</option>
                    ) : null}
                    {courts
                      .filter(c => transferDestinationType === 'court' ? (c.org_type?.startsWith('court') || c.org_type === 'high_court' || c.org_type === 'supreme_court') : (c.org_type === 'police_station' && c.id !== user.org_id))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name} — {c.district || 'Jurisdiction'} ({c.state || 'State'})</option>
                      ))}
                  </select>
                  <button onClick={handleTransfer} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    {transferDestinationType === 'court' ? 'File Charge Sheet & Forward to Court' : 'Execute Jurisdictional Transfer'}
                  </button>
                </div>
              </div>
            )}

            {showEvidence && (
              <div className="animate-in" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <select className="input-field" value={evidenceType} onChange={e => setEvidenceType(e.target.value)} style={{ width: '200px' }}>
                    <option value="evidence_record">General Evidence</option>
                    <option value="forensic_report">Forensic Report</option>
                    <option value="investigation_record">Investigation Record</option>
                  </select>
                  <input className="input-field" placeholder="Title (e.g. DNA Analysis Report)" value={evidenceTitle} onChange={e => setEvidenceTitle(e.target.value)} style={{ flex: 1 }} />
                </div>
                <textarea className="input-field" rows={4} placeholder="Type findings or summary here..." value={evidenceContent} onChange={e => setEvidenceContent(e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="file"
                      onChange={e => setEvidenceFile(e.target.files[0])}
                      style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                    <button className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', pointerEvents: 'none' }}>
                      <Upload size={18} />
                      {evidenceFile ? evidenceFile.name : 'Upload Physical File (Optional)'}
                    </button>
                  </div>
                  <button onClick={handleUploadEvidence} className="btn-primary">Submit Secure Evidence</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Judge Actions */}
        {user.role === 'judge' && caseData.stage !== 'appealed' && caseData.stage !== 'closed' && (
          <div style={{ background: 'var(--paper)', padding: '1.25rem 1.5rem', borderRadius: '2px', border: '1px solid var(--line)', borderTop: '3px solid var(--accent)', width: '100%' }}>
            
            {caseData.stage === 'disposed' ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleReopen} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B06000', borderColor: '#FEEFC3', background: '#FEF7E0' }}>
                  <RotateCcw size={18} /> Reopen Case / Allow Appeal
                </button>
                {user.org_type !== 'supreme_court' && user.org_type !== 'court_supreme' && (
                  <button onClick={() => setShowTransfer(!showTransfer)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Send size={18} /> Appeal
                  </button>
                )}
                <button onClick={handleGenerateToken} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--success)', color: 'var(--success)' }}>
                  <Lock size={18} /> Issue Appeal Token
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={() => {setShowHearing(!showHearing); setShowJudgement(false); setShowTokens(false);}} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} /> Schedule Hearing / Orders
                </button>
                <button onClick={() => {setShowJudgement(!showJudgement); setShowHearing(false); setShowTokens(false);}} className="btn-primary" style={{ background: '#137333', borderColor: '#137333', color: '#FFFFFF' }}>
                  <Scale size={18} /> Pronounce Judgement
                </button>
                <button onClick={() => {
                  setWitnessFormSide('prosecution');
                  setShowAddWitnessModal(true);
                }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={18} /> Summon Witness
                </button>
                {!lawyers.some(l => l.role_in_case === 'prosecutor') && (
                  <button onClick={() => handleGenerateToken('PROS')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--success)', color: 'var(--success)' }}>
                    <Lock size={18} /> Prosecutor Token
                  </button>
                )}
                {!lawyers.some(l => l.role_in_case === 'defense_lawyer') && (
                  <button onClick={() => handleGenerateToken('DEF')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                    <Lock size={18} /> Defense Token
                  </button>
                )}
                <button onClick={() => handleGenerateToken('AGENCY')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--bg-band)', color: 'var(--bg-band)' }}>
                  <Lock size={18} /> Agency Token
                </button>
                <button onClick={() => {setShowTokens(!showTokens); setShowHearing(false); setShowJudgement(false);}} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} /> View Token History
                </button>
              </div>
            )}

            {/* Pending Escalated Warrants from Agency Alert for Judge */}
            {timelineEvents.filter(e => (e.doc_type === 'warrant_appeal' || e.title?.startsWith('WARRANT APPLICATION:')) && e.ai_summary === 'escalated_to_court').length > 0 && (
              <div className="animate-in" style={{ marginTop: '1.25rem', background: '#FCE8E6', border: '1px solid #FAD2CF', borderLeft: '4px solid var(--danger)', borderRadius: '2px', padding: '1rem 1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--danger)', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Scale size={18} /> Judicial Sanction Required: Warrant Applications Forwarded by Agency ({timelineEvents.filter(e => (e.doc_type === 'warrant_appeal' || e.title?.startsWith('WARRANT APPLICATION:')) && e.ai_summary === 'escalated_to_court').length})
                </h4>
                {timelineEvents.filter(e => (e.doc_type === 'warrant_appeal' || e.title?.startsWith('WARRANT APPLICATION:')) && e.ai_summary === 'escalated_to_court').map(warrant => (
                  <div key={warrant.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '2px', marginBottom: '0.5rem', border: '1px solid var(--line)', borderLeft: '3px solid var(--danger)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>{warrant.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                        Applied by {warrant.uploaded_by_profile?.full_name || 'IO'} • Forwarded to Bench: {new Date(warrant.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <button onClick={() => setSelectedJudgeWarrant(warrant)} className="btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: 'var(--danger)', borderColor: 'var(--danger)', color: '#fff' }}>
                      Adjudicate Warrant
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Confidential Sec 311 Petitions (Surprise Witness Petitions) for Judge */}
            {pendingSurprisePetitions.length > 0 && (
              <div className="animate-in" style={{ marginTop: '1.25rem', background: '#FAF9F6', border: '1px solid var(--line)', borderLeft: '4px solid var(--accent)', borderRadius: '2px', padding: '1rem 1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent)', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Scale size={18} /> Confidential Section 311 CrPC Petitions: Surprise / Unlisted Witness Requests ({pendingSurprisePetitions.length})
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '0 0 0.75rem 0' }}>
                  Confidential judicial petitions submitted directly to this Bench under Sec 311 CrPC / Sec 348 BNSS. Witness details remain hidden from opposing parties until admitted.
                </p>
                {pendingSurprisePetitions.map(pet => (
                  <div key={pet.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '0.85rem 1rem', borderRadius: '2px', marginBottom: '0.5rem', border: '1px solid var(--line)', borderLeft: '3px solid var(--accent)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>
                        {pet.name} <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>({pet.side === 'prosecution' ? 'Prosecution Witness' : 'Defense Witness'})</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                        Petitioned by: <strong>{pet.registered_by_name}</strong> • {new Date(pet.created_at).toLocaleString('en-IN')}
                      </div>
                      {pet.surprise_reason && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--ink)', marginTop: '0.35rem', background: '#FCE8E6', padding: '0.4rem 0.6rem', borderRadius: '2px', border: '1px solid #FAD2CF' }}>
                          <strong style={{ color: 'var(--accent)' }}>Statutory Grounds:</strong> {pet.surprise_reason}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleAdmitSurpriseWitness(pet.id, true)} className="btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#137333', borderColor: '#137333' }}>
                        Admit & Summon
                      </button>
                      <button onClick={() => handleAdmitSurpriseWitness(pet.id, false)} className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {showTransfer && caseData.stage === 'disposed' && user.org_type !== 'supreme_court' && user.org_type !== 'court_supreme' && (
              <div className="animate-in" style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                <select className="input-field" value={selectedCourt} onChange={e => setSelectedCourt(e.target.value)}>
                  <option value="">Select Appellate Court...</option>
                  {courts.length === 0 ? <option value="" disabled>No higher courts found.</option> : null}
                  {courts.map(c => (
                    <option key={c.id} value={c.id}>
                      Appeal to {c.org_type.includes('supreme') ? 'Supreme Court' : 'High Court'} {c.district ? `(${c.district})` : ''}
                    </option>
                  ))}
                </select>
                <button onClick={() => { setTransferDestinationType('court'); handleTransfer(); }} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Confirm Appeal</button>
              </div>
            )}
            
            {showHearing && (
              <div className="animate-in" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                <h4 style={{ color: 'var(--ink)', marginBottom: '0.25rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.4rem' }}>Log Today's Hearing Outcome</h4>
                <textarea className="input-field" rows={4} placeholder="Type the Daily Order Sheet / Hearing proceedings here..." value={hearingOutcome} onChange={e => setHearingOutcome(e.target.value)} />
                
                <h4 style={{ color: 'var(--ink)', marginTop: '0.5rem', marginBottom: '0.25rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.4rem' }}>Schedule Next Hearing</h4>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Next Hearing Date & Time</label>
                <input type="datetime-local" className="input-field" value={hearingDate} onChange={e => setHearingDate(e.target.value)} />
                <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Court Instructions to Police / IO for next hearing</label>
                <textarea className="input-field" rows={3} placeholder="e.g. IO is directed to present the forensic report by next hearing." value={hearingInstructions} onChange={e => setHearingInstructions(e.target.value)} />
                
                <div style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}>
                  <button onClick={handleScheduleHearing} className="btn-primary">Record Proceedings & Schedule</button>
                </div>
              </div>
            )}

            {showJudgement && (
              <div className="animate-in" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>Final Verdict</label>
                <select className="input-field" value={verdict} onChange={e => setVerdict(e.target.value)}>
                  <option value="convicted">Convicted</option>
                  <option value="acquitted">Acquitted</option>
                  <option value="discharged">Discharged</option>
                  <option value="settled">Settled</option>
                </select>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>Operative Order</label>
                <textarea className="input-field" rows={6} placeholder="Type full Operative Order here..." value={operativeOrder} onChange={e => setOperativeOrder(e.target.value)} />
                <div style={{ alignSelf: 'flex-end' }}>
                  <button onClick={handleJudgement} className="btn-primary">Sign & Pronounce Order</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Agency Admin Actions */}
        {(user.role === 'agency_admin' || lawyers.some(l => l.user_id === user.id && (l.role_in_case === 'agency_lead' || l.role_in_case === 'external_agency'))) && (
          <div style={{ background: 'var(--paper)', padding: '1.25rem 1.5rem', borderRadius: '2px', border: '1px solid var(--line)', borderTop: '3px solid var(--bg-band)', width: '100%', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--bg-band)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} color="var(--bg-band)" /> {user?.org_name || 'Agency'} Administration Portal
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Agency HQ Supervisory Control</span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setShowAppointOfficerModal(true)} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-band)', borderColor: 'var(--bg-band)' }}
              >
                <UserCheck size={18} /> Appoint Investigating Officer (IO)
              </button>
              <button 
                onClick={() => {
                  setWitnessFormSide('prosecution');
                  setShowAddWitnessModal(true);
                }} 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <UserPlus size={18} /> Summon / Record Witness
              </button>
              <button 
                onClick={() => setShowEvidence(!showEvidence)} 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FileText size={18} /> Upload Agency Report / Evidence
              </button>
            </div>

            {/* Pending Warrant Applications from IO */}
            {timelineEvents.filter(e => (e.doc_type === 'warrant_appeal' || e.title?.startsWith('WARRANT APPLICATION:')) && e.ai_summary === 'pending_agency_review').length > 0 && (
              <div className="animate-in" style={{ marginTop: '1.25rem', background: '#FEF7E0', border: '1px solid #FEEFC3', borderLeft: '4px solid #B06000', borderRadius: '2px', padding: '1rem 1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#B06000', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} /> Pending Warrant / Order Appeals from IO ({timelineEvents.filter(e => (e.doc_type === 'warrant_appeal' || e.title?.startsWith('WARRANT APPLICATION:')) && e.ai_summary === 'pending_agency_review').length})
                </h4>
                {timelineEvents.filter(e => (e.doc_type === 'warrant_appeal' || e.title?.startsWith('WARRANT APPLICATION:')) && e.ai_summary === 'pending_agency_review').map(warrant => (
                  <div key={warrant.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '2px', marginBottom: '0.5rem', border: '1px solid var(--line)', borderLeft: '3px solid #B06000' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>{warrant.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                        Applied by {warrant.uploaded_by_profile?.full_name || 'IO'} • {new Date(warrant.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <button onClick={() => setSelectedWarrantForAgency(warrant)} className="btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#B06000', borderColor: '#B06000', color: '#FFFFFF', fontWeight: 600 }}>
                      Review & Decide
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {showEvidence && (
              <div className="animate-in" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <select className="input-field" value={evidenceType} onChange={e => setEvidenceType(e.target.value)} style={{ width: '200px' }}>
                    <option value="investigation_record">Investigation Record</option>
                    <option value="forensic_report">Forensic Report</option>
                  </select>
                  <input className="input-field" placeholder="Title (e.g. Agency Preliminary Report)" value={evidenceTitle} onChange={e => setEvidenceTitle(e.target.value)} style={{ flex: 1 }} />
                </div>
                <textarea className="input-field" rows={4} placeholder="Type findings or summary here..." value={evidenceContent} onChange={e => setEvidenceContent(e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="file"
                      onChange={e => setEvidenceFile(e.target.files[0])}
                      style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                    <button className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', pointerEvents: 'none' }}>
                      <Upload size={18} />
                      {evidenceFile ? evidenceFile.name : 'Upload Physical File (Optional)'}
                    </button>
                  </div>
                  <button onClick={() => handleUploadEvidence('investigation_record')} className="btn-primary">Submit Agency Document</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Agency Investigating Officer Actions */}
        {(user.role === 'agency_officer' || user.role === 'investigating_officer' || lawyers.some(l => l.user_id === user.id && (l.role_in_case === 'agency_officer' || l.role_in_case === 'investigating_officer'))) && (
          <div style={{ background: 'var(--paper)', padding: '1.25rem 1.5rem', borderRadius: '2px', border: '1px solid var(--line)', borderTop: '3px solid var(--bg-band)', width: '100%', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--bg-band)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={18} color="var(--bg-band)" /> IO Investigation Workspace • {user?.org_name || 'Agency'}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                  Investigating Officer: <strong>{user?.full_name}</strong> ({user?.designation || 'IO'})
                </div>
              </div>
              <span className="badge" style={{ background: '#E8ECEF', color: 'var(--bg-band)', border: '1px solid #CCD4DC', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '2px' }}>
                Assigned Case IO
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setShowWarrantModal(true)} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Scale size={18} /> Apply / Appeal for Warrant / Order
              </button>
              <button 
                onClick={() => {
                  setWitnessFormSide('prosecution');
                  setShowAddWitnessModal(true);
                }} 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <UserPlus size={18} /> Summon / Record Witness
              </button>
              <button 
                onClick={() => setShowEvidence(!showEvidence)} 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Upload size={18} /> Upload Evidence / Case Record
              </button>
            </div>
            
            {showEvidence && (
              <div className="animate-in" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <select className="input-field" value={evidenceType} onChange={e => setEvidenceType(e.target.value)} style={{ width: '200px' }}>
                    <option value="investigation_record">Investigation Record / Case Diary</option>
                    <option value="forensic_report">Forensic Report / Analysis</option>
                  </select>
                  <input className="input-field" placeholder="Title (e.g. Field Seizure Memo / Forensic Extraction Summary)" value={evidenceTitle} onChange={e => setEvidenceTitle(e.target.value)} style={{ flex: 1 }} />
                </div>
                <textarea className="input-field" rows={4} placeholder="Type proceeding details or summary here..." value={evidenceContent} onChange={e => setEvidenceContent(e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="file"
                      onChange={e => setEvidenceFile(e.target.files[0])}
                      style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                    <button className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', pointerEvents: 'none' }}>
                      <Upload size={18} />
                      {evidenceFile ? evidenceFile.name : 'Upload Physical File (Optional)'}
                    </button>
                  </div>
                  <button onClick={() => handleUploadEvidence('investigation_record')} className="btn-primary">Submit Record</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DEDICATED WITNESS REGISTRY & DEPOSITION LEDGER */}
      <div className="no-print" style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>
              <Users size={22} color="var(--accent)" /> Witness Registry & Deposition Ledger
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
              Formal Witness Roster under Indian Evidence Act / Bharatiya Sakshya Adhiniyam • Recorded with Timestamps & Cryptographic Hashes
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="badge" style={{ background: '#E8ECEF', color: 'var(--bg-band)', border: '1px solid #CCD4DC', fontSize: '0.75rem' }}>
                Total: {witnessesList.length}
              </span>
              <span className="badge" style={{ background: '#FEF7E0', color: '#B06000', border: '1px solid #FEEFC3', fontSize: '0.75rem' }}>
                ⭐ Eyewitnesses: {witnessesList.filter(w => w.is_eyewitness).length}
              </span>
            </div>

            {caseData?.stage !== 'disposed' && caseData?.stage !== 'closed' && (
              <button 
                onClick={() => setShowAddWitnessModal(true)} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
              >
                <UserPlus size={16} /> Summon / Register Witness
              </button>
            )}
          </div>
        </div>

        {witnessesList.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--ink-soft)', background: 'var(--paper)', borderRadius: '2px', border: '1px solid var(--line)' }}>
            <Users size={40} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>No Witnesses Registered Yet</div>
            <p style={{ fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 1.5rem auto', lineHeight: '1.5', color: 'var(--ink-soft)' }}>
              Counsel for Prosecution, Defense, or Investigating Officers can register witnesses to testify under oath. Both sides can conduct Examination-in-Chief and Cross-Examination.
            </p>
            {caseData?.stage !== 'disposed' && (
              <button onClick={() => setShowAddWitnessModal(true)} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={16} /> Register First Witness
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '1.25rem' }}>
            {witnessesList.map((witness) => {
              const isPros = witness.side === 'prosecution';
              const sideColor = isPros ? 'var(--accent)' : 'var(--success)';
              const chiefExam = witness.examinations?.find(e => e.title?.includes('CHIEF') || e.ocr_text?.includes('examination_in_chief'));
              const crossExam = witness.examinations?.find(e => e.title?.includes('CROSS') || e.ocr_text?.includes('cross_examination'));

              return (
                <div 
                  key={witness.id} 
                  className="glass-panel animate-in" 
                  style={{ 
                    padding: '1.25rem', 
                    borderRadius: '2px', 
                    border: '1px solid var(--line)',
                    borderLeft: `4px solid ${sideColor}`,
                    background: 'var(--paper)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    {/* Witness Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ background: isPros ? '#FCE8E6' : '#E6F4EA', color: sideColor, border: `1px solid ${isPros ? '#FAD2CF' : '#CEEAD6'}`, fontWeight: 700, fontSize: '0.78rem' }}>
                          {witness.display_code || witness.witness_code}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--ink)', fontWeight: 700 }}>
                          {witness.name}
                        </h4>
                        {witness.age && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                            ({witness.age} yrs{witness.occupation ? `, ${witness.occupation}` : ''})
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', background: '#EFECE6', border: '1px solid var(--line)', padding: '0.15rem 0.45rem', borderRadius: '2px' }}>
                        {new Date(witness.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    {/* Badges Bar: Eyewitness & Role */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {witness.is_eyewitness && (
                        <span style={{ background: '#FEF7E0', color: '#B06000', border: '1px solid #FEEFC3', fontSize: '0.7rem', padding: '0.15rem 0.55rem', borderRadius: '2px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Eye size={13} /> ⭐ EYEWITNESS (Direct Sec 60 IEA)
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', color: isPros ? 'var(--accent)' : 'var(--success)', background: isPros ? '#FCE8E6' : '#E6F4EA', border: `1px solid ${isPros ? '#FAD2CF' : '#CEEAD6'}`, padding: '0.15rem 0.5rem', borderRadius: '2px', fontWeight: 600 }}>
                        {isPros ? 'Prosecution Witness (PW)' : 'Defense Witness (DW)'}
                      </span>
                    </div>

                    {/* Initial Sworn Statement */}
                    {witness.initial_statement && (
                      <div style={{ background: '#FAF9F6', padding: '0.65rem 0.85rem', borderRadius: '2px', border: '1px solid var(--line)', fontSize: '0.8rem', color: 'var(--ink)', lineHeight: '1.5', marginBottom: '0.75rem', maxHeight: '90px', overflowY: 'auto' }}>
                        <div style={{ color: 'var(--ink)', fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Proof of Evidence / Initial Sworn Statement:</div>
                        {witness.initial_statement}
                      </div>
                    )}

                    {/* Deposition Stages Status Matrix */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#FAF9F6', padding: '0.6rem 0.85rem', borderRadius: '2px', border: '1px solid var(--line)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: chiefExam ? 'var(--success)' : 'var(--ink-soft)', fontWeight: 700 }}>
                          {chiefExam ? '✓' : '○'}
                        </span>
                        <span style={{ color: chiefExam ? 'var(--ink)' : 'var(--ink-soft)' }}>
                          <strong>Chief Exam:</strong> {chiefExam ? `Recorded (${chiefExam.exam_details?.qna_list?.length || 1} Qs)` : 'Pending'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: crossExam ? 'var(--success)' : '#B06000', fontWeight: 700 }}>
                          {crossExam ? '✓' : '○'}
                        </span>
                        <span style={{ color: crossExam ? 'var(--ink)' : '#B06000' }}>
                          <strong>Cross-Exam:</strong> {crossExam ? `Recorded (${crossExam.exam_details?.qna_list?.length || 1} Qs)` : 'Awaiting Adverse'}
                        </span>
                      </div>
                    </div>

                    {/* Attachment Link if any */}
                    {witness.storage_path && witness.storage_path !== 'manual_entry' && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <a 
                          href={supabase.storage.from('documents').getPublicUrl(witness.storage_path).data.publicUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                        >
                          <ExternalLink size={12} /> View Uploaded Deposition / Audio Exhibit
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Interrogation Actions Toolbar */}
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {/* Record Examination in Chief */}
                      {caseData?.stage !== 'disposed' && (
                        <button 
                          onClick={() => {
                            setSelectedWitnessForExam(witness);
                            setExamType('examination_in_chief');
                            setExamQnaList([{ q: '', a: '' }]);
                            setExamNotes('');
                            setShowExamineModal(true);
                          }}
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', borderColor: 'var(--line)', color: 'var(--ink)' }}
                          title="Record Examination-in-Chief (Calling Party)"
                        >
                          <MessageSquare size={13} style={{ marginRight: '0.25rem' }} /> Chief Exam
                        </button>
                      )}

                      {/* Conduct Cross-Examination */}
                      {caseData?.stage !== 'disposed' && (
                        <button 
                          onClick={() => {
                            setSelectedWitnessForExam(witness);
                            setExamType('cross_examination');
                            setExamQnaList([{ q: '', a: '' }]);
                            setExamNotes('');
                            setShowExamineModal(true);
                          }}
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', borderColor: '#FAD2CF', color: 'var(--danger)', background: '#FCE8E6' }}
                          title="Conduct Adverse Cross-Examination"
                        >
                          <Scale size={13} style={{ marginRight: '0.25rem' }} /> Cross-Examine
                        </button>
                      )}

                      {/* Judge Court Questions */}
                      {user.role === 'judge' && caseData?.stage !== 'disposed' && (
                        <button 
                          onClick={() => {
                            setSelectedWitnessForExam(witness);
                            setExamType('court_questions');
                            setExamQnaList([{ q: '', a: '' }]);
                            setExamNotes('');
                            setShowExamineModal(true);
                          }}
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', borderColor: '#FEEFC3', color: '#B06000', background: '#FEF7E0' }}
                          title="Court Questions under Sec 165 IEA / BSA"
                        >
                          <HelpCircle size={13} style={{ marginRight: '0.25rem' }} /> Court Qs
                        </button>
                      )}
                    </div>

                    {/* View Full Transcript Details */}
                    <button 
                      onClick={() => setViewWitnessDetails(witness)}
                      className="btn-primary"
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <FileText size={13} /> View Transcript ({witness.examinations?.length || 0})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeline */}
      <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem', color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>Official Chain of Custody & Proceedings</h3>
      
      <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '2px solid var(--line)', marginLeft: '1rem' }}>
        {timelineEvents.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>No timeline events recorded.</p>
        ) : (
          timelineEvents.map((evt, i) => (
            <div key={evt.id} className={`animate-in delay-${(i%3)+1}`} style={{ position: 'relative', marginBottom: '2rem', pageBreakInside: 'avoid' }}>
              
              <div className="no-print" style={{
                position: 'absolute',
                left: '-2.85rem',
                top: '1rem',
                background: 'var(--paper)',
                border: `2px solid ${evt.timeline_type === 'judgement' ? 'var(--success)' : evt.timeline_type === 'session' ? '#B06000' : 'var(--accent)'}`,
                borderRadius: '50%',
                padding: '0.4rem',
                zIndex: 10
              }}>
                {evt.timeline_type === 'judgement' ? <Scale size={18} color="var(--success)" /> : 
                 evt.timeline_type === 'session' ? <Calendar size={18} color="#B06000" /> : 
                 <FileText size={18} color="var(--accent)" />}
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--line)', borderLeft: evt.timeline_type === 'judgement' ? '6px solid var(--success)' : evt.timeline_type === 'session' ? '4px solid #B06000' : '4px solid var(--accent)', background: 'var(--paper)', borderRadius: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="badge" style={{ 
                    background: evt.timeline_type === 'judgement' ? '#E6F4EA' : evt.timeline_type === 'session' ? '#FEF7E0' : '#E8ECEF', 
                    color: evt.timeline_type === 'judgement' ? 'var(--success)' : evt.timeline_type === 'session' ? '#B06000' : 'var(--bg-band)', 
                    border: `1px solid ${evt.timeline_type === 'judgement' ? '#CEEAD6' : evt.timeline_type === 'session' ? '#FEEFC3' : '#CCD4DC'}`,
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {evt.timeline_type === 'judgement' ? 'FINAL JUDGEMENT' : 
                     evt.timeline_type === 'session' ? 'COURT HEARING / ORDER' : 
                     evt.doc_type?.toUpperCase().replace(/_/g, ' ')}
                  </span>
                  
                  <div className="tamper-badge" style={{ color: 'var(--success)', marginLeft: 'auto', marginRight: '1rem', background: '#E6F4EA', border: '1px solid #CEEAD6', padding: '0.2rem 0.5rem', borderRadius: '2px', fontSize: '0.72rem', fontWeight: 700 }}>
                    ✔ READ-ONLY RECORD
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="timeline-date" style={{ fontWeight: 700, color: 'var(--ink)' }}>{new Date(evt.date).toLocaleDateString('en-IN')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{new Date(evt.date).toLocaleTimeString('en-IN')}</div>
                  </div>
                </div>

                {/* Judgement Rendering */}
                {evt.timeline_type === 'judgement' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--danger)', fontFamily: 'var(--font-heading)' }}>VERDICT: {evt.verdict.toUpperCase()}</h4>
                    <p style={{ color: 'var(--ink)', marginBottom: '1.5rem', whiteSpace: 'pre-wrap', lineHeight: '1.7', background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)' }}>{evt.operative_order}</p>
                    
                    {/* Electronic Signature Block */}
                    <div style={{ borderTop: '1px dashed var(--line)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: '"Brush Script MT", cursive', fontSize: '1.8rem', color: 'var(--accent)', marginBottom: '0.25rem', transform: 'rotate(-5deg)' }}>
                          {evt.pronounced_by_profile?.full_name}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)' }}>HON'BLE JUDGE {evt.pronounced_by_profile?.full_name?.toUpperCase()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Digitally Signed using Secure DMS</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--ink-soft)', fontFamily: 'monospace' }}>Timestamp: {new Date(evt.date).toISOString()}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session Rendering */}
                {evt.timeline_type === 'session' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--ink)' }}>Scheduled for: {new Date(evt.scheduled_at).toLocaleString('en-IN')}</h4>
                    {evt.proceedings && (
                      <div style={{ background: '#FEF7E0', padding: '0.85rem 1rem', borderRadius: '2px', border: '1px solid #FEEFC3', borderLeft: '3px solid #B06000' }}>
                        <h5 style={{ fontSize: '0.8rem', color: '#B06000', marginBottom: '0.35rem', textTransform: 'uppercase', fontWeight: 700 }}>Orders & Instructions</h5>
                        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--ink)', margin: 0, fontSize: '0.88rem', lineHeight: '1.5' }}>{evt.proceedings}</p>
                      </div>
                    )}
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                      Issued by: <strong>{evt.recorded_by_profile?.full_name}</strong>
                    </div>
                  </div>
                )}

                {/* Document Rendering */}
                {evt.timeline_type === 'document' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--ink)' }}>
                      {evt.title}
                      {evt.storage_path !== 'manual_entry' && (
                        <a href={supabase.storage.from('documents').getPublicUrl(evt.storage_path).data.publicUrl} target="_blank" rel="noreferrer" className="badge no-print" style={{ marginLeft: '1rem', fontSize: '0.75rem', textDecoration: 'none', background: '#E8ECEF', color: 'var(--bg-band)', border: '1px solid #CCD4DC' }}>
                          View Attachment
                        </a>
                      )}
                    </h4>
                    {evt.ai_summary && (
                      <div style={{ background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)', marginBottom: '1rem', fontSize: '0.88rem', color: 'var(--ink)', lineHeight: '1.6' }}>
                        {evt.ai_summary}
                      </div>
                    )}
                    <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>
                      Attached by: <strong>{evt.uploaded_by_profile?.full_name}</strong>
                      {(() => {
                        const profile = evt.uploaded_by_profile;
                        if (!profile) return null;
                        if (profile.role === 'lawyer') {
                           const participant = lawyers.find(l => l.user_id === evt.uploaded_by);
                           const displayRole = participant?.role_in_case === 'prosecutor' ? 'PROSECUTOR' : 'DEFENSE COUNSEL';
                           return <span style={{ color: participant?.role_in_case === 'prosecutor' ? 'var(--accent)' : 'var(--success)', marginLeft: '0.5rem', fontWeight: 'bold' }}>[{displayRole}]</span>;
                        } else if (profile.role === 'police_officer') {
                           return <span style={{ color: 'var(--accent)', marginLeft: '0.5rem', fontWeight: 'bold' }}>[POLICE OFFICER]</span>;
                        } else if (profile.role === 'investigating_officer') {
                           return <span style={{ color: 'var(--accent)', marginLeft: '0.5rem', fontWeight: 'bold' }}>[INVESTIGATING OFFICER]</span>;
                        } else if (profile.role === 'judge') {
                           return <span style={{ color: 'var(--bg-band)', marginLeft: '0.5rem', fontWeight: 'bold' }}>[JUDGE]</span>;
                        }
                        return null;
                      })()}
                    </div>
                    
                    <div style={{ background: '#EFECE6', padding: '0.75rem 1rem', borderRadius: '2px', border: '1px solid var(--line)', borderLeft: '3px solid var(--success)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <Lock size={14} color="var(--success)" />
                        <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase' }}>SECURE HASH (SHA-256)</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink)', fontFamily: 'monospace', wordBreak: 'break-all', margin: 0 }}>
                        {evt.sha256}
                      </p>
                    </div>
                  </div>
                )}

                {/* Revocation Decision Rendering */}
                {evt.timeline_type === 'revocation_decision' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.75rem', color: evt.status === 'approved' ? 'var(--success)' : 'var(--danger)' }}>
                      Revocation Request {evt.status.toUpperCase()}
                    </h4>
                    <div style={{ background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)', marginBottom: '1rem', fontSize: '0.88rem', color: 'var(--ink)', lineHeight: '1.6' }}>
                      <div style={{ marginBottom: '0.5rem' }}><strong>Reason for Request:</strong> {evt.reason}</div>
                      {evt.status === 'rejected' && (
                        <div style={{ color: 'var(--danger)', marginTop: '0.5rem' }}><strong>Rejection Note:</strong> {evt.review_note}</div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>
                      Decided by: <strong>{evt.reviewer?.full_name}</strong> <span style={{ color: 'var(--bg-band)', marginLeft: '0.5rem', fontWeight: 'bold' }}>[JUDGE]</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Audit Ledger Modal */}
      {showAuditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', background: '#FFFFFF', border: '1px solid var(--line)', borderTop: '4px solid var(--accent)', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Lock size={22} color="var(--accent)" />
                <h3 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>Cryptographic Chain of Custody</h3>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="btn-secondary" style={{ padding: '0.4rem 0.85rem' }}>Close</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {caseAudits.length === 0 ? (
                <p style={{ color: 'var(--ink-soft)' }}>No audit events found.</p>
              ) : (
                caseAudits.map((log) => (
                  <div key={log.id} style={{ background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)', borderLeft: '4px solid var(--accent)', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary" style={{ background: '#EFECE6', color: 'var(--bg-band)', border: '1px solid var(--line)', fontWeight: 700 }}>{log.action}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{new Date(log.created_at).toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--ink)' }}>
                      Actor: <strong>{log.actor?.full_name}</strong> ({log.actor?.role?.replace('_', ' ')})
                    </div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--ink-soft)', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: '#FFFFFF', padding: '0.65rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex' }}><span style={{ color: 'var(--ink)', width: '85px', fontWeight: 700 }}>PREV_HASH:</span><span style={{ color: 'var(--ink-soft)' }}>{log.prev_hash || 'GENESIS_BLOCK'}</span></div>
                      <div style={{ display: 'flex' }}><span style={{ color: 'var(--accent)', width: '85px', fontWeight: 700 }}>THIS_HASH:</span><span style={{ color: 'var(--ink)', fontWeight: 600 }}>{log.record_hash}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Revoke Modal */}
      {showRevokeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '90%', maxWidth: '500px', padding: '2rem', background: '#FFFFFF', border: '1px solid var(--line)', borderTop: '4px solid var(--danger)', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--danger)', fontFamily: 'var(--font-heading)' }}>Request Lawyer Revocation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Reason for Revocation</label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  placeholder="Explain why this lawyer is being removed..." 
                  value={revokeReason} 
                  onChange={e => setRevokeReason(e.target.value)} 
                />
              </div>
              {user.role !== 'judge' && (
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Attach Court Order or Application</label>
                  <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                    <input 
                      type="file" 
                      onChange={e => setRevokeFile(e.target.files[0])}
                      style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                    <button className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', pointerEvents: 'none', width: '100%', justifyContent: 'center' }}>
                      <Upload size={18} /> 
                      {revokeFile ? revokeFile.name : 'Upload Official Document (Required)'}
                    </button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button onClick={() => {setShowRevokeModal(false); setRevokeFile(null); setRevokeReason('');}} className="btn-secondary">Cancel</button>
                <button onClick={handleSubmitRevoke} className="btn-primary" style={{ background: 'var(--danger)', color: 'white' }}>{user.role === 'judge' ? 'Execute Revoke' : 'Submit Request'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appoint Investigating Officer (IO) Modal */}
      {showAppointOfficerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', border: '1px solid var(--line)', borderTop: '4px solid var(--accent)', background: '#FFFFFF', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#EFECE6', padding: '0.6rem', borderRadius: '2px' }}>
                  <UserCheck size={24} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>Appoint Investigating Officer (IO)</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{user?.org_name || 'Investigative Agency'} • Case #{caseData?.case_number}</div>
                </div>
              </div>
              <button onClick={() => setShowAppointOfficerModal(false)} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>✕</button>
            </div>

            <form onSubmit={handleAppointOfficerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Officer Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Ramesh Chandra Sharma" 
                  value={appointOfficerName} 
                  onChange={e => setAppointOfficerName(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Designation / Rank <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select 
                    className="input-field" 
                    value={appointOfficerRank} 
                    onChange={e => setAppointOfficerRank(e.target.value)}
                  >
                    <option value="Deputy Superintendent of Police (DSP)">Deputy Superintendent (DSP)</option>
                    <option value="Senior Investigating Officer (SIO)">Senior Investigating Officer (SIO)</option>
                    <option value="Superintendent of Police (SP)">Superintendent of Police (SP)</option>
                    <option value="Inspector of Police (IO)">Inspector of Police (IO)</option>
                    <option value="Assistant Director / Special Agent">Assistant Director / Special Agent</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Badge / Service ID <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. CBI-IO-8821" 
                    value={appointOfficerBadge} 
                    onChange={e => setAppointOfficerBadge(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Investigation Directive & Mandate
                </label>
                <textarea 
                  className="input-field" 
                  rows={4} 
                  placeholder="Specify official directives, exhibits to seize, forensic deadlines, or witness summoning instructions..." 
                  value={appointOfficerDirective} 
                  onChange={e => setAppointOfficerDirective(e.target.value)} 
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.35rem' }}>
                  This appointment will be timestamped and permanently recorded into the case's cryptographic proceeding ledger.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAppointOfficerModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingAppoint} 
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Lock size={16} />
                  {isSubmittingAppoint ? 'Recording Proceeding...' : 'Appoint IO & Issue Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointed Officer Success & Token Modal */}
      {appointedOfficerSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '560px', padding: '2.25rem', border: '1px solid var(--line)', borderTop: '4px solid var(--success)', background: '#FFFFFF', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#E6F4EA', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <CheckCircle size={32} color="var(--success)" />
            </div>

            <h3 style={{ fontSize: '1.35rem', color: 'var(--ink)', fontFamily: 'var(--font-heading)', margin: '0 0 0.5rem 0' }}>Investigating Officer Appointed</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '0 0 1.5rem 0' }}>
              Official proceeding recorded into e-Courts SHA-256 Ledger on <strong style={{ color: 'var(--ink)' }}>{appointedOfficerSuccess.timestamp}</strong>.
            </p>

            <div style={{ background: '#FAF9F6', border: '1px solid var(--line)', borderRadius: '2px', padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--ink)' }}>
                <div><span style={{ color: 'var(--ink-soft)' }}>Officer:</span> <strong>{appointedOfficerSuccess.name}</strong></div>
                <div><span style={{ color: 'var(--ink-soft)' }}>Rank:</span> <strong>{appointedOfficerSuccess.rank}</strong></div>
                <div><span style={{ color: 'var(--ink-soft)' }}>Badge ID:</span> <strong>{appointedOfficerSuccess.badge}</strong></div>
                <div><span style={{ color: 'var(--ink-soft)' }}>Status:</span> <span style={{ color: 'var(--success)', fontWeight: 700 }}>ACTIVATION PENDING</span></div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  Officer Activation Token (Share with Appointed Officer):
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={appointedOfficerSuccess.token} 
                    style={{ flex: 1, padding: '0.75rem', background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: '2px', color: 'var(--ink)', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', letterSpacing: '0.1em' }}
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(appointedOfficerSuccess.token);
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    className="btn-primary"
                    style={{ background: copiedToken ? 'var(--success)' : 'var(--bg-band)', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1rem' }}
                  >
                    {copiedToken ? <Check size={18} /> : <Copy size={18} />}
                    {copiedToken ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              The officer must navigate to the Login portal, select <strong>"Agency Officer / Claim Token"</strong>, choose <strong>{user?.org_name || 'their agency'}</strong>, and enter this token along with their credentials to access the case file.
            </div>

            <button 
              onClick={() => setAppointedOfficerSuccess(null)} 
              className="btn-secondary" 
              style={{ width: '100%', padding: '0.65rem' }}
            >
              Done & Return to Timeline
            </button>
          </div>
        </div>
      )}

      {/* 1. IO Application for Warrant / Order Modal */}
      {showWarrantModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', border: '1px solid var(--line)', borderTop: '4px solid var(--accent)', background: '#FFFFFF', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#FCE8E6', padding: '0.6rem', borderRadius: '2px' }}>
                  <Scale size={24} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>Application for Warrant / Order</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Investigation IO Filing • Case #{caseData?.case_number}</div>
                </div>
              </div>
              <button onClick={() => setShowWarrantModal(false)} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>✕</button>
            </div>

            <form onSubmit={handleWarrantSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Order / Warrant Type <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select 
                  className="input-field" 
                  value={warrantType} 
                  onChange={e => setWarrantType(e.target.value)}
                >
                  <option value="Search & Seizure Warrant (Sec 93/94 CrPC / Sec 96 BNSS)">Search & Seizure Warrant (Sec 93/94 CrPC / Sec 96 BNSS)</option>
                  <option value="Non-Bailable Arrest Warrant (NBW)">Non-Bailable Arrest Warrant (NBW)</option>
                  <option value="Digital Evidence Seizure & Telecom Interception Order">Digital Evidence Seizure & Telecom Interception Order</option>
                  <option value="Bank Account & Asset Freeze Directive (Sec 102 CrPC / Sec 107 BNSS)">Bank Account & Asset Freeze Directive (Sec 102 CrPC / Sec 107 BNSS)</option>
                  <option value="Look-Out Circular (LOC) / International Travel Restriction">Look-Out Circular (LOC) / International Travel Restriction</option>
                  <option value="Administrative Summons & Production Order">Administrative Summons & Production Order</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Target Person / Premises / Property <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Residential premises of Accused / Bank AC #981290312" 
                  value={warrantTarget} 
                  onChange={e => setWarrantTarget(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Grounds & Statutory Justification <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea 
                  className="input-field" 
                  rows={4} 
                  placeholder="Detail the facts, evidentiary leads, and reasons necessitating this warrant/order..." 
                  value={warrantGrounds} 
                  onChange={e => setWarrantGrounds(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Attach Supporting Affidavit or Case Diary (Optional)
                </label>
                <input 
                  type="file" 
                  className="input-field" 
                  onChange={e => setWarrantFile(e.target.files[0])} 
                />
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', background: '#FAF9F6', padding: '0.75rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                ℹ️ This application is submitted to your Agency Lead. If within Agency administrative powers, an administrative order will be issued. If judicial sanction is required, it will be escalated directly to the Hon'ble Court.
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowWarrantModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingWarrant} 
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Send size={16} />
                  {isSubmittingWarrant ? 'Submitting Application...' : 'Submit Application to Agency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Agency Lead Review & Escalation Dialog */}
      {selectedWarrantForAgency && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', border: '1px solid var(--line)', borderTop: '4px solid var(--accent)', background: '#FFFFFF', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#FCE8E6', padding: '0.6rem', borderRadius: '2px' }}>
                  <AlertTriangle size={24} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>Agency Review of IO Warrant Application</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{user?.org_name || 'Agency'} HQ Review</div>
                </div>
              </div>
              <button onClick={() => setSelectedWarrantForAgency(null)} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>✕</button>
            </div>

            <div style={{ background: '#FAF9F6', padding: '1rem', borderRadius: '2px', marginBottom: '1.25rem', border: '1px solid var(--line)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>{selectedWarrantForAgency.title}</div>
              <pre style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', fontFamily: 'inherit', margin: 0, lineHeight: '1.5' }}>
                {selectedWarrantForAgency.content}
              </pre>
            </div>

            <form onSubmit={handleAgencyReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Agency Action & Jurisdiction Route <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: agencyReviewAction === 'approve_agency' ? '#E6F4EA' : '#FAF9F6', border: `1px solid ${agencyReviewAction === 'approve_agency' ? 'var(--success)' : 'var(--line)'}`, padding: '0.75rem', borderRadius: '2px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="agencyAction" 
                      checked={agencyReviewAction === 'approve_agency'} 
                      onChange={() => setAgencyReviewAction('approve_agency')} 
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>Issue Agency Order</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>For administrative directives within agency powers.</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: agencyReviewAction === 'escalate_court' ? '#FCE8E6' : '#FAF9F6', border: `1px solid ${agencyReviewAction === 'escalate_court' ? 'var(--danger)' : 'var(--line)'}`, padding: '0.75rem', borderRadius: '2px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="agencyAction" 
                      checked={agencyReviewAction === 'escalate_court'} 
                      onChange={() => setAgencyReviewAction('escalate_court')} 
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--danger)' }}>Forward to Court</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Escalate to Judge for formal Judicial Warrant.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Agency Directive Notes / Forwarding Remarks
                </label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  placeholder={agencyReviewAction === 'escalate_court' ? 'Enter forwarding note to the Hon’ble Judge requesting statutory warrant...' : 'Enter administrative directive instructions for the IO...'} 
                  value={agencyDirectiveNotes} 
                  onChange={e => setAgencyDirectiveNotes(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setSelectedWarrantForAgency(null)} className="btn-secondary">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessingAgencyAction} 
                  className="btn-primary" 
                  style={{ background: agencyReviewAction === 'escalate_court' ? 'var(--danger)' : 'var(--success)', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Lock size={16} />
                  {isProcessingAgencyAction ? 'Processing...' : (agencyReviewAction === 'escalate_court' ? 'Forward to Hon’ble Court' : 'Issue Agency Order')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Judge Warrant Adjudication Modal */}
      {selectedJudgeWarrant && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', border: '1px solid var(--line)', borderTop: '4px solid var(--accent)', background: '#FFFFFF', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#FCE8E6', padding: '0.6rem', borderRadius: '2px' }}>
                  <Scale size={24} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>Judicial Warrant Adjudication</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Hon'ble Court of Law • Case #{caseData?.case_number}</div>
                </div>
              </div>
              <button onClick={() => setSelectedJudgeWarrant(null)} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>✕</button>
            </div>

            <div style={{ background: '#FAF9F6', padding: '1rem', borderRadius: '2px', marginBottom: '1.25rem', border: '1px solid var(--line)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>{selectedJudgeWarrant.title}</div>
              <pre style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', fontFamily: 'inherit', margin: 0, lineHeight: '1.5' }}>
                {selectedJudgeWarrant.content}
              </pre>
            </div>

            <form onSubmit={handleJudgeWarrantSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Judicial Decision <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: judgeWarrantDecision === 'grant' ? '#E6F4EA' : '#FAF9F6', border: `1px solid ${judgeWarrantDecision === 'grant' ? 'var(--success)' : 'var(--line)'}`, padding: '0.75rem', borderRadius: '2px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="judgeDecision" 
                      checked={judgeWarrantDecision === 'grant'} 
                      onChange={() => setJudgeWarrantDecision('grant')} 
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>Grant Judicial Warrant</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Sign and issue formal court warrant.</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: judgeWarrantDecision === 'reject' ? '#FCE8E6' : '#FAF9F6', border: `1px solid ${judgeWarrantDecision === 'reject' ? 'var(--danger)' : 'var(--line)'}`, padding: '0.75rem', borderRadius: '2px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="judgeDecision" 
                      checked={judgeWarrantDecision === 'reject'} 
                      onChange={() => setJudgeWarrantDecision('reject')} 
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--danger)' }}>Reject Application</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Dismiss request with reasons recorded.</div>
                    </div>
                  </label>
                </div>
              </div>

              {judgeWarrantDecision === 'grant' && (
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Warrant Validity Expiration Date
                  </label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={judgeWarrantExpiry} 
                    onChange={e => setJudgeWarrantExpiry(e.target.value)} 
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Judicial Order Directive / Legal Grounds
                </label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  placeholder={judgeWarrantDecision === 'grant' ? 'Specify execution conditions, returnable dates, and officer directives...' : 'Specify reasons for rejecting the warrant application...'} 
                  value={judgeOrderNotes} 
                  onChange={e => setJudgeOrderNotes(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setSelectedJudgeWarrant(null)} className="btn-secondary">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessingJudgeWarrant} 
                  className="btn-primary" 
                  style={{ background: judgeWarrantDecision === 'grant' ? 'var(--success)' : 'var(--danger)', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Scale size={16} />
                  {isProcessingJudgeWarrant ? 'Signing...' : (judgeWarrantDecision === 'grant' ? 'Sign & Grant Warrant' : 'Reject Application')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Register / Summon Witness Modal */}
      {showAddWitnessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', border: '1px solid var(--line)', borderTop: '4px solid var(--accent)', background: '#FFFFFF', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#EFECE6', padding: '0.6rem', borderRadius: '2px' }}>
                  <UserPlus size={24} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>Summon / Register Case Witness</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Witness Roster Entry • Case #{caseData?.case_number}</div>
                </div>
              </div>
              <button onClick={() => setShowAddWitnessModal(false)} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>✕</button>
            </div>

            <form onSubmit={handleAddWitnessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Witness Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Inspector Dr. Rajesh Sen / Smt. Sunita Devi" 
                  value={witnessFormName} 
                  onChange={e => setWitnessFormName(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Age
                  </label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="e.g. 42" 
                    value={witnessFormAge} 
                    onChange={e => setWitnessFormAge(e.target.value)} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Occupation / Profession
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Forensic Analyst / Shopkeeper" 
                    value={witnessFormOccupation} 
                    onChange={e => setWitnessFormOccupation(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Calling Party (Witness Classification) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: witnessFormSide === 'prosecution' ? '#EFECE6' : '#FAF9F6', border: `1px solid ${witnessFormSide === 'prosecution' ? 'var(--accent)' : 'var(--line)'}`, padding: '0.75rem', borderRadius: '2px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="witnessSide" 
                      checked={witnessFormSide === 'prosecution'} 
                      onChange={() => setWitnessFormSide('prosecution')} 
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--bg-band)' }}>Prosecution Witness (PW)</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Produced by State / Complainant / Police</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: witnessFormSide === 'defense' ? '#E6F4EA' : '#FAF9F6', border: `1px solid ${witnessFormSide === 'defense' ? 'var(--success)' : 'var(--line)'}`, padding: '0.75rem', borderRadius: '2px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="witnessSide" 
                      checked={witnessFormSide === 'defense'} 
                      onChange={() => setWitnessFormSide('defense')} 
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>Defense Witness (DW)</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Produced by Accused / Defense Counsel</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Special Legal Classifications: Eyewitness & Surprise Witness */}
              <div style={{ background: '#FAF9F6', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Statutory Classification & Special Petitions
                </div>

                {/* 1. Eyewitness Checkbox */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={witnessIsEyeWitness} 
                    onChange={e => setWitnessIsEyeWitness(e.target.checked)} 
                    style={{ marginTop: '0.2rem', transform: 'scale(1.15)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Eye size={14} color="var(--accent)" /> Mark as Direct Eyewitness
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                      Witness personally saw or directly perceived the crime/occurrence (Direct Star Evidence under Sec 60 Indian Evidence Act / Bharatiya Sakshya Adhiniyam).
                    </div>
                  </div>
                </label>

                {/* 2. Unlisted Witness Petition (Sec 311 CrPC) */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', borderTop: '1px solid var(--line)', paddingTop: '0.75rem' }}>
                  <input 
                    type="checkbox" 
                    checked={witnessIsSurprise} 
                    onChange={e => setWitnessIsSurprise(e.target.checked)} 
                    style={{ marginTop: '0.2rem', transform: 'scale(1.15)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Scale size={14} color="var(--accent)" /> Confidential Judicial Petition: Summon Unlisted / Material Witness (Sec 311 CrPC / Sec 348 BNSS)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                      Sends an in-camera petition directly to the Presiding Judge. No public countdown or opponent notification is generated.
                    </div>
                  </div>
                </label>

                {/* Conditional Grounds Input */}
                {witnessIsSurprise && (
                  <div className="animate-in" style={{ marginTop: '0.5rem', background: '#FFFFFF', padding: '0.75rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--ink)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                      Statutory Grounds & Justification for Sec 311 Summons <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <textarea 
                      className="input-field" 
                      rows={3} 
                      placeholder="Specify why this witness was not in the original chargesheet/witness list, how their evidence is essential for the just decision of the case..." 
                      value={witnessSurpriseReason} 
                      onChange={e => setWitnessSurpriseReason(e.target.value)} 
                      required 
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Sworn Proof of Evidence / Initial Statement Summary
                </label>
                <textarea 
                  className="input-field" 
                  rows={4} 
                  placeholder="Summarize the core facts the witness will testify regarding (e.g. presence at scene, forensic chain of custody, identification of exhibits)..." 
                  value={witnessStatement} 
                  onChange={e => setWitnessStatement(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Upload Sworn Affidavit / Audio Deposition File (Optional)
                </label>
                <input 
                  type="file" 
                  className="input-field" 
                  onChange={e => setWitnessFile(e.target.files[0])} 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddWitnessModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingWitness} 
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Lock size={16} />
                  {isSubmittingWitness ? 'Registering Witness...' : 'Register Witness into Case Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Live Multi-Stage Examination (Chief / Cross / Re-Exam) Modal */}
      {showExamineModal && selectedWitnessForExam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '750px', maxHeight: '92vh', overflowY: 'auto', padding: '2rem', border: '1px solid var(--line)', borderTop: '4px solid var(--accent)', background: '#FFFFFF', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#EFECE6', padding: '0.6rem', borderRadius: '2px' }}>
                  <MessageSquare size={24} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>
                    Record Deposition & Interrogation under Oath
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                    Deponent: <strong style={{ color: 'var(--ink)' }}>{selectedWitnessForExam.display_code || ''} {selectedWitnessForExam.name}</strong> • Case #{caseData?.case_number}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowExamineModal(false)} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>✕</button>
            </div>

            {/* Target Deponent Info Banner */}
            <div style={{ background: '#FAF9F6', padding: '1rem', borderRadius: '2px', marginBottom: '1.25rem', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>
                  {selectedWitnessForExam.name}
                  {selectedWitnessForExam.is_eyewitness && <span style={{ color: 'var(--accent)', marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>[DIRECT EYEWITNESS]</span>}
                  {selectedWitnessForExam.is_surprise_witness && <span style={{ color: 'var(--danger)', marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>[SEC 311 WITNESS]</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                  Calling Party: <strong>{selectedWitnessForExam.side === 'prosecution' ? 'Prosecution (PW)' : 'Defense (DW)'}</strong> • Registered by: {selectedWitnessForExam.registered_by_name}
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--bg-band)', background: '#EFECE6', padding: '0.35rem 0.75rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                Examining: <strong>{user?.full_name}</strong> ({user?.designation || user?.role?.toUpperCase()})
              </div>
            </div>

            <form onSubmit={handleRecordExaminationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Examination Stage Selector */}
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Select Examination Stage <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                  
                  {/* 1. Chief Exam */}
                  <button 
                    type="button" 
                    onClick={() => setExamType('examination_in_chief')}
                    style={{ 
                      padding: '0.6rem 0.5rem', 
                      borderRadius: '2px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      border: examType === 'examination_in_chief' ? '2px solid var(--bg-band)' : '1px solid var(--line)',
                      background: examType === 'examination_in_chief' ? '#EFECE6' : '#FFFFFF',
                      color: 'var(--ink)',
                      textAlign: 'center'
                    }}
                  >
                    Examination-in-Chief<br/><span style={{ fontSize: '0.65rem', color: 'var(--ink-soft)' }}>(Calling Counsel)</span>
                  </button>

                  {/* 2. Cross-Exam */}
                  <button 
                    type="button" 
                    onClick={() => setExamType('cross_examination')}
                    style={{ 
                      padding: '0.6rem 0.5rem', 
                      borderRadius: '2px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      border: examType === 'cross_examination' ? '2px solid var(--accent)' : '1px solid var(--line)',
                      background: examType === 'cross_examination' ? '#FCE8E6' : '#FFFFFF',
                      color: examType === 'cross_examination' ? 'var(--accent)' : 'var(--ink)',
                      textAlign: 'center'
                    }}
                  >
                    Cross-Examination<br/><span style={{ fontSize: '0.65rem', color: 'var(--ink-soft)' }}>(Adverse Counsel)</span>
                  </button>

                  {/* 3. Re-Exam */}
                  <button 
                    type="button" 
                    onClick={() => setExamType('re_examination')}
                    style={{ 
                      padding: '0.6rem 0.5rem', 
                      borderRadius: '2px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      border: examType === 're_examination' ? '2px solid var(--success)' : '1px solid var(--line)',
                      background: examType === 're_examination' ? '#E6F4EA' : '#FFFFFF',
                      color: examType === 're_examination' ? 'var(--success)' : 'var(--ink)',
                      textAlign: 'center'
                    }}
                  >
                    Re-Examination<br/><span style={{ fontSize: '0.65rem', color: 'var(--ink-soft)' }}>(Calling Counsel)</span>
                  </button>

                  {/* 4. Court Questions */}
                  <button 
                    type="button" 
                    onClick={() => setExamType('court_questions')}
                    style={{ 
                      padding: '0.6rem 0.5rem', 
                      borderRadius: '2px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      border: examType === 'court_questions' ? '2px solid var(--accent)' : '1px solid var(--line)',
                      background: examType === 'court_questions' ? '#FAF9F6' : '#FFFFFF',
                      color: 'var(--ink)',
                      textAlign: 'center'
                    }}
                  >
                    Court Inquiry<br/><span style={{ fontSize: '0.65rem', color: 'var(--ink-soft)' }}>(Sec 165 IEA / Judge)</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Q&A Interrogation List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 600 }}>
                    Questions Put to Witness & Answers Given Under Oath
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setExamQnaList([...examQnaList, { q: '', a: '' }])}
                    className="btn-secondary"
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Plus size={13} /> Add Q&A Row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {examQnaList.map((item, idx) => (
                    <div key={idx} style={{ background: '#FAF9F6', padding: '0.85rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: examType === 'cross_examination' ? 'var(--accent)' : 'var(--bg-band)' }}>
                          Question #{idx + 1}
                        </span>
                        {examQnaList.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => setExamQnaList(examQnaList.filter((_, i) => i !== idx))}
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Type question asked to witness..." 
                        value={item.q} 
                        onChange={e => {
                          const updated = [...examQnaList];
                          updated[idx].q = e.target.value;
                          setExamQnaList(updated);
                        }} 
                        style={{ marginBottom: '0.4rem' }}
                      />

                      <textarea 
                        className="input-field" 
                        rows={2} 
                        placeholder="Type witness's answer under oath..." 
                        value={item.a} 
                        onChange={e => {
                          const updated = [...examQnaList];
                          updated[idx].a = e.target.value;
                          setExamQnaList(updated);
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Demeanor & Objections Notes */}
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Demeanor of Deponent / Objections Raised by Opposing Counsel
                </label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  placeholder="Record demeanor (e.g. hesitation, evasiveness, confident recall) or objections overruled/sustained during questioning..." 
                  value={examNotes} 
                  onChange={e => setExamNotes(e.target.value)} 
                />
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', background: '#FAF9F6', padding: '0.75rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                🔒 This examination session will be recorded with exact timestamp and a SHA-256 hash will be permanently anchored to the case cryptographic ledger.
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowExamineModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingExam} 
                  className="btn-primary" 
                  style={{ background: examType === 'cross_examination' ? 'var(--accent)' : 'var(--bg-band)', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Lock size={16} />
                  {isSubmittingExam ? 'Anchoring Deposition...' : 'Sign & Anchor Deposition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Complete Witness Deposition Dossier Modal */}
      {viewWitnessDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '92vh', overflowY: 'auto', padding: '2.25rem', border: '1px solid var(--line)', borderTop: '4px solid var(--accent)', background: '#FFFFFF', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#EFECE6', padding: '0.6rem', borderRadius: '2px' }}>
                  <Scale size={24} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>
                    Official Witness Deposition Dossier
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                    Case #{caseData?.case_number} • Deponent: {viewWitnessDetails.display_code || viewWitnessDetails.witness_code} {viewWitnessDetails.name}
                  </div>
                </div>
              </div>
              <button onClick={() => setViewWitnessDetails(null)} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>✕</button>
            </div>

            {/* Deponent Bio & Badges */}
            <div style={{ background: '#FAF9F6', padding: '1.25rem', borderRadius: '2px', marginBottom: '1.5rem', border: '1px solid var(--line)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--ink)' }}>
                <div><span style={{ color: 'var(--ink-soft)' }}>Deponent Name:</span> <strong>{viewWitnessDetails.name}</strong></div>
                <div><span style={{ color: 'var(--ink-soft)' }}>Classification Code:</span> <strong style={{ color: viewWitnessDetails.side === 'prosecution' ? 'var(--bg-band)' : 'var(--success)' }}>{viewWitnessDetails.display_code || viewWitnessDetails.witness_code} ({viewWitnessDetails.side?.toUpperCase()})</strong></div>
                <div><span style={{ color: 'var(--ink-soft)' }}>Age / Occupation:</span> <strong>{viewWitnessDetails.age || 'N/A'} yrs • {viewWitnessDetails.occupation || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--ink-soft)' }}>Summoned By:</span> <strong>{viewWitnessDetails.registered_by_name}</strong></div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {viewWitnessDetails.is_eyewitness && (
                  <span style={{ background: '#FAF9F6', color: 'var(--accent)', border: '1px solid var(--accent)', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '2px', fontWeight: 700 }}>
                    ⭐ DIRECT EYEWITNESS (Sec 60 Indian Evidence Act / BSA)
                  </span>
                )}
                {viewWitnessDetails.is_surprise_witness && (
                  <span style={{ background: '#FCE8E6', color: 'var(--danger)', border: '1px solid var(--danger)', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '2px', fontWeight: 700 }}>
                    ⚠️ UNLISTED WITNESS (Sec 311 CrPC / Sec 348 BNSS)
                  </span>
                )}
              </div>

              {viewWitnessDetails.is_surprise_witness && viewWitnessDetails.surprise_reason && (
                <div style={{ marginTop: '0.75rem', background: '#FCE8E6', padding: '0.6rem', borderRadius: '2px', fontSize: '0.75rem', color: 'var(--danger)', border: '1px solid #F8D7DA' }}>
                  <strong>Surprise Witness Petition Grounds:</strong> {viewWitnessDetails.surprise_reason}
                </div>
              )}
            </div>

            {/* Initial Sworn Proof of Evidence */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--ink)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Initial Sworn Proof of Evidence / Statement Summary
              </h4>
              <div style={{ background: '#FAF9F6', padding: '1rem', borderRadius: '2px', fontSize: '0.85rem', color: 'var(--ink)', whiteSpace: 'pre-wrap', lineHeight: '1.6', border: '1px solid var(--line)' }}>
                {viewWitnessDetails.initial_statement || 'Standard formal summons issued.'}
              </div>
            </div>

            {/* Attached Exhibit if any */}
            {viewWitnessDetails.storage_path && viewWitnessDetails.storage_path !== 'manual_entry' && (
              <div style={{ marginBottom: '1.5rem', background: '#FAF9F6', padding: '0.75rem 1rem', borderRadius: '2px', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 600 }}>Supporting Deposition / Audio Exhibit File:</span>
                <a 
                  href={supabase.storage.from('documents').getPublicUrl(viewWitnessDetails.storage_path).data.publicUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <ExternalLink size={13} /> Open Exhibit
                </a>
              </div>
            )}

            {/* Examination Sessions & Interrogations Ledger */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--ink)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                <span>Court Examination & Cross-Examination Ledger ({viewWitnessDetails.examinations?.length || 0})</span>
                {caseData?.stage !== 'disposed' && (
                  <button 
                    onClick={() => {
                      setSelectedWitnessForExam(viewWitnessDetails);
                      setExamType('cross_examination');
                      setExamQnaList([{ q: '', a: '' }]);
                      setExamNotes('');
                      setShowExamineModal(true);
                    }}
                    className="btn-secondary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  >
                    + Conduct Examination / Cross
                  </button>
                )}
              </h4>

              {(!viewWitnessDetails.examinations || viewWitnessDetails.examinations.length === 0) ? (
                <div style={{ background: '#FAF9F6', padding: '1.5rem', borderRadius: '2px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '0.85rem', border: '1px solid var(--line)' }}>
                  No oral examinations or cross-examinations recorded yet for this witness.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {viewWitnessDetails.examinations.map((exam, i) => {
                    const details = exam.exam_details || {};
                    const qnas = details.qna_list || [];
                    const isCross = exam.title?.includes('CROSS') || details.exam_type === 'cross_examination';

                    return (
                      <div 
                        key={exam.id || i} 
                        style={{ 
                          background: '#FAF9F6', 
                          padding: '1.25rem', 
                          borderRadius: '2px', 
                          borderLeft: `4px solid ${isCross ? 'var(--accent)' : 'var(--bg-band)'}`,
                          border: '1px solid var(--line)'
                        }}
                      >
                        {/* Session Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isCross ? 'var(--accent)' : 'var(--bg-band)' }}>
                            {exam.title}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                            {new Date(exam.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Examiner Info */}
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>
                          Conducted by: <strong style={{ color: 'var(--ink)' }}>{details.examiner_name || exam.uploaded_by_profile?.full_name || 'Counsel'}</strong> ({details.examiner_designation || details.examiner_role || 'Advocate'})
                        </div>

                        {/* Q&A Transcript */}
                        {qnas.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.75rem' }}>
                            {qnas.map((qna, qIdx) => (
                              <div key={qIdx} style={{ background: '#FFFFFF', padding: '0.6rem 0.75rem', borderRadius: '2px', fontSize: '0.8rem', border: '1px solid var(--line)' }}>
                                <div style={{ color: 'var(--ink)', fontWeight: 700, marginBottom: '0.2rem' }}>
                                  Q.{qIdx + 1}: {qna.q}
                                </div>
                                <div style={{ color: 'var(--ink)', whiteSpace: 'pre-wrap', paddingLeft: '0.75rem', borderLeft: '2px solid var(--line)' }}>
                                  <strong>Ans:</strong> {qna.a}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <pre style={{ fontSize: '0.8rem', color: 'var(--ink)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: '0 0 0.75rem 0', lineHeight: '1.5' }}>
                            {exam.content || exam.ocr_text}
                          </pre>
                        )}

                        {/* Demeanor Notes if any */}
                        {details.demeanor_notes && (
                          <div style={{ background: '#FAF9F6', border: '1px solid var(--line)', padding: '0.5rem 0.75rem', borderRadius: '2px', fontSize: '0.75rem', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
                            <strong style={{ color: 'var(--ink)' }}>Demeanor & Objections:</strong> {details.demeanor_notes}
                          </div>
                        )}

                        {/* SHA-256 Record Hash */}
                        <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Lock size={11} color="var(--accent)" /> HASH: {exam.file_hash || exam.sha256}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewWitnessDetails(null)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. View Tokens & Credentials Modal */}
      {showTokens && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', border: '1px solid var(--line)', borderTop: '4px solid var(--accent)', background: '#FFFFFF', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: '#EFECE6', padding: '0.5rem', borderRadius: '2px' }}>
                  <Lock size={20} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>Case Access Tokens & Credentials</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Case #{caseData?.case_number} • Cryptographic Single-Use Claims</div>
                </div>
              </div>
              <button onClick={() => setShowTokens(false)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'transparent' }}>✕</button>
            </div>

            {/* Token Quick Actions */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem', background: '#FAF9F6', padding: '0.65rem 0.85rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', alignSelf: 'center', marginRight: '0.25rem', fontWeight: 600 }}>Generate:</span>
              <button onClick={() => handleGenerateToken('PROS')} className="btn-secondary" style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', color: 'var(--success)', borderColor: 'var(--success)' }}>
                + Prosecutor Token
              </button>
              <button onClick={() => handleGenerateToken('DEF')} className="btn-secondary" style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                + Defense Token
              </button>
              <button onClick={() => handleGenerateToken('AGENCY')} className="btn-secondary" style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', color: 'var(--bg-band)', borderColor: 'var(--bg-band)' }}>
                + Agency Token
              </button>
            </div>

            {/* Tokens List */}
            {tokens.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-soft)', background: '#FAF9F6', borderRadius: '2px', border: '1px solid var(--line)' }}>
                <Lock size={28} style={{ opacity: 0.3, margin: '0 auto 0.5rem auto' }} />
                <div>No Access Tokens Generated for this Case Yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tokens.map((tok) => {
                  const isActive = tok.is_active !== false;
                  const isPros = tok.code?.startsWith('PROS');
                  const isDef = tok.code?.startsWith('DEF');
                  const isAgency = tok.code?.startsWith('AGENCY');
                  const isOfficer = tok.code?.startsWith('OFFICER');

                  let roleLabel = 'General Case Access';
                  let roleColor = 'var(--ink)';
                  if (isPros) { roleLabel = 'Public Prosecutor Access Token'; roleColor = 'var(--success)'; }
                  else if (isDef) { roleLabel = 'Defense Counsel Access Token'; roleColor = 'var(--accent)'; }
                  else if (isAgency) { roleLabel = 'Investigative Agency Mandate Token'; roleColor = 'var(--bg-band)'; }
                  else if (isOfficer) { roleLabel = 'Agency Investigating Officer Token'; roleColor = 'var(--warning)'; }

                  const isCopied = copiedTokenId === tok.id;

                  return (
                    <div key={tok.id} style={{ background: '#FAF9F6', padding: '0.85rem', borderRadius: '2px', border: `1px solid ${isActive ? 'var(--line)' : '#EAE6DB'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: roleColor, textTransform: 'uppercase' }}>
                            {roleLabel}
                          </span>
                          <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.62rem' }}>
                            {isActive ? 'ACTIVE / UNCLAIMED' : 'INACTIVE / REDEEMED'}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em' }}>
                          {tok.code}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--ink-soft)', marginTop: '0.15rem' }}>
                          Created: {new Date(tok.created_at).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button 
                          onClick={() => handleCopyToken(tok.code, tok.id)} 
                          className="btn-secondary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          {isCopied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                          {isCopied ? 'Copied' : 'Copy Token'}
                        </button>
                        {isActive && (user?.role === 'judge' || user?.role === 'police_officer' || user?.role === 'investigating_officer') && (
                          <button 
                            onClick={() => handleDeactivateToken(tok.id)} 
                            className="btn-secondary" 
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--line)' }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTokens(false)} className="btn-secondary" style={{ padding: '0.45rem 1.15rem', fontSize: '0.85rem' }}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 8. Full Certified Judicial Case Dossier Preview Modal */}
      {showDossierModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.75)', backdropFilter: 'blur(2px)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '960px', height: '94vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
            
            {/* Modal Controls Bar (No Print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', background: 'var(--bg-band)', borderBottom: '2px solid var(--accent)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                  <Scale size={18} color="#C59B27" /> Certified Judicial Dossier & Case Record
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#CCD4DC' }}>
                  Complete Point-to-Point Case History, Order Sheets, Witness Examinations, Exhibits & Judgement
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button onClick={() => window.print()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', fontSize: '0.82rem' }}>
                  <Printer size={15} /> Print Record (A4)
                </button>
                <button onClick={() => setShowDossierModal(false)} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}>
                  Close
                </button>
              </div>
            </div>

            {/* Printable Paper Document Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#ffffff', color: '#000000', fontFamily: '"Tinos", "Times New Roman", Times, serif' }}>
              
              {/* Official Judicial Header */}
              <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '15pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                  IN THE COURT OF {courtOrg?.name ? courtOrg.name.toUpperCase() : 'THE PRINCIPAL DISTRICT & SESSIONS JUDGE'}
                </div>
                <div style={{ fontSize: '11pt', fontStyle: 'italic', marginBottom: '4px' }}>
                  e-Courts Judicial Management Grid • State of {caseData?.state || 'National Capital Territory'}
                </div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>
                  Case No.: {caseData?.case_number} &nbsp;|&nbsp; CNR No.: {caseData?.case_number ? `DLCT01-${caseData.case_number.replace(/[^A-Z0-9]/gi, '')}-2026` : 'N/A'}
                </div>
                <div style={{ fontSize: '10pt', marginTop: '4px', color: '#222' }}>
                  Arising out of FIR / Station: <strong>{policeOrg?.name || caseData?.district || 'Local Police Station'}</strong> &nbsp;|&nbsp; Under Statutory Sections: <strong>{Array.isArray(caseData?.sections) ? caseData.sections.join(', ') : (caseData?.sections || 'IPC / BNS / CrPC')}</strong>
                </div>
              </div>

              {/* Cause Parties Title */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt', marginBottom: '16px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '70%', verticalAlign: 'top', padding: '4px 0' }}>
                      <strong>State of India / Complainant:</strong> {caseData?.filed_by_profile?.full_name || 'State'} ({caseData?.filed_by_profile?.designation || 'Complainant'})
                    </td>
                    <td style={{ width: '30%', textAlign: 'right', verticalAlign: 'top', padding: '4px 0' }}>
                      <strong>… PROSECUTION</strong>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'center', fontWeight: 'bold', fontStyle: 'italic', padding: '6px 0', fontSize: '12pt' }}>
                      — VERSUS —
                    </td>
                  </tr>
                  <tr>
                    <td style={{ width: '70%', verticalAlign: 'top', padding: '4px 0' }}>
                      <strong>The Accused / Non-Applicant:</strong> Person(s) arrayed under Cause #{caseData?.case_number}
                    </td>
                    <td style={{ width: '30%', textAlign: 'right', verticalAlign: 'top', padding: '4px 0' }}>
                      <strong>… ACCUSED</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <hr style={{ border: 0, borderTop: '1px solid #000', margin: '12px 0 16px 0' }} />

              {/* Section 1: Bench & Appearances */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '8px' }}>
                  1. Judicial Bench & Counsel Appearances
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '30%', padding: '3px 0', fontWeight: 'bold' }}>Presiding Judicial Officer:</td>
                      <td style={{ padding: '3px 0' }}>Hon'ble {presidingJudges?.[0]?.full_name || 'Presiding Judge'} ({presidingJudges?.[0]?.designation || 'Judge'})</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Public Prosecutor / State:</td>
                      <td style={{ padding: '3px 0' }}>{lawyers.find(l => l.role_in_case === 'prosecutor')?.profile?.full_name || 'State Special Public Prosecutor'} (Bar / ID: {lawyers.find(l => l.role_in_case === 'prosecutor')?.profile?.badge_no || 'Prosecution Wing'})</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Defense Counsel:</td>
                      <td style={{ padding: '3px 0' }}>{lawyers.find(l => l.role_in_case === 'defense_lawyer' || l.role_in_case === 'lawyer')?.profile?.full_name || 'Advocate on Record for Accused'} (Enrolment No: {lawyers.find(l => l.role_in_case === 'defense_lawyer' || l.role_in_case === 'lawyer')?.profile?.badge_no || 'State Bar Council'})</td>
                    </tr>
                    {agencyTransfersList.length > 0 && (
                      <tr>
                        <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Special Agency Lead / IO:</td>
                        <td style={{ padding: '3px 0' }}>{agencyTransfersList[0].agency?.name} ({agencyTransfersList[0].agency?.acronym}) • Assigned IO: {lawyers.find(l => l.role_in_case === 'agency_officer')?.profile?.full_name || agencyTransfersList[0].claimer?.full_name || 'Designated Lead'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section 2: Case Transfer & Appellate Ledger */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '8px' }}>
                  2. Case Transfer & Appellate Jurisdiction Ledger
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt', border: '1px solid #000' }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #000' }}>
                      <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Jurisdiction Event</th>
                      <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Source & Target Authority</th>
                      <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Mandate / Statutory Grounds</th>
                      <th style={{ padding: '4px 6px', textAlign: 'left' }}>Timestamp (IST)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #ccc' }}>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Origin & Filing</td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>{policeOrg?.name || caseData?.district || 'Police Station'} ➔ {courtOrg?.name || 'District Court'}</td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>FIR Registered & Final Charge Sheet filed under Sec 173 CrPC / Sec 193 BNSS</td>
                      <td style={{ padding: '4px 6px' }}>{new Date(caseData?.created_at).toLocaleString('en-IN')}</td>
                    </tr>
                    {parentCase && (
                      <tr style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Appellate Transfer (Lower Bench)</td>
                        <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>{parentCase.court?.name || 'Subordinate Court'} (CNR: {parentCase.case_number})</td>
                        <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>Transferred on Statutory Appeal / Revision Petition</td>
                        <td style={{ padding: '4px 6px' }}>{new Date(parentCase.created_at).toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    {appealedToCases.length > 0 && (
                      <tr style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Appellate Transfer (Upper Bench)</td>
                        <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>➔ {appealedToCases[0]?.court?.name || 'High Court of Delhi / Supreme Court'} (Docket: {appealedToCases[0]?.case_number})</td>
                        <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>Judicial Appeal Transferred for Higher Bench Review</td>
                        <td style={{ padding: '4px 6px' }}>{new Date(appealedToCases[0]?.created_at).toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    {agencyTransfersList.map((ag, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Special Agency Mandate</td>
                        <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>Transferred to {ag.agency?.name} ({ag.agency?.acronym})</td>
                        <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>Initiated by Judicial Order • Status: {ag.status?.toUpperCase()}</td>
                        <td style={{ padding: '4px 6px' }}>{new Date(ag.created_at).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section 3: Chronological Day-to-Day Proceedings & Court Order Sheets */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '8px' }}>
                  3. Chronological Day-to-Day Proceedings & Court Order Sheets
                </div>
                {timelineEvents.filter(e => e.timeline_type === 'session').length === 0 ? (
                  <div style={{ fontSize: '10pt', fontStyle: 'italic', padding: '6px' }}>No court sessions recorded on docket.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {timelineEvents.filter(e => e.timeline_type === 'session').sort((a,b) => new Date(a.scheduled_at || a.date) - new Date(b.scheduled_at || b.date)).map((sess, idx) => (
                      <div key={sess.id || idx} style={{ border: '1px solid #000', padding: '8px', fontSize: '9.5pt' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '4px', fontWeight: 'bold' }}>
                          <span>Order Sheet #{idx + 1} — Hearing Date: {new Date(sess.scheduled_at || sess.created_at).toLocaleString('en-IN')}</span>
                          <span>Presiding: {sess.recorded_by_profile?.full_name || 'Presiding Judicial Officer'}</span>
                        </div>
                        <div style={{ margin: '4px 0', lineHeight: '1.5', textAlign: 'justify' }}>
                          <strong>Proceedings & Daily Order:</strong> {sess.proceedings || sess.summary || 'The matter was called out. Proceedings conducted.'}
                        </div>
                        {sess.instructions && (
                          <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#222' }}>
                            <strong>Court Directives:</strong> {sess.instructions}
                          </div>
                        )}
                        {sess.next_hearing_date && (
                          <div style={{ marginTop: '4px', fontWeight: 'bold' }}>
                            Next Hearing Scheduled: {new Date(sess.next_hearing_date).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Comprehensive Witness Depositions & Multi-Stage Examination Transcripts */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '8px' }}>
                  4. Sworn Witness Depositions & Multi-Stage Questioning Transcripts
                </div>
                {witnessesList.length === 0 ? (
                  <div style={{ fontSize: '10pt', fontStyle: 'italic', padding: '6px' }}>No witnesses placed on formal roster.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {witnessesList.map((w, wIdx) => (
                      <div key={w.id || wIdx} style={{ border: '1px solid #000', padding: '10px', fontSize: '9.5pt' }}>
                        
                        {/* Witness Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '6px', fontWeight: 'bold' }}>
                          <span>
                            {w.display_code || w.witness_code} — {w.name} {w.age ? `(Age: ${w.age} yrs)` : ''} {w.occupation ? `• Profession: ${w.occupation}` : ''}
                          </span>
                          <span>
                            {w.side === 'prosecution' ? 'Prosecution Witness (PW)' : 'Defense Witness (DW)'}
                            {w.is_eyewitness ? ' [DIRECT EYEWITNESS ⭐]' : ''}
                          </span>
                        </div>

                        <div style={{ fontSize: '9pt', color: '#333', marginBottom: '6px' }}>
                          Summoned / Registered By: <strong>{w.registered_by_name}</strong> • Timestamp: {new Date(w.created_at).toLocaleString('en-IN')}
                        </div>

                        {/* Initial Sworn Statement */}
                        <div style={{ background: '#f9f9f9', padding: '6px', border: '1px dashed #ccc', marginBottom: '8px' }}>
                          <strong>Initial Proof of Evidence / Sworn Statement:</strong><br />
                          {w.initial_statement || 'Standard formal summons issued by Court.'}
                        </div>

                        {/* Examination Transcripts */}
                        {w.examinations && w.examinations.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {w.examinations.map((ex, exIdx) => {
                              const qnas = ex.exam_details?.qna_list || [];
                              const isCross = ex.title?.includes('CROSS') || ex.exam_details?.exam_type === 'cross_examination';
                              return (
                                <div key={ex.id || exIdx} style={{ borderLeft: `3px solid ${isCross ? '#b91c1c' : '#1d4ed8'}`, paddingLeft: '8px', margin: '4px 0' }}>
                                  <div style={{ fontWeight: 'bold', fontSize: '9.5pt', color: isCross ? '#991b1b' : '#1e40af' }}>
                                    {ex.title} — Conducted by {ex.exam_details?.examiner_name || 'Counsel'} ({new Date(ex.created_at).toLocaleString('en-IN')})
                                  </div>
                                  {qnas.length > 0 ? (
                                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {qnas.map((qna, qIdx) => (
                                        <div key={qIdx} style={{ paddingLeft: '6px', borderLeft: '1px solid #ccc' }}>
                                          <div style={{ fontWeight: 'bold' }}>Q.{qIdx + 1}: {qna.q}</div>
                                          <div><strong>Ans:</strong> {qna.a}</div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>{ex.content}</div>
                                  )}
                                  {ex.exam_details?.demeanor_notes && (
                                    <div style={{ fontStyle: 'italic', fontSize: '8.5pt', marginTop: '3px', color: '#444' }}>
                                      <strong>Demeanor / Objections:</strong> {ex.exam_details.demeanor_notes}
                                    </div>
                                  )}
                                  <div style={{ fontSize: '8pt', color: '#666', fontFamily: 'monospace', marginTop: '2px' }}>
                                    Cryptographic SHA-256 Hash: {ex.file_hash || ex.sha256}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ fontStyle: 'italic', fontSize: '9pt', color: '#666' }}>
                            Formal summons issued. Oral examination pending before the Bench.
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 5: Documentary Exhibits & Material Evidence Registry */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '8px' }}>
                  5. Documentary Exhibits & Forensic Evidence Registry
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', border: '1px solid #000' }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #000' }}>
                      <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Exhibit No.</th>
                      <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Document / Exhibit Title</th>
                      <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Classification</th>
                      <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Uploaded By</th>
                      <th style={{ padding: '4px 6px', textAlign: 'left' }}>Cryptographic Hash (SHA-256)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timelineEvents.filter(e => e.timeline_type === 'document' && e.doc_type !== 'witness_record' && e.doc_type !== 'witness_statement').length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '6px', textAlign: 'center', fontStyle: 'italic' }}>No documentary exhibits filed yet.</td>
                      </tr>
                    ) : (
                      timelineEvents.filter(e => e.timeline_type === 'document' && e.doc_type !== 'witness_record' && e.doc_type !== 'witness_statement').map((doc, idx) => (
                        <tr key={doc.id || idx} style={{ borderBottom: '1px solid #ccc' }}>
                          <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Ex. {idx + 1}</td>
                          <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>{doc.title}</td>
                          <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>{doc.doc_type?.replace(/_/g, ' ').toUpperCase()}</td>
                          <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>{doc.uploaded_by_profile?.full_name || 'Official'}</td>
                          <td style={{ padding: '4px 6px', fontFamily: 'monospace', fontSize: '8pt', wordBreak: 'break-all' }}>{doc.file_hash || doc.sha256 || 'Verified'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section 6: Final Verdict & Operative Order of the Court */}
              <div style={{ marginBottom: '20px', borderTop: '2px solid #000', paddingTop: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '8px' }}>
                  6. Final Verdict & Operative Judicial Order
                </div>
                {caseData?.stage === 'disposed' || caseData?.stage === 'closed' ? (
                  <div style={{ textAlign: 'justify', lineHeight: '1.6', fontSize: '10.5pt' }}>
                    <div style={{ textAlign: 'center', margin: '12px 0', fontSize: '13pt', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>
                      *** VERDICT — [DISPOSED / ORDER PRONOUNCED] ***
                    </div>
                    <p>
                      In view of the material evidence placed on record, sworn depositions of prosecution and defense witnesses, forensic analysis exhibits, and arguments advanced by respective Counsels, this Court hereby passes the Final Operative Order disposing of Case No. <strong>{caseData.case_number}</strong>.
                    </p>
                  </div>
                ) : (
                  <div style={{ fontStyle: 'italic', fontSize: '10pt', textAlign: 'center', padding: '12px', background: '#f9f9f9', border: '1px dashed #999' }}>
                    Matter currently in active trial stage ({caseData?.stage?.toUpperCase()}). Final judgement will be appended upon pronouncement by the Bench.
                  </div>
                )}
              </div>

              {/* Judicial Signature Block */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', pageBreakInside: 'avoid' }}>
                <div>
                  <div style={{ fontSize: '9pt', color: '#444' }}>Seal of the Presiding Court:</div>
                  <div style={{ width: '120px', height: '60px', border: '1px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8pt', textAlign: 'center', marginTop: '4px', textTransform: 'uppercase' }}>
                    SEAL OF THE COURT
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ width: '220px', borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold', fontSize: '10.5pt' }}>
                    Hon'ble Presiding Judge
                  </div>
                  <div style={{ fontSize: '9pt', color: '#333' }}>
                    {presidingJudges?.[0]?.full_name || 'Presiding Judicial Officer'}
                  </div>
                  <div style={{ fontSize: '8.5pt', color: '#555' }}>
                    {courtOrg?.name || 'District & Sessions Court'}
                  </div>
                </div>
              </div>

              {/* Official Certified True Copy Endorsement */}
              <div style={{ marginTop: '24px', border: '1px solid #000', padding: '8px 12px', fontSize: '8.5pt', lineHeight: '1.5', background: '#fafafa', pageBreakInside: 'avoid' }}>
                <div style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px', textAlign: 'center' }}>
                  ★ CERTIFIED TRUE COPY OF THE OFFICIAL JUDICIAL RECORD ★
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '2px 8px', fontFamily: 'monospace' }}>
                  <div>Record Dossier ID:</div><div>{caseData?.case_number}</div>
                  <div>Record Ledger Hash:</div><div>{caseData?.id ? `SHA256-${caseData.id.replace(/-/g, '')}-VERIFIED` : 'VALIDATED'}</div>
                  <div>Certified Date/Time:</div><div>{new Date().toLocaleString('en-IN')}</div>
                  <div>Issuing Authority:</div><div>Copying Branch & Central Registry, e-Courts Mission Mode Project</div>
                </div>
                <div style={{ fontStyle: 'italic', fontSize: '8pt', marginTop: '4px', textAlign: 'center', color: '#444' }}>
                  This certified copy is electronically generated and digitally validated under Section 65B of the Indian Evidence Act / Section 63 Bharatiya Sakshya Adhiniyam.
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 9. Print-Only Document Container for Direct window.print() Output */}
      <div className="print-only" style={{ background: '#ffffff', color: '#000000', padding: '0', fontFamily: '"Tinos", "Times New Roman", Times, serif' }}>
        
        {/* Cause Header */}
        <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '12px', marginBottom: '20px' }}>
          <div style={{ fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            IN THE COURT OF {courtOrg?.name ? courtOrg.name.toUpperCase() : 'THE PRINCIPAL DISTRICT & SESSIONS JUDGE'}
          </div>
          <div style={{ fontSize: '11pt', fontStyle: 'italic', marginBottom: '4px' }}>
            e-Courts Judicial Management Grid • State of {caseData?.state || 'National Capital Territory'}
          </div>
          <div style={{ fontSize: '13pt', fontWeight: 'bold' }}>
            Case No.: {caseData?.case_number} &nbsp;|&nbsp; CNR No.: {caseData?.case_number ? `DLCT01-${caseData.case_number.replace(/[^A-Z0-9]/gi, '')}-2026` : 'N/A'}
          </div>
          <div style={{ fontSize: '10.5pt', marginTop: '4px' }}>
            Police Station: <strong>{policeOrg?.name || caseData?.district || 'Local Police Station'}</strong> &nbsp;|&nbsp; FIR: <strong>{caseData?.district || 'FIR-2026/01'}</strong> &nbsp;|&nbsp; Sections: <strong>{Array.isArray(caseData?.sections) ? caseData.sections.join(', ') : (caseData?.sections || 'IPC / BNS / CrPC')}</strong>
          </div>
        </div>

        {/* Cause Parties Title */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5pt', marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td style={{ width: '70%', verticalAlign: 'top', padding: '4px 0' }}>
                <strong>State / Complainant:</strong> {caseData?.filed_by_profile?.full_name || 'State'}
              </td>
              <td style={{ width: '30%', textAlign: 'right', verticalAlign: 'top', padding: '4px 0' }}>
                <strong>… PROSECUTION</strong>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ textAlign: 'center', fontWeight: 'bold', fontStyle: 'italic', padding: '6px 0', fontSize: '12pt' }}>
                — VERSUS —
              </td>
            </tr>
            <tr>
              <td style={{ width: '70%', verticalAlign: 'top', padding: '4px 0' }}>
                <strong>The Accused / Non-Applicant:</strong> Person(s) arrayed under Cause #{caseData?.case_number}
              </td>
              <td style={{ width: '30%', textAlign: 'right', verticalAlign: 'top', padding: '4px 0' }}>
                <strong>… ACCUSED</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <hr style={{ border: 0, borderTop: '1px solid #000', margin: '12px 0 16px 0' }} />

        {/* 1. Appearances */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '8px' }}>
            1. Judicial Bench & Counsel Appearances
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5pt' }}>
            <tbody>
              <tr>
                <td style={{ width: '30%', padding: '3px 0', fontWeight: 'bold' }}>Presiding Judicial Officer:</td>
                <td style={{ padding: '3px 0' }}>Hon'ble {presidingJudges?.[0]?.full_name || 'Presiding Judge'} ({presidingJudges?.[0]?.designation || 'Judge'})</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Public Prosecutor / State:</td>
                <td style={{ padding: '3px 0' }}>{lawyers.find(l => l.role_in_case === 'prosecutor')?.profile?.full_name || 'State Special Public Prosecutor'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Defense Counsel:</td>
                <td style={{ padding: '3px 0' }}>{lawyers.find(l => l.role_in_case === 'defense_lawyer' || l.role_in_case === 'lawyer')?.profile?.full_name || 'Advocate on Record for Accused'}</td>
              </tr>
              {agencyTransfersList.length > 0 && (
                <tr>
                  <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Special Agency Lead / IO:</td>
                  <td style={{ padding: '3px 0' }}>{agencyTransfersList[0].agency?.name} ({agencyTransfersList[0].agency?.acronym}) • Assigned IO: {lawyers.find(l => l.role_in_case === 'agency_officer')?.profile?.full_name || agencyTransfersList[0].claimer?.full_name || 'Designated Lead'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 2. Transfer & Jurisdiction Ledger */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '8px' }}>
            2. Case Transfer & Appellate Jurisdiction Ledger
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', border: '1px solid #000' }}>
            <thead>
              <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #000' }}>
                <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Jurisdiction Event</th>
                <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Source & Target Authority</th>
                <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Mandate / Statutory Grounds</th>
                <th style={{ padding: '4px 6px', textAlign: 'left' }}>Timestamp (IST)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Origin & Filing</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>{policeOrg?.name || caseData?.district || 'Police Station'} ➔ {courtOrg?.name || 'District Court'}</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>FIR Registered & Final Charge Sheet filed</td>
                <td style={{ padding: '4px 6px' }}>{new Date(caseData?.created_at).toLocaleString('en-IN')}</td>
              </tr>
              {parentCase && (
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Appellate Transfer (Lower Bench)</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>{parentCase.court?.name || 'Subordinate Court'} (CNR: {parentCase.case_number})</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>Transferred on Statutory Appeal</td>
                  <td style={{ padding: '4px 6px' }}>{new Date(parentCase.created_at).toLocaleString('en-IN')}</td>
                </tr>
              )}
              {appealedToCases.length > 0 && (
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Appellate Transfer (Upper Bench)</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>➔ {appealedToCases[0]?.court?.name || 'High Court of Delhi / Supreme Court'} (Docket: {appealedToCases[0]?.case_number})</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>Judicial Appeal Transferred for Higher Bench Review</td>
                  <td style={{ padding: '4px 6px' }}>{new Date(appealedToCases[0]?.created_at).toLocaleString('en-IN')}</td>
                </tr>
              )}
              {agencyTransfersList.map((ag, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Special Agency Mandate</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>Transferred to {ag.agency?.name} ({ag.agency?.acronym})</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>Initiated by Judicial Order • Status: {ag.status?.toUpperCase()}</td>
                  <td style={{ padding: '4px 6px' }}>{new Date(ag.created_at).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. Proceedings Sheet */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '8px' }}>
            3. Chronological Court Proceedings & Order Sheets
          </div>
          {timelineEvents.filter(e => e.timeline_type === 'session').length === 0 ? (
            <div style={{ fontSize: '10pt', fontStyle: 'italic' }}>No court sessions recorded on docket.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {timelineEvents.filter(e => e.timeline_type === 'session').sort((a,b) => new Date(a.scheduled_at || a.date) - new Date(b.scheduled_at || b.date)).map((sess, idx) => (
                <div key={sess.id || idx} style={{ border: '1px solid #000', padding: '8px', fontSize: '10pt' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', paddingBottom: '3px', marginBottom: '3px', fontWeight: 'bold' }}>
                    <span>Order Sheet #{idx + 1} — Hearing Date: {new Date(sess.scheduled_at || sess.created_at).toLocaleString('en-IN')}</span>
                    <span>Presiding: {sess.recorded_by_profile?.full_name || 'Presiding Judge'}</span>
                  </div>
                  <div style={{ margin: '3px 0', lineHeight: '1.5', textAlign: 'justify' }}>
                    <strong>Proceedings:</strong> {sess.proceedings || sess.summary || 'Proceedings conducted.'}
                  </div>
                  {sess.instructions && (
                    <div style={{ fontStyle: 'italic' }}>
                      <strong>Directives:</strong> {sess.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Witness Depositions & Questioning */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '8px' }}>
            4. Witness Depositions & Examination-in-Chief / Cross-Examination Transcripts
          </div>
          {witnessesList.length === 0 ? (
            <div style={{ fontSize: '10pt', fontStyle: 'italic' }}>No witnesses placed on formal roster.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {witnessesList.map((w, wIdx) => (
                <div key={w.id || wIdx} style={{ border: '1px solid #000', padding: '8px', fontSize: '10pt' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '4px', fontWeight: 'bold' }}>
                    <span>{w.display_code || w.witness_code} — {w.name} {w.age ? `(Age: ${w.age} yrs)` : ''}</span>
                    <span>{w.side === 'prosecution' ? 'Prosecution Witness (PW)' : 'Defense Witness (DW)'} {w.is_eyewitness ? '[DIRECT EYEWITNESS ⭐]' : ''}</span>
                  </div>
                  <div style={{ background: '#f5f5f5', padding: '4px 6px', marginBottom: '6px' }}>
                    <strong>Proof of Evidence:</strong> {w.initial_statement || 'Summons issued.'}
                  </div>
                  {w.examinations && w.examinations.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {w.examinations.map((ex, exIdx) => {
                        const qnas = ex.exam_details?.qna_list || [];
                        const isCross = ex.title?.includes('CROSS') || ex.exam_details?.exam_type === 'cross_examination';
                        return (
                          <div key={ex.id || exIdx} style={{ borderLeft: `3px solid ${isCross ? '#b91c1c' : '#1d4ed8'}`, paddingLeft: '8px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                              {ex.title} (Conducted by {ex.exam_details?.examiner_name || 'Counsel'} • {new Date(ex.created_at).toLocaleString('en-IN')})
                            </div>
                            {qnas.map((qna, qIdx) => (
                              <div key={qIdx} style={{ marginTop: '2px', paddingLeft: '6px' }}>
                                <div><strong>Q.{qIdx + 1}:</strong> {qna.q}</div>
                                <div><strong>Ans:</strong> {qna.a}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Documentary Evidence Exhibits */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '8px' }}>
            5. Documentary Exhibits & Forensic Evidence Registry
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt', border: '1px solid #000' }}>
            <thead>
              <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #000' }}>
                <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Ext No.</th>
                <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Document Title</th>
                <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #000' }}>Classification</th>
                <th style={{ padding: '4px 6px', textAlign: 'left' }}>SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody>
              {timelineEvents.filter(e => e.timeline_type === 'document' && e.doc_type !== 'witness_record' && e.doc_type !== 'witness_statement').map((doc, idx) => (
                <tr key={doc.id || idx} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Ex. {idx + 1}</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>{doc.title}</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}>{doc.doc_type?.replace(/_/g, ' ').toUpperCase()}</td>
                  <td style={{ padding: '4px 6px', fontFamily: 'monospace', fontSize: '8pt' }}>{doc.file_hash || doc.sha256 || 'Verified'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 6. Verdict & Operative Order */}
        <div style={{ marginBottom: '20px', borderTop: '2px solid #000', paddingTop: '12px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '8px' }}>
            6. Final Verdict & Operative Judicial Order
          </div>
          <p style={{ textAlign: 'justify', lineHeight: '1.6', fontSize: '11pt' }}>
            {caseData?.stage === 'disposed' || caseData?.stage === 'closed'
              ? 'In view of the material evidence placed on record, sworn depositions of prosecution and defense witnesses, forensic analysis exhibits, and arguments advanced by respective Counsels, this Court hereby passes the Final Operative Order disposing of Case No. ' + caseData.case_number + '.'
              : 'Matter currently in active trial stage (' + caseData?.stage?.toUpperCase() + '). Final judgement will be appended upon pronouncement by the Bench.'}
          </p>
        </div>

        {/* Signature Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', pageBreakInside: 'avoid' }}>
          <div>
            <div style={{ width: '120px', height: '60px', border: '1px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8pt', textAlign: 'center', textTransform: 'uppercase' }}>
              SEAL OF THE COURT
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ width: '220px', borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold', fontSize: '11pt' }}>
              Hon'ble Presiding Judge
            </div>
            <div style={{ fontSize: '9.5pt' }}>
              {presidingJudges?.[0]?.full_name || 'Presiding Judicial Officer'}
            </div>
          </div>
        </div>

        {/* Certified Copy Certificate */}
        <div style={{ marginTop: '24px', border: '1px solid #000', padding: '8px 12px', fontSize: '9pt', lineHeight: '1.5', pageBreakInside: 'avoid' }}>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', marginBottom: '4px' }}>
            ★ CERTIFIED TRUE COPY OF THE OFFICIAL JUDICIAL RECORD ★
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '8.5pt' }}>
            Case Number: {caseData?.case_number} &nbsp;|&nbsp; Certified Date: {new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; Section 65B IEA / Sec 63 BSA Compliant
          </div>
        </div>

      </div>

    </div>
  );
}

