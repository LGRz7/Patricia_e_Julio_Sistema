"use client"

/**
 * CarrosselAluguel.tsx — Carrossel editorial premium de 7 slides.
 *
 * Baseado nos designs de:
 *   - marketing/conteudo/posts/carrossel-aluguel.html
 *   - marketing/conteudo/posts/carrossel-sinais-sair-aluguel.html
 *
 * Layout editorial pesado, tipografia Manrope, ícones decorativos de fundo,
 * paleta oficial. Cada slide 1080x1350 (4:5 do Instagram).
 *
 * Renderiza APENAS UM slide por vez baseado em dados._slideAtivo (1-7).
 */

import { PALETA } from "@/data/painel/templates-marketing"

// IMPORTANTE: usar a variável CSS que Next.js gera para a Manrope,
// senão o navegador não encontra a fonte carregada e faz fallback pra Inter.
const MANROPE = "var(--font-display), 'Manrope', 'Inter', sans-serif"

interface Props {
  dados: Record<string, string>
}

export function CarrosselAluguel({ dados }: Props) {
  const slideAtivo = parseInt(dados._slideAtivo || "1", 10)

  const gancho = dados.gancho?.trim() || "Até quando pagar o imóvel dos outros?"
  const eyebrow = dados.eyebrow?.trim() || "Casa própria"
  const valorPerdido = dados.valorPerdido?.trim() || "R$ 90 mil"
  const anos = dados.anos?.trim() || "5 anos"
  const aluguelMes = dados.aluguelMes?.trim() || "R$ 1.500/mês"
  const insight = dados.insight?.trim() || "O problema não é o quanto custa comprar. É o quanto custa adiar."
  const bairro = dados.bairro?.trim() || "São Gonçalo e região"
  const precoDe = dados.precoDe?.trim() || "R$ 170 mil"
  const objecao = dados.objecao?.trim() || "Mas será que eu consigo financiar?"
  const ctaTexto = dados.ctaTexto?.trim() || "Bora achar o seu?"
  const handle = "@julio_e_patricia_corretores"

  // Divide o insight em partes por ponto final (a segunda vira destaque em sky)
  const insightPartes = insight.split(".").map((s) => s.trim()).filter(Boolean)

  // ============================================================
  // Slide 01 · CAPA — navy + chave decorativa
  // ============================================================
  if (slideAtivo === 1) {
    return (
      <Slide bg={PALETA.navy} color={PALETA.beige} contador="01 / 07" handle={handle} arraste
        decoracao={<IconeChave x="right" y="bottom" size={480} rotate={-15} opacity={0.06} color={PALETA.beige} />}
      >
        <Eyebrow color={PALETA.sky}>{eyebrow}</Eyebrow>
        <Rule color={PALETA.beige} />
        <h1
          style={{
            fontFamily: MANROPE,
            fontWeight: 800,
            fontSize: 92,
            lineHeight: 0.98,
            letterSpacing: "-0.04em",
            color: PALETA.beige,
            margin: 0,
          }}
        >
          {quebrarLinhas(gancho, 12)}
        </h1>
      </Slide>
    )
  }

  // ============================================================
  // Slide 02 · NÚMERO IMPACTANTE — beige + casa decorativa
  // ============================================================
  if (slideAtivo === 2) {
    return (
      <Slide bg={PALETA.beige} color={PALETA.navy} contador="02 / 07"
        decoracao={<IconeCasa x="left" y="top" size={340} rotate={-6} opacity={0.06} color={PALETA.navy} />}
      >
        <Eyebrow color={PALETA.teal}>A conta que ninguém mostra</Eyebrow>
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 800,
            fontSize: 200,
            lineHeight: 0.85,
            letterSpacing: "-0.04em",
            color: PALETA.teal,
            marginTop: 30,
            marginBottom: 28,
          }}
        >
          {valorPerdido}
        </div>
        <p
          style={{
            fontFamily: MANROPE,
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.55,
            maxWidth: "22ch",
            color: PALETA.navy,
            margin: 0,
            opacity: 0.85,
          }}
        >
          É quanto some em <b style={{ fontWeight: 700 }}>{anos}</b> com um aluguel de {aluguelMes}. E nada disso vira seu.
        </p>
      </Slide>
    )
  }

  // ============================================================
  // Slide 03 · INSIGHT (escuro) — navy + chave decorativa pequena
  // ============================================================
  if (slideAtivo === 3) {
    return (
      <Slide bg={PALETA.navy} color={PALETA.beige} contador="03 / 07" handle={handle}
        decoracao={<IconeChave x="right" y="top" size={300} rotate={12} opacity={0.05} color={PALETA.beige} />}
      >
        <Eyebrow color={PALETA.sky}>A real</Eyebrow>
        <Rule color={PALETA.beige} />
        <h2
          style={{
            fontFamily: MANROPE,
            fontWeight: 800,
            fontSize: 72,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            color: PALETA.beige,
            margin: 0,
            maxWidth: "14ch",
          }}
        >
          {insightPartes.map((frase, i) => (
            <span
              key={i}
              style={{
                display: "block",
                color: i === 1 ? PALETA.sky : PALETA.beige,
              }}
            >
              {frase}.
            </span>
          ))}
        </h2>
      </Slide>
    )
  }

  // ============================================================
  // Slide 04 · POR ONDE COMEÇAR — beige + casa decorativa grande centralizada
  // ============================================================
  if (slideAtivo === 4) {
    return (
      <Slide bg={PALETA.beige} color={PALETA.navy} contador="04 / 07"
        decoracao={<IconeCasa x="center" y="center" size={600} rotate={-5} opacity={0.04} color={PALETA.navy} />}
      >
        <Eyebrow color={PALETA.teal}>Por onde começar</Eyebrow>
        <Rule color={PALETA.navy} />
        <h2
          style={{
            fontFamily: MANROPE,
            fontWeight: 800,
            fontSize: 72,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            color: PALETA.navy,
            margin: 0,
          }}
        >
          Você não precisa
          <br />
          ter tudo pronto.
        </h2>
        <p
          style={{
            fontFamily: MANROPE,
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.55,
            maxWidth: "22ch",
            marginTop: 34,
            color: PALETA.navy,
            opacity: 0.85,
          }}
        >
          Precisa do <b style={{ fontWeight: 700 }}>primeiro passo certo</b> — e da pessoa certa do seu lado.
        </p>
      </Slide>
    )
  }

  // ============================================================
  // Slide 05 · OFERTA CONCRETA — teal + casa + chave decorativas
  // ============================================================
  if (slideAtivo === 5) {
    return (
      <Slide bg={PALETA.teal} color={PALETA.beige} contador="05 / 07" handle={handle}
        decoracao={
          <>
            <IconeCasa x="right" y="bottom" size={520} rotate={8} opacity={0.08} color={PALETA.beige} />
            <IconeChave x="left" y="bottom" size={300} rotate={-12} opacity={0.08} color={PALETA.beige} />
          </>
        }
      >
        <Eyebrow color={PALETA.sky}>Aqui, dá pra começar</Eyebrow>
        <Rule color={PALETA.beige} />
        <h2
          style={{
            fontFamily: MANROPE,
            fontWeight: 800,
            fontSize: 68,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            color: PALETA.beige,
            margin: 0,
          }}
        >
          Em {bairro},
          <br />
          tem imóvel
          <br />
          a partir de
        </h2>
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 800,
            fontSize: 130,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: PALETA.beige,
            marginTop: 24,
          }}
        >
          {precoDe}
        </div>
      </Slide>
    )
  }

  // ============================================================
  // Slide 06 · OBJEÇÃO RESPONDIDA — beige + aspa gigante decorativa
  // ============================================================
  if (slideAtivo === 6) {
    return (
      <Slide bg={PALETA.beige} color={PALETA.navy} contador="06 / 07">
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 800,
            fontSize: 340,
            lineHeight: 0.7,
            opacity: 0.14,
            height: 130,
            color: PALETA.teal,
            marginBottom: 20,
          }}
        >
          &ldquo;
        </div>
        <h2
          style={{
            fontFamily: MANROPE,
            fontWeight: 800,
            fontSize: 72,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            color: PALETA.navy,
            margin: 0,
          }}
        >
          &ldquo;{objecao}&rdquo;
        </h2>
        <p
          style={{
            fontFamily: MANROPE,
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.55,
            maxWidth: "24ch",
            marginTop: 34,
            color: PALETA.navy,
            opacity: 0.85,
          }}
        >
          A gente te mostra os caminhos — sem enrolação e sem pressão.
        </p>
      </Slide>
    )
  }

  // ============================================================
  // Slide 07 · CTA FINAL — navy + chave decorativa
  // ============================================================
  return (
    <Slide bg={PALETA.navy} color={PALETA.beige} contador="07 / 07" ultimo
      decoracao={<IconeChave x="right" y="bottom" size={480} rotate={-15} opacity={0.05} color={PALETA.beige} />}
    >
      <h2
        style={{
          fontFamily: MANROPE,
          fontWeight: 800,
          fontSize: 92,
          lineHeight: 0.98,
          letterSpacing: "-0.04em",
          color: PALETA.beige,
          margin: 0,
        }}
      >
        {ctaTexto}
      </h2>
      <p
        style={{
          fontFamily: MANROPE,
          fontSize: 28,
          fontWeight: 500,
          lineHeight: 1.55,
          maxWidth: "26ch",
          marginTop: 32,
          color: PALETA.beige,
          opacity: 0.9,
        }}
      >
        Chama no WhatsApp. A gente começa a procurar com você hoje, sem compromisso.
      </p>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          background: PALETA.beige,
          color: PALETA.navy,
          fontFamily: MANROPE,
          fontWeight: 700,
          fontSize: 28,
          padding: "22px 44px",
          borderRadius: 999,
          marginTop: 44,
          alignSelf: "flex-start",
        }}
      >
        <IconeWhatsapp size={26} color={PALETA.navy} />
        Falar no WhatsApp
      </div>
    </Slide>
  )
}

