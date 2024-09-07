const express = require('express');
const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const { promisify } = require('util');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the YTMP3 API!',
    description: 'This API allows you to convert YouTube videos to MP3 format.',
    usage: 'Make a GET request to /apis/ytmp3?q=<YouTube-Link> to get the download link and video information.',
    developer: 'PolyDev'
  });
});

app.get('/apis/ytmp3', async (req, res) => {
  const youtubeLink = req.query.q;

  if (!youtubeLink) {
    return res.status(400).json({ error: 'YouTube link query parameter is required.' });
  }

  try {
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

    const result = {
      icon: imageData.icon,
      video_name: imageData.video_name,
      downloadLink: downloadLink
    };

    await browser.close();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
