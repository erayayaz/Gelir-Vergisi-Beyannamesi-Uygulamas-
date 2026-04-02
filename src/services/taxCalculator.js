// ============================================================
// Vergi Hesaplama Motoru — v3
// GVK Madde 86 — Beyanname zorunluluğu
// GVK Madde 103 — Gelir vergisi hesabı
// GVK Madde 23/18 — Asgari ücret istisnası
//
// GİB 3.B Algortiması (Doğrulandı):
//   Gayrisafi = Kümülatif Matrah (ardışık işverenler için devir düşülür)
//   İndirimler = 0,00 (indirimler ayrı modal)
//   Kesilen GV = Σ(gv_istisna_oncesi) — istisna öncesi!
// ============================================================
import { TAX_CONSTANTS_2025 } from '../utils/taxConstants.js';

const C = TAX_CONSTANTS_2025;

/**
 * GVK 103 tarifesine göre brüt yıllık gelir vergisi hesaplar
 */
export function calculateGrossIncomeTax(annualTaxBase) {
  if (!annualTaxBase || annualTaxBase <= 0) return 0;
  
  let tax = 0;
  let remaining = annualTaxBase;
  let prevLimit = 0;
  
  for (const bracket of C.brackets) {
    if (remaining <= 0) break;
    const sliceWidth = Math.min(remaining, bracket.limitMax - prevLimit);
    tax += sliceWidth * bracket.rate;
    remaining -= sliceWidth;
    prevLimit = bracket.limitMax;
  }
  
  return Math.round(tax * 100) / 100;
}

/**
 * Vergi dilimini döndürür
 */
export function getTaxBracket(base) {
  for (const bracket of C.brackets) {
    if (base <= bracket.limitMax) {
      return `%${bracket.rate * 100} (${bracket.limitMin.toLocaleString('tr-TR')} – ${
        bracket.limitMax === Infinity ? '∞' : bracket.limitMax.toLocaleString('tr-TR')
      } TL dilimi)`;
    }
  }
  return '%40';
}

/**
 * İki işverende tarih örtüşmesi var mı?
 * (Ardışık=false → kümülatif devir yapılsın; Eş zamanlı=true → yapılmasın)
 */
function isOverlapping(empA, empB) {
  // Her iki işverenin de tarih bilgisi yoksa ardışık kabul et
  if (!empA.endDate || !empB.startDate) return false;
  return empA.endDate >= empB.startDate;
}

/**
 * İşverenleri gruplayıp yıllık toplamları hesaplar.
 * Her bordrodan kritik alanları biriktir:
 *   - lastCumulativeMatrah: son ay kümülatif matrahı (GİB Gayrisafi için)
 *   - annualTaxBeforeExemption: Σ(gv_istisna_oncesi) — GİB Kesilen GV için
 *   - Yıl filtresi: sadece aktif yıl (targetYear) verilerini al
 */
export function groupByEmployer(records, targetYear = null) {
  const map = new Map();
  
  // Yıl filtresi — sadece hedef yılı işle
  const filtered = targetYear
    ? records.filter(r => r.year === targetYear)
    : records;
  
  for (const rec of filtered) {
    const key = rec.employerName.toUpperCase().replace(/\s+/g, '');
    
    if (!map.has(key)) {
      map.set(key, {
        key,
        employerName: rec.employerName,
        periods: new Set(),
        records: [],
        // Kümülatif takip
        lastCumulativeMatrah: 0,     // Son ay kümülatif matrahı (GİB Gayrisafi kaynağı)
        // Toplamlar
        annualGross: 0,
        annualTaxBase: 0,            // Σ(aylık matrah) — doğrulama için
        annualSGKEmployee: 0,
        annualUnemployment: 0,
        annualPrivateHealthIns: 0,
        annualTaxWithheld: 0,        // Σ(kesilen_gv) — istisna SONRASI
        annualTaxBeforeExemption: 0, // Σ(gv_istisna_oncesi) — GİB Kesilen GV!
        annualStampTax: 0,
        annualMinWageExemption: 0,
        // Tarih (ardışık/eş zamanlı tespiti için)
        startDate: null,
        endDate: null,
        isPrimary: false,
      });
    }
    
    const employer = map.get(key);
    employer.records.push(rec);
    if (rec.period) employer.periods.add(rec.period);
    
    employer.annualGross += rec.grossSalary || 0;
    employer.annualTaxBase += rec.gvTaxBase || 0;
    employer.annualSGKEmployee += rec.sgkEmployee || 0;
    employer.annualUnemployment += rec.unemploymentIns || 0;
    employer.annualPrivateHealthIns += rec.privateHealthIns || 0;
    employer.annualTaxWithheld += rec.incomeTax || 0;
    employer.annualTaxBeforeExemption += rec.incomeTaxBeforeExemption || rec.incomeTax || 0;
    employer.annualStampTax += rec.stampTax || 0;
    employer.annualMinWageExemption += rec.minWageExemption || 0;

    // Son ay kümülatif matrahını güncelle (en yüksek olanı al = son ay)
    if ((rec.cumulativeGvTaxBase || 0) > employer.lastCumulativeMatrah) {
      employer.lastCumulativeMatrah = rec.cumulativeGvTaxBase || 0;
    }
    
    // Tarih aralığı güncelle
    if (rec.year && rec.month) {
      const d = `${rec.year}-${String(rec.month).padStart(2, '0')}`;
      if (!employer.startDate || d < employer.startDate) employer.startDate = d;
      if (!employer.endDate || d > employer.endDate) employer.endDate = d;
    }
  }
  
  const employers = Array.from(map.values()).map(emp => ({
    ...emp,
    months: emp.periods.size > 0 ? emp.periods.size : emp.records.length,
  }));
  
  // Kronolojik sıralama
  employers.sort((a, b) => {
    const sa = a.startDate || '9999-99';
    const sb = b.startDate || '9999-99';
    return sa.localeCompare(sb);
  });
  
  if (employers.length > 0) {
    employers[0].isPrimary = true;
  }
  
  return employers;
}

