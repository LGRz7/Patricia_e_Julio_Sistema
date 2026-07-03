/**
 * render.js — script central de renderização de posts.
 * Renderiza todos os .html da pasta. Carrossel (.slide) → um PNG por slide.
 * Post único → screenshot da page inteira (1080x1350).
 *
 * Uso: node render.js
 */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

(async () => {
  const dir = __dirname;
  const outDir = path.join(dir, "instagram");
  fs.mkdirSync(outDir, { recursive: true });

  const htmlFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
  if (!htmlFiles.length) { console.log("Nenhum .html encontrado."); return; }

  const browser = await chromium.launch();

  for (const file of htmlFiles) {
    const base = file.replace(".html", "");
    const url = "file://" + path.join(dir, file);

    // primeira passada: descobre quantos slides tem e a altura total da página
    const probe = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
    await probe.goto(url, { waitUntil: "networkidle" });
    await probe.evaluate(() => document.fonts.ready);
    const slideCount = await probe.$$eval(".slide", els => els.length);
    const bodyH = await probe.evaluate(() => document.body.scrollHeight);
    await probe.close();

    if (slideCount === 0) {
      // post único
      const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(600);
      const nome = `${base}.png`;
      await page.screenshot({ path: path.join(outDir, nome) });
      await page.close();
      console.log("ok " + nome);
      continue;
    }

    // carrossel: abre com viewport alto o suficiente pra conter todos os slides
    const fullH = Math.max(bodyH, slideCount * 1350 + slideCount * 60);
    const page = await browser.newPage({ viewport: { width: 1080, height: fullH }, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);

    const boxes = await page.$$eval(".slide", els =>
      els.map(el => {
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      })
    );

    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      const nome = `${base}-${String(i + 1).padStart(2, "0")}.png`;
      await page.screenshot({
        path: path.join(outDir, nome),
        clip: { x: Math.max(0, b.x), y: Math.max(0, b.y), width: 1080, height: 1350 },
      });
      console.log("ok " + nome);
    }

    await page.close();
  }

  await browser.close();
  console.log("\nPronto! Arquivos em: " + outDir);
})();
