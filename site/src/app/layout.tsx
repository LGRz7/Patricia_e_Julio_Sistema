import type { Metadata } from "next";
import { Inter, Manrope, Playfair_Display } from "next/font/google";
import "@/styles/globals.css";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { CopyGuard } from "@/components/providers/CopyGuard";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsappFloat } from "@/components/ui/WhatsappFloat";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/data/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

// Fonte serifada editorial — usada nos títulos dos criativos do Estúdio.
// Referência: identidade/design-guide.md ("títulos: serifada elegante").
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.nome} — ${site.assinatura}`,
    template: `%s · ${site.nome}`,
  },
  description: site.descricao,
  openGraph: {
    title: `${site.nome} — ${site.assinatura}`,
    description: site.descricao,
    type: "website",
    locale: "pt_BR",
    url: site.url,
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${manrope.variable} ${playfair.variable}`}>
      {/* suppressHydrationWarning: alguns providers (Lenis/GSAP) e extensões de
          navegador (ex: Grammarly, LastPass) injetam styles no <body> antes
          da hidratação. É seguro suprimir aqui — não afeta nada visual. */}
      <body className="font-sans antialiased" suppressHydrationWarning>
        <CopyGuard />
        <JsonLd />
        <SmoothScroll>
          <Header />
          <main id="conteudo">{children}</main>
          <Footer />
          <WhatsappFloat />
        </SmoothScroll>
      </body>
    </html>
  );
}
