"use client"

/**
 * StoryFotoGrande.tsx — Story editorial premium 9:16 (1080×1920).
 *
 * Padrão editorial:
 *   - Foto vertical full-bleed
 *   - Overlay gradient duplo (topo leve + base pesada)
 *   - Gancho grande em Manrope 800
 *   - Palavra final destacada em sky
 *   - CTA arredondado no rodapé
 */

import { Camera } from "lucide-react"
import { PALETA } from "@/data/painel/templates-marketing"

const MANROPE = "var(--font-display), 'Manrope', 'Inter', sans-serif"

export function StoryFotoGrande({ dados }: { dados: Record<string, string> }) {
  const foto = dados.foto || ""
  const bairro = dados.bairro?.trim() || "Icaraí"
  const gancho = dados.gancho?.trim() || "Vista permanente em Icaraí"
  const subtitulo = dados.subtitulo?.trim() || "78m² · 2 quartos · a partir de R$ 620 mil"
  const cta = dados.cta?.trim() || "Chama no WhatsApp"

  // Destaca a última palavra do gancho
  const palavras = gancho.split(" ")
  const destaque = palavras[palavras.length - 1]
  const resto = palavras.slice(0, -1).join(" ")

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        position: "relative",
        overflow: "hidden",
        background: "#1B2530",
        fontFamily: MANROPE,
      }}
    >
      {/* FOTO FULL-BLEED */}
      <div style={{ position: "absolute", inset: 0 }}>
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt=""
            crossOrigin="anonymous"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center center",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              background: `linear-gradient(135deg, ${PALETA.navy} 0%, #1B2530 100%)`,
            }}
          >
            <Camera size={100} strokeWidth={1.3} color={PALETA.sky} style={{ opacity: 0.5 }} />
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: PALETA.sky,
                opacity: 0.6,
              }}
            >
              Adicione uma foto vertical
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY DUPLO */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(27, 37, 48, 0.55) 0%, rgba(27, 37, 48, 0.05) 24%, rgba(27, 37, 48, 0.05) 46%, rgba(27, 37, 48, 0.94) 100%)",
        }}
      />

      {/* CONTEÚDO */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "100px 84px 120px",
          color: PALETA.beige,
        }}
      >
        {/* TOPO — marca + tag */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: PALETA.beige,
            }}
          >
            Patrícia e Júlio<span style={{ opacity: 0.45 }}>*</span>
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.28em",
              border: "1.5px solid rgba(200, 217, 230, 0.5)",
              color: PALETA.sky,
              padding: "12px 22px",
              borderRadius: 999,
            }}
          >
            {bairro}
          </div>
        </div>

        {/* BASE — gancho grande + CTA */}
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: PALETA.sky,
              marginBottom: 30,
            }}
          >
            Vem ver
          </div>

          <h1
            style={{
              fontSize: 110,
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: "-0.045em",
              maxWidth: "12ch",
              color: PALETA.beige,
              margin: 0,
              marginBottom: 36,
            }}
          >
            {resto}{" "}
            <span style={{ color: PALETA.sky }}>{destaque}</span>
          </h1>

          <p
            style={{
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.4,
              color: PALETA.beige,
              opacity: 0.85,
              maxWidth: "22ch",
              marginBottom: 60,
              margin: 0,
            }}
          >
            {subtitulo}
          </p>

          {/* CTA botão */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              background: PALETA.beige,
              color: PALETA.navy,
              fontSize: 30,
              fontWeight: 700,
              padding: "26px 52px",
              borderRadius: 999,
              marginTop: 60,
              boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
            }}
          >
            <svg width={26} height={26} viewBox="0 0 24 24" fill={PALETA.navy}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
            </svg>
            {cta}
          </div>

          <div
            style={{
              marginTop: 44,
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1.7,
              opacity: 0.75,
              color: PALETA.beige,
            }}
          >
            Patrícia Vidal · CRECI 68850 · Júlio Aguiar · CRECI 79271
          </div>
        </div>
      </div>
    </div>
  )
}
