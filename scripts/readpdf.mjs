// Script: read PDF raw text using pdfjs-dist (same library as the app)
import { createRequire } from 'module';
import { readFileSync } from 'fs';

const require = createRequire(import.meta.url);
// Use CommonJS require to avoid ESM worker issues
let pdfjsLib;
try {
  pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
} catch(e) {
  pdfjsLib = await import('pdfjs-dist');
}

const files = [
  '/Users/erayayaz/Desktop/Bordro/012025 eray ayaz.pdf',
  '/Users/erayayaz/Desktop/Bordro/022025 eray ayaz.pdf',
  '/Users/erayayaz/Desktop/Bordro/032025 eray ayaz.pdf',
];

pdfjsLib.GlobalWorkerOptions.workerSrc = false;

async function readPdf(filePath) {
  const data = readFileSync(filePath);
  const uint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const pdf = await pdfjsLib.getDocument({ data: uint8, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Group by Y coordinate - lines
    const lineMap = new Map();
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({ x: item.transform[4], str: item.str });
    }
    
    // Sort lines top-to-bottom (descending y), items left-to-right
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const items = lineMap.get(y).sort((a, b) => a.x - b.x);
      fullText += items.map(i => i.str).join(' ').trim() + '\n';
    }
    fullText += '\n';
  }
  
  return fullText;
}

for (const f of files) {
  console.log('='.repeat(70));
  console.log('FILE:', f.split('/').pop());
  console.log('='.repeat(70));
  try {
    const text = await readPdf(f);
    console.log(text.substring(0, 5000));
    console.log('\n--- RAW LINE DUMP (first 3000 chars repr) ---');
    console.log(JSON.stringify(text.substring(0, 3000)));
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  console.log('\n');
}
