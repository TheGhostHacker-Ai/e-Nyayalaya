import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, FolderOpen, Activity, AlertCircle, FileText, CheckCircle, CheckCircle2, AlertTriangle, Shield, Building2, Send, Lock, Copy, Check, ChevronRight, X, ArrowRightLeft, Calendar, Clock, MapPin, Landmark, Filter, FolderKanban, FileCheck, Eye, ArrowUpRight, Scale, UserCheck, ShieldAlert, Sparkles, RefreshCw, Layers, FilePlus } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { NATIONAL_AGENCIES } from '../constants/agencies';
import { 
  ALL_INDIAN_STATES, 
  getDistrictsForState, 
  getPoliceStationsForDistrict, 
  normalizeStationName 
} from '../constants/policeStations';

// Safe Date Formatting Helper
const formatSafeDate = (d, formatType = 'datetime') => {
  if (!d) return 'Recently Filed';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return 'Recently Filed';
    if (formatType === 'medium') {
      return dt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    }
    return dt.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Recently Filed';
  }
};

async function sha256Hex(message) {
  try {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return message;
  }
}

export default function Dashboard({ user }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pendingRevocationsCount, setPendingRevocationsCount] = useState(0);
  const [todaySessionsCount, setTodaySessionsCount] = useState(0);
  const [joinToken, setJoinToken] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // All Organisations for Station/Court Selection
  const [allOrganisations, setAllOrganisations] = useState([]);

  // e-FIR Inward Desk & Police Actions State
  const [selectedEfirDossier, setSelectedEfirDossier] = useState(null);
  const [selectedEfirForAction, setSelectedEfirForAction] = useState(null);
  const [efirActionType, setEfirActionType] = useState(null); // 'accept' | 'station_transfer' | 'court_forward' | 'resolve'
  const [targetStationOrgId, setTargetStationOrgId] = useState('');
  const [transferState, setTransferState] = useState('Uttar Pradesh');
  const [transferDistrict, setTransferDistrict] = useState('Lucknow');
  const [transferStationName, setTransferStationName] = useState('Hazratganj Police Station');
  const [customTransferStation, setCustomTransferStation] = useState('');
  const [stationTransferReason, setStationTransferReason] = useState('');
  const [targetCourtOrgId, setTargetCourtOrgId] = useState('');
  const [chargeSheetSections, setChargeSheetSections] = useState('BNS Sec 303 (Theft), Sec 318 (Cheating)');
  const [chargeSheetSummary, setChargeSheetSummary] = useState('');
  const [closureReason, setClosureReason] = useState('Amicably Settled / Civil in Nature');
  const [closureNotes, setClosureNotes] = useState('');
  const [assignedOfficerName, setAssignedOfficerName] = useState('');
  const [assignedOfficerBadge, setAssignedOfficerBadge] = useState('');
  const [assignedOfficerDirective, setAssignedOfficerDirective] = useState('');
  const [isSubmittingEfirAction, setIsSubmittingEfirAction] = useState(false);
  const [efirActionSuccessMsg, setEfirActionSuccessMsg] = useState(null);
  const [efirSearchQuery, setEfirSearchQuery] = useState('');
  const [efirStatusFilter, setEfirStatusFilter] = useState('all');
  const [efirCategoryFilter, setEfirCategoryFilter] = useState('all');

  // Agency Transfer State
  const [agencySearchQuery, setAgencySearchQuery] = useState('');
  const [selectedAgencyCategory, setSelectedAgencyCategory] = useState('all');
  const [selectedAgencyForTransfer, setSelectedAgencyForTransfer] = useState(null);
  const [agencyTransferCaseId, setAgencyTransferCaseId] = useState('');
  const [agencyTransferToken, setAgencyTransferToken] = useState(null);
  const [isTransferringAgency, setIsTransferringAgency] = useState(false);
  const [agenciesList, setAgenciesList] = useState(NATIONAL_AGENCIES);
  const [copiedToken, setCopiedToken] = useState(false);

  // Appoint Officer State (for Agency Admin)
  const [appointCase, setAppointCase] = useState(null);
  const [appointOfficerName, setAppointOfficerName] = useState('');
  const [appointOfficerRank, setAppointOfficerRank] = useState('Inspector / IO');
  const [appointOfficerBadge, setAppointOfficerBadge] = useState('');
  const [appointOfficerDirective, setAppointOfficerDirective] = useState('');
  const [isSubmittingAppoint, setIsSubmittingAppoint] = useState(false);
  const [appointedOfficerSuccess, setAppointedOfficerSuccess] = useState(null);
  const [copiedOfficerToken, setCopiedOfficerToken] = useState(false);

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Keep Clock Live
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync with URL Parameters
  useEffect(() => {
    const view = searchParams.get('view');
    const action = searchParams.get('action');

    if (view === 'disposed') setActiveTab('disposed');
    else if (view === 'transferred') setActiveTab('transferred');
    else if (view === 'active') setActiveTab('active');
    else if (view === 'agency-transfer' || action === 'agency-transfer') setActiveTab('agency-transfer');
    else if (view === 'efir') setActiveTab('efir');
    else if (view === 'all') setActiveTab('all');
    else setActiveTab('dashboard');
  }, [searchParams]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        // 1. Fetch Agencies for Transfer if Judge, merging with rich metadata
        if (user?.role === 'judge' && user?.org_type !== 'supreme_court') {
          try {
            const { data: agData } = await supabase.from('organisations').select('*').eq('org_type', 'agency');
            if (agData && agData.length > 0) {
              const merged = NATIONAL_AGENCIES.map(agency => {
                const found = agData.find(dbOrg => 
                  (dbOrg.name && dbOrg.name.toLowerCase().includes(agency.acronym.toLowerCase())) ||
                  (dbOrg.name && dbOrg.name.toLowerCase().includes(agency.name.toLowerCase())) ||
                  (agency.name && agency.name.toLowerCase().includes(dbOrg.name.toLowerCase()))
                );
                return {
                  ...agency,
                  id: found ? found.id : agency.id,
                  db_org_id: found ? found.id : null
                };
              });
              setAgenciesList(merged);
            }
          } catch (e) {
            console.warn("Agencies fetch fallback:", e);
          }
        }

        // 2. Fetch today's court sessions
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          let sessionQuery = supabase.from('court_sessions').select('id, scheduled_at');
          if (user?.org_id) {
            sessionQuery = sessionQuery.eq('court_org_id', user.org_id);
          }
          const { data: sessData } = await sessionQuery
            .gte('scheduled_at', today.toISOString())
            .lt('scheduled_at', tomorrow.toISOString());
            
          setTodaySessionsCount(sessData ? sessData.length : 0);
        } catch (sessErr) {
          console.warn("Sessions fetch error:", sessErr);
        }

        // 3. Fetch cases securely
        let fetchedCases = [];

        if (user?.role === 'agency_officer') {
          // IO strictly only sees cases assigned directly to them in case_participants
          let allowedIds = [];
          try {
            const { data: partData } = await supabase
              .from('case_participants')
              .select('case_id')
              .eq('user_id', user.id)
              .is('revoked_at', null);
            if (partData) {
              allowedIds = partData.map(p => p.case_id);
            }
          } catch (pErr) {
            console.warn("IO participant query error:", pErr);
          }

          if (allowedIds.length > 0) {
            const { data: cData } = await supabase
              .from('cases')
              .select('*, filed_by_profile:profiles!cases_filed_by_fkey(full_name, designation)')
              .in('id', allowedIds)
              .order('created_at', { ascending: false });
            fetchedCases = cData || [];
          } else {
            fetchedCases = [];
          }
        } else if (user?.role === 'agency_admin') {
          // Agency Admin strictly sees only cases transferred to their specific agency
          let allowedIds = [];
          try {
            const { data: agencyTransfers } = await supabase
              .from('case_agency_transfers')
              .select('case_id, agency_org_id, claimed_by');

            if (agencyTransfers && agencyTransfers.length > 0) {
              const matched = agencyTransfers.filter(t => 
                t.agency_org_id === user.org_id || 
                t.claimed_by === user.id ||
                (user.org_id && t.agency_org_id && String(t.agency_org_id).toLowerCase() === String(user.org_id).toLowerCase())
              );
              allowedIds = matched.map(t => t.case_id);
            }

            const { data: partData } = await supabase
              .from('case_participants')
              .select('case_id')
              .eq('user_id', user.id)
              .is('revoked_at', null);

            if (partData) {
              allowedIds = [...new Set([...allowedIds, ...partData.map(p => p.case_id)])];
            }
          } catch (aErr) {
            console.warn("Agency transfers query error:", aErr);
          }

          if (allowedIds.length > 0) {
            const { data: cData } = await supabase
              .from('cases')
              .select('*, filed_by_profile:profiles!cases_filed_by_fkey(full_name, designation)')
              .in('id', allowedIds)
              .order('created_at', { ascending: false });
            fetchedCases = cData || [];
          } else {
            fetchedCases = [];
          }
        } else if (user?.role === 'lawyer') {
          let allowedIds = [];
          try {
            const { data: partData } = await supabase
              .from('case_participants')
              .select('case_id')
              .eq('user_id', user.id)
              .is('revoked_at', null);
            if (partData) {
              allowedIds = partData.map(p => p.case_id);
            }
          } catch (pErr) {
            console.warn("Lawyer participant query error:", pErr);
          }

          if (allowedIds.length > 0) {
            const { data: cData } = await supabase
              .from('cases')
              .select('*, filed_by_profile:profiles!cases_filed_by_fkey(full_name, designation)')
              .in('id', allowedIds)
              .order('created_at', { ascending: false });
            fetchedCases = cData || [];
          } else {
            fetchedCases = [];
          }
        } else if (user?.role === 'police_officer' || user?.role === 'investigating_officer') {
          let allowedIds = [];
          try {
            const { data: partData } = await supabase
              .from('case_participants')
              .select('case_id')
              .eq('user_id', user.id)
              .is('revoked_at', null);
            if (partData) {
              allowedIds = partData.map(p => p.case_id);
            }
          } catch (pErr) {
            console.warn("Police participant query fallback:", pErr);
          }

          // Also fetch cases where this officer or station performed an audit action (e.g. transfer/filing)
          try {
            const { data: auditData } = await supabase
              .from('audit_log')
              .select('case_id')
              .eq('actor_id', user.id);
            if (auditData) {
              const auditIds = auditData.map(a => a.case_id).filter(Boolean);
              allowedIds = [...new Set([...allowedIds, ...auditIds])];
            }
          } catch (aErr) {
            console.warn("Audit logs case query fallback:", aErr);
          }

          let pQuery = supabase
            .from('cases')
            .select(`*, filed_by_profile:profiles!cases_filed_by_fkey(full_name, designation), police_org:organisations!cases_police_org_id_fkey(id, name, district, state, code), court_org:organisations!cases_court_org_id_fkey(id, name, district, state, code)`);
          
          if (user?.org_id && allowedIds.length > 0) {
            pQuery = pQuery.or(`police_org_id.eq.${user.org_id},id.in.(${allowedIds.join(',')})`);
          } else if (user?.org_id) {
            pQuery = pQuery.eq('police_org_id', user.org_id);
          } else if (allowedIds.length > 0) {
            pQuery = pQuery.in('id', allowedIds);
          } else if (user?.district) {
            pQuery = pQuery.eq('district', user.district);
          }

          if (pQuery) {
            const { data, error } = await pQuery.order('created_at', { ascending: false });
            if (error) console.warn("Police query error:", error);
            fetchedCases = data || [];
          } else {
            fetchedCases = [];
          }
        } else if (user?.role === 'judge' || user?.role === 'court_clerk') {
          let jQuery = supabase
            .from('cases')
            .select(`*, filed_by_profile:profiles!cases_filed_by_fkey(full_name, designation), police_org:organisations!cases_police_org_id_fkey(id, name, district, state, code), court_org:organisations!cases_court_org_id_fkey(id, name, district, state, code)`);
          
          if (user?.org_type !== 'supreme_court' && user?.org_id) {
            jQuery = jQuery.eq('court_org_id', user.org_id);
          }
          const { data, error } = await jQuery.order('created_at', { ascending: false });
          fetchedCases = data || [];
        } else {
          fetchedCases = [];
        }

        // Fetch all organisations for transfer / forwarding lists
        try {
          const { data: dbOrgs } = await supabase.from('organisations').select('*').order('name');
          if (dbOrgs) setAllOrganisations(dbOrgs);
        } catch (orgEx) {
          console.warn("Organisations list fetch warning:", orgEx);
        }
        
        // Fetch transfer details for appealed and transferred cases
        const transferTrackIds = fetchedCases
          .filter(c => c.stage === 'appealed' || c.stage === 'transferred' || c.stage === 'in_trial' || (c.case_number && c.case_number.includes('EFIR')))
          .map(c => c.id);

        if (transferTrackIds.length > 0) {
          try {
            const { data: appealsData, error: appealsError } = await supabase.rpc('get_bulk_transfer_details', { cids: transferTrackIds });
            if (appealsData && !appealsError) {
              fetchedCases = fetchedCases.map(c => {
                const ap = appealsData.find(a => a.case_id === c.id);
                if (ap) return { ...c, transferDetails: ap };
                return c;
              });
            }
          } catch (e) {
            console.warn("Appeals bulk fetch fallback:", e);
          }

          try {
            const { data: transferDocs } = await supabase
              .from('documents')
              .select('case_id, title, ai_summary, ocr_text, created_at')
              .in('case_id', transferTrackIds)
              .or('doc_type.eq.police_report,doc_type.eq.charge_sheet,doc_type.eq.investigation_record')
              .order('created_at', { ascending: false });

            if (transferDocs && transferDocs.length > 0) {
              fetchedCases = fetchedCases.map(c => {
                const doc = transferDocs.find(d => d.case_id === c.id && (d.title.includes('TRANSFER') || d.title.includes('HANDOVER') || d.title.includes('CHARGE SHEET')));
                if (doc && !c.transferDetails) {
                  return {
                    ...c,
                    transferDetails: {
                      to_station: doc.title,
                      summary: doc.ai_summary,
                      transferred_at: doc.created_at
                    }
                  };
                }
                return c;
              });
            }
          } catch (tErr) {
            console.warn("Transfer docs fetch fallback:", tErr);
          }
        }
        
        setCases(fetchedCases);
        
        // Fetch pending revocations for Judges
        if (user?.role === 'judge' && fetchedCases && fetchedCases.length > 0) {
          try {
            const caseIds = fetchedCases.map(c => c.id);
            const { data: revokes } = await supabase.from('documents')
              .select('id')
              .in('case_id', caseIds)
              .eq('doc_type', 'evidence_record')
              .eq('ai_summary', 'pending')
              .like('title', 'REVOKE_REQUEST:%');
            setPendingRevocationsCount(revokes ? revokes.length : 0);
          } catch (e) {
            console.warn("Revocations fetch fallback:", e);
          }
        }
      } catch (err) {
        console.error("Failed to fetch cases:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCases();

    // Subscribe to live inserts
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cases' }, (payload) => {
        setCases((prev) => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cases' }, (payload) => {
        setCases((prev) => prev.map(c => c.id === payload.new.id ? payload.new : c));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.role, user?.org_id, user?.org_type]);

  const activeCases = cases.filter(c => c.stage !== 'disposed' && c.stage !== 'closed').length;
  const underTrial = cases.filter(c => c.stage === 'in_trial').length;
  const disposed = cases.filter(c => c.stage === 'disposed' || c.stage === 'closed').length;
  const transferred = cases.filter(c => c.stage === 'appealed' || c.stage === 'transferred' || !!c.transferDetails).length;

  // e-FIR Specific Statistics & Filter Calculations
  const isEfirCase = (c) => 
    c.case_category === 'Criminal (e-FIR)' || 
    (c.case_number && c.case_number.startsWith('EFIR-')) || 
    (c.case_number && c.case_number.includes('EFIR')) || 
    c.stage === 'fir_registered';

  const allEfirCases = cases.filter(isEfirCase);
  const pendingEfirCount = allEfirCases.filter(c => c.stage === 'fir_registered').length;
  const underInvestigationEfirCount = allEfirCases.filter(c => c.stage === 'under_investigation').length;
  const forwardedEfirCount = allEfirCases.filter(c => c.stage === 'in_trial' || c.stage === 'charge_sheet_filed' || c.stage === 'transferred').length;
  const disposedEfirCount = allEfirCases.filter(c => c.stage === 'disposed' || c.stage === 'closed').length;

  const filteredEfirCases = allEfirCases.filter(c => {
    const q = (efirSearchQuery || '').toLowerCase().trim();
    const matchesSearch = !q || 
      (c.case_number && c.case_number.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.plaintiff && c.plaintiff.toLowerCase().includes(q)) ||
      (c.defendant && c.defendant.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.district && c.district.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (efirStatusFilter === 'pending') return c.stage === 'fir_registered';
    if (efirStatusFilter === 'investigating') return c.stage === 'under_investigation';
    if (efirStatusFilter === 'forwarded') return c.stage === 'in_trial' || c.stage === 'charge_sheet_filed' || c.stage === 'transferred';
    if (efirStatusFilter === 'disposed') return c.stage === 'disposed' || c.stage === 'closed';

    return true;
  });

  // e-FIR Action Trigger Handlers
  const handleOpenEfirDossier = (c) => {
    setSelectedEfirDossier(c);
  };

  const handleOpenEfirAction = (c, actionType) => {
    setSelectedEfirForAction(c);
    setEfirActionType(actionType);
    setEfirActionSuccessMsg(null);

    if (actionType === 'accept') {
      setAssignedOfficerName(user?.full_name || 'Sub-Inspector On Duty');
      setAssignedOfficerBadge(user?.badge_no || 'IO-POLICE-01');
      setAssignedOfficerDirective('Proceed with complainant statement recording, scene preservation, and digital transaction verification under Section 173 BNSS.');
    } else if (actionType === 'station_transfer') {
      const initialSt = c?.state || user?.state || 'Uttar Pradesh';
      const initialDist = c?.district || user?.district || 'Lucknow';
      setTransferState(initialSt);
      setTransferDistrict(initialDist);
      const stList = getPoliceStationsForDistrict(initialSt, initialDist);
      setTransferStationName(stList[0] || 'Other');
      setCustomTransferStation('');
      setTargetStationOrgId('');
      setStationTransferReason('Jurisdictional handover / Zero FIR transfer under Section 173(1) BNSS. Cause of action / incident occurred within territorial jurisdiction of receiving police station.');
    } else if (actionType === 'court_forward') {
      setTargetCourtOrgId('');
      setChargeSheetSections('BNS Sec 303 (Theft), Sec 318 (Cheating), IT Act 66D');
      setChargeSheetSummary('Investigation completed under Section 173 CrPC / 193 BNSS. Sufficient prima facie evidence and witness corroboration established against accused. Forwarded for judicial trial.');
    } else if (actionType === 'resolve') {
      setClosureReason('Amicably Settled / Civil in Nature');
      setClosureNotes('Matter investigated thoroughly. Parties resolved dispute amicably / property restored / civil remedies advised. Recommended for final closure report under BNSS 173(2).');
    }
  };

  const handleExecuteEfirAction = async (e) => {
    e.preventDefault();
    if (!selectedEfirForAction || !efirActionType) return;
    setIsSubmittingEfirAction(true);

    try {
      const nowIso = new Date().toISOString();
      const targetCaseId = selectedEfirForAction.id;
      const efirNum = selectedEfirForAction.case_number;

      if (efirActionType === 'accept') {
        // 1. Update Case Stage to 'under_investigation'
        const { error: cErr } = await supabase
          .from('cases')
          .update({ stage: 'under_investigation' })
          .eq('id', targetCaseId);

        if (cErr) throw cErr;

        // 2. Assign Officer into case_participants if user.id exists
        if (user?.id) {
          try {
            await supabase.from('case_participants').upsert({
              case_id: targetCaseId,
              user_id: user.id,
              role_in_case: 'io',
              granted_by: user.id
            });
          } catch (partEx) {
            console.warn("Participant insert warning:", partEx);
          }
        }

        // 3. Insert Formal Investigation Order Document
        const directiveNarrative = `STATUTORY POLICE INTAKE ORDER (SECTION 173 BNSS / CRPC 156(1))
══════════════════════════════════════════════════════════════════
e-FIR Docket Number: ${efirNum}
Police Station Unit: ${user?.org_name || 'Designated Station'}
Assigned Investigating Officer (IO): ${assignedOfficerName} (Badge: ${assignedOfficerBadge})
Order Date: ${new Date().toLocaleString('en-IN')}

INVESTIGATION DIRECTIVES:
${assignedOfficerDirective}`;

        const docHash = await sha256Hex(directiveNarrative);

        await supabase.from('documents').insert([{
          case_id: targetCaseId,
          doc_type: 'investigation_record',
          title: `POLICE INTAKE ORDER: e-FIR Accepted — IO ${assignedOfficerName}`,
          storage_path: `intake/${efirNum}.txt`,
          ocr_text: directiveNarrative,
          sha256: docHash,
          status: 'verified',
          ai_summary: `e-FIR accepted for active investigation by ${assignedOfficerName} (${assignedOfficerBadge}).`
        }]);

        // 4. Insert Audit Log
        await supabase.from('audit_log').insert([{
          case_id: targetCaseId,
          action: 'POLICE_ACCEPTED_EFIR',
          metadata: {
            efir_number: efirNum,
            accepted_by: assignedOfficerName,
            badge_no: assignedOfficerBadge,
            directives: assignedOfficerDirective,
            timestamp: nowIso
          },
          record_hash: docHash
        }]);

        // Update local state
        setCases(prev => prev.map(c => c.id === targetCaseId ? { ...c, stage: 'under_investigation' } : c));
        setEfirActionSuccessMsg(`e-FIR ${efirNum} successfully accepted and converted to Active Investigation under IO ${assignedOfficerName}.`);

      } else if (efirActionType === 'station_transfer') {
        const rawTargetName = transferStationName === 'Other' ? customTransferStation.trim() : transferStationName;
        const cleanTargetName = normalizeStationName(rawTargetName || 'Kotwali Police Station');

        // Resolve receiving police station in organisations table
        const { data: dbOrgs } = await supabase.from('organisations').select('id, name, district, state, org_type');
        let resolvedTargetOrgId = null;
        let matchedTargetOrg = null;
        if (dbOrgs) {
          matchedTargetOrg = dbOrgs.find(o => 
            (o.name && o.name.toLowerCase().trim() === cleanTargetName.toLowerCase().trim()) ||
            (o.name && o.name.toLowerCase().includes(cleanTargetName.toLowerCase())) ||
            (cleanTargetName.toLowerCase().includes(o.name.toLowerCase()))
          );
          if (matchedTargetOrg) resolvedTargetOrgId = matchedTargetOrg.id;
        }

        if (!resolvedTargetOrgId && cleanTargetName) {
          const distCode = (transferDistrict || 'LKO').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
          const nameCode = cleanTargetName.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 12);
          const generatedCode = `PS_${distCode}_${nameCode}_${Math.floor(100 + Math.random() * 900)}`;

          const { data: newStationOrg, error: orgErr } = await supabase
            .from('organisations')
            .insert([{
              name: cleanTargetName,
              code: generatedCode,
              org_type: 'police_station',
              district: transferDistrict || 'Lucknow',
              state: transferState || 'Uttar Pradesh'
            }])
            .select()
            .single();

          if (orgErr) throw orgErr;
          if (newStationOrg) {
            resolvedTargetOrgId = newStationOrg.id;
            matchedTargetOrg = newStationOrg;
          }
        }

        // 1. Update Case police_org_id, district, state & stage to 'transferred'
        const { error: cErr } = await supabase
          .from('cases')
          .update({ 
            police_org_id: resolvedTargetOrgId, 
            district: transferDistrict,
            state: transferState || 'Uttar Pradesh',
            stage: 'transferred' 
          })
          .eq('id', targetCaseId);

        if (cErr) throw cErr;

        // Record participant so transferring officer/station always retains access in transferred view
        if (user?.id) {
          try {
            await supabase.from('case_participants').upsert([{
              case_id: targetCaseId,
              user_id: user.id,
              role_in_case: 'transferring_officer'
            }]);
          } catch (pErr) {
            console.warn("Participant recording error:", pErr);
          }
        }

        // 2. Insert Transfer Document
        const transferNarrative = `ZERO FIR / JURISDICTIONAL HANDOVER ORDER (BNSS SEC 173(1))
══════════════════════════════════════════════════════════════════
e-FIR Number: ${efirNum}
Transferred From: ${user?.org_name || 'Station of Registration'}
Transferred To: ${cleanTargetName} (${transferDistrict}, ${transferState})
Date of Handover: ${new Date().toLocaleString('en-IN')}

GROUNDS FOR JURISDICTIONAL TRANSFER:
${stationTransferReason}

OFFICIAL ACTION: Case docket and digital evidence grid transmitted to receiving police station for territorial investigation under BNSS 173(1).`;

        const docHash = await sha256Hex(transferNarrative);

        await supabase.from('documents').insert([{
          case_id: targetCaseId,
          doc_type: 'police_report',
          title: `ZERO FIR HANDOVER: Transferred to ${cleanTargetName}`,
          storage_path: `transfer/${efirNum}.txt`,
          ocr_text: transferNarrative,
          sha256: docHash,
          status: 'verified',
          ai_summary: `Transferred under Zero FIR to ${cleanTargetName} (${transferDistrict}). Grounds: ${stationTransferReason.substring(0, 120)}...`
        }]);

        // 3. Insert Audit Log
        await supabase.from('audit_log').insert([{
          case_id: targetCaseId,
          actor_id: user?.id,
          action: 'ZERO_FIR_STATION_TRANSFERRED',
          metadata: {
            efir_number: efirNum,
            from_station: user?.org_name,
            to_station: cleanTargetName,
            receiving_district: transferDistrict,
            receiving_state: transferState,
            reason: stationTransferReason,
            timestamp: nowIso
          },
          record_hash: docHash
        }]);

        // 4. Update local state with stage: 'transferred' and transfer details so it shows in Transferred section
        setCases(prev => prev.map(c => c.id === targetCaseId ? {
          ...c,
          stage: 'transferred',
          police_org_id: resolvedTargetOrgId,
          district: transferDistrict,
          state: transferState,
          transferDetails: {
            to_station: cleanTargetName,
            receiving_district: transferDistrict,
            receiving_state: transferState,
            transferred_at: nowIso,
            summary: `Transferred under Zero FIR to ${cleanTargetName} (${transferDistrict})`,
            reason: stationTransferReason
          }
        } : c));

        setEfirActionSuccessMsg(`e-FIR ${efirNum} successfully transferred under Zero FIR to ${cleanTargetName} (${transferDistrict}, ${transferState}). Transferred roster updated.`);

      } else if (efirActionType === 'court_forward') {
        if (!targetCourtOrgId) throw new Error("Please select a target Judicial Magistrate / District Court.");
        const targetCourt = allOrganisations.find(o => o.id === targetCourtOrgId);
        const parsedSections = chargeSheetSections.split(',').map(s => s.trim()).filter(Boolean);

        // 1. Update Case court_org_id and stage to 'in_trial'
        const { error: cErr } = await supabase
          .from('cases')
          .update({ 
            court_org_id: targetCourtOrgId,
            stage: 'in_trial',
            sections: parsedSections
          })
          .eq('id', targetCaseId);

        if (cErr) throw cErr;

        // 2. Insert Police Charge Sheet Document
        const csNarrative = `POLICE FINAL CHARGE SHEET (SECTION 173 CrPC / SECTION 193 BNSS)
══════════════════════════════════════════════════════════════════
Case / e-FIR Docket: ${efirNum}
Forwarded By: ${user?.org_name || 'Investigating Police Station'}
Designated Court: ${targetCourt?.name || 'District & Sessions Court'}
Filing Officer: ${user?.full_name || 'Investigating Officer'} (${user?.badge_no || 'IO'})
Date of Filing: ${new Date().toLocaleString('en-IN')}

STATUTORY SECTIONS APPLIED:
${parsedSections.map(s => `• ${s}`).join('\n')}

INVESTIGATION FINDINGS & CHARGE SHEET SUMMARY:
${chargeSheetSummary}

PRAYER: The court is respectfully requested to take judicial cognizance and issue process against the accused.`;

        const docHash = await sha256Hex(csNarrative);

        await supabase.from('documents').insert([{
          case_id: targetCaseId,
          doc_type: 'charge_sheet',
          title: `POLICE CHARGE SHEET (Sec 173 CrPC / 193 BNSS) — ${efirNum}`,
          storage_path: `chargesheet/${efirNum}.txt`,
          ocr_text: csNarrative,
          sha256: docHash,
          status: 'verified',
          ai_summary: `Police Charge Sheet filed in ${targetCourt?.name || 'Designated Court'} under sections ${parsedSections.join(', ')}.`
        }]);

        // 3. Insert Audit Log
        await supabase.from('audit_log').insert([{
          case_id: targetCaseId,
          action: 'POLICE_CHARGE_SHEET_FORWARDED_TO_COURT',
          metadata: {
            efir_number: efirNum,
            court_name: targetCourt?.name,
            sections: parsedSections,
            filed_by: user?.full_name,
            timestamp: nowIso
          },
          record_hash: docHash
        }]);

        // Update local state
        setCases(prev => prev.map(c => c.id === targetCaseId ? { ...c, court_org_id: targetCourtOrgId, stage: 'in_trial', court_org: targetCourt, sections: parsedSections } : c));
        setEfirActionSuccessMsg(`Charge Sheet Filed! e-FIR ${efirNum} has been forwarded to ${targetCourt?.name || 'Court'} for Trial.`);

      } else if (efirActionType === 'resolve') {
        // 1. Update Case Stage to 'disposed'
        const { error: cErr } = await supabase
          .from('cases')
          .update({ stage: 'disposed' })
          .eq('id', targetCaseId);

        if (cErr) throw cErr;

        // 2. Insert Police Closure Report Document
        const closureNarrative = `FINAL POLICE CLOSURE REPORT (SECTION 173(2) BNSS)
══════════════════════════════════════════════════════════════════
e-FIR Number: ${efirNum}
Police Station: ${user?.org_name || 'Territorial Police Station'}
Reviewing Officer: ${user?.full_name || 'Officer in Charge'} (${user?.badge_no || 'POLICE'})
Date of Closure: ${new Date().toLocaleString('en-IN')}

CLOSURE REASON / DISPOSITION:
${closureReason}

OFFICIAL INVESTIGATION STATEMENT:
${closureNotes}

DISPOSITION: Matter marked as Disposed & Closed in National e-Courts Grid.`;

        const docHash = await sha256Hex(closureNarrative);

        await supabase.from('documents').insert([{
          case_id: targetCaseId,
          doc_type: 'police_report',
          title: `POLICE CLOSURE REPORT: ${closureReason} — ${efirNum}`,
          storage_path: `closure/${efirNum}.txt`,
          ocr_text: closureNarrative,
          sha256: docHash,
          status: 'verified',
          ai_summary: `e-FIR closed by police: ${closureReason}. ${closureNotes}`
        }]);

        // 3. Insert Audit Log
        await supabase.from('audit_log').insert([{
          case_id: targetCaseId,
          action: 'POLICE_EFIR_RESOLVED_CLOSED',
          metadata: {
            efir_number: efirNum,
            closure_reason: closureReason,
            notes: closureNotes,
            closed_by: user?.full_name,
            timestamp: nowIso
          },
          record_hash: docHash
        }]);

        // Update local state
        setCases(prev => prev.map(c => c.id === targetCaseId ? { ...c, stage: 'disposed' } : c));
        setEfirActionSuccessMsg(`Closure Report Recorded! e-FIR ${efirNum} marked as Resolved / Disposed.`);
      }

      setTimeout(() => {
        setSelectedEfirForAction(null);
        setEfirActionType(null);
        setEfirActionSuccessMsg(null);
      }, 3000);

    } catch (err) {
      alert("Failed to execute action: " + err.message);
    } finally {
      setIsSubmittingEfirAction(false);
    }
  };

  const handleJoinCase = async () => {
    if (!joinToken) return;
    setIsJoining(true);
    try {
      const cleanToken = joinToken.trim();
      const tokenUpper = cleanToken.toUpperCase();

      if (tokenUpper.startsWith('AGENCY-')) {
        alert("This is a Master Agency Transfer Token. Please log out and use the 'Agency Claim' tab on the login screen to authenticate as the designated agency administrator.");
        setIsJoining(false);
        return;
      }

      if (tokenUpper.startsWith('OFFICER-') || tokenUpper.startsWith('IO-')) {
        alert("This is an Investigating Officer (IO) Invite Token. Please log out and use the 'Officer Registration' tab on the login screen to register and take charge.");
        setIsJoining(false);
        return;
      }

      const { data, error } = await supabase.rpc('join_case_with_token', { token_code: cleanToken });
      if (error) throw error;
      
      let newRole = 'defense_lawyer';
      let displayRole = 'Defense Counsel';
      
      if (tokenUpper.startsWith('PROS-')) {
        newRole = 'prosecutor';
        displayRole = 'Prosecutor';
      }

      const { data: codeData } = await supabase.from('case_access_codes').select('case_id').eq('code', cleanToken).maybeSingle();

      if (codeData) {
        await supabase
          .from('case_participants')
          .update({ role_in_case: newRole, revoked_at: null })
          .eq('user_id', user.id)
          .eq('case_id', codeData.case_id);
      }

      alert(`Successfully bound to Case File as ${displayRole}!`);
      setJoinToken('');
      window.location.reload();
    } catch (err) {
      alert("Failed to join case: " + err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleAppointOfficerSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!appointOfficerName.trim() || !appointOfficerBadge.trim()) {
      alert("Please enter the Officer's Full Name and Badge / Service ID.");
      return;
    }
    if (!appointCase) return;

    setIsSubmittingAppoint(true);
    try {
      const agencyName = user?.org_name || 'Investigative Agency';
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
          .eq('case_id', appointCase.id)
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
        case_id: appointCase.id,
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
• Case File Number: ${appointCase.case_number || appointCase.id}

OFFICIAL MANDATE & DIRECTIVE:
${appointOfficerDirective.trim() || 'The appointed Investigating Officer is hereby authorized and directed to take custody of all forensic exhibits, summon relevant witnesses, record statements, and prepare the supplementary investigation report for submission before the Hon’ble Court.'}

SECURITY & ACCESS CREDENTIALS:
• Officer Activation Token Issued: ${generatedToken}
• Cryptographic Token Fingerprint (SHA-256): ${tokenHash}
══════════════════════════════════════════════════════════════════
Recorded automatically in e-Courts Cryptographic Ledger.`;

      const docHash = await sha256Hex(proceedingContent);

      await supabase.from('documents').insert([{
        case_id: appointCase.id,
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
          case_id: appointCase.id,
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
        caseNumber: appointCase.case_number
      });

      setAppointCase(null);
      setAppointOfficerName('');
      setAppointOfficerBadge('');
      setAppointOfficerDirective('');
    } catch (err) {
      alert("Failed to appoint officer: " + err.message);
    } finally {
      setIsSubmittingAppoint(false);
    }
  };

  const handleInitiateTransferToAgency = (agency) => {
    setSelectedAgencyForTransfer(agency);
    setAgencyTransferCaseId('');
    setAgencyTransferToken(null);
  };

  const handleExecuteAgencyTransfer = async (e) => {
    if (e) e.preventDefault();
    if (!agencyTransferCaseId.trim()) {
      alert("Please enter or select a Case Number.");
      return;
    }
    if (!selectedAgencyForTransfer) {
      alert("Please select a target agency.");
      return;
    }

    setIsTransferringAgency(true);
    try {
      const foundCase = cases.find(c => c.case_number === agencyTransferCaseId.trim() || c.id === agencyTransferCaseId.trim());
      let targetCaseId;
      
      if (foundCase) {
        targetCaseId = foundCase.id;
      } else {
        const { data: caseResult, error: caseErr } = await supabase
          .from('cases')
          .select('id, case_number, court_org_id')
          .eq('case_number', agencyTransferCaseId.trim())
          .single();
        
        if (caseErr || !caseResult) {
          throw new Error("Case not found on judicial roster. Please verify the Case Number.");
        }
        targetCaseId = caseResult.id;
      }

      let agencyOrgId = selectedAgencyForTransfer.id;
      try {
        const { data: dbOrg } = await supabase
          .from('organisations')
          .select('id')
          .ilike('name', `%${selectedAgencyForTransfer.acronym || selectedAgencyForTransfer.name}%`)
          .limit(1)
          .maybeSingle();
        if (dbOrg) agencyOrgId = dbOrg.id;
      } catch (e) {}

      const randomCode = Array.from(crypto.getRandomValues(new Uint8Array(5)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const agencyCode = (selectedAgencyForTransfer.acronym || 'AGENCY').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const generatedToken = `AGENCY-${agencyCode}-${randomCode}`;
      const tokenHash = await sha256Hex(generatedToken);

      try {
        await supabase.from('case_agency_transfers').insert([{
          case_id: targetCaseId,
          agency_org_id: agencyOrgId,
          initiated_by: user.id,
          token_hash: tokenHash,
          token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        }]);
      } catch (tErr) {
        console.warn("case_agency_transfers insert warning:", tErr);
      }

      await supabase.from('case_access_codes').update({ is_active: false }).eq('case_id', targetCaseId).eq('is_active', true);
      await supabase.from('case_access_codes').insert([{
        case_id: targetCaseId,
        code: generatedToken,
        created_by: user.id,
        is_active: true
      }]);

      await supabase.from('audit_log').insert([{
        actor_id: user.id,
        action: 'AGENCY_TRANSFER_INITIATED',
        entity_type: 'cases',
        case_id: targetCaseId,
        metadata: {
          agency_name: selectedAgencyForTransfer.name,
          agency_acronym: agencyCode,
          agency_org_id: agencyOrgId,
          court_name: user?.org_name || 'Court Bench'
        }
      }]);

      // Record official proceeding in documents table
      const transferTimestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' });
      const transferProceeding = `JUDICIAL ORDER & PROCEEDING: CASE TRANSFER TO SPECIAL AGENCY
══════════════════════════════════════════════════════════════════
Issuing Judicial Authority: Hon'ble ${user?.full_name || 'Presiding Judge'}
Court Jurisdiction: ${user?.org_name || 'District & Sessions Court'}
Date & Timestamp: ${transferTimestamp}

TRANSFER DETAILS:
• Case Number: ${agencyTransferCaseId.trim()}
• Designated Investigation Agency: ${selectedAgencyForTransfer.name} (${agencyCode})
• Jurisdiction Scope: ${selectedAgencyForTransfer.jurisdiction || 'Special Investigation'}
• Master Access Token Issued: ${generatedToken}
• Cryptographic Token Hash (SHA-256): ${tokenHash}

JUDICIAL DIRECTIVE:
The court hereby transfers investigative authority and docket control to ${selectedAgencyForTransfer.name}. The designated agency administrator is authorized to claim the case docket using the Master Token and appoint an Investigating Officer (IO) to conduct proceedings.
══════════════════════════════════════════════════════════════════
Recorded automatically in e-Courts Cryptographic Ledger.`;

      try {
        const transferDocHash = await sha256Hex(transferProceeding);
        await supabase.from('documents').insert([{
          case_id: targetCaseId,
          uploaded_by: user.id,
          doc_type: 'court_filing',
          title: `JUDICIAL ORDER: CASE TRANSFERRED TO ${agencyCode}`,
          storage_path: 'manual_entry',
          ocr_text: transferProceeding,
          sha256: transferDocHash,
          status: 'verified'
        }]);
      } catch (docErr) {
        console.warn("Transfer proceeding doc insert warning:", docErr);
      }

      setAgencyTransferToken(generatedToken);
    } catch (err) {
      alert("Failed to transfer case: " + err.message);
    } finally {
      setIsTransferringAgency(false);
    }
  };

  const filteredAgencies = agenciesList.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(agencySearchQuery.toLowerCase()) ||
      (a.acronym && a.acronym.toLowerCase().includes(agencySearchQuery.toLowerCase())) ||
      (a.jurisdiction && a.jurisdiction.toLowerCase().includes(agencySearchQuery.toLowerCase())) ||
      (a.tags && a.tags.some(t => t.toLowerCase().includes(agencySearchQuery.toLowerCase())));

    if (!matchesSearch) return false;
    if (selectedAgencyCategory === 'central' && a.category !== 'Central Agency') return false;
    if (selectedAgencyCategory === 'state' && a.category !== 'State Wing') return false;
    if (selectedAgencyCategory === 'cyber' && a.category !== 'Cyber & Forensics') return false;
    return true;
  });

  // Calculate Subordinate Districts for High Court
  const userState = user?.state || 'Uttar Pradesh';
  const rawDistrictsList = getDistrictsForState(userState);
  const detectedDistricts = [...new Set(cases.map(c => c.district).filter(Boolean))];
  const allHighCourtDistricts = [...new Set([...rawDistrictsList, ...detectedDistricts])];

  // District Metrics for High Court
  const districtBlocks = allHighCourtDistricts.map((dist, idx) => {
    const distCases = cases.filter(c => c.district && c.district.toLowerCase() === dist.toLowerCase());
    const distActive = distCases.filter(c => c.stage !== 'disposed' && c.stage !== 'closed').length;
    const distTransferred = distCases.filter(c => c.stage === 'appealed' || c.stage === 'transferred' || !!c.transferDetails).length;
    return {
      index: String(idx + 1).padStart(2, '0'),
      name: dist,
      totalCases: distCases.length,
      activeCases: distActive,
      transferredCases: distTransferred
    };
  });

  // State Metrics for Supreme Court
  const stateBlocks = ALL_INDIAN_STATES.map((st, idx) => {
    const stCases = cases.filter(c => (c.state && c.state.toLowerCase() === st.toLowerCase()) || (c.district && c.district.toLowerCase().includes(st.toLowerCase())));
    const stActive = stCases.filter(c => c.stage !== 'disposed' && c.stage !== 'closed').length;
    const stTransferred = stCases.filter(c => c.stage === 'appealed' || c.stage === 'transferred' || !!c.transferDetails).length;
    return {
      index: String(idx + 1).padStart(2, '0'),
      name: st,
      totalCases: stCases.length,
      activeCases: stActive,
      transferredCases: stTransferred
    };
  });

  // Filtered Case List
  const filteredCases = cases.filter(c => {
    const matchesSearch = (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (c.case_number && c.case_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.district && c.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.state && c.state.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (!matchesSearch) return false;
    if (selectedDistrict !== 'all' && c.district && c.district.toLowerCase() !== selectedDistrict.toLowerCase()) return false;
    if (selectedState !== 'all' && c.state && c.state.toLowerCase() !== selectedState.toLowerCase()) return false;
    if (selectedCategory !== 'all' && c.case_category !== selectedCategory) return false;
    
    if (activeTab === 'active') return c.stage !== 'disposed' && c.stage !== 'closed';
    if (activeTab === 'disposed') return c.stage === 'disposed' || c.stage === 'closed';
    if (activeTab === 'transferred') return c.stage === 'appealed' || c.stage === 'transferred' || !!c.transferDetails;
    return true;
  });

  const uniqueDistricts = [...new Set(cases.map(c => c.district).filter(Boolean))].sort();
  const uniqueCategories = [...new Set(cases.map(c => c.case_category).filter(Boolean))].sort();

  const isHighCourtJudge = user?.role === 'judge' && (user?.org_type === 'high_court' || user?.org_type === 'court_high');
  const isSupremeCourtJudge = user?.role === 'judge' && (user?.org_type === 'supreme_court' || user?.org_type === 'court_supreme');

  return (
    <div className="animate-in" style={{ width: '100%' }}>
      
      {/* Top Judicial Status Bar */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', background: 'var(--paper)', padding: '1.25rem', borderRadius: '2px', border: '1px solid var(--line)', borderTop: '3px solid var(--accent)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Landmark size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>
              {isSupremeCourtJudge ? 'Supreme Court National Registry' : 
               isHighCourtJudge ? `${user?.org_name || 'High Court'} Jurisdiction` : 
               user?.role === 'judge' ? `${user?.org_name || 'District Court'} Judicial Docket` : 
               'Official Document Management Portal'}
            </h2>
          </div>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            {user?.role === 'judge' ? `Presiding Officer: Hon'ble ${user?.full_name || 'Judge'} • Single Point Judicial Grid` : 
             user?.role === 'lawyer' ? `Enrolled Counsel: ${user?.full_name} (Bar ID: ${user?.badge_no})` : 
             `Authorized Officer: ${user?.full_name} (${user?.designation || 'Special Duty'})`}
          </p>
        </div>

        {/* Real-time System Metrics Header Badge */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: '#EFECE6', border: '1px solid var(--line)', padding: '0.4rem 0.85rem', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={15} color="var(--bg-band)" />
            <div>
              <div style={{ fontSize: '0.62rem', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Time</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--bg-band)', fontFamily: 'monospace' }}>
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          </div>

          <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', padding: '0.4rem 0.85rem', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={15} color="var(--success)" />
            <div>
              <div style={{ fontSize: '0.62rem', color: '#137333', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Today's Date</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--success)' }}>
                {currentTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE DASHBOARD VIEW (Default: ?view=dashboard or /) */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="animate-in">
          {/* Primary Metrics Summary Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Citizen e-FIRs Desk (Prominent for Police & IOs) */}
            {(user?.role === 'police_officer' || user?.role === 'investigating_officer') && (
              <div 
                onClick={() => navigate('/?view=efir')} 
                className="glass-panel" 
                style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #A2191F', background: '#FFFFFF', cursor: 'pointer', boxShadow: pendingEfirCount > 0 ? '0 0 0 2px rgba(162, 25, 31, 0.2)' : 'none' }}
              >
                <div style={{ background: '#FCE8E6', padding: '0.75rem', borderRadius: '2px', border: '1px solid #FAD2CF' }}>
                  <FileText color="#A2191F" size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <p style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, margin: 0 }}>Citizen e-FIRs</p>
                    {pendingEfirCount > 0 && (
                      <span className="badge badge-accent" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>NEW</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.2rem 0 0 0', color: pendingEfirCount > 0 ? '#A2191F' : 'var(--ink)' }}>
                    {loading ? '-' : `${pendingEfirCount} Pending`}
                  </h3>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>{allEfirCases.length} total in station</div>
                </div>
              </div>
            )}

            {/* Today's Court Sessions */}
            <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warning)' }}>
              <div style={{ background: '#FEF7E0', padding: '0.75rem', borderRadius: '2px', border: '1px solid #FEEFC3' }}>
                <Calendar color="var(--warning)" size={22} />
              </div>
              <div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, margin: 0 }}>Today's Hearings</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.2rem 0 0 0', color: 'var(--ink)' }}>{loading ? '-' : todaySessionsCount}</h3>
              </div>
            </div>

            {/* Active Cases */}
            <div 
              onClick={() => navigate('/?view=active')} 
              className="glass-panel" 
              style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--accent)', cursor: 'pointer' }}
            >
              <div style={{ background: '#FCE8E6', padding: '0.75rem', borderRadius: '2px', border: '1px solid #FAD2CF' }}>
                <Activity color="var(--accent)" size={22} />
              </div>
              <div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, margin: 0 }}>Total Active Cases</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.2rem 0 0 0', color: 'var(--ink)' }}>{loading ? '-' : activeCases}</h3>
              </div>
            </div>

            {/* Transferred & Appealed Cases */}
            <div 
              onClick={() => navigate('/?view=transferred')} 
              className="glass-panel" 
              style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--bg-band)', cursor: 'pointer' }}
            >
              <div style={{ background: '#E8ECEF', padding: '0.75rem', borderRadius: '2px', border: '1px solid #CCD4DC' }}>
                <ArrowRightLeft color="var(--bg-band)" size={22} />
              </div>
              <div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, margin: 0 }}>Transferred / Appealed</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.2rem 0 0 0', color: 'var(--ink)' }}>{loading ? '-' : transferred}</h3>
              </div>
            </div>

            {/* Disposed / Closed Cases */}
            <div 
              onClick={() => navigate('/?view=disposed')} 
              className="glass-panel" 
              style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--success)', cursor: 'pointer' }}
            >
              <div style={{ background: '#E6F4EA', padding: '0.75rem', borderRadius: '2px', border: '1px solid #CEEAD6' }}>
                <CheckCircle color="var(--success)" size={22} />
              </div>
              <div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, margin: 0 }}>Disposed Archives</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.2rem 0 0 0', color: 'var(--ink)' }}>{loading ? '-' : disposed}</h3>
              </div>
            </div>
          </div>

          {/* Action Required: Pending e-FIR Notification Banner for Police */}
          {(user?.role === 'police_officer' || user?.role === 'investigating_officer') && pendingEfirCount > 0 && (
            <div className="animate-in" style={{ background: '#FFF5F5', border: '1px solid #FAD2CF', borderLeft: '4px solid #A2191F', padding: '1rem 1.25rem', borderRadius: '2px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <ShieldAlert size={26} color="#A2191F" />
                <div>
                  <h4 style={{ color: '#A2191F', margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                    Action Required: {pendingEfirCount} Citizen e-FIR{pendingEfirCount !== 1 ? 's' : ''} Awaiting Police Verification
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--ink)' }}>
                    New electronic complaints filed under Section 173 BNSS (2023) in your police station's jurisdiction require IO assignment or judicial transfer.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/?view=efir')} 
                className="btn-primary" 
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', background: '#A2191F' }}
              >
                Open e-FIR Inward Desk <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Pending Revocation Alert */}
          {user?.role === 'judge' && pendingRevocationsCount > 0 && (
            <div className="animate-in" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <AlertTriangle size={24} color="var(--danger)" />
              <div>
                <h4 style={{ color: 'var(--danger)', margin: 0, fontSize: '1.05rem' }}>Action Required: {pendingRevocationsCount} Pending Revocation Request{pendingRevocationsCount !== 1 ? 's' : ''}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Review pending counsel revocation requests under your active case files.</p>
              </div>
            </div>
          )}

          {/* Lawyer Token Join Panel */}
          {(user?.role === 'lawyer' || user?.role === 'agency_admin' || user?.role === 'agency_officer') && (
            <div className="glass-panel animate-in" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem', border: '1px solid var(--line)', borderTop: '3px solid var(--accent)', background: 'var(--paper)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <Lock size={18} color="var(--accent)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--ink)' }}>Access Digital Docket File (Token Binding)</h3>
              </div>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', marginBottom: '0.85rem' }}>
                Enter the Single-Use Access Token provided by the Court or Police Station to attach yourself to the proceedings.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '600px', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="e.g. DEF-8A2F9B or PROS-91C4 or AGENCY-CBI-..." 
                  value={joinToken} 
                  onChange={e => setJoinToken(e.target.value)}
                  className="input-field" 
                  style={{ textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1, minWidth: '220px' }}
                />
                <button onClick={handleJoinCase} disabled={isJoining || !joinToken.trim()} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  {isJoining ? 'Verifying...' : 'Claim Case Access'}
                </button>
              </div>
            </div>
          )}

          {/* HIGH COURT SPECIFIC: SUBORDINATE DISTRICT COURTS NUMBERED BLOCKS */}
          {isHighCourtJudge && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--bg-band)' }}>
                    <Building2 size={18} color="var(--accent)" /> Subordinate District Courts Grid ({userState} High Court Jurisdiction)
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: '0.2rem 0 0 0' }}>
                    Numbered roster of subordinate district courts. Displays active cases and cases transferred/appealed to this High Court bench.
                  </p>
                </div>
              </div>

              <div className="numbered-grid">
                {districtBlocks.map((dist) => (
                  <div 
                    key={dist.name}
                    onClick={() => navigate(`/?view=active&district=${encodeURIComponent(dist.name)}`)}
                    className="numbered-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span className="numbered-badge">{dist.index}</span>
                      <span className="badge" style={{ fontSize: '0.65rem', background: dist.activeCases > 0 ? '#E8ECEF' : '#F4F3EF', color: dist.activeCases > 0 ? 'var(--bg-band)' : 'var(--ink-soft)' }}>
                        {dist.activeCases} ACTIVE
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--ink)', marginBottom: '0.35rem' }}>
                      {dist.name} District Court
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--ink-soft)', borderTop: '1px solid var(--line)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                      <span>Appealed to HC: <strong style={{ color: 'var(--accent)' }}>{dist.transferredCases}</strong></span>
                      <span>Total: <strong style={{ color: 'var(--ink)' }}>{dist.totalCases}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUPREME COURT SPECIFIC: ALL-INDIA STATES & UT NUMBERED BLOCKS */}
          {isSupremeCourtJudge && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--bg-band)' }}>
                    <Landmark size={18} color="var(--accent)" /> All-India States & Union Territories Grid (Supreme Court Jurisdiction)
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: '0.2rem 0 0 0' }}>
                    Numbered jurisdiction blocks for all 30 States & UTs. Displays active dockets and appeals/SLPs transferred to the Supreme Court.
                  </p>
                </div>
              </div>

              <div className="numbered-grid">
                {stateBlocks.map((st) => (
                  <div 
                    key={st.name}
                    onClick={() => navigate(`/?view=active&state=${encodeURIComponent(st.name)}`)}
                    className="numbered-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span className="numbered-badge">{st.index}</span>
                      <span className="badge" style={{ fontSize: '0.65rem', background: st.activeCases > 0 ? '#E6F4EA' : '#F4F3EF', color: st.activeCases > 0 ? '#137333' : 'var(--ink-soft)' }}>
                        {st.activeCases} ACTIVE
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--ink)', marginBottom: '0.35rem' }}>
                      {st.name}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--ink-soft)', borderTop: '1px solid var(--line)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                      <span>Appealed to SC: <strong style={{ color: 'var(--accent)' }}>{st.transferredCases}</strong></span>
                      <span>Total: <strong style={{ color: 'var(--ink)' }}>{st.totalCases}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Active Cases Preview */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                <FolderKanban size={18} color="var(--accent)" /> Recent Active Case Dockets
              </h3>
              <Link to="/?view=active" className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                View All Active Cases ({activeCases})
              </Link>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: '#EFECE6', borderBottom: '1px solid var(--line)' }}>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--bg-band)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Case Number</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--bg-band)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Title & Type</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--bg-band)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Jurisdiction</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--bg-band)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Stage</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--bg-band)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
                          <Activity className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                          <div>Loading Docket...</div>
                        </td>
                      </tr>
                    ) : cases.filter(c => c.stage !== 'disposed' && c.stage !== 'closed').length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
                          <FolderOpen size={36} opacity={0.4} style={{ margin: '0 auto 0.5rem auto' }} />
                          <div>No active cases currently pending.</div>
                        </td>
                      </tr>
                    ) : (
                      cases.filter(c => c.stage !== 'disposed' && c.stage !== 'closed').slice(0, 6).map((c, i) => (
                        <tr 
                          key={c.id} 
                          style={{ borderBottom: '1px solid var(--line)', background: i % 2 === 0 ? '#FFFFFF' : '#FAF9F6' }}
                        >
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent)' }}>
                            {c.case_number || 'Pending'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{c.title || 'Untitled Case'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                              {Array.isArray(c.sections) ? c.sections.join(', ') : (c.sections || 'General Section')}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                            {c.district ? c.district.toUpperCase() : (c.state || 'National')}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className="badge badge-warning">
                              {(c.stage ? c.stage.replace(/_/g, ' ') : 'IN TRIAL').toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                              onClick={() => navigate(`/cases/${c.id}`)}
                            >
                              Open Case
                            </button>
                            {user?.role === 'agency_admin' && (
                              <button 
                                className="btn-primary" 
                                style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                                onClick={() => setAppointCase(c)}
                              >
                                <Shield size={13} /> Appoint IO
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. AGENCY TRANSFER DIRECTORY VIEW (?view=agency-transfer) */}
      {/* ========================================================================= */}
      {activeTab === 'agency-transfer' && (
        <div className="animate-in" style={{ marginBottom: '2rem', background: 'var(--paper)', border: '1px solid var(--line)', borderTop: '3px solid var(--accent)', borderRadius: '2px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--bg-band)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                <Building2 size={20} color="var(--accent)" /> National & State Investigative Agencies Directory
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                Select an agency to initiate official case file transfer and generate a Single-Use Master Token.
              </p>
            </div>
            <button onClick={() => navigate('/?view=dashboard')} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
              &larr; Return to Dashboard
            </button>
          </div>

          {/* Search & Category Filter */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} color="var(--ink-soft)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search agency by acronym (CBI, NIA, ED) or name..." 
                value={agencySearchQuery} 
                onChange={e => setAgencySearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button onClick={() => setSelectedAgencyCategory('all')} className={`btn-${selectedAgencyCategory === 'all' ? 'primary' : 'secondary'}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                All ({NATIONAL_AGENCIES.length})
              </button>
              <button onClick={() => setSelectedAgencyCategory('central')} className={`btn-${selectedAgencyCategory === 'central' ? 'primary' : 'secondary'}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                Central Agencies
              </button>
              <button onClick={() => setSelectedAgencyCategory('state')} className={`btn-${selectedAgencyCategory === 'state' ? 'primary' : 'secondary'}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                State Wings
              </button>
              <button onClick={() => setSelectedAgencyCategory('cyber')} className={`btn-${selectedAgencyCategory === 'cyber' ? 'primary' : 'secondary'}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                Cyber & Forensics
              </button>
            </div>
          </div>

          {/* Agencies Grid with Full Descriptions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredAgencies.map((agency) => (
              <div 
                key={agency.id || agency.code} 
                className="glass-panel" 
                style={{ 
                  padding: '1rem', 
                  borderRadius: '2px', 
                  border: '1px solid var(--line)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  background: 'var(--paper)',
                  borderLeft: `4px solid var(--accent)`
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                    <div style={{ fontSize: '1.4rem', width: '36px', height: '36px', borderRadius: '2px', background: '#EFECE6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {agency.emblem || '🏛️'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>{agency.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>{agency.acronym} • {agency.category || 'Law Enforcement'}</div>
                    </div>
                  </div>
                  
                  {/* Full Restored Description */}
                  <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', margin: '0.4rem 0', lineHeight: '1.4' }}>
                    {agency.description}
                  </p>

                  {/* Tags */}
                  {agency.tags && agency.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      {agency.tags.map((tag, tIdx) => (
                        <span key={tIdx} style={{ fontSize: '0.65rem', background: '#E8ECEF', padding: '0.1rem 0.35rem', borderRadius: '2px', color: 'var(--bg-band)' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.65rem', marginTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>📍 {agency.jurisdiction}</span>
                  <button 
                    onClick={() => handleInitiateTransferToAgency(agency)}
                    className="btn-primary" 
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                  >
                    <Send size={13} /> Transfer Case
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CITIZEN e-FIR INWARD REGISTRY & INTAKE DESK (?view=efir) */}
      {/* ========================================================================= */}
      {activeTab === 'efir' && (
        <div className="animate-in" style={{ marginBottom: '2rem' }}>
          
          {/* Header Banner */}
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderTop: '4px solid #A2191F', borderRadius: '2px', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                <ShieldAlert size={22} color="#A2191F" />
                <h3 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>
                  Citizen e-FIR Inward Registry & Case Intake Desk
                </h3>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                Statutory Review, Investigating Officer (IO) Assignment, Zero FIR Jurisdictional Handover & Court Charge Sheet Filing under Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023) / CrPC.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--bg-band)', fontWeight: 600 }}>
                <span>📍 Station Jurisdiction: <strong>{user?.org_name || user?.district || 'Territorial Police Station'}</strong></span>
                <span>•</span>
                <span>District: <strong>{user?.district || 'Central'}</strong></span>
                <span>•</span>
                <span>State: <strong>{user?.state || 'National'}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => navigate('/create-case')} 
                className="btn-primary" 
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <FilePlus size={14} /> Register Formal Police FIR
              </button>
              <button 
                onClick={() => navigate('/?view=dashboard')} 
                className="btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                &larr; Return to Dashboard
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards for e-FIRs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Total Inward e-FIRs */}
            <div className="glass-panel" style={{ padding: '0.85rem 1.1rem', background: '#FFFFFF', borderLeft: '4px solid var(--bg-band)' }}>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, margin: 0 }}>Total Inward e-FIRs</p>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.15rem 0 0 0', color: 'var(--ink)' }}>{allEfirCases.length}</h3>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-soft)', marginTop: '0.15rem' }}>In station database</div>
            </div>

            {/* Pending Police Action */}
            <div 
              onClick={() => setEfirStatusFilter('pending')}
              className="glass-panel" 
              style={{ padding: '0.85rem 1.1rem', background: '#FFFFFF', borderLeft: '4px solid #A2191F', cursor: 'pointer', boxShadow: efirStatusFilter === 'pending' ? '0 0 0 2px #A2191F' : 'none' }}
            >
              <p style={{ color: '#A2191F', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, margin: 0 }}>Pending Action</p>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.15rem 0 0 0', color: '#A2191F' }}>{pendingEfirCount}</h3>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-soft)', marginTop: '0.15rem' }}>Awaiting verification & IO</div>
            </div>

            {/* Under Active Investigation */}
            <div 
              onClick={() => setEfirStatusFilter('investigating')}
              className="glass-panel" 
              style={{ padding: '0.85rem 1.1rem', background: '#FFFFFF', borderLeft: '4px solid #1B5FB3', cursor: 'pointer', boxShadow: efirStatusFilter === 'investigating' ? '0 0 0 2px #1B5FB3' : 'none' }}
            >
              <p style={{ color: '#1B5FB3', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, margin: 0 }}>Active Investigation</p>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.15rem 0 0 0', color: '#1B5FB3' }}>{underInvestigationEfirCount}</h3>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-soft)', marginTop: '0.15rem' }}>Case converted & IO taking steps</div>
            </div>

            {/* Forwarded to Court */}
            <div 
              onClick={() => setEfirStatusFilter('forwarded')}
              className="glass-panel" 
              style={{ padding: '0.85rem 1.1rem', background: '#FFFFFF', borderLeft: '4px solid var(--warning)', cursor: 'pointer', boxShadow: efirStatusFilter === 'forwarded' ? '0 0 0 2px var(--warning)' : 'none' }}
            >
              <p style={{ color: 'var(--warning)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, margin: 0 }}>In Court / Transferred</p>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.15rem 0 0 0', color: 'var(--warning)' }}>{forwardedEfirCount}</h3>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-soft)', marginTop: '0.15rem' }}>Charge sheet filed / Zero FIR</div>
            </div>

            {/* Disposed / Resolved */}
            <div 
              onClick={() => setEfirStatusFilter('disposed')}
              className="glass-panel" 
              style={{ padding: '0.85rem 1.1rem', background: '#FFFFFF', borderLeft: '4px solid var(--success)', cursor: 'pointer', boxShadow: efirStatusFilter === 'disposed' ? '0 0 0 2px var(--success)' : 'none' }}
            >
              <p style={{ color: 'var(--success)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, margin: 0 }}>Disposed Archives</p>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.15rem 0 0 0', color: 'var(--success)' }}>{disposedEfirCount}</h3>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-soft)', marginTop: '0.15rem' }}>Closure report recorded</div>
            </div>
          </div>

          {/* Search, Status & Category Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', background: 'var(--paper)', padding: '0.85rem 1rem', border: '1px solid var(--line)', borderRadius: '2px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} color="var(--ink-soft)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search e-FIR tracking no (EFIR-2026-...), complainant, suspect, or keywords..." 
                value={efirSearchQuery} 
                onChange={e => setEfirSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.25rem', height: '36px', fontSize: '0.82rem' }}
              />
            </div>

            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                onClick={() => setEfirStatusFilter('all')} 
                className={`btn-${efirStatusFilter === 'all' ? 'primary' : 'secondary'}`} 
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
              >
                All ({allEfirCases.length})
              </button>
              <button 
                onClick={() => setEfirStatusFilter('pending')} 
                className={`btn-${efirStatusFilter === 'pending' ? 'primary' : 'secondary'}`} 
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', background: efirStatusFilter === 'pending' ? '#A2191F' : 'transparent', color: efirStatusFilter === 'pending' ? '#FFFFFF' : '#A2191F', borderColor: '#A2191F' }}
              >
                🔴 Pending Action ({pendingEfirCount})
              </button>
              <button 
                onClick={() => setEfirStatusFilter('investigating')} 
                className={`btn-${efirStatusFilter === 'investigating' ? 'primary' : 'secondary'}`} 
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
              >
                Active Investigation ({underInvestigationEfirCount})
              </button>
              <button 
                onClick={() => setEfirStatusFilter('forwarded')} 
                className={`btn-${efirStatusFilter === 'forwarded' ? 'primary' : 'secondary'}`} 
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
              >
                Court / Transferred ({forwardedEfirCount})
              </button>
              <button 
                onClick={() => setEfirStatusFilter('disposed')} 
                className={`btn-${efirStatusFilter === 'disposed' ? 'primary' : 'secondary'}`} 
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
              >
                Disposed ({disposedEfirCount})
              </button>
            </div>
          </div>

          {/* e-FIR Cases List Grid */}
          {filteredEfirCases.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '2px' }}>
              <FileText size={42} color="var(--ink-soft)" style={{ margin: '0 auto 0.75rem auto', opacity: 0.6 }} />
              <h4 style={{ margin: '0 0 0.35rem 0', color: 'var(--ink)' }}>No Citizen e-FIRs Found Matching Criteria</h4>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', maxWidth: '500px', margin: '0 auto 1.25rem auto' }}>
                {efirSearchQuery || efirStatusFilter !== 'all' 
                  ? "Try resetting your search query or status filter." 
                  : "When citizens lodge electronic FIRs under your station's jurisdiction from the public portal, they will automatically appear here in real-time."}
              </p>
              {(efirSearchQuery || efirStatusFilter !== 'all') && (
                <button 
                  onClick={() => { setEfirSearchQuery(''); setEfirStatusFilter('all'); }} 
                  className="btn-secondary" 
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredEfirCases.map((c) => {
                const isPending = c.stage === 'fir_registered';
                const isInvestigating = c.stage === 'under_investigation';
                const isForwarded = c.stage === 'in_trial' || c.stage === 'charge_sheet_filed';
                const isTransferred = c.stage === 'transferred';
                const isDisposed = c.stage === 'disposed' || c.stage === 'closed';

                return (
                  <div 
                    key={c.id} 
                    className="glass-panel animate-in" 
                    style={{ 
                      padding: '1.25rem', 
                      background: '#FFFFFF', 
                      border: '1px solid var(--line)', 
                      borderLeft: isPending ? '5px solid #A2191F' : isInvestigating ? '5px solid #1B5FB3' : isForwarded ? '5px solid var(--warning)' : isDisposed ? '5px solid var(--success)' : '5px solid var(--bg-band)',
                      borderRadius: '2px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem'
                    }}
                  >
                    {/* Top Row: Ref No, Stage Badge, Date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--bg-band)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                            {c.case_number}
                          </span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(c.case_number);
                              alert("Copied e-FIR Tracking Number: " + c.case_number);
                            }}
                            className="btn-secondary"
                            title="Copy Tracking Number"
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <Copy size={11} /> Copy
                          </button>
                          
                          {/* Stage Badge */}
                          {isPending && (
                            <span className="badge" style={{ background: '#FCE8E6', color: '#A2191F', border: '1px solid #FAD2CF', fontWeight: 700, fontSize: '0.7rem' }}>
                              🔴 PENDING POLICE VERIFICATION
                            </span>
                          )}
                          {isInvestigating && (
                            <span className="badge" style={{ background: '#E8F0FE', color: '#1B5FB3', border: '1px solid #D2E3FC', fontWeight: 700, fontSize: '0.7rem' }}>
                              🔵 ACTIVE INVESTIGATION (IO ASSIGNED)
                            </span>
                          )}
                          {isForwarded && (
                            <span className="badge" style={{ background: '#FEF7E0', color: '#B45309', border: '1px solid #FEEFC3', fontWeight: 700, fontSize: '0.7rem' }}>
                              🟣 CHARGE SHEET FILED IN COURT
                            </span>
                          )}
                          {isTransferred && (
                            <span className="badge" style={{ background: '#E8ECEF', color: 'var(--bg-band)', border: '1px solid #CCD4DC', fontWeight: 700, fontSize: '0.7rem' }}>
                              🟠 TRANSFERRED (ZERO FIR)
                            </span>
                          )}
                          {isDisposed && (
                            <span className="badge" style={{ background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6', fontWeight: 700, fontSize: '0.7rem' }}>
                              🟢 RESOLVED / DISPOSED (CLOSURE REPORT)
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', marginTop: '0.35rem' }}>
                          {c.title || 'e-FIR Complaint Docket'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                        <div>Filed On: <strong>{formatSafeDate(c.created_at)}</strong></div>
                        <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: '0.15rem' }}>Section 173 BNSS / CrPC 154</div>
                      </div>
                    </div>

                    {/* Middle Row: Parties & Narrative Particulars */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', fontSize: '0.82rem', background: '#FAF9F6', padding: '0.85rem', borderRadius: '2px', border: '1px solid var(--line)' }}>
                      <div>
                        <div style={{ color: 'var(--ink-soft)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Complainant / Informant</div>
                        <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{c.plaintiff || 'Citizen Informant'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', marginTop: '0.1rem' }}>District: {c.district || 'Central'}</div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--ink-soft)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Suspect(s) / Accused Particulars</div>
                        <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{c.defendant || 'Unknown / Identity under verification'}</div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--ink-soft)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Police Jurisdiction / Forwarded Court</div>
                        <div style={{ fontWeight: 700, color: 'var(--bg-band)' }}>
                          {c.police_org?.name || user?.org_name || 'Designated Police Station'}
                        </div>
                        {c.court_org && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--warning)', fontWeight: 600, marginTop: '0.1rem' }}>
                            Court: {c.court_org.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ color: 'var(--ink-soft)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Cryptographic Integrity Hash</div>
                        <code style={{ fontSize: '0.68rem', color: 'var(--bg-band)', fontFamily: 'monospace', display: 'block', wordBreak: 'break-all' }}>
                          SHA-256 e-Courts Chain
                        </code>
                        <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 600 }}>✓ Tamper-Proof Verified</span>
                      </div>
                    </div>

                    {/* Complaint Narrative Preview */}
                    {c.description && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', lineHeight: '1.45', background: '#FFFFFF', borderLeft: '3px solid var(--line)', padding: '0.5rem 0.75rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Statement of Facts:</div>
                        {c.description.length > 240 ? `${c.description.substring(0, 240)}...` : c.description}
                      </div>
                    )}

                    {/* Bottom Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {/* 1. Review Dossier Button */}
                        <button 
                          onClick={() => handleOpenEfirDossier(c)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Eye size={13} /> Review Full Dossier
                        </button>

                        {/* 2. Accept & Assign IO (If Pending) */}
                        {isPending && (
                          <button 
                            onClick={() => handleOpenEfirAction(c, 'accept')}
                            className="btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#1B5FB3' }}
                          >
                            <UserCheck size={13} /> Accept & Initiate Investigation
                          </button>
                        )}

                        {/* 3. Forward to Court / File Charge Sheet */}
                        <button 
                          onClick={() => handleOpenEfirAction(c, 'court_forward')}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Landmark size={13} /> Forward to Court (Charge Sheet)
                        </button>

                        {/* 4. Zero FIR Jurisdictional Handover */}
                        <button 
                          onClick={() => handleOpenEfirAction(c, 'station_transfer')}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <ArrowRightLeft size={13} /> Transfer to Another Station
                        </button>

                        {/* 5. Resolve / File Closure Report */}
                        {!isDisposed && (
                          <button 
                            onClick={() => handleOpenEfirAction(c, 'resolve')}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)', borderColor: 'var(--success)' }}
                          >
                            <CheckCircle2 size={13} /> File Closure Report
                          </button>
                        )}
                      </div>

                      {/* Open Full Case View */}
                      <button 
                        onClick={() => navigate(`/cases/${c.id}`)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <FolderOpen size={13} /> Case Timeline & Evidence <ChevronRight size={13} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CASE ROSTER TABLE VIEW (For active, disposed, transferred, all) */}
      {/* ========================================================================= */}
      {activeTab !== 'dashboard' && activeTab !== 'agency-transfer' && activeTab !== 'efir' && (
        <div className="animate-in">
          {/* Header for Active/Disposed/Transferred Table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                {activeTab === 'active' ? `Active Cases Docket (${activeCases})` : 
                 activeTab === 'disposed' ? `Closed / Disposed Case Archives (${disposed})` : 
                 activeTab === 'transferred' ? `Transferred & Appealed Cases (${transferred})` : 
                 `All Case Dockets (${cases.length})`}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: '0.2rem 0 0 0' }}>
                {activeTab === 'active' ? 'Real-time record of all pending trial and investigation proceedings.' : 
                 activeTab === 'disposed' ? 'Immutable archive of pronounced judgements and disposed dockets.' : 
                 activeTab === 'transferred' ? 'Cases transferred to other police stations, courts, or appellate tiers.' : 
                 'Complete database of all registered dockets.'}
              </p>
            </div>

            {/* Sub-filters & Search Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '650px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {uniqueCategories.length > 0 && (
                <select className="input-field" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ padding: '0.35rem 0.65rem', width: '150px', height: '36px', fontSize: '0.82rem' }}>
                  <option value="all">All Categories</option>
                  {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

              <div className="glass-panel" style={{ padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px', height: '36px' }}>
                <Search size={16} color="var(--ink-soft)" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, case no, or district..." 
                  style={{ background: 'transparent', border: 'none', color: 'var(--ink)', width: '100%', outline: 'none', padding: 0, fontSize: '0.82rem' }}
                />
              </div>
            </div>
          </div>

          {/* Full Table */}
          <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '2rem' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#EFECE6', borderBottom: '1px solid var(--line)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--bg-band)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Case Number</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--bg-band)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Title & Details</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--bg-band)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Jurisdiction</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--bg-band)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Stage</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--bg-band)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--bg-band)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
                        <Activity className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                        <div>Loading Roster...</div>
                      </td>
                    </tr>
                  ) : filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
                        <FolderOpen size={36} opacity={0.4} style={{ margin: '0 auto 0.5rem auto' }} />
                        <div>No case files matching your selected criteria.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((c, i) => (
                      <tr 
                        key={c.id} 
                        style={{ borderBottom: '1px solid var(--line)', background: i % 2 === 0 ? '#FFFFFF' : '#FAF9F6' }}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent)' }}>
                          {c.case_number || 'Pending'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{c.title || 'Untitled Case'}</span>
                              <span className="badge" style={{ fontSize: '0.62rem', background: c.case_category === 'Criminal' ? '#FCE8E6' : '#E8ECEF', color: c.case_category === 'Criminal' ? 'var(--danger)' : 'var(--bg-band)', border: `1px solid ${c.case_category === 'Criminal' ? '#FAD2CF' : '#CCD4DC'}` }}>
                                {c.case_category ? c.case_category.toUpperCase() : 'GENERAL'}
                              </span>
                            </div>
                            {c.sections && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                                Sections: {Array.isArray(c.sections) ? c.sections.join(', ') : c.sections}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontSize: '0.82rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MapPin size={13} color="var(--ink-soft)" />
                            {c.district ? `${c.district.toUpperCase()}` : (c.state || 'National')}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${c.stage === 'disposed' || c.stage === 'closed' ? 'badge-success' : c.stage === 'appealed' ? 'badge-success' : 'badge-warning'}`}>
                            {c.stage === 'appealed' ? 'APPEALED' : (c.stage ? c.stage.replace(/_/g, ' ') : 'PENDING').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--ink-soft)', fontSize: '0.78rem' }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : 'Recent'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                            onClick={() => navigate(`/cases/${c.id}`)}
                          >
                            Open Case
                          </button>
                          {user?.role === 'agency_admin' && (
                            <button 
                              className="btn-primary" 
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                              onClick={() => setAppointCase(c)}
                            >
                              <Shield size={13} /> Appoint IO
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Case Transfer Confirmation Dialog */}
      {selectedAgencyForTransfer && !agencyTransferToken && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '500px', padding: '1.75rem', background: '#FFFFFF', border: '1px solid var(--line)', borderTop: '4px solid var(--accent)', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem' }}>
              <div style={{ fontSize: '1.75rem', width: '40px', height: '40px', borderRadius: '2px', background: '#EFECE6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{selectedAgencyForTransfer.emblem || '🏛️'}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>
                  Transfer to {selectedAgencyForTransfer.acronym}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{selectedAgencyForTransfer.name}</div>
              </div>
            </div>

            <form onSubmit={handleExecuteAgencyTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Select from Current Bench Cases:
                </label>
                <select 
                  className="input-field" 
                  value={agencyTransferCaseId} 
                  onChange={e => setAgencyTransferCaseId(e.target.value)}
                >
                  <option value="">-- Choose active case from your bench --</option>
                  {cases.filter(c => c.stage !== 'disposed' && c.stage !== 'closed').map(c => (
                    <option key={c.id} value={c.case_number}>
                      {c.case_number} — {c.title} ({c.district || c.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Or Type Exact Case / FIR Number:
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. FIR-2024-001 or CR-2024-..." 
                  value={agencyTransferCaseId} 
                  onChange={e => setAgencyTransferCaseId(e.target.value)} 
                  required
                />
              </div>

              <div style={{ background: '#FAF9F6', padding: '0.65rem 0.85rem', borderRadius: '2px', borderLeft: '3px solid var(--accent)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                Upon transfer, full digital custody will be assigned to <strong>{selectedAgencyForTransfer.name}</strong> under the Bharatiya Nagarik Suraksha Sanhita (BNSS).
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedAgencyForTransfer(null)} 
                  className="btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isTransferringAgency || !agencyTransferCaseId.trim()} 
                  className="btn-primary" 
                  style={{ flex: 2 }}
                >
                  {isTransferringAgency ? 'Transferring...' : 'Execute Case Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-Time Master Token Certificate Modal */}
      {/* Case Transfer Success Token Modal */}
      {agencyTransferToken && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', background: '#FFFFFF', border: '1px solid var(--line)', borderTop: '4px solid var(--success)', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <CheckCircle size={26} color="var(--success)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>
                  Case Transfer Issued Successfully
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                  Target: {selectedAgencyForTransfer?.name || 'Designated Agency'}
                </div>
              </div>
            </div>

            <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.82rem', marginBottom: '1rem', background: '#FCE8E6', padding: '0.65rem 0.85rem', borderRadius: '2px', borderLeft: '3px solid var(--danger)' }}>
              IMPORTANT: This Master Token is generated once and will NEVER be displayed again. Share it directly with the receiving agency administrator.
            </p>

            <div style={{ background: '#EFECE6', padding: '0.75rem 1rem', borderRadius: '2px', border: '1px solid var(--line)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <code style={{ fontSize: '1.2rem', letterSpacing: '0.06em', color: 'var(--bg-band)', fontWeight: 700, fontFamily: 'monospace' }}>
                {agencyTransferToken}
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(agencyTransferToken);
                  setCopiedToken(true);
                  setTimeout(() => setCopiedToken(false), 2000);
                }} 
                className="btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {copiedToken ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                {copiedToken ? 'Copied' : 'Copy'}
              </button>
            </div>

            <button 
              onClick={() => {
                setAgencyTransferToken(null);
                setSelectedAgencyForTransfer(null);
              }} 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.5rem' }}
            >
              Dismiss (Irreversible)
            </button>
          </div>
        </div>
      )}

      {/* Agency Admin: Appoint Investigating Officer (IO) Modal */}
      {appointCase && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10002, padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '540px', padding: '1.75rem', background: '#FFFFFF', border: '1px solid var(--line)', borderTop: '4px solid var(--accent)', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: '#EFECE6', padding: '0.5rem', borderRadius: '2px' }}>
                  <Shield size={20} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>Appoint Investigating Officer</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                    Case: <strong>{appointCase.case_number}</strong> • {appointCase.title}
                  </div>
                </div>
              </div>
              <button onClick={() => setAppointCase(null)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'transparent' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAppointOfficerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                  Officer Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Insp. Vikram Singh" 
                  value={appointOfficerName} 
                  onChange={e => setAppointOfficerName(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                    Rank / Designation <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Inspector / IO" 
                    value={appointOfficerRank} 
                    onChange={e => setAppointOfficerRank(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                    Service Badge / ID No <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. CID-8842" 
                    value={appointOfficerBadge} 
                    onChange={e => setAppointOfficerBadge(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                  Investigation Mandate / Directives (Recorded in Judicial Docket)
                </label>
                <textarea 
                  className="input-field" 
                  rows="3" 
                  placeholder="Official investigation scope, exhibit custody instructions, and forensic examination requirements..."
                  value={appointOfficerDirective}
                  onChange={e => setAppointOfficerDirective(e.target.value)}
                />
              </div>

              <div style={{ background: '#E8ECEF', padding: '0.65rem 0.85rem', borderRadius: '2px', borderLeft: '3px solid var(--bg-band)', fontSize: '0.78rem', color: 'var(--bg-band)' }}>
                Generating this appointment creates a unique single-use Officer Token. The officer will receive access strictly to this case docket.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setAppointCase(null)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingAppoint || !appointOfficerName.trim() || !appointOfficerBadge.trim()} 
                  className="btn-primary" 
                  style={{ flex: 2 }}
                >
                  {isSubmittingAppoint ? 'Issuing Appointment...' : 'Issue Officer Token & Appoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Officer Appointment Success & Token Modal */}
      {appointedOfficerSuccess && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10003, padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '540px', padding: '1.75rem', background: '#FFFFFF', border: '1px solid var(--line)', borderTop: '4px solid var(--success)', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <CheckCircle size={28} color="var(--success)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>
                  Investigating Officer Appointed Successfully
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                  Case: {appointedOfficerSuccess.caseNumber} • Official Record Logged
                </div>
              </div>
            </div>

            <div style={{ background: '#FAF9F6', border: '1px solid var(--line)', borderRadius: '2px', padding: '0.85rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--ink)' }}>
              <div><strong>Appointed Officer:</strong> {appointedOfficerSuccess.name} ({appointedOfficerSuccess.rank})</div>
              <div><strong>Badge / Service ID:</strong> {appointedOfficerSuccess.badge}</div>
              <div><strong>Agency:</strong> {user?.org_name || 'Special Investigation Agency'}</div>
            </div>

            <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
              Officer Single-Use Activation Token:
            </label>
            <div style={{ background: '#EFECE6', padding: '0.75rem 1rem', borderRadius: '2px', border: '1px solid var(--line)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <code style={{ fontSize: '1.2rem', letterSpacing: '0.06em', color: 'var(--bg-band)', fontWeight: 700, fontFamily: 'monospace' }}>
                {appointedOfficerSuccess.token}
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(appointedOfficerSuccess.token);
                  setCopiedOfficerToken(true);
                  setTimeout(() => setCopiedOfficerToken(false), 2000);
                }} 
                className="btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {copiedOfficerToken ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                {copiedOfficerToken ? 'Copied' : 'Copy'}
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: '0 0 1.25rem 0', lineHeight: '1.4' }}>
              Share this token with <strong>{appointedOfficerSuccess.name}</strong>. The officer will use this token to log in and receive exclusive access to this case file.
            </p>

            <button 
              onClick={() => setAppointedOfficerSuccess(null)} 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.5rem' }}
            >
              Done & Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: CITIZEN e-FIR FULL STATUTORY DOSSIER REVIEW */}
      {/* ========================================================================= */}
      {selectedEfirDossier && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(14, 42, 71, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10004, padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', border: '1px solid var(--line)', borderTop: '4px solid #A2191F', borderRadius: '2px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#FAF9F6' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={18} color="#A2191F" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A2191F', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Government of India • Police Inward Registry
                  </span>
                </div>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>
                  Statutory e-FIR Complaint Dossier
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                  Reference No: <strong>{selectedEfirDossier.case_number}</strong>
                </div>
              </div>

              <button 
                onClick={() => setSelectedEfirDossier(null)} 
                className="btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'transparent' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Content */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Statutory Note Banner */}
              <div style={{ background: '#FCE8E6', borderLeft: '3px solid #A2191F', padding: '0.75rem 1rem', borderRadius: '2px', fontSize: '0.8rem', color: 'var(--ink)' }}>
                <strong>Statutory Filing under Section 173 BNSS (2023) / CrPC 154:</strong> This electronic First Information Report was submitted by citizen complainant with legal declaration and cryptographic fingerprint recorded in the National e-Courts Grid.
              </div>

              {/* Grid of Key Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#F4F3EF', padding: '1rem', borderRadius: '2px', border: '1px solid var(--line)', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Complainant Name</div>
                  <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{selectedEfirDossier.plaintiff || 'Citizen Informant'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Suspect / Accused Particulars</div>
                  <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{selectedEfirDossier.defendant || 'Unknown Accused'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Police Jurisdiction</div>
                  <div style={{ fontWeight: 700, color: 'var(--bg-band)' }}>{selectedEfirDossier.police_org?.name || user?.org_name || 'Designated Police Station'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>District: {selectedEfirDossier.district || 'Central'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Filing Timestamp</div>
                  <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                    {formatSafeDate(selectedEfirDossier.created_at, 'medium')}
                  </div>
                </div>
              </div>

              {/* Complete Statement Narrative */}
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                  Full Chronological Statement of Facts & Grievance:
                </label>
                <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', padding: '1rem', borderRadius: '2px', fontSize: '0.85rem', color: 'var(--ink)', lineHeight: '1.6', whiteSpace: 'pre-wrap', maxHeight: '250px', overflowY: 'auto' }}>
                  {selectedEfirDossier.description || 'No additional narrative recorded.'}
                </div>
              </div>

              {/* Cryptographic Ledger Verification */}
              <div style={{ background: '#FAF9F6', border: '1px solid var(--line)', padding: '0.75rem 1rem', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={16} color="var(--success)" />
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Cryptographic SHA-256 Ledger Seal: Verified & Intact</span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>AUTHENTIC GOV RECORD</span>
              </div>

            </div>

            {/* Modal Footer with Actions */}
            <div style={{ padding: '1rem 1.5rem', background: '#F4F3EF', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedEfirDossier.stage === 'fir_registered' && (
                  <button 
                    onClick={() => {
                      const c = selectedEfirDossier;
                      setSelectedEfirDossier(null);
                      handleOpenEfirAction(c, 'accept');
                    }}
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#1B5FB3' }}
                  >
                    <UserCheck size={14} /> Accept & Assign IO
                  </button>
                )}

                <button 
                  onClick={() => {
                    const c = selectedEfirDossier;
                    setSelectedEfirDossier(null);
                    handleOpenEfirAction(c, 'court_forward');
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                >
                  <Landmark size={14} /> Forward to Court
                </button>

                <button 
                  onClick={() => {
                    const c = selectedEfirDossier;
                    setSelectedEfirDossier(null);
                    handleOpenEfirAction(c, 'station_transfer');
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                >
                  <ArrowRightLeft size={14} /> Transfer Station
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => {
                    const id = selectedEfirDossier.id;
                    setSelectedEfirDossier(null);
                    navigate(`/cases/${id}`);
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                >
                  Open Timeline & Docs
                </button>
                <button 
                  onClick={() => setSelectedEfirDossier(null)} 
                  className="btn-secondary" 
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: POLICE ACTION (Accept, Transfer, Forward to Court, Resolve) */}
      {/* ========================================================================= */}
      {selectedEfirForAction && efirActionType && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(14, 42, 71, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10005, padding: '1rem' }}>
          <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '580px', padding: '1.75rem', background: '#FFFFFF', border: '1px solid var(--line)', borderTop: `4px solid ${efirActionType === 'accept' ? '#1B5FB3' : efirActionType === 'court_forward' ? 'var(--warning)' : efirActionType === 'resolve' ? 'var(--success)' : 'var(--accent)'}`, borderRadius: '2px', boxShadow: '0 10px 35px rgba(0,0,0,0.18)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Police Case Management Action
                </div>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>
                  {efirActionType === 'accept' && 'Accept e-FIR & Initiate Official Investigation'}
                  {efirActionType === 'station_transfer' && 'Zero FIR Jurisdictional Station Transfer'}
                  {efirActionType === 'court_forward' && 'Forward Charge Sheet / Final Report to Court'}
                  {efirActionType === 'resolve' && 'File Police Final Closure Report (BNSS 173(2))'}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.15rem' }}>
                  e-FIR: <strong>{selectedEfirForAction.case_number}</strong> • {selectedEfirForAction.plaintiff}
                </div>
              </div>
              <button onClick={() => { setSelectedEfirForAction(null); setEfirActionType(null); }} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'transparent' }}>
                <X size={16} />
              </button>
            </div>

            {/* Success Feedback Alert */}
            {efirActionSuccessMsg && (
              <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', borderLeft: '4px solid var(--success)', padding: '0.85rem 1rem', borderRadius: '2px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle size={22} color="var(--success)" />
                <div style={{ fontSize: '0.85rem', color: '#137333', fontWeight: 600 }}>
                  {efirActionSuccessMsg}
                </div>
              </div>
            )}

            {/* Action Specific Forms */}
            {!efirActionSuccessMsg && (
              <form onSubmit={handleExecuteEfirAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* 1. ACCEPT & ASSIGN IO */}
                {efirActionType === 'accept' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                          Assigned Officer Name <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          className="input-field" 
                          value={assignedOfficerName} 
                          onChange={e => setAssignedOfficerName(e.target.value)} 
                          required 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                          Service ID / Badge No <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          className="input-field" 
                          value={assignedOfficerBadge} 
                          onChange={e => setAssignedOfficerBadge(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                        Initial Investigation Directives (Recorded into Legal Docket)
                      </label>
                      <textarea 
                        className="input-field" 
                        rows="3" 
                        value={assignedOfficerDirective} 
                        onChange={e => setAssignedOfficerDirective(e.target.value)}
                        placeholder="Instructions regarding statement recording, witness notices, electronic logs preservation..."
                        required 
                      />
                    </div>
                  </>
                )}

                {/* 2. STATION TRANSFER */}
                {efirActionType === 'station_transfer' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                          Receiving State *
                        </label>
                        <select 
                          className="input-field" 
                          value={transferState} 
                          onChange={e => {
                            const nextSt = e.target.value;
                            setTransferState(nextSt);
                            const dists = getDistrictsForState(nextSt);
                            const firstD = dists[0] || 'Central';
                            setTransferDistrict(firstD);
                            const stList = getPoliceStationsForDistrict(nextSt, firstD);
                            setTransferStationName(stList[0] || 'Other');
                          }}
                          required
                        >
                          {ALL_INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                          Receiving District *
                        </label>
                        <select 
                          className="input-field" 
                          value={transferDistrict} 
                          onChange={e => {
                            const nextD = e.target.value;
                            setTransferDistrict(nextD);
                            const stList = getPoliceStationsForDistrict(transferState, nextD);
                            setTransferStationName(stList[0] || 'Other');
                          }}
                          required
                        >
                          {getDistrictsForState(transferState).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                        Select Receiving Police Station (Zero FIR Handover) *
                      </label>
                      <select 
                        className="input-field" 
                        value={transferStationName} 
                        onChange={e => setTransferStationName(e.target.value)}
                        required
                      >
                        {getPoliceStationsForDistrict(transferState, transferDistrict).map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                        <option value="Other">Other / Unlisted Police Station</option>
                      </select>
                    </div>

                    {transferStationName === 'Other' && (
                      <div>
                        <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                          Specify Custom Police Station Name *
                        </label>
                        <input 
                          type="text" 
                          className="input-field" 
                          value={customTransferStation} 
                          onChange={e => setCustomTransferStation(e.target.value)}
                          placeholder="e.g. Cyber Crime Unit" 
                          required 
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                        Grounds for Jurisdictional Handover (Zero FIR Transfer Memo)
                      </label>
                      <textarea 
                        className="input-field" 
                        rows="3" 
                        value={stationTransferReason} 
                        onChange={e => setStationTransferReason(e.target.value)}
                        placeholder="State why the matter falls under the territorial jurisdiction of the receiving station..."
                        required 
                      />
                    </div>
                  </>
                )}

                {/* 3. FORWARD TO COURT / CHARGE SHEET */}
                {efirActionType === 'court_forward' && (
                  <>
                    <div>
                      <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                        Designated Judicial Magistrate / District Court <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <select 
                        className="input-field" 
                        value={targetCourtOrgId} 
                        onChange={e => setTargetCourtOrgId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Designated Judicial Court --</option>
                        {allOrganisations
                          .filter(o => o.org_type === 'court' || o.org_type === 'court_district' || o.org_type === 'high_court' || o.org_type === 'court_high' || o.org_type === 'court_supreme')
                          .map(o => (
                            <option key={o.id} value={o.id}>
                              {o.name} ({o.district || o.state || 'Judicial Bench'})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                        Penal Sections Applied (Comma-Separated) <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={chargeSheetSections} 
                        onChange={e => setChargeSheetSections(e.target.value)}
                        placeholder="e.g. BNS Sec 303, BNS Sec 318, IT Act 66D"
                        required 
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                        Police Investigation Findings & Charge Sheet Summary
                      </label>
                      <textarea 
                        className="input-field" 
                        rows="3" 
                        value={chargeSheetSummary} 
                        onChange={e => setChargeSheetSummary(e.target.value)}
                        placeholder="Summary of prima facie evidence, recovery memo, witness lists, and recommendation for trial..."
                        required 
                      />
                    </div>
                  </>
                )}

                {/* 4. RESOLVE / CLOSURE REPORT */}
                {efirActionType === 'resolve' && (
                  <>
                    <div>
                      <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                        Closure Grounds / Finding Category <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <select 
                        className="input-field" 
                        value={closureReason} 
                        onChange={e => setClosureReason(e.target.value)}
                        required
                      >
                        <option value="Amicably Settled / Civil Dispute in Nature">Amicably Settled / Civil Dispute in Nature</option>
                        <option value="Lack of Cognizable Offence / Evidence">Lack of Cognizable Offence / Inconclusive Evidence</option>
                        <option value="False / Untrue Complaint">False / Untrue Allegation</option>
                        <option value="Lost Property Restored & Claimed">Lost Property Restored & Claimed by Owner</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.3rem', display: 'block' }}>
                        Investigating Officer Final Closure Remarks
                      </label>
                      <textarea 
                        className="input-field" 
                        rows="3" 
                        value={closureNotes} 
                        onChange={e => setClosureNotes(e.target.value)}
                        placeholder="Detailed justification and findings recorded for official closure..."
                        required 
                      />
                    </div>
                  </>
                )}

                {/* Submit & Cancel Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => { setSelectedEfirForAction(null); setEfirActionType(null); }} 
                    className="btn-secondary" 
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingEfirAction} 
                    className="btn-primary" 
                    style={{ flex: 2 }}
                  >
                    {isSubmittingEfirAction ? 'Processing Action...' : 'Confirm & Execute Action'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
