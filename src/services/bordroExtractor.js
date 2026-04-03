// ============================================================
// Bordro Alan Çıkarma Servisi — v5 (Pattern-Validated)
//
// Desteklenen Formatlar:
//   FORMAT_A: ÜCRET HESAP PUSULASI (ScaleFocus, Aras Petrol)
//   FORMAT_B: ÜCRET BORDROSU + Küm.GV Matrahı (ING Hubs, Nitto)
//   FORMAT_C: Sütun tabanlı özet liste (Çevre Mühendislik)
//
// NOT: pdfParser.js, yakın karakterleri boşuksuz birleştirir ve
// kolon yapısını tab ile belirtir. ING Hubs'ta ı→Õ, ö→ø encoding
// artifactları mevcuttur. Sayılar TR (81.524,39) veya US (207,218.06)
// formatında olabilir.
// ============================================================
import { parseTRNumber as _parseTR } from '../utils/formatters.js';

// ── Sayı Parse ─────────────────────────────────────────────────

function parseNum(str) {
  if (!str) return 0;
  const s = str.trim().replace(/\s/g, '');
  // TR binlik nokta + ondalık virgül: 81.524,39
  if (/^\d{1,3}(\.\d{3})+,\d{2}$/.test(s)) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
  }
  // US binlik virgül + ondalık nokta: 207,218.06
  if (/^\d{1,3}(,\d{3})+\.\d{2}$/.test(s)) {
    return parseFloat(s.replace(/,/g, '')) || 0;
  }
  // Sadece ondalık virgül: 980,33 veya 0,00
  if (/^\d+,\d{2}$/.test(s)) return parseFloat(s.replace(',', '.')) || 0;
  // Sadece ondalık nokta: 0.00
  if (/^\d+\.\d{2}$/.test(s)) return parseFloat(s) || 0;
  return _parseTR(str) || 0;
}

// ── Yardımcı Fonksiyonlar ─────────────────────────────────────


/** Satır sonundaki sayıyı çeker (TR veya US format) */
function amountFromLine(line) {
  // Sağdan ilk sayı kalıbını bul
  const nums = line.match(/(\d[\d.,]*\d|\d+)/g);
  if (!nums) return null;
  // Son sayıyı al (genellikle değerdir)
  const last = nums[nums.length - 1];
  // Doğrulama: TR veya US format
  if (/^\d[\d.]*,\d{2}$/.test(last) || /^\d[\d,]*\.\d{2}$/.test(last)) return last;
  return null;
}

/** Satır sonunda tab ile gelen değeri çeker: "Label\t{sayı}" */
function tabAmount(line) {
  const m = line.match(/\t([\d][\d.,]*\d|\d+)\s*$/);
  return m ? m[1] : null;
}


/** Satırın herhangi bir yerinde bir label'dan sonraki sayı (mid-line arama) */
function findMidVal(line, labelPat) {
  const m = line.match(new RegExp(labelPat.source + '[^\\d\\t]*([\\d][\\d.,]*\\d)'));
  return m ? m[1] : null;
}

/** Türkçe ay adından ay numarası (encoding-tolerant) */
function monthNumFromName(name) {
  if (!name) return null;
  const n = name.toUpperCase()
    .replace(/[ÕÖÏ]/g, 'I').replace(/[øÛ]/g, 'O').replace(/[Ğ]/g, 'G')
    .replace(/[Ü]/g, 'U').replace(/[Ş]/g, 'S').replace(/[Ç]/g, 'C');
  const MAP = {
    OCAK: 1, SUBAT: 2, MART: 3, NISAN: 4, MAYIS: 5, HAZIRAN: 6,
    TEMMUZ: 7, AGUSTOS: 8, EYLUL: 9, EKIM: 10, KASIM: 11, ARALIK: 12,
  };
  for (const [k, v] of Object.entries(MAP)) {
    if (n.includes(k)) return v;
  }
  return null;
}

// ── Format Tespiti ─────────────────────────────────────────────

/**
 * ÜCRET HESAP PUSULASI — karakterler arası boşluklu olabilir ("Ü C R E T H E S A P")
 * veya bitişik ("ÜCRET HESAP PUSULASI")
 */
