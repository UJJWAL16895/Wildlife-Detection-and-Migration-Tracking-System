const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        await page.goto('http://127.0.0.1:8080/wildlife-vision/index.html', { waitUntil: 'networkidle0' });
        
        await page.evaluate(() => {
            window.scrollTo(0, 1080);
        });
        
        await new Promise(r => setTimeout(r, 1000));

        const firstCard = await page.evaluate(() => {
            const c = document.querySelector('.animal-card');
            const style = window.getComputedStyle(c);
            const rect = c.getBoundingClientRect();
            return {
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            };
        });
        console.log('First card after scroll:', firstCard);

        await browser.close();
    } catch (e) {
        console.error('PUPPETEER ERROR:', e.message);
    }
})();
