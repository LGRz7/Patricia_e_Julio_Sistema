"use client"

import { useMemo, useRef, useState } from "react"
import {
  Plus, ClipboardPaste, Wand2, X, MapPin, Trash2, ChevronDown, ChevronUp,
  Home, TrendingUp, AlertCircle, Sparkles, Info, Radar, Loader2, ExternalLink,
} from "lucide-react"
import type { AmostraACM, FonteAmostra, ImovelAlvoACM } from "@/types/acm"
import { parseAmostraTexto, camposFaltantes } from "@/lib/painel/acm-parser"
import { calcPrecoM2, computeSugestao } from "@/lib/painel/acm-calc"
import { apiBuscarComparaveis, type BuscaComparaveisMeta, type UrlAssistida } from "@/lib/painel/acm-api"
import { gerarUrlsAssistidasZap as gerarUrlsAssistidasFallback } from "@/lib/painel/acm-scraper/assisted-urls"
import {
  CampoTexto, CampoNumero, CampoValor, CampoAreaTexto, CampoSelect,
  fmtReais, fmtM2,
} from "./campos"

interface Props {
  alvo: ImovelAlvoACM
  amostras: AmostraACM[]
  onChange: (amostras: AmostraACM[]) => void
}

const FONTES: { value: FonteAmostra; label: string }[] = [
  { value: "ZAP", label: "ZAP Imóveis" },
  { value: "VivaReal", label: "VivaReal" },
  { value: "OLX", label: "OLX" },
  { value: "Chaves na Mão", label: "Chaves na Mão" },
  { value: "QuintoAndar", label: "QuintoAndar" },
  { value: "Loft", label: "Loft" },
  { value: "outra", label: "Outra" },
]