/**
 * GİB 3.B Satırlarını Üretir
 *
 * Ardışık işveren formülü (GİB'in doğrulanan kuralı):
 *   İşveren[0]: gibGayrisafi = lastCumulativeMatrah[0]
 *   İşveren[i]: gibGayrisafi = lastCumulativeMatrah[i] - lastCumulativeMatrah[i-1]
 *
 * Eş zamanlı çalışma varsa: kümülatif devir yapılmaz,
 *   gibGayrisafi = lastCumulativeMatrah (kendi matrahı)
 *
 * Kesilen GV = annualTaxBeforeExemption (GV İstisna Öncesi toplamı)
 * İndirimler = 0 (ayrı modal için hesaplanır — bkz. hesaplaIndirimDetayi)
 */
export function generateGibTableRows(employers, primaryKey = null) {
  let prevCumulative = 0;
  
  return employers.map((emp, idx) => {
    const isPrimary = primaryKey ? emp.key === primaryKey : emp.isPrimary;
    
    // Eş zamanlı çalışma tespiti: önceki işverenle tarih örtüşüyor mu?
    const prevEmp = idx > 0 ? employers[idx - 1] : null;
    const concurrent = prevEmp ? isOverlapping(prevEmp, emp) : false;
    
    let gibGayrisafi;
    if (idx === 0 || concurrent) {
      // İlk işveren veya eş zamanlı çalışma → kende kümülatif matrahı kullan
      gibGayrisafi = emp.lastCumulativeMatrah || emp.annualTaxBase;
    } else {
      // Ardışık işveren → önceki tüm kümülatiflerden çıkar
      gibGayrisafi = (emp.lastCumulativeMatrah || emp.annualTaxBase) - prevCumulative;
    }
    
    // Bir sonraki işveren için kümülatif birikimi güncelle
    if (!concurrent) {
      prevCumulative += emp.lastCumulativeMatrah || emp.annualTaxBase;
    }
    
    // GİB Kesilen GV = istisna öncesi toplamı
    const kesilenGV = emp.annualTaxBeforeExemption || emp.annualTaxWithheld;
    
    return {
      ucretTuru: 'Ücret (İşverene tabi ve tevkifata tabi)',
      eldeSuresi: emp.months,
      isverenAd: emp.employerName,
      gayrisafiTutar: Math.max(0, gibGayrisafi),
      indirimler: 0,            // GİB 3.B'de her zaman 0 — indirimler ayrı modal
      safiUcret: Math.max(0, gibGayrisafi),  // GİB'de Safi = Gayrisafi (indirim yok)
      kesilenGV: kesilenGV,
      birinciIsverenMi: isPrimary,
      isConcurrent: concurrent,
      // İndirim detayı modal için
      _sgkEmployee: emp.annualSGKEmployee,
      _unemployment: emp.annualUnemployment,
      _privateHealthIns: emp.annualPrivateHealthIns,
      _annualTaxBase: emp.annualTaxBase,
    };
  });
}

/**
 * GVK 63 İndirim Detayını Hesaplar (Sadece GİB Modal İçin)
 * Ana 3.B tablosuna DAHİL EDİLMEZ
 */
