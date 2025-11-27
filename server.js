import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/spi", async (req, res) => {
  const suburb = req.query.suburb;
  const state = req.query.state;

  if (!suburb || !state) {
    return res.status(400).json({ error: "suburb and state are required" });
  }

  const url = `https://www.smartpropertyinvestment.com.au/data/${state.toLowerCase()}/${suburb
    .toLowerCase()
    .replace(" ", "-")}`;

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const data = await page.evaluate(() => {
      const getValue = (label) => {
        const row = [...document.querySelectorAll("tr")].find((r) =>
          r.innerText.includes(label)
        );
        return row ? row.querySelector("td:nth-child(2)")?.innerText?.trim() : null;
      };

      return {
        median3yHouse: getValue("Median 3 years"),
        median5yHouse: getValue("Median 5 years"),
        median3yUnit: getValue("Median 3yr (Unit)") || getValue("Median 3 years (Unit)"),
        median5yUnit: getValue("Median 5yr (Unit)") || getValue("Median 5 years (Unit)"),
      };
    });

    await browser.close();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to scrape SPI" });
  }
});

app.listen(PORT, () => {
  console.log(`SPI API running on port ${PORT}`);
});
