// ============================================================
// PDF Parse Servisi — pdfjs-dist ile metin çıkarma v3
// Kolon yapısını tab ile, kelime boşluklarını space ile korur.
// ============================================================
// ============================================================
// Safari ReadableStream Polyfill for pdf.js
// ============================================================
if (typeof ReadableStream !== 'undefined' && !ReadableStream.prototype[Symbol.asyncIterator]) {
  ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  };
}

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * PDF dosyasından tam metni çıkarır.
 * - Aynı Y koordinatındaki öğeler aynı satır sayılır (±3px tolerans)
 * - İki öğe arası gap > 12px ise TAB (kolon ayırıcı)
 * - İki öğe arası gap 1..12px ise SPACE (kelime ayırıcı)
 * - İki öğe arası gap < 1px ise birleşik (harf parçaları, Türkçe karakter split'i)
 */
export async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ 
    data: arrayBuffer,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
  }).promise;

  let allText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items.filter(i => i.str.trim());

    if (items.length === 0) continue;

    // Y koordinatına göre satır grupla (±3px tolerans)
    const lineMap = new Map();
    for (const item of items) {
      const y = Math.round(item.transform[5]);
      let targetY = y;
      for (const existingY of lineMap.keys()) {
        if (Math.abs(existingY - y) <= 3) {
          targetY = existingY;
          break;
        }
      }
      if (!lineMap.has(targetY)) lineMap.set(targetY, []);
      lineMap.get(targetY).push({
        x: item.transform[4],
        str: item.str,
        w: item.width || 0,
      });
    }

    // Satırları yukarıdan aşağıya sırala (y azalan)
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);

    for (const y of sortedYs) {
      const lineItems = lineMap.get(y).sort((a, b) => a.x - b.x);

      let lineText = '';
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        if (i === 0) {
          lineText += item.str;
        } else {
          const prev = lineItems[i - 1];
          // Önceki öğenin sağ kenarı
          const prevRight = prev.x + (prev.w > 0 ? prev.w : prev.str.length * 4.0);
          const gap = item.x - prevRight;

          if (gap > 12) {
            // Büyük boşluk → kolon ayırıcı (TAB)
            lineText += '\t';
          } else if (gap >= 0.5) {
            // Kelime boşluğu → SPACE
            lineText += ' ';
          }
          // gap < 0.5 → birleşik harf/karakter (boşluk ekleme)
          lineText += item.str;
        }
      }

      if (lineText.trim()) {
        allText += lineText + '\n';
      }
    }

    allText += '\n';
  }

  return allText;
}

/**
 * PDF'in görsel tabanlı (taranmış) olup olmadığını kontrol eder
 */
export function isScannedPdf(text) {
  const cleaned = text.replace(/\s/g, '');
  return cleaned.length < 100;
}
