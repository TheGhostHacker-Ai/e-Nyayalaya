import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Shield, Mail, Key, UserCheck, Loader, Building, X, Scale, AlertCircle, ShieldCheck } from 'lucide-react';
import { NATIONAL_AGENCIES } from '../constants/agencies';
import { 
  ALL_INDIAN_STATES, 
  getDistrictsForState, 
  getPoliceStationsForDistrict, 
  normalizeStationName 
} from '../constants/policeStations';
import '../gov-portal-theme.css';

const STATIC_AGENCY_ORGS = NATIONAL_AGENCIES.map(a => ({
  id: a.id,
  name: a.name,
  code: a.code,
  org_type: 'agency',
  district: a.jurisdiction.includes('State') ? 'State Wing' : 'National',
  state: 'National'
}));

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

export default function Auth({ onLogin, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'claim'
  
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [orgType, setOrgType] = useState('police_station');
  const [role, setRole] = useState('police_officer');
  
  // National Grid States & Police Station Directory
  const [state, setState] = useState('Uttar Pradesh');
  const [district, setDistrict] = useState('Lucknow');
  const [selectedPoliceStation, setSelectedPoliceStation] = useState('Hazratganj Police Station');
  const [customPoliceStation, setCustomPoliceStation] = useState('');
  
  // Registration specific fields
  const [fullName, setFullName] = useState('');
  const [badgeNo, setBadgeNo] = useState('');
  const [designation, setDesignation] = useState('');
  const [orgName, setOrgName] = useState('');
  
  // Lawyer / Agency Mode
  const [cadreType, setCadreType] = useState('standard'); // 'standard' | 'lawyer' | 'agency_officer'
  const [lawyerToken, setLawyerToken] = useState('');
  const [agencyToken, setAgencyToken] = useState('');
  
  const [orgId, setOrgId] = useState('');
  const [organisations, setOrganisations] = useState(STATIC_AGENCY_ORGS);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const { data } = await supabase.from('organisations').select('*');
        if (data && data.length > 0) {
          const dbAgencies = data.filter(o => o.org_type === 'agency');
          const mergedAgencies = STATIC_AGENCY_ORGS.map(a => {
            const dbMatch = dbAgencies.find(d => 
              (d.name && d.name.toLowerCase().includes(a.code.toLowerCase())) ||
              (d.code && d.code.toLowerCase() === a.code.toLowerCase()) ||
              (d.name && d.name.toLowerCase().includes(a.name.toLowerCase())) ||
              (a.name && a.name.toLowerCase().includes(d.name.toLowerCase()))
            );
            return {
              ...a,
              id: dbMatch ? dbMatch.id : a.id,
              db_org_id: dbMatch ? dbMatch.id : null
            };
          });
          const nonAgencies = data.filter(o => o.org_type !== 'agency');
          setOrganisations([...nonAgencies, ...mergedAgencies]);
        } else {
          setOrganisations(STATIC_AGENCY_ORGS);
        }
      } catch (e) {
        setOrganisations(STATIC_AGENCY_ORGS);
      }
    };
    fetchOrgs();
  }, []);

  const resolveAgencyAcronym = (org) => {
    if (!org) return '';
    const parenMatch = org.name?.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1]) return parenMatch[1].toUpperCase().replace(/[^A-Z0-9]/g, '');
    const natMatch = NATIONAL_AGENCIES.find(a => 
      a.id === org.id || 
      a.code === org.code || 
      a.name === org.name || 
      (org.name && org.name.toLowerCase().includes(a.acronym.toLowerCase())) ||
      (org.name && a.name.toLowerCase().includes(org.name.toLowerCase()))
    );
    if (natMatch && natMatch.acronym) return natMatch.acronym.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (org.code) return org.code.replace('-HQ', '').replace('-STATE', '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (org.name) return org.name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return '';
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || pin.length !== 6) {
      setError("Please enter a valid official email and a 6-digit OTP / access PIN.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const securePassword = pin + "aA1!Secure";

      // -------------------------------------------------------------
      // TAB: REGISTER CADRE
      // -------------------------------------------------------------
      if (activeTab === 'register') {
        
        if (cadreType === 'agency_officer') {
          if (!orgId) throw new Error("Please select an enforcement agency from the list.");
          if (!fullName.trim()) throw new Error("Please enter your Full Legal Name.");
          if (!badgeNo.trim()) throw new Error("Please enter your Official Service / Badge Number.");
          if (!designation.trim()) throw new Error("Please enter your Designation.");
          if (!agencyToken.trim()) throw new Error("Please enter your Officer Invite Token.");

          const cleanToken = agencyToken.trim();
          const tokenHash = await sha256Hex(cleanToken);

          const { data: invMatches } = await supabase
            .from('agency_officer_invites')
            .select('*')
            .in('status', ['pending', 'active'])
            .or(`token_hash.eq.${tokenHash},token_hash.eq.${cleanToken}`);

          let matchedInvite = (invMatches || []).find(inv => {
            const h = inv.token_hash || '';
            return h === tokenHash || h === cleanToken || h.toLowerCase() === cleanToken.toLowerCase();
          });

          if (!matchedInvite) {
            throw new Error("Invalid or Expired Officer Invite Token. Contact your Agency Administrator.");
          }

          let authResult = await supabase.auth.signUp({ email, password: securePassword });
          if (authResult.error) {
            if (authResult.error.message.includes("already registered")) {
              authResult = await supabase.auth.signInWithPassword({ email, password: securePassword });
              if (authResult.error) throw authResult.error;
            } else {
              throw authResult.error;
            }
          }

          let resolvedOrgId = orgId;
          const { data: dbOrgs } = await supabase.from('organisations').select('id, name, org_type');
          const selectedOrg = organisations.find(o => o.id === orgId);
          if (selectedOrg && dbOrgs) {
            const match = dbOrgs.find(d => d.name === selectedOrg.name || d.name?.includes(selectedOrg.name) || (selectedOrg.code && d.code === selectedOrg.code));
            if (match) resolvedOrgId = match.id;
          }

          await supabase.from('profiles').upsert([{
            id: authResult.data.user.id,
            full_name: fullName.trim(),
            role: 'agency_officer',
            designation: designation.trim() || 'Special Investigating Officer',
            badge_no: badgeNo.trim(),
            org_id: resolvedOrgId,
            email: email,
            status: 'approved'
          }]);

          if (matchedInvite.case_id) {
            await supabase.from('case_participants').upsert([{
              case_id: matchedInvite.case_id,
              user_id: authResult.data.user.id,
              role_in_case: 'investigating_officer',
              revoked_at: null
            }]);
          }

          await supabase.from('agency_officer_invites').update({ status: 'claimed' }).eq('id', matchedInvite.id);

          const agencyOfficerProfile = {
            id: authResult.data.user.id,
            email: email,
            role: 'agency_officer',
            full_name: fullName.trim(),
            designation: designation.trim(),
            badge_no: badgeNo.trim(),
            org_id: resolvedOrgId,
            org_name: selectedOrg ? selectedOrg.name : 'Special Agency Wing',
            org_type: 'agency',
            state: 'National',
            district: 'Agency Cadre'
          };

          try {
            localStorage.setItem('enyayalaya_active_officer', JSON.stringify({ officerName: fullName.trim(), agencyName: agencyOfficerProfile.org_name, badgeNo: badgeNo.trim(), assignedCaseId: matchedInvite.case_id || null }));
            localStorage.removeItem('enyayalaya_active_agency');
          } catch (e) {}

          onLogin(agencyOfficerProfile);
          if (matchedInvite.case_id) navigate(`/cases/${matchedInvite.case_id}`);
          else navigate('/');
          return;
        }

        let assignedOrgId = orgId;
        if (cadreType === 'standard') {
          if (orgType === 'supreme_court') {
            const cleanOrgName = 'Supreme Court of India';
            const { data: orgsData } = await supabase
              .from('organisations')
              .select('id, name, district, state, org_type')
              .or('org_type.eq.supreme_court,name.ilike.%Supreme Court%');

            let scOrg = orgsData && orgsData[0];
            if (scOrg) {
              assignedOrgId = scOrg.id;
            } else {
              const { data: newScOrg, error: scErr } = await supabase
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
              assignedOrgId = newScOrg.id;
            }
          } else {
            const isPolice = orgType === 'police_station';
            const cleanOrgName = isPolice 
              ? (selectedPoliceStation === 'Other' ? normalizeStationName(customPoliceStation) : normalizeStationName(selectedPoliceStation))
              : orgName.trim();

            if (!cleanOrgName) {
              throw new Error("Please select or enter your official Station / Court Unit Name.");
            }

            // Check if organisation already exists in database
            const { data: orgsData } = await supabase
              .from('organisations')
              .select('id, name, district, state, org_type');

            let existingOrg = null;
            if (orgsData && orgsData.length > 0) {
              existingOrg = orgsData.find(o => 
                (o.name && o.name.toLowerCase().trim() === cleanOrgName.toLowerCase().trim()) ||
                (o.name && o.name.toLowerCase().includes(cleanOrgName.toLowerCase())) ||
                (cleanOrgName.toLowerCase().includes(o.name.toLowerCase()))
              );
            }

            if (existingOrg) {
              assignedOrgId = existingOrg.id;
            } else {
              const prefix = isPolice ? 'PS' : (orgType === 'high_court' ? 'HC' : 'CRT');
              const distCode = (district || 'LKO').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
              const nameCode = cleanOrgName.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 12);
              const generatedCode = `${prefix}_${distCode}_${nameCode}_${Math.floor(100 + Math.random() * 900)}`;

              const { data: newOrg, error: orgError } = await supabase
                .from('organisations')
                .insert([{ 
                  name: cleanOrgName, 
                  code: generatedCode,
                  org_type: orgType, 
                  district: district || 'Lucknow', 
                  state: state || 'Uttar Pradesh' 
                }])
                .select()
                .single();
              if (orgError) throw orgError;
              assignedOrgId = newOrg.id;
            }
          }
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: securePassword,
          options: {
            data: {
              full_name: fullName,
              role: cadreType === 'lawyer' ? 'lawyer' : role,
              badge_no: badgeNo,
              designation: cadreType === 'lawyer' ? designation : designation,
              org_id: cadreType === 'lawyer' ? null : assignedOrgId
            }
          }
        });

        if (authError) throw authError;

        if (authData?.user) {
          await supabase.from('profiles').upsert([{
            id: authData.user.id,
            full_name: fullName,
            role: cadreType === 'lawyer' ? 'lawyer' : role,
            badge_no: badgeNo,
            designation: designation,
            org_id: cadreType === 'lawyer' ? null : assignedOrgId,
            email: email,
            status: 'approved'
          }]);

          if (cadreType === 'lawyer' && lawyerToken) {
            const { data: caseCode } = await supabase.from('case_access_codes').select('case_id, role').eq('code', lawyerToken).maybeSingle();
            if (caseCode) {
              await supabase.from('case_participants').insert([{
                case_id: caseCode.case_id,
                user_id: authData.user.id,
                role_in_case: caseCode.role
              }]);
            }
          }

          const { data: finalProfile } = await supabase
            .from('profiles')
            .select(`*, organisations (name, org_type, state, district)`)
            .eq('id', authData.user.id)
            .single();

          onLogin({
            ...finalProfile,
            org_name: finalProfile.organisations ? finalProfile.organisations.name : (cadreType === 'lawyer' ? 'Independent Legal Bar' : 'State Judiciary'),
            org_type: finalProfile.organisations ? finalProfile.organisations.org_type : (cadreType === 'lawyer' ? 'legal_bar' : 'court'),
            state: finalProfile.organisations ? finalProfile.organisations.state : state,
            district: finalProfile.organisations ? finalProfile.organisations.district : district
          });
          return;
        }

      // -------------------------------------------------------------
      // TAB: AGENCY JURISDICTION CLAIM
      // -------------------------------------------------------------
      } else if (activeTab === 'claim') {
        if (!orgId) throw new Error("Please select the receiving specialized agency.");
        if (!agencyToken.trim()) throw new Error("Please enter the Master Agency Transfer Token.");

        const cleanToken = agencyToken.trim();
        const tokenHash = await sha256Hex(cleanToken);
        const selectedOrg = organisations.find(o => o.id === orgId) || { name: 'Special Investigation Agency' };
        const selectedAgencyAcronym = resolveAgencyAcronym(selectedOrg);

        let resolvedOrgId = orgId;
        const { data: dbOrgs } = await supabase.from('organisations').select('id, name, org_type, code');
        if (dbOrgs) {
          const match = dbOrgs.find(d => 
            d.id === orgId || 
            (d.name && d.name.toLowerCase() === selectedOrg.name.toLowerCase()) || 
            (selectedOrg.code && d.code && d.code.toLowerCase() === selectedOrg.code.toLowerCase()) ||
            (selectedAgencyAcronym && d.name && d.name.toUpperCase().includes(selectedAgencyAcronym))
          );
          if (match) resolvedOrgId = match.id;
        }

        let claimedCaseId = null;
        let matchedTransferId = null;

        const { data: transfers } = await supabase.from('case_agency_transfers').select('*').in('status', ['pending', 'claimed']);
        const matchedTransfer = (transfers || []).find(t => 
          t.token_hash === tokenHash || 
          t.token_hash === cleanToken || 
          (t.token_hash && t.token_hash.toLowerCase() === tokenHash.toLowerCase())
        );

        if (matchedTransfer) {
          claimedCaseId = matchedTransfer.case_id;
          matchedTransferId = matchedTransfer.id;
        } else {
          const { data: codeData } = await supabase.from('case_access_codes').select('*').eq('code', cleanToken).maybeSingle();
          if (codeData) claimedCaseId = codeData.case_id;
        }

        if (!claimedCaseId) {
          throw new Error(`Invalid or Expired Transfer Token. The entered token does not match any pending transfer for ${selectedOrg.name}.`);
        }

        let authResult = await supabase.auth.signInWithPassword({ email, password: securePassword });
        if (authResult.error) {
           authResult = await supabase.auth.signUp({ email, password: securePassword });
           if (authResult.error) throw authResult.error;
        }

        const badgeNumber = `ADM-${selectedAgencyAcronym || 'AGENCY'}-${authResult.data.user.id.slice(0, 4).toUpperCase()}`;
        const agencyLeadName = `${selectedOrg.name} Lead`;
        
        await supabase.from('profiles').upsert([{
           id: authResult.data.user.id,
           full_name: agencyLeadName,
           role: 'agency_admin',
           designation: 'Agency Administrator',
           badge_no: badgeNumber,
           org_id: resolvedOrgId,
           email: email,
           status: 'approved'
        }]);

        await supabase.from('case_participants').upsert([{
          case_id: claimedCaseId,
          user_id: authResult.data.user.id,
          role_in_case: 'agency_lead',
          revoked_at: null
        }]);

        if (matchedTransferId) {
          await supabase.from('case_agency_transfers').update({ 
            status: 'claimed', 
            agency_org_id: resolvedOrgId,
            claimed_by: authResult.data.user.id, 
            claimed_at: new Date().toISOString() 
          }).eq('id', matchedTransferId);
        }

        const enhancedAgencyProfile = {
          id: authResult.data.user.id,
          email: email,
          role: 'agency_admin',
          full_name: agencyLeadName,
          designation: 'Agency Administrator',
          badge_no: badgeNumber,
          org_id: resolvedOrgId,
          org_name: selectedOrg.name,
          org_type: 'agency',
          state: selectedOrg.state || 'National',
          district: selectedOrg.district || 'Special Investigation Wing'
        };

        try {
          localStorage.setItem('enyayalaya_active_agency', JSON.stringify(enhancedAgencyProfile));
          localStorage.removeItem('enyayalaya_active_officer');
        } catch (e) {}

        onLogin(enhancedAgencyProfile);
        navigate(`/cases/${claimedCaseId}`);
        return;

      // -------------------------------------------------------------
      // TAB: STANDARD OFFICIAL LOGIN
      // -------------------------------------------------------------
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password: securePassword
        });

        if (authError) throw authError;

        const { data: profile } = await supabase
          .from('profiles')
          .select(`*, organisations (name, org_type, state, district)`)
          .eq('id', authData.user.id)
          .single();

        if (profile?.role === 'agency_admin') {
          const agencyName = profile.organisations ? profile.organisations.name : 'Special Investigation Agency';
          try {
            localStorage.setItem('enyayalaya_active_agency', JSON.stringify({ ...profile, org_name: agencyName, org_type: 'agency' }));
            localStorage.removeItem('enyayalaya_active_officer');
          } catch (e) {}
        } else if (profile?.role === 'agency_officer') {
          const agencyName = profile.organisations ? profile.organisations.name : 'Special Agency Wing';
          try {
            localStorage.setItem('enyayalaya_active_officer', JSON.stringify({ officerName: profile.full_name, agencyName: agencyName, badgeNo: profile.badge_no }));
            localStorage.removeItem('enyayalaya_active_agency');
          } catch (e) {}
        } else {
          try {
            localStorage.removeItem('enyayalaya_active_agency');
            localStorage.removeItem('enyayalaya_active_officer');
          } catch (e) {}
        }

        onLogin({
          ...profile,
          org_name: profile.organisations ? profile.organisations.name : (profile.role === 'lawyer' ? 'Bar Council' : 'State Department'),
          org_type: profile.organisations ? profile.organisations.org_type : (profile.role === 'lawyer' ? 'legal_bar' : 'court'),
          state: profile.organisations ? profile.organisations.state : 'National',
          district: profile.organisations ? profile.organisations.district : 'Central'
        });
      }

    } catch (err) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gov-modal-card">
      <div className="gov-modal-top-bar" />
      
      {/* Header */}
      <div className="gov-modal-header">
        {onClose && (
          <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }} aria-label="Close Login Modal">
            <X size={18} />
          </button>
        )}
        <div className="gov-modal-badge">
          <ShieldCheck size={22} color="var(--accent)" />
        </div>
        <h2 style={{ fontSize: '1.45rem', marginBottom: '0.2rem' }}>e-Nyayalaya</h2>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
          National Judicial & Law Enforcement Record Grid · Official Access
        </div>
      </div>

      <div className="gov-modal-body">
        
        {/* Three-Way Segmented Tab Control */}
        <div className="gov-tab-segment" role="tablist">
          <button 
            type="button"
            className={`gov-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setError(null); }}
            role="tab"
            aria-selected={activeTab === 'login'}
          >
            Official Login
          </button>
          <button 
            type="button"
            className={`gov-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setError(null); }}
            role="tab"
            aria-selected={activeTab === 'register'}
          >
            Register Cadre
          </button>
          <button 
            type="button"
            className={`gov-tab-btn ${activeTab === 'claim' ? 'active' : ''}`}
            onClick={() => { setActiveTab('claim'); setError(null); }}
            role="tab"
            aria-selected={activeTab === 'claim'}
          >
            Agency Claim
          </button>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleAuth}>
          
          {/* TAB 1: REGISTER CADRE ADDITIONAL FIELDS */}
          {activeTab === 'register' && (
            <>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setCadreType('standard')}
                  className="gov-btn-flat-secondary"
                  style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.78rem', background: cadreType === 'standard' ? 'var(--bg-band)' : '#FFFFFF', color: cadreType === 'standard' ? '#FFFFFF' : 'var(--ink)' }}
                >
                  Police / Court
                </button>
                <button
                  type="button"
                  onClick={() => setCadreType('lawyer')}
                  className="gov-btn-flat-secondary"
                  style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.78rem', background: cadreType === 'lawyer' ? 'var(--bg-band)' : '#FFFFFF', color: cadreType === 'lawyer' ? '#FFFFFF' : 'var(--ink)' }}
                >
                  Legal Counsel
                </button>
                <button
                  type="button"
                  onClick={() => setCadreType('agency_officer')}
                  className="gov-btn-flat-secondary"
                  style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.78rem', background: cadreType === 'agency_officer' ? 'var(--bg-band)' : '#FFFFFF', color: cadreType === 'agency_officer' ? '#FFFFFF' : 'var(--ink)' }}
                >
                  Agency IO
                </button>
              </div>

              <div className="gov-form-group">
                <label className="gov-form-label">Full Name *</label>
                <input type="text" className="gov-input" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full legal cadre name" />
              </div>

              {cadreType === 'standard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem', border: '1px solid var(--line)', borderRadius: '2px' }}>
                  <div>
                    <label className="gov-form-label">Organization Category</label>
                    <select className="gov-input" value={orgType} onChange={e => {
                      const selectedVal = e.target.value;
                      setOrgType(selectedVal);
                      if (selectedVal === 'police_station') {
                        setRole('police_officer');
                      } else if (selectedVal === 'supreme_court') {
                        setRole('judge');
                        setState('National');
                        setDistrict('New Delhi');
                        setOrgName('Supreme Court of India');
                        setDesignation("Hon'ble Supreme Court Judge");
                        setBadgeNo('SC-JDG-001');
                      } else {
                        setRole('judge');
                        if (selectedVal === 'high_court') setDesignation("Hon'ble High Court Judge");
                        else setDesignation("Judicial Magistrate / Sessions Judge");
                      }
                    }}>
                      <option value="police_station">Police Station (Territorial / Cyber)</option>
                      <option value="court">District & Sessions Court</option>
                      <option value="high_court">High Court Bench</option>
                      <option value="supreme_court">Supreme Court of India (Apex National Registry)</option>
                    </select>
                  </div>

                  {orgType === 'supreme_court' ? (
                    <div style={{ background: '#FAF5E8', border: '1px solid var(--accent)', padding: '0.65rem 0.85rem', borderRadius: '2px', fontSize: '0.8rem', color: '#1B2230' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        ⚖️ Apex Judicial Jurisdiction
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                        National Jurisdiction • Tilak Marg, New Delhi • Apex Appellate Registry under Article 141 of the Constitution
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <label className="gov-form-label">State / UT</label>
                          <select className="gov-input" value={state} onChange={e => { 
                            const nextS = e.target.value;
                            setState(nextS); 
                            const dists = getDistrictsForState(nextS);
                            const firstD = dists[0] || 'Central';
                            setDistrict(firstD);
                            const thanas = getPoliceStationsForDistrict(nextS, firstD);
                            setSelectedPoliceStation(thanas[0] || 'Other');
                          }}>
                            {ALL_INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="gov-form-label">District</label>
                          <select className="gov-input" value={district} onChange={e => {
                            const nextD = e.target.value;
                            setDistrict(nextD);
                            const thanas = getPoliceStationsForDistrict(state, nextD);
                            setSelectedPoliceStation(thanas[0] || 'Other');
                          }}>
                            {getDistrictsForState(state).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>

                      {orgType === 'police_station' ? (
                        <>
                          <div>
                            <label className="gov-form-label">Territorial Police Station *</label>
                            <select 
                              className="gov-input" 
                              value={selectedPoliceStation} 
                              onChange={e => setSelectedPoliceStation(e.target.value)}
                              required
                            >
                              {getPoliceStationsForDistrict(state, district).map(ps => (
                                <option key={ps} value={ps}>{ps}</option>
                              ))}
                              <option value="Other">Other / Unlisted Police Station</option>
                            </select>
                          </div>

                          {selectedPoliceStation === 'Other' && (
                            <div>
                              <label className="gov-form-label">Specify Police Station Name *</label>
                              <input 
                                type="text" 
                                className="gov-input" 
                                required 
                                value={customPoliceStation} 
                                onChange={e => setCustomPoliceStation(e.target.value)} 
                                placeholder="e.g. Cyber Crime Thana" 
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <label className="gov-form-label">Court Bench / Judicial Unit Name *</label>
                          <input 
                            type="text" 
                            className="gov-input" 
                            required 
                            value={orgName} 
                            onChange={e => setOrgName(e.target.value)} 
                            placeholder={orgType === 'high_court' ? "e.g. Allahabad High Court (Lucknow Bench)" : "e.g. Chief Judicial Magistrate Court, Lucknow"} 
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label className="gov-form-label">Cadre Role</label>
                    <select className="gov-input" value={role} onChange={e => setRole(e.target.value)}>
                      {orgType === 'police_station' ? (
                        <>
                          <option value="police_officer">Station Officer</option>
                          <option value="investigating_officer">Investigating Officer (IO)</option>
                        </>
                      ) : orgType === 'supreme_court' ? (
                        <>
                          <option value="judge">Hon'ble Supreme Court Judge / CJI</option>
                          <option value="court_clerk">Registrar General / Court Master</option>
                        </>
                      ) : (
                        <>
                          <option value="judge">Judicial Magistrate / Judge</option>
                          <option value="court_clerk">Court Registrar / Clerk</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {cadreType === 'agency_officer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem', border: '1px solid var(--line)', borderRadius: '2px' }}>
                  <div>
                    <label className="gov-form-label">Designated Enforcement Agency</label>
                    <select className="gov-input" value={orgId} onChange={e => setOrgId(e.target.value)} required>
                      <option value="">Select Agency (CBI / CID / NIA)...</option>
                      {organisations.filter(o => o.org_type === 'agency').map(o => (
                        <option key={o.id} value={o.id}>{o.name} ({o.district || 'National'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="gov-form-label">Officer Invite Token *</label>
                    <input type="text" className="gov-input" required value={agencyToken} onChange={e => setAgencyToken(e.target.value)} placeholder="Single-use invite token" />
                  </div>
                </div>
              )}

              {cadreType === 'lawyer' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="gov-form-label">Case Access Token (Optional)</label>
                  <input type="text" className="gov-input" value={lawyerToken} onChange={e => setLawyerToken(e.target.value)} placeholder="e.g. PROS-1234-ABCD" />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="gov-form-group">
                  <label className="gov-form-label">Service Badge / Bar No. *</label>
                  <input type="text" className="gov-input" required value={badgeNo} onChange={e => setBadgeNo(e.target.value)} placeholder="Service ID number" />
                </div>
                <div className="gov-form-group">
                  <label className="gov-form-label">Rank / Designation</label>
                  <input type="text" className="gov-input" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Inspector / Magistrate" />
                </div>
              </div>
            </>
          )}

          {/* TAB 2: AGENCY JURISDICTION CLAIM FIELDS */}
          {activeTab === 'claim' && (
            <div style={{ marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem', border: '1px solid var(--line)', borderRadius: '2px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.5rem' }}>
                Specialized Agency Case File Claim (BNSS Sec. 173/530)
              </div>
              <div className="gov-form-group">
                <label className="gov-form-label">Select Agency *</label>
                <select className="gov-input" value={orgId} onChange={e => setOrgId(e.target.value)} required>
                  <option value="">Select Designated Agency...</option>
                  {organisations.filter(o => o.org_type === 'agency').map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.district || 'National'})</option>
                  ))}
                </select>
              </div>
              <div className="gov-form-group" style={{ marginBottom: 0 }}>
                <label className="gov-form-label">Master Court Transfer Token *</label>
                <input type="text" className="gov-input" required value={agencyToken} onChange={e => setAgencyToken(e.target.value)} placeholder="e.g. AGENCY-CID-1234" />
              </div>
            </div>
          )}

          {/* COMMON FIELDS: EMAIL & OTP/PIN */}
          <div className="gov-form-group">
            <label className="gov-form-label">Official Registered Email Address *</label>
            <div className="gov-input-wrapper">
              <input 
                type="email" 
                className="gov-input" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="officer@nic.in / user@domain.gov.in" 
              />
            </div>
          </div>

          <div className="gov-form-group">
            <label className="gov-form-label">
              {activeTab === 'register' ? 'Set 6-Digit Access Security Credential *' : 'One-Time Password (OTP) — sent to your registered email/phone *'}
            </label>
            <div className="gov-input-wrapper">
              <input 
                type="password" 
                maxLength="6" 
                className="gov-input" 
                required 
                style={{ letterSpacing: '0.4em', fontFamily: 'monospace' }}
                value={pin} 
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))} 
                placeholder="------" 
              />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', marginTop: '0.25rem' }}>
              6-digit secure authentication code
            </div>
          </div>

          {error && (
            <div style={{ background: '#FDF2F2', border: '1px solid #F87171', color: '#991B1B', padding: '0.6rem', borderRadius: '2px', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            className="gov-btn-maroon" 
            style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', marginTop: '0.5rem' }}
            disabled={loading || pin.length !== 6}
          >
            {loading ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              activeTab === 'register' ? 'Register Official Credentials' : (activeTab === 'claim' ? 'Verify & Claim Jurisdiction' : 'Verify & Access Portal')
            )}
          </button>
        </form>

      </div>

      <div className="gov-modal-footer-strip">
        Department of Justice · Ministry of Home Affairs · National Crime Records Bureau
      </div>
    </div>
  );
}
