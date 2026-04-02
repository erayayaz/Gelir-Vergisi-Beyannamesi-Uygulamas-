import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractTextFromPdf(path) {
  const data = new Uint8Array(fs.readFileSync(path));
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

const file = process.argv[2];
extractTextFromPdf(file).then(text => {
  console.log(text);
}).catch(err => {
  console.error(err);
});
