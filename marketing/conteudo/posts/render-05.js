const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const dir = __dirname;
  const out = path.join(dir, "instagram");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.goto("file://" + path.join(dir, "post-autoridade-05.html"), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, "post-autoridade-05.png") });
  await page.close();
  await browser.close();
  console.log("ok post-autoridade-05");
})();
