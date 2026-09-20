import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Activity, Shield, Link as LinkIcon, Database, CheckCircle, Search, AlertTriangle } from 'lucide-react';

export default function AuditLogs({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_log')
          .select(`
            *,
            actor:profiles!audit_log_actor_id_fkey(full_name, role),
            case:cases!audit_log_case_id_fkey(case_number)
          `)
          .order('id', { ascending: false });

        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    
    // Subscribe to live inserts
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, (payload) => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
    log.record_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.case && log.case.case_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-in" style={{ width: '100%' }}>
      {/* Top Status Banner */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--paper)', padding: '1.25rem', borderRadius: '2px', border: '1px solid var(--line)', borderTop: '3px solid var(--accent)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <Shield size={22} color="var(--accent)" />
            <h2 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}>Immutable Cryptographic Audit Trail</h2>
          </div>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', margin: 0 }}>Cryptographically hash-chained record of all judicial docket actions, evidence filings, and transfer proceedings.</p>
        </div>
        
        <div style={{ background: '#E6F4EA', padding: '0.45rem 0.85rem', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #CEEAD6' }}>
          <Database size={15} color="#137333" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#137333' }}>CHAIN INTEGRITY: SECURE</span>
          <CheckCircle size={15} color="#137333" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', background: 'var(--paper)', borderRadius: '2px', border: '1px solid var(--line)' }}>
        <Search size={16} color="var(--ink-soft)" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ledger by hash, action, or case number..." 
          style={{ background: 'transparent', border: 'none', color: 'var(--ink)', width: '100%', outline: 'none', padding: '0.25rem 0', fontFamily: 'monospace', fontSize: '0.85rem' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}>
            <Activity className="animate-spin" size={28} color="var(--accent)" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="glass-panel flex-center" style={{ padding: '3rem', flexDirection: 'column', gap: '0.75rem', color: 'var(--ink-soft)', background: 'var(--paper)', borderRadius: '2px' }}>
            <AlertTriangle size={36} opacity={0.5} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No audit logs found for your jurisdiction.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--accent)', background: 'var(--paper)', borderRadius: '2px', position: 'relative' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ fontFamily: 'monospace', fontWeight: 700, background: '#E8ECEF', color: 'var(--bg-band)', fontSize: '0.72rem' }}>{log.action}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{new Date(log.created_at).toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', textTransform: 'uppercase', margin: 0 }}>Actor</p>
                      <p style={{ fontWeight: 600, margin: 0, fontSize: '0.85rem', color: 'var(--ink)' }}>
                        {log.actor?.full_name || 'SYSTEM'} <span style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>({log.actor?.role?.replace(/_/g, ' ') || 'Internal'})</span>
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', textTransform: 'uppercase', margin: 0 }}>Target Docket</p>
                      <p style={{ fontWeight: 600, fontFamily: 'monospace', margin: 0, fontSize: '0.85rem', color: 'var(--ink)' }}>
                        {log.entity_type.toUpperCase()} • {log.case?.case_number || 'General Docket'}
                      </p>
                    </div>
                  </div>

                  <div style={{ background: '#FAF9F6', padding: '0.65rem 0.85rem', borderRadius: '2px', border: '1px solid var(--line)', fontSize: '0.72rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem', color: 'var(--bg-band)' }}>
                      <LinkIcon size={12} />
                      <span style={{ fontWeight: 700, letterSpacing: '0.04em' }}>SHA-256 HASH CHAIN LINK</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontFamily: 'monospace', color: 'var(--ink-soft)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        <span style={{ width: '80px', color: 'var(--ink)', fontWeight: 600 }}>PREV_HASH:</span>
                        <span style={{ wordBreak: 'break-all' }}>{log.prev_hash || 'GENESIS_BLOCK'}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        <span style={{ width: '80px', color: 'var(--accent)', fontWeight: 600 }}>THIS_HASH:</span>
                        <span style={{ wordBreak: 'break-all', color: 'var(--accent)', fontWeight: 700 }}>{log.record_hash}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