// ============================================================
// Sub-componentes — Slide base
// ============================================================

function Slide({
  bg,
  color,
  contador,
  handle,
  arraste,
  ultimo,
  decoracao,
  children,
}: {
  bg: string
  color: string
  contador: string
  handle?: string
  arraste?: boolean
  ultimo?: boolean
  decoracao?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        width: 1080,
        height: 1350,
        background: bg,
        color: color,
        padding: "80px 78px",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        fontFamily: MANROPE,
      }}
    >
      {/* Decoração de fundo (SVG com opacidade baixa) */}
      {decoracao}

      {/* TOPO — marca + contador */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: "-0.01em",
          }}
        >
          Patrícia e Júlio<span style={{ opacity: 0.5 }}>*</span>
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: "0.18em",
            opacity: 0.55,
          }}
        >
          {contador}
        </div>
      </div>

      {/* MEIO — conteúdo principal */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: ultimo ? "flex-start" : "center",
          marginTop: ultimo ? 40 : 0,
          alignItems: "flex-start",
          position: "relative",
          zIndex: 2,
        }}
      >
        {children}
      </div>

      {/* RODAPÉ */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {ultimo ? (
          <>
            <div
              style={{
                fontFamily: MANROPE,
                fontSize: 22,
                fontWeight: 600,
                lineHeight: 1.7,
                opacity: 0.85,
                color: color,
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
                marginTop: 14,
                color: PALETA.sky,
              }}
            >
              @julio_e_patricia_corretores
            </div>
          </>
        ) : arraste ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: PALETA.sky }}>{handle}</div>
            <div style={{ fontSize: 18, fontWeight: 600, opacity: 0.6 }}>
              Arraste →
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 18, fontWeight: 600, opacity: 0.6 }}>
            julioepatricia · corretores de imóveis
          </div>
        )}
      </div>
    </section>
  )
}

