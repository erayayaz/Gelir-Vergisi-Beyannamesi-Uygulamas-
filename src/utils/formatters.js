// Sayı formatlama yardımcı fonksiyonları

export const fmtTL = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  return new Intl.NumberFormat('tr-TR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' TL';
};

export const fmtNum = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const parseTRNumber = (str) => {
  if (!str) return 0;
  const s = str.toString().trim();
  
  // Find the last separator (comma or dot)
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  
  let cleaned;
  if (lastDot > lastComma) {
    // US format: 1,234.56 or 1234.56
    // Remove commas, keep dot
    cleaned = s.replace(/,/g, '');
  } else {
    // TR format: 1.234,56 or 1234,56
    // Remove dots, replace comma with dot
    cleaned = s.replace(/\./g, '').replace(',', '.');
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export const monthName = (m) => {
  const names = ['', 'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                 'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  return names[m] || `Ay ${m}`;
};

export const formatPeriod = (year, month) => `${monthName(month)} ${year}`;

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
