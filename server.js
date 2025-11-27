import express from "express";
import puppeteer from "puppeteer";

const app = express();

// === Root check ===
app.get("/", (req, res) => {
  res.send("SPI Browser API is running.");
});

// === SPI scraping route ===
app.get("/spi", async (req, res) => {
  const { state, suburb } = req.query;

  if (!state || !suburb) {
    return res.status(400).json({
      error: "Missing required query parameters ?state=NSW&suburb=Penrith"
    });
  }

  const url = `https://www.smartpropertyinvestment.com.au/data/${state.toLowerCase()}/${suburb.toLowerCase()}`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const scrapedData = await page.evaluate(() => {
      const getText = (sel) =>
        document.querySelector(sel)?.innerText?.trim() || null;

      return {
        median3yrHouse: getText("table tr:nth-child(3) td:nth-child(2)"),
        median5yrHouse: getText("table tr:nth-child(4) td:nth-child(2)"),
        median3yrUnit: getText("table tr:nth-child(3) td:nth-child(3)"),
        median5yrUnit: getText("table tr:nth-child(4) td:nth-child(3)")
      };
    });

    res.json({ suburb, state, url, scrapedData });
  } catch (error) {
    console.error("Scrape error:", error);
    res.status(500).json({ error: "Failed to scrape SPI data", details: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SPI API running on port ${PORT}`);
});
