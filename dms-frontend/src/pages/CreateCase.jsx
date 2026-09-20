import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FilePlus, Upload, FileText, Loader, Shield } from 'lucide-react';

export default function CreateCase({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [plaintiff, setPlaintiff] = useState('');
  const [defendant, setDefendant] = useState('');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState('');
  const [caseCategory, setCaseCategory] = useState('Criminal');
  const [isSensitive, setIsSensitive] = useState(false);
  const [firContent, setFirContent] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plaintiff || !defendant || !district || !firContent || !caseCategory) {
      setError("Please fill out all required fields.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 1. Insert the Case
      const autoTitle = `[${caseCategory.toUpperCase()}] ${plaintiff} vs ${defendant}`;

      const { data: newCase, error: caseError } = await supabase
        .from('cases')
        .insert([{
          title: autoTitle,
          plaintiff: plaintiff,
          defendant: defendant,
          description: description,
          district: district,
          case_category: caseCategory,
          is_sensitive: isSensitive,
          filed_by: user.id,
          police_org_id: user.org_id,
          stage: 'fir_registered'
        }])
        .select()
        .single();
        
      if (caseError) throw caseError;

      // 2. Insert the FIR Document
      const pseudoHash = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { error: docError } = await supabase
        .from('documents')
        .insert([{
          case_id: newCase.id,
          doc_type: 'fir',
          title: `Initial FIR - ${autoTitle}`,
          storage_path: file ? `evidence/${newCase.id}/${file.name}` : 'manual_entry',
          mime_type: file ? file.type : 'text/plain',
          size_bytes: file ? file.size : new Blob([firContent]).size,
          sha256: pseudoHash,
          status: 'verified',
          uploaded_by: user.id,
          ocr_text: firContent,
          ai_summary: `FIR officially registered. Details: ${firContent.substring(0, 150)}...`
        }]);

      if (docError) throw docError;

      // Navigate to the case timeline
      navigate(`/cases/${newCase.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in" style={{ width: '100%', maxWidth: '900px' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--paper)', padding: '1.25rem', borderRadius: '2px', border: '1px solid var(--line)', borderTop: '3px solid var(--accent)' }}>
        <div style={{ background: '#EFECE6', padding: '0.65rem', borderRadius: '2px' }}>
          <FilePlus size={26} color="var(--accent)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}>First Information Report (e-FIR) Filing</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>Formally register a new criminal or civil docket under BNSS / Bharatiya Nyaya Sanhita.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.75rem', background: 'var(--paper)', borderRadius: '2px', border: '1px solid var(--line)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'flex-start' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--ink)', fontSize: '0.82rem', fontWeight: 600 }}>
                Complainant / State (Plaintiff) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input 
                type="text" 
                className="input-field" 
                required
                placeholder="e.g. State of Uttar Pradesh / Complainant Name" 
                value={plaintiff}
                onChange={(e) => setPlaintiff(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--ink)', fontSize: '0.82rem', fontWeight: 600 }}>
                Accused / Opposing Party (Defendant) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input 
                type="text" 
                className="input-field" 
                required
                placeholder="e.g. Rahul Kumar / Unknown Persons" 
                value={defendant}
                onChange={(e) => setDefendant(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                District / Thana Jurisdiction <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input type="text" className="input-field" required value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Lucknow North" />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Case Category <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select className="input-field" value={caseCategory} onChange={e => setCaseCategory(e.target.value)} required>
                <option value="Criminal">Criminal (BNS)</option>
                <option value="Civil Dispute">Civil Dispute</option>
                <option value="Corporate">Corporate / Commercial</option>
                <option value="Family">Family / Matrimonial</option>
                <option value="Property">Property / Land</option>
                <option value="Cyber">Cybercrime</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>Brief Matter Description</label>
            <input type="text" className="input-field" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Armed robbery and extortion at market complex" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#FAF9F6', padding: '0.85rem 1rem', borderRadius: '2px', border: '1px solid var(--line)', borderLeft: '3px solid var(--danger)' }}>
            <input type="checkbox" id="sensitive" checked={isSensitive} onChange={e => setIsSensitive(e.target.checked)} style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }} />
            <div>
              <label htmlFor="sensitive" style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Mark as Highly Sensitive / In-Camera Record</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', margin: 0 }}>Restricts public docket access (mandatory for POCSO, Women Safety, or Classified Intelligence cases).</p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0.5rem 0' }} />

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="var(--accent)" /> Detailed FIR Statement / Narrative <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea 
              className="input-field" 
              required 
              rows={6}
              value={firContent} 
              onChange={e => setFirContent(e.target.value)} 
              placeholder="Enter the official details, sequence of events, IPC/BNS sections invoked, and particulars of witness..." 
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={16} color="var(--accent)" /> Supporting Document / Scanned Complaint (Optional)
            </label>
            <div className="input-field" style={{ position: 'relative', cursor: 'pointer', textAlign: 'center', border: '1.5px dashed var(--line)', padding: '1.5rem', background: '#FAF9F6' }}>
              <input 
                type="file" 
                onChange={e => setFile(e.target.files[0])} 
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
              />
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: 0 }}>{file ? file.name : "Click or drag scanned physical FIR / complaint PDF"}</p>
            </div>
          </div>

          {error && <div style={{ color: 'var(--danger)', background: '#FCE8E6', padding: '0.65rem 0.85rem', borderRadius: '2px', fontSize: '0.85rem', border: '1px solid #FAD2CF' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.6rem 1.5rem' }}>
              {loading ? <Loader className="animate-spin" size={16} /> : 'Register Docket & Lodge FIR'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
