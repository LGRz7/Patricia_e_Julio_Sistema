"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ImagePlus, Trash2, Sparkles, Check, X } from "lucide-react"
import type { Imovel, TipoImovel, StatusImovel, ImagemImovel } from "@/types/imovel"
import { profissionais } from "@/data/profissionais"
import { apiUpsertImovel } from "@/lib/painel/imoveis-api"
import { slugify } from "@/lib/painel/rota"
import { Select } from "@/components/painel/ui/Select"

interface Props {
  inicial?: Imovel | null
  modo: "novo" | "editar"
}

const TIPOS: { id: TipoImovel; label: string }[] = [
  { id: "apartamento", label: "Apartamento" },
  { id: "casa",        label: "Casa" },
  { id: "cobertura",   label: "Cobertura" },
  { id: "terreno",     label: "Terreno" },
  { id: "comercial",   label: "Comercial" },
]

const STATUS: { id: StatusImovel; label: string }[] = [
  { id: "disponivel", label: "Disponível" },
  { id: "reservado",  label: "Reservado" },
  { id: "vendido",    label: "Vendido" },
]

export function ImovelForm({ inicial, modo }: Props) {
  const router = useRouter()
  const [f, setF] = useState<Imovel>(() => inicial || novoRascunho())
  const [diferencial, setDiferencial] = useState("")
  const [novaImgSrc, setNovaImgSrc] = useState("")
  const [novaImgAlt, setNovaImgAlt] = useState("")
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // slug automático a partir do título (só em "novo")
  useEffect(() => {
    if (modo === "novo") setF((p) => ({ ...p, slug: slugify(p.titulo || "novo-imovel") || "novo-imovel" }))
  }, [f.titulo, modo])

  const set = <K extends keyof Imovel>(k: K, v: Imovel[K]) => setF((p) => ({ ...p, [k]: v }))

  const podeSalvar = f.titulo.trim() && f.localizacao.trim() && f.slug.trim()

  async function salvar() {
    setErro(null)
    if (!podeSalvar) { setErro("Preencha título e localização."); return }
    try {
      await apiUpsertImovel({ ...f, slug: slugify(f.slug) || "imovel", exemplo: false })
      setSalvo(true)
      setTimeout(() => { router.push("/painel/catalogo"); router.refresh() }, 900)
    } catch (e) {
      setErro("Falha ao salvar: " + (e as Error).message)
    }
  }

  function addDiferencial() {
    const v = diferencial.trim()
    if (!v) return
    set("diferenciais", [...(f.diferenciais || []), v])
    setDiferencial("")
  }

  function rmDiferencial(idx: number) {
    set("diferenciais", f.diferenciais.filter((_, i) => i !== idx))
  }

  function addImagem() {
    if (!novaImgSrc.trim()) return
    const img: ImagemImovel = {
      src: novaImgSrc.trim(),
      alt: novaImgAlt.trim() || f.titulo,
      orientacao: "horizontal",
    }
    set("imagens", [...(f.imagens || []), img])
    setNovaImgSrc(""); setNovaImgAlt("")
  }

  function rmImagem(idx: number) {
    set("imagens", f.imagens.filter((_, i) => i !== idx))
  }

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 max-w-4xl mx-auto space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Link href="/painel/catalogo" className="inline-flex items-center gap-1 text-[11.5px] text-teal hover:text-navy font-medium mb-2">
            <ChevronLeft size={13} /> Voltar ao catálogo
          </Link>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">{modo === "novo" ? "Novo imóvel" : "Editar imóvel"}</div>
          <h1 className="mt-1 font-display text-[24px] lg:text-[30px] font-bold text-navy leading-tight">{f.titulo || "Sem título"}</h1>
        </div>
        {salvo && (
          <div className="px-3 py-2 rounded-full bg-navy text-beige text-[11.5px] font-bold flex items-center gap-1.5">
            <Check size={12} strokeWidth={2.4} /> Salvo — abrindo catálogo…
          </div>
        )}
      </header>

      {erro && <div className="p-3 rounded-2xl bg-red-100 border border-red-200 text-red-800 text-[12px]">{erro}</div>}

      {/* Básico */}
      <Section title="Identificação">
        <Grid>
          <Field label="Título" hint="Ex.: Apartamento na Parada 40">
            <Input value={f.titulo} onChange={(v) => set("titulo", v)} placeholder="Título curto" />
          </Field>
          <Field label="Localização" hint="Bairro/cidade — usado pra localizar o imóvel no mapa">
            <Input value={f.localizacao} onChange={(v) => set("localizacao", v)} placeholder="Parada 40, São Gonçalo / RJ" />
          </Field>
          <Field label="Slug (URL)" hint="Gerado automaticamente, mas você pode ajustar">
            <Input value={f.slug} onChange={(v) => set("slug", v)} placeholder="apartamento-parada-40" />
          </Field>
          <Field label="Valor (R$)" hint="Deixe vazio pra 'Sob consulta'">
            <Input
              type="number"
              value={f.valor?.toString() || ""}
              onChange={(v) => set("valor", v ? Number(v) : null)}
              placeholder="170000"
            />
          </Field>
        </Grid>
      </Section>

      {/* Tipo + Status + Responsável */}
      <Section title="Classificação">
        <Grid>
          <Field label="Tipo">
            <Select value={f.tipo} onChange={(v) => set("tipo", v as TipoImovel)} options={TIPOS.map((t) => ({ value: t.id, label: t.label }))} />
          </Field>
          <Field label="Status">
            <Select value={f.status} onChange={(v) => set("status", v as StatusImovel)} options={STATUS.map((t) => ({ value: t.id, label: t.label }))} />
          </Field>
          <Field label="Responsável">
            <Select
              value={f.responsavel}
              onChange={(v) => set("responsavel", v)}
              options={profissionais.map((p) => ({ value: p.id, label: `${p.nome} · ${p.creci}` }))}
            />
          </Field>
        </Grid>
      </Section>

      {/* Detalhes numéricos */}
      <Section title="Especificações">
        <Grid cols={5}>
          <Field label="Quartos"><Input type="number" value={f.quartos?.toString() || ""} onChange={(v) => set("quartos", v ? Number(v) : undefined)} placeholder="1" /></Field>
          <Field label="Suítes"><Input type="number" value={f.suites?.toString() || ""} onChange={(v) => set("suites", v ? Number(v) : undefined)} placeholder="1" /></Field>
          <Field label="Banheiros"><Input type="number" value={f.banheiros?.toString() || ""} onChange={(v) => set("banheiros", v ? Number(v) : undefined)} placeholder="2" /></Field>
          <Field label="Vagas"><Input type="number" value={f.vagas?.toString() || ""} onChange={(v) => set("vagas", v ? Number(v) : undefined)} placeholder="1" /></Field>
          <Field label="Área (m²)"><Input type="number" value={f.area?.toString() || ""} onChange={(v) => set("area", v ? Number(v) : undefined)} placeholder="60" /></Field>
        </Grid>
      </Section>

      {/* Descrição */}
      <Section title="Descrição">
        <Field label="Resumo" hint="1-2 frases curtas — aparece no card do catálogo">
          <Textarea rows={2} value={f.resumo} onChange={(v) => set("resumo", v)} placeholder="Apartamento bem localizado, ideal pra morar ou investir." />
        </Field>
        <Field label="Descrição completa" hint="Texto principal exibido na página do imóvel">
          <Textarea rows={5} value={f.descricao} onChange={(v) => set("descricao", v)} placeholder="Descreva os principais atributos, condomínio, vizinhança, chegada..." />
        </Field>

        <Field label="Diferenciais" hint="Enter pra adicionar cada um">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {f.diferenciais.map((d, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky/50 text-navy text-[11.5px] font-medium">
                {d}
                <button onClick={() => rmDiferencial(i)} className="hover:text-red-700"><X size={11} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={diferencial} onChange={setDiferencial} placeholder="Ex.: Excelente localização" />
            <button onClick={addDiferencial} className="h-11 px-4 rounded-xl bg-navy text-beige text-[12px] font-semibold flex-shrink-0">Adicionar</button>
          </div>
        </Field>
      </Section>

      {/* Imagens */}
      <Section title="Imagens">
        <p className="text-[11.5px] text-teal mb-3">
          Cole a URL da imagem ou o caminho relativo (ex.: <code className="px-1 rounded bg-white text-[11px]">/imoveis/parada-40.png</code>). Você pode pré-carregar as fotos no repo dentro de <code className="px-1 rounded bg-white text-[11px]">public/imoveis/</code>.
        </p>
        {f.imagens.length > 0 && (
          <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {f.imagens.map((img, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden border border-sky/60 aspect-[4/3] bg-beige">
                <ImageOrEmpty src={img.src} alt={img.alt} />
                <button
                  onClick={() => rmImagem(i)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 grid place-items-center text-navy hover:bg-white"
                  title="Remover"
                >
                  <Trash2 size={12} />
                </button>
                <div className="absolute bottom-2 left-2 right-2 text-[10px] font-medium text-beige px-2 py-1 rounded-md bg-navy/70 truncate">{img.src}</div>
              </div>
            ))}
          </div>
        )}
        <Grid cols={3}>
          <Field label="URL ou path"><Input value={novaImgSrc} onChange={setNovaImgSrc} placeholder="/imoveis/exemplo.png" /></Field>
          <Field label="Descrição (alt)"><Input value={novaImgAlt} onChange={setNovaImgAlt} placeholder="Fachada do prédio" /></Field>
          <div className="self-end">
            <button onClick={addImagem} className="w-full h-11 rounded-xl bg-teal text-beige text-[12.5px] font-bold flex items-center justify-center gap-1.5">
              <ImagePlus size={13} /> Adicionar imagem
            </button>
          </div>
        </Grid>
      </Section>

      {/* Ações */}
      <div className="sticky bottom-16 lg:bottom-4 z-10 flex flex-wrap gap-2 justify-end pt-3">
        <Link href="/painel/catalogo" className="h-12 px-5 rounded-full bg-white border border-sky text-navy text-[13px] font-semibold flex items-center">Cancelar</Link>
        <button
          onClick={salvar}
          disabled={!podeSalvar}
          className="h-12 px-6 rounded-full text-beige text-[13px] font-bold flex items-center gap-2 disabled:opacity-40 shadow-[0_10px_24px_-6px_rgba(47,65,86,0.4)]"
          style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
        >
          <Sparkles size={13} strokeWidth={2.2} />
          {modo === "novo" ? "Cadastrar imóvel" : "Salvar alterações"}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================
function novoRascunho(): Imovel {
  return {
    slug: "",
    titulo: "",
    localizacao: "",
    valor: null,
    tipo: "apartamento",
    status: "disponivel",
    resumo: "",
    descricao: "",
    diferenciais: [],
    imagens: [],
    responsavel: "patricia",
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white border border-sky/60 p-5 lg:p-6 space-y-4">
      <h2 className="font-display font-bold text-[16px] text-navy">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 | 5 }) {
  const cls = cols === 5 ? "grid-cols-2 md:grid-cols-5" : cols === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
  return <div className={`grid ${cls} gap-3`}>{children}</div>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10.5px] font-bold uppercase tracking-wider text-teal mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10.5px] text-navy/50 mt-1">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-11 px-3 rounded-xl bg-beige border border-sky text-navy text-[13px] outline-none focus:border-teal"
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full p-3 rounded-xl bg-beige border border-sky text-navy text-[13px] outline-none focus:border-teal resize-none leading-relaxed"
    />
  )
}

function ImageOrEmpty({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false)
  if (err) return <div className="w-full h-full grid place-items-center text-teal text-[10px]">Sem preview</div>
  // Usa <img> nativo pra suportar URLs externas sem config no next.config
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setErr(true)} />
}
