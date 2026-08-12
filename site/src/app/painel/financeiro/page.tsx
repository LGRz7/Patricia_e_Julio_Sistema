"use client"

import { useEffect, useMemo, useState } from "react"
import { Wallet, TrendingUp, Fuel, Car, Bike, Trash2, SlidersHorizontal, X, Save } from "lucide-react"
import { getPrefs, listTrajetos, removeTrajeto, savePrefs, updateTrajeto, PREFS_DEFAULT, type Prefs, type Trajeto } from "@/lib/painel/storage"
import { fmtKm, fmtReais } from "@/lib/painel/rota"

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export default function FinanceiroPage() {
  const [trajetos, setTrajetos] = useState<Trajeto[]>([])
  const [prefs, setPrefs] = useState<Prefs>(PREFS_DEFAULT)
  const [prefsAberto, setPrefsAberto] = useState(false)

  useEffect(() => {
    Promise.all([listTrajetos(), getPrefs()]).then(([t, p]) => { setTrajetos(t); setPrefs(p) })
  }, [])

  const now = new Date()
  const doMes = trajetos.filter((t) => {
    const d = new Date(t.criadoEm)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })

  const totais = useMemo(() => {
    const soma = doMes.reduce(
      (a, t) => {
        a.km += t.distanciaKm * 2
        a.gasto += t.gastoRegistrado ?? Math.min(t.custo.uberIdaVolta, t.custo.taxiIdaVolta, t.custo.gasolinaIdaVolta)
        a.uber += t.custo.uberIdaVolta
        a.taxi += t.custo.taxiIdaVolta
        a.gasolina += t.custo.gasolinaIdaVolta
        return a
      },
      { km: 0, gasto: 0, uber: 0, taxi: 0, gasolina: 0 }
    )
    return { ...soma, count: doMes.length }
  }, [doMes])

  const barrasSemana = useMemo(() => {
    // gastos por dia da semana atual
    const inicio = new Date(now); inicio.setDate(now.getDate() - now.getDay())
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio); d.setDate(inicio.getDate() + i)
      return d
    })
    return dias.map((d) => {
      const total = trajetos
        .filter((t) => new Date(t.criadoEm).toDateString() === d.toDateString())
        .reduce((s, t) => s + (t.gastoRegistrado ?? Math.min(t.custo.uberIdaVolta, t.custo.taxiIdaVolta, t.custo.gasolinaIdaVolta)), 0)
      return { data: d, total }
    })
  }, [trajetos])

  const maxBarra = Math.max(1, ...barrasSemana.map((b) => b.total))

  async function excluir(id: string) {
    await removeTrajeto(id)
    setTrajetos(await listTrajetos())
  }

  async function definirMeioTrajeto(id: string, meio: "uber" | "taxi" | "gasolina") {
    const t = trajetos.find((x) => x.id === id)
    if (!t) return
    const valor = meio === "uber" ? t.custo.uberIdaVolta : meio === "taxi" ? t.custo.taxiIdaVolta : t.custo.gasolinaIdaVolta
    await updateTrajeto(id, { meioEscolhido: meio, gastoRegistrado: valor })
    setTrajetos(await listTrajetos())
  }

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">Financeiro</div>
          <h1 className="mt-1 font-display text-[24px] lg:text-[30px] font-bold text-navy leading-tight">
            {MESES[now.getMonth()]} · {now.getFullYear()}
          </h1>
          <p className="text-[12.5px] text-navy/70 mt-1 max-w-lg">
            Quanto você está gastando em visitas — sem planilha. Marque o meio que realmente usou pra cada trajeto e o total fica preciso.
          </p>
        </div>
        <button
          onClick={() => setPrefsAberto(true)}
          className="h-11 px-4 rounded-full border border-sky text-navy text-[12.5px] font-semibold flex items-center gap-1.5 bg-white hover:bg-beige"
        >
          <SlidersHorizontal size={13} /> Ajustar tarifas
        </button>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Gasto no mês" valor={fmtReais(totais.gasto)} sub={`${totais.count} trajetos`} icon={Wallet} highlight />
        <Kpi label="Distância" valor={fmtKm(totais.km)} sub="ida+volta somadas" icon={TrendingUp} />
        <Kpi label="Ref. Uber" valor={fmtReais(totais.uber)} sub="tudo de Uber" icon={Car} />
        <Kpi label="Ref. gasolina" valor={fmtReais(totais.gasolina)} sub="tudo de carro" icon={Fuel} />
      </section>

      {/* Chart semanal */}
      <section className="rounded-3xl bg-white border border-sky/60 p-5 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-[17px] text-navy">Gastos por dia · Esta semana</h2>
            <p className="text-[11.5px] text-teal mt-0.5">Menor barra = dia mais econômico</p>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 h-[160px]">
          {barrasSemana.map((b, i) => {
            const alt = (b.total / maxBarra) * 100
            const isHoje = b.data.toDateString() === now.toDateString()
            return (
              <div key={i} className="flex flex-col items-center justify-end gap-2">
                <span className="text-[10px] font-semibold text-teal tabular-nums">{b.total > 0 ? fmtReais(b.total).replace("R$\u00a0", "R$") : ""}</span>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(alt, b.total > 0 ? 4 : 0)}%`,
                    background: b.total === 0
                      ? "transparent"
                      : isHoje
                      ? "linear-gradient(180deg, #2F4156, #567C8D)"
                      : "linear-gradient(180deg, #567C8D, #C8D9E6)",
                    border: b.total === 0 ? "1.5px dashed #C8D9E6" : "none",
                  }}
                  title={`${b.data.toLocaleDateString("pt-BR")} · ${fmtReais(b.total)}`}
                />
                <span className={`text-[11px] font-bold ${isHoje ? "text-navy" : "text-teal"}`}>{["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][b.data.getDay()]}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Histórico */}
      <section className="rounded-3xl bg-white border border-sky/60 overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-sky/60 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-[17px] text-navy">Histórico de trajetos</h2>
            <p className="text-[11.5px] text-teal mt-0.5">{trajetos.length} no total · {doMes.length} neste mês</p>
          </div>
        </div>
        {trajetos.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[13px] font-bold text-navy">Nenhum trajeto salvo ainda</p>
            <p className="text-[11.5px] text-teal mt-1">Calcule sua primeira visita em <a href="/painel/mapa" className="underline font-semibold">Trajeto →</a></p>
          </div>
        ) : (
          <ul className="divide-y divide-sky/40">
            {trajetos.map((t) => (
              <li key={t.id} className="p-4 lg:px-6 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="text-[13px] font-bold text-navy line-clamp-1">{t.imovelTitulo}</div>
                  <div className="text-[10.5px] text-teal mt-0.5">
                    {new Date(t.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} ·
                    {" "}{fmtKm(t.distanciaKm * 2)} ida+volta · {t.origem.label.split(",")[0]} → {t.destino.label.split(",")[0]}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <MeioBtn ativo={t.meioEscolhido === "uber"}     onClick={() => definirMeioTrajeto(t.id, "uber")}     icon={Car}  label="Uber"     valor={t.custo.uberIdaVolta} />
                  <MeioBtn ativo={t.meioEscolhido === "taxi"}     onClick={() => definirMeioTrajeto(t.id, "taxi")}     icon={Bike} label="Táxi"     valor={t.custo.taxiIdaVolta} />
                  <MeioBtn ativo={t.meioEscolhido === "gasolina"} onClick={() => definirMeioTrajeto(t.id, "gasolina")} icon={Fuel} label="Gasolina" valor={t.custo.gasolinaIdaVolta} />
                </div>

                <button onClick={() => excluir(t.id)} className="w-8 h-8 grid place-items-center rounded-full text-navy/50 hover:text-navy hover:bg-beige" title="Excluir">
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal prefs */}
      {prefsAberto && <PrefsModal prefs={prefs} onClose={() => setPrefsAberto(false)} onSave={async (p) => { const saved = await savePrefs(p); setPrefs(saved); setPrefsAberto(false) }} />}
    </div>
  )
}

function Kpi({ label, valor, sub, icon: Icon, highlight }: { label: string; valor: string; sub: string; icon: typeof Wallet; highlight?: boolean }) {
  return (
    <div
      className="rounded-2xl p-4 border relative overflow-hidden"
      style={{
        background: highlight ? "linear-gradient(135deg, #2F4156, #567C8D)" : "#FFFFFF",
        borderColor: highlight ? "transparent" : "rgba(200,217,230,0.7)",
      }}
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-wider whitespace-nowrap truncate" style={{ color: highlight ? "rgba(245,239,235,0.75)" : "#567C8D" }}>{label}</span>
        <span className="w-7 h-7 rounded-lg grid place-items-center flex-shrink-0" style={{ background: highlight ? "rgba(245,239,235,0.15)" : "#F5EFEB", color: highlight ? "#F5EFEB" : "#2F4156" }}>
          <Icon size={13} strokeWidth={2} />
        </span>
      </div>
      <div className="font-display text-[20px] lg:text-[24px] font-bold leading-none tabular-nums whitespace-nowrap truncate" style={{ color: highlight ? "#F5EFEB" : "#2F4156" }}>{valor}</div>
      <div className="text-[10.5px] mt-1.5 truncate whitespace-nowrap" style={{ color: highlight ? "rgba(245,239,235,0.7)" : "#567C8D" }}>{sub}</div>
    </div>
  )
}

function MeioBtn({ ativo, onClick, icon: Icon, label, valor }: { ativo: boolean; onClick: () => void; icon: typeof Car; label: string; valor: number }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-semibold transition-all"
      style={{
        background: ativo ? "#2F4156" : "#F5EFEB",
        color:      ativo ? "#F5EFEB" : "#2F4156",
        border:     ativo ? "1px solid transparent" : "1px solid #C8D9E6",
      }}
      title={`${label}: ${fmtReais(valor)}`}
    >
      <Icon size={11} strokeWidth={2} />
      <span>{label}</span>
      <span className="tabular-nums text-[10.5px] opacity-80">{fmtReais(valor)}</span>
    </button>
  )
}

function PrefsModal({ prefs, onClose, onSave }: { prefs: Prefs; onClose: () => void; onSave: (p: Prefs) => Promise<void> }) {
  const [p, setP] = useState<Prefs>(prefs)
  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setP((prev) => ({ ...prev, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-5" style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-[480px] rounded-3xl overflow-hidden bg-beige border border-sky/60 shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-sky/60">
          <div>
            <h3 className="font-display font-bold text-[17px] text-navy">Ajustar tarifas</h3>
            <p className="text-[11.5px] text-teal mt-0.5">Os cálculos de trajeto usam esses valores.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full bg-white border border-sky/60"><X size={14} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Uber · R$/km"><Num v={p.uberKm} on={(v) => set("uberKm", v)} /></Campo>
            <Campo label="Uber · tarifa mín. (R$)"><Num v={p.uberBase} on={(v) => set("uberBase", v)} /></Campo>
            <Campo label="Táxi · R$/km"><Num v={p.taxiKm} on={(v) => set("taxiKm", v)} /></Campo>
            <Campo label="Táxi · bandeirada (R$)"><Num v={p.taxiBase} on={(v) => set("taxiBase", v)} /></Campo>
            <Campo label="Autonomia (km/L)"><Num v={p.autonomia} on={(v) => set("autonomia", v)} /></Campo>
            <Campo label="Gasolina (R$/L)"><Num v={p.precoGasolina} on={(v) => set("precoGasolina", v)} /></Campo>
            <Campo label="Comissão média (%)" full><Num v={p.comissaoPct} on={(v) => set("comissaoPct", v)} /></Campo>
          </div>
        </div>
        <div className="p-4 border-t border-sky/60 flex gap-2 bg-white">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-white border border-sky text-navy text-[12.5px] font-semibold">Cancelar</button>
          <button onClick={() => onSave(p)} className="flex-1 h-11 rounded-xl text-beige text-[12.5px] font-bold flex items-center justify-center gap-1.5" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}>
            <Save size={13} /> Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function Campo({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-[10.5px] font-bold uppercase tracking-wider text-teal mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Num({ v, on }: { v: number; on: (n: number) => void }) {
  return (
    <input
      type="number"
      step="0.1"
      value={v}
      onChange={(e) => on(Number(e.target.value) || 0)}
      className="w-full h-11 px-3 rounded-xl bg-beige border border-sky text-navy text-[13px] outline-none focus:border-teal"
    />
  )
}
