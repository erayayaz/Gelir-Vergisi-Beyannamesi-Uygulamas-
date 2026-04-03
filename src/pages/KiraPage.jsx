import React, { useState } from 'react';
import { TAX_CONSTANTS_2025 } from '../utils/taxConstants.js';
import { calculateGrossIncomeTax } from '../services/taxCalculator.js';
import { formatCurrencyInput, parseTRNumber } from '../utils/formatters.js';

const C = TAX_CONSTANTS_2025;

export default function KiraPage() {
  const [grossIncome, setGrossIncome] = useState('');
  const [exemptionChoice, setExemptionChoice] = useState(C.rentExemption);
  const [method, setMethod] = useState('goturu');
  const [manualExpenses, setManualExpenses] = useState('');
  const [deductions, setDeductions] = useState('');
  const [withheldTax, setWithheldTax] = useState('');

  // Number conversions
  const vGross = Math.max(0, parseTRNumber(grossIncome));
  const vManualExp = Math.max(0, parseTRNumber(manualExpenses));
  const vDeductions = Math.max(0, parseTRNumber(deductions));
  const vWithheld = Math.max(0, parseTRNumber(withheldTax));

  // Domain Calculations
  const kalan = Math.max(0, vGross - exemptionChoice);
  const expense = method === 'goturu' ? (kalan * C.rentExpenseRate) : vManualExp;
  const safiIrat = Math.max(0, kalan - expense);
  const matrah = Math.max(0, safiIrat - vDeductions);
  const calculatedTax = calculateGrossIncomeTax(matrah);
  const payableTax = Math.max(0, calculatedTax - vWithheld);
  const refundableTax = Math.max(0, vWithheld - calculatedTax);

  return (
    <div className="animate-in">
      <div style={{ maxWidth: '800px', margin: '0 auto 1.5rem auto', background: 'rgba(59,130,246,0.06)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(59,130,246,0.3)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-blue-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{fontSize:'1.1rem'}}>ℹ️</span> Kimlerin Beyanname Vermesine Gerek Yoktur? (GVK Madde 21 ve 86)
        </h4>
        <p className="text-sm" style={{ margin: 0, lineHeight: 1.5, opacity: 0.9 }}>
          Ocak-Aralık 2025 tarihleri arasındaki yıllık toplam mesken (konut) kira geliriniz İstisna Sınırı olan <strong>47.000 TL'nin altındaysa</strong> beyanname vermenize ve telaş yapmanıza gerek yoktur. Ayrıca tüm kazanç bütçeniz (ücret, kira, faiz vs.) 1.200.000 TL'yi AŞMIYORSA bu istisnadan yıl boyu tam yararlanabilirsiniz. (İş yeri kira gelirlerinde stopajlı sınır olan 330.000 TL farklılık gösterebilir).
        </p>
      </div>

      <div className="card mb-3" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1.5rem', textAlign: 'center' }}>
          GAYRİMENKUL SERMAYE İRADI (GMSİ) HESAPLAMA
        </h2>

        <div className="grid-2">
          {/* LEFT COLUMN */}
          <div>
            <h3 style={{ color: 'var(--accent-blue-light)', marginBottom: '1rem' }}>2025 Beyanname Dönemi</h3>
            
            <div className="mb-2">
              <label className="text-sm font-bold block mb-1">
                Gayri Safi İratlar Toplamı
                <div className="tooltip-container" style={{ marginLeft: '0.35rem', color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)', width: '16px', height: '16px', borderRadius: '50%', fontSize: '10px' }}>
                  ?
                  <span className="tooltip-text">Yıl boyunca evinizden veya iş yerinizden elde ettiğiniz toplam brüt kira bedelidir. Örneğin; aylık 30.000 TL kira alıyorsanız, 30.000 x 12 = 360.000 TL yazmalısınız.</span>
                </div>
              </label>
              <div className="flex items-center gap-1">
                <input type="text" className="input" value={grossIncome} onChange={e => setGrossIncome(formatCurrencyInput(e.target.value))} placeholder="0,00" />
                <span className="text-muted text-sm">TL</span>
              </div>
            </div>

            <div className="mb-2">
              <label className="text-sm font-bold block mb-1">
                Vergiden İstisna Edilen Tutar
                <div className="tooltip-container" style={{ marginLeft: '0.35rem', color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)', width: '16px', height: '16px', borderRadius: '50%', fontSize: '10px' }}>
                  ?
                  <span className="tooltip-text">2025 yılı için konut kira geliri istisnası 47.000 TL'dir. İş yeri kira gelirlerinde bu istisna uygulanmaz.</span>
                </div>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={exemptionChoice === 0} onChange={() => setExemptionChoice(0)} />
                  0
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={exemptionChoice === C.rentExemption} onChange={() => setExemptionChoice(C.rentExemption)} />
                  {C.rentExemption.toLocaleString('tr-TR')}
                </label>
              </div>
              <p className="text-xs text-muted mt-1">GVK Md. 21 Mesken Kira İstisnası</p>
            </div>

            <div className="mb-2">
              <label className="text-sm font-bold block mb-1">Kalan</label>
              <div className="flex items-center gap-1">
                <input type="text" className="input" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }} value={kalan.toLocaleString('tr-TR', {minimumFractionDigits:2})} disabled />
                <span className="text-muted text-sm">TL</span>
              </div>
            </div>

            <div className="mb-2">
              <label className="text-sm font-bold block mb-1">
                İradın Tespit Şekli
                <div className="tooltip-container" style={{ marginLeft: '0.35rem', color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)', width: '16px', height: '16px', borderRadius: '50%', fontSize: '10px' }}>
                  ?
                  <span className="tooltip-text">Faturalı gideriniz yoksa 'Götürü' seçerek otomatik %15 yasal gider indirimi (kalan üzerinden) hakkınızı kullanabilirsiniz.</span>
                </div>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={method === 'gercek'} onChange={() => setMethod('gercek')} />
                  Gerçek
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={method === 'goturu'} onChange={() => setMethod('goturu')} />
                  Götürü
                </label>
              </div>
            </div>

            <div className="mb-2">
              <label className="text-sm font-bold block mb-1">
                Giderler
                <div className="tooltip-container" style={{ marginLeft: '0.35rem', color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)', width: '16px', height: '16px', borderRadius: '50%', fontSize: '10px' }}>
                  ?
                  <span className="tooltip-text">'Gerçek' yöntemi seçilirse, vergiden düşebileceğiniz faturalı harcamalarınızı buraya manuel girmelisiniz.</span>
                </div>
              </label>
              <div className="flex items-center gap-1">
                <input 
                  type="text"
                  className="input" 
                  value={method === 'goturu' ? expense.toLocaleString('tr-TR', {minimumFractionDigits:2}) : manualExpenses} 
                  onChange={e => setManualExpenses(formatCurrencyInput(e.target.value))} 
                  disabled={method === 'goturu'} 
                  style={method === 'goturu' ? { background: 'var(--bg-secondary)', color: 'var(--text-muted)' } : {}}
                  placeholder="0,00"
                />
                <span className="text-muted text-sm">TL</span>
              </div>
            </div>

            <div className="mb-2">
              <label className="text-sm font-bold block mb-1">
                Safi İrat
                <div className="tooltip-container" style={{ marginLeft: '0.35rem', color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)', width: '16px', height: '16px', borderRadius: '50%', fontSize: '10px' }}>
                  ?
                  <span className="tooltip-text">Kira gelirinizden istisna tutarı ve giderler düşüldükten sonra kalan salt kazancınızdır. Vergi matrahınız buna göre şekillenir.</span>
                </div>
              </label>
              <div className="flex items-center gap-1">
                <input type="text" className="input" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }} value={safiIrat.toLocaleString('tr-TR', {minimumFractionDigits:2})} disabled />
                <span className="text-muted text-sm">TL</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div>
            <h3 style={{ color: 'var(--accent-blue-light)', marginBottom: '1rem' }}>Vergi Bildirimi</h3>
            <div className="mb-2">
              <label className="text-sm font-bold block mb-1">Kalan</label>
              <div className="flex items-center gap-1">
                <input type="text" className="input" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }} value={matrah.toLocaleString('tr-TR', {minimumFractionDigits:2})} disabled />
                <span className="text-muted text-sm">TL</span>
              </div>
            </div>

            <div className="mt-4 border-t pt-3">
              <h3 style={{ color: 'var(--accent-blue-light)', marginBottom: '1rem' }}>İndirimler & Hesaplama</h3>
            
              <div className="mb-2">
                <label className="text-sm font-bold block mb-1">
                  İndirimler (GVK 89. Md vb.)
                <div className="tooltip-container" style={{ marginLeft: '0.35rem', color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)', width: '16px', height: '16px', borderRadius: '50%', fontSize: '10px' }}>
                  ?
                  <span className="tooltip-text">Şahıs sigorta primleri, eğitim harcamaları veya bağışlar gibi ekstra yasal indirimleriniz varsa buraya girin.</span>
                </div>
              </label>
              <div className="flex items-center gap-1">
                <input type="text" className="input" value={deductions} onChange={e => setDeductions(formatCurrencyInput(e.target.value))} placeholder="0,00" />
                <span className="text-muted text-sm">TL</span>
              </div>
            </div>

            <div className="mb-2">
              <label className="text-sm font-bold block mb-1">Vergiye Tabi Gelir (Matrah)</label>
              <div className="flex items-center gap-1">
                <input type="text" className="input" style={{ background: 'var(--bg-secondary)' }} value={matrah.toLocaleString('tr-TR', {minimumFractionDigits:2})} disabled />
                <span className="text-muted text-sm">TL</span>
              </div>
            </div>

            <div className="mb-2">
              <label className="text-sm font-bold block mb-1">Hesaplanan Gelir Vergisi</label>
              <div className="flex items-center gap-1">
                <input type="text" className="input" style={{ background: 'var(--bg-secondary)' }} value={calculatedTax.toLocaleString('tr-TR', {minimumFractionDigits:2})} disabled />
                <span className="text-muted text-sm">TL</span>
              </div>
              <p className="text-xs text-muted mt-1">GVK 103 Tarifesine Göre</p>
            </div>

            <div className="mb-2">
              <label className="text-sm font-bold block mb-1">
                Kesinti Yoluyla Ödenen Vergiler (Stopaj)
                <div className="tooltip-container" style={{ marginLeft: '0.35rem', color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)', width: '16px', height: '16px', borderRadius: '50%', fontSize: '10px' }}>
                  ?
                  <span className="tooltip-text">Eğer iş yeri kirası veriyorsanız, kiracınız sizin adınıza devlete stopaj kesintisi (%20) ödemiş olabilir. Bu miktar toplam verginizden düşülür.</span>
                </div>
              </label>
              <div className="flex items-center gap-1">
                <input type="text" className="input" value={withheldTax} onChange={e => setWithheldTax(formatCurrencyInput(e.target.value))} placeholder="0,00" />
                <span className="text-muted text-sm">TL</span>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {vGross > 0 && (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: refundableTax > 0 ? 'var(--accent-green)' : 'var(--accent-blue)' }} />
          <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-main)' }}>BEYANNAME SONUCU</h3>
          
          <div className="grid-3" style={{ gap: '1rem', textAlign: 'center' }}>
            <div>
              <div className="text-sm text-muted mb-1">Hesaplanan Vergi</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{calculatedTax.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Damga Vergisi</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{C.generalStampTax.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Stopaj (Kesilenler)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>- {withheldTax.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            {refundableTax > 0 ? (
              <>
                <div className="text-sm font-bold mb-1" style={{ color: 'var(--accent-green)' }}>İade Alacağınız Gelir Vergisi Tutarı</div>
                <div style={{ fontSize: '2rem', color: 'var(--accent-green)', fontWeight: '900' }}>
                  {refundableTax.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL
                </div>
                <div className="text-xs text-muted mt-2">*{C.generalStampTax.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL Damga Vergisi ayrıca tahakkuk edecektir.</div>
              </>
            ) : (
              <>
                <div className="text-sm font-bold mb-1" style={{ color: 'var(--accent-red)' }}>Toplam Ödenecek Tutar (Vergi + Damga)</div>
                <div style={{ fontSize: '2rem', color: 'var(--accent-red)', fontWeight: '900' }}>
                  {(payableTax + C.generalStampTax).toLocaleString('tr-TR', {minimumFractionDigits:2})} TL
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
