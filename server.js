import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("SPI Browser API is running.");
});

// Temporary disable the test route because Puppeteer is not installed here yet
app.get("/test", (req, res) => {
  res.send("Test route placeholder.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
