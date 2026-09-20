import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, HelpCircle, FileText, Lock, Info, X } from 'lucide-react';

export default function GigwFooter() {
  const [modalPolicy, setModalPolicy] = useState(null);

  const policies = {
    privacy: {
      title: "Privacy Policy",
      content: "This official Government Document Management System does not collect personal information about you when you visit our portal unless you choose to register and provide that information. All data stored within case files is encrypted using SHA-256 cryptographic hashing and role-based access control."
    },
    copyright: {
      title: "Copyright Policy",
      content: "Material featured on this portal may be reproduced free of charge in any format or media without requiring specific permission, subject to the material being reproduced accurately and not being used in a derogatory manner or in a misleading context. Where the material is being published or issued to others, the source must be prominently acknowledged."
    },
    hyperlink: {
      title: "Hyperlinking Policy",
      content: "We do not object to you linking directly to the information that is hosted on this website and no prior permission is required for the same. However, we do not permit our pages to be loaded into frames on your site without explicit judicial authorization."
    },
    security: {
      title: "Security & Cryptographic Integrity Guidelines",
      content: "All documents, hearings, witness depositions, and forensic records submitted to this portal are backed by immutable audit logs, tamper-evident SHA-256 hashes, and cryptographically verified single-use access tokens complying with the Information Technology Act, 2000 and Digital Personal Data Protection Act."
    },
    terms: {
      title: "Terms of Use",
      content: "This portal is designed for authorized judicial benches, police departments, law enforcement agencies, and recognized legal counsel under the e-Courts Integrated Digital Legal Grid."
    }
  };

  return (
    <footer role="contentinfo" className="gigw-footer-container no-print">
      <div className="gigw-footer-top">
        <div className="gigw-footer-links flex-center" style={{ gap: '1.25rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setModalPolicy('privacy')} className="gigw-footer-link">
            Privacy Policy
          </button>
          <span className="gigw-divider">•</span>
          <button type="button" onClick={() => setModalPolicy('copyright')} className="gigw-footer-link">
            Copyright Policy
          </button>
          <span className="gigw-divider">•</span>
          <button type="button" onClick={() => setModalPolicy('hyperlink')} className="gigw-footer-link">
            Hyperlinking Policy
          </button>
          <span className="gigw-divider">•</span>
          <button type="button" onClick={() => setModalPolicy('security')} className="gigw-footer-link">
            Security & Integrity Guidelines
          </button>
          <span className="gigw-divider">•</span>
          <button type="button" onClick={() => setModalPolicy('terms')} className="gigw-footer-link">
            Terms & Conditions
          </button>
        </div>
      </div>

      <div className="gigw-footer-bottom">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'center', fontSize: '0.75rem', color: '#CCD4DC' }}>
          <div>
            Website Content Owned, Maintained and Updated by <strong style={{ color: '#FFFFFF' }}>Team ZeroDay, SIH (26190)</strong>.
          </div>
          <div>
            Designed, Developed and Hosted by <strong style={{ color: '#FFFFFF' }}>Team ZeroDay (SIH)</strong> | e-Courts Mission Mode Project.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#85E0A3', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
              <ShieldCheck size={14} /> GIGW 3.0 & W3C WCAG 2.1 AA Compliant
            </span>
            <span>•</span>
            <span>Last Reviewed & Updated: <strong>20-Sep-2026</strong></span>
            <span>•</span>
            <span>Portal Version: <strong>4.2.0-STQC</strong></span>
          </div>
        </div>
      </div>

      {/* Policy Modal */}
      {modalPolicy && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(14, 42, 71, 0.65)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div className="animate-in" style={{ width: '100%', maxWidth: '580px', padding: '1.75rem', background: '#FFFFFF', border: '1px solid #D6D2C4', borderTop: '4px solid #8A1E23', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #D6D2C4', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: '#1B2230', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>
                <FileText size={18} color="#8A1E23" /> {policies[modalPolicy]?.title}
              </h3>
              <button onClick={() => setModalPolicy(null)} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', border: 'none', background: 'transparent' }} aria-label="Close Policy Modal">
                <X size={18} />
              </button>
            </div>
            <p style={{ lineHeight: 1.6, fontSize: '0.88rem', color: '#4B5566', margin: '1rem 0' }}>
              {policies[modalPolicy]?.content}
            </p>
            <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
              <button onClick={() => setModalPolicy(null)} className="btn-primary" style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
