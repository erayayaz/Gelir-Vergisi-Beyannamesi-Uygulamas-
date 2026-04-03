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
  if (typeof str === 'number') return str;
  const s = str.toString().trim();
  
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  
  let cleaned;
  if (lastComma !== -1 && lastDot !== -1) {
    if (lastDot > lastComma) {
      cleaned = s.replace(/,/g, '');
    } else {
      cleaned = s.replace(/\./g, '').replace(',', '.');
    }
  } else if (lastDot !== -1) {
    const digitsAfterDot = s.length - 1 - lastDot;
    if (digitsAfterDot === 3) {
      cleaned = s.replace(/\./g, '');
    } else {
      cleaned = s;
    }
  } else if (lastComma !== -1) {
    const digitsAfterComma = s.length - 1 - lastComma;
    if (digitsAfterComma === 3) {
       cleaned = s.replace(/,/g, '');
    } else {
       cleaned = s.replace(',', '.');
    }
  } else {
    cleaned = s;
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

export const formatCurrencyInput = (val) => {
  if (val === null || val === undefined) return '';
  let str = val.toString();
  str = str.replace(/[^0-9,]/g, '');
  const parts = str.split(',');
  let intPart = parts[0];
  let decPart = parts.length > 1 ? parts[1].slice(0, 2) : undefined;
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (decPart !== undefined) {
    return `${intPart},${decPart}`;
  }
  return intPart;
};