function detectFormat(text) {
  if (/HESAP\s*PUSULASI|MAKBUZ-|PUSULASI/i.test(text)) return 'FORMAT_A';
  // ÜCRET spaced out: match "Ü C R E T H E S A P" — the space boundary is kept
  if (/[ÜU]\s+[Cc]\s+[Rr]\s+[Ee]\s+[Tt]\s+[Hh]\s+[Ee]\s+[Ss]/i.test(text)) return 'FORMAT_A';

  // FORMAT_C: Sütun özet listesi (G.V.M sütun başlığından anlaşılır)
  if (/G\.V\.M|GVİstisna\b|Gel\.Ver\./i.test(text)) return 'FORMAT_C';
  
  // FORMAT_B: ÜCRET BORDROSU + Küm.GV alanı
  // Real header: "Ü C R E T\tB O R D R O S U" — space-separated letters
  if (/B\s+O\s+R\s+D\s+R\s+O\s+S\s+U/i.test(text)) return 'FORMAT_B';
  if (/BORDROSU/i.test(text)) return 'FORMAT_B';
  // Güvenilir field marker'lar
  if (/Küm\.Gelir\s*Vergisi\s*Matrah|Küm\.GV\s*Matrah/i.test(text)) return 'FORMAT_B';
  if (/Brüt\s*Kazanç\s*Toplam/i.test(text)) return 'FORMAT_B';
  
  return 'FORMAT_UNKNOWN';
}


// ── İşveren Adı ─────────────────────────────────────────────

function extractEmployerName(lines) {
  for (const line of lines) {
    // Format A: "|İş Yeri Ünvanı : SCALE FOCUS..."
    if (/[İI]ş\s*Yeri\s*[ÜU]nvan/i.test(line)) {
      const m = line.match(/:\s*([^\t|]+?)(?:\s*\||$)/);
      if (m && m[1].trim().length > 3) return m[1].trim();
    }
    // Format A (Aras Petrol): "İşyeri\t:ARAS PETROL..."
    if (/[İI]şyeri\s*\t/i.test(line) && !line.includes('SSK')) {
      const m = line.match(/:\s*([^\t]+)/);
      if (m && m[1].trim().length > 3) return m[1].trim();
    }
    // Format B: "İşyeri ÜnvanÕ\t:\nING HUBS..."  — İşyeri ve ünvan aynı satırda
    if (/([İIøi][şs]yeri)\s*[ÜUÕ]nvan/i.test(line)) {
      // Sonrasındaki içerik
      const m = line.match(/:\s*\n?(.+)/);
      if (m && m[1].trim().length > 3) return m[1].trim();
      // Bir sonraki satır
      const idx = lines.indexOf(line);
      if (idx >= 0 && idx < lines.length - 1) {
        const next = lines[idx + 1].trim();
        if (next.length > 3 && !/^\d|^:|^http/i.test(next)) return next;
      }
    }
    // ING HUBS özel
    if (line.includes('ING HUBS')) return 'ING HUBS B.V.';
    // Format C: "Kurum Adı\tÇEVRE MÜHENDİSLİK..."
    if (/Kurum\s*Ad/i.test(line)) {
      const m = line.match(/Kurum\s*Ad[^:\t]*[:\t]\s*(.+?)(?:Adres|$)/i);
      if (m) return m[1].trim();
    }
    // Format B: "İşyeri Ünvanı\t:\tNİTTO BENTO..."
    if (/[İIøi]şyeri\s*[ÜUÕ]nvan[ıiÕ]\s*:/i.test(line)) {
      const parts = line.split(/:\s*/);
      if (parts[1] && parts[1].trim().length > 3) return parts[1].trim();
    }
  }
  return null;
}

// ── Dönem Çıkarımı ─────────────────────────────────────────────

