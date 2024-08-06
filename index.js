import { chromium } from 'playwright';

const url = 'https://chaturbuy.com';
const date = new Date(Date.now());

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(url);

const screenshotPath = `screenshots/${date.toISOString()}.png`;

await page.screenshot({
  path: screenshotPath,
  fullPage: false
})

await browser.close();
console.log("done");