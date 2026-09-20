export const DEMO_ROLES = [
  {
    id: 'demo-judge',
    role: 'judge',
    label: 'District & Sessions Judge',
    shortLabel: 'Judge (District Court)',
    sublabel: 'District & Sessions Court, Lucknow',
    iconName: 'Scale',
    badgeColor: '#8A1E23',
    profile: {
      id: '00000000-0000-4000-a000-000000000001',
      email: 'judge.district@nyayalaya.gov.in',
      role: 'judge',
      full_name: "Hon'ble Rameshwar Nath Tripathi",
      designation: 'Principal District & Sessions Judge',
      badge_no: 'JUD-UP-104',
      org_name: 'District & Sessions Court, Lucknow',
      org_type: 'court_district',
      district: 'Lucknow',
      state: 'Uttar Pradesh'
    }
  },
  {
    id: 'demo-sho',
    role: 'police_officer',
    label: 'Police SHO (Station In-Charge)',
    shortLabel: 'Police SHO (Hazratganj)',
    sublabel: 'Hazratganj Police Station, Lucknow',
    iconName: 'Shield',
    badgeColor: '#1B5FB3',
    profile: {
      id: '00000000-0000-4000-a000-000000000002',
      email: 'sho.hazratganj@uppolice.gov.in',
      role: 'police_officer',
      full_name: 'Inspector Vikram Pratap Singh',
      designation: 'Station House Officer (SHO)',
      badge_no: 'UP-POL-8841',
      org_name: 'Hazratganj Police Station',
      org_type: 'police_station',
      district: 'Lucknow',
      state: 'Uttar Pradesh'
    }
  },
  {
    id: 'demo-io',
    role: 'investigating_officer',
    label: 'Investigating Officer (IO)',
    shortLabel: 'Investigating Officer (IO)',
    sublabel: 'Crime Branch / Thana Hazratganj',
    iconName: 'UserCheck',
    badgeColor: '#0E2A47',
    profile: {
      id: '00000000-0000-4000-a000-000000000003',
      email: 'io.crimebranch@uppolice.gov.in',
      role: 'investigating_officer',
      full_name: 'Sub-Inspector Ananya Sharma',
      designation: 'Investigating Officer (IO)',
      badge_no: 'UP-IO-4120',
      org_name: 'Hazratganj Police Station',
      org_type: 'police_station',
      district: 'Lucknow',
      state: 'Uttar Pradesh'
    }
  },
  {
    id: 'demo-highcourt',
    role: 'judge',
    label: 'High Court Appellate Judge',
    shortLabel: 'High Court Judge',
    sublabel: 'High Court Bench, Allahabad / Lucknow',
    iconName: 'Landmark',
    badgeColor: '#5C1D24',
    profile: {
      id: '00000000-0000-4000-a000-000000000004',
      email: 'judge.highcourt@allahabad.gov.in',
      role: 'judge',
      full_name: "Hon'ble Justice K. S. Venkatesh",
      designation: 'Senior Judge, Appellate Bench',
      badge_no: 'HC-BENCH-02',
      org_name: 'High Court of Judicature at Allahabad (Lucknow Bench)',
      org_type: 'high_court',
      district: 'Lucknow',
      state: 'Uttar Pradesh'
    }
  },
  {
    id: 'demo-agency',
    role: 'agency_admin',
    label: 'Special Agency Lead (CBI / NIA)',
    shortLabel: 'Agency Lead (CBI)',
    sublabel: 'Central Bureau of Investigation HQ',
    iconName: 'Building2',
    badgeColor: '#1B2230',
    profile: {
      id: '00000000-0000-4000-a000-000000000005',
      email: 'cbi.hq@cbi.gov.in',
      role: 'agency_admin',
      full_name: 'Rajeev Menon, IPS',
      designation: 'Joint Director & Special Supervisory Lead',
      badge_no: 'IPS-CBI-1092',
      org_name: 'Central Bureau of Investigation (CBI)',
      org_type: 'agency',
      district: 'National Special Wing',
      state: 'National'
    }
  },
  {
    id: 'demo-counsel',
    role: 'lawyer',
    label: 'Public Prosecutor / Defense Counsel',
    shortLabel: 'Legal Counsel / Advocate',
    sublabel: 'High Court & Bar Council of India',
    iconName: 'FileText',
    badgeColor: '#137333',
    profile: {
      id: '00000000-0000-4000-a000-000000000006',
      email: 'counsel.advocate@barcouncil.gov.in',
      role: 'lawyer',
      full_name: 'Advocate Siddharth Malhotra',
      designation: 'Senior Advocate on Record',
      badge_no: 'BCI-UP-5542',
      org_name: 'High Court Bar Association',
      org_type: 'legal_bar',
      district: 'Lucknow',
      state: 'Uttar Pradesh'
    }
  }
];

export async function loginWithDemoRole(demo, supabase, onLogin) {
  try {
    let orgId = null;
    if (demo.profile.org_name) {
      try {
        const { data: existingOrg } = await supabase
          .from('organisations')
          .select('id')
          .eq('name', demo.profile.org_name)
          .maybeSingle();

        if (existingOrg) {
          orgId = existingOrg.id;
        } else {
          const { data: newOrg } = await supabase
            .from('organisations')
            .insert([{
              name: demo.profile.org_name,
              code: `DEMO_${demo.profile.role.toUpperCase()}_${Math.floor(100 + Math.random() * 900)}`,
              org_type: demo.profile.org_type || 'court',
              district: demo.profile.district || 'Lucknow',
              state: demo.profile.state || 'Uttar Pradesh'
            }])
            .select('id')
            .single();
          if (newOrg) orgId = newOrg.id;
        }
      } catch (e) {
        console.warn("Demo org verification fallback:", e);
      }
    }

    const fullProfile = {
      ...demo.profile,
      org_id: orgId || demo.profile.org_id || null
    };

    try {
      await supabase.from('profiles').upsert([{
        id: fullProfile.id,
        email: fullProfile.email,
        full_name: fullProfile.full_name,
        role: fullProfile.role,
        designation: fullProfile.designation,
        badge_no: fullProfile.badge_no || '',
        org_id: fullProfile.org_id,
        status: 'approved'
      }]);
    } catch (e) {
      console.warn("Demo profile upsert fallback:", e);
    }

    try {
      localStorage.setItem('enyayalaya_demo_user', JSON.stringify(fullProfile));
      if (fullProfile.role === 'agency_admin') {
        localStorage.setItem('enyayalaya_active_agency', JSON.stringify(fullProfile));
        localStorage.removeItem('enyayalaya_active_officer');
      } else if (fullProfile.role === 'agency_officer') {
        localStorage.setItem('enyayalaya_active_officer', JSON.stringify(fullProfile));
        localStorage.removeItem('enyayalaya_active_agency');
      } else {
        localStorage.removeItem('enyayalaya_active_agency');
        localStorage.removeItem('enyayalaya_active_officer');
      }
    } catch (e) {}

    if (onLogin) onLogin(fullProfile);
    return fullProfile;
  } catch (err) {
    console.error("Demo login error:", err);
    if (onLogin) onLogin(demo.profile);
    return demo.profile;
  }
}
