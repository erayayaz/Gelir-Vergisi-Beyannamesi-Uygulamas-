const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function dump(fpath) {
  const buf = fs.readFileSync(fpath);
  const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const parser = new PDFParse(uint8);
  await parser.load();
  const res = await parser.getText();
  const lines = res.pages[0].text.split('\n').map(l => l.trim()).filter(Boolean);
  
  console.log('--- Lines containing "Matrah" ---');
  lines.forEach((l, i) => { if (l.includes('Matrah')) console.log(`${i}: ${l}`) });
  
  console.log('\n--- Lines containing "Vergi" ---');
  lines.forEach((l, i) => { if (l.includes('Vergi')) console.log(`${i}: ${l}`) });
  
  console.log('\n--- Lines containing "SGK" ---');
  lines.forEach((l, i) => { if (l.includes('SGK')) console.log(`${i}: ${l}`) });

  console.log('\n--- Lines containing "Kazanç" ---');
  lines.forEach((l, i) => { if (l.includes('Kazanç')) console.log(`${i}: ${l}`) });

  console.log('\n--- Lines containing "Ödenecek" or "Net" ---');
  lines.forEach((l, i) => { if (l.includes('Ödenecek') || l.includes('Net')) console.log(`${i}: ${l}`) });

  console.log('\n--- Full Dump of Lines 35-65 ---');
  for (let i = 35; i <= Math.min(65, lines.length-1); i++) {
    console.log(`${i}: ${lines[i]}`);
  }
}

dump('/Users/erayayaz/Desktop/Bordro/Agustos2025_ERAY_AYAZ_unlocked.pdf').catch(console.error);
