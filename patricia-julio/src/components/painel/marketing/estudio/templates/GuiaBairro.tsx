"use client"

/**
 * GuiaBairro.tsx — Post editorial premium 4:5 (1080×1350).
 *
 * Padrão editorial:
 *   - Foto do bairro full-bleed
 *   - Overlay gradient duplo (topo leve + base pesada)
 *   - Título grande em Manrope 800
 *   - 3 pontos numerados com destaque em sky
 *   - CTA + CRECIs no rodapé
 */

import { Camera } from "lucide-react"
import { PALETA } from "@/data/painel/templates-marketing"

const MANROPE = "var(--font-display), 'Manrope', 'Inter', sans-serif"

export function GuiaBairro({ dados }: { dados: Record<string, string> }) {
  const foto = dados.foto || ""
  const bairro = dados.bairro?.trim() || "Icaraí"
  const titulo = dados.titulo?.trim() || `3 coisas que ninguém te conta sobre ${bairro}`
  const pontos = (dados.pontos || "Padaria a pé em qualquer esquina\nTravessia até Zona Sul em 20 min de barca\nMenor m² que a Barra por qualidade parecida")
    .split(/[\n,]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 3)
  const cta = dados.cta?.trim() || "Salva esse post e chama pra conversar"

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
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
            <Camera size={80} strokeWidth={1.3} color={PALETA.sky} style={{ opacity: 0.5 }} />
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: PALETA.sky,
                opacity: 0.6,
              }}
            >
              Adicione uma foto do bairro
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY GRADIENT — mais escuro embaixo pra dar espaço ao texto */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(27, 37, 48, 0.6) 0%, rgba(27, 37, 48, 0.1) 22%, rgba(27, 37, 48, 0.55) 55%, rgba(27, 37, 48, 0.96) 100%)",
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
          padding: "72px 76px",
          color: PALETA.beige,
        }}
      >
        {/* TOPO — marca + tag do bairro */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: PALETA.beige,
            }}
          >
            Patrícia e Júlio<span style={{ opacity: 0.45 }}>*</span>
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.28em",
              border: "1.5px solid rgba(200, 217, 230, 0.55)",
              color: PALETA.sky,
              padding: "10px 20px",
              borderRadius: 999,
            }}
          >
            Guia · {bairro}
          </div>
        </div>

        {/* BASE — texto principal */}
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: PALETA.sky,
              marginBottom: 22,
            }}
          >
            Antes de se mudar
          </div>

          {/* Título */}
          <h1
            style={{
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              maxWidth: "16ch",
              color: PALETA.beige,
              margin: 0,
              marginBottom: 34,
            }}
          >
            {titulo}
          </h1>

          {/* Lista de 3 pontos */}
          <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 36 }}>
            {pontos.map((ponto, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 20,
                  marginBottom: 18,
                }}
              >
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: PALETA.sky,
                    lineHeight: 1,
                    minWidth: 44,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: PALETA.beige,
                    opacity: 0.9,
                    flex: 1,
                    paddingTop: 4,
                  }}
                >
                  {ponto}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: PALETA.sky,
              paddingBottom: 22,
              borderBottom: "1.5px solid rgba(200, 217, 230, 0.25)",
              marginBottom: 22,
            }}
          >
            {cta}
          </div>

          {/* CRECIs + handle */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.7,
                opacity: 0.75,
                color: PALETA.beige,
              }}
            >
              Patrícia Vidal · CRECI 68850
              <br />
              Júlio Aguiar · CRECI 79271
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: PALETA.sky,
              }}
            >
              @julio_e_patricia_corretores
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