export function Step2Amostras({ alvo, amostras, onChange }: Props) {
  const [expandido, setExpandido] = useState<string | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [buscaMeta, setBuscaMeta] = useState<BuscaComparaveisMeta | null>(null)
  const [buscaErro, setBuscaErro] = useState<string | null>(null)
  const [urlsAssistidas, setUrlsAssistidas] = useState<UrlAssistida[]>([])
  const assistidoRef = useRef<HTMLDivElement | null>(null)

  // Preview em tempo real do cálculo (só quando dá pra calcular)
  const preview = useMemo(() => {
    const validas = amostras.filter((a) => a.areaTotal > 0 && a.precoAnuncio > 0)
    if (validas.length < 2 || alvo.areaTotal <= 0) return null
    return computeSugestao(alvo, validas)
  }, [alvo, amostras])

  async function buscarAutomatico() {
    if (buscando) return
    setBuscando(true)
    setBuscaErro(null)
    setBuscaMeta(null)
    setUrlsAssistidas([])
    try {
      const { amostras: sugeridas, urlsAssistidas: urls, meta } = await apiBuscarComparaveis({
        apelido: alvo.apelido,
        cidade: alvo.cidade,
        bairro: alvo.bairro,
        areaTotal: alvo.areaTotal,
        quartos: alvo.quartos,
        banheiros: alvo.banheiros,
        vagas: alvo.vagas,
        condominio: alvo.condominio,
        iptu: alvo.iptu,
      }, 6)
      setBuscaMeta(meta)
      setUrlsAssistidas(urls)

      if (sugeridas.length === 0) {
        // Modo assistido: mostra as URLs pra o corretor abrir e colar depois
        setBuscaErro(
          meta.erro
            ? `Busca automática bloqueada pelo ZAP (${meta.erro}). Use os 4 atalhos abaixo — abrem o ZAP filtrado, você escolhe e cola o texto.`
            : "Sem resultados na busca automática. Use os 4 atalhos abaixo pra procurar no ZAP e colar o texto no card da amostra."
        )
        return
      }

      // Substitui a lista de amostras pelas sugeridas
      onChange(sugeridas.map((s) => {
        const { _similaridade: _sim, ...clean } = s as AmostraACM & { _similaridade?: number }
        void _sim
        return clean
      }))
    } catch (e) {
      // Erro de rede / 500 / timeout de fetch — mesmo assim gera os atalhos locais
      // pra o corretor não ficar preso. `gerarUrlsAssistidasFallback` roda no browser.
      const urlsFallback = gerarUrlsAssistidasFallback({
        cidade: alvo.cidade,
        bairro: alvo.bairro,
        areaAlvo: alvo.areaTotal,
        quartos: alvo.quartos || undefined,
      })
      setUrlsAssistidas(urlsFallback)
      setBuscaErro(
        `Não deu pra buscar automaticamente (${(e as Error).message}). Use os 4 atalhos abaixo pra procurar no ZAP.`,
      )
    } finally {
      setBuscando(false)
      // Se a busca automática não trouxe amostras, rola até a seção "modo assistido"
      // pra o corretor ver os 4 atalhos sem precisar procurar na página.
      requestAnimationFrame(() => {
        if (assistidoRef.current && amostras.length === 0) {
          assistidoRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      })
    }
  }

  function abrirTodasAssistidas() {
    urlsAssistidas.forEach((u) => window.open(u.href, "_blank", "noopener,noreferrer"))
  }

  function adicionar() {
    const nova: AmostraACM = {
      id: crypto.randomUUID(),
      origem: "manual",
      endereco: "",
      bairro: alvo.bairro || "",
      precoAnuncio: 0,
      areaTotal: 0,
      quartos: 0,
      banheiros: 0,
      vagas: 0,
      precoM2: 0,
    }
    onChange([...amostras, nova])
    setExpandido(nova.id)
  }

  function atualizar(id: string, patch: Partial<AmostraACM>) {
    onChange(
      amostras.map((a) => {
        if (a.id !== id) return a
        const merged = { ...a, ...patch }
        // recalcula precoM2 sempre que preço ou área mudam
        if ("precoAnuncio" in patch || "areaTotal" in patch) {
          merged.precoM2 = calcPrecoM2(merged.precoAnuncio, merged.areaTotal)
        }
        return merged
      })
    )
  }

  function remover(id: string) {
    onChange(amostras.filter((a) => a.id !== id))
    if (expandido === id) setExpandido(null)
  }

  return (
    <div className="space-y-6">
      {/* HEADER + PREVIEW */}
      <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">Passo 2 de 3</div>
            <h2 className="mt-1 font-display text-[18px] font-bold text-navy leading-tight">Adicione as amostras</h2>
            <p className="text-[12px] text-teal mt-1">
              Ideal 4 amostras semelhantes. Deixa o painel buscar por você — ou cola texto / preenche manual como fallback.
            </p>
          </div>
          {preview && preview.valorSugerido > 0 && (
            <div className="rounded-2xl px-4 py-3 text-beige" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)", boxShadow: "0 10px 22px -8px rgba(47,65,86,0.45)" }}>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-beige/70">Preview do valor sugerido</div>
              <div className="mt-0.5 font-display text-[18px] font-bold tabular-nums">{fmtReais(preview.valorSugerido)}</div>
              <div className="text-[10.5px] text-beige/80 tabular-nums">{fmtReais(preview.precoM2Medio)}/m² × {alvo.areaTotal} m²</div>
            </div>
          )}
        </div>

        {/* Contadores */}
        <div className="mt-5 flex flex-wrap gap-3">
          <ContadorPill count={amostras.length} label="amostras" ativo={amostras.length >= 2 && amostras.length <= 6} />
          <ContadorPill count={amostras.filter((a) => a.precoAnuncio > 0 && a.areaTotal > 0).length} label="preenchidas" ativo={true} />
        </div>
      </section>

      {/* BUSCA AUTOMÁTICA — CTA principal */}
      <section
        className="rounded-3xl p-5 lg:p-6 text-beige relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2F4156 0%, #567C8D 100%)" }}
      >
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige/70">
              <Radar size={12} strokeWidth={2.2} />
              Busca automática
            </div>
            <h3 className="mt-1 font-display text-[16px] lg:text-[18px] font-bold leading-tight">
              Deixa o painel achar {alvo.bairro || "no bairro"} pra você
            </h3>
            <p className="mt-1.5 text-[11.5px] text-beige/80 leading-relaxed max-w-md">
              Busca no ZAP Imóveis com filtros do seu alvo (área ±25%, quartos), ranqueia por similaridade e traz as 6 melhores. Você revisa e ajusta.
            </p>
          </div>
          <button
            type="button"
            onClick={buscarAutomatico}
            disabled={buscando}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-beige text-navy text-[12.5px] font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buscando ? <Loader2 size={14} className="animate-spin" /> : <Radar size={14} strokeWidth={2.2} />}
            {buscando ? "Buscando no ZAP..." : (amostras.length > 0 ? "Buscar outras amostras" : "Buscar amostras agora")}
          </button>
        </div>

        {buscaMeta && (
          <div className="mt-4 relative z-10 flex flex-wrap gap-2">
            <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
              {buscaMeta.totalDisponivel.toLocaleString("pt-BR")} anúncios na região
            </span>
            <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
              {buscaMeta.candidatosRankeados} rankeados por similaridade
            </span>
            {buscaMeta.ampliouParaCidade && (
              <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
                Ampliei pra cidade (poucos no bairro)
              </span>
            )}
            <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-white/15 border border-white/20 tabular-nums">
              {(buscaMeta.duracaoMs / 1000).toFixed(1)}s
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute -right-8 -bottom-10 w-[220px] h-[220px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(200,217,230,0.5), transparent 70%)" }} />
      </section>

      {buscaErro && (
        <div className="flex items-start gap-2 p-3 rounded-2xl border" style={{ background: "rgba(217,138,0,0.06)", borderColor: "rgba(217,138,0,0.28)" }}>
          <AlertCircle size={13} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-amber-900 leading-relaxed">{buscaErro}</p>
        </div>
      )}

      {/* Modo ASSISTIDO — 4 atalhos pré-filtrados no ZAP */}
      {urlsAssistidas.length > 0 && (
        <section
          ref={assistidoRef}
          className="rounded-3xl border-2 bg-white p-5 lg:p-6 space-y-4 scroll-mt-24"
          style={{ borderColor: "rgba(86,124,141,0.35)" }}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">
                <ExternalLink size={11} strokeWidth={2.2} />
                Modo assistido — funciona sempre
              </div>
              <h3 className="mt-1 font-display text-[15px] font-bold text-navy leading-tight">
                Abre essas 4 buscas prontas no ZAP
              </h3>
              <p className="mt-1 text-[11.5px] text-teal leading-relaxed max-w-lg">
                Cada atalho abre o ZAP já filtrado pro seu alvo. Escolha 1 imóvel em cada aba, copie o descritivo, cole no card da amostra abaixo — o painel extrai preço, área, quartos e o resto sozinho.
              </p>
            </div>
            <button
              type="button"
              onClick={abrirTodasAssistidas}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-beige text-[12px] font-bold transition-transform active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)", boxShadow: "0 10px 22px -8px rgba(47,65,86,0.35)" }}
            >
              <ExternalLink size={13} />
              Abrir as 4
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {urlsAssistidas.map((u, i) => (
              <a
                key={u.href}
                href={u.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 p-3 rounded-2xl border border-sky/50 bg-beige/40 hover:border-teal hover:bg-white transition-colors"
              >
                <span className="w-8 h-8 rounded-lg grid place-items-center text-beige font-display font-bold text-[13px] flex-shrink-0" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold text-navy truncate">{u.titulo}</div>
                  <div className="text-[10.5px] text-teal truncate">{u.descricao} · abre no {u.fonte}</div>
                </div>
                <ExternalLink size={13} className="text-teal group-hover:translate-x-0.5 transition-transform mt-1 flex-shrink-0" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* LISTA DE AMOSTRAS */}
      <section className="space-y-3">
        {amostras.map((a, i) => (
          <AmostraCard
            key={a.id}
            index={i}
            amostra={a}
            alvo={alvo}
            expandido={expandido === a.id}
            onToggle={() => setExpandido(expandido === a.id ? null : a.id)}
            onChange={(patch) => atualizar(a.id, patch)}
            onRemove={() => remover(a.id)}
          />
        ))}

        {/* Botão adicionar */}
        {amostras.length < 6 && (
          <button
            type="button"
            onClick={adicionar}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-sky text-teal hover:border-teal hover:bg-white transition-colors text-[13px] font-bold"
          >
            <Plus size={16} />
            {amostras.length === 0 ? "Adicionar primeira amostra" : `Adicionar mais uma (${amostras.length}/6)`}
          </button>
        )}
      </section>

      {/* Empty state hint */}
      {amostras.length === 0 && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-beige/60 border border-sky/60">
          <Info size={13} className="text-teal flex-shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-navy/75 leading-relaxed">
            Cole o descritivo de um anúncio (ZAP, VivaReal, OLX) e o painel extrai preço, área, quartos e banheiros. O que ele não conseguir, você completa em segundos.
          </p>
        </div>
      )}

      {amostras.length < 2 && amostras.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertCircle size={13} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-amber-900 leading-relaxed">
            Adicione pelo menos 2 amostras — sem duas referências não dá pra calcular uma média decente.
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Card de uma amostra
// ============================================================
function AmostraCard({
  index, amostra, alvo, expandido, onToggle, onChange, onRemove,
}: {
  index: number
  amostra: AmostraACM
  alvo: ImovelAlvoACM
  expandido: boolean
  onToggle: () => void
  onChange: (patch: Partial<AmostraACM>) => void
  onRemove: () => void
}) {
  const preenchida = amostra.precoAnuncio > 0 && amostra.areaTotal > 0
  const faltando = camposFaltantes({
    precoAnuncio: amostra.precoAnuncio || undefined,
    areaTotal: amostra.areaTotal || undefined,
    quartos: amostra.quartos || undefined,
    banheiros: amostra.banheiros || undefined,
    vagas: amostra.vagas ?? undefined,
  })

  return (
    <article className={`rounded-3xl border transition-colors ${expandido ? "border-teal bg-white" : "border-sky/60 bg-white"}`}>
      {/* HEAD */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <span
          className="w-10 h-10 rounded-xl grid place-items-center text-beige font-display font-bold text-[15px] flex-shrink-0"
          style={{ background: preenchida ? "linear-gradient(135deg, #2F4156, #567C8D)" : "#CBD5E1" }}
        >
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-navy truncate">
            {preenchida
              ? `${amostra.bairro || "Sem bairro"} · ${fmtM2(amostra.areaTotal)} · ${amostra.quartos}Q`
              : "Amostra em branco"}
          </div>
          <div className="text-[11px] text-teal truncate flex items-center gap-2">
            {preenchida ? (
              <>
                <span className="tabular-nums font-semibold">{fmtReais(amostra.precoAnuncio)}</span>
                <span className="text-sky">·</span>
                <span className="tabular-nums">{fmtReais(amostra.precoM2)}/m²</span>
                {amostra.fonte && <><span className="text-sky">·</span><span>{amostra.fonte}</span></>}
              </>
            ) : (
              <span className="text-teal/70">Toque pra preencher</span>
            )}
          </div>
        </div>
        {expandido ? <ChevronUp size={16} className="text-teal flex-shrink-0" /> : <ChevronDown size={16} className="text-teal flex-shrink-0" />}
      </button>

      {/* CORPO EXPANDIDO */}
      {expandido && (
        <div className="border-t border-sky/50 p-4 lg:p-5 space-y-5">
          <ColarTextoBlock amostra={amostra} onChange={onChange} />

          <div className="pt-4 border-t border-sky/50">
            <div className="flex items-center gap-2 mb-3">
              <Home size={13} className="text-teal" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-teal">Dados da amostra</h4>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <CampoSelect
                label="Fonte"
                value={amostra.fonte || "outra"}
                onChange={(v) => onChange({ fonte: v })}
                options={FONTES}
              />
              <CampoTexto
                label="Link do anúncio"
                value={amostra.linkOriginal || ""}
                onChange={(v) => onChange({ linkOriginal: v })}
                placeholder="https://..."
              />
              <CampoTexto
                label="Bairro"
                value={amostra.bairro}
                onChange={(v) => onChange({ bairro: v })}
                icon={MapPin}
                placeholder={alvo.bairro || "Icaraí"}
              />
              <CampoTexto
                label="Endereço / referência"
                value={amostra.endereco}
                onChange={(v) => onChange({ endereco: v })}
                placeholder="Rua ou trecho do anúncio"
              />
            </div>

            <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mt-3">
              <CampoValor
                label="Preço"
                obrigatorio
                destaqueFaltante={faltando.includes("precoAnuncio")}
                value={amostra.precoAnuncio || undefined}
                onChange={(v) => onChange({ precoAnuncio: v || 0 })}
              />
              <CampoNumero
                label="Área"
                obrigatorio
                unidade="m²"
                min={1}
                step={0.5}
                destaqueFaltante={faltando.includes("areaTotal")}
                value={amostra.areaTotal || undefined}
                onChange={(v) => onChange({ areaTotal: v || 0 })}
              />
              <CampoNumero
                label="Quartos"
                value={amostra.quartos || undefined}
                destaqueFaltante={faltando.includes("quartos")}
                onChange={(v) => onChange({ quartos: v || 0 })}
              />
              <CampoNumero
                label="Banheiros"
                value={amostra.banheiros || undefined}
                destaqueFaltante={faltando.includes("banheiros")}
                onChange={(v) => onChange({ banheiros: v || 0 })}
              />
              <CampoNumero
                label="Vagas"
                value={amostra.vagas ?? undefined}
                destaqueFaltante={faltando.includes("vagas")}
                onChange={(v) => onChange({ vagas: v ?? 0 })}
              />
              <CampoValor
                label="Condomínio"
                value={amostra.condominio}
                onChange={(v) => onChange({ condominio: v })}
              />
              <CampoValor
                label="IPTU"
                value={amostra.iptu}
                onChange={(v) => onChange({ iptu: v })}
              />
              {preenchida && (
                <div className="rounded-xl bg-beige/70 border border-sky/50 p-3 flex flex-col justify-center">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-teal">Preço/m² calculado</div>
                  <div className="mt-0.5 font-display text-[16px] font-bold text-navy tabular-nums">
                    {fmtReais(amostra.precoM2)}
                  </div>
                </div>
              )}
            </div>

            {faltando.length > 0 && (
              <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle size={12} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-amber-900 leading-relaxed">
                  Campos destacados em amber estão faltando ({faltando.length}). Preencha pra a amostra entrar no cálculo com precisão.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-4 border-t border-sky/50">
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-red-700 hover:bg-red-50 text-[11.5px] font-semibold transition-colors"
            >
              <Trash2 size={12} />
              Remover amostra
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-teal hover:bg-sky/40 text-[11.5px] font-semibold transition-colors"
            >
              <ChevronUp size={12} />
              Recolher
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

// ============================================================
// Bloco "colar texto" com parser
// ============================================================
function ColarTextoBlock({
  amostra, onChange,
}: {
  amostra: AmostraACM
  onChange: (patch: Partial<AmostraACM>) => void
}) {
  const [texto, setTexto] = useState(amostra.textoBruto || "")
  const [msg, setMsg] = useState<string | null>(null)

  function extrair() {
    if (!texto.trim()) return
    const parsed = parseAmostraTexto(texto)

    const preenchidos: string[] = []
    const patch: Partial<AmostraACM> = {
      origem: "colada",
      textoBruto: texto,
    }
    if (parsed.precoAnuncio !== undefined) { patch.precoAnuncio = parsed.precoAnuncio; preenchidos.push("preço") }
    if (parsed.areaTotal !== undefined) { patch.areaTotal = parsed.areaTotal; preenchidos.push("área") }
    if (parsed.quartos !== undefined) { patch.quartos = parsed.quartos; preenchidos.push("quartos") }
    if (parsed.banheiros !== undefined) { patch.banheiros = parsed.banheiros; preenchidos.push("banheiros") }
    if (parsed.vagas !== undefined) { patch.vagas = parsed.vagas; preenchidos.push("vagas") }
    if (parsed.condominio !== undefined) { patch.condominio = parsed.condominio; preenchidos.push("condomínio") }
    if (parsed.iptu !== undefined) { patch.iptu = parsed.iptu; preenchidos.push("IPTU") }
    if (parsed.fonteSugerida) { patch.fonte = parsed.fonteSugerida as FonteAmostra; preenchidos.push("fonte") }
    if (parsed.linkSugerido && !amostra.linkOriginal) { patch.linkOriginal = parsed.linkSugerido; preenchidos.push("link") }

    onChange(patch)

    setMsg(
      preenchidos.length
        ? `Extraí ${preenchidos.length} campo${preenchidos.length > 1 ? "s" : ""}: ${preenchidos.join(", ")}. Completa o resto abaixo.`
        : "Não consegui identificar nada. Preenche manualmente abaixo."
    )
  }

  function limpar() {
    setTexto("")
    setMsg(null)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ClipboardPaste size={13} className="text-teal" />
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-teal">Colar texto do anúncio</h4>
      </div>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Cole aqui o descritivo do anúncio (título, valor, área, quartos etc). Ex.: Apartamento em Icaraí · R$ 780.000 · 92m² · 3 quartos · 2 banheiros · 1 vaga · Condomínio R$ 850..."
        rows={5}
        className="w-full px-3.5 py-2.5 rounded-xl bg-beige border border-sky text-navy text-[12.5px] outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/15 transition-all resize-y font-mono leading-relaxed"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={extrair}
          disabled={!texto.trim()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-beige text-[12px] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
        >
          <Wand2 size={13} />
          Extrair automaticamente
        </button>
        {texto && (
          <button
            type="button"
            onClick={limpar}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-teal hover:bg-sky/40 text-[11.5px] font-semibold transition-colors"
          >
            <X size={12} />
            Limpar
          </button>
        )}
      </div>

      {msg && (
        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-sky/40 border border-sky">
          <Sparkles size={12} className="text-teal flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-navy leading-relaxed">{msg}</p>
        </div>
      )}
    </div>
  )
}

function ContadorPill({ count, label, ativo }: { count: number; label: string; ativo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold tabular-nums ${
        ativo
          ? "bg-teal/10 border-teal/30 text-teal"
          : "bg-beige border-sky text-navy/60"
      }`}
    >
      <TrendingUp size={11} />
      {count} {label}
    </span>
  )
}
