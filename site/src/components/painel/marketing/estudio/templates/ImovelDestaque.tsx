"use client"

/**
 * ImovelDestaque.tsx — Post editorial premium 4:5 (1080×1350).
 *
 * Baseado no design de:
 *   - marketing/conteudo/posts/post-copy-agressiva.html
 *   - marketing/conteudo/posts/post-autoridade-03.html
 *   - marketing/conteudo/posts/post-autoridade-05.html
 *
 * Padrão editorial:
 *   - Foto full-bleed (sem faixa)
 *   - Overlay gradient em duas camadas (topo leve + base pesada)
 *   - Manrope 800 no título grande (80-86px)
 *   - Destaque em sky (#C8D9E6) em uma palavra do headline
 *   - Tag arredondada com borda no canto superior direito
 *   - CRECIs + handle no rodapé
 */

import { Camera } from "lucide-react"
import { PALETA } from "@/data/painel/templates-marketing"

// Manrope da variável CSS do next/font
const MANROPE = "var(--font-display), 'Manrope', 'Inter', sans-serif"

export function ImovelDestaque({ dados }: { dados: Record<string, string> }) {
  const foto = dados.foto || ""
  const titulo = dados.titulo?.trim() || "Vista permanente em Icaraí"
  const preco = parsePreco(dados.preco)
  const bairro = (dados.bairro?.trim() || "Icaraí")
  const gancho = dados.gancho?.trim() || bairro
  const caracteristicas = (dados.caracteristicas || "78m² · 2 quartos · 1 vaga")
    .split(/[,\n·]/)
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 4)

  // Divide o título em partes para destacar a última palavra em sky
  const tituloPartes = quebrarTituloComDestaque(titulo)

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
      {/* ============= FOTO FULL-BLEED ============= */}
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
          <FotoPlaceholder />
        )}
      </div>

      {/* ============= OVERLAY GRADIENT DUPLO ============= */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(27, 37, 48, 0.65) 0%, rgba(27, 37, 48, 0.05) 32%, rgba(27, 37, 48, 0.05) 48%, rgba(27, 37, 48, 0.92) 100%)",
        }}
      />

      {/* ============= CONTEÚDO ============= */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          color: PALETA.beige,
          fontFamily: MANROPE,
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
              fontFamily: MANROPE,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: PALETA.beige,
            }}
          >
            Patrícia e Júlio
            <span style={{ opacity: 0.45 }}>*</span>
          </div>
          <div
            style={{
              fontFamily: MANROPE,
              fontSize: 15,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.28em",
              border: "1.5px solid rgba(200, 217, 230, 0.55)",
              color: PALETA.sky,
              padding: "10px 20px",
              borderRadius: 999,
            }}
          >
            {gancho}
          </div>
        </div>

        {/* CENTRO/BASE — texto principal */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Label eyebrow */}
          <div
            style={{
              fontFamily: MANROPE,
              fontSize: 17,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: PALETA.sky,
              marginBottom: 26,
            }}
          >
            À venda · {bairro}
          </div>

          {/* Headline grande */}
          <h1
            style={{
              fontFamily: MANROPE,
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: "-0.04em",
              maxWidth: "13ch",
              color: PALETA.beige,
              margin: 0,
            }}
          >
            {tituloPartes.linhas.map((linha, i) => (
              <span key={i} style={{ display: "block" }}>
                {i === tituloPartes.linhas.length - 1 && tituloPartes.destaque ? (
                  <>
                    {linha.substring(0, linha.length - tituloPartes.destaque.length).trim()}{" "}
                    <span style={{ color: PALETA.sky, fontStyle: "normal" }}>
                      {tituloPartes.destaque}
                    </span>
                  </>
                ) : (
                  linha
                )}
              </span>
            ))}
          </h1>

          {/* Preço grande */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              marginTop: 32,
            }}
          >
            <span
              style={{
                fontFamily: MANROPE,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: PALETA.sky,
                textTransform: "uppercase",
              }}
            >
              R$
            </span>
            <span
              style={{
                fontFamily: MANROPE,
                fontSize: 92,
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: "-0.04em",
                color: PALETA.beige,
              }}
            >
              {preco}
            </span>
          </div>

          {/* Características (linhas com bullets tipográficos) */}
          {caracteristicas.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 18px",
                marginTop: 22,
                fontFamily: MANROPE,
                fontSize: 22,
                fontWeight: 500,
                color: PALETA.beige,
                opacity: 0.85,
              }}
            >
              {caracteristicas.map((c, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                  {i > 0 && <span style={{ opacity: 0.5 }}>·</span>}
                  <span>{c}</span>
                </span>
              ))}
            </div>
          )}

          {/* Rodapé com CRECIs + handle */}
          <div
            style={{
              marginTop: 40,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div
              style={{
                fontFamily: MANROPE,
                fontSize: 19,
                fontWeight: 600,
                lineHeight: 1.7,
                opacity: 0.8,
                color: PALETA.beige,
              }}
            >
              Patrícia Vidal · CRECI 68850
              <br />
              Júlio Aguiar · CRECI 79271
            </div>
            <div
              style={{
                fontFamily: MANROPE,
                fontSize: 20,
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

// ============================================================
// FotoPlaceholder — quando não tem foto ainda
// ============================================================
function FotoPlaceholder() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        color: PALETA.teal,
        background: `linear-gradient(135deg, ${PALETA.navy} 0%, #1B2530 100%)`,
      }}
    >
      <Camera size={80} strokeWidth={1.3} color={PALETA.sky} style={{ opacity: 0.5 }} />
      <div
        style={{
          fontFamily: MANROPE,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: PALETA.sky,
          opacity: 0.6,
        }}
      >
        Adicione a foto do imóvel
      </div>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================
function parsePreco(raw: string | undefined): string {
  if (!raw) return "620.000"
  const clean = String(raw).replace(/\D/g, "")
  if (!clean) return "620.000"
  const n = Number(clean)
  if (!isFinite(n) || n <= 0) return "620.000"
  return new Intl.NumberFormat("pt-BR").format(n)
}

/**
 * Quebra o título em linhas e destaca a última palavra ou expressão-chave.
 * Ex: "Vista permanente em Icaraí" → linhas: ["Vista permanente", "em Icaraí"], destaque: "Icaraí"
 */
function quebrarTituloComDestaque(texto: string): { linhas: string[]; destaque: string } {
  const palavras = texto.split(" ").filter(Boolean)
  const totalPalavras = palavras.length
  const destaque = palavras[totalPalavras - 1] || ""

  const linhas: string[] = []
  let atual = ""
  const maxPorLinha = 14

  for (const p of palavras) {
    if ((atual + " " + p).trim().length > maxPorLinha) {
      if (atual) linhas.push(atual.trim())
      atual = p
    } else {
      atual = atual ? atual + " " + p : p
    }
  }
  if (atual) linhas.push(atual.trim())

  return { linhas, destaque }
}
