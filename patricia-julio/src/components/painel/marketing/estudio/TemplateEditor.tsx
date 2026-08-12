"use client"

/**
 * TemplateEditor.tsx — editor side-by-side.
 * Esquerda: campos que o corretor preenche.
 * Direita: preview em tempo real (versão escalada do template real).
 *
 * Ao clicar em "Baixar PNG":
 *   1. Captura o node oculto full-res (1080x1350) via html-to-image
 *   2. Faz download automático do arquivo
 *   3. Salva no histórico como PedidoCriativo com status "pronto"
 */

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Download, Loader2, ImageIcon, Trash2,
  Sparkles, CheckCircle2, AlertCircle, ExternalLink,
} from "lucide-react"
import { toPng } from "html-to-image"

import type { TemplateMarketing, CampoTemplate } from "@/data/painel/templates-marketing"
import { CampoTexto, CampoValor, CampoAreaTexto } from "@/components/painel/acm/campos"
import { apiCreatePedido } from "@/lib/painel/marketing-api"

interface Props {
  template: TemplateMarketing
  Component: React.ComponentType<{ dados: Record<string, string> }>
  onVoltar: () => void
  /** Valores iniciais pra pré-preencher os campos (ex: vindos do parser livre ou do catálogo). */
  dadosIniciais?: Record<string, string>
  /** Avisos vindos do parser ("preencha o preço manualmente", etc). */
  avisosIniciais?: string[]
  /** Permite edição por texto livre (modo ultra-simplificado) */
  modoUltraSimples?: boolean
}

