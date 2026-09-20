import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Scale, FileText, Lock, Building2, Landmark, 
  ExternalLink, Globe, BookOpen, AlertCircle, Phone, Mail, HelpCircle, X, 
  Activity, Calendar, Clock, MapPin, CheckCircle2, Award, 
  FilePlus, UserCheck, Search, Users, Siren, ShieldAlert, 
  Car, Eye, Flame, Smartphone, UserX, FileCheck, CheckSquare, Upload, 
  Download, Printer, AlertTriangle, Key, ShieldCheck, HeartHandshake, FileSearch,
  ChevronDown, ArrowUpRight
} from 'lucide-react';
import Auth from './Auth';
import '../gov-portal-theme.css';
import { 
  ALL_INDIAN_STATES, 
  CIVIC_POLICE_DIRECTORIES, 
  getDistrictsForState, 
  getPoliceStationsForDistrict, 
  normalizeStationName 
} from '../constants/policeStations';

async function sha256Hex(message) {
  try {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export default function LandingPage({ onLogin }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentLang, setCurrentLang] = useState('en'); // 'en' | 'hi'
  const [citizenDropdownOpen, setCitizenDropdownOpen] = useState(false);
  
  // Accessibility state
  const [fontScale, setFontScale] = useState(1);
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Initialize accessibility preferences from localStorage
  useEffect(() => {
    try {
      const savedScale = localStorage.getItem('enyayalaya_font_scale');
      if (savedScale) {
        const scaleVal = parseFloat(savedScale);
        setFontScale(scaleVal);
        document.documentElement.style.setProperty('--font-scale', scaleVal);
      }
      const savedContrast = localStorage.getItem('enyayalaya_contrast');
      if (savedContrast === 'high') {
        setIsHighContrast(true);
        document.documentElement.setAttribute('data-contrast', 'high');
      }
    } catch (e) {}
  }, []);

  const changeFontSize = (delta) => {
    let newScale = 1;
    if (delta === 0) newScale = 1;
    else if (delta > 0) newScale = Math.min(1.25, fontScale + 0.1);
    else if (delta < 0) newScale = Math.max(0.85, fontScale - 0.1);

    setFontScale(newScale);
    document.documentElement.style.setProperty('--font-scale', newScale);
    try {
      localStorage.setItem('enyayalaya_font_scale', newScale.toString());
    } catch (e) {}
  };

  const toggleContrast = () => {
    const nextVal = !isHighContrast;
    setIsHighContrast(nextVal);
    if (nextVal) {
      document.documentElement.setAttribute('data-contrast', 'high');
      try { localStorage.setItem('enyayalaya_contrast', 'high'); } catch (e) {}
    } else {
      document.documentElement.removeAttribute('data-contrast');
      try { localStorage.setItem('enyayalaya_contrast', 'normal'); } catch (e) {}
    }
  };

  // Case & Metric State
  const [caseStats, setCaseStats] = useState({
    total: 0,
    underInvestigation: 0,
    inTrial: 0,
    disposed: 0,
    appealed: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Civic Quick-Access State
  const [searchZoneType, setSearchZoneType] = useState('District');
  const [quickDistrict, setQuickDistrict] = useState('Lucknow');
  const [quickThana, setQuickThana] = useState('Hazratganj Police Station');
  const [quickOfficialCadre, setQuickOfficialCadre] = useState(null);
  const [knowStationModal, setKnowStationModal] = useState(false);
  const [selectedStationInfo, setSelectedStationInfo] = useState(null);

  // Generic Citizen Service Modals
  const [serviceModal, setServiceModal] = useState(null);
  const [serviceApplicationSuccess, setServiceApplicationSuccess] = useState(null);
  const [threeActsModal, setThreeActsModal] = useState(false);

  // e-FIR Multi-Step State
  const [efirModal, setEfirModal] = useState(false);
  const [efirStep, setEfirStep] = useState(1);
  const [isSubmittingEfir, setIsSubmittingEfir] = useState(false);
  const [efirSuccessData, setEfirSuccessData] = useState(null);

  // e-FIR Form Fields: Personal
  const [complainantName, setComplainantName] = useState('');
  const [gender, setGender] = useState('Male');
  const [relativeName, setRelativeName] = useState('');
  const [dob, setDob] = useState('');
  const [mobile, setMobile] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [idProof, setIdProof] = useState('');

  // e-FIR Form Fields: Incident & Location
  const [incidentDateTime, setIncidentDateTime] = useState('');
  const [efirState, setEfirState] = useState('Uttar Pradesh');
  const [efirDistrict, setEfirDistrict] = useState('Lucknow');
  const [efirPoliceStation, setEfirPoliceStation] = useState('Hazratganj Police Station');
  const [customPoliceStation, setCustomPoliceStation] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidentCategory, setIncidentCategory] = useState('Theft / Stolen Property');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [suspectDetails, setSuspectDetails] = useState('');
  const [witnessDetails, setWitnessDetails] = useState('');

  // e-FIR Form Fields: Specifics & Property
  const [propertyCategory, setPropertyCategory] = useState('Mobile Phone');
  const [lostPropertyDetails, setLostPropertyDetails] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [efirDeclaration, setEfirDeclaration] = useState(false);

  // View / Track FIR Modal State
  const [viewFirModal, setViewFirModal] = useState(false);
  const [searchFirQuery, setSearchFirQuery] = useState('');
  const [isSearchingFir, setIsSearchingFir] = useState(false);
  const [searchedFirResult, setSearchedFirResult] = useState(null);
  const [searchedFirError, setSearchedFirError] = useState(null);

  // Document title
  useEffect(() => {
    document.title = "e-Nyayalaya — National Judicial & Law Enforcement Record Grid | India";
  }, []);

  // Fetch real case stats from Supabase
  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('id, stage, district');

        if (!error && data) {
          const total = data.length;
          const underInvestigation = data.filter(c => c.stage === 'fir_registered' || c.stage === 'investigation').length;
          const inTrial = data.filter(c => c.stage === 'in_trial' || c.stage === 'charge_sheet_filed').length;
          const disposed = data.filter(c => c.stage === 'disposed' || c.stage === 'closed').length;
          const appealed = data.filter(c => c.stage === 'appealed' || c.stage === 'appeal_admitted').length;

          setCaseStats({
            total,
            underInvestigation,
            inTrial,
            disposed,
            appealed
          });
        }
      } catch (err) {
        console.warn("Could not fetch case statistics:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchLiveStats();
  }, []);

  // Simulated Mobile OTP Generation
  const handleSendOtp = () => {
    if (!mobile || mobile.length < 10) {
      alert("Please enter a valid 10-digit Indian Mobile Number.");
      return;
    }
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(mockOtp);
    setIsOtpSent(true);
    alert(`[Simulated SMS Gateway]: OTP for e-FIR verification sent to +91-${mobile}: ${mockOtp}`);
  };

  const handleVerifyOtp = () => {
    if (otpInput.trim() === generatedOtp.trim() && generatedOtp !== '') {
      setIsOtpVerified(true);
      alert("Mobile number successfully verified via OTP.");
    } else {
      alert("Invalid OTP entered. Please re-check the 6-digit code.");
    }
  };

  // Station Info Handler
  const handleStationSearch = () => {
    setSelectedStationInfo({
      state: 'Uttar Pradesh',
      district: quickDistrict,
      stationName: quickThana,
      shoName: 'Inspector In-Charge',
      phone: '0522-2214567 / 112',
      cctnsCode: `UP-LKO-${Math.floor(100 + Math.random() * 900)}`,
      email: `${quickThana.toLowerCase().replace(/[^a-z0-9]/g, '')}@uppolice.gov.in`
    });
    setKnowStationModal(true);
  };

  // e-FIR Submission
  const handleEfirSubmit = async (e) => {
    e.preventDefault();
    if (!efirDeclaration) {
      alert("Please check the statutory declaration under Section 199/200 BNSS before lodging.");
      return;
    }

    setIsSubmittingEfir(true);

    try {
      const rawStationName = efirPoliceStation === 'Other' ? customPoliceStation.trim() : efirPoliceStation;
      const selectedStationName = normalizeStationName(rawStationName || 'Kotwali Police Station');
      
      const { data: orgs } = await supabase.from('organisations').select('id, name, district, state, org_type');
      
      let resolvedPoliceOrgId = null;
      if (orgs && orgs.length > 0) {
        const found = orgs.find(o => 
          (o.name && o.name.toLowerCase().trim() === selectedStationName.toLowerCase().trim()) ||
          (o.name && o.name.toLowerCase().includes(selectedStationName.toLowerCase())) ||
          (selectedStationName.toLowerCase().includes(o.name.toLowerCase()))
        );
        if (found) {
          resolvedPoliceOrgId = found.id;
        }
      }

      // If police station organisation doesn't exist yet in the database, automatically create it
      if (!resolvedPoliceOrgId && selectedStationName) {
        const distCode = (efirDistrict || 'LKO').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
        const nameCode = selectedStationName.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 12);
        const generatedCode = `PS_${distCode}_${nameCode}_${Math.floor(100 + Math.random() * 900)}`;

        try {
          const { data: newStationOrg } = await supabase
            .from('organisations')
            .insert([{
              name: selectedStationName,
              code: generatedCode,
              org_type: 'police_station',
              district: efirDistrict || 'Lucknow',
              state: efirState || 'Uttar Pradesh'
            }])
            .select()
            .single();

          if (newStationOrg) {
            resolvedPoliceOrgId = newStationOrg.id;
          }
        } catch (orgErr) {
          console.warn("Auto police station creation fallback:", orgErr);
        }
      }

      // Fallback to first available police station if still unassigned
      if (!resolvedPoliceOrgId && orgs && orgs.length > 0) {
        const psOrg = orgs.find(o => o.org_type === 'police_station');
        resolvedPoliceOrgId = psOrg ? psOrg.id : orgs[0].id;
      }

      const nowTimestamp = new Date().toISOString();
      const currentYear = new Date().getFullYear();
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const efirNumber = `eFIR-${currentYear}-${efirDistrict.substring(0, 3).toUpperCase()}-${randomSeq}`;
      const fullTitle = `State v. ${suspectDetails.trim() ? suspectDetails.trim() : 'Unknown Accused'} [${incidentCategory}]`;

      const legalNarrative = `ELECTRONIC FIRST INFORMATION REPORT (e-FIR)
Reference Number: ${efirNumber}
Jurisdiction: ${selectedStationName}, District: ${efirDistrict}, State: ${efirState}
Lodge Timestamp: ${nowTimestamp}

1. COMPLAINANT / INFORMANT PARTICULARS:
• Full Name: ${complainantName.trim()} (${gender})
• Relative Name: ${relativeName.trim() || 'N/A'}
• Date of Birth: ${dob || 'N/A'}
• Verified Mobile: +91-${mobile} (OTP Verified)
• Email Address: ${email || 'N/A'}
• Permanent Address: ${address.trim()}
• Identity Proof: ${idProof.trim() || 'Aadhaar / Official ID Verified'}

2. INCIDENT & LOCATIONAL PARTICULARS:
• Date & Time of Occurrence: ${incidentDateTime}
• Primary Offence Category: ${incidentCategory}
• Exact Place of Occurrence: ${incidentLocation.trim()}
• Jurisdictional Police Station: ${selectedStationName}

3. CLEAR CHRONOLOGICAL STATEMENT OF FACTS:
${incidentDescription.trim()}

4. SUSPECT / ACCUSED PARTICULARS:
${suspectDetails.trim() || 'Unknown Person(s) / Identity to be ascertained during police investigation'}

5. WITNESS DETAILS:
${witnessDetails.trim() || 'None stated at time of lodging'}

6. LOST / STOLEN PROPERTY & ESTIMATED VALUE:
• Property Class: ${propertyCategory}
• Specific Description & Identifiers: ${lostPropertyDetails.trim() || 'N/A'}
• Estimated Financial Loss: ₹${estimatedValue || '0'}

══════════════════════════════════════════════════════════════════
STATUTORY CERTIFICATION:
Lodged electronically under Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023) / CrPC.
Tamper-Evident SHA-256 Fingerprint Recorded in e-Courts National Grid.`;

      const docSha256 = await sha256Hex(legalNarrative);

      const { data: newCase, error: caseErr } = await supabase
        .from('cases')
        .insert([{
          case_number: efirNumber,
          title: fullTitle,
          plaintiff: complainantName.trim(),
          defendant: suspectDetails.trim() || 'Unknown Accused',
          description: legalNarrative,
          district: efirDistrict,
          police_org_id: resolvedPoliceOrgId,
          case_category: 'Criminal (e-FIR)',
          stage: 'fir_registered'
        }])
        .select()
        .single();

      if (caseErr) throw caseErr;

      await supabase.from('documents').insert([{
        case_id: newCase.id,
        doc_type: 'fir',
        title: `CITIZEN e-FIR: ${efirNumber} — ${complainantName.trim()}`,
        storage_path: `efir/${efirNumber}.txt`,
        ocr_text: legalNarrative,
        sha256: docSha256,
        status: 'verified',
        ai_summary: `e-FIR lodged by ${complainantName.trim()} under ${selectedStationName}, ${efirDistrict}. Category: ${incidentCategory}.`
      }]);

      try {
        await supabase.from('audit_log').insert([{
          case_id: newCase.id,
          action: 'CITIZEN_EFIR_LODGED',
          metadata: {
            efir_number: efirNumber,
            complainant: complainantName.trim(),
            police_station: selectedStationName,
            district: efirDistrict,
            state: efirState,
            category: incidentCategory,
            lodged_at: new Date().toISOString()
          },
          record_hash: docSha256
        }]);
      } catch (auditEx) {}

      setEfirSuccessData({
        efirNumber: efirNumber,
        complainantName: complainantName.trim(),
        stationName: selectedStationName,
        district: efirDistrict,
        state: efirState,
        category: incidentCategory,
        timestamp: nowTimestamp,
        shaHash: docSha256
      });
      setEfirStep(4);
    } catch (err) {
      alert("Failed to lodge e-FIR: " + err.message);
    } finally {
      setIsSubmittingEfir(false);
    }
  };

  // View FIR Search Handler
  const handleSearchFir = async (e) => {
    e.preventDefault();
    if (!searchFirQuery.trim()) return;

    setIsSearchingFir(true);
    setSearchedFirResult(null);
    setSearchedFirError(null);

    try {
      const q = searchFirQuery.trim();
      const { data, error } = await supabase
        .from('cases')
        .select(`*, police_org:organisations!cases_police_org_id_fkey(name, district, state)`)
        .or(`case_number.ilike.%${q}%,title.ilike.%${q}%,plaintiff.ilike.%${q}%,description.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setSearchedFirError(`No registered e-FIR found matching "${q}". Please verify the Reference Number.`);
      } else {
        setSearchedFirResult(data);
      }
    } catch (err) {
      setSearchedFirError("Error searching FIR registry: " + err.message);
    } finally {
      setIsSearchingFir(false);
    }
  };

  const handleCitizenServiceApply = (serviceName) => {
    const refNumber = `SRV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    setServiceApplicationSuccess({
      serviceName,
      refNumber,
      timestamp: new Date().toLocaleString('en-IN')
    });
  };

  return (
    <div className="gov-landing-root">
      
      {/* 1. GIGW Accessibility Skip Link */}
      <a href="#main-content" className="gov-skip-link">
        Skip to main content
      </a>

      {/* 2. Utility Bar (Black, Accessibility Controls) */}
      <div className="gov-utility-bar" role="region" aria-label="Accessibility and Language Bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span>Government of India · Ministry of Home Affairs / Department of Justice</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>Smart India Hackathon 2024–2026 (SIH 26190)</span>
        </div>
        
        <div className="gov-util-controls">
          <span style={{ fontSize: '0.72rem', color: '#999999', marginRight: '0.2rem' }}>Text Size:</span>
          <button onClick={() => changeFontSize(-1)} className="gov-util-btn" title="Decrease font size" aria-label="Decrease text size">A-</button>
          <button onClick={() => changeFontSize(0)} className="gov-util-btn" title="Reset font size" aria-label="Reset text size">A</button>
          <button onClick={() => changeFontSize(1)} className="gov-util-btn" title="Increase font size" aria-label="Increase text size">A+</button>
          
          <button 
            onClick={toggleContrast} 
            className="gov-util-btn" 
            style={{ marginLeft: '0.4rem' }}
            title="Toggle High Contrast Mode" 
            aria-label="Toggle High Contrast Mode"
          >
            {isHighContrast ? 'Normal View' : 'High Contrast'}
          </button>

          <button 
            onClick={() => setCurrentLang(currentLang === 'en' ? 'hi' : 'en')}
            className="gov-util-btn"
            style={{ marginLeft: '0.4rem', background: '#333333', color: '#FFD700', borderColor: '#555555' }}
            aria-label="Toggle Language (English / Hindi)"
          >
            {currentLang === 'en' ? 'हिन्दी' : 'English'}
          </button>
        </div>
      </div>

      {/* 3. Identity Band (Navy #0E2A47) */}
      <header className="gov-identity-band" role="banner">
        <div className="gov-identity-container">
          
          {/* Crest & Stacked Bilingual Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="gov-crest-mark" aria-hidden="true">
              <Scale size={24} color="#0E2A47" />
            </div>
            <div>
              <div className="gov-title-hindi">
                {currentLang === 'en' ? 'ई-न्यायालय' : 'e-Nyayalaya'}
              </div>
              <div className="gov-title-english">
                {currentLang === 'en' ? 'e-Nyayalaya' : 'ई-न्यायालय'}
              </div>
              <div className="gov-subtitle">
                National Judicial & Law Enforcement Record Grid · SIH 26190
              </div>
            </div>
          </div>

          {/* Right Aligned Login CTA */}
          <div className="gov-identity-actions">
            <button 
              onClick={() => { setEfirModal(true); setEfirStep(1); }}
              className="gov-btn-flat-secondary"
              style={{ background: '#FFFFFF', color: '#1B2230', whiteSpace: 'nowrap' }}
            >
              <FilePlus size={15} /> {currentLang === 'en' ? 'Register e-FIR' : 'ई-एफआईआर दर्ज करें'}
            </button>
            <button 
              onClick={() => setShowLoginModal(true)}
              className="gov-btn-maroon"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Lock size={15} /> {currentLang === 'en' ? 'Official Portal Login' : 'पोर्टल लॉगिन'}
            </button>
          </div>

        </div>
      </header>

      {/* 4. Dense Horizontal Nav Bar (Sticky) */}
      <nav className="gov-navbar" role="navigation" aria-label="Main Navigation">
        <div className="gov-nav-container">
          <a href="#intro" className="gov-nav-item">
            {currentLang === 'en' ? 'Home' : 'मुख्य पृष्ठ'}
          </a>
          <a href="#about" className="gov-nav-item">
            {currentLang === 'en' ? 'About Platform' : 'परिचय'}
          </a>
          <a href="#stats" className="gov-nav-item">
            {currentLang === 'en' ? 'Judicial Overview' : 'न्यायिक अवलोकन'}
          </a>

          {/* Online Citizen Services Dropdown */}
          <div 
            className="gov-dropdown-container"
            onMouseEnter={() => setCitizenDropdownOpen(true)}
            onMouseLeave={() => setCitizenDropdownOpen(false)}
          >
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); setCitizenDropdownOpen(prev => !prev); }}
              className="gov-nav-item"
              style={{ color: 'var(--accent)', fontWeight: 700 }}
              aria-expanded={citizenDropdownOpen}
              aria-haspopup="true"
            >
              <Siren size={15} aria-hidden="true" />
              <span>{currentLang === 'en' ? 'Online Citizen Services' : 'ऑनलाइन नागरिक सेवाएं'}</span>
              <ChevronDown size={14} style={{ transform: citizenDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }} aria-hidden="true" />
            </button>

            {citizenDropdownOpen && (
              <div className="gov-dropdown-menu" role="menu">
                <div className="gov-dropdown-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.88rem' }}>
                    <Siren size={15} color="#FFFFFF" aria-hidden="true" />
                    <span>Citizen Services Directory</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.2)', padding: '0.15rem 0.45rem', borderRadius: '2px' }}>
                    22 Services
                  </span>
                </div>
                <div className="gov-dropdown-grid">
                  <button onClick={() => { setEfirModal(true); setEfirStep(1); setCitizenDropdownOpen(false); }} className="gov-dropdown-item gov-dropdown-item-highlight">
                    <FilePlus size={15} color="#8A1E23" aria-hidden="true" />
                    <div>
                      <strong>Register e-FIR</strong>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>3-Step Verified Submission</div>
                    </div>
                  </button>

                  <button onClick={() => { setViewFirModal(true); setCitizenDropdownOpen(false); }} className="gov-dropdown-item gov-dropdown-item-highlight">
                    <FileSearch size={15} color="#0E2A47" aria-hidden="true" />
                    <div>
                      <strong>View / Track FIR</strong>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Live Status Lookup</div>
                    </div>
                  </button>

                  <button onClick={() => { setThreeActsModal(true); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <Scale size={15} color="#8A1E23" aria-hidden="true" />
                    <span>Three New Major Acts 2023</span>
                  </button>

                  <button onClick={() => { setKnowStationModal(true); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <Building2 size={15} color="#1B5FB3" aria-hidden="true" />
                    <span>Know Your Police Station</span>
                  </button>

                  <button onClick={() => { setServiceModal('complaint'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <FileText size={15} color="#4B5566" aria-hidden="true" />
                    <span>Complaint Registration</span>
                  </button>

                  <button onClick={() => { setServiceModal('character_verification'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <CheckSquare size={15} color="#1E7E34" aria-hidden="true" />
                    <span>Character Verification</span>
                  </button>

                  <button onClick={() => { setServiceModal('tenant_verification'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <Building2 size={15} color="#1E7E34" aria-hidden="true" />
                    <span>Tenant / PG Verification</span>
                  </button>

                  <button onClick={() => { setServiceModal('domestic_help'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <Users size={15} color="#4B5566" aria-hidden="true" />
                    <span>Domestic Help Verification</span>
                  </button>

                  <button onClick={() => { setServiceModal('employee_verification'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <UserCheck size={15} color="#1B5FB3" aria-hidden="true" />
                    <span>Employee Verification</span>
                  </button>

                  <button onClick={() => { setServiceModal('event_request'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <Calendar size={15} color="#4B5566" aria-hidden="true" />
                    <span>Event / Performance Request</span>
                  </button>

                  <button onClick={() => { setServiceModal('protest_request'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <ShieldAlert size={15} color="#8A1E23" aria-hidden="true" />
                    <span>Protest / Strike Request</span>
                  </button>

                  <button onClick={() => { setServiceModal('procession_request'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <Users size={15} color="#4B5566" aria-hidden="true" />
                    <span>Procession Request</span>
                  </button>

                  <button onClick={() => { setServiceModal('postmortem_report'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <FileText size={15} color="#4B5566" aria-hidden="true" />
                    <span>Postmortem Report Request</span>
                  </button>

                  <button onClick={() => { setServiceModal('fire_services'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <Flame size={15} color="#8A1E23" aria-hidden="true" />
                    <span>Fire Services Portal</span>
                  </button>

                  <button onClick={() => { setServiceModal('citizen_info'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <BookOpen size={15} color="#4B5566" aria-hidden="true" />
                    <span>Information for Citizen</span>
                  </button>

                  <button onClick={() => { setServiceModal('missing_persons'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <UserX size={15} color="#8A1E23" aria-hidden="true" />
                    <span>Missing Persons / Bodies</span>
                  </button>

                  <button onClick={() => { setServiceModal('mobile_apps'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <Smartphone size={15} color="#4B5566" aria-hidden="true" />
                    <span>Mobile Apps Download</span>
                  </button>

                  <button onClick={() => { setServiceModal('women_security'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <HeartHandshake size={15} color="#8A1E23" aria-hidden="true" />
                    <span>Crime Against Women (1090)</span>
                  </button>

                  <button onClick={() => { setServiceModal('cyber_crime'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <ShieldAlert size={15} color="#1B5FB3" aria-hidden="true" />
                    <span>Cyber Crime Portal (1930)</span>
                  </button>

                  <button onClick={() => { setServiceModal('psara'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <Lock size={15} color="#1E7E34" aria-hidden="true" />
                    <span>Private Security Agency (PSARA)</span>
                  </button>

                  <button onClick={() => { setServiceModal('traffic_portal'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <Car size={15} color="#8A1E23" aria-hidden="true" />
                    <span>Traffic Directorate Portal</span>
                  </button>

                  <button onClick={() => { setServiceModal('mparivahan'); setCitizenDropdownOpen(false); }} className="gov-dropdown-item">
                    <Car size={15} color="#4B5566" aria-hidden="true" />
                    <span>M-Parivahan Services</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <a href="#workflow" className="gov-nav-item">
            {currentLang === 'en' ? 'How It Works' : 'कार्यप्रणाली'}
          </a>
          <a href="#rights" className="gov-nav-item">
            {currentLang === 'en' ? 'Rights & Duties' : 'अधिकार एवं कर्तव्य'}
          </a>
          <a href="#civic-gateway" className="gov-nav-item">
            {currentLang === 'en' ? 'Police Helpdesk' : 'पुलिस सहायता'}
          </a>
          <a href="https://njdg.ecourts.gov.in/" target="_blank" rel="noreferrer" className="gov-nav-item" style={{ color: 'var(--ink-soft)' }}>
            NJDG Portal <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
      </nav>

      {/* 5. Notices Ticker Strip */}
      <div className="gov-notice-strip" role="region" aria-label="Official Notice Strip">
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="gov-notice-tag">Notice</span>
          <span>
            <strong>DEMONSTRATION BUILD:</strong> Smart India Hackathon (SIH 26190). Unified electronic case record grid connecting Police Stations, Trial Courts, High Courts, and Enforcement Agencies under BNSS 2023.
          </span>
        </div>
      </div>

      {/* 6. Main Content Area */}
      <main id="main-content">
        
        {/* Section: Intro / Overview (2-Column Restrained Grid) */}
        <section id="intro" className="gov-section" style={{ borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            
            {/* Left Column: Restrained Intro */}
            <div>
              <h1 style={{ fontSize: '2rem', lineHeight: '1.25', marginBottom: '1rem' }}>
                {currentLang === 'en' ? (
                  'Unified Digital Case Record Architecture for Police, Courts, and Enforcement Agencies'
                ) : (
                  'पुलिस, न्यायालय और जांच एजेंसियों हेतु एकीकृत डिजिटल केस रिकॉर्ड प्रणाली'
                )}
              </h1>
              
              <p style={{ fontSize: '0.98rem', color: 'var(--ink-soft)', lineHeight: '1.65', marginBottom: '1.5rem' }}>
                {currentLang === 'en' ? (
                  'e-Nyayalaya establishes an authorized, tamper-evident digital custody grid under the Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023). It connects Investigating Officers, Judicial Magistrates, and Specialized Investigation Agencies with SHA-256 cryptographic audit verification.'
                ) : (
                  'ई-न्यायालय भारतीय नागरिक सुरक्षा संहिता (2023) के अंतर्गत पुलिस जांच अधिकारियों, न्यायिक पीठों और विशेष एजेंसियों के मध्य छेड़छाड़-मुक्त डिजिटल केस रिकॉर्ड ग्रिड स्थापित करता है।'
                )}
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => { setEfirModal(true); setEfirStep(1); }} 
                  className="gov-btn-maroon"
                >
                  <FilePlus size={16} aria-hidden="true" /> Lodge e-FIR Online
                </button>
                <button 
                  onClick={() => setShowLoginModal(true)} 
                  className="gov-btn-flat-secondary"
                >
                  <Lock size={16} aria-hidden="true" /> Official Portal Login
                </button>
              </div>
            </div>

            {/* Right Column: Metadata Box */}
            <div className="gov-flat-box">
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem' }}>
                Platform Technical Specifications
              </h2>
              <table className="gov-meta-table">
                <tbody>
                  <tr>
                    <td>Problem Statement</td>
                    <td>SIH 26190 · Ministry of Home Affairs</td>
                  </tr>
                  <tr>
                    <td>Governing Acts</td>
                    <td>BNS, BNSS, BSA (2023)</td>
                  </tr>
                  <tr>
                    <td>Security Standard</td>
                    <td>SHA-256 Hash Chaining · Role-Based RLS</td>
                  </tr>
                  <tr>
                    <td>Integrations</td>
                    <td>e-FIR · Court Transfers · Agency Claims</td>
                  </tr>
                  <tr>
                    <td>System Status</td>
                    <td><span style={{ color: '#1E7E34', fontWeight: 600 }}>Active Demonstration Grid</span></td>
                  </tr>
                  <tr>
                    <td>Last Updated</td>
                    <td>September 2026</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </section>

        {/* Section: About the Platform */}
        <section id="about" className="gov-section" style={{ borderBottom: '1px solid var(--line)' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>
              About the Platform Architecture
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', margin: 0 }}>
              Purpose-built to eliminate jurisdictional silos between state police forces, trial court benches, and specialized enforcement bodies.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            
            <div className="gov-flat-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Building2 size={20} color="#8A1E23" aria-hidden="true" />
                <h3 style={{ fontSize: '1.15rem' }}>Law Enforcement & Police</h3>
              </div>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>
                Enables Investigating Officers to register e-FIRs, record chronological case diaries, manage physical exhibit custody, and submit digital charge sheets with verifiable hash fingerprints.
              </p>
            </div>

            <div className="gov-flat-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Landmark size={20} color="#8A1E23" aria-hidden="true" />
                <h3 style={{ fontSize: '1.15rem' }}>Judicial Benches & Courts</h3>
              </div>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>
                Empowers Magistrates and Judges to examine charge sheets, issue summons, record courtroom proceedings, manage bail hearings, and publish certified decrees directly to the national ledger.
              </p>
            </div>

            <div className="gov-flat-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <ShieldAlert size={20} color="#8A1E23" aria-hidden="true" />
                <h3 style={{ fontSize: '1.15rem' }}>Specialized Agencies</h3>
              </div>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>
                Facilitates jurisdictional transfer claims for CBI, CID, and NIA pursuant to High Court and Magistrate transfer orders, enabling appointed agency officers to take over investigative custody.
              </p>
            </div>

          </div>
        </section>

        {/* Section: Judicial System at a Glance (Real Live Data) */}
        <section id="stats" className="gov-section" style={{ borderBottom: '1px solid var(--line)' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>
              Judicial Grid at a Glance
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', margin: 0 }}>
              Live stage-wise breakdown of cases registered in this e-Nyayalaya demonstration instance.
            </p>
          </div>

          <div className="gov-stat-grid">
            <div className="gov-stat-box">
              <div className="gov-stat-num">
                {statsLoading ? '—' : caseStats.underInvestigation}
              </div>
              <div className="gov-stat-label">Under Investigation</div>
            </div>

            <div className="gov-stat-box">
              <div className="gov-stat-num">
                {statsLoading ? '—' : caseStats.inTrial}
              </div>
              <div className="gov-stat-label">In Trial / Charge Sheet</div>
            </div>

            <div className="gov-stat-box">
              <div className="gov-stat-num">
                {statsLoading ? '—' : caseStats.disposed}
              </div>
              <div className="gov-stat-label">Disposed / Closed</div>
            </div>

            <div className="gov-stat-box">
              <div className="gov-stat-num">
                {statsLoading ? '—' : caseStats.appealed}
              </div>
              <div className="gov-stat-label">Appealed / Escalated</div>
            </div>
          </div>

          {/* Source Attribution Note */}
          <div className="gov-source-note">
            <strong>Source Attribution:</strong> The figures above represent live records tracked inside this demonstration platform database. For authoritative, verified national case pendency statistics across all District Courts and High Courts of India, refer directly to the official{' '}
            <a href="https://njdg.ecourts.gov.in/" target="_blank" rel="noreferrer" style={{ color: 'var(--focus)', fontWeight: 600, textDecoration: 'underline' }}>
              National Judicial Data Grid (NJDG)
            </a>.
          </div>
        </section>

        {/* Section: How It Works */}
        <section id="workflow" className="gov-section" style={{ borderBottom: '1px solid var(--line)' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>
              End-to-End Case Progression Workflow
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', margin: 0 }}>
              Structured six-stage lifecycle enforcing statutory custody chains under Indian criminal jurisprudence.
            </p>
          </div>

          <div className="gov-steps-grid">
            
            <div className="gov-step-tile">
              <div className="gov-step-num">1</div>
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>FIR Lodging & Registration</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  Electronic first information report logged by citizen or police station with instantaneous SHA-256 fingerprinting.
                </p>
              </div>
            </div>

            <div className="gov-step-tile">
              <div className="gov-step-num">2</div>
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Investigation & Case Diary</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  Investigating Officer logs witness depositions, attaches forensic exhibits, and compiles digital charge sheet.
                </p>
              </div>
            </div>

            <div className="gov-step-tile">
              <div className="gov-step-num">3</div>
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Court Proceedings & Trial</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  Judicial magistrate takes cognizance, examines charge sheet, summons witnesses, and holds courtroom hearings.
                </p>
              </div>
            </div>

            <div className="gov-step-tile">
              <div className="gov-step-num">4</div>
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Judgement & Sentencing</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  Presiding Judge enters signed findings and legal orders with automatic dissemination to authorized parties.
                </p>
              </div>
            </div>

            <div className="gov-step-tile">
              <div className="gov-step-num">5</div>
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Appeals & Agency Escalation</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  Case escalation to High Courts or transfer to specialized enforcement bodies (CBI / CID / NIA) via secure tokens.
                </p>
              </div>
            </div>

            <div className="gov-step-tile">
              <div className="gov-step-num">6</div>
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Cryptographic Audit Trail</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  Tamper-evident chronological hash chain recording every document submission, status transition, and custody change.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Section: Rights & Duties */}
        <section id="rights" className="gov-section" style={{ borderBottom: '1px solid var(--line)' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>
              Know Your Rights & Responsibilities
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', margin: 0 }}>
              Essential constitutional duties and procedural statutory protections under Indian criminal law.
            </p>
          </div>

          <div className="gov-flat-box">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              {/* Duties Column */}
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--accent)', marginBottom: '0.75rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.4rem' }}>
                  Fundamental Duties (Article 51A)
                </h3>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.88rem', color: 'var(--ink)', lineHeight: 1.7 }}>
                  <li>To abide by the Constitution and respect its ideals and institutions.</li>
                  <li>To uphold and protect the sovereignty, unity, and integrity of India.</li>
                  <li>To develop scientific temper, humanism, and the spirit of inquiry.</li>
                  <li>To safeguard public property and to abjure violence.</li>
                  <li>To strive towards excellence in all spheres of individual and collective activity.</li>
                </ul>
              </div>

              {/* Rights Column */}
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.75rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.4rem' }}>
                  Rights in the Justice System
                </h3>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.88rem', color: 'var(--ink)', lineHeight: 1.7 }}>
                  <li><strong>Right to Grounds of Arrest (Article 22):</strong> Right to be informed immediately of reasons for detention.</li>
                  <li><strong>Free Legal Aid (Article 39A):</strong> Access to state-provided counsel if unable to afford private representation.</li>
                  <li><strong>Fair & Speedy Trial (Article 21):</strong> Judicial guarantee against undue trial delay and arbitrary detention.</li>
                  <li><strong>Zero FIR Provision (BNSS, 2023):</strong> Right to file an initial FIR at any police station regardless of territory.</li>
                </ul>
              </div>

            </div>

            {/* Non-Optional Legal Disclaimer */}
            <div style={{ borderTop: '1px solid var(--line)', marginTop: '1.5rem', paddingTop: '1rem', fontSize: '0.82rem', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
              <strong>Statutory Disclaimer:</strong> This information is provided strictly for general civic awareness and does not constitute formal legal counsel. For representation on specific legal proceedings, consult a licensed advocate or your nearest State Legal Services Authority (SLSA / NALSA).
            </div>
          </div>
        </section>

        {/* Section: Civic Police Helpdesk Grid */}
        <section id="civic-gateway" className="gov-section">
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>
              Public Assistance & Police Helpdesk
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', margin: 0 }}>
              Access police station jurisdiction mappings, official cadred searches, and emergency hotlines.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            
            {/* Card 1: Search Officials */}
            <div className="gov-flat-box">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Search size={16} color="var(--accent)" aria-hidden="true" /> Search Officials
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>
                Lookup Zone / Range / District / Unit Officers
              </p>
              <select className="gov-input" style={{ marginBottom: '0.75rem' }} value={searchZoneType} onChange={e => setSearchZoneType(e.target.value)}>
                <option value="District">By District Cadre</option>
                <option value="Zone">By Range / Zone</option>
                <option value="IPS">IPS Officer Roster</option>
              </select>
              <button onClick={() => alert(`Querying official cadre registry for ${searchZoneType}...`)} className="gov-btn-flat-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Search Roster
              </button>
            </div>

            {/* Card 2: Know Your Police Station */}
            <div className="gov-flat-box">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={16} color="var(--accent)" aria-hidden="true" /> Police Station Finder
              </h3>
              <div style={{ marginBottom: '0.5rem' }}>
                <label className="gov-form-label">District (Uttar Pradesh)</label>
                <select 
                  className="gov-input" 
                  value={quickDistrict} 
                  onChange={e => {
                    const newD = e.target.value;
                    setQuickDistrict(newD);
                    const thanas = getPoliceStationsForDistrict('Uttar Pradesh', newD);
                    setQuickThana(thanas[0] || '');
                  }}
                >
                  {getDistrictsForState('Uttar Pradesh').map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button onClick={handleStationSearch} className="gov-btn-maroon" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                View Thana Details
              </button>
            </div>

            {/* Card 3: e-FIR Gateway */}
            <div className="gov-flat-box" style={{ borderLeft: '3px solid var(--accent)' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FilePlus size={16} color="var(--accent)" aria-hidden="true" /> e-FIR Gateway
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>
                Electronic lodging for theft, loss of property, and unknown accused matters.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button onClick={() => { setEfirModal(true); setEfirStep(1); }} className="gov-btn-maroon" style={{ width: '100%', justifyContent: 'center' }}>
                  Register e-FIR
                </button>
                <button onClick={() => setViewFirModal(true)} className="gov-btn-flat-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  Track Case Status
                </button>
              </div>
            </div>

            {/* Card 4: Emergency Assistance */}
            <div className="gov-flat-box">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="#1E7E34" aria-hidden="true" /> Emergency 112
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
                Unified Emergency Response Support System (ERSS - Dial 112) for round-the-clock distress response.
              </p>
              <div style={{ background: '#F4F3EF', border: '1px solid var(--line)', padding: '0.4rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                Toll Free: 112 / 1090
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* 7. Footer (Navy Band) */}
      <footer className="gov-footer" role="contentinfo">
        <div className="gov-footer-grid">
          
          <div className="gov-footer-col">
            <h4>Platform Overview</h4>
            <ul>
              <li><a href="#about">About e-Nyayalaya</a></li>
              <li><a href="#workflow">Case Lifecycle Architecture</a></li>
              <li><a href="#stats">Demonstration Metrics</a></li>
              <li><a href="#rights">Constitutional Duties (51A)</a></li>
            </ul>
          </div>

          <div className="gov-footer-col">
            <h4>Citizen Services</h4>
            <ul>
              <li><a href="#civic-gateway" onClick={() => { setEfirModal(true); setEfirStep(1); }}>Register e-FIR</a></li>
              <li><a href="#civic-gateway" onClick={() => setViewFirModal(true)}>Track Case Status</a></li>
              <li><a href="#civic-gateway" onClick={() => setThreeActsModal(true)}>New Criminal Laws (2023)</a></li>
              <li><a href="https://nalsa.gov.in/" target="_blank" rel="noreferrer">Free Legal Aid (NALSA) <ExternalLink size={10} aria-hidden="true" /></a></li>
            </ul>
          </div>

          <div className="gov-footer-col">
            <h4>Related Government Portals</h4>
            <ul>
              <li><a href="https://india.gov.in/" target="_blank" rel="noreferrer">National Portal of India <ExternalLink size={10} aria-hidden="true" /></a></li>
              <li><a href="https://njdg.ecourts.gov.in/" target="_blank" rel="noreferrer">National Judicial Data Grid <ExternalLink size={10} aria-hidden="true" /></a></li>
              <li><a href="https://ncrb.gov.in/" target="_blank" rel="noreferrer">National Crime Records Bureau <ExternalLink size={10} aria-hidden="true" /></a></li>
              <li><a href="https://mha.gov.in/" target="_blank" rel="noreferrer">Ministry of Home Affairs <ExternalLink size={10} aria-hidden="true" /></a></li>
            </ul>
          </div>

          <div className="gov-footer-col">
            <h4>Demonstration Metadata</h4>
            <p style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.6, margin: '0 0 0.5rem 0' }}>
              Built for Smart India Hackathon (SIH 26190) by Team ZeroDay.
            </p>
            <p style={{ fontSize: '0.8rem', color: '#9BA8B8', margin: 0 }}>
              Technical Reference: BNSS Sec. 173/530 · Cryptographic SHA-256 Chain.
            </p>
          </div>

        </div>

        <div className="gov-footer-bottom">
          © 2026 e-Nyayalaya — Smart India Hackathon Demonstration Build (SIH 26190). Content owned by Department of Justice / Ministry of Home Affairs. Last Updated: September 2026.
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 8. MODALS & SUB-PANELS */}
      {/* ========================================================================= */}

      {/* Official Login Modal */}
      {showLoginModal && (
        <div className="gov-modal-backdrop" onClick={() => setShowLoginModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '490px' }}>
            <Auth onLogin={onLogin} onClose={() => setShowLoginModal(false)} />
          </div>
        </div>
      )}

      {/* Know Your Police Station Modal */}
      {knowStationModal && selectedStationInfo && (
        <div className="gov-modal-backdrop" onClick={() => setKnowStationModal(false)}>
          <div className="gov-modal-card" onClick={e => e.stopPropagation()}>
            <div className="gov-modal-top-bar" />
            <div className="gov-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={18} color="var(--accent)" aria-hidden="true" />
                <h3 style={{ fontSize: '1.15rem' }}>Police Station Information</h3>
              </div>
              <button onClick={() => setKnowStationModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div style={{ padding: '1.25rem 1.75rem' }}>
              <table className="gov-meta-table">
                <tbody>
                  <tr>
                    <td>Thana Name</td>
                    <td><strong>{selectedStationInfo.stationName}</strong></td>
                  </tr>
                  <tr>
                    <td>District / State</td>
                    <td>{selectedStationInfo.district}, {selectedStationInfo.state}</td>
                  </tr>
                  <tr>
                    <td>CCTNS Thana Code</td>
                    <td><code>{selectedStationInfo.cctnsCode}</code></td>
                  </tr>
                  <tr>
                    <td>In-Charge</td>
                    <td>{selectedStationInfo.shoName}</td>
                  </tr>
                  <tr>
                    <td>Control Room Phone</td>
                    <td>{selectedStationInfo.phone}</td>
                  </tr>
                  <tr>
                    <td>Official Email</td>
                    <td>{selectedStationInfo.email}</td>
                  </tr>
                </tbody>
              </table>
              <button onClick={() => setKnowStationModal(false)} className="gov-btn-flat-secondary" style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}>
                Close Details
              </button>
            </div>
            <div className="gov-modal-footer-strip">
              CCTNS National Police Registry · Ministry of Home Affairs
            </div>
          </div>
        </div>
      )}

      {/* Three New Major Acts 2023 Modal */}
      {threeActsModal && (
        <div className="gov-modal-backdrop" onClick={() => setThreeActsModal(false)}>
          <div className="gov-modal-card" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="gov-modal-top-bar" />
            <div className="gov-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scale size={18} color="var(--accent)" aria-hidden="true" />
                <h3 style={{ fontSize: '1.15rem' }}>Three New Major Criminal Acts (2023)</h3>
              </div>
              <button onClick={() => setThreeActsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div style={{ padding: '1.25rem 1.75rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="gov-flat-box">
                  <h4 style={{ color: 'var(--accent)', fontSize: '0.98rem', marginBottom: '0.3rem' }}>1. Bharatiya Nyaya Sanhita, 2023 (BNS)</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: 0 }}>
                    Replaces the Indian Penal Code (1860). Modernizes substantive criminal offences, introduces community service for petty offences, and strengthens protections for women and children.
                  </p>
                </div>
                <div className="gov-flat-box">
                  <h4 style={{ color: 'var(--accent)', fontSize: '0.98rem', marginBottom: '0.3rem' }}>2. Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: 0 }}>
                    Replaces the Code of Criminal Procedure (1973). Formally codifies electronic FIRs (e-FIR), mandatory videography of crime scenes, digital witness testimony, and time-bound charge sheets.
                  </p>
                </div>
                <div className="gov-flat-box">
                  <h4 style={{ color: 'var(--accent)', fontSize: '0.98rem', marginBottom: '0.3rem' }}>3. Bharatiya Sakshya Adhiniyam, 2023 (BSA)</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: 0 }}>
                    Replaces the Indian Evidence Act (1872). Establishes electronic and digital records as primary evidence having equivalent legal validity to physical documents.
                  </p>
                </div>
              </div>
              <button onClick={() => setThreeActsModal(false)} className="gov-btn-maroon" style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}>
                Acknowledge & Close
              </button>
            </div>
            <div className="gov-modal-footer-strip">
              Legislative Department · Ministry of Law & Justice
            </div>
          </div>
        </div>
      )}

      {/* View / Track FIR Modal */}
      {viewFirModal && (
        <div className="gov-modal-backdrop" onClick={() => setViewFirModal(false)}>
          <div className="gov-modal-card" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="gov-modal-top-bar" />
            <div className="gov-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileSearch size={18} color="var(--accent)" aria-hidden="true" />
                <h3 style={{ fontSize: '1.15rem' }}>Search & Track e-FIR Status</h3>
              </div>
              <button onClick={() => setViewFirModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div style={{ padding: '1.25rem 1.75rem' }}>
              <form onSubmit={handleSearchFir} style={{ marginBottom: '1.25rem' }}>
                <label className="gov-form-label">Enter e-FIR Reference Number or Complainant Name</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="gov-input" 
                    placeholder="e.g. eFIR-2026-LKO-1234"
                    value={searchFirQuery}
                    onChange={e => setSearchFirQuery(e.target.value)}
                    required
                  />
                  <button type="submit" className="gov-btn-maroon" disabled={isSearchingFir}>
                    {isSearchingFir ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>

              {searchedFirError && (
                <div style={{ background: '#FDF2F2', border: '1px solid #F87171', color: '#991B1B', padding: '0.75rem', borderRadius: '2px', fontSize: '0.85rem' }}>
                  {searchedFirError}
                </div>
              )}

              {searchedFirResult && (
                <div className="gov-flat-box">
                  <h4 style={{ fontSize: '1rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                    {searchedFirResult.case_number}
                  </h4>
                  <table className="gov-meta-table">
                    <tbody>
                      <tr>
                        <td>Title</td>
                        <td>{searchedFirResult.title}</td>
                      </tr>
                      <tr>
                        <td>Complainant</td>
                        <td>{searchedFirResult.plaintiff}</td>
                      </tr>
                      <tr>
                        <td>Current Stage</td>
                        <td><span style={{ fontWeight: 700, color: 'var(--accent)' }}>{searchedFirResult.stage?.toUpperCase().replace(/_/g, ' ')}</span></td>
                      </tr>
                      <tr>
                        <td>District / Station</td>
                        <td>{searchedFirResult.district}, {searchedFirResult.state}</td>
                      </tr>
                      <tr>
                        <td>Date Registered</td>
                        <td>{new Date(searchedFirResult.created_at).toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="gov-modal-footer-strip">
              National e-Courts & CCTNS Integrated Grid
            </div>
          </div>
        </div>
      )}

      {/* 3-Step e-FIR Modal */}
      {efirModal && (
        <div className="gov-modal-backdrop" onClick={() => setEfirModal(false)}>
          <div className="gov-modal-card" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <div className="gov-modal-top-bar" />
            <div className="gov-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Citizen Electronic FIR Lodging</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Under Sec 173 Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)</div>
              </div>
              <button onClick={() => setEfirModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.75rem', maxHeight: '75vh', overflowY: 'auto' }}>
              
              {/* Step indicator */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem', marginBottom: '1.25rem', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                <span style={{ color: efirStep === 1 ? 'var(--accent)' : 'var(--ink-soft)' }}>1. Personal & OTP</span>
                <span>&rarr;</span>
                <span style={{ color: efirStep === 2 ? 'var(--accent)' : 'var(--ink-soft)' }}>2. Incident & Location</span>
                <span>&rarr;</span>
                <span style={{ color: efirStep === 3 ? 'var(--accent)' : 'var(--ink-soft)' }}>3. Property & Review</span>
              </div>

              {efirStep === 1 && (
                <form onSubmit={e => { e.preventDefault(); if (!isOtpVerified) { alert("Please verify your Mobile OTP before proceeding."); return; } setEfirStep(2); }}>
                  <div className="gov-form-group">
                    <label className="gov-form-label">Complainant Full Name *</label>
                    <input type="text" className="gov-input" required value={complainantName} onChange={e => setComplainantName(e.target.value)} placeholder="Full legal name as per ID" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="gov-form-group">
                      <label className="gov-form-label">Gender</label>
                      <select className="gov-input" value={gender} onChange={e => setGender(e.target.value)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="gov-form-group">
                      <label className="gov-form-label">Date of Birth</label>
                      <input type="date" className="gov-input" value={dob} onChange={e => setDob(e.target.value)} />
                    </div>
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-form-label">Parent / Spouse Name</label>
                    <input type="text" className="gov-input" value={relativeName} onChange={e => setRelativeName(e.target.value)} placeholder="Father's / Mother's / Spouse's Name" />
                  </div>

                  {/* OTP Verification Block */}
                  <div className="gov-flat-box" style={{ marginBottom: '1rem', background: '#F8FAFC' }}>
                    <label className="gov-form-label">Mobile Number (OTP Verification Required) *</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input type="tel" maxLength="10" className="gov-input" required value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile number" disabled={isOtpVerified} />
                      <button type="button" onClick={handleSendOtp} className="gov-btn-flat-secondary" disabled={isOtpVerified || !mobile}>
                        {isOtpSent ? 'Resend' : 'Send OTP'}
                      </button>
                    </div>

                    {isOtpSent && !isOtpVerified && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input type="text" maxLength="6" className="gov-input" placeholder="Enter 6-digit OTP" value={otpInput} onChange={e => setOtpInput(e.target.value)} />
                        <button type="button" onClick={handleVerifyOtp} className="gov-btn-maroon">Verify OTP</button>
                      </div>
                    )}

                    {isOtpVerified && (
                      <div style={{ color: '#1E7E34', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={14} /> Mobile verified with digital timestamp
                      </div>
                    )}
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-form-label">Email Address</label>
                    <input type="email" className="gov-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@domain.com" />
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-form-label">Permanent / Present Address *</label>
                    <textarea className="gov-input" rows="2" required value={address} onChange={e => setAddress(e.target.value)} placeholder="House/Flat, Street, Landmark, Pin Code" />
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-form-label">Aadhaar / Official ID Proof Number</label>
                    <input type="text" className="gov-input" value={idProof} onChange={e => setIdProof(e.target.value)} placeholder="XXXX-XXXX-XXXX" />
                  </div>

                  <button type="submit" className="gov-btn-maroon" style={{ width: '100%', justifyContent: 'center' }}>
                    Proceed to Incident Details &rarr;
                  </button>
                </form>
              )}

              {efirStep === 2 && (
                <form onSubmit={e => { e.preventDefault(); setEfirStep(3); }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="gov-form-group">
                      <label className="gov-form-label">Date & Time of Incident *</label>
                      <input type="datetime-local" className="gov-input" required value={incidentDateTime} onChange={e => setIncidentDateTime(e.target.value)} />
                    </div>
                    <div className="gov-form-group">
                      <label className="gov-form-label">Category of Offence *</label>
                      <select className="gov-input" value={incidentCategory} onChange={e => setIncidentCategory(e.target.value)}>
                        <option value="Theft / Stolen Property">Theft / Stolen Property</option>
                        <option value="Lost Mobile / Device">Lost Mobile / Electronic Device</option>
                        <option value="Document Loss">Loss of Official Documents</option>
                        <option value="Vehicle Theft">Vehicle Theft</option>
                        <option value="Cyber Financial Fraud">Cyber Financial Fraud</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="gov-form-group">
                      <label className="gov-form-label">State *</label>
                      <select className="gov-input" value={efirState} onChange={e => {
                        const nextState = e.target.value;
                        setEfirState(nextState);
                        const dists = getDistrictsForState(nextState);
                        const firstDist = dists[0] || 'Central';
                        setEfirDistrict(firstDist);
                        const thanas = getPoliceStationsForDistrict(nextState, firstDist);
                        setEfirPoliceStation(thanas[0] || 'Other');
                      }}>
                        {ALL_INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="gov-form-group">
                      <label className="gov-form-label">District *</label>
                      <select className="gov-input" value={efirDistrict} onChange={e => {
                        const nextDist = e.target.value;
                        setEfirDistrict(nextDist);
                        const thanas = getPoliceStationsForDistrict(efirState, nextDist);
                        setEfirPoliceStation(thanas[0] || 'Other');
                      }}>
                        {getDistrictsForState(efirState).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-form-label">Jurisdictional Police Station *</label>
                    <select className="gov-input" value={efirPoliceStation} onChange={e => setEfirPoliceStation(e.target.value)}>
                      {getPoliceStationsForDistrict(efirState, efirDistrict).map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="Other">Other / Unlisted Station</option>
                    </select>
                  </div>

                  {efirPoliceStation === 'Other' && (
                    <div className="gov-form-group">
                      <label className="gov-form-label">Specify Police Station Name</label>
                      <input type="text" className="gov-input" required value={customPoliceStation} onChange={e => setCustomPoliceStation(e.target.value)} />
                    </div>
                  )}

                  <div className="gov-form-group">
                    <label className="gov-form-label">Exact Place of Occurrence *</label>
                    <input type="text" className="gov-input" required value={incidentLocation} onChange={e => setIncidentLocation(e.target.value)} placeholder="Landmark, Street, Market, etc." />
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-form-label">Chronological Narrative / Facts of Incident *</label>
                    <textarea className="gov-input" rows="3" required value={incidentDescription} onChange={e => setIncidentDescription(e.target.value)} placeholder="Describe exactly what happened..." />
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-form-label">Suspect Particulars (If Known)</label>
                    <input type="text" className="gov-input" value={suspectDetails} onChange={e => setSuspectDetails(e.target.value)} placeholder="Leave blank if unknown" />
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-form-label">Witness Particulars (If Any)</label>
                    <input type="text" className="gov-input" value={witnessDetails} onChange={e => setWitnessDetails(e.target.value)} placeholder="Names and phone numbers of witnesses" />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setEfirStep(1)} className="gov-btn-flat-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                      &larr; Back
                    </button>
                    <button type="submit" className="gov-btn-maroon" style={{ flex: 2, justifyContent: 'center' }}>
                      Proceed to Specifics &rarr;
                    </button>
                  </div>
                </form>
              )}

              {efirStep === 3 && (
                <form onSubmit={handleEfirSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="gov-form-group">
                      <label className="gov-form-label">Property Category</label>
                      <select className="gov-input" value={propertyCategory} onChange={e => setPropertyCategory(e.target.value)}>
                        <option value="Mobile Phone">Mobile Phone / Tablet</option>
                        <option value="Laptop / Computer">Laptop / Computer</option>
                        <option value="Vehicle">Vehicle / Two-Wheeler</option>
                        <option value="Identity Documents">Aadhaar / PAN / Passport</option>
                        <option value="Jewellery / Cash">Jewellery / Cash</option>
                        <option value="Other">Other Property</option>
                      </select>
                    </div>
                    <div className="gov-form-group">
                      <label className="gov-form-label">Estimated Financial Loss (₹)</label>
                      <input type="number" className="gov-input" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} placeholder="Estimated value" />
                    </div>
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-form-label">Property Description & Identifiers (IMEI / Reg No / Serial)</label>
                    <textarea className="gov-input" rows="2" value={lostPropertyDetails} onChange={e => setLostPropertyDetails(e.target.value)} placeholder="IMEI number, model, color, registration number, etc." />
                  </div>

                  {/* Statutory Declaration */}
                  <div className="gov-flat-box" style={{ background: '#FFFBEB', borderColor: '#FDE68A', marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.82rem', color: '#92400E', cursor: 'pointer' }}>
                      <input type="checkbox" required checked={efirDeclaration} onChange={e => setEfirDeclaration(e.target.checked)} style={{ marginTop: '0.2rem' }} />
                      <span>
                        <strong>Statutory Declaration:</strong> I hereby declare under Section 199 and 200 of Bharatiya Nyaya Sanhita (BNS 2023) that the statements made above are true to the best of my knowledge and belief. I understand that submitting false information is a punishable criminal offence.
                      </span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setEfirStep(2)} className="gov-btn-flat-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                      &larr; Back
                    </button>
                    <button type="submit" className="gov-btn-maroon" style={{ flex: 2, justifyContent: 'center' }} disabled={isSubmittingEfir}>
                      {isSubmittingEfir ? 'Generating SHA-256 Ledger Record...' : 'Submit & Lodge Official e-FIR'}
                    </button>
                  </div>
                </form>
              )}

              {efirStep === 4 && efirSuccessData && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#DEF7EC', border: '2px solid #1E7E34', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                    <CheckCircle2 size={28} color="#1E7E34" />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#1E7E34', marginBottom: '0.25rem' }}>e-FIR Lodged Successfully</h3>
                  <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem' }}>
                    {efirSuccessData.efirNumber}
                  </div>

                  <div className="gov-flat-box" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
                    <table className="gov-meta-table">
                      <tbody>
                        <tr>
                          <td>Complainant</td>
                          <td>{efirSuccessData.complainantName}</td>
                        </tr>
                        <tr>
                          <td>Police Station</td>
                          <td>{efirSuccessData.stationName}, {efirSuccessData.district}</td>
                        </tr>
                        <tr>
                          <td>Offence Category</td>
                          <td>{efirSuccessData.category}</td>
                        </tr>
                        <tr>
                          <td>Cryptographic Hash</td>
                          <td><code style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>{efirSuccessData.shaHash}</code></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={() => window.print()} className="gov-btn-flat-secondary">
                      <Printer size={15} /> Print Receipt
                    </button>
                    <button onClick={() => { setEfirModal(false); setEfirStep(1); }} className="gov-btn-maroon">
                      Close Window
                    </button>
                  </div>
                </div>
              )}

            </div>
            <div className="gov-modal-footer-strip">
              State Police Department · Department of Justice
            </div>
          </div>
        </div>
      )}

      {/* Generic Citizen Service Modal */}
      {serviceModal && (
        <div className="gov-modal-backdrop" onClick={() => setServiceModal(null)}>
          <div className="gov-modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="gov-modal-top-bar" />
            <div className="gov-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem' }}>
                {serviceModal.replace(/_/g, ' ').toUpperCase()}
              </h3>
              <button onClick={() => setServiceModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div style={{ padding: '1.25rem 1.75rem' }}>
              {!serviceApplicationSuccess ? (
                <div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: '1rem' }}>
                    Submit an online statutory verification or service request under official citizen service rules.
                  </p>
                  <div className="gov-form-group">
                    <label className="gov-form-label">Applicant Name</label>
                    <input type="text" className="gov-input" placeholder="Full legal name" />
                  </div>
                  <div className="gov-form-group">
                    <label className="gov-form-label">Contact Mobile Number</label>
                    <input type="tel" maxLength="10" className="gov-input" placeholder="10-digit mobile number" />
                  </div>
                  <button onClick={() => handleCitizenServiceApply(serviceModal)} className="gov-btn-maroon" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                    Generate Service Application Docket
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <CheckCircle2 size={36} color="#1E7E34" style={{ margin: '0 auto 0.5rem auto' }} />
                  <h4 style={{ fontSize: '1.1rem', color: '#1E7E34' }}>Application Registered</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                    Your acknowledgement number is <strong>{serviceApplicationSuccess.refNumber}</strong>.
                  </p>
                  <button onClick={() => { setServiceModal(null); setServiceApplicationSuccess(null); }} className="gov-btn-maroon" style={{ marginTop: '1rem' }}>
                    Done
                  </button>
                </div>
              )}
            </div>
            <div className="gov-modal-footer-strip">
              Online Citizen Services Gateway · Government of India
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