export function hesaplaIndirimDetayi(employers) {
  return employers.map(emp => {
    const gayrisafi = emp.lastCumulativeMatrah || emp.annualTaxBase;
    const beyanMatrahi = emp.annualTaxBase;
    
    // GVK 63/2a: SGK İşçi Payı (tavan: Gayrisafi × %14)
    const sgkTavan = gayrisafi * 0.14;
    const gvk63_2a = Math.min(emp.annualSGKEmployee || 0, sgkTavan);
    
    // GVK 63/2b: İşsizlik Sig. (tavan: Gayrisafi × %1)
    const issizlikTavan = gayrisafi * 0.01;
    const gvk63_2b = Math.min(emp.annualUnemployment || 0, issizlikTavan);
    
    // GVK 63/3: Hayat/Şahıs Sigorta (tavan: Beyan Matrahı × %15)
    const sigorTavan = beyanMatrahi * 0.15;
    const gvk63_3 = Math.min(emp.annualPrivateHealthIns || 0, sigorTavan);
    
    return {
      isverenKey: emp.key,
      isverenAd: emp.employerName,
      ham: {
        sgk: emp.annualSGKEmployee || 0,
        issizlik: emp.annualUnemployment || 0,
        ozelSig: emp.annualPrivateHealthIns || 0,
      },
      tavan: {
        sgk: sgkTavan,
        issizlik: issizlikTavan,
        ozelSig: sigorTavan,
      },
      gvk63_2a,
      gvk63_2b,
      gvk63_3,
      toplam: gvk63_2a + gvk63_2b + gvk63_3,
    };
  });
}

/**
 * GVK 86 beyanname zorunluluğunu kontrol eder.
 * GİB 3.B değerleri (gibGayrisafi) üzerinden hesaplar.
 */
export function checkDeclarationRequired(employers, primaryKey = null, gibRows = null) {
  if (!employers || employers.length === 0) {
    return { required: false, reason: 'Bordro verisi yok', details: [] };
  }
  
  // GiB satırlarını kullan (sağlanmadıysa yeniden hesapla)
  const rows = gibRows || generateGibTableRows(employers, primaryKey);
  
  const primaryRow = rows.find(r => primaryKey ? r.birinciIsverenMi : r.birinciIsverenMi) || rows[0];
  const secondaryRows = rows.filter(r => !r.birinciIsverenMi);
  
  const totalGayrisafi = rows.reduce((s, r) => s + r.gayrisafiTutar, 0);
  const secondaryTotal = secondaryRows.reduce((s, r) => s + r.gayrisafiTutar, 0);
  
  const details = [];
  const reasons = [];
  
  // Kural 1: 2. ve sonraki işverenler toplamı > 330.000 TL
  if (secondaryRows.length > 0) {
    const r1 = secondaryTotal > C.secondaryEmployersThreshold;
    details.push({
      id: 'rule1',
      rule: '2. ve sonraki işveren(ler) toplam gayrisafi',
      value: secondaryTotal,
      threshold: C.secondaryEmployersThreshold,
      exceeded: r1,
      description: `GVK Md. 86 — 2. işverenler (${secondaryTotal.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL) ${r1 ? '>' : '≤'} ${C.secondaryEmployersThreshold.toLocaleString('tr-TR')} TL`,
    });
    if (r1) {
      reasons.push('2. ve sonraki işverenlerden alınan ücret matrahı 330.000 TL sınırını aştı');
    }
  }
  
  // Kural 2: Toplam gayrisafi > 4.300.000 TL
  const r2 = totalGayrisafi > C.singleEmployerThreshold;
  details.push({
    id: 'rule2',
    rule: 'Tüm işverenlerden toplam gayrisafi',
    value: totalGayrisafi,
    threshold: C.singleEmployerThreshold,
    exceeded: r2,
    description: `GVK Md. 86 — Toplam (${totalGayrisafi.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL) ${r2 ? '>' : '≤'} ${C.singleEmployerThreshold.toLocaleString('tr-TR')} TL`,
  });
  if (r2) {
    reasons.push('Tüm işverenlerden alınan ücret matrahı 4.300.000 TL sınırını aştı');
  }
  
  const required = reasons.length > 0;
  
  return {
    required,
    reasons,
    primaryEmployer: employers.find(e => primaryKey ? e.key === primaryKey : e.isPrimary) || employers[0],
    secondaryEmployers: employers.filter(e => primaryKey ? e.key !== primaryKey : !e.isPrimary),
    totalBase: totalGayrisafi,
    secondaryTotal,
    details,
    allEmployers: employers,
  };
}

/**
 * Beyanname verilmesi durumunda vergi dengesini hesaplar
 */
export function calculateTaxBalance(employers, gibRows = null) {
  const rows = gibRows || generateGibTableRows(employers);
  const totalBase = rows.reduce((s, r) => s + r.gayrisafiTutar, 0);
  const totalWithheld = rows.reduce((s, r) => s + r.kesilenGV, 0);
  
  const grossTax = calculateGrossIncomeTax(totalBase);
  const balance = Math.round((grossTax - totalWithheld) * 100) / 100;
  
  return {
    totalBase,
    totalWithheld,
    grossTax,
    balance,
    isPayable: balance > 0,
    isRefund: balance < 0,
    taxBracket: getTaxBracket(totalBase),
  };
}