export function TemplateEditor({ template, Component, onVoltar, dadosIniciais, avisosIniciais, modoUltraSimples }: Props) {
  const [dados, setDados] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    template.campos.forEach((c) => {
      if (c.padrao) init[c.id] = c.padrao
    })
    return { ...init, ...(dadosIniciais || {}) }
  })
  const [baixando, setBaixando] = useState(false)
  const [gerando, setGerando] = useState(true) // NOVO: Estado de carregamento inicial
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string; slug?: string } | null>(null)
  const captureRef = useRef<HTMLDivElement>(null)

  // NOVO: Suporte a carrossel (múltiplos slides)
  const ehCarrossel = (template.slidesTotal || 1) > 1
  const totalSlides = template.slidesTotal || 1
  const [slideAtivo, setSlideAtivo] = useState(1)
  
  // NOVO: Modo de edição por texto livre
  const [modoEdicao, setModoEdicao] = useState<"campos" | "texto">(modoUltraSimples ? "texto" : "campos")
  const [textoEdicao, setTextoEdicao] = useState("")
  const [aplicandoEdicao, setAplicandoEdicao] = useState(false)

  // NOVO: Simula carregamento/preparação do template
  useEffect(() => {
    const timer = setTimeout(() => setGerando(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Escala responsiva do preview visível
  const [previewWidth, setPreviewWidth] = useState(360)
  const previewBoxRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function ajustar() {
      const el = previewBoxRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setPreviewWidth(Math.max(220, Math.min(480, rect.width - 4)))
    }
    ajustar()
    window.addEventListener("resize", ajustar)
    return () => window.removeEventListener("resize", ajustar)
  }, [])

  const scale = previewWidth / template.dimensoes.w
  const previewHeight = template.dimensoes.h * scale

  // Validação dos obrigatórios
  const faltandoObrigatorios = useMemo(() => {
    return template.campos
      .filter((c) => c.obrigatorio)
      .filter((c) => {
        const v = (dados[c.id] || "").trim()
        return !v
      })
  }, [dados, template.campos])
  const podeBaixar = faltandoObrigatorios.length === 0

  function setCampo(id: string, valor: string) {
    setDados((d) => ({ ...d, [id]: valor }))
    setResultado(null)
  }

  // NOVO: Aplicar edição por texto (parser inteligente)
  function aplicarEdicaoTexto() {
    if (!textoEdicao.trim()) return
    setAplicandoEdicao(true)
    
    try {
      const texto = textoEdicao.trim()
      const textoLower = texto.toLowerCase()
      const novosDados = { ...dados }
      const mudancas: string[] = []
      
      // ===== PREÇO =====
      // Milhões (ex: "1.2 milhões", "1,5 mi")
      let matchPreco = texto.match(/(?:R\$\s*)?(\d+(?:[.,]\d{1,3})?)\s*(?:milh[õo]es?|milh[ãa]o|\bmi(?![a-zA-Zçãõáéíóúâêô]))/i)
      if (matchPreco) {
        const valor = parseFloat(matchPreco[1].replace(",", ".")) * 1_000_000
        if (novosDados.preco !== undefined) {
          novosDados.preco = String(Math.round(valor))
          mudancas.push(`preço → R$ ${new Intl.NumberFormat("pt-BR").format(valor)}`)
        }
      }
      // Milhares (ex: "620 mil", "350k")
      if (!matchPreco) {
        matchPreco = texto.match(/(?:R\$\s*)?(\d+(?:[.,]\d{1,3})?)\s*(?:mil|k)(?![a-zA-Zçãõáéíóúâêô])/i)
        if (matchPreco) {
          const valor = parseFloat(matchPreco[1].replace(",", ".")) * 1_000
          if (novosDados.preco !== undefined) {
            novosDados.preco = String(Math.round(valor))
            mudancas.push(`preço → R$ ${new Intl.NumberFormat("pt-BR").format(valor)}`)
          }
        }
      }
      // R$ explícito
      if (!matchPreco) {
        matchPreco = texto.match(/R\$\s*([\d.,]+)/i)
        if (matchPreco) {
          const valor = parseFloat(matchPreco[1].replace(/[.\s]/g, "").replace(",", "."))
          if (!isNaN(valor) && valor > 1000 && novosDados.preco !== undefined) {
            novosDados.preco = String(Math.round(valor))
            mudancas.push(`preço → R$ ${new Intl.NumberFormat("pt-BR").format(valor)}`)
          }
        }
      }
      
      // ===== TÍTULO / GANCHO =====
      // Busca por "título:", "titulo:", "gancho:", ou texto entre aspas
      let matchTitulo = texto.match(/(?:título|titulo|gancho)[\s:]+["']?([^"'\n]+?)["']?(?:\.|,|$)/i)
      if (!matchTitulo) {
        // Tenta pegar texto entre aspas duplas ou simples
        matchTitulo = texto.match(/["']([^"']{3,}?)["']/i)
      }
      if (matchTitulo) {
        const novoTexto = matchTitulo[1].trim()
        if (novosDados.titulo !== undefined) {
          novosDados.titulo = novoTexto
          mudancas.push(`título → "${novoTexto.slice(0, 40)}${novoTexto.length > 40 ? "..." : ""}"`)
        }
        if (novosDados.gancho !== undefined) {
          novosDados.gancho = novoTexto
          mudancas.push(`gancho → "${novoTexto.slice(0, 40)}${novoTexto.length > 40 ? "..." : ""}"`)
        }
      }
      
      // ===== BAIRRO =====
      const matchBairro = texto.match(/(?:bairro|em|no bairro)[\s:]+([A-ZÀ-Úa-zà-ú\s]+?)(?:\s*[,.]|$)/i)
      if (matchBairro) {
        const bairro = matchBairro[1].trim()
        if (novosDados.bairro !== undefined) {
          novosDados.bairro = bairro
          mudancas.push(`bairro → ${bairro}`)
        }
      }
      
      // ===== QUARTOS =====
      const matchQuartos = texto.match(/(\d+)\s*(?:quartos?|dormit[óo]rios?|dorms?|qtos?)/i)
      if (matchQuartos) {
        const quartos = matchQuartos[1]
        if (novosDados.quartos !== undefined) {
          novosDados.quartos = quartos
          mudancas.push(`quartos → ${quartos}`)
        }
        // Se tem campo características, atualiza também
        if (novosDados.caracteristicas !== undefined) {
          const carac = novosDados.caracteristicas.split(",").map(c => c.trim()).filter(c => !c.match(/quarto/i))
          carac.unshift(`${quartos} quarto${Number(quartos) > 1 ? "s" : ""}`)
          novosDados.caracteristicas = carac.join(", ")
        }
      }
      
      // ===== ÁREA =====
      const matchArea = texto.match(/(\d+(?:[,.]\d+)?)\s*m[²2]/i)
      if (matchArea) {
        const area = matchArea[1].replace(",", ".")
        if (novosDados.area !== undefined) {
          novosDados.area = area
          mudancas.push(`área → ${area}m²`)
        }
        // Atualiza características
        if (novosDados.caracteristicas !== undefined) {
          const carac = novosDados.caracteristicas.split(",").map(c => c.trim()).filter(c => !c.match(/m[²2]/i))
          carac.push(`${area}m²`)
          novosDados.caracteristicas = carac.join(", ")
        }
      }
      
      // ===== VAGAS =====
      const matchVagas = texto.match(/(\d+)\s*vagas?/i)
      if (matchVagas) {
        const vagas = matchVagas[1]
        if (novosDados.vagas !== undefined) {
          novosDados.vagas = vagas
          mudancas.push(`vagas → ${vagas}`)
        }
        // Atualiza características
        if (novosDados.caracteristicas !== undefined) {
          const carac = novosDados.caracteristicas.split(",").map(c => c.trim()).filter(c => !c.match(/vaga/i))
          carac.push(`${vagas} vaga${Number(vagas) > 1 ? "s" : ""}`)
          novosDados.caracteristicas = carac.join(", ")
        }
      }
      
      // ===== ALUGUEL / PRESTAÇÃO (para template comparativo) =====
      const matchAluguel = texto.match(/alug[uau]?el\s*(?:de|:)?\s*(?:R\$\s*)?(\d[\d.,]+)/i)
      if (matchAluguel && novosDados.aluguel !== undefined) {
        const valor = matchAluguel[1].replace(/\D/g, "")
        novosDados.aluguel = valor
        mudancas.push(`aluguel → R$ ${valor}`)
      }
      
      const matchPrestacao = texto.match(/(?:presta[çc][ãa]o|parcela|financiamento)\s*(?:de|:)?\s*(?:R\$\s*)?(\d[\d.,]+)/i)
      if (matchPrestacao && novosDados.prestacao !== undefined) {
        const valor = matchPrestacao[1].replace(/\D/g, "")
        novosDados.prestacao = valor
        mudancas.push(`prestação → R$ ${valor}`)
      }
      
      // ===== DESCRIÇÃO / SUBTÍTULO =====
      if (textoLower.includes("descrição") || textoLower.includes("descricao") || textoLower.includes("subtitulo") || textoLower.includes("subtítulo")) {
        const matchDesc = texto.match(/(?:descrição|descricao|subtitulo|subtítulo)[\s:]+["']?([^"'\n]+?)["']?(?:\.|$)/i)
        if (matchDesc) {
          const desc = matchDesc[1].trim()
          if (novosDados.descricao !== undefined) {
            novosDados.descricao = desc
            mudancas.push(`descrição → "${desc.slice(0, 40)}${desc.length > 40 ? "..." : ""}"`)
          }
          if (novosDados.subtitulo !== undefined) {
            novosDados.subtitulo = desc
            mudancas.push(`subtítulo → "${desc.slice(0, 40)}${desc.length > 40 ? "..." : ""}"`)
          }
        }
      }
      
      // Aplica mudanças
      setDados(novosDados)
      setTextoEdicao("")
      
      if (mudancas.length > 0) {
        setResultado({ 
          ok: true, 
          msg: `✨ Aplicado: ${mudancas.join(" · ")}` 
        })
      } else {
        setResultado({ 
          ok: false, 
          msg: "Não consegui identificar o que você quer mudar. Tenta ser mais específico (ex: 'preço 450 mil', 'bairro Icaraí', 'título Vista Mar')." 
        })
      }
    } catch (e) {
      setResultado({ ok: false, msg: "Erro ao processar. Tenta reformular o pedido." })
    } finally {
      setAplicandoEdicao(false)
    }
  }

  async function baixarEsalvar() {
    if (!captureRef.current || !podeBaixar || baixando) return
    setBaixando(true)
    setResultado(null)
    try {
      // Espera uma frame para garantir que o node reflita o estado atual
      await new Promise((r) => requestAnimationFrame(() => r(null)))

      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: template.dimensoes.w,
        height: template.dimensoes.h,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      })

      // Download local
      const nomeArquivo = `${template.id}-${Date.now()}.png`
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = nomeArquivo
      document.body.appendChild(link)
      link.click()
      link.remove()

      // Salva no histórico como pedido "pronto" (self-service)
      const gancho = dados.gancho?.trim() || dados.titulo?.trim() || `${template.nome} · ${dados.bairro || "s/ bairro"}`
      const precoNum = dados.preco ? Number(String(dados.preco).replace(/\D/g, "")) : 0
      const precoFormatado = precoNum > 0
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(precoNum)
        : undefined
      let slug: string | undefined
      try {
        // Nota: o PNG já foi baixado no computador do corretor.
        // O histórico serve só como marcador ("você fez este") e conta pra meta semanal.
        // O POST /api/marketing/pedidos ignora `criativos` do body por design (segurança),
        // então não passamos o arquivo aqui.
        const pedido = await apiCreatePedido({
          status: "pronto",
          personaId: template.personaSugerida || "upgrade-familiar",
          tipo: template.tipo,
          bairro: dados.bairro?.trim() || undefined,
          faixaPreco: precoFormatado,
          gancho,
          briefing: [
            `Gerado no Estúdio · template ${template.nome}`,
            dados.titulo ? `Título: ${dados.titulo.trim()}` : "",
            dados.caracteristicas ? `Características: ${dados.caracteristicas.trim()}` : "",
          ].filter(Boolean).join("\n"),
        })
        slug = pedido.slug
      } catch (e) {
        // Falha em salvar no histórico não deve bloquear o download
        console.warn("Não consegui salvar no histórico:", e)
      }

      setResultado({
        ok: true,
        msg: `Arquivo ${nomeArquivo} baixado. ${slug ? "Também apareceu no histórico." : ""}`,
        slug,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setResultado({ ok: false, msg: `Falha ao gerar PNG: ${msg}` })
    } finally {
      setBaixando(false)
    }
  }

  // ============================================================
  // Baixar TODOS os slides do carrossel (loop de captura)
  // ============================================================
  async function baixarTodosSlides() {
    if (!captureRef.current || !podeBaixar || baixando) return
    setBaixando(true)
    setResultado(null)

    const slideOriginal = slideAtivo
    let sucesso = 0

    try {
      for (let n = 1; n <= totalSlides; n++) {
        setSlideAtivo(n)
        // Espera duas frames para garantir que o DOM refletiu a mudança de slide
        await new Promise((r) => requestAnimationFrame(() => r(null)))
        await new Promise((r) => requestAnimationFrame(() => r(null)))
        await new Promise((r) => setTimeout(r, 100))

        if (!captureRef.current) continue

        const dataUrl = await toPng(captureRef.current, {
          cacheBust: true,
          pixelRatio: 1,
          width: template.dimensoes.w,
          height: template.dimensoes.h,
          style: {
            transform: "scale(1)",
            transformOrigin: "top left",
          },
        })

        const nomeArquivo = `${template.id}-${String(n).padStart(2, "0")}.png`
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = nomeArquivo
        document.body.appendChild(link)
        link.click()
        link.remove()
        sucesso++

        // Pequena pausa entre downloads para o navegador não bloquear
        await new Promise((r) => setTimeout(r, 200))
      }

      // Salva no histórico como pedido único com todos os slides
      let slug: string | undefined
      try {
        const gancho = dados.gancho?.trim() || `${template.nome}`
        const pedido = await apiCreatePedido({
          status: "pronto",
          personaId: template.personaSugerida || "upgrade-familiar",
          tipo: template.tipo,
          bairro: dados.bairro?.trim() || undefined,
          gancho,
          briefing: `Carrossel gerado no Estúdio · ${sucesso} slides · template ${template.nome}`,
        })
        slug = pedido.slug
      } catch (e) {
        console.warn("Não consegui salvar no histórico:", e)
      }

      setResultado({
        ok: true,
        msg: `${sucesso} slides baixados. Publica na ordem 01, 02, 03... no Instagram.`,
        slug,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setResultado({ ok: false, msg: `Falha ao gerar carrossel: ${msg}` })
    } finally {
      setSlideAtivo(slideOriginal)
      setBaixando(false)
    }
  }

  return (
    <>
      {/* TELA DE CARREGAMENTO */}
      {gerando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #2F4156 0%, #567C8D 100%)" }}>
          <div className="text-center space-y-6">
            <div className="relative">
              <Loader2 size={64} className="text-beige animate-spin" strokeWidth={1.5} />
              <Sparkles
                size={28}
                className="text-sky absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"
              />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-[28px] font-bold text-beige">
                Preparando seu criativo
              </h2>
              <p className="text-[14px] text-sky max-w-md">
                Montando o template com suas regras editoriais...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-beige animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-beige animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-beige animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div
        style={{
          opacity: gerando ? 0 : 1,
          transition: "opacity 0.5s ease-in-out",
        }}
      >
        <div className="pb-40 lg:pb-32">
      <div className="px-5 lg:px-10 pt-6 lg:pt-10 space-y-5 max-w-6xl">
        {/* HEADER */}
        <div>
          <button
            type="button"
            onClick={onVoltar}
            className="inline-flex items-center gap-1.5 text-[12px] text-teal hover:text-navy transition-colors"
          >
            <ArrowLeft size={13} />
            Trocar template
          </button>
          <div className="mt-2 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">
                Estúdio · {template.tipo} · {template.aspecto}
              </div>
              <h1 className="mt-1 font-display text-[22px] lg:text-[28px] font-bold text-navy tracking-tight leading-tight">
                {template.nome}
              </h1>
              <p className="mt-1 text-[12.5px] text-teal max-w-lg">
                {template.descricao}
              </p>
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,480px)]">
          {/* ====== ESQUERDA — CONVERSA COM O POST ====== */}
          <div className="space-y-3">

            {/* MODO TEXTO LIVRE — ESTILO CHAT */}
            {modoEdicao === "texto" && (
              <>
                {/* BOLHA — MENSAGEM DO SISTEMA (o que ele entendeu) */}
                {avisosIniciais && avisosIniciais.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-beige"
                      style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
                    >
                      <Sparkles size={15} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10.5px] font-bold text-teal mb-1">
                        Sistema · agora
                      </div>
                      <div
                        className="rounded-2xl rounded-tl-md px-4 py-3 space-y-1.5"
                        style={{
                          background: "linear-gradient(135deg, #FFFFFF 0%, #F5EFEB 100%)",
                          border: "1px solid rgba(86,124,141,0.25)",
                        }}
                      >
                        <div className="text-[12.5px] font-semibold text-navy leading-snug">
                          Peguei aqui. Preparei o post assim:
                        </div>
                        <ul className="space-y-1">
                          {avisosIniciais.map((a, i) => (
                            <li key={i} className="text-[12px] text-navy/85 leading-relaxed flex items-start gap-2">
                              <span className="text-teal font-bold mt-[1px]">›</span>
                              <span className="flex-1">{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* BOLHA — AVISO DE FALTANTES (se houver) */}
                {faltandoObrigatorios.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#f5e6c8", color: "#8a5c00" }}
                    >
                      <AlertCircle size={15} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10.5px] font-bold mb-1" style={{ color: "#8a5c00" }}>
                        Preciso de mais um detalhe
                      </div>
                      <div
                        className="rounded-2xl rounded-tl-md px-4 py-3"
                        style={{
                          background: "rgba(217,138,0,0.09)",
                          border: "1px solid rgba(217,138,0,0.35)",
                        }}
                      >
                        <div className="text-[12.5px] font-semibold mb-1" style={{ color: "#8a5c00" }}>
                          {faltandoObrigatorios.length === 1
                            ? `Pra baixar, ainda preciso da ${faltandoObrigatorios[0].label.toLowerCase()}.`
                            : `Ainda faltam ${faltandoObrigatorios.length} coisas pra baixar:`}
                        </div>
                        {faltandoObrigatorios.length > 1 && (
                          <ul className="space-y-0.5">
                            {faltandoObrigatorios.map((c) => (
                              <li key={c.id} className="text-[12px]" style={{ color: "#8a5c00" }}>
                                › {c.label}
                              </li>
                            ))}
                          </ul>
                        )}
                        <button
                          type="button"
                          onClick={() => setModoEdicao("campos")}
                          className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold underline hover:no-underline"
                          style={{ color: "#8a5c00" }}
                        >
                          Preencher agora →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* CAIXA DE MENSAGEM — CHAT INPUT */}
                <div className="rounded-3xl border-2 border-sky/70 bg-white overflow-hidden focus-within:border-teal focus-within:shadow-[0_8px_24px_-12px_rgba(47,65,86,0.35)] transition-all">
                  <textarea
                    value={textoEdicao}
                    onChange={(e) => setTextoEdicao(e.target.value)}
                    placeholder={`Fala aqui o que quer mudar no post...\n\nEx: "muda o preço pra 450 mil" · "bairro Icaraí, 2 quartos, 1 vaga" · "título: Vista permanente do mar"`}
                    rows={5}
                    className="w-full px-5 py-4 bg-transparent text-navy text-[13.5px] leading-relaxed outline-none resize-y placeholder:text-navy/40"
                  />
                  <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
                    <div className="text-[10.5px] text-teal flex items-center gap-1.5 pl-2">
                      <Sparkles size={11} strokeWidth={2.2} />
                      Entende preço, bairro, quartos, área, vagas e mais
                    </div>
                    {/* TROCAR MODO — link discreto */}
                    <button
                      type="button"
                      onClick={() => setModoEdicao("campos")}
                      className="text-[11px] font-bold text-teal hover:text-navy px-2 py-1 rounded-md hover:bg-beige/60 transition-colors"
                    >
                      preencher no campo
                    </button>
                    <button
                      onClick={aplicarEdicaoTexto}
                      disabled={!textoEdicao.trim() || aplicandoEdicao}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-beige text-[12px] font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        background: "linear-gradient(135deg, #2F4156, #567C8D)",
                        boxShadow: "0 6px 16px -6px rgba(47,65,86,0.5)",
                      }}
                    >
                      {aplicandoEdicao ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Atualizando
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Enviar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* MODO CAMPOS — layout compacto */}
            {modoEdicao === "campos" && (
              <div className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">
                      Preenchimento direto
                    </div>
                    <p className="text-[12px] text-navy/70 mt-0.5">
                      Preview atualiza à direita a cada mudança. Baixa quando gostar.
                    </p>
                  </div>
                  {modoUltraSimples && (
                    <button
                      type="button"
                      onClick={() => setModoEdicao("texto")}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-navy bg-beige/70 hover:bg-beige transition-colors"
                    >
                      <Sparkles size={11} />
                      Falar por chat
                    </button>
                  )}
                </div>

                <div className="space-y-4 pt-1">
                  {template.campos.map((campo) => (
                    <RenderCampo
                      key={campo.id}
                      campo={campo}
                      valor={dados[campo.id] || ""}
                      onChange={(v) => setCampo(campo.id, v)}
                    />
                  ))}
                </div>

                {faltandoObrigatorios.length > 0 && (
                  <div
                    className="flex items-start gap-2 p-3 rounded-2xl border text-[11.5px] leading-relaxed"
                    style={{ background: "rgba(217,138,0,0.08)", borderColor: "rgba(217,138,0,0.3)", color: "#8a5c00" }}
                  >
                    <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold mb-0.5">
                        Ainda falta {faltandoObrigatorios.length === 1 ? "um item" : `${faltandoObrigatorios.length} itens`} pra baixar:
                      </div>
                      <ul className="space-y-0.5">
                        {faltandoObrigatorios.map((c) => (
                          <li key={c.id}>› {c.label}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ====== DIREITA — PREVIEW ====== */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-sky/60 bg-beige/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-teal">
                  Preview · {template.dimensoes.w}×{template.dimensoes.h}
                </div>
                <div className="text-[10px] font-medium text-navy/60 tabular-nums">
                  {Math.round(scale * 100)}%
                </div>
              </div>

              <div
                ref={previewBoxRef}
                className="mx-auto rounded-2xl overflow-hidden border border-sky/70 shadow-[0_16px_40px_-16px_rgba(47,65,86,0.35)]"
                style={{
                  width: previewWidth,
                  height: previewHeight,
                  background: "#e2e8ec",
                }}
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    width: template.dimensoes.w,
                    height: template.dimensoes.h,
                  }}
                >
                  <Component dados={{ ...dados, _slideAtivo: String(slideAtivo) }} />
                </div>
              </div>

              {/* NAVEGAÇÃO DE SLIDES (SE FOR CARROSSEL) */}
              {ehCarrossel && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {Array.from({ length: totalSlides }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSlideAtivo(n)}
                        className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${
                          slideAtivo === n
                            ? "bg-navy text-beige shadow-md scale-110"
                            : "bg-white border border-sky text-navy hover:border-teal"
                        }`}
                      >
                        {String(n).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10.5px] text-navy/60 text-center">
                    Slide <b>{String(slideAtivo).padStart(2, "0")}</b> de{" "}
                    {String(totalSlides).padStart(2, "0")}
                  </p>
                </div>
              )}

              <p className="mt-3 text-[10.5px] text-navy/60 text-center leading-relaxed">
                {ehCarrossel ? (
                  <>
                    Cada slide exporta em <b>{template.dimensoes.w}×{template.dimensoes.h}px</b>.
                    Use &quot;Baixar todos&quot; pra gerar os {totalSlides} PNGs de uma vez.
                  </>
                ) : (
                  <>
                    O arquivo final é exportado em <b>{template.dimensoes.w}×{template.dimensoes.h}px</b>,
                    pronto pra publicar.
                  </>
                )}
              </p>
            </div>

            {/* Resultado / Botão */}
            {resultado && (
              <div
                className="flex items-start gap-2 p-3 rounded-2xl border text-[11.5px] leading-relaxed"
                style={
                  resultado.ok
                    ? { background: "rgba(15,122,84,0.07)", borderColor: "rgba(15,122,84,0.3)", color: "#0F7A54" }
                    : { background: "rgba(178,58,46,0.07)", borderColor: "rgba(178,58,46,0.3)", color: "#B23A2E" }
                }
              >
                {resultado.ok ? (
                  <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{resultado.msg}</div>
                  {resultado.ok && resultado.slug && (
                    <Link
                      href={`/painel/marketing/historico?p=${resultado.slug}`}
                      className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold underline hover:no-underline"
                    >
                      Abrir no histórico <ExternalLink size={10} />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NODE OCULTO PARA CAPTURA — FULL RES */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: -99999,
            top: 0,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <div ref={captureRef}>
            <Component dados={{ ...dados, _slideAtivo: String(slideAtivo) }} />
          </div>
        </div>
      </div>

      {/* BOTTOM BAR STICKY */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-10 border-t border-sky/60 bg-beige/95 backdrop-blur-lg pb-safe">
        <div className="max-w-6xl mx-auto px-5 lg:px-10 py-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={onVoltar}
            disabled={baixando}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-navy text-[12px] font-semibold bg-white border border-sky hover:bg-beige transition-colors disabled:opacity-40"
          >
            <ArrowLeft size={13} /> Trocar template
          </button>

          <div className="ml-auto text-[10.5px] text-teal font-medium">
            {podeBaixar ? "Pronto pra baixar." : `${faltandoObrigatorios.length} campo(s) faltando`}
          </div>

          {ehCarrossel && (
            <button
              onClick={baixarEsalvar}
              disabled={!podeBaixar || baixando}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-navy text-[12.5px] font-bold bg-white border border-sky hover:bg-beige transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              Só o slide {String(slideAtivo).padStart(2, "0")}
            </button>
          )}

          <button
            onClick={ehCarrossel ? baixarTodosSlides : baixarEsalvar}
            disabled={!podeBaixar || baixando}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-beige text-[12.5px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #2F4156, #567C8D)",
              boxShadow: "0 10px 22px -8px rgba(47,65,86,0.45)",
            }}
          >
            {baixando ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {baixando
              ? "Gerando..."
              : ehCarrossel
              ? `Baixar todos (${totalSlides})`
              : "Baixar PNG"}
          </button>
        </div>
      </div>
        </div>
      </div>
    </>
  )
}

// ============================================================
// RenderCampo — despacha para o input certo baseado em campo.tipo
// ============================================================
function RenderCampo({
  campo, valor, onChange,
}: {
  campo: CampoTemplate
  valor: string
  onChange: (v: string) => void
}) {
  if (campo.tipo === "texto") {
    return (
      <CampoTexto
        label={campo.label}
        value={valor}
        onChange={onChange}
        placeholder={campo.placeholder}
        hint={campo.hint}
        obrigatorio={campo.obrigatorio}
      />
    )
  }
  if (campo.tipo === "textarea") {
    return (
      <CampoAreaTexto
        label={campo.label}
        value={valor}
        onChange={onChange}
        placeholder={campo.placeholder}
        hint={campo.hint}
        obrigatorio={campo.obrigatorio}
        rows={3}
      />
    )
  }
  if (campo.tipo === "moeda") {
    const n = valor ? Number(String(valor).replace(/\D/g, "")) : undefined
    return (
      <CampoValor
        label={campo.label}
        value={n && isFinite(n) ? n : undefined}
        onChange={(v) => onChange(v ? String(v) : "")}
        hint={campo.hint}
        obrigatorio={campo.obrigatorio}
      />
    )
  }
  if (campo.tipo === "foto") {
    return (
      <CampoFoto
        label={campo.label}
        value={valor}
        onChange={onChange}
        hint={campo.hint}
        obrigatorio={campo.obrigatorio}
      />
    )
  }
  return null
}

// ============================================================
// CampoFoto — upload de imagem (converte pra data URL local)
// Usa input file NATIVO visível estilizado pra máxima compatibilidade
// cross-browser (Safari iOS PWA, webviews, etc). Não tenta esconder o
// input nem depender de programmatic click() — o próprio input é
// clicável e o browser abre o file picker.
// ============================================================
function CampoFoto({
  label, value, onChange, hint, obrigatorio,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
  obrigatorio?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [carregando, setCarregando] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert("Arquivo precisa ser uma imagem.")
      return
    }
    setCarregando(true)
    try {
      const dataUrl = await lerComoDataUrl(file)
      onChange(dataUrl)
    } finally {
      setCarregando(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function limpar() {
    onChange("")
    if (inputRef.current) inputRef.current.value = ""
  }

  const temFoto = !!value

  return (
    <div className="block">
      <span className="flex items-center gap-1.5">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal">{label}</span>
        {obrigatorio && <span className="text-red-500 text-[10.5px] font-bold">*</span>}
      </span>

      <div className="mt-1.5 space-y-2">
        {temFoto && (
          <div className="rounded-2xl border border-sky bg-beige/60 overflow-hidden">
            <div className="relative aspect-[4/5] max-h-[220px] bg-sky/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Foto escolhida"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between gap-2 p-2.5">
              <span className="text-[11px] font-semibold text-teal inline-flex items-center gap-1">
                <ImageIcon size={12} /> Foto carregada
              </span>
              <button
                type="button"
                onClick={limpar}
                className="text-[11px] font-semibold text-red-700 hover:text-red-900 transition-colors inline-flex items-center gap-1"
              >
                <Trash2 size={12} /> Remover
              </button>
            </div>
          </div>
        )}

        {/* Input file nativo visível estilizado */}
        <div
          className={`rounded-2xl border-2 border-dashed border-sky bg-beige/50 hover:bg-white hover:border-teal transition-colors ${
            carregando ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2 py-6 px-4">
            {carregando ? (
              <Loader2 size={22} className="text-teal animate-spin" />
            ) : (
              <>
                <span className="w-11 h-11 rounded-full grid place-items-center bg-white text-teal">
                  <ImageIcon size={18} />
                </span>
                <span className="text-[12.5px] font-bold text-navy">
                  {temFoto ? "Trocar foto" : "Escolher foto"}
                </span>
                <span className="text-[10.5px] text-teal text-center">
                  Toca no botão abaixo · JPG ou PNG · do celular ou computador
                </span>
              </>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              disabled={carregando}
              className="block w-full text-[11.5px] text-navy mt-3
                file:mr-3 file:cursor-pointer
                file:rounded-full file:border-0
                file:bg-navy file:text-beige
                file:px-4 file:py-2
                file:text-[11.5px] file:font-bold
                file:tracking-wider file:uppercase
                hover:file:bg-teal
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {hint && <p className="mt-1 text-[10.5px] text-navy/60 leading-relaxed">{hint}</p>}
    </div>
  )
}

function lerComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result || ""))
    fr.onerror = () => reject(new Error("Falha lendo arquivo"))
    fr.readAsDataURL(file)
  })
}
