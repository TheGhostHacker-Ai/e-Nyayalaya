import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertTriangle, FileText, Lock, Shield } from 'lucide-react';

export default function UploadScanner() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selected);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setProcessing(true);
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('case_id', 1); // Mock case ID
    
    try {
      const res = await axios.post('http://localhost:3000/api/documents/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      console.error("Upload error", err);
      alert("Error processing document");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container animate-in" style={{ maxWidth: '850px', padding: '1rem' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--paper)', padding: '1.25rem', borderRadius: '2px', border: '1px solid var(--line)', borderTop: '3px solid var(--accent)' }}>
        <div style={{ background: '#EFECE6', padding: '0.65rem', borderRadius: '2px' }}>
          <UploadCloud size={28} color="var(--accent)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}>Digital Evidence & Document Ingestion Portal</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>Automated optical character recognition (OCR), legal classification, and cryptographic SHA-256 ledger registration.</p>
        </div>
      </div>

      {!result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <label className="glass-panel flex-center" style={{ 
            minHeight: '230px', 
            borderStyle: 'dashed', 
            borderWidth: '1.5px',
            borderColor: preview ? 'var(--accent)' : 'var(--line)',
            background: '#FAF9F6',
            borderRadius: '2px',
            flexDirection: 'column',
            gap: '0.75rem',
            cursor: 'pointer',
            overflow: 'hidden',
            position: 'relative',
            padding: '1.5rem'
          }}>
            <input type="file" accept="image/*,application/pdf" hidden onChange={handleFileChange} />
            {preview ? (
               <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '200px' }} />
            ) : (
              <>
                <div style={{ background: '#EFECE6', padding: '0.85rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={32} color="var(--bg-band)" />
                </div>
                <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0, fontSize: '0.95rem' }}>Click or drag to select document</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: 0 }}>Accepts FIRs, Witness Statements, Forensic Reports, or Orders (PDF, PNG, JPG)</p>
              </>
            )}
          </label>

          <button 
            className="btn-primary" 
            style={{ width: '100%', padding: '0.6rem 1.5rem' }} 
            onClick={handleUpload}
            disabled={!file || processing}
          >
            {processing ? 'Performing OCR & Cryptographic Ledger Binding...' : 'Process & Ingest Document'}
          </button>
        </div>
      ) : (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)', background: 'var(--paper)', borderRadius: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <Lock size={18} color="var(--success)" />
              <h3 style={{ color: 'var(--success)', margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>Secured to Cryptographic Ledger</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', wordBreak: 'break-all', fontFamily: 'monospace', margin: 0 }}>
              SHA-256 Fingerprint: <strong style={{ color: 'var(--ink)' }}>{result.fileHash}</strong>
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--paper)', borderRadius: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>
                <FileText size={18} color="var(--accent)" /> Automatic Classification
              </h3>
              <span className="badge badge-success">{result.classification?.document_type}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: 0 }}>{result.classification?.reasoning}</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--paper)', borderRadius: '2px' }}>
             <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>
                {result.compliance?.is_compliant ? <CheckCircle color="var(--success)" size={18}/> : <AlertTriangle color="var(--warning)" size={18}/>}
                GIGW / Judicial Compliance Check
             </h3>
             <p style={{ fontSize: '0.85rem', color: 'var(--ink)', margin: '0.5rem 0' }}>{result.compliance?.notes}</p>
             
             {!result.compliance?.is_compliant && result.compliance?.missing_fields?.length > 0 && (
               <div style={{ background: '#FEF7E0', padding: '0.75rem', borderRadius: '2px', border: '1px solid #FEEFC3', marginTop: '0.5rem' }}>
                 <p style={{ fontSize: '0.8rem', color: '#B06000', fontWeight: 700, marginBottom: '0.35rem' }}>Missing Mandatory Statutory Fields:</p>
                 <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#B06000' }}>
                   {result.compliance.missing_fields.map((f, i) => <li key={i}>{f}</li>)}
                 </ul>
               </div>
             )}
          </div>
          
          <button className="btn-secondary" onClick={() => {setResult(null); setFile(null); setPreview(null);}} style={{ padding: '0.5rem 1.25rem' }}>
            Ingest Another Document
          </button>
        </div>
      )}
    </div>
  );
}
