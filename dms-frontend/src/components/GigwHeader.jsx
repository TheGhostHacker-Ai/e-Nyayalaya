import React, { useState, useEffect } from 'react';
import { Eye, Globe, Type, Sun, Moon, Scale } from 'lucide-react';

export default function GigwHeader() {
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // -1: small, 0: normal, 1: large
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [language, setLanguage] = useState('en');

  // Font Size Adjuster Handler
  const handleFontSizeChange = (delta) => {
    let newLevel = delta === 0 ? 0 : Math.max(-1, Math.min(2, fontSizeLevel + delta));
    setFontSizeLevel(newLevel);
    
    const root = document.documentElement;
    if (newLevel === -1) {
      root.style.fontSize = '14px';
    } else if (newLevel === 0) {
      root.style.fontSize = '16px';
    } else if (newLevel === 1) {
      root.style.fontSize = '18px';
    } else if (newLevel === 2) {
      root.style.fontSize = '20px';
    }
  };

  // High Contrast Mode Handler
  const toggleContrast = () => {
    setIsHighContrast(!isHighContrast);
    const root = document.documentElement;
    if (!isHighContrast) {
      root.classList.add('gigw-high-contrast');
      root.setAttribute('data-contrast', 'high');
    } else {
      root.classList.remove('gigw-high-contrast');
      root.removeAttribute('data-contrast');
    }
  };

  return (
    <header role="banner" className="gigw-header-container">
      {/* Skip to main content link (GIGW Mandatory) */}
      <a href="#main-content" className="gigw-skip-link">
        {language === 'hi' ? 'मुख्य सामग्री पर जाएं' : 'Skip to main content'}
      </a>

      {/* Tricolor National Stripe */}
      <div className="gigw-tricolor-stripe" aria-hidden="true">
        <div style={{ flex: 1, backgroundColor: '#FF9933', height: '3px' }}></div>
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', height: '3px' }}></div>
        <div style={{ flex: 1, backgroundColor: '#138808', height: '3px' }}></div>
      </div>

      {/* Top Accessibility & Identity Bar */}
      <div className="gigw-topbar">
        {/* National Identity */}
        <div className="gigw-identity flex-center" style={{ gap: '0.75rem', justifyContent: 'flex-start' }}>
          <div className="gigw-emblem" aria-label="National Judiciary Scale" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', border: '1.5px solid rgba(197, 155, 39, 0.6)', borderRadius: '50%', background: 'rgba(14, 42, 71, 0.8)' }}>
            <Scale size={22} color="#C59B27" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>भारत सरकार</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span>Government of India</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#CCD4DC' }}>
              {language === 'hi' ? 'विधि एवं न्याय मंत्रालय | न्याय विभाग' : 'Ministry of Law and Justice | Department of Justice'}
            </div>
          </div>
        </div>

        {/* Accessibility Toolbar (GIGW Mandatory) */}
        <div className="gigw-access-tools flex-center" style={{ gap: '0.75rem' }}>
          {/* Screen Reader Info */}
          <button 
            type="button"
            className="gigw-tool-btn" 
            title="Screen Reader Access"
            aria-label="Screen Reader Access"
            onClick={() => alert("Screen Reader Access: This portal adheres to WCAG 2.1 Level AA and GIGW 3.0 accessibility standards. All interactive elements provide accessible ARIA labels.")}
          >
            <Eye size={13} />
            <span className="hide-mobile">Screen Reader</span>
          </button>

          {/* Text Resizer */}
          <div className="gigw-font-resizer flex-center" role="group" aria-label="Font Size Adjustments">
            <button 
              type="button"
              className={`gigw-tool-btn ${fontSizeLevel === -1 ? 'active' : ''}`}
              title="Decrease Font Size" 
              aria-label="Decrease Font Size"
              onClick={() => handleFontSizeChange(-1)}
            >
              A-
            </button>
            <button 
              type="button"
              className={`gigw-tool-btn ${fontSizeLevel === 0 ? 'active' : ''}`}
              title="Normal Font Size" 
              aria-label="Normal Font Size"
              onClick={() => handleFontSizeChange(0)}
            >
              A
            </button>
            <button 
              type="button"
              className={`gigw-tool-btn ${fontSizeLevel >= 1 ? 'active' : ''}`}
              title="Increase Font Size" 
              aria-label="Increase Font Size"
              onClick={() => handleFontSizeChange(1)}
            >
              A+
            </button>
          </div>

          {/* Contrast Mode Toggle */}
          <button 
            type="button"
            className={`gigw-tool-btn ${isHighContrast ? 'active' : ''}`} 
            title="Toggle High Contrast Mode"
            aria-label="Toggle High Contrast Mode"
            onClick={toggleContrast}
          >
            {isHighContrast ? <Sun size={13} /> : <Moon size={13} />}
            <span className="hide-mobile">{isHighContrast ? 'Normal Contrast' : 'High Contrast'}</span>
          </button>

          {/* Language Switcher */}
          <button 
            type="button"
            className="gigw-tool-btn" 
            title="Switch Language"
            aria-label="Language Selector"
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          >
            <Globe size={13} />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
