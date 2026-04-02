import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { extractBordroFields } from '../src/services/bordroExtractor.js';

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

const dir = '/Users/erayayaz/Desktop/Bordro';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf') && !f.startsWith('.'));

async function testAll() {
  console.log(`Starting test for ${files.length} PDF files...\n`);
  
  let successCount = 0;
  let partialCount = 0;

  for (const f of files) {
    const filePath = path.join(dir, f);
    
    try {
      const text = await extractTextFromPdfNode(filePath);
      const record = extractBordroFields(text, f);
      
      const { parseStatus, warnings, employerName, period, gvTaxBase, incomeTax, grossSalary, netPay, sgkTaxBase, stampTax, sgkEmployee, unemploymentIns, privateHealthIns, incomeTaxBeforeExemption } = record;
      
      const statusIcon = parseStatus === 'success' ? '✅' : '⚠️';
      if (parseStatus === 'success') successCount++;
      else partialCount++;
      
      console.log(`${statusIcon} ${f}`);
      console.log(`   Employer: ${employerName} | Period: ${period}`);
      console.log(`   GV Matrahı: ${gvTaxBase} | Kesilen GV: ${incomeTax}`);
      console.log(`   Brüt: ${grossSalary} | Net: ${netPay}`);
      
      if (warnings.length > 0) {
        console.log(`   Warnings: ${warnings.join(' | ')}`);
      }
      console.log('');
      
    } catch(e) {
      console.error(`❌ ${f} - ERROR: ${e.message}`);
    }
  }
  
  console.log(`\nRESULTS: ${successCount} Success, ${partialCount} Partial/Warnings out of ${files.length} files.`);
}

testAll().catch(console.error);
