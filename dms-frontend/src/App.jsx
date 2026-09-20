import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Home, Upload, FileText, User, LogOut, FilePlus, Scale, Loader, CheckCircle2, ArrowRightLeft, Building2, FolderKanban } from 'lucide-react';
import { supabase } from './supabaseClient';
import Dashboard from './pages/Dashboard';
import UploadScanner from './pages/UploadScanner';
import CaseTimeline from './pages/CaseTimeline';
import Auth from './pages/Auth';
import CreateCase from './pages/CreateCase';
import AuditLogs from './pages/AuditLogs';
import CourtSessions from './pages/CourtSessions';
import GigwHeader from './components/GigwHeader';
import GigwFooter from './components/GigwFooter';
import LandingPage from './pages/LandingPage';
import { DEMO_ROLES, loginWithDemoRole } from './constants/demoRoles';

function Sidebar({ user, onLogout, isOpen, onClose }) {
  const location = useLocation();
  const path = location.pathname;
  const search = location.search;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onClose} 
          aria-hidden="true" 
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} role="navigation" aria-label="Main Navigation">
        <div className="flex-center" style={{ gap: '0.75rem', justifyContent: 'flex-start', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--line)' }}>
          <div style={{ background: 'var(--bg-band)', padding: '0.45rem', borderRadius: '2px', display: 'flex', border: '1px solid var(--accent)' }}>
            <Scale size={20} color="#C59B27" />
          </div>
          <div>
            <h1 className="title-glow" style={{ fontSize: '1.05rem', margin: 0 }}>e-Nyayalaya</h1>
            <div style={{ fontSize: '0.65rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: '1px' }}>Judicial Grid DMS</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* Executive Dashboard */}
          <Link 
            to="/?view=dashboard" 
            onClick={onClose}
            className={`nav-link ${path === '/' && (!search || search === '' || search.includes('view=dashboard')) ? 'active' : ''}`}
            aria-label="Executive Judicial Dashboard"
          >
            <Home size={17} /> Dashboard
          </Link>

          {/* Active Cases Roster */}
          <Link 
            to="/?view=active" 
            onClick={onClose}
            className={`nav-link ${path === '/' && search.includes('view=active') ? 'active' : ''}`}
            aria-label="Active Case Files"
          >
            <FolderKanban size={17} /> Active Cases
          </Link>

          {/* Closed / Disposed Cases */}
          <Link 
            to="/?view=disposed" 
            onClick={onClose}
            className={`nav-link ${path === '/' && search.includes('view=disposed') ? 'active' : ''}`}
            aria-label="Closed and Disposed Cases"
          >
            <CheckCircle2 size={17} /> Closed / Disposed
          </Link>

          {/* Transferred Cases */}
          <Link 
            to="/?view=transferred" 
            onClick={onClose}
            className={`nav-link ${path === '/' && search.includes('view=transferred') ? 'active' : ''}`}
            aria-label="Transferred and Appealed Cases"
          >
            <ArrowRightLeft size={17} /> Transferred Cases
          </Link>

          {/* Agency / Department Transfer Portal (In Sidebar) */}
          {user.role === 'judge' && (
            <Link 
              to="/?view=agency-transfer"
              onClick={onClose}
              className={`nav-link ${path === '/' && search.includes('view=agency-transfer') ? 'active' : ''}`}
              aria-label="Agency Department Transfer Portal"
            >
              <Building2 size={17} color="var(--accent)" /> 
              <span>Agency Transfer</span>
            </Link>
          )}
          
          {/* Citizen e-FIR Desk (For Police & Investigating Officers) */}
          {(user.role === 'police_officer' || user.role === 'investigating_officer') && (
            <Link 
              to="/?view=efir" 
              onClick={onClose} 
              className={`nav-link ${path === '/' && search.includes('view=efir') ? 'active' : ''}`} 
              aria-label="Citizen e-FIR Inward Desk"
            >
              <FileText size={17} color="var(--accent)" /> 
              <span>Citizen e-FIRs</span>
            </Link>
          )}

          {/* Police FIR Registration */}
          {(user.role === 'police_officer' || user.role === 'investigating_officer') && (
            <Link to="/create-case" onClick={onClose} className={`nav-link ${path === '/create-case' ? 'active' : ''}`} aria-label="Register FIR">
              <FilePlus size={17} /> Register FIR
            </Link>
          )}
          
          {/* Document Upload Scanner */}
          <Link to="/upload" onClick={onClose} className={`nav-link ${path === '/upload' ? 'active' : ''}`} aria-label="Upload Documents">
            <Upload size={17} /> Upload Docs
          </Link>

          {/* Court Hearing Sessions */}
          {user.role === 'judge' && (
            <Link to="/court" onClick={onClose} className={`nav-link ${path === '/court' ? 'active' : ''}`} aria-label="Court Hearing Sessions">
              <Scale size={17} /> Court Sessions
            </Link>
          )}

          {/* Audit Log Ledger */}
          <Link to="/audit" onClick={onClose} className={`nav-link ${path === '/audit' ? 'active' : ''}`} aria-label="Audit Ledger Logs">
            <FileText size={17} /> Audit Logs
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--line)', paddingTop: '0.85rem' }}>
          <button 
            onClick={onLogout} 
            className="btn-secondary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderColor: 'var(--line)', color: 'var(--error)' }}
            aria-label="Logout"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ user, onToggleSidebar, onSwitchRole }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleLabel = () => {
    if (!user || !user.role) return 'Official';
    if (user.role === 'judge') {
      if (user.org_type === 'supreme_court') return 'Hon\'ble Supreme Court Judge';
      if (user.org_type === 'high_court') return 'Hon\'ble High Court Judge';
      return 'Hon\'ble District & Sessions Judge';
    }
    if (user.role === 'agency_admin') {
      return `Agency Lead • ${user.org_name || 'Special Agency'}`;
    }
    if (user.role === 'agency_officer') {
      return `Investigating Officer (IO) • ${user.org_name || 'Special Agency'}`;
    }
    if (user.role === 'police_officer') {
      return `${user.designation || 'Police Officer'} • ${user.org_name || 'Police Station'}`;
    }
    if (user.role === 'investigating_officer') {
      return `${user.designation || 'Investigating Officer (IO)'} • ${user.org_name || 'Police Station'}`;
    }
    if (user.role === 'lawyer') {
      return user.designation || 'Legal Counsel / Advocate on Record';
    }
    return typeof user.role === 'string' ? user.role.replace(/_/g, ' ') : 'Officer';
  };

  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="topbar" role="region" aria-label="User and Organization Status">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Mobile Hamburger Menu Toggle Button */}
        <button 
          onClick={onToggleSidebar}
          className="btn-secondary" 
          style={{ padding: '0.35rem 0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Toggle Navigation Menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
            {user?.role === 'agency_admin' ? (user.org_name || 'Special Investigation Agency') :
             user?.role === 'agency_officer' ? (user.org_name || 'Special Investigation Agency') :
             (user?.org_name || 'National Judicial Grid')}
          </h2>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
            {user?.role === 'agency_admin' ? `Command & Investigation HQ • ${user.org_name || 'Special Agency'}` :
             user?.role === 'agency_officer' ? `Assigned Officer: ${user.full_name} (${user.designation || 'IO'}) • ${user.org_name || 'Special Agency'}` :
             (user?.district ? `${user.district} District Jurisdiction • e-Courts System` : (user?.state ? `${user.state} Jurisdiction • e-Courts System` : 'National Jurisdiction • e-Courts System'))}
          </div>
        </div>
      </div>

      {/* Live Clock, Role Switcher & Date Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
        {/* Quick Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowRoleMenu(prev => !prev)}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 700, background: '#FAF5E8' }}
            title="Click to instantly switch between Judge, Police SHO, IO, High Court, Agency & Counsel roles"
          >
            ⚡ Switch Role
          </button>

          {showRoleMenu && (
            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '0.4rem', background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: '2px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: '280px', zIndex: 9999, overflow: 'hidden' }}>
              <div style={{ padding: '0.5rem 0.75rem', background: '#FAF9F6', borderBottom: '1px solid var(--line)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                Instant Evaluator Role Switch
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {DEMO_ROLES.map(d => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setShowRoleMenu(false);
                      if (onSwitchRole) onSwitchRole(d);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.65rem 0.85rem',
                      background: user?.role === d.role && (user?.designation === d.profile.designation || user?.org_type === d.profile.org_type) ? '#FAF5E8' : '#FFFFFF',
                      border: 'none',
                      borderBottom: '1px solid #F0EFEA',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.15rem'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: d.badgeColor }}>
                      {d.shortLabel}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                      {d.sublabel}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: '#EFECE6', border: '1px solid var(--line)', padding: '0.25rem 0.65rem', borderRadius: '2px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--bg-band)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
            🕒 {formattedTime}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--ink-soft)' }}>
            📅 {formattedDate}
          </div>
        </div>

        {/* User Profile Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
             <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>
               {user?.role === 'agency_officer' ? `${user.full_name} (${user.designation || 'IO'})` :
                user?.role === 'agency_admin' ? `${user.full_name || 'Agency Lead'}` :
                (user?.full_name || 'Official User')}
             </span>
             <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
               {getRoleLabel()} {user?.badge_no ? `• Badge: ${user.badge_no}` : ''}
             </span>
          </div>
          <div style={{ background: '#E8ECEF', color: 'var(--bg-band)', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} />
          </div>
        </div>
      </div>
    </header>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("e-Courts App Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', flexDirection: 'column', padding: '2rem', textAlign: 'center' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderTop: '4px solid var(--danger)', padding: '2rem', borderRadius: '2px', maxWidth: '600px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Scale size={48} color="var(--accent)" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', color: 'var(--danger)', fontFamily: 'var(--font-heading)' }}>System Notice: Session Error Detected</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              An unexpected display issue occurred. Your data and cryptographic records are safe.
            </p>
            {this.state.error && (
              <pre style={{ textAlign: 'left', background: '#FCE8E6', color: '#A2191F', padding: '0.75rem', fontSize: '0.75rem', overflowX: 'auto', marginBottom: '1.25rem', borderRadius: '2px', border: '1px solid #FAD2CF' }}>
                {this.state.error.toString()}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }} 
                className="btn-primary"
                style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
              >
                Reload Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setLoadingSession(false);
      return;
    }

    try {
      let activeAgencySession = null;
      let activeOfficerSession = null;
      try {
        const agRaw = localStorage.getItem('enyayalaya_active_agency');
        if (agRaw) {
          const parsed = JSON.parse(agRaw);
          if (parsed && parsed.id === authUser.id) activeAgencySession = parsed;
        }
        const offRaw = localStorage.getItem('enyayalaya_active_officer');
        if (offRaw) {
          const parsed = JSON.parse(offRaw);
          if (parsed && parsed.id === authUser.id) activeOfficerSession = parsed;
        }
      } catch (e) {
        console.warn("Local storage session parse warning:", e);
      }

      let profileData = null;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, org:organisations(state, district, org_type, name)')
          .eq('id', authUser.id)
          .maybeSingle();
        if (profile) profileData = profile;
      } catch (e) {
        console.warn("Joined profile query fallback:", e);
      }

      if (!profileData) {
        try {
          const { data: rawProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();
          if (rawProfile) profileData = rawProfile;
        } catch (e) {
          console.warn("Raw profile query fallback:", e);
        }
      }

      // If org data wasn't joined, fetch it separately
      let orgDetails = profileData?.org || null;
      if (profileData?.org_id && !orgDetails) {
        try {
          const { data: orgRow } = await supabase
            .from('organisations')
            .select('*')
            .eq('id', profileData.org_id)
            .maybeSingle();
          if (orgRow) orgDetails = orgRow;
        } catch (e) {
          console.warn("Direct org query fallback:", e);
        }
      }

      // Check against NATIONAL_AGENCIES catalog
      const agencyCatalogMatch = NATIONAL_AGENCIES.find(a => 
        a.id === profileData?.org_id || 
        a.code === profileData?.org_id || 
        a.name === profileData?.org_id ||
        (profileData?.org_id && a.id.startsWith(String(profileData.org_id))) ||
        (orgDetails?.name && a.name.toLowerCase().includes(orgDetails.name.toLowerCase())) ||
        (orgDetails?.name && orgDetails.name.toLowerCase().includes(a.acronym.toLowerCase()))
      );

      const isAgencyRole = profileData?.role === 'agency_admin' || profileData?.role === 'agency_officer' || !!activeAgencySession || !!activeOfficerSession;
      const isAgencyOrg = orgDetails?.org_type === 'agency';
      const isAgency = isAgencyRole || isAgencyOrg || !!agencyCatalogMatch;

      let finalRole = activeOfficerSession ? 'agency_officer' : (activeAgencySession ? 'agency_admin' : profileData?.role);
      if (isAgency && (!finalRole || finalRole === 'police_officer' || finalRole === 'investigating_officer')) {
        finalRole = activeOfficerSession ? 'agency_officer' : (profileData?.role === 'agency_officer' ? 'agency_officer' : 'agency_admin');
      } else if (!finalRole) {
        finalRole = 'police_officer';
      }

      let finalOrgType = isAgency ? 'agency' : (orgDetails?.org_type || profileData?.org_type);
      if (!finalOrgType) {
        if (finalRole === 'judge') finalOrgType = 'court';
        else if (isAgency) finalOrgType = 'agency';
        else finalOrgType = 'police_station';
      }

      let finalOrgName = activeAgencySession?.org_name || activeOfficerSession?.org_name || orgDetails?.name || agencyCatalogMatch?.name || profileData?.org_name;
      if (!finalOrgName) {
        if (finalRole === 'judge') finalOrgName = 'District Court';
        else if (isAgency) finalOrgName = agencyCatalogMatch?.name || 'Special Investigation Agency';
        else finalOrgName = 'Police Station';
      }

      const enhancedProfile = { 
        ...authUser,
        ...(profileData || {}),
        ...(activeAgencySession || {}),
        ...(activeOfficerSession || {}),
        role: finalRole,
        full_name: activeOfficerSession?.full_name || activeAgencySession?.full_name || profileData?.full_name || authUser.email?.split('@')[0] || 'Official User',
        badge_no: activeOfficerSession?.badge_no || activeAgencySession?.badge_no || profileData?.badge_no || '',
        designation: activeOfficerSession?.designation || activeAgencySession?.designation || profileData?.designation || (isAgency ? (finalRole === 'agency_officer' ? 'Investigating Officer (IO)' : 'Agency Administrator') : ''),
        state: activeOfficerSession?.state || activeAgencySession?.state || orgDetails?.state || (agencyCatalogMatch ? 'National' : profileData?.state || 'National'), 
        district: activeOfficerSession?.district || activeAgencySession?.district || orgDetails?.district || (agencyCatalogMatch ? 'Special HQ Unit' : profileData?.district || 'Central Jurisdiction'),
        org_type: finalOrgType,
        org_name: finalOrgName
      };

      setUser(enhancedProfile);
    } catch (err) {
      console.error("Failed to restore profile:", err);
      // Fallback object
      setUser({
        id: authUser.id,
        email: authUser.email,
        role: 'official',
        full_name: authUser.email?.split('@')[0] || 'Official User',
        ...authUser
      });
    } finally {
      setLoadingSession(false);
    }
  };

  const handleSwitchDemoRole = async (demoRole) => {
    setLoadingSession(true);
    const profile = await loginWithDemoRole(demoRole, supabase);
    setUser(profile);
    setLoadingSession(false);
  };

  useEffect(() => {
    let isMounted = true;

    // 0. Check localStorage for active demo session
    try {
      const demoRaw = localStorage.getItem('enyayalaya_demo_user');
      if (demoRaw) {
        const parsedDemo = JSON.parse(demoRaw);
        if (parsedDemo && parsedDemo.role) {
          setUser(parsedDemo);
          setLoadingSession(false);
          return;
        }
      }
    } catch(e) {}

    // 1. Check active session on initial mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoadingSession(false);
      }
    }).catch(err => {
      console.error("getSession error:", err);
      if (isMounted) setLoadingSession(false);
    });

    // 2. Auth changes listener - only respond to explicit auth transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoadingSession(false);
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED')) {
        await fetchProfile(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Standardize Government Design Palette across all roles
  useEffect(() => {
    if (user && user.role) {
      const root = document.documentElement;
      root.style.setProperty('--bg', '#F4F3EF');
      root.style.setProperty('--bg-dark', '#F4F3EF');
      root.style.setProperty('--paper', '#FFFFFF');
      root.style.setProperty('--surface-dark', '#FFFFFF');
      root.style.setProperty('--surface-border', '#D6D2C4');
      root.style.setProperty('--line', '#D6D2C4');
      root.style.setProperty('--ink', '#1B2230');
      root.style.setProperty('--text-primary', '#1B2230');
      root.style.setProperty('--ink-soft', '#4B5566');
      root.style.setProperty('--text-secondary', '#4B5566');
      root.style.setProperty('--accent', '#8A1E23');
      root.style.setProperty('--accent-primary', '#8A1E23');
      root.style.setProperty('--accent-hover', '#70181C');
      root.style.setProperty('--danger', '#A31D1D');
      root.style.setProperty('--error', '#A31D1D');
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('enyayalaya_demo_user');
      localStorage.removeItem('enyayalaya_active_agency');
      localStorage.removeItem('enyayalaya_active_officer');
    } catch (e) {}
    try {
      await supabase.auth.signOut();
    } catch(e) {}
    setUser(null);
    navigate('/');
  };

  const handleLoginSuccess = (profile) => {
    if (profile) {
      try {
        localStorage.setItem('enyayalaya_demo_user', JSON.stringify(profile));
      } catch(e) {}
      setUser((prev) => ({
        ...(prev || {}),
        ...profile,
        role: profile.role || 'police_officer',
        full_name: profile.full_name || 'Official User'
      }));
    }
  };

  if (loadingSession) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: 'var(--bg)', color: 'var(--ink)', flexDirection: 'column', gap: '1rem' }}>
        <Loader className="animate-spin text-accent" size={48} color="var(--accent)" />
        <p style={{ letterSpacing: '0.05em', color: 'var(--ink-soft)', fontWeight: 600 }}>Restoring Secure e-Courts Session...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <GigwHeader />
      
      <div className="app-layout" style={{ flex: 1, height: 'calc(100vh - 42px)' }}>
        <Sidebar 
          user={user} 
          onLogout={handleLogout} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <div className="main-content">
          <Topbar 
            user={user} 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onSwitchRole={handleSwitchDemoRole}
          />
          
          <main id="main-content" role="main" tabIndex="-1" style={{ padding: '1.5rem', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/create-case" element={<CreateCase user={user} />} />
              <Route path="/upload" element={<UploadScanner user={user} />} />
              <Route path="/cases/:id" element={<CaseTimeline user={user} />} />
              <Route path="/case/:id" element={<CaseTimeline user={user} />} />
              <Route path="/audit" element={<AuditLogs user={user} />} />
              <Route path="/court" element={<CourtSessions user={user} />} />
              {/* Fallbacks */}
              <Route path="*" element={<div className="flex-center" style={{height:'100%', color:'var(--text-secondary)'}}>Coming Soon</div>} />
            </Routes>
          </main>
          
          <GigwFooter />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
