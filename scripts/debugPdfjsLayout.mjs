import { createRequire } from 'module';
import { readFileSync } from 'fs';

const require = createRequire(import.meta.url);
let pdfjsLib;
try {
  pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
} catch(e) {
  pdfjsLib = await import('pdfjs-dist');
}
// Do not set workerSrc in node if it throws

async function extractText(fpath) {
  const buf = readFileSync(fpath);
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

(async () => {
  const f = '/Users/erayayaz/Desktop/Bordro/Agustos2025_ERAY_AYAZ_unlocked.pdf';
  try {
    const text = await extractText(f);
    const lines = text.split('\n');
    lines.forEach((l, i) => console.log(`${i}: ${l}`));
  } catch (e) {
    console.error(e);
  }
})();
