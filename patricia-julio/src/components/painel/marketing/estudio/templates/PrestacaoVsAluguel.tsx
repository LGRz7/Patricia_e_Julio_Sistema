"use client"

/**
 * PrestacaoVsAluguel.tsx — Post editorial premium 1:1 (1080×1080).
 *
 * Baseado nos padrões editoriais do MazyOS:
 *   - Fundo navy sólido (sem foto)
 *   - Manrope 800 nos números gigantes
 *   - Contraste alto entre "aluguel" (opacidade baixa) e "prestação" (sky)
 *   - Diferença destacada com stamp editorial
 *   - CRECIs + handle no rodapé
 */

import { PALETA } from "@/data/painel/templates-marketing"

const MANROPE = "var(--font-display), 'Manrope', 'Inter', sans-serif"

export function PrestacaoVsAluguel({ dados }: { dados: Record<string, string> }) {
  const aluguel = parseValor(dados.aluguel) || 2500
  const prestacao = parseValor(dados.prestacao) || 2100
  const bairro = (dados.bairro?.trim() || "Fonseca")
  const descricao = dados.descricao?.trim() || "financiamento com FGTS · 30 anos"
  const gancho = dados.gancho?.trim() || "Pra quem paga aluguel"
  const diferenca = aluguel - prestacao

  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        overflow: "hidden",
        background: PALETA.navy,
        fontFamily: MANROPE,
        padding: "72px 76px",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* Decoração sutil de fundo — casa */}
      <div
        style={{
          position: "absolute",
          right: -120,
          bottom: -80,
          width: 500,
          height: 500,
          opacity: 0.05,
          pointerEvents: "none",
        }}
      >
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
          <path
            d="M 20 45 L 50 20 L 80 45 L 80 85 L 20 85 Z"
            fill="none"
            stroke={PALETA.beige}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect x="43" y="60" width="14" height="25" fill={PALETA.beige} />
        </svg>
      </div>

      {/* TOPO — marca + tag */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
          zIndex: 2,
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
            border: "1.5px solid rgba(200, 217, 230, 0.5)",
            color: PALETA.sky,
            padding: "8px 18px",
            borderRadius: 999,
          }}
        >
          {gancho}
        </div>
      </div>

      {/* MEIO — Comparativo lado a lado */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            color: PALETA.sky,
            marginBottom: 40,
          }}
        >
          Em {bairro} · a real da conta
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            alignItems: "start",
          }}
        >
          {/* COLUNA ALUGUEL — vai embora */}
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.28em",
                color: PALETA.beige,
                opacity: 0.5,
                marginBottom: 12,
              }}
            >
              Aluguel
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: PALETA.beige,
                  opacity: 0.5,
                }}
              >
                R$
              </span>
              <span
                style={{
                  fontSize: 96,
                  fontWeight: 800,
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                  color: PALETA.beige,
                  opacity: 0.55,
                  textDecoration: "line-through",
                  textDecorationThickness: 3,
                  textDecorationColor: "rgba(200,217,230,0.4)",
                }}
              >
                {formatarValor(aluguel)}
              </span>
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: PALETA.beige,
                opacity: 0.6,
                marginTop: 8,
              }}
            >
              /mês · nada volta pra você
            </div>
          </div>

          {/* COLUNA PRESTAÇÃO — vira patrimônio */}
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.28em",
                color: PALETA.sky,
                marginBottom: 12,
              }}
            >
              Prestação
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: PALETA.sky,
                }}
              >
                R$
              </span>
              <span
                style={{
                  fontSize: 96,
                  fontWeight: 800,
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                  color: PALETA.beige,
                }}
              >
                {formatarValor(prestacao)}
              </span>
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: PALETA.sky,
                marginTop: 8,
              }}
            >
              /mês · vira imóvel seu
            </div>
          </div>
        </div>

        {/* Diferença */}
        {diferenca > 0 && (
          <div
            style={{
              marginTop: 48,
              padding: "20px 24px",
              borderLeft: `4px solid ${PALETA.sky}`,
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.24em",
                color: PALETA.sky,
              }}
            >
              Economia
            </span>
            <span
              style={{
                fontSize: 46,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: PALETA.beige,
              }}
            >
              R$ {formatarValor(diferenca)}
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: PALETA.beige,
                opacity: 0.75,
              }}
            >
              por mês · {descricao}
            </span>
          </div>
        )}
      </div>

      {/* RODAPÉ */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 18,
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
            fontSize: 18,
            fontWeight: 700,
            color: PALETA.sky,
          }}
        >
          @julio_e_patricia_corretores
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================
function parseValor(raw: string | undefined): number {
  if (!raw) return 0
  const clean = String(raw).replace(/\D/g, "")
  if (!clean) return 0
  const n = Number(clean)
  return isFinite(n) && n > 0 ? n : 0
}

function formatarValor(valor: number): string {
  return new Intl.NumberFormat("pt-BR").format(valor)
}
