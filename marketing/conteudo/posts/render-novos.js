const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const dir = __dirname;
  const out = path.join(dir, "instagram");
  const files = ["post-autoridade-03", "post-autoridade-05"];
  const browser = await chromium.launch();

  for (const f of files) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    await page.goto("file://" + path.join(dir, f + ".html"), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, f + ".png") });
    await page.close();
    console.log("ok " + f);
  }

  await browser.close();
  console.log("Pronto!");
})();