function extractPeriod(lines, fileName) {
  for (const line of lines) {
    // Format A (ScaleFocus): "Dönem:Ocak-2025" or "|Dönem:Ocak-2025"
    const mA = line.match(/D[öo]nem\s*:?\s*([A-Za-zÇĞİÖŞÜçğışöü]+)[-/\s]+(\d{4})/i);
    if (mA) {
      const month = monthNumFromName(mA[1]);
      const year = parseInt(mA[2]);
      if (month && year) return { month, year, periodStr: `${mA[1].toUpperCase()}-${year}` };
    }
    // Format A (Aras Petrol): "Dönem\t: 01/2025" (space after colon)
    const mAras = line.match(/D[öo]nem\s*[\t:]+\s*(\d{2})\/(\d{4})/i);
    if (mAras) {
      return { month: parseInt(mAras[1]), year: parseInt(mAras[2]), periodStr: `${mAras[1]}.${mAras[2]}` };
    }
    // Format B (ING): "Ay / YÕl :\tNisan 2025" (Õ = ı artifact)
    const mB = line.match(/Ay\s*\/\s*Y[ÕÕıi]\s*l\s*[:\t]+([A-Za-zÇĞİÖŞÜçğışöü]+)\s+(\d{4})/i);
    if (mB) {
      const month = monthNumFromName(mB[1]);
      const year = parseInt(mB[2]);
      if (month && year) return { month, year, periodStr: `${mB[1].toUpperCase()}-${year}` };
    }
    // Format C: "Ay / Yıl\tKASIM / 2025"
    const mC = line.match(/([A-ZÇĞİÖŞÜa-zçğışöü]+)\s*\/\s*(\d{4})/);
    if (mC && monthNumFromName(mC[1])) {
      const month = monthNumFromName(mC[1]);
      const year = parseInt(mC[2]);
      if (month && year) return { month, year, periodStr: `${mC[1].toUpperCase()}-${year}` };
    }
  }
  // Dosya adından: "012025 eray", "Nisan2025_...", "Agustos2025_..."
  const fn = fileName || '';
  const fnMM = fn.match(/^(\d{2})(\d{4})/);
  if (fnMM) return { month: parseInt(fnMM[1]), year: parseInt(fnMM[2]), periodStr: `${fnMM[1]}.${fnMM[2]}` };
  const fnName = fn.match(/([A-Za-zÇĞİÖŞÜçğışöü]+)(\d{4})/i);
  if (fnName) {
    const month = monthNumFromName(fnName[1]);
    const year = parseInt(fnName[2]);
    if (month && year) return { month, year, periodStr: `${fnName[1].toUpperCase()}-${year}` };
  }
  return { month: null, year: null, periodStr: null };
}

// ── Format A Parser (ScaleFocus, Aras Petrol) ─────────────────
//
// Doğrulanmış gerçek satırlar (ScaleFocus):
//   "|GeceMes.\t|0,0|\t0,00|...|GV\t|\t8.912,96|"     ← GV burada!
//   "|GV(İstisnaöncesi)|\t12.228,66|"
//   "|ToplamGVMatr\t|\t81.524,39|"
//   "|GVmatrahı\t|\t81.524,39|"
//   "|Dev.GVMatr.\t|\t0,00|"
//   "|GVİstisnası\t|\t3.315,70|"
//   "|SGKPrimi\t|\t13.724,68|"
//   "|İssizlikSig.\t|\t980,33|"
//   "|ÖzelSağlıkS|\t2.870,28|"
//   "|ToplamKazanç\t|T.Kes...|ToplamKesinti|...|NetÖdenecek\t|{değer değil}|"
//   ← ToplamKazanç değeri YOK bu satırda, SONRAKI satirda
//
// Aras Petrol:
//   "Matrah\t1.500,00"
//   "Gelir Vergisi\t0,00"
//   "Yıl İçi Toplam\t1.500,00"
//   "Kazanç Toplam\t1.764,71"

