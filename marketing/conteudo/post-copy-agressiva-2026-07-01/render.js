const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

(async () => {
  const htmlPath = "file://" + path.resolve(__dirname, "post.html");
  const outDir = path.resolve(__dirname, "instagram");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2,
  });
  await page.goto(htmlPath, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(outDir, "post-01.png") });
  console.log("ok post-01.png");

  await browser.close();
  console.log("Pronto: " + outDir);
})();
