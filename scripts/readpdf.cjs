const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const files = [
  '/Users/erayayaz/Desktop/Bordro/012025 eray ayaz.pdf',
  '/Users/erayayaz/Desktop/Bordro/022025 eray ayaz.pdf',
  '/Users/erayayaz/Desktop/Bordro/032025 eray ayaz.pdf',
];

async function main() {
  for (const f of files) {
    console.log('='.repeat(70));
    console.log('FILE:', path.basename(f));
    console.log('='.repeat(70));
    try {
      const buf = fs.readFileSync(f);
      const data = await pdfParse(buf);
      console.log('NUM_PAGES:', data.numpages);
      console.log('TEXT (first 5000 chars):');
      console.log(data.text.substring(0, 5000));
      console.log('\n--- JSON repr (first 4000 chars) ---');
      console.log(JSON.stringify(data.text.substring(0, 4000)));
    } catch(e) {
      console.error('ERROR:', e.message);
    }
    console.log('\n');
  }
}

main().catch(console.error);
