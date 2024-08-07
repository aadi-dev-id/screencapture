const cors = require('cors');
const mime = require('mime');
const express = require('express');
const bodyParser = require('body-parser');
const responseTime = require('response-time');
const puppeteer = require('puppeteer');
const gm = require('gm').subClass({ imageMagick: '7+' });
const { Buffer } = require('buffer');
const { createCanvas, loadImage } = require('canvas');


const app = express();

app.use(cors());
app.use(responseTime());
app.set('trust proxy', true);
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({
    limit: '2mb',
    extended: false,
}));

const TERMINATE_BROWSER_TIMEOUT = 10 * 60 * 1000;
let browser = null;
browserTimer = 0;

async function initiateBrowser() {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process', '--flag-switches-begin', '--ignore-certificate-errors', '--flag-switches-end', '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'] });
    console.log("Browser running!");
};

function terminateBrowser() {
    clearTimeout(browserTimer);
    browserTimer = setTimeout(() => {
        browser.close();
        browser = null;
    }, TERMINATE_BROWSER_TIMEOUT);
}


const captureScreenshot = async (data) => {
    if (!browser) await initiateBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1080, height: 720 });
    if (isValidURL(data)) await page.goto(data, { waitUntil: 'load', timeout: 0 });
    else await page.setContent(htmlTemplate(data));
    const buffer = await page.screenshot();
    await page.close();
    terminateBrowser();
    return buffer;
}

const htmlTemplate = (body) => {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, 
initial-scale=1.0"></head><body>${body}</body></html>`;
}

const isValidURL = (string) => {
    try {
        const parsedURL = new URL(string);
        return (parsedURL.protocol && parsedURL.host) ? true : false;
    } catch (error) {
        return false;
    }
};

//default route
app.get('/ping', (req, res) => {
    res.status(200).end('Application Started Pong!');
});


app.post('/process-thumbnail', async (req, res) => {
    const { data, handleAsync = true } = req.body;
    let resp = { success: true, message: 'initiated', error: null};
    
    try {
        let thumbnailBuffer;

        thumbnailBuffer = await captureScreenshot(data);

        resp = { ...resp, message: `Image process complete for object `, result: [{ body: uploadStatus, metaData }] };
        logger.info(resp.message);
    } catch (error) {
        logger.error('error =>' + error.message);
        resp = { ...resp, message: `Image process failed for object`, error: error.message, success: false };
    } finally {
        // console.log("resp thumbnail",resp);
        resp = { ...resp, message: `Image process failed for object `, error: error.message, success: false };
        if (!handleAsync) res.send(resp);
        return resp
    }
});



const port = 9500;
app.listen(port, () => console.log(`Listening on port ${port}`));

module.exports = app;
