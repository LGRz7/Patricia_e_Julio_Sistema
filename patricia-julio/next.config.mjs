/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  typescript: {
    // Ignora erros de TypeScript no build (para deploy)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora erros de ESLint no build (para deploy)
    ignoreDuringBuilds: true,
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
