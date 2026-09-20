import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Scale, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CourtSessions({ user }) {
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [disposedCases, setDisposedCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('court_sessions')
          .select(`
            *,
            case:cases(title, case_number, stage)
          `)
          .eq('court_org_id', user.org_id)
          .order('scheduled_at', { ascending: true });

        if (sessionError) throw sessionError;
        
        const { data: caseData, error: caseError } = await supabase
          .from('cases')
          .select('id, title, case_number, stage, updated_at')
          .eq('court_org_id', user.org_id)
          .eq('stage', 'disposed');
          
        if (caseError) throw caseError;

        const now = new Date();
        const upcoming = [];
        const past = [];

        (sessionData || []).forEach(session => {
          if (new Date(session.scheduled_at) > now) {
            upcoming.push(session);
          } else {
            // Only push if case is not disposed, to avoid duplicates in the UI
            if (session.case?.stage !== 'disposed') {
              past.push(session);
            }
          }
        });

        // Sort past sessions descending
        past.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

        setUpcomingSessions(upcoming);
        setPastSessions(past);
        
        // Sort disposed cases
        const disposed = (caseData || []).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        setDisposedCases(disposed);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user.role === 'judge' || user.role === 'court_clerk') {
      fetchSessions();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (user.role !== 'judge' && user.role !== 'court_clerk') {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-soft)' }}>You do not have access to Court Sessions.</div>;
  }

  return (
    <div className="animate-in" style={{ width: '100%' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--paper)', padding: '1.25rem', borderRadius: '2px', border: '1px solid var(--line)', borderTop: '3px solid var(--accent)' }}>
        <div style={{ background: '#EFECE6', padding: '0.65rem', borderRadius: '2px' }}>
          <Scale size={28} color="var(--accent)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}>Daily Judicial Cause List & Court Sessions</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>Manage scheduled hearings, witness examinations, and concluded docket archives.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        
        {/* Upcoming Sessions */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--ink)', fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>
            <Calendar size={18} color="var(--accent)" /> Upcoming Scheduled Hearings
          </h3>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            {loading ? (
              <div style={{ color: 'var(--ink-soft)' }}>Loading cause list...</div>
            ) : upcomingSessions.length === 0 ? (
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>No upcoming hearings currently listed.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcomingSessions.map(session => (
                  <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#FAF9F6', borderRadius: '2px', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '0.2rem', color: 'var(--ink)' }}>{session.case?.title || 'Unknown Case'}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Case No: <strong style={{ color: 'var(--accent)' }}>{session.case?.case_number || 'Pending'}</strong></span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--bg-band)', fontWeight: 700, fontSize: '0.88rem' }}>{new Date(session.scheduled_at).toLocaleString('en-IN')}</div>
                      <Link to={`/cases/${session.case_id}`} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', marginTop: '0.35rem', display: 'inline-block' }}>Open Case File</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Past Sessions */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--ink)', fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>
            <Clock size={18} color="var(--ink-soft)" /> Past Hearings (Active Proceedings)
          </h3>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            {loading ? (
              <div style={{ color: 'var(--ink-soft)' }}>Loading...</div>
            ) : pastSessions.length === 0 ? (
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>No past hearings recorded.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pastSessions.map(session => (
                  <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#FFFFFF', borderRadius: '2px', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.2rem', color: 'var(--ink)' }}>{session.case?.title || 'Unknown Case'}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>Conducted On: {new Date(session.scheduled_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div>
                      <Link to={`/cases/${session.case_id}`} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}>Review Record</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Disposed Cases */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--ink)', fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>
            <CheckCircle size={18} color="var(--success)" /> Concluded & Disposed Dockets
          </h3>
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
            {loading ? (
              <div style={{ color: 'var(--ink-soft)' }}>Loading...</div>
            ) : disposedCases.length === 0 ? (
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>No closed dockets.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {disposedCases.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#FAF9F6', borderRadius: '2px', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.2rem', color: 'var(--ink)' }}>
                        {c.title} <span className="badge badge-success" style={{ marginLeft: '0.4rem', fontSize: '0.62rem' }}>DISPOSED</span>
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>Case No: {c.case_number || 'N/A'} | Disposed On: {new Date(c.updated_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div>
                      <Link to={`/cases/${c.id}`} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}>View Judgement</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
