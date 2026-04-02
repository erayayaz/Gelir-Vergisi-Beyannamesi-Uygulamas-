import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useTaxStore from './store/useTaxStore.js';

const STEPS = [
  { num: 1, label: 'Yükle', path: '/' },
  { num: 2, label: 'Doğrula', path: '/dogrulama' },
  { num: 3, label: 'Sonuç', path: '/sonuc' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const records = useTaxStore(s => s.records);

  const currentStep =
    location.pathname === '/sonuc' ? 3 :
    location.pathname === '/dogrulama' ? 2 : 1;

  return (
    <>
      <header className="app-header">
        <div className="container">
          <div className="header-inner">
            <a className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <div className="logo-icon">📊</div>
              <div>
                <div className="logo-text">GV Yardımcısı</div>
                <div className="logo-subtitle">2025 Gelir Vergisi Beyannamesi</div>
              </div>
            </a>

            <div className="step-indicator">
              {STEPS.map((step, i) => (
                <React.Fragment key={step.num}>
                  <div className={`step-dot ${currentStep === step.num ? 'active' : currentStep > step.num ? 'done' : ''}`}>
                    {currentStep > step.num ? '✓' : step.num}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`step-line ${currentStep > step.num ? 'done' : ''}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="badge badge-blue">{records.length} bordro</span>
            </div>
          </div>
        </div>
      </header>

      <main className="page">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 0', marginTop: 'auto' }}>
        <div className="container">
          <p className="text-xs text-muted" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Bu araç 2025 yılı GVK Md. 86, 103 ve 23/18 hükümlerine göre hazırlanmıştır.
            Sonuçlar bilgi amaçlıdır — resmi beyan için GİB Hazır Beyan sistemini ve bir mali müşaviri kullanınız.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', alignItems: 'center' }}>
            <a href="https://github.com/erayayaz" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', textDecoration: 'none', transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity=0.7} onMouseOut={e=>e.currentTarget.style.opacity=1}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm">GitHub</span>
            </a>
            <a href="https://x.com/erayayazz" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', textDecoration: 'none', transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity=0.7} onMouseOut={e=>e.currentTarget.style.opacity=1}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-sm">Twitter</span>
            </a>
            <a href="https://www.instagram.com/erayayazz/" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', textDecoration: 'none', transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity=0.7} onMouseOut={e=>e.currentTarget.style.opacity=1}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.344 3.608 1.319.975.975 1.257 2.242 1.319 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.344 2.633-1.319 3.608-.975.975-2.242 1.257-3.608 1.319-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.344-3.608-1.319-.975-.975-1.257-2.242-1.319-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.344-2.633 1.319-3.608.975-.975 2.242-1.257 3.608-1.319 1.266-.058 1.646-.07 4.85-.07m0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.947.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.947s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.947-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="text-sm">Instagram</span>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
