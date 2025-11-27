import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

// =============== TEST ROUTES ===============

// Root test
app.get("/", (req, res) => {
  res.send("SPI Browser API is running.");
});

// Test simple route
app.get("/test", (req, res) => {
  res.json({ message: "Test route OK" });
});

// =============== SCRAPE SPI ROUTE ===============
// Example: /spi/nsw/2750/penrith
app.get("/spi/:state/:postcode/:suburb", async (req, res) => {
  try {
    const { state, postcode, suburb } = req.params;

    const url = `https://www.smartpropertyinvestment.com.au/data/${state}/${postcode}/${suburb}`;
    console.log("Fetching:", url);

    const response = await fetch(url);
    if (!response.ok) return res.status(500).json({ error: "SPI returned an error" });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for growth report rows
    const growthRows = [];
    $("table tr").each((_, row) => {
      const tds = $(row).find("td");
      if (tds.length === 3) {
        growthRows.push({
          metric: $(tds[0]).text().trim(),
          house: $(tds[1]).text().trim(),
          unit: $(tds[2]).text().trim(),
        });
      }
    });

    res.json({
      success: true,
      suburb,
      state,
      postcode,
      growth: growthRows
    });

  } catch (err) {
    console.error("SCRAPE ERROR:", err);
    res.status(500).json({ error: "Failed to scrape SPI", details: err.toString() });
  }
});

// =============== START SERVER ===============
app.listen(PORT, () => {
  console.log(`SPI API running on port ${PORT}`);
});
