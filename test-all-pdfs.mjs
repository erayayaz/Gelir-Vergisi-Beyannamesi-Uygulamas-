import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// --- MOCK formatters.js for Node ---
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import the extractBordroFields
const extractorPath = path.join(__dirname, 'src/services/bordroExtractor.js');

async function extractTextFromPdf(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let allText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items.filter(i => i.str.trim());
    if (items.length === 0) continue;
    
    // Group by Y
    const lineMap = new Map();
    for (const item of items) {
      const y = Math.round(item.transform[5]);
      let targetY = y;
      for (const existingY of lineMap.keys()) {
        if (Math.abs(existingY - y) <= 3) { targetY = existingY; break; }
      }
      if (!lineMap.has(targetY)) lineMap.set(targetY, []);
      lineMap.get(targetY).push({ x: item.transform[4], str: item.str, w: item.width || 0 });
    }
    
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
          const prevRight = prev.x + (prev.w > 0 ? prev.w : prev.str.length * 4.0);
          const gap = item.x - prevRight;
          if (gap > 12) lineText += '\t';
          else if (gap >= 0.5) lineText += ' ';
          lineText += item.str;
        }
      }
      if (lineText.trim()) allText += lineText + '\n';
    }
    allText += '\n';
  }
  return allText;
}

async function run() {
  const { extractBordroFields } = await import(extractorPath);
  
  const dirs = [
    '/Users/erayayaz/Desktop/Bordro',
    '/Users/erayayaz/Desktop/Erdem Bordro - 2025'
  ];
  
  let total = 0;
  let success = 0;
  
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
      for (const file of files) {
        total++;
        const filePath = path.join(dir, file);
        try {
          const text = await extractTextFromPdf(filePath);
          const record = extractBordroFields(text, file);
          console.log(`[${record.parseStatus}] ${file} | Format: ${record.format} | Employer: ${record.employerName} | Period: ${record.month}-${record.year} | Gross: ${record.grossSalary} | IncomeTax: ${record.incomeTax}`);
          if (record.parseStatus === 'success') success++;
        } catch (err) {
          console.log(`[ERROR] ${file} | ${err.message}`);
        }
      }
    }
  }
  console.log(`\nResults: ${success}/${total} success.`);
}

run();
