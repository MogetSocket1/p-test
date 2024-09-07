const puppeteer = require('puppeteer');
const { exec } = require("node:child_process");
const { promisify } = require("node:util");

(async () => {
  const { stdout: chromiumPath } = await promisify(exec)("which chromium");
  
  if (!chromiumPath) {
    throw new Error("Chromium غير مثبت.");
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process"
    ],
    executablePath: chromiumPath.trim(),
    defaultViewport: { width: 430, height: 932 }
  });

  const page = await browser.newPage();
  
  await page.goto('https://ytmp3.ch/en22/', { waitUntil: 'networkidle2' });

  const inputSelector = 'input[placeholder="Please paste a YouTube address with https:// or http://"]';
  const youtubeLink = 'https://youtu.be/3nQNiWdeH2Q?si=WOqnbwTlSiTnbLHF';
  await page.type(inputSelector, youtubeLink);

  await page.keyboard.press('Enter');

  await page.waitForSelector('div.download-success-image img');
  
  const imageData = await page.evaluate(() => {
    const imageElement = document.querySelector('div.download-success-image img');
    return {
      icon: imageElement.getAttribute('src'),
      video_name: imageElement.getAttribute('alt')
    };
  });

  await page.waitForSelector('div.download-btn-right a');

  const downloadLink = await page.evaluate(() => {
    const linkElement = document.querySelector('div.download-btn-right a');
    return linkElement.getAttribute('href');
  });

  /*const result = {
    image: imageData,
    downloadLink: downloadLink
  };*/

  const result = {
    imageData,
    downloadLink: downloadLink
  };

  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
