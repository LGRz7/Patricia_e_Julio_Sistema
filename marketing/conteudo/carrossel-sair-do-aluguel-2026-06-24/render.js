// Renderiza cada .slide do carrossel.html em PNG 1080x1350.
// Uso: node render.js   (precisa de playwright instalado/acessível)
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

(async () => {
  const htmlPath = "file://" + path.resolve(__dirname, "carrossel.html");
  const outDir = path.resolve(__dirname, "instagram");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2,
  });
  await page.goto(htmlPath, { waitUntil: "networkidle" });
  // espera as fontes carregarem
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);

  const slides = await page.$$(".slide");
  for (let i = 0; i < slides.length; i++) {
    const nome = String(i + 1).padStart(2, "0");
    await slides[i].screenshot({
      path: path.join(outDir, `slide-${nome}.png`),
    });
    console.log("ok slide-" + nome);
  }

  await browser.close();
  console.log("Pronto: " + outDir);
})();
