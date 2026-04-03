import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTaxStore from '../store/useTaxStore.js';
import { fmtTL, formatPeriod } from '../utils/formatters.js';
import { checkDeclarationRequired } from '../services/taxCalculator.js';

export default function ValidationPage() {
  const navigate = useNavigate();
  const records = useTaxStore(s => s.records);
  const employers = useTaxStore(s => s.employers);
  const updateRecord = useTaxStore(s => s.updateRecord);
  const setPrimaryEmployer = useTaxStore(s => s.setPrimaryEmployer);
  const primaryEmployerKey = useTaxStore(s => s.primaryEmployerKey);

  const [editingIdx, setEditingIdx] = useState(null);
  const [editValues, setEditValues] = useState({});

  if (records.length === 0) {
    return (
      <div className="animate-in" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
        <h2>Henüz bordro yüklenmedi</h2>
        <p className="mt-1">Lütfen önce bordro PDF'i yükleyin.</p>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>← Yükleme sayfasına dön</button>
      </div>
    );
  }

  const startEdit = (idx) => {
    setEditingIdx(idx);
    const r = records[idx];
    setEditValues({
      employerName: r.employerName || '',
      gvTaxBase: r.gvTaxBase || 0,
      incomeTax: r.incomeTax || 0,
      grossSalary: r.grossSalary || 0,
      sgkEmployee: r.sgkEmployee || 0,
      unemploymentIns: r.unemploymentIns || 0,
      minWageExemption: r.minWageExemption || 0,
      stampTax: r.stampTax || 0,
    });
  };

  const saveEdit = (idx) => {
    const updates = {};
    for (const [k, v] of Object.entries(editValues)) {
      updates[k] = typeof v === 'string' && !isNaN(parseFloat(v.replace(',', '.')))
        ? parseFloat(v.toString().replace(/\./g, '').replace(',', '.'))
        : v;
    }
    updateRecord(idx, { ...updates, parseStatus: 'success', warnings: [] });
    setEditingIdx(null);
  };

      const effectivePrimary = primaryEmployerKey || (employers[0]?.key);
      
      const declarationPreviews = {};
      if (employers.length > 1) {
        employers.forEach(emp => {
          declarationPreviews[emp.key] = checkDeclarationRequired(employers, emp.key);
        });
      }

      return (
        <div className="animate-in">
          <div className="section-header">
            <h2>📋 Verileri Doğrula ve Düzenle</h2>
            <p>Parse edilen bordro verilerini kontrol edin. Hatalı alanları tıklayarak düzeltebilirsiniz.</p>
          </div>

      {/* 1. İşveren Seçimi */}
      {employers.length > 1 && (
        <div className="card mb-3">
          <h3 style={{ marginBottom: '0.75rem' }}>1. İşveren Seçimi <span className="badge badge-amber" style={{ marginLeft: '0.5rem' }}>Önemli</span></h3>
          <p className="text-sm mb-2">
            GVK Md. 86'ya göre birden fazla işverenden ücret aldıysanız, 1. işvereni siz belirleyebilirsiniz.
            Hangi işvereni 1. işveren seçtiğiniz beyanname verme zorunluluğunuzu (330.000 TL aşım kuralı) değiştirebilir. Karşılaştırmalı görünüme göre seçiminizi yapabilirsiniz.
          </p>
          <div className="alert alert-info mb-2 text-xs" style={{ padding: '0.5rem 0.75rem' }}>
            <strong>💡 İpucu:</strong> Yıl içinde iş değiştirdiyseniz (örn. önce Google, sonra Microsoft), kronolojik olarak ilk başladığınız firmayı 1. işveren seçmeniz GİB form mantığına daha uygundur.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {employers.map(emp => {
              const preview = declarationPreviews[emp.key];
              return (
              <label
                key={emp.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.8rem 1rem',
                  background: effectivePrimary === emp.key ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary)',
                  border: `1px solid ${effectivePrimary === emp.key ? 'var(--border-accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'var(--transition)',
                }}
              >
                <input
                  type="radio"
                  name="primaryEmployer"
                  checked={effectivePrimary === emp.key}
                  onChange={() => setPrimaryEmployer(emp.key)}
                  style={{ accentColor: 'var(--accent-blue)' }}
                />
                <div style={{ flex: 1 }}>
                  <div className="font-bold text-sm">{emp.employerName}</div>
                  <div className="text-xs text-muted">{emp.months} ay</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue">{fmtTL(emp.annualTaxBase)}</div>
                  <div className="text-xs text-muted mb-1">Yıllık GV Matrahı</div>
                  {preview && (
                      <div className={`text-xs font-bold ${preview.required ? 'text-red' : 'text-green'}`}>
                        {preview.required ? '⚠ Beyan Zorunlu' : '✓ Beyan Gerekmiyor'}
                      </div>
                  )}
                </div>
                {effectivePrimary === emp.key && <span className="badge badge-blue">Kullanımda</span>}
              </label>
            )})}
          </div>
        </div>
      )}

      {/* Records table */}
      <div className="card mb-3">
        <h3 style={{ marginBottom: '1rem' }}>Bordro Detayları ({records.length} kayıt)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dönem</th>
                <th>İşveren</th>
                <th className="text-right">GV Matrahı</th>
                <th className="text-right">Kesilen GV</th>
                <th className="text-right">Brüt</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, idx) => (
                editingIdx === idx ? (
                  <tr key={idx} style={{ background: 'rgba(59,130,246,0.05)' }}>
                    <td colSpan={8} style={{ padding: '1rem' }}>
                      <div className="grid-2" style={{ gap: '0.75rem' }}>
                        <div>
                          <div className="text-xs text-muted mb-1">İşveren Adı</div>
                          <input className="input" value={editValues.employerName}
                            onChange={e => setEditValues(p => ({ ...p, employerName: e.target.value }))} />
                        </div>
                        <div>
                          <div className="text-xs text-muted mb-1">GV Matrahı (TL) ⭐</div>
                          <input className="input" type="number" value={editValues.gvTaxBase}
                            onChange={e => setEditValues(p => ({ ...p, gvTaxBase: e.target.value }))} />
                        </div>
                        <div>
                          <div className="text-xs text-muted mb-1">Kesilen Gelir Vergisi (TL) ⭐</div>
                          <input className="input" type="number" value={editValues.incomeTax}
                            onChange={e => setEditValues(p => ({ ...p, incomeTax: e.target.value }))} />
                        </div>
                        <div>
                          <div className="text-xs text-muted mb-1">Brüt Ücret (TL)</div>
                          <input className="input" type="number" value={editValues.grossSalary}
                            onChange={e => setEditValues(p => ({ ...p, grossSalary: e.target.value }))} />
                        </div>
                        <div>
                          <div className="text-xs text-muted mb-1">SGK İşçi Payı (TL)</div>
                          <input className="input" type="number" value={editValues.sgkEmployee}
                            onChange={e => setEditValues(p => ({ ...p, sgkEmployee: e.target.value }))} />
                        </div>
                        <div>
                          <div className="text-xs text-muted mb-1">İşsizlik Sigortası (TL)</div>
                          <input className="input" type="number" value={editValues.unemploymentIns}
                            onChange={e => setEditValues(p => ({ ...p, unemploymentIns: e.target.value }))} />
                        </div>
                        <div>
                          <div className="text-xs text-muted mb-1">Asgari Ücret İstisna (TL)</div>
                          <input className="input" type="number" value={editValues.minWageExemption}
                            onChange={e => setEditValues(p => ({ ...p, minWageExemption: e.target.value }))} />
                        </div>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <button className="btn btn-success" onClick={() => saveEdit(idx)}>💾 Kaydet</button>
                        <button className="btn btn-ghost" onClick={() => setEditingIdx(null)}>İptal</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={idx}>
                    <td>{formatPeriod(rec.year, rec.month)}</td>
                    <td className="td-primary" style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.employerName}
                    </td>
                    <td className="td-number">{fmtTL(rec.gvTaxBase)}</td>
                    <td className="td-number text-red">{fmtTL(rec.incomeTax)}</td>
                    <td className="td-number text-muted">{fmtTL(rec.grossSalary)}</td>
                    <td>
                      <span className={`badge ${
                        rec.parseStatus === 'success' ? 'badge-green' :
                        rec.parseStatus === 'partial' ? 'badge-amber' : 'badge-red'
                      }`}>
                        {rec.parseStatus === 'success' ? '✓ Tamam' :
                         rec.parseStatus === 'partial' ? '⚠ Kısmi' : '✗ Hata'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => startEdit(idx)}>✏️</button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employer summary */}
      <div className="card mb-3">
        <h3 style={{ marginBottom: '1rem' }}>İşveren Bazlı Yıllık Özet</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>İşveren</th>
                <th className="text-right">Süre (Ay)</th>
                <th className="text-right">Yıllık Brüt</th>
                <th className="text-right">Toplam GV Matrahı</th>
                <th className="text-right">Toplam Kesilen GV</th>
              </tr>
            </thead>
            <tbody>
              {employers.map(emp => (
                <tr key={emp.key}>
                  <td>
                    <div className="font-bold">{emp.employerName}</div>
                    {(primaryEmployerKey || employers[0]?.key) === emp.key && (
                      <span className="badge badge-blue" style={{ marginTop: '0.25rem' }}>1. İşveren</span>
                    )}
                  </td>
                  <td className="td-number">{emp.months}</td>
                  <td className="td-number">{fmtTL(emp.annualGross)}</td>
                  <td className="td-number td-primary">{fmtTL(emp.annualTaxBase)}</td>
                  <td className="td-number text-red">{fmtTL(emp.annualTaxWithheld)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700, background: 'var(--bg-secondary)' }}>
                <td>TOPLAM</td>
                <td className="td-number">{employers.reduce((s, e) => s + e.months, 0)}</td>
                <td className="td-number">{fmtTL(employers.reduce((s, e) => s + e.annualGross, 0))}</td>
                <td className="td-number td-primary">{fmtTL(employers.reduce((s, e) => s + e.annualTaxBase, 0))}</td>
                <td className="td-number text-red">{fmtTL(employers.reduce((s, e) => s + e.annualTaxWithheld, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← Geri</button>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/sonuc')}>
          Hesapla ve Sonuçları Gör →
        </button>
      </div>
    </div>
  );
}
