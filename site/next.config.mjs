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
      "playwright-core",
      "playwright-extra",
      "puppeteer-extra-plugin",
      "puppeteer-extra-plugin-stealth",
      "@sparticuz/chromium",
      "@react-pdf/renderer",
    ],
    // Força o Next a copiar o /bin do @sparticuz/chromium (binário Brotli do
    // Chromium) pro bundle da rota de geração — sem isso o tracer perde o dir e
    // launchChromium quebra em prod com "input directory does not exist".
    outputFileTracingIncludes: {
      "/api/marketing/gerar": [
        "./node_modules/@sparticuz/chromium/bin/**",
      ],
      "/api/acm/buscar-comparaveis": [
        "./node_modules/@sparticuz/chromium/bin/**",
      ],
    },
  },
};

export default nextConfig;
