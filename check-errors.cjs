const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message));

    console.log('Navigating...');
    const response = await page.goto('https://erp-suharacore.netlify.app/login', { waitUntil: 'networkidle' });
    console.log('Status:', response.status());

    await browser.close();
})();
