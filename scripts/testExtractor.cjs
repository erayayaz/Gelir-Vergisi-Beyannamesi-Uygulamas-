// Test script: validate new bordroExtractor against actual PDF text
const fs = require('fs');
const { PDFParse } = require('pdf-parse');

// Mirror the extractor logic in CJS for testing
function extractAmountFromLine(line) {
  const match = line.match(/\t\s*([\d\.]+,\d{2})\s*(?:\|?)$/);
  if (match) return match[1];
  const match2 = line.match(/([\d\.]+,\d{2})\s*\|?\s*$/);
  if (match2) return match2[1];
  return null;
}

function findLineValue(lines, labelPattern) {
  for (const line of lines) {
    const test = typeof labelPattern.test === 'function' ? labelPattern.test(line) : line.includes(labelPattern);
    if (test) {
      const amount = extractAmountFromLine(line);
      if (amount !== null) return amount;
    }
  }
  return null;
}

function parseTR(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

async function testPdf(fpath) {
  const buf = fs.readFileSync(fpath);
  const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const parser = new PDFParse(uint8);
  await parser.load();
  const result = await parser.getText();
  const text = result.pages[0].text;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const fields = {
    // İşveren
    employerName: (() => {
      for (const line of lines) {
        if (/İş\s*Yeri\s*Ünvan/i.test(line)) {
          const m = line.match(/:\s*([^|]+)/);
          if (m) return m[1].trim();
        }
      }
      return null;
    })(),
    employerVKN: (() => {
      for (const line of lines) {
        if (/Tic\.Sic\.No/i.test(line)) {
          const m = line.match(/:\s*([\d\-]+)/);
          if (m) return m[1];
        }
      }
      return null;
    })(),
    period: (() => {
      for (const line of lines) {
        const m = line.match(/Dönem[:\s]*([A-ZÇĞİÖŞÜa-zçğışöü]+[\s\-]\d{4})/i);
        if (m) return m[1];
      }
      return null;
    })(),
    gvTaxBase: findLineValue(lines, /Toplam GV Matr/i) || findLineValue(lines, /GV matrahı/i),
    sgkTaxBase: findLineValue(lines, /SGK matrahı/i),
    dvTaxBase: findLineValue(lines, /DV matrahı/i),
    incomeTax: findLineValue(lines, /^GV\s*\t|^\|?GV\s*\|/),
    incomeTaxBeforeExemption: findLineValue(lines, /GV\(İstisna\s*öncesi\)/i),
    minWageExemption: findLineValue(lines, /GV\s*İstisnası/i),
    stampTax: findLineValue(lines, /^DV\s*\t|^\|?DV\s*\|/),
    sgkEmployee: findLineValue(lines, /SGK\s*Primi/i),
    unemploymentIns: findLineValue(lines, /İssizlik\s*Sig/i),
    privateHealthIns: findLineValue(lines, /Özel\s*sig\.\s*İnd/i),
    grossSalary: findLineValue(lines, /Toplam\s*Kazanç/i),
    netPay: findLineValue(lines, /Net\s*Ödenecek/i),
  };

  console.log('\nExtracted fields:');
  for (const [k, v] of Object.entries(fields)) {
    const num = parseTR(v);
    console.log(`  ${k.padEnd(30)}: ${v !== null ? v + (num ? ` (${num})` : '') : '❌ NOT FOUND'}`);
  }
  
  // Compare with known values for 012025
  const expected = {
    gvTaxBase: 81524.39,
    incomeTax: 8912.96,
    minWageExemption: 3315.70,
    sgkEmployee: 13724.68,
    unemploymentIns: 980.33,
    grossSalary: 104379.68,
    netPay: 77891.43,
  };
  
  console.log('\nValidation:');
  let pass = 0, fail = 0;
  for (const [k, expected_val] of Object.entries(expected)) {
    const actual = parseTR(fields[k]);
    const ok = Math.abs(actual - expected_val) < 1;
    console.log(`  ${ok ? '✅' : '❌'} ${k}: expected=${expected_val}, actual=${actual}`);
    ok ? pass++ : fail++;
  }
  console.log(`\n  ${pass}/${pass+fail} fields correct`);
}

(async () => {
  const f = '/Users/erayayaz/Desktop/Bordro/012025 eray ayaz.pdf';
  console.log('Testing bordro extraction for:', f.split('/').pop());
  await testPdf(f);
})().catch(console.error);
