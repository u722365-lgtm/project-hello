const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function generatePDF() {
  const htmlPath = path.resolve(__dirname, 'report.html');
  const outputPath = path.resolve(__dirname, 'ShadowTalk_AI_Comprehensive_Architecture_Analysis.pdf');
  
  console.log('Reading report HTML from:', htmlPath);
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  console.log('Launching headless browser via Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log('Setting page HTML content...');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  console.log('Generating PDF to:', outputPath);
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm'
    }
  });

  await browser.close();
  console.log('PDF generated successfully!');
  const stats = fs.statSync(outputPath);
  console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
}

generatePDF().catch(err => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
