import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import useTaxStore from '../store/useTaxStore.js';
import { fmtTL, fmtNum, copyToClipboard } from '../utils/formatters.js';
import { TAX_CONSTANTS_2025 } from '../utils/taxConstants.js';

const C = TAX_CONSTANTS_2025;

export default function ResultPage() {
  const navigate = useNavigate();

  const employers = useTaxStore(s => s.employers);
  const declarationCheck = useTaxStore(s => s.declarationCheck);
  const taxBalance = useTaxStore(s => s.taxBalance);
  const gibTableRows = useTaxStore(s => s.gibTableRows);

  const indirimDetayi = useTaxStore(s => s.indirimDetayi);

  const [copiedRow, setCopiedRow] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!declarationCheck) {
    return (
      <div className="animate-in" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2>Önce veri doğrulaması yapın</h2>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/dogrulama')}>← Doğrulama sayfasına dön</button>
      </div>
    );
  }


  // ---- Excel Export ----
  const exportToExcel = () => {
    const wsData = [
      ['GİB Hazır Beyan — 3.B Ücret Gelirlerine İlişkin Bilgiler'],
      ['Hazırlama Tarihi:', new Date().toLocaleDateString('tr-TR')],
      [],
      ['Ücret Türü', 'Elde Edildiği Süre (Ay)', 'İşverenin Adı/Ünvanı', 'Ücretin Gayrisafi Tutarı (TL)', 'Ücretten İndirimler (TL)', 'Safi Ücret / Matrah (TL)', 'Kesilen Gelir Vergisi (TL)', '1. İşveren mi?'],
      ...gibTableRows.map(row => [
        row.ucretTuru,
        row.eldeSuresi,
        row.isverenAd,
        row.gayrisafiTutar,
        row.indirimler,   // 0,00
        row.safiUcret,
        row.kesilenGV,
        row.birinciIsverenMi ? 'EVET' : 'HAYIR',
      ]),
      [],
      ['TOPLAMLAR'],
      ['Beyana Tabi Gayrisafi Tutar', '', '', gibTableRows.reduce((s, r) => s + r.gayrisafiTutar, 0)],
      ['Toplam Kesilen Gelir Vergisi', '', '', gibTableRows.reduce((s, r) => s + r.kesilenGV, 0)],
      [],
      ['HESAPLAMA SONUCU'],
      ['Beyanname Gerekli mi?', declarationCheck.required ? 'EVET' : 'HAYIR'],
      ['Toplam Yıllık GV Matrahı (TL)', taxBalance.totalBase],
      ['Hesaplanan Brüt Gelir Vergisi (TL)', taxBalance.grossTax],
      ['Toplam Kesilen Gelir Vergisi (TL)', taxBalance.totalWithheld],
      ['Ödenecek (+) / İade Edilecek (-) Vergi (TL)', taxBalance.balance],
      [],
      ['UYARI: Bu hesaplama bilgi amaçlıdır. Resmi beyan için GİB Hazır Beyan sistemini kullanınız.'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 40 }, { wch: 8 }, { wch: 35 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GIB_Beyan_2025');
    XLSX.writeFile(wb, `GV_Beyan_2025_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ---- Copy row as tab-separated ----
  const copyRow = async (row, idx) => {
    const text = [
      row.ucretTuru,
      row.eldeSuresi,
      row.isverenAd,
      fmtNum(row.gayrisafiTutar),
      fmtNum(row.indirimler),
      fmtNum(row.safiUcret),
      fmtNum(row.kesilenGV),
    ].join('\t');
    await copyToClipboard(text);
    setCopiedRow(idx);
    setTimeout(() => setCopiedRow(null), 2000);
  };

  const copyAllRows = async () => {
    const header = 'Ücret Türü\tSüre(Ay)\tİşveren Adı\tGayrisafi Tutar\tİndirimler\tSafi Ücret\tKesilen GV';
    const rows = gibTableRows.map(r =>
      [r.ucretTuru, r.eldeSuresi, r.isverenAd,
       fmtNum(r.gayrisafiTutar), fmtNum(r.indirimler), fmtNum(r.safiUcret), fmtNum(r.kesilenGV)].join('\t')
    ).join('\n');
    await copyToClipboard(header + '\n' + rows);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="animate-in">

      {/* ---- Decision Banner ---- */}
      <div className={`decision-banner ${declarationCheck.required ? 'required' : 'not-required'} mb-3`}>
        <div className="decision-banner-icon">
          {declarationCheck.required ? '📋' : '✅'}
        </div>
        <div>
          <div className="decision-banner-title">
            {declarationCheck.required
              ? 'Yıllık Gelir Vergisi Beyannamesi VERİLMELİ'
              : 'Beyanname Verilmesi Gerekmiyor'}
          </div>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {declarationCheck.required
              ? declarationCheck.reasons.join(' • ')
              : '2025 yılı beyanname sınırları aşılmadı. Kesilen vergiler nihai verginizdir.'}
          </div>
          {declarationCheck.required && (
            <a
              href="https://hazirbeyan.gib.gov.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ marginTop: '0.5rem', display: 'inline-flex' }}
            >
              🌐 GİB Hazır Beyan Sistemini Aç →
            </a>
          )}
        </div>
      </div>

      {/* ---- GVK 86 Kontrol Detayları ---- */}
      <div className="card mb-3">
        <h3 style={{ marginBottom: '1rem' }}>📊 GVK Md. 86 Kontrol Sonuçları</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {declarationCheck.details.map(d => (
            <div key={d.id} className={`alert ${d.exceeded ? 'alert-error' : 'alert-success'}`}>
              <div className="alert-icon">{d.exceeded ? '🔴' : '🟢'}</div>
              <div>
                <div className="alert-title">{d.rule}</div>
                <div className="alert-body">{d.description}</div>
                <div className="alert-body" style={{ marginTop: '0.25rem' }}>
                  Sınır: {fmtTL(d.threshold)} · Hesaplanan: {fmtTL(d.value)}
                  {d.exceeded
                    ? <span className="text-red" style={{ marginLeft: '0.5rem' }}>⚠ SINIR AŞILDI</span>
                    : <span className="text-green" style={{ marginLeft: '0.5rem' }}>✓ Sınır içinde</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Vergi Özet Kartları ---- */}
      {declarationCheck.required && taxBalance && (
        <div className="grid-3 mb-3">
          <div className="stat-card">
            <div className="stat-label">Toplam GV Matrahı</div>
            <div className="stat-value neutral">{fmtTL(taxBalance.totalBase)}</div>
            <div className="text-xs text-muted mt-1">Vergi hesaplanacak tutardır</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Hesaplanan Brüt GV</div>
            <div className="stat-value">{fmtTL(taxBalance.grossTax)}</div>
            <div className="text-xs text-muted mt-1">{taxBalance.taxBracket}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">
              {taxBalance.isPayable ? '💸 Ödenecek Vergi' : '💰 İade Edilecek Vergi'}
            </div>
            <div className={`stat-value ${taxBalance.isPayable ? 'negative' : 'positive'}`}>
              {fmtTL(Math.abs(taxBalance.balance))}
            </div>
            <div className="text-xs text-muted mt-1">
              Kesilen GV: {fmtTL(taxBalance.totalWithheld)}
            </div>
          </div>
        </div>
      )}

      {/* ---- Vergi Dilimi Göstergesi ---- */}
      {taxBalance && (
        <div className="card mb-3">
          <h3 style={{ marginBottom: '1rem' }}>📈 GVK Md. 103 Tarife Dağılımı</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {C.brackets.filter(b => b.limitMax !== Infinity).map((bracket, i) => {
              const sliceMin = bracket.limitMin;
              const sliceMax = bracket.limitMax;
              const base = taxBalance.totalBase;
              const inBracket = Math.max(0, Math.min(base, sliceMax) - sliceMin);
              const isActive = base > sliceMin;
              const barPct = isActive ? Math.min(100, (inBracket / (sliceMax - sliceMin)) * 100) : 0;

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '80px', textAlign: 'right', fontSize: '0.78rem', fontWeight: 700, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    %{bracket.rate * 100}
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${barPct}%`, height: '100%',
                      background: `linear-gradient(90deg, var(--accent-blue), var(--accent-purple))`,
                      borderRadius: '4px', transition: 'width 0.8s ease',
                    }} />
                  </div>
                  <div style={{ width: '100px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {(sliceMin / 1000).toFixed(0)}K – {(sliceMax / 1000).toFixed(0)}K TL
                  </div>
                  <div style={{ width: '90px', fontSize: '0.78rem', color: isActive ? 'var(--accent-blue-light)' : 'var(--text-muted)', textAlign: 'right', fontWeight: 500 }}>
                    {isActive ? fmtTL(inBracket * bracket.rate) : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- GİB Hazır Beyan 3.B Çıktı Tablosu ---- */}
      <div className="card mb-3">
        <div className="flex items-center justify-between mb-2" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3>🏛️ GİB Hazır Beyan — 3.B Bölümü Satırları</h3>
            <p className="text-xs text-muted mt-1">
              Her satırı GİB Hazır Beyan sistemine tek tek veya tümünü kopyalayarak girin.
              <br/>
              <span style={{ color: 'var(--accent-yellow, #f4ac32)', fontWeight: 600 }}>
                ⚠ İndirimler (SGK, İşsizlik, Özel Sigorta) GİB'te ayrı bir "İndirimler" modaline girilir — bu tabloda 0,00 gösterilmesi GİB kuralı gereğidir.
              </span>
            </p>
          </div>
          <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={copyAllRows}>
              {copiedAll ? '✓ Kopyalandı!' : '📋 Tümünü Kopyala'}
            </button>
            <button className="btn btn-success" onClick={exportToExcel}>
              📊 Excel'e Aktar
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ücret Türü</th>
                <th className="text-right">Süre (Ay)</th>
                <th>İşveren Adı / Ünvanı</th>
                <th className="text-right">Gayrisafi Tutar</th>
                <th className="text-right">İndirimler</th>
                <th className="text-right">Safi Ücret (Matrah)</th>
                <th className="text-right">Kesilen GV</th>
                <th>1. İşveren</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gibTableRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="text-xs">{row.ucretTuru}</td>
                  <td className="td-number">{row.eldeSuresi}</td>
                  <td className="td-primary" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.isverenAd}
                  </td>
                  <td className="td-number">{fmtTL(row.gayrisafiTutar)}</td>
                  <td className="td-number text-muted">{fmtTL(row.indirimler)}</td>
                  <td className="td-number">{fmtTL(row.safiUcret)}</td>
                  <td className="td-number text-red">{fmtTL(row.kesilenGV)}</td>
                  <td>
                    {row.birinciIsverenMi
                      ? <span className="badge badge-blue">✓</span>
                      : <span className="badge badge-gray">—</span>}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}
                      onClick={() => copyRow(row, idx)}
                      title="Bu satırı kopyala"
                    >
                      {copiedRow === idx ? '✓' : '📋'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                <td colSpan={3} style={{ padding: '0.7rem 1rem' }}>TOPLAM</td>
                <td className="td-number">{fmtTL(gibTableRows.reduce((s, r) => s + r.gayrisafiTutar, 0))}</td>
                <td className="td-number text-muted">{fmtTL(gibTableRows.reduce((s, r) => s + r.indirimler, 0))}</td>
                <td className="td-number">{fmtTL(gibTableRows.reduce((s, r) => s + r.safiUcret, 0))}</td>
                <td className="td-number text-red">{fmtTL(gibTableRows.reduce((s, r) => s + r.kesilenGV, 0))}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="card mb-3">
        <h3 style={{ marginBottom: '0.5rem' }}>🔽 İndirimler Detayı (GİB Modal'a Ayrıca Girilecek)</h3>
        <p className="text-xs text-muted mb-2">
          GİB Hazır Beyan 3.B satırında her işverenin "İndirimler" butonuna tıklayıp aşağıdaki tutarları girin.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>GVK Maddesi</th>
                <th>İndirim Kalemi</th>
                {indirimDetayi.map(d => <th key={d.isverenKey} className="text-right">{d.isverenAd.substring(0, 18)}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="td-muted text-xs">GVK 63/2.a</td>
                <td style={{ fontSize: '0.85rem' }}>2.a- S.S.K. Prim ve Aidat Ödemeleri (İşçi Payı)</td>
                {indirimDetayi.map(d => <td key={d.isverenKey} className="td-number">{fmtTL(d.gvk63_2a)}</td>)}
              </tr>
              <tr>
                <td className="td-muted text-xs">GVK 63/2.b</td>
                <td style={{ fontSize: '0.85rem' }}>2.b- İşsizlik Sigortası Primi (İşçi Payı)</td>
                {indirimDetayi.map(d => <td key={d.isverenKey} className="td-number">{fmtTL(d.gvk63_2b)}</td>)}
              </tr>
              <tr>
                <td className="td-muted text-xs">GVK 63/3</td>
                <td style={{ fontSize: '0.85rem' }}>4- Hayat/Şahıs Sigorta Primleri (GVK Md.63/3)</td>
                {indirimDetayi.map(d => <td key={d.isverenKey} className="td-number">{fmtTL(d.gvk63_3)}</td>)}
              </tr>
              <tr style={{ fontWeight: 700, background: 'var(--bg-secondary)' }}>
                <td colSpan={2}>Toplam İndirim</td>
                {indirimDetayi.map(d => <td key={d.isverenKey} className="td-number td-primary">{fmtTL(d.toplam)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Asgari Ücret İstisnası Bilgisi ---- */}
      <div className="alert alert-info mb-3">
        <div className="alert-icon">ℹ️</div>
        <div>
          <div className="alert-title">Asgari Ücret Vergisi İstisnası (GVK Md. 23/18)</div>
          <div className="alert-body">
            Bordrolarda kesilen gelir vergisi zaten asgari ücret istisnası düşüldükten sonraki net tutardır.
            Toplam asgari ücret istisnası: {fmtTL(employers.reduce((s, e) => s + e.annualMinWageExemption, 0))}.
            Beyanname üzerinden yeniden hesaplarken bu istisna GİB sistemi tarafından otomatik uygulanmaktadır.
          </div>
        </div>
      </div>

      {/* ---- Alt Navigasyon ---- */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button className="btn btn-ghost" onClick={() => navigate('/dogrulama')}>← Düzenlemeye Dön</button>
        <div className="flex gap-1">
          <button className="btn btn-success" onClick={exportToExcel}>📊 Excel İndir</button>
          <a
            href="https://hazirbeyan.gib.gov.tr"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            🌐 GİB Hazır Beyan →
          </a>
        </div>
      </div>
    </div>
  );
}
