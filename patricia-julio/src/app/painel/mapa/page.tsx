"use client"

import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"

// Leaflet só no client — SSR quebra (window)
const ProspectionMap = dynamic(() => import("@/components/painel/mapa/ProspectionMap"), { ssr: false })

export default function PainelMapa() {
  return (
    <div className="px-4 lg:px-10 pt-4 lg:pt-10 pb-10 space-y-3 lg:space-y-4">
      <header>
        <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal whitespace-nowrap">Mapa</div>
        <h1 className="mt-1 font-display text-[22px] lg:text-[30px] font-bold text-navy leading-tight whitespace-nowrap">Trajeto até um imóvel</h1>
        <p className="hidden sm:block text-[12.5px] text-navy/70 mt-1 max-w-xl">
          Filtre por estado, cidade, bairro e categoria, clique num pin pra ver o imóvel e defina sua origem pra calcular distância, tempo e custo.
        </p>
      </header>

      <ProspectionMap />
    </div>
  )
}