function parseFormatA(lines) {
  // İstisna öncesi GV ★ — "|GV(İstisnaöncesi)|\t12.228,66|"
  const incomeTaxBeforeExemptionRaw = (() => {
    for (const line of lines) {
      if (/GV\s*\(\s*[İI]stisna\s*[öo]ncesi\s*\)/i.test(line)) {
        const v = tabAmount(line) || amountFromLine(line);
        if (v) return v;
      }
    }
    // Aras Petrol: "Asgari Ücret Gelir Vergisi\t3.315,70" → min wage, no istisna oncesi
    return null;
  })();
  
  // GV (istisna sonrası) — "|GV\t|\t8.912,96|" — satır içi (mid-line)
  let incomeTaxRaw = null;
  for (const line of lines) {
    if (!/\bGV\b/.test(line)) continue;
    if (/[İI]stisna|[Mm]atrah|[Mm]uaf|Toplam|Dev\.|Küm/i.test(line)) continue;
    // Satır içinde GV\t ile tam eşleşme: "|GV\t|\t8.912,96|"
    const m = line.match(/\bGV\b\s*\t\s*\|?\s*([\d.]+,\d{2}|[\d,]+\.\d{2})/);
    if (m) { incomeTaxRaw = m[1]; break; }
    // Alternatif: son col'da GV ile değer
    const m2 = findMidVal(line, /\|GV\s*/);
    if (m2) { incomeTaxRaw = m2; break; }
  }
  
  // Kümülatif GV Matrahı — "ToplamGVMatr"
  const cumulativeGvTaxBaseRaw = (() => {
    for (const line of lines) {
      if (/Toplam\s*GV\s*Matr/i.test(line)) {
        const v = tabAmount(line) || amountFromLine(line);
        if (v) return v;
      }
    }
    // Aras: "Yıl İçi Toplam"
    for (const line of lines) {
      if (/Yıl\s*İçi\s*Toplam/i.test(line)) {
        const v = tabAmount(line) || amountFromLine(line);
        if (v) return v;
      }
    }
    return null;
  })();
  
  // Aylık GV Matrahı — "GVmatrahı" (nonCumul satırlarda)
  let gvTaxBaseRaw = null;
  for (const line of lines) {
    if (/GV\s*matrah/i.test(line) && !/Toplam|Küm/i.test(line)) {
      const v = tabAmount(line) || amountFromLine(line);
      if (v) { gvTaxBaseRaw = v; break; }
    }
    // Aras Petrol: "Matrah\t1.500,00" VERGİ bölümünde (SİGORTA'dan sonra)
    // Bu basit "Matrah" satırı — gelir vergisi matrahı
    if (/^Matrah\s*\t/i.test(line)) {
      const v = tabAmount(line);
      if (v && !gvTaxBaseRaw) gvTaxBaseRaw = v;
    }
  }
  
  // Devirden gelen matrah — "Dev.GVMatr."
  const devirMatrahRaw = (() => {
    for (const line of lines) {
      if (/Dev\.\s*GV\s*Matr/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
    }
    // Aras: "Önceki Ay Matrah"
    for (const line of lines) {
      if (/[ÖO]nceki\s*Ay\s*Matrah/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
    }
    return null;
  })();
  
  // GV İstisnası — "GVİstisnası"
  const minWageExemptionRaw = (() => {
    for (const line of lines) {
      if (/GV\s*[İI]stisnas[ıi]/i.test(line) && !/[öo]ncesi/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
    }
    // Aras: "Asgari Ücret Gelir Vergisi"
    for (const line of lines) {
      if (/Asgari\s*[ÜU]cret\s*Gelir\s*Vergisi/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
    }
    return null;
  })();
  
  // SGK Primi — "SGKPrimi"
  const sgkEmployeeRaw = (() => {
    for (const line of lines) {
      if (/SGK\s*Primi/i.test(line)) {
        const v = tabAmount(line) || amountFromLine(line);
        if (v) return v;
      }
    }
    // Aras: "SİGORTA\tİşçi Prim Tutarı\t247,06"
    for (const line of lines) {
      if (/[İI]ş[çc]i\s*Prim\s*Tutar/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
    }
    return null;
  })();
  
  // İşsizlik Sigortası — "İssizlikSig."
  const unemploymentInsRaw = (() => {
    for (const line of lines) {
      if (/[İI]ssizlik\s*Sig|[İI]şsizlik\s*Sig/i.test(line) && !line.includes('İşveren')) {
        const v = tabAmount(line) || amountFromLine(line);
        if (v) return v;
      }
    }
    // Aras: "İŞSİZLİK\nİşçi Prim Tutarı\t17,65"
    let inIssizlik = false;
    for (const line of lines) {
      if (/^İŞSİZLİK$/i.test(line)) { inIssizlik = true; continue; }
      if (inIssizlik && /[İI]ş[çc]i\s*Prim\s*Tutar/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
      if (inIssizlik && /[İI]şveren/i.test(line)) break;
    }
    return null;
  })();
  
  // Özel Sağlık Sigorta — "ÖzelSağlıkS"
  const privateHealthInsRaw = (() => {
    for (const line of lines) {
      if (/[ÖO]zel\s*Sa[ğg]l[ıi]/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
      if (/[ÖO]zel\s*sig\.\s*[İI]nd/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
    }
    return null;
  })();
  
  // Brüt / Toplam Kazanç — "ToplamKazanç" header (değer sonraki satırda!)
  // Gerçek: "|ToplamKazanç\t|T.Kes.(İstis.önc|..."  → değer sonraki satırda
  const grossSalaryRaw = (() => {
    for (let i = 0; i < lines.length; i++) {
        if (/Toplam\s*Kazanç/i.test(lines[i])) {
        // Doğrudan değer var mı?
        const v = tabAmount(lines[i]);
        if (v && parseNum(v) > 100) return v; // Gerçek bir tutar (100 TL+ ise)
        // Yoksa sonraki satırdaki ilk sayı (kolon 0)
        for (let j = 1; j <= 2; j++) {
          if (i + j < lines.length) {
            const nums = lines[i + j].match(/([\d.]+,\d{2}|[\d,]+\.\d{2})/g);
            if (nums && nums.length > 0) return nums[0];
          }
        }
      }
      // Aras: "Kazanç Toplam\t1.764,71"
      if (/Kazanç\s*Toplam/i.test(lines[i])) {
        const v = tabAmount(lines[i]);
        if (v && parseNum(v) > 100) return v;
      }
    }
    return null;
  })();
  
  // DV (Damga Vergisi)
  let stampTaxRaw = null;
  for (const line of lines) {
    if (!/\bDV\b/.test(line)) continue;
    if (/matrah|[İI]stisna/i.test(line)) continue;
    const m = line.match(/\bDV\b\s*\t\s*([\d.]+,\d{2})/);
    if (m) { stampTaxRaw = m[1]; break; }
  }
  // Format A (Aras): "Damga Vergisi\t0,00"
  if (!stampTaxRaw) {
    for (const line of lines) {
      if (/^Damga\s*Vergisi\s*\t/i.test(line)) {
        stampTaxRaw = tabAmount(line);
        break;
      }
    }
  }
  
  // Net Ödenecek
  const netPayRaw = (() => {
    for (let i = 0; i < lines.length; i++) {
        if (/Net\s*[ÖO]denen|Net\s*[ÖO]denecek|NetÖdenecek/i.test(lines[i])) {
            const v = tabAmount(lines[i]) || amountFromLine(lines[i]);
            if (v) return v;
            for (let j = 1; j <= 2; j++) {
                if (i + j < lines.length) {
                    const nums = lines[i + j].match(/([\d.]+,\d{2}|[\d,]+\.\d{2})/g);
                    if (nums && nums.length > 0) return nums[nums.length - 1]; // genellikle son sütun
                }
            }
        }
    }
    return null;
  })();

  return {
    grossSalary: parseNum(grossSalaryRaw),
    gvTaxBase: parseNum(gvTaxBaseRaw),
    incomeTax: parseNum(incomeTaxRaw),
    incomeTaxBeforeExemption: parseNum(incomeTaxBeforeExemptionRaw),
    minWageExemption: parseNum(minWageExemptionRaw),
    cumulativeGvTaxBase: parseNum(cumulativeGvTaxBaseRaw),
    devirMatrah: parseNum(devirMatrahRaw),
    stampTax: parseNum(stampTaxRaw),
    sgkEmployee: parseNum(sgkEmployeeRaw),
    unemploymentIns: parseNum(unemploymentInsRaw),
    privateHealthIns: parseNum(privateHealthInsRaw),
    netPay: parseNum(netPayRaw),
  };
}

// ── Format B Parser (ING Hubs, Nitto) ────────────────────────────────────────
//
// Doğrulanmış gerçek satırlar:
//  "Ek Kazanç ToplamÕ\t44,204.99\t30,604.60\tGelir Vergisi MatrahÕ\t173,657.06"
//  "--------------------------------\tKüm.Gelir Vergisi MatrahÕ\t467,977.66"
//  "Gelir Vergisi\t44,389.85"
//  "Gelir Vergisi\tøstisnasÕ\t3,315.70"
//  "Kesilen Gelir Vergisi\t41,074.15"
//  "Brüt Kazanç ToplamÕ\t207,218.06"
//  "Tic.Sic.No / Mersis No :...\tAy / YÕl :\tNisan 2025"

function parseFormatB(lines) {
  let gvTaxBaseRaw = null;
  let cumulativeGvTaxBaseRaw = null;
  
  for (const line of lines) {
    // Kümülatif: "Küm.Gelir Vergisi Matrah..." + tab + sayı
    if (/Küm\.?.*?Matrah/i.test(line) && !cumulativeGvTaxBaseRaw) {
      const v = tabAmount(line) || amountFromLine(line);
      if (v) cumulativeGvTaxBaseRaw = v;
    }
    // Aylık GV Matrahı: Bu satır mid-line olarak geliyor
    // "Ek Kazanç Toplam\tÕ\t44,204.99\t30,604.60\tGelir Vergisi Matrah\tÕ\t173,657.06"
    if (/Gelir\s*Vergisi\s*Matrah/i.test(line) && !/Küm/i.test(line)) {
      // Tab sonrası son değeri al
      const parts = line.split(/\t/);
      // Last non-empty part that looks like a number
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i].trim();
        if (/^[\d.,]+$/.test(p) && p.length > 2) {
          if (!gvTaxBaseRaw) gvTaxBaseRaw = p;
          break;
        }
      }
    }
  }
  
  // GV İstisna Öncesi ★ — "Gelir Vergisi\t44,389.85" (İstisna/Kesilen/Matrah içerMEYEN)
  let incomeTaxBeforeExemptionRaw = null;
  for (const line of lines) {
    if (!/Gelir\s*Vergisi/i.test(line)) continue;
    if (/[İIøi]stisna|Kesilen|Matrah|Küm/i.test(line)) continue;
    const v = tabAmount(line);
    if (v && !incomeTaxBeforeExemptionRaw) {
      incomeTaxBeforeExemptionRaw = v;
    }
  }
  
  const kesilenGvRaw = (() => {
    for (const line of lines) {
      if (/Kesilen\s*Gelir\s*Vergisi/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
    }
    return null;
  })();
  
  // GV İstisnası: "Gelir Vergisi\tøstisnasÕ\t3,315.70"
  const minWageExemptionRaw = (() => {
    for (const line of lines) {
      if (/Gelir\s*Vergisi.*([İIøi]stisna|stisnas)/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
    }
    return null;
  })();
  
  // Özel Vergi İndirimi
  const ozelVergiIndirimiRaw = (() => {
    for (const line of lines) {
      if (/[ÖO]zel\s*Vergi\s*[İI]ndirimi|Ek\s*Vergi\s*[İI]ndirimi/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
    }
    return null;
  })();
  
  // Brüt Kazanç — "Brüt Kazanç ToplamÕ\t207,218.06"
  const grossSalaryRaw = (() => {
    for (const line of lines) {
      if (/Brüt\s*Kazanç\s*Toplam/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
    }
    return null;
  })();
  
  // SGK İşçi Primi
  const sgkEmployeeRaw = (() => {
    for (const line of lines) {
      if (/SGK\s*[İI]ş[çc]i\s*Primi/i.test(line)) return tabAmount(line) || amountFromLine(line);
      if (/^SGK\s*Primi/i.test(line)) return tabAmount(line) || amountFromLine(line);
    }
    return null;
  })();
  
  // İşsizlik Sigortası (encoding: "øúsizlik SigortatÕPrimi")
  const unemploymentInsRaw = (() => {
    for (const line of lines) {
      if (/[İIøi][şsú][şs]?izlik\s*Sigortas/i.test(line) || /[İI]şsizlik\s*Sig/i.test(line)) {
        const v = tabAmount(line) || amountFromLine(line);
        if (v) return v;
      }
    }
    return null;
  })();
  
  const stampTaxRaw = (() => {
    for (const line of lines) {
      if (/Kesilen\s*Damga\s*Vergisi/i.test(line)) return tabAmount(line) || amountFromLine(line);
    }
    return null;
  })();
  
  const netPayRaw = (() => {
    for (const line of lines) {
      if (/Net\s*[ÖO]denen/i.test(line)) {
        const v = tabAmount(line) || amountFromLine(line);
        if (v) return v;
      }
    }
    return null;
  })();
  
  const privateHealthInsRaw = (() => {
    for (const line of lines) {
      if (/Sa[ğg]l[ıiÕ]k\s*Sig\.?\s*[Çc]al[ıiÕ][şs]an/i.test(line)) {
        return tabAmount(line) || amountFromLine(line);
      }
    }
    return null;
  })();
  
  return {
    grossSalary: parseNum(grossSalaryRaw),
    gvTaxBase: parseNum(gvTaxBaseRaw),
    incomeTax: parseNum(kesilenGvRaw),
    incomeTaxBeforeExemption: parseNum(incomeTaxBeforeExemptionRaw),
    minWageExemption: parseNum(minWageExemptionRaw),
    cumulativeGvTaxBase: parseNum(cumulativeGvTaxBaseRaw),
    devirMatrah: 0,
    ozelVergiIndirimi: parseNum(ozelVergiIndirimiRaw),
    stampTax: parseNum(stampTaxRaw),
    sgkEmployee: parseNum(sgkEmployeeRaw),
    unemploymentIns: parseNum(unemploymentInsRaw),
    privateHealthIns: parseNum(privateHealthInsRaw),
    netPay: parseNum(netPayRaw),
  };
}

// ── Format C Parser (Çevre Mühendislik) ──────────────────────────────────────
//
// Gerçek satır (yeni pdfParser - item.width bazlı):
// "ERDEM AYAZ 45982329350 18.11.2025\t25.000,00G 13\t13,574.01 13,574.01\t0.00 13,574.01 2,816.61 1,900.36 11,537.91 664.99 39.59 10,833.33\t0.00 271.48 135.74"
// Sütun haritası (tab grupları):
//   tab[0]: isim TCKN tarih (kimlik)
//   tab[1]: ücret G/S gün
//   tab[2]: NormKaz TopKaz
//   tab[3]: Diger SSKMat SSKIsv SSKIsci GVM GelVer DamgaV NOdenen (8 sayı)
//   tab[4]: GVIst IssPIsv IssPIsci (3 sayı)

function parseFormatC(lines) {
  let employerName = null;
  let periodInfo = { month: null, year: null, periodStr: null };

  for (const line of lines) {
    if (/Kurum\s*Ad/i.test(line)) {
      const m = line.match(/Kurum\s*Ad[^:\t]*[:\t]+\s*([^\tAdres]+?)(?:\tAdres|\s*Adres|$)/i);
      if (m) employerName = m[1].trim();
    }
    const mPeriod = line.match(/([A-ZÇĞİÖŞÜa-zçğışöü]+)\s*\/\s*(\d{4})/i);
    if (mPeriod && monthNumFromName(mPeriod[1])) {
      periodInfo = {
        month: monthNumFromName(mPeriod[1]),
        year: parseInt(mPeriod[2]),
        periodStr: `${mPeriod[1].toUpperCase()}-${mPeriod[2]}`,
      };
    }
  }

  // Kişi veri satırı: 11 haneli TCKN VE sayısal değer içeren satır
  let dataLine = null;
  for (const line of lines) {
    if (/\b\d{11}\b/.test(line) && (/([\d]+,[\d]{2}|[\d]+\.[\d]{2})/.test(line))) {
      dataLine = line;
    }
  }

  if (!dataLine) {
    return {
      format: 'FORMAT_C', parseStatus: 'partial', employerNameOverride: employerName, ...periodInfo,
      grossSalary: 0, gvTaxBase: 0, incomeTax: 0, incomeTaxBeforeExemption: 0,
      minWageExemption: 0, cumulativeGvTaxBase: 0, devirMatrah: 0,
      stampTax: 0, sgkEmployee: 0, unemploymentIns: 0, privateHealthIns: 0, netPay: 0,
    };
  }

  // Tab[0]=kimlik+ücret(G suffix) — sayı regex bu "G"'li değeri atlar ✓
  // Tab[1] ve sonrası: bazı sayfalarda NormKaz+TopKaz tab[1]'de, bazılarında tab[2]'de
  // Güvenli: tab[1]'den itibaren TÜM finansal sayıları sırayla topla
  // Ücret (25.000,00) zaten tab[0]'da "G" suffix ile olduğu için regex yakalamaz
  
  const tabs = dataLine.split('\t');
  const numRegex = /([\d]+\.[\d]{3},[\d]{2}|[\d]+,[\d]{3}\.[\d]{2}|[\d]+,[\d]{2}|[\d]+\.[\d]{2})/g;
  
  // Tab[1]'den itibaren finansal sayıları topla (gün sayısı "5","18" ondalıksız → regex atlar)
  const dataColumns = [];
  for (let ti = 1; ti < tabs.length; ti++) {
    const nums = Array.from((tabs[ti] || '').matchAll(numRegex)).map(m => parseNum(m[1]));
    dataColumns.push(...nums);
  }
  
  // Sütun haritası (13 kolon, ücret başta DEĞİL):
  // [0]=NormKaz [1]=TopKaz [2]=Diger [3]=SSKMat [4]=SSKIsv [5]=SSKIsci
  // [6]=GVM [7]=GelVer [8]=DamgaV [9]=NOdenen [10]=GVIst [11]=IssPIsv [12]=IssPIsci
  //
  // NOT: bazı sayfalarda tab[1]="25.000,00 13" → ücret sayısal (G yok) → dataColumns[0]=ücret
  // Bunu detect et: dataColumns[0] > 10000 → ücret, idx+1'den başla
  let off = 0;
  if (dataColumns.length >= 14 && dataColumns[0] > 5000) {
    off = 1; // ilk sayı ücret → atla
  }
  const col = (i) => (off + i) < dataColumns.length ? dataColumns[off + i] : 0;
  
  const gvMatrah = col(6);
  const kesilenGV = col(7);
  const gvIstisnasi = col(10);
  const incomeTaxBeforeExemption = kesilenGV + gvIstisnasi;
  const grossSalary = col(1) || col(0);
  const sgkEmployee = col(5);
  const stampTax = col(8);
  const unemploymentIns = col(12);
  const netPay = col(9);
  const hasData = (gvMatrah > 0.01 || kesilenGV >= 0 || gvIstisnasi >= 0);


  return {
    format: 'FORMAT_C',
    employerNameOverride: employerName,
    parseStatus: hasData ? 'success' : 'partial',
    grossSalary,
    gvTaxBase: gvMatrah,
    incomeTax: kesilenGV,
    incomeTaxBeforeExemption,
    minWageExemption: gvIstisnasi,
    cumulativeGvTaxBase: gvMatrah,
    devirMatrah: 0,
    stampTax,
    sgkEmployee,
    unemploymentIns,
    privateHealthIns: 0,
    netPay,
    ...periodInfo,
  };
}



// ── Ana Fonksiyon ─────────────────────────────────────────────


export function extractBordroFields(text, fileName) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const format = detectFormat(text);
  
  const employerName = extractEmployerName(lines) || 'Bilinmiyor';
  const { month, year, periodStr } = extractPeriod(lines, fileName);
  
  let fields;
  const warnings = [];
  
  if (format === 'FORMAT_A') {
    fields = parseFormatA(lines);
  } else if (format === 'FORMAT_B') {
    fields = parseFormatB(lines);
  } else if (format === 'FORMAT_C') {
    fields = parseFormatC(lines);
  } else {
    fields = {
      grossSalary: 0, gvTaxBase: 0, incomeTax: 0, incomeTaxBeforeExemption: 0,
      minWageExemption: 0, cumulativeGvTaxBase: 0, devirMatrah: 0, stampTax: 0,
      sgkEmployee: 0, unemploymentIns: 0, privateHealthIns: 0, netPay: 0,
    };
    warnings.push('Bu bordro formatı tanınamadı — lütfen manuel girin.');
  }
  
  // Format C'nin kendi dönem/işveren bilgileri varsa kullan
  const finalMonth = (format === 'FORMAT_C' && fields.month) ? fields.month : month;
  const finalYear = (format === 'FORMAT_C' && fields.year) ? fields.year : year;
  const finalPeriod = (format === 'FORMAT_C' && fields.periodStr) ? fields.periodStr : periodStr;
  const finalEmployer = (format === 'FORMAT_C' && fields.employerNameOverride)
    ? fields.employerNameOverride
    : employerName;
  
  // GV İstisna Öncesi fallback
  if (fields.incomeTaxBeforeExemption == null || fields.incomeTaxBeforeExemption === 0) {
    if (fields.incomeTax != null && fields.minWageExemption != null) {
      fields.incomeTaxBeforeExemption = fields.incomeTax + fields.minWageExemption;
    } else {
      fields.incomeTaxBeforeExemption = fields.incomeTax || 0;
    }
  }
  
  // Kümülatif matrah fallback
  if (!fields.cumulativeGvTaxBase && fields.gvTaxBase) {
    fields.cumulativeGvTaxBase = fields.gvTaxBase;
    warnings.push('Kümülatif matrah bulunamadı — aylık matrah kullanıldı.');
  }
  
  // 2024 ve öncesi için uyarı
  if (finalYear && finalYear < 2025) {
    warnings.push(`Bu bordro ${finalYear} yılına ait — 2025 beyanı dışında.`);
  }
  
  const record = {
    fileName,
    format,
    parseStatus: format === 'FORMAT_UNKNOWN' ? 'partial' : (fields.parseStatus || 'success'),
    warnings,
    period: finalPeriod,
    month: finalMonth,
    year: finalYear,
    employerName: finalEmployer,
    ...fields,
    rawText: text.substring(0, 2000),
  };
  
  // Zorunlu alan kontrolleri
  if (record.gvTaxBase == null || record.gvTaxBase === 0) {
    record.warnings.push('Aylık GV Matrahı bulunamadı — lütfen manuel girin.');
    record.parseStatus = 'partial';
  }
  if (record.incomeTax == null && record.incomeTaxBeforeExemption == null) {
    record.warnings.push('Kesilen GV bulunamadı — lütfen manuel girin.');
    record.parseStatus = 'partial';
  }
  if (!record.month || !record.year) {
    record.warnings.push('Dönem bilgisi çıkarılamadı — lütfen manuel girin.');
    record.parseStatus = 'partial';
  }
  
  return record;
}
