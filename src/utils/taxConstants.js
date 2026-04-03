// ============================================================
// 2025 Gelir Vergisi Sabitleri
// GVK Madde 86, 103, 23/18 — Haziran 2025 güncel
// ============================================================

export const TAX_CONSTANTS_2025 = {
  year: 2025,

  // GVK Madde 103 — Ücret geliri vergi dilimleri
  brackets: [
    { limitMin: 0,         limitMax: 158_000,     rate: 0.15, cumulativeBase: 0 },
    { limitMin: 158_000,   limitMax: 330_000,     rate: 0.20, cumulativeBase: 23_700 },
    { limitMin: 330_000,   limitMax: 1_200_000,   rate: 0.27, cumulativeBase: 58_100 },
    { limitMin: 1_200_000, limitMax: 4_300_000,   rate: 0.35, cumulativeBase: 293_000 },
    { limitMin: 4_300_000, limitMax: Infinity,    rate: 0.40, cumulativeBase: 1_378_000 },
  ],

  // GVK Madde 86 — Beyanname sınırları
  singleEmployerThreshold: 4_300_000,      // Tek işveren sınırı
  secondaryEmployersThreshold: 330_000,    // 2. ve sonraki işverenler toplamı sınırı

  // GVK Madde 23/18 — Asgari ücret istisnası (2025)
  minWage: {
    monthlyGross: 26_005.50,
    annualGross: 312_066,
    monthlyNet: 22_104.67,
    // Aylık ortalama istisna miktarı (SGK payı düşüldükten sonra matrahın %15'i)
    // Bordrolarda gözlemlenen değer: ~3.315,70 TL/ay
    monthlyExemptionAvg: 3_315.70,
  },

  // Damga Vergisi oranı ve Sabit Damga Vergisi (2025)
  stampTaxRate: 0.00759,
  generalStampTax: 1189.50, // Yıllık Gelir Vergisi Beyannamesi Damga Vergisi

  // GVK Madde 21 — Kira (GMSİ) Mesken İstisnası (2025)
  rentExemption: 47000,
  rentExpenseRate: 0.15, // Götürü gider oranı %15

  // Ay isimleri (bordro parse için)
  monthNames: {
    'OCAK': 1, 'ŞUBAT': 2, 'MART': 3, 'NİSAN': 4,
    'MAYIS': 5, 'HAZİRAN': 6, 'TEMMUZ': 7, 'AĞUSTOS': 8,
    'EYLÜL': 9, 'EKİM': 10, 'KASIM': 11, 'ARALIK': 12,
    'JANUARY': 1, 'FEBRUARY': 2, 'MARCH': 3, 'APRIL': 4,
    'MAY': 5, 'JUNE': 6, 'JULY': 7, 'AUGUST': 8,
    'SEPTEMBER': 9, 'OCTOBER': 10, 'NOVEMBER': 11, 'DECEMBER': 12,
    'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4,
    'JUN': 6, 'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12,
  },
};

// 2026 referans (bilgi amaçlı)
export const TAX_CONSTANTS_2026 = {
  year: 2026,
  singleEmployerThreshold: 5_300_000,
  secondaryEmployersThreshold: 400_000,
  minWage: {
    monthlyGross: 33_030,
    annualGross: 396_360,
  },
  rentExemption: 58000,
  generalStampTax: 1400.00, // Tahmini
};
