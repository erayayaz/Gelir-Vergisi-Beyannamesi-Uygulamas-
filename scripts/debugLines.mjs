import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let pdfjsLib;
try {
  pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
} catch(e) {
  pdfjsLib = await import('pdfjs-dist');
}

async function extractTextFromPdfNode(fpath) {
  const buf = fs.readFileSync(fpath);
  const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const pdf = await pdfjsLib.getDocument({ data: uint8, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
  
  let allText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items.filter(i => i.str.trim());
    if (items.length === 0) continue;
    
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
      lineMap.get(targetY).push({ x: item.transform[4], str: item.str });
    }
    
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const lineItems = lineMap.get(y).sort((a, b) => a.x - b.x);
      let lineText = '';
      let lastX = null;
      for (const item of lineItems) {
        if (lastX !== null && item.x - lastX > 8) lineText += '\t';
        lineText += item.str;
        lastX = item.x + (item.str.length * 4);
      }
      if (lineText.trim()) allText += lineText + '\n';
    }
    allText += '\n';
  }
  return allText;
}

async function debug() {
  const scale = '/Users/erayayaz/Desktop/Bordro/012025 eray ayaz.pdf';
  const text1 = await extractTextFromPdfNode(scale);
  const lines1 = text1.split('\n');
  console.log('--- SCALE FINDINGS ---');
  for(let l of lines1) {
    if (l.includes('GV matrah') || l.includes('GV Matr') || l.includes('GV') || l.includes('Toplam Kazanç')) {
      console.log(JSON.stringify(l));
    }
  }

  const ing = '/Users/erayayaz/Desktop/Bordro/Agustos2025_ERAY_AYAZ_unlocked.pdf';
  const text2 = await extractTextFromPdfNode(ing);
  const lines2 = text2.split('\n');
  console.log('--- ING FINDINGS ---');
  for(let l of lines2) {
    if (l.includes('Matrah') || l.includes('Vergisi') || l.includes('Net Ödenen') || l.includes('Günü')) {
      console.log(JSON.stringify(l));
    }
  }
}

debug().catch(console.error);
