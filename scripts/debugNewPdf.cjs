const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const dir = '/Users/erayayaz/Desktop/Bordro';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

async function dumpText(fpath) {
  const buf = fs.readFileSync(fpath);
  const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const parser = new PDFParse(uint8);
  await parser.load();
  const res = await parser.getText();
  return res.pages.map(p => p.text).join('\n');
}

(async () => {
  for (const f of files) {
    if (f.startsWith('.')) continue; // skip hidden
    
    // Pick just one of the UNLOCKED files to inspect
    if (f.includes('Nisan2025') || f.includes('Agustos2025')) {
      console.log('\n==== FILE:', f, '====');
      try {
        const text = await dumpText(path.join(dir, f));
        
        // Print lines, filtered to first 60 to avoid spam
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        console.log(`Found ${lines.length} lines. First 60:`);
        lines.slice(0, 60).forEach((l, i) => console.log(i+':', JSON.stringify(l)));
      } catch (e) {
        console.error('Error on', f, e.message);
      }
    }
  }
})();
