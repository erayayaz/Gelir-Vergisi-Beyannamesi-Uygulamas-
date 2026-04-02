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
          <p className="text-xs text-muted" style={{ textAlign: 'center' }}>
            Bu araç 2025 yılı GVK Md. 86, 103 ve 23/18 hükümlerine göre hazırlanmıştır.
            Sonuçlar bilgi amaçlıdır — resmi beyan için GİB Hazır Beyan sistemini ve bir mali müşaviri kullanınız.
          </p>
        </div>
      </footer>
    </>
  );
}
