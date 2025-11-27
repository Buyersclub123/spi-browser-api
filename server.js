import express from "express";
import fetch from "node-fetch";
import cheerio from "cheerio";

const app = express();

app.get("/", (req, res) => {
  res.send("SPI Browser API is running.");
});

app.get("/test", (req, res) => {
  res.send("Test route placeholder.");
});

app.get("/spi", async (req, res) => {
  const { state, postcode, suburb } = req.query;

  if (!state || !postcode || !suburb) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const url = `https://www.smartpropertyinvestment.com.au/data/${state}/${postcode}/${suburb}`;

  try {
    const response = await fetch(url);
    const html = await response.text();

    const $ = cheerio.load(html);

    // Helper to find label and return second column
    function extractValue(labelText) {
      let value = null;

      $("tr").each((_, row) => {
        const rowText = $(row).text().trim().toLowerCase();
        if (rowText.includes(labelText.toLowerCase())) {
          const cells = $(row).find("td");
          value = $(cells[1]).text().trim() || null;
        }
      });

      return value;
    }

    const result = {
      median_3y_house: extractValue("median 3 years"),
      median_5y_house: extractValue("median 5 years"),
      median_3y_unit:
        extractValue("median 3 years (unit)") ||
        extractValue("median 3yr") ||
        extractValue("median 3 years unit"),
      median_5y_unit:
        extractValue("median 5 years (unit)") ||
        extractValue("median 5yr") ||
        extractValue("median 5 years unit"),
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SPI scrape error", detail: err.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
