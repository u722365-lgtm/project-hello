const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  console.log("Navigating to settings...");
  try {
    await page.goto('http://localhost:8081/settings', { waitUntil: 'domcontentloaded' });
    console.log("Page loaded!");

    // Wait for nav to appear
    await page.waitForSelector('nav');
    
    // Click on 'General' section
    const generalButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent && b.textContent.includes('General'));
    });

    if (generalButton) {
      console.log("Clicking General...");
      await page.evaluate(b => b.click(), generalButton);
      await new Promise(r => setTimeout(r, 1000));
      console.log("Clicked successfully, checking if DOM updated...");
      console.log("Current URL:", page.url());
      const html = await page.content();
      if (html.includes('Appearance and interface')) {
         console.log("SUCCESS: General section loaded.");
      } else {
         console.log("ERROR: General section text not found after click.");
      }
      await page.screenshot({ path: 'settings_screenshot.png' });
    } else {
      console.log("General button not found.");
    }
  } catch(e) {
    console.error("Nav error:", e);
    const html = await page.content();
    console.log("HTML at crash:", html);
  }
  
  await browser.close();
})();
