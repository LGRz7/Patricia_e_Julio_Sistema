import type { Metadata, Viewport } from "next"
import { PainelShell, BottomNavMobile } from "@/components/painel/Shell"
import { InstallPwaModal } from "@/components/painel/InstallPwaModal"
import { PwaRegister } from "@/components/painel/PwaRegister"
// Leaflet CSS carregado apenas quando necessário (página do mapa)

export const metadata: Metadata = {
  title: "Painel dos Corretores",
  description: "Ferramenta interna dos corretores Patrícia Vidal e Júlio Aguiar. Mapa de trajeto, catálogo e finanças.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "PJ Painel",
    statusBarStyle: "black-translucent",
  },
  robots: { index: false, follow: false }, // painel interno — não indexar
}

export const viewport: Viewport = {
  themeColor: "#2F4156",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <PainelLayoutInner>{children}</PainelLayoutInner>
  )
}

// Wrapper que decide se mostra o shell (rotas autenticadas) ou não (/painel/login)
import { LayoutSwitch } from "@/components/painel/LayoutSwitch"

function PainelLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LayoutSwitch shell={PainelShell} bottomNav={BottomNavMobile}>
        {children}
      </LayoutSwitch>
      <InstallPwaModal />
      <PwaRegister />
    </>
  )
}
