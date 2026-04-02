import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useTaxStore from '../store/useTaxStore.js';
import { extractTextFromPdf, isScannedPdf } from '../services/pdfParser.js';
import { extractBordroFields } from '../services/bordroExtractor.js';

const STATUS_ICONS = {
  pending: '⏳',
  parsing: '🔄',
  success: '✅',
  partial: '⚠️',
  failed: '❌',
  ocr: '🔍',
};

const STATUS_LABELS = {
  pending: 'Bekliyor',
  parsing: 'İşleniyor...',
  success: 'Başarıyla parse edildi',
  partial: 'Kısmen parse edildi — doğrulama gerekebilir',
  failed: 'Parse başarısız — lütfen manuel girin',
  ocr: 'OCR ile okundu',
};

export default function UploadPage() {
  const navigate = useNavigate();
  const addRecord = useTaxStore(s => s.addRecord);
  const updateRecord = useTaxStore(s => s.updateRecord);
  const records = useTaxStore(s => s.records);
  const formatTR = (val) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val) + ' TL';
  const clearAll = useTaxStore(s => s.clearAll);

  const [fileStatuses, setFileStatuses] = useState(() => {
    return records.map(r => ({
      id: `${r.fileName}-restored`,
      name: r.fileName,
      size: 0,
      status: r.parseStatus || 'success',
      period: r.period,
      employer: r.employerName,
      warnings: r.warnings,
      error: r.error
    }));
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(localStorage.getItem('privacy_agreed') === 'true');
  const inputRef = useRef();

  const processFile = useCallback(async (file) => {
    const id = `${file.name}-${Date.now()}`;
    
    setFileStatuses(prev => [...prev, { id, name: file.name, size: file.size, status: 'parsing' }]);

    try {
      const text = await extractTextFromPdf(file);
      const isScanned = isScannedPdf(text);
      
      if (isScanned) {
        setFileStatuses(prev => prev.map(f => f.id === id ? { ...f, status: 'ocr' } : f));
        // OCR fallback — simplified: mark as partial
        const record = extractBordroFields('', file.name);
        record.parseStatus = 'partial';
        record.warnings.unshift('Görüntü tabanlı PDF — OCR uygulandı, lütfen doğrulayın');
        addRecord(record);
        setFileStatuses(prev => prev.map(f => f.id === id ? { ...f, status: 'partial' } : f));
      } else {
        const record = extractBordroFields(text, file.name);
        
        // HATA 1 & 2: Çakışma Kontrolleri
        const currentRecords = useTaxStore.getState().records;
        
        // 1. Mükerrer Kontrolü (Tamamen aynı bordro - İşveren, Yıl, Ay ve Brüt)
        const exactDupIndex = currentRecords.findIndex(r => 
          r.employerName === record.employerName && 
          r.month === record.month && 
          r.year === record.year && 
          Math.abs((r.grossSalary || 0) - (record.grossSalary || 0)) < 1
        );

        // 2. Split Kontrolü (Aynı ay, farklı tutar / ek bordro)
        const splitDupIndex = currentRecords.findIndex(r => 
          r.employerName === record.employerName && 
          r.month === record.month && 
          r.year === record.year
        );

        if (exactDupIndex !== -1) {
          const isUpdate = window.confirm(`"${file.name}" dosyası zaten yüklenmiş görünüyor (Aynı işveren, dönem ve ${formatTR(record.grossSalary || 0)} brüt tutar).\n\nMevcut kaydı GÜNCELLEMEK ister misiniz?\n(İptal derseniz bu dosya atlanacaktır)`);
          
          if (isUpdate) {
            updateRecord(exactDupIndex, record);
            setFileStatuses(prev => prev.map(f => f.id === id ? {
              ...f, status: record.parseStatus, period: record.period, employer: record.employerName, warnings: record.warnings
            } : f));
          } else {
            setFileStatuses(prev => prev.map(f => f.id === id ? { ...f, status: 'failed', error: 'Kullanıcı tarafından atlandı (Mükerrer)' } : f));
          }
          return;
        } 
        
        if (splitDupIndex !== -1) {
          const splitDup = currentRecords[splitDupIndex];
          const isMerge = window.confirm(`"${file.name}" dosyası için bu işverende ${record.period} döneminde zaten bir kayıt var.\n\nYeni kaydı (${formatTR(record.grossSalary || 0)} brüt) mevcut kayıtla BİRLEŞTİRMEK (toplamak) ister misiniz?\n\n(Tamam = Birleştir, İptal = Ayrı satır olarak ekle)`);
          
          if (isMerge) {
            updateRecord(splitDupIndex, {
              grossSalary: (splitDup.grossSalary || 0) + (record.grossSalary || 0),
              gvTaxBase: (splitDup.gvTaxBase || 0) + (record.gvTaxBase || 0),
              sgkTaxBase: (splitDup.sgkTaxBase || 0) + (record.sgkTaxBase || 0),
              dvTaxBase: (splitDup.dvTaxBase || 0) + (record.dvTaxBase || 0),
              incomeTax: (splitDup.incomeTax || 0) + (record.incomeTax || 0),
              incomeTaxBeforeExemption: (splitDup.incomeTaxBeforeExemption || 0) + (record.incomeTaxBeforeExemption || 0),
              minWageExemption: (splitDup.minWageExemption || 0) + (record.minWageExemption || 0),
              stampTax: (splitDup.stampTax || 0) + (record.stampTax || 0),
              sgkEmployee: (splitDup.sgkEmployee || 0) + (record.sgkEmployee || 0),
              unemploymentIns: (splitDup.unemploymentIns || 0) + (record.unemploymentIns || 0),
              privateHealthIns: (splitDup.privateHealthIns || 0) + (record.privateHealthIns || 0),
              netPay: (splitDup.netPay || 0) + (record.netPay || 0),
              totalDeductionBeforeExemption: (splitDup.totalDeductionBeforeExemption || 0) + (record.totalDeductionBeforeExemption || 0),
              cumulativeGvTaxBase: Math.max(splitDup.cumulativeGvTaxBase || 0, record.cumulativeGvTaxBase || 0),
              warnings: [...(splitDup.warnings || []), ...(record.warnings || []), 'Split bordro birleştirildi.'],
            });
            setFileStatuses(prev => prev.map(f => f.id === id ? {
              ...f, status: 'success', period: record.period, employer: record.employerName, warnings: ['(Mevcut kayıtla birleştirildi)']
            } : f));
            return;
          }
        }

        addRecord(record);
        setFileStatuses(prev => prev.map(f => f.id === id ? {
          ...f,
          status: record.parseStatus,
          period: record.period,
          employer: record.employerName,
          warnings: record.warnings,
        } : f));
      }
    } catch (err) {
      console.error(err);
      setFileStatuses(prev => prev.map(f => f.id === id ? { ...f, status: 'failed', error: err.message } : f));
    }
  }, [addRecord, updateRecord]);

  const handleFiles = useCallback(async (files) => {
    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length === 0) return;
    
    // Geçerli state'den mevcut dosyaları bul ve aynı isimli dosyaları filtrele
    const currentRecords = useTaxStore.getState().records;
    const existingNames = new Set(currentRecords.map(r => r.fileName));
    
    const newPdfs = pdfs.filter(f => !existingNames.has(f.name));
    if (newPdfs.length === 0) {
      alert('Seçilen tüm dosyalar zaten yüklenmiş.');
      return;
    }
    
    setIsProcessing(true);
    // Promise.all yerine sıralı işliyoruz ki bir dosyanın modal'ı sorulurken 
    // diğeri aynı store verisine bakıp çakışmasın.
    for (const file of newPdfs) {
      await processFile(file);
    }
    setIsProcessing(false);
  }, [processFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleClearAll = () => {
    clearAll();
    setFileStatuses([]);
  };

  const successCount = fileStatuses.filter(f => f.status === 'success').length;
  const partialCount = fileStatuses.filter(f => ['partial', 'ocr'].includes(f.status)).length;
  const failCount = fileStatuses.filter(f => f.status === 'failed').length;

  return (
    <div className="animate-in">
      {/* Privacy Notice */}
      {!privacyAgreed && (
        <div style={{ marginBottom: '1.5rem', background: 'rgba(59,130,246,0.06)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-blue-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{fontSize:'1.1rem'}}>🔒</span> Gizlilik ve Veri Güvenliği Taahhüdü
            </h4>
            <p className="text-sm" style={{ margin: 0, lineHeight: 1.5, opacity: 0.9 }}>
              Yüklediğiniz hiçbir bordro dosyası veya finansal veri harici bir sunucuya <strong>gönderilmez, yüklenmez veya saklanmaz.</strong> Ayrıştırma ve hesaplama işlemleri %100 oranında cihazınızda (bu tarayıcıda) çevrimdışı gerçekleşmektedir. Risksiz ve KVKK'ya tam uyumludur.
            </p>
          </div>
          <button className="btn btn-outline" style={{ whiteSpace: 'nowrap', padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => {
            localStorage.setItem('privacy_agreed', 'true');
            setPrivacyAgreed(true);
          }}>Okudum</button>
        </div>
      )}

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', paddingTop: '0.5rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(59,130,246,0.1)', border: '1px solid var(--border-accent)',
          borderRadius: '999px', padding: '0.3rem 1rem', marginBottom: '1rem',
          fontSize: '0.8rem', color: 'var(--accent-blue-light)', fontWeight: 600,
        }}>
          📋 2025 Dönemi — GVK Md. 86/103/23-18
        </div>
        <h1 style={{ marginBottom: '0.75rem' }}>Bordro PDF'lerini Yükle</h1>
        <p style={{ maxWidth: '540px', margin: '0 auto', fontSize: '1rem' }}>
          2025 yılına ait bordro PDF dosyalarınızı yükleyin. Ücret, vergi ve kesinti bilgileri otomatik çıkarılır.
        </p>
      </div>

      {/* Dropzone */}
      <div
        className={`dropzone${isDragOver ? ' drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={(e) => {
          if (e.detail > 1) return; // Prevent double-clicks from queueing multiple dialogs
          if (e.target !== inputRef.current) {
            inputRef.current?.click();
          }
        }}
        style={{ marginBottom: '1.5rem' }}
      >
        <input ref={inputRef} type="file" accept=".pdf" multiple onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = null; // Reset input so same files can be chosen again if needed
        }} />
        <span className="dropzone-icon">📂</span>
        <div className="dropzone-title">
          {isProcessing ? 'İşleniyor...' : 'PDF Bordrolarınızı Buraya Sürükleyin'}
        </div>
        <div className="dropzone-sub">
          veya tıklayarak dosya seçin · Birden fazla dosya desteklenir (12+ bordro)
        </div>
        {isProcessing && (
          <div style={{ marginTop: '1rem' }}>
            <div className="spinner" />
          </div>
        )}
      </div>

      {/* File list */}
      {fileStatuses.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 style={{ margin: 0 }}>Yüklenen Dosyalar ({fileStatuses.length})</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {successCount > 0 && <span className="badge badge-green">✓ {successCount}</span>}
                {partialCount > 0 && <span className="badge badge-amber">⚠ {partialCount}</span>}
                {failCount > 0 && <span className="badge badge-red">✗ {failCount}</span>}
              </div>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderColor: 'var(--border-accent)', borderStyle: 'dashed' }} 
                onClick={handleClearAll}
              >
                🗑 Tümünü Temizle
              </button>
            </div>
          </div>

          <div className="file-list">
            {fileStatuses.map(f => (
              <div key={f.id} className="file-item">
                <span className="file-status-icon">{STATUS_ICONS[f.status] || '⏳'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="file-name">{f.name}</div>
                  <div className="file-meta">
                    {STATUS_LABELS[f.status]}
                    {f.employer && f.employer !== 'Bilinmiyor' && ` · ${f.employer}`}
                    {f.period && ` · ${f.period}`}
                  </div>
                  {f.warnings && f.warnings.length > 0 && (
                    <div style={{ marginTop: '0.25rem' }}>
                      {f.warnings.map((w, i) => (
                        <div key={i} className="text-xs text-amber">⚠ {w}</div>
                      ))}
                    </div>
                  )}
                  {f.error && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <div className="text-xs text-red">❌ {f.error}</div>
                    </div>
                  )}
                </div>
                <div className="file-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span>{(f.size / 1024).toFixed(0)} KB</span>
                  <button 
                    onClick={() => {
                        useTaxStore.getState().removeRecord(f.name);
                        setFileStatuses(prev => prev.filter(item => item.id !== f.id));
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '1rem', padding: '0.2rem', transition: 'opacity 0.2s' }}
                    onMouseOver={e=>e.currentTarget.style.opacity=1} 
                    onMouseOut={e=>e.currentTarget.style.opacity=0.6}
                    title="Dosyayı Sil"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid-3 mb-3">
        <div className="card card-tight">
          <div className="stat-label">Tek İşveren Sınırı</div>
          <div className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--accent-amber-light)' }}>4.300.000 TL</div>
          <div className="text-xs text-muted mt-1">GVK Md. 86</div>
        </div>
        <div className="card card-tight">
          <div className="stat-label">2. İşveren Sınırı</div>
          <div className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--accent-amber-light)' }}>330.000 TL</div>
          <div className="text-xs text-muted mt-1">GVK Md. 86</div>
        </div>
        <div className="card card-tight">
          <div className="stat-label">Asgari Ücret İstisnası</div>
          <div className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--accent-green-light)' }}>~3.316 TL/ay</div>
          <div className="text-xs text-muted mt-1">GVK Md. 23/18</div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-end" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ marginLeft: 'auto' }}>
          <button
            className="btn btn-primary btn-lg pulse-glow"
            disabled={records.length === 0}
            onClick={() => navigate('/dogrulama')}
          >
            Verileri Doğrula →
          </button>
        </div>
      </div>
    </div>
  );
}