function Eyebrow({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      style={{
        fontFamily: MANROPE,
        fontSize: 18,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.32em",
        color: color,
        marginBottom: 28,
      }}
    >
      {children}
    </div>
  )
}

function Rule({ color }: { color: string }) {
  return (
    <div
      style={{
        height: 4,
        width: 84,
        background: color,
        opacity: 0.85,
        marginBottom: 34,
      }}
    />
  )
}

// ============================================================
// Ícones decorativos SVG — replicam os icones de fundo do HTML original
// ============================================================

interface DecoracaoProps {
  x: "left" | "right" | "center"
  y: "top" | "bottom" | "center"
  size: number
  rotate: number
  opacity: number
  color: string
}

function getPosicao(x: string, y: string, size: number): React.CSSProperties {
  const style: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    width: size,
    height: size,
  }

  if (x === "left") style.left = -size * 0.15
  if (x === "right") style.right = -size * 0.15
  if (x === "center") {
    style.left = "50%"
    style.marginLeft = -size / 2
  }

  if (y === "top") style.top = -size * 0.1
  if (y === "bottom") style.bottom = -size * 0.15
  if (y === "center") {
    style.top = "50%"
    style.marginTop = -size / 2
  }

  return style
}

function IconeChave({ x, y, size, rotate, opacity, color }: DecoracaoProps) {
  const posicao = getPosicao(x, y, size)
  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        ...posicao,
        transform: `rotate(${rotate}deg)`,
        opacity,
      }}
    >
      {/* Chave estilizada: cabeça circular + haste + dentes */}
      <circle cx="30" cy="50" r="18" fill="none" stroke={color} strokeWidth="4" />
      <circle cx="30" cy="50" r="6" fill={color} />
      <rect x="46" y="47" width="42" height="6" fill={color} />
      <rect x="72" y="47" width="6" height="14" fill={color} />
      <rect x="82" y="47" width="6" height="10" fill={color} />
    </svg>
  )
}

function IconeCasa({ x, y, size, rotate, opacity, color }: DecoracaoProps) {
  const posicao = getPosicao(x, y, size)
  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        ...posicao,
        transform: `rotate(${rotate}deg)`,
        opacity,
      }}
    >
      {/* Casa estilizada: telhado triangular + corpo + porta + janelas */}
      <path d="M 20 45 L 50 20 L 80 45 L 80 85 L 20 85 Z" fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" />
      <path d="M 20 45 L 50 20 L 80 45" fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" />
      <rect x="43" y="60" width="14" height="25" fill={color} />
      <rect x="28" y="52" width="10" height="10" fill="none" stroke={color} strokeWidth="3" />
      <rect x="62" y="52" width="10" height="10" fill="none" stroke={color} strokeWidth="3" />
    </svg>
  )
}

function IconeWhatsapp({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  )
}

// ============================================================
// Helpers
// ============================================================

function quebrarLinhas(texto: string, maxPorLinha: number): React.ReactNode[] {
  const palavras = texto.split(" ")
  const linhas: string[] = []
  let atual = ""

  for (const p of palavras) {
    if ((atual + " " + p).trim().length > maxPorLinha) {
      if (atual) linhas.push(atual.trim())
      atual = p
    } else {
      atual = atual ? atual + " " + p : p
    }
  }
  if (atual) linhas.push(atual.trim())

  return linhas.map((l, i) => (
    <span key={i} style={{ display: "block" }}>
      {l}
    </span>
  ))
}
