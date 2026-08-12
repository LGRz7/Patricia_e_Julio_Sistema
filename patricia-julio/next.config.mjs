/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Deps que rodam SÓ no server (scraper com Playwright + stealth). Marcar como
  // externas evita o webpack tentar bundle-las (dinâmicos require() quebram).
  experimental: {
    serverComponentsExternalPackages: [
      "playwright",
      "playwright-extra",
      "puppeteer-extra-plugin",
      "puppeteer-extra-plugin-stealth",
      "@react-pdf/renderer",
    ],
  },
};

export default nextConfig;
