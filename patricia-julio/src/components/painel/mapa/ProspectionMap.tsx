"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import L, { type LatLngExpression } from "leaflet"
import Image from "next/image"
import {
  MapPin, Star, Phone, Globe, Clock, Plus, X, MessageCircle, Search, SlidersHorizontal,
  Layers, ZoomIn, ZoomOut, Locate, ChevronDown, Check, Home, Route, Car, Bike, Fuel, Save, Sparkles,
  Bed, Bath, Ruler, ArrowUpRight,
} from "lucide-react"
import type { Imovel } from "@/types/imovel"
import { apiListImoveis } from "@/lib/painel/imoveis-api"
import {
  addTrajeto, geocodeCached, geocodeCacheSet, getPrefs,
  type Prefs, type Trajeto,
} from "@/lib/painel/storage"
import { calcularCusto, calcularRota, fmtKm, fmtMin, fmtReais, geocode, reverseGeocode, type Custo, type Rota } from "@/lib/painel/rota"
import { useUsuario } from "@/hooks/painel/useUsuario"
import { RotaUber } from "./RotaUber"

// ============================================================
// Sound de notificação (Web Audio API — Uber-style)
// ============================================================
function playNotificationSound() {
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

// ============================================================
// Marker icon — Cores do brand (Navy/Teal/Sky), NUNCA azul Glitch
// ============================================================
function createMarkerIcon(count: number, status: "found" | "selected" | "reserved" | "sold") {
  const size = count > 30 ? 42 : count > 15 ? 36 : 30
  const colors = {
    found:    { bg: "#2F4156", shadow: "rgba(47,65,86,0.35)"   }, // Navy — disponível
    selected: { bg: "#567C8D", shadow: "rgba(86,124,141,0.5)"  }, // Teal — selecionado
    reserved: { bg: "#F59E0B", shadow: "rgba(245,158,11,0.35)" }, // Amber — reservado
    sold:     { bg: "#94A3B8", shadow: "rgba(148,163,184,0.35)"}, // Cinza — vendido
  }
  const color = colors[status] || colors.found
  const ring = status === "selected" ? `box-shadow: 0 0 0 5px rgba(86,124,141,0.28);` : ""

  return L.divIcon({
    className: "pj-marker",
    html: `<div style="width:${size}px;height:${size}px;background:${color.bg};border-radius:50%;display:flex;align-items:center;justify-content:center;color:#F5EFEB;font-weight:700;font-size:${count > 30 ? "12px" : "10px"};font-family:Manrope,Inter,sans-serif;box-shadow:0 4px 12px ${color.shadow};${ring}position:relative;cursor:pointer;">
      ${count}
      <div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%) rotate(45deg);width:10px;height:10px;background:${color.bg};"></div>
    </div>`,
    iconSize: [size, size + 5],
    iconAnchor: [size / 2, size + 5],
  })
}

// Marker do usuário (origem) — bonequinho Teal
const originIcon = L.divIcon({
  className: "pj-marker-origin",
  iconSize: [40, 48],
  iconAnchor: [20, 46],
  html: `
    <div style="position:relative;filter:drop-shadow(0 6px 12px rgba(47,65,86,0.35))">
      <svg viewBox="0 0 40 48" width="40" height="48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pjOrig" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#567C8D"/>
            <stop offset="100%" stop-color="#2F4156"/>
          </linearGradient>
        </defs>
        <path d="M20 0 C31 0 40 8.6 40 19.2 C40 30 20 48 20 48 C20 48 0 30 0 19.2 C0 8.6 9 0 20 0 Z" fill="url(#pjOrig)"/>
        <circle cx="20" cy="14" r="4.2" fill="#F5EFEB"/>
        <path d="M13 26 C13 22 16 20 20 20 C24 20 27 22 27 26 L27 30 L13 30 Z" fill="#F5EFEB"/>
      </svg>
    </div>`,
})

// ============================================================
// LOCATION DATA — hierarquia Estado / Cidade / Bairro
// Foco em RJ (área de atuação dos corretores) + SP + MG básicos
// ============================================================
type LocData = Record<string, { center: [number, number]; cidades: Record<string, { center: [number, number]; bairros: Record<string, { center: [number, number]; zoom: number }> }> }>

const locationData: LocData = {
  "Rio de Janeiro": {
    center: [-22.90, -43.17],
    cidades: {
      "São Gonçalo": {
        center: [-22.827, -43.054],
        bairros: {
          "Todos": { center: [-22.827, -43.054], zoom: 13 },
          "Centro": { center: [-22.827, -43.054], zoom: 15 },
          "Alcântara": { center: [-22.820, -43.020], zoom: 15 },
          "Neves": { center: [-22.862, -43.078], zoom: 15 },
          "Colubandê": { center: [-22.810, -43.030], zoom: 15 },
          "Maria Paula": { center: [-22.835, -43.070], zoom: 15 },
          "Trindade": { center: [-22.807, -43.021], zoom: 15 },
          "Parada 40": { center: [-22.840, -43.040], zoom: 15 },
        },
      },
      "Niterói": {
        center: [-22.88, -43.10],
        bairros: {
          "Todos": { center: [-22.88, -43.10], zoom: 13 },
          "Icaraí": { center: [-22.902, -43.108], zoom: 15 },
          "Centro": { center: [-22.893, -43.124], zoom: 15 },
          "Santa Rosa": { center: [-22.888, -43.090], zoom: 15 },
          "São Francisco": { center: [-22.895, -43.070], zoom: 15 },
          "Várzea das Moças": { center: [-22.925, -42.995], zoom: 14 },
        },
      },
      "Rio de Janeiro": {
        center: [-22.90, -43.17],
        bairros: {
          "Todos": { center: [-22.90, -43.17], zoom: 12 },
          "Copacabana": { center: [-22.971, -43.186], zoom: 15 },
          "Ipanema": { center: [-22.984, -43.204], zoom: 15 },
          "Leblon": { center: [-22.983, -43.224], zoom: 15 },
          "Botafogo": { center: [-22.951, -43.182], zoom: 15 },
          "Tijuca": { center: [-22.925, -43.232], zoom: 15 },
          "Centro": { center: [-22.906, -43.177], zoom: 15 },
          "Barra da Tijuca": { center: [-23.000, -43.365], zoom: 14 },
        },
      },
      "Maricá": {
        center: [-22.919, -42.818],
        bairros: {
          "Todos": { center: [-22.919, -42.818], zoom: 13 },
          "Centro": { center: [-22.919, -42.818], zoom: 15 },
          "Itaipuaçu": { center: [-22.965, -42.929], zoom: 14 },
          "Ponta Negra": { center: [-22.955, -42.706], zoom: 14 },
        },
      },
    },
  },
  "São Paulo": {
    center: [-23.55, -46.63],
    cidades: {
      "São Paulo": {
        center: [-23.55, -46.63],
        bairros: {
          "Todos": { center: [-23.55, -46.63], zoom: 12 },
          "Pinheiros": { center: [-23.563, -46.692], zoom: 15 },
          "Vila Mariana": { center: [-23.589, -46.634], zoom: 15 },
          "Moema": { center: [-23.601, -46.660], zoom: 15 },
        },
      },
    },
  },
}

// Locations (hierarquia sem centros — pra listas de select)
const locations: Record<string, Record<string, string[]>> = {
  "Rio de Janeiro": {
    "São Gonçalo": ["Centro", "Alcântara", "Neves", "Colubandê", "Maria Paula", "Trindade", "Zé Garoto", "Brasilândia", "Vila Yara", "Estrela do Norte", "Porto Novo", "Ipiíba", "Monjolos", "Parada 40", "Boa Vista", "Mutuá", "Rocha"],
    "Niterói": ["Centro", "Icaraí", "Santa Rosa", "São Francisco", "Ingá", "Fonseca", "Barreto", "Charitas", "Piratininga", "Itaipu", "Camboinhas", "Várzea das Moças"],
    "Rio de Janeiro": ["Centro", "Copacabana", "Ipanema", "Leblon", "Botafogo", "Flamengo", "Tijuca", "Barra da Tijuca", "Recreio", "Méier", "Vila Isabel", "Lapa", "Santa Teresa", "Gávea", "Jardim Botânico"],
    "Maricá": ["Centro", "São José do Imbassaí", "Itaipuaçu", "Ponta Negra", "Cordeirinho"],
    "Duque de Caxias": [], "Nova Iguaçu": [], "Petrópolis": [], "Cabo Frio": [],
  },
  "São Paulo": {
    "São Paulo": ["Centro", "Pinheiros", "Vila Mariana", "Moema", "Itaim Bibi", "Jardins"],
    "Campinas": ["Centro", "Cambuí", "Guanabara", "Taquaral"],
  },
  "Minas Gerais": {
    "Belo Horizonte": ["Centro", "Savassi", "Funcionários", "Lourdes"],
  },
}

// Categorias de imóvel (com emoji e id que casa com Imovel["tipo"])
const CATEGORIAS: Array<{ id: string; label: string; emoji: string }> = [
  { id: "todos",       label: "Todos os imóveis", emoji: "🏠" },
  { id: "apartamento", label: "Apartamentos",     emoji: "🏢" },
  { id: "casa",        label: "Casas",             emoji: "🏡" },
  { id: "cobertura",   label: "Coberturas",        emoji: "🏙️" },
  { id: "terreno",     label: "Terrenos",          emoji: "🌳" },
  { id: "comercial",   label: "Comercial",         emoji: "🏪" },
]

// Tile CartoDB — visual clean/premium (mesmo do Glitch)
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"


// ============================================================
// PremiumSelect — dropdown custom com paleta dos corretores
// ============================================================
function PremiumSelect({ label, options, value, onChange, placeholder }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const selectedLabel = options.find((o) => o === value) || value || placeholder || "Selecione"

  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] font-semibold text-teal uppercase tracking-wider mb-1">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-left transition-all duration-200"
        style={{
          borderColor: isOpen ? "#567C8D" : "rgba(200,217,230,0.7)",
          boxShadow: isOpen ? "0 0 0 3px rgba(86,124,141,0.15)" : "none",
        }}
      >
        <span className="text-[13px] font-medium text-navy truncate">{selectedLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-teal flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1.5 bg-white rounded-xl border overflow-hidden"
          style={{ borderColor: "rgba(200,217,230,0.9)", boxShadow: "0 20px 44px -12px rgba(47,65,86,0.22)", animation: "fadeIn 180ms ease" }}
        >
          <div className="max-h-[240px] overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => { onChange(option); setIsOpen(false) }}
                className={`w-full text-left px-3.5 py-2 text-[13px] transition-colors ${
                  value === option
                    ? "bg-beige/70 text-navy font-semibold"
                    : "text-navy hover:bg-beige/50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </div>
  )
}

// ============================================================
// CategorySelect — dropdown com emoji, mesmo padrão do Glitch
// ============================================================
function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const selected = CATEGORIAS.find((c) => c.id === value) || CATEGORIAS[0]

  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] font-semibold text-teal uppercase tracking-wider mb-1">Categoria</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-left transition-all duration-200"
        style={{
          borderColor: isOpen ? "#567C8D" : "rgba(200,217,230,0.7)",
          boxShadow: isOpen ? "0 0 0 3px rgba(86,124,141,0.15)" : "none",
        }}
      >
        <span className="text-[15px] leading-none">{selected.emoji}</span>
        <span className="text-[13px] font-medium text-navy truncate flex-1">{selected.label}</span>
        <ChevronDown className={`w-4 h-4 text-teal flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1.5 bg-white rounded-xl border overflow-hidden"
          style={{ borderColor: "rgba(200,217,230,0.9)", boxShadow: "0 20px 44px -12px rgba(47,65,86,0.22)", animation: "fadeIn 180ms ease" }}
        >
          <div className="max-h-[240px] overflow-y-auto py-1">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                onClick={() => { onChange(c.id); setIsOpen(false) }}
                className={`w-full text-left px-3.5 py-2 text-[13px] flex items-center gap-2 transition-colors ${
                  value === c.id ? "bg-beige/70 text-navy font-semibold" : "text-navy hover:bg-beige/50"
                }`}
              >
                <span className="text-[15px] leading-none">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// MapController — anima o mapa quando o centro/zoom muda
// ============================================================
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 13, { duration: 0.8 })
  }, [center, zoom, map])
  return null
}

// ============================================================
// RadarOverlay — pulsos concêntricos no centro do mapa durante busca
// ============================================================
function RadarOverlay({ center, searching }: { center: [number, number]; searching: boolean }) {
  const map = useMap()
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const updatePos = () => {
      if (center && map) {
        const point = map.latLngToContainerPoint(center)
        setPos({ x: point.x, y: point.y })
      }
    }
    updatePos()
    map.on("move", updatePos); map.on("zoom", updatePos); map.on("moveend", updatePos); map.on("zoomend", updatePos)
    return () => { map.off("move", updatePos); map.off("zoom", updatePos); map.off("moveend", updatePos); map.off("zoomend", updatePos) }
  }, [center, map])

  if (!searching || !pos) return null

  return (
    <div className="absolute z-[800] pointer-events-none" style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}>
      <div className="relative flex items-center justify-center w-[200px] h-[200px]">
        {/* Rings de fundo com blur */}
        <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(47,65,86,0.10) 0%, transparent 70%)", animation: "pjRadarPulse 2.5s ease-out infinite" }} />
        <div className="absolute inset-[15%] rounded-full" style={{ background: "radial-gradient(circle, rgba(86,124,141,0.12) 0%, transparent 70%)", animation: "pjRadarPulse 2.5s ease-out infinite 0.8s" }} />
        <div className="absolute inset-[30%] rounded-full" style={{ background: "radial-gradient(circle, rgba(86,124,141,0.14) 0%, transparent 70%)", animation: "pjRadarPulse 2.5s ease-out infinite 1.6s" }} />
        {/* Bordas expansivas */}
        <div className="absolute inset-0 rounded-full border" style={{ borderColor: "rgba(86,124,141,0.28)", animation: "pjRadarExpand 2.5s cubic-bezier(0.23,1,0.32,1) infinite" }} />
        <div className="absolute inset-0 rounded-full border" style={{ borderColor: "rgba(86,124,141,0.18)", animation: "pjRadarExpand 2.5s cubic-bezier(0.23,1,0.32,1) infinite 0.8s" }} />
        <div className="absolute inset-0 rounded-full border" style={{ borderColor: "rgba(86,124,141,0.10)", animation: "pjRadarExpand 2.5s cubic-bezier(0.23,1,0.32,1) infinite 1.6s" }} />
        {/* Ponto central */}
        <div className="relative">
          <div className="absolute -inset-2 rounded-full" style={{ background: "rgba(47,65,86,0.20)", animation: "pjPulse 1.5s ease infinite" }} />
          <div className="w-4 h-4 rounded-full" style={{ background: "#2F4156", boxShadow: "0 0 14px rgba(47,65,86,0.5), 0 0 4px rgba(47,65,86,0.8)" }} />
        </div>
      </div>
      <style>{`
        @keyframes pjRadarPulse { 0% { transform: scale(0.5); opacity: 0 } 40% { opacity: 1 } 100% { transform: scale(1.5); opacity: 0 } }
        @keyframes pjRadarExpand { 0% { transform: scale(0.3); opacity: 0.9 } 100% { transform: scale(1.4); opacity: 0 } }
        @keyframes pjPulse { 0%,100% { opacity: 0.4; transform: scale(1) } 50% { opacity: 1; transform: scale(1.2) } }
      `}</style>
    </div>
  )
}


// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

type MarkerImovel = Imovel & { lat: number; lng: number; count: number }

export default function ProspectionMap() {
  const { usuario } = useUsuario()

  // Filtros persistidos em localStorage (mesmo padrão do Glitch)
  const [estado, setEstado]     = useState<string>(() => (typeof window !== "undefined" && localStorage.getItem("pj-map-estado")) || "Rio de Janeiro")
  const [cidade, setCidade]     = useState<string>(() => (typeof window !== "undefined" && localStorage.getItem("pj-map-cidade")) || "São Gonçalo")
  const [bairro, setBairro]     = useState<string>(() => (typeof window !== "undefined" && localStorage.getItem("pj-map-bairro")) || "Todos")
  const [categoria, setCategoria] = useState<string>(() => (typeof window !== "undefined" && localStorage.getItem("pj-map-categoria")) || "todos")

  const [selectedMarker, setSelectedMarker] = useState<MarkerImovel | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [markers, setMarkers] = useState<MarkerImovel[]>([])

  const [searchState, setSearchState] = useState<"idle" | "searching" | "no-results" | "empty">("idle")
  const [searchedBairro, setSearchedBairro] = useState("")

  // Catálogo real do backend (base + publicados) e prefs
  const [catalogo, setCatalogo] = useState<Imovel[]>([])
  const [prefs, setPrefs] = useState<Prefs | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([apiListImoveis(), getPrefs()]).then(([imv, p]) => {
      if (!mounted) return
      setCatalogo(imv)
      setPrefs(p)
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  // Persistir filtros
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("pj-map-estado", estado) }, [estado])
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("pj-map-cidade", cidade) }, [cidade])
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("pj-map-bairro", bairro) }, [bairro])
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("pj-map-categoria", categoria) }, [categoria])

  // Origem (localização) + rota + custo — usados pelo card lateral do imóvel
  const [origem, setOrigem] = useState<{ lat: number; lon: number; label: string } | null>(null)
  const [rota, setRota] = useState<Rota | null>(null)
  const [custo, setCusto] = useState<Custo | null>(null)
  const [salvo, setSalvo] = useState(false)
  const [loadingOrigem, setLoadingOrigem] = useState(false)
  const [erroGeo, setErroGeo] = useState<string | null>(null)

  // Listas hierárquicas
  const estadosList = Object.keys(locations)
  const cidadesList = estado && locations[estado] ? Object.keys(locations[estado]) : []
  const bairrosList = (estado && cidade && (locations[estado]?.[cidade]?.length ?? 0) > 0)
    ? ["Todos", ...(locations[estado][cidade] as string[])]
    : ["Todos"]

  // Coordenadas do centro do mapa (com fallback via Nominatim se não estiver no legacy)
  const estadoData = locationData[estado]
  const cidadeData = estadoData?.cidades[cidade]
  const bairroData = cidadeData?.bairros[bairro] || cidadeData?.bairros["Todos"]

  const [geoCenter, setGeoCenter] = useState<[number, number] | null>(null)
  useEffect(() => {
    if (bairro && bairro !== "Todos") {
      const query = encodeURIComponent(`${bairro}, ${cidade}, ${estado}, Brasil`)
      fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`)
        .then((r) => r.json())
        .then((data) => setGeoCenter(data?.[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null))
        .catch(() => setGeoCenter(null))
    } else if (bairro === "Todos" && cidade) {
      const query = encodeURIComponent(`${cidade}, ${estado}, Brasil`)
      fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`)
        .then((r) => r.json())
        .then((data) => setGeoCenter(data?.[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null))
        .catch(() => setGeoCenter(null))
    }
  }, [bairro, cidade, estado])

  const mapCenter: [number, number] = geoCenter || bairroData?.center || cidadeData?.center || estadoData?.center || [-22.827, -43.054]
  const mapZoom = geoCenter && bairro !== "Todos" ? 15 : geoCenter ? 13 : bairroData?.zoom || 13

  // ============================================================
  // BUSCAR — filtra catálogo + geocoda imóveis (com radar de 3s)
  // ============================================================
  const handleSearch = async () => {
    setIsSearching(true)
    setSelectedMarker(null)
    setSearchState("searching")
    setSearchedBairro(bairro)

    // Radar por pelo menos 2.5s pra sensação de busca (mesma UX do Glitch)
    const radarPromise = new Promise((r) => setTimeout(r, 2500))

    try {
      // 1) filtra o catálogo por categoria + cidade + bairro (best-effort via string)
      const filtrados = catalogo.filter((i) => {
        if (categoria !== "todos" && i.tipo !== categoria) return false
        const loc = i.localizacao.toLowerCase()
        if (cidade && !loc.includes(cidade.toLowerCase())) return false
        if (bairro !== "Todos" && !loc.includes(bairro.toLowerCase())) return false
        return true
      })

      // 2) geocoda em paralelo (com cache)
      const geoResults = await Promise.all(
        filtrados.map(async (i) => {
          const chave = `imovel:${i.slug}:${i.localizacao}`
          let coords = await geocodeCached(chave)
          if (!coords) {
            try {
              const r = await geocode(i.localizacao)
              if (r[0]) {
                coords = { lat: r[0].lat, lon: r[0].lon }
                await geocodeCacheSet(chave, coords)
              }
            } catch {}
          }
          if (!coords) return null
          return { ...i, lat: coords.lat, lng: coords.lon, count: 1 } as MarkerImovel
        })
      )

      await radarPromise
      const validos = geoResults.filter((r): r is MarkerImovel => !!r)

      if (validos.length === 0) {
        setMarkers([])
        setSearchState(filtrados.length === 0 ? "empty" : "no-results")
      } else {
        setMarkers(validos)
        setSearchState("idle")
        playNotificationSound()
      }
    } catch {
      setSearchState("empty")
    }
    setIsSearching(false)
  }

  // Busca inicial desabilitada - você precisa clicar no botão "Buscar" manualmente
  const searchedOnce = useRef(false)
  // useEffect(() => {
  //   if (searchedOnce.current || !catalogo.length) return  
  //   searchedOnce.current = true
  //   handleSearch()
  // }, [catalogo])

  // Ao trocar filtros, limpa selecionado + rota
  useEffect(() => { setSelectedMarker(null); setRota(null); setCusto(null) }, [categoria, bairro, cidade, estado])

  // Reset em cascata
  const handleEstadoChange = (val: string) => {
    setEstado(val)
    const cities = locations[val] ? Object.keys(locations[val]) : []
    setCidade(cities[0] || ""); setBairro("Todos"); setSelectedMarker(null)
  }
  const handleCidadeChange = (val: string) => { setCidade(val); setBairro("Todos"); setSelectedMarker(null) }

  // ============================================================
  // TRAJETO — calcular rota quando tem origem + marker selecionado
  // ============================================================
  useEffect(() => {
    if (!origem || !selectedMarker || !prefs) { setRota(null); setCusto(null); return }
    calcularRota({ lat: origem.lat, lon: origem.lon }, { lat: selectedMarker.lat, lon: selectedMarker.lng })
      .then((r) => {
        setRota(r)
        setCusto(calcularCusto(r.distanciaKm, prefs, selectedMarker.valor))
      })
      .catch(() => { setRota(null); setCusto(null) })
  }, [origem, selectedMarker, prefs])

  const usarLocalizacaoAtual = () => {
    setErroGeo(null)
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErroGeo("Esse navegador não suporta geolocalização.")
      return
    }
    // Geolocation exige HTTPS ou localhost. Detectar cedo pra mensagem clara.
    const proto = window.location.protocol
    const host = window.location.hostname
    const seguro = proto === "https:" || host === "localhost" || host === "127.0.0.1"
    if (!seguro) {
      setErroGeo(
        `Localização precisa de HTTPS. Você tá em ${proto}//${host} — acesse via localhost ou publique o site em https.`,
      )
      return
    }
    setLoadingOrigem(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        const label = await reverseGeocode(lat, lon).catch(() => "Minha localização")
        setOrigem({ lat, lon, label: label.split(",").slice(0, 3).join(", ") })
        setLoadingOrigem(false)
      },
      (err) => {
        setLoadingOrigem(false)
        const msg =
          err.code === 1
            ? "Permissão negada. Libera a localização nas configurações do navegador (ícone de cadeado na barra de endereço)."
            : err.code === 2
            ? "Não consegui pegar o GPS. Verifica se está ativado e tente de novo."
            : err.code === 3
            ? "Tempo esgotado esperando o GPS. Tenta de novo — ou digita o endereço manualmente."
            : `Falha na geolocalização (${err.message}). Digita o endereço manualmente.`
        setErroGeo(msg)
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    )
  }

  const salvarTrajeto = async () => {
    if (!origem || !selectedMarker || !rota || !custo) return
    const t: Trajeto = {
      id: (crypto.randomUUID && crypto.randomUUID()) || `t_${Date.now()}`,
      criadoEm: new Date().toISOString(),
      corretor: usuario?.papel || "visitante",
      imovelSlug: selectedMarker.slug,
      imovelTitulo: selectedMarker.titulo,
      origem, destino: { lat: selectedMarker.lat, lon: selectedMarker.lng, label: selectedMarker.titulo },
      distanciaKm: rota.distanciaKm, duracaoMin: rota.duracaoMin,
      custo: { uberIdaVolta: custo.uberIdaVolta, taxiIdaVolta: custo.taxiIdaVolta, gasolinaIdaVolta: custo.gasolinaIdaVolta },
    }
    await addTrajeto(t)
    setSalvo(true); setTimeout(() => setSalvo(false), 3500)
  }

  // Status pra marker (usado no map)
  const statusFor = (m: MarkerImovel): "found" | "selected" | "reserved" | "sold" => {
    if (selectedMarker?.slug === m.slug) return "selected"
    if (m.status === "reservado") return "reserved"
    if (m.status === "vendido") return "sold"
    return "found"
  }


  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="bg-white rounded-2xl border border-sky/60 overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(47,65,86,0.06)" }}>
      {/* HEADER · filtros + botão buscar */}
      <div className="px-4 lg:px-5 py-3 lg:py-3.5 border-b border-sky/60">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="text-[13px] lg:text-sm font-bold text-navy whitespace-nowrap truncate" style={{ fontFamily: "Manrope, Inter, sans-serif" }}>Mapa · Trajeto & Custo</h2>
          <div className="hidden sm:flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky/60 text-[11px] font-medium text-teal hover:bg-beige/50 transition-colors">
              <SlidersHorizontal className="w-3 h-3" />
              Filtros
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky/60 text-[11px] font-medium text-teal hover:bg-beige/50 transition-colors">
              <Layers className="w-3 h-3" />
              Camadas
            </button>
          </div>
        </div>

        {/* Filter row — mobile: 2 por linha via flex-1; desktop: larguras fixas */}
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="flex-1 min-w-[135px] sm:flex-none sm:w-[145px]">
            <PremiumSelect label="Estado" options={estadosList} value={estado} onChange={handleEstadoChange} />
          </div>
          <div className="flex-1 min-w-[135px] sm:flex-none sm:w-[145px]">
            <PremiumSelect label="Cidade" options={cidadesList} value={cidade} onChange={handleCidadeChange} />
          </div>
          <div className="flex-1 min-w-[135px] sm:flex-none sm:w-[140px]">
            <PremiumSelect label="Bairro" options={bairrosList} value={bairro} onChange={(val) => { setBairro(val); setSelectedMarker(null) }} />
          </div>
          <div className="flex-1 min-w-[135px] sm:flex-none sm:w-[175px]">
            <CategorySelect value={categoria} onChange={(val) => { setCategoria(val); setSelectedMarker(null); setMarkers([]) }} />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-beige transition-all whitespace-nowrap disabled:cursor-wait"
            style={{
              background: isSearching ? "#567C8D" : "linear-gradient(135deg, #2F4156, #567C8D)",
              boxShadow: "0 6px 16px -4px rgba(47,65,86,0.4)",
            }}
          >
            <Search className={`w-3.5 h-3.5 ${isSearching ? "animate-spin" : ""}`} />
            {isSearching ? "Buscando..." : "Buscar imóveis"}
          </button>
        </div>
      </div>

      {/* MAP + SIDE CARD — mobile: side card vira bottom sheet; desktop: lado a lado */}
      <div className="flex flex-col lg:flex-row relative">
        {/* Map */}
        <div className="flex-1 w-full h-[500px] sm:h-[560px] lg:h-[600px] relative z-0 overflow-hidden">
          <MapContainer
            center={mapCenter as LatLngExpression}
            zoom={13}
            zoomControl={false}
            attributionControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url={TILE_URL} attribution="" />
            <MapController center={mapCenter} zoom={mapZoom} />
            <RadarOverlay center={mapCenter} searching={searchState === "searching"} />

            {origem && <Marker position={[origem.lat, origem.lon]} icon={originIcon} />}

            {markers.map((m) => (
              <Marker
                key={`${categoria}-${m.slug}`}
                position={[m.lat, m.lng]}
                icon={createMarkerIcon(m.count, statusFor(m))}
                eventHandlers={{ click: () => setSelectedMarker(m) }}
              />
            ))}

            {/* LINHA DE ROTA ESTILO UBER */}
            {origem && selectedMarker && rota && (
              <RotaUber
                origem={{ lat: origem.lat, lon: origem.lon }}
                destino={{ lat: selectedMarker.lat, lon: selectedMarker.lng }}
              />
            )}
          </MapContainer>

          {/* Estado: buscando (chip no topo) */}
          {searchState === "searching" && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[900] pointer-events-none" style={{ animation: "pjFadeIn 200ms cubic-bezier(0.23,1,0.32,1)" }}>
              <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-sky/70 shadow-lg px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#2F4156", animation: "pjPulseDot 1s ease infinite" }} />
                  <p className="text-[13px] font-medium text-navy">Buscando imóveis...</p>
                </div>
              </div>
            </div>
          )}

          {/* Estado: sem resultados no bairro */}
          {searchState === "no-results" && (
            <div className="absolute inset-0 z-[900] flex items-center justify-center bg-white/80 backdrop-blur-sm" style={{ animation: "pjFadeIn 200ms cubic-bezier(0.23,1,0.32,1)" }}>
              <div className="bg-white rounded-2xl border border-sky/70 shadow-lg p-8 max-w-sm text-center" style={{ animation: "pjScaleIn 220ms cubic-bezier(0.23,1,0.32,1)" }}>
                <div className="w-12 h-12 rounded-full bg-beige flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-teal" />
                </div>
                <h3 className="text-[15px] font-semibold text-navy mb-1.5">
                  Sem imóveis nesse recorte
                </h3>
                <p className="text-[12px] text-teal mb-5 leading-relaxed">
                  Não encontrei imóveis no bairro <strong>{searchedBairro}</strong> nessa categoria. Tente ampliar o filtro pra &quot;Todos&quot; ou outra categoria.
                </p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => { setBairro("Todos"); setTimeout(handleSearch, 50) }} className="px-4 py-2.5 text-beige text-[12px] font-semibold rounded-xl transition-transform active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}>
                    Ver toda a cidade
                  </button>
                  <button onClick={() => setSearchState("idle")} className="px-4 py-2.5 bg-beige text-navy text-[12px] font-medium rounded-xl hover:bg-sky/40">
                    Alterar filtros
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Estado: catálogo vazio nessa categoria */}
          {searchState === "empty" && (
            <div className="absolute inset-0 z-[900] flex items-center justify-center bg-white/80 backdrop-blur-sm" style={{ animation: "pjFadeIn 200ms cubic-bezier(0.23,1,0.32,1)" }}>
              <div className="bg-white rounded-2xl border border-sky/70 shadow-lg p-8 max-w-sm text-center">
                <div className="w-12 h-12 rounded-full bg-beige flex items-center justify-center mx-auto mb-4">
                  <Home className="w-6 h-6 text-teal" />
                </div>
                <h3 className="text-[15px] font-semibold text-navy mb-1.5">Nenhum imóvel no catálogo</h3>
                <p className="text-[12px] text-teal mb-5 leading-relaxed">
                  Cadastre imóveis pra eles aparecerem no mapa.
                </p>
                <a href="/painel/catalogo/novo" className="inline-block px-4 py-2.5 text-beige text-[12px] font-semibold rounded-xl transition-transform active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}>
                  Adicionar imóvel
                </a>
              </div>
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-4 z-[400] flex flex-col gap-1">
            <ZoomBtn onClick={() => {}} icon={ZoomIn} />
            <ZoomBtn onClick={() => {}} icon={ZoomOut} />
            <div className="h-1" />
            <ZoomBtn onClick={usarLocalizacaoAtual} icon={Locate} title="Usar minha localização" />
          </div>

          {/* Legenda — mobile: acima dos zoom controls; desktop: ao lado */}
          <div className="absolute bottom-40 left-4 lg:bottom-4 lg:left-14 z-[400] flex flex-wrap items-center gap-3 lg:gap-4 px-3 py-2 rounded-xl bg-beige/95 backdrop-blur-md border border-sky/60 max-w-[calc(100%-2rem)]" style={{ boxShadow: "0 8px 20px -6px rgba(47,65,86,0.15)" }}>
            <Legend cor="#2F4156" label="Disponível" />
            <Legend cor="#F59E0B" label="Reservado" />
            <Legend cor="#94A3B8" label="Vendido" />
            {origem && <Legend cor="#567C8D" label="Você" ring />}
          </div>
        </div>

        {/* SIDE CARD · desktop lado a lado */}
        {selectedMarker && (
          <div className="hidden lg:block w-[340px] border-l border-sky/60 bg-beige/40 flex-shrink-0 relative overflow-y-auto max-h-[600px]">
            <SideCard
              imovel={selectedMarker}
              origem={origem}
              rota={rota}
              custo={custo}
              loadingOrigem={loadingOrigem}
              erroGeo={erroGeo}
              onClose={() => setSelectedMarker(null)}
              onUsarLocalizacao={usarLocalizacaoAtual}
              onDefinirOrigem={(o) => { setErroGeo(null); setOrigem(o) }}
              onLimparOrigem={() => { setErroGeo(null); setOrigem(null) }}
              onSalvar={salvarTrajeto}
              salvo={salvo}
            />
          </div>
        )}

        {/* SIDE CARD · mobile bottom sheet */}
        {selectedMarker && (
          <div
            className="lg:hidden fixed inset-0 z-[1000] flex flex-col justify-end"
            style={{ background: "rgba(47,65,86,0.45)", backdropFilter: "blur(3px)" }}
            onClick={() => setSelectedMarker(null)}
          >
            <div
              className="bg-beige rounded-t-3xl max-h-[88vh] overflow-y-auto relative border-t border-sky/60"
              style={{ animation: "pjSheetUp 260ms cubic-bezier(0.23,1,0.32,1)", boxShadow: "0 -20px 44px -12px rgba(47,65,86,0.35)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grip visual */}
              <div className="sticky top-0 z-10 pt-2 pb-1 flex justify-center bg-beige">
                <div className="w-10 h-1 rounded-full bg-sky/70" />
              </div>
              <SideCard
                imovel={selectedMarker}
                origem={origem}
                rota={rota}
                custo={custo}
                loadingOrigem={loadingOrigem}
                erroGeo={erroGeo}
                onClose={() => setSelectedMarker(null)}
                onUsarLocalizacao={usarLocalizacaoAtual}
                onDefinirOrigem={(o) => { setErroGeo(null); setOrigem(o) }}
                onLimparOrigem={() => { setErroGeo(null); setOrigem(null) }}
                onSalvar={salvarTrajeto}
                salvo={salvo}
              />
            </div>
            <style>{`@keyframes pjSheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Zoom button
// ============================================================
function ZoomBtn({ onClick, icon: Icon, title }: { onClick: () => void; icon: typeof ZoomIn; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-9 h-9 rounded-lg bg-white border border-sky/70 flex items-center justify-center hover:bg-beige transition-colors"
      style={{ boxShadow: "0 2px 8px rgba(47,65,86,0.10)" }}
    >
      <Icon className="w-4 h-4 text-teal" />
    </button>
  )
}

function Legend({ cor, label, ring }: { cor: string; label: string; ring?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: cor, boxShadow: ring ? `0 0 0 3px ${cor}44` : undefined }} />
      <span className="text-[10px] text-navy font-semibold">{label}</span>
    </div>
  )
}


// ============================================================
// SIDE CARD · Detalhes do imóvel + origem + trajeto/custo com MÚLTIPLAS ROTAS
// ============================================================
function SideCard({
  imovel, origem, rotas, rotaSelecionada, onSelecionarRota, loadingOrigem, erroGeo,
  onClose, onUsarLocalizacao, onDefinirOrigem, onLimparOrigem, onSalvar, salvo,
}: {
  imovel: MarkerImovel
  origem: { lat: number; lon: number; label: string } | null
  rotas: import("@/lib/painel/rota").RotaComCusto[]
  rotaSelecionada: import("@/lib/painel/rota").RotaComCusto | null
  onSelecionarRota: (rota: import("@/lib/painel/rota").RotaComCusto) => void
  loadingOrigem: boolean
  erroGeo: string | null
  onClose: () => void
  onUsarLocalizacao: () => void
  onDefinirOrigem: (o: { lat: number; lon: number; label: string }) => void
  onLimparOrigem: () => void
  onSalvar: () => void
  salvo: boolean
}) {
  const cover = imovel.imagens?.[0]?.src || "/imoveis/placeholder-fachada.svg"
  const [buscandoEnd, setBuscandoEnd] = useState(false)
  const [query, setQuery] = useState("")
  const [sug, setSug] = useState<Array<{ label: string; lat: number; lon: number; displayName: string }>>([])
  const [dropdownAberto, setDropdownAberto] = useState(false)

  useEffect(() => {
    if (!dropdownAberto || query.length < 3) { setSug([]); return }
    setBuscandoEnd(true)
    const t = setTimeout(() => {
      geocode(query).then(setSug).catch(() => setSug([])).finally(() => setBuscandoEnd(false))
    }, 350)
    return () => clearTimeout(t)
  }, [query, dropdownAberto])

  const statusColor = imovel.status === "vendido" ? "#94A3B8" : imovel.status === "reservado" ? "#F59E0B" : "#2F4156"

  return (
    <div className="p-4 relative">
      <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1.5 rounded-lg hover:bg-white transition-colors">
        <X className="w-3.5 h-3.5 text-teal" />
      </button>

      {/* Cover */}
      <div className="relative w-full h-[140px] rounded-2xl mb-3 overflow-hidden">
        <Image src={cover} alt={imovel.imagens?.[0]?.alt || imovel.titulo} fill sizes="340px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-navy/70" />
        <span
          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider text-beige"
          style={{ background: statusColor }}
        >
          {imovel.status === "disponivel" ? "Disponível" : imovel.status === "reservado" ? "Reservado" : "Vendido"}
        </span>
      </div>

      <h3 className="text-[15px] font-bold pr-6 leading-tight text-navy" style={{ fontFamily: "Manrope, Inter, sans-serif" }}>{imovel.titulo}</h3>
      <p className="text-[11px] mt-1 mb-3 text-teal">{imovel.tipo} · {imovel.localizacao}</p>

      {/* Valor destacado */}
      <div className="p-3 rounded-2xl mb-3 border" style={{ background: "linear-gradient(135deg, rgba(200,217,230,0.35), rgba(245,239,235,0.6))", borderColor: "rgba(200,217,230,0.6)" }}>
        <p className="text-[9.5px] font-bold uppercase tracking-wider text-teal">Valor</p>
        <p className="text-[20px] font-bold text-navy tabular-nums leading-none mt-1" style={{ fontFamily: "Manrope, Inter, sans-serif" }}>
          {imovel.valor ? fmtReais(imovel.valor) : <span className="text-[14px] text-teal">Sob consulta</span>}
        </p>
      </div>

      {/* Ficha rápida */}
      {(imovel.quartos != null || imovel.banheiros != null || imovel.vagas != null || imovel.area != null) && (
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {imovel.quartos != null && <Ficha icon={Bed} v={imovel.quartos} l="Quartos" />}
          {imovel.banheiros != null && <Ficha icon={Bath} v={imovel.banheiros} l="Banh." />}
          {imovel.vagas != null && <Ficha icon={Car} v={imovel.vagas} l="Vagas" />}
          {imovel.area != null && <Ficha icon={Ruler} v={`${imovel.area}m²`} l="Área" />}
        </div>
      )}

      {/* ============= BLOCO DE TRAJETO ============= */}
      <div className="border-t border-sky/60 pt-3 mt-3">
        <p className="text-[9.5px] font-bold uppercase tracking-wider text-teal mb-2 flex items-center gap-1.5">
          <Route size={11} /> Trajeto até este imóvel
        </p>

        {!origem ? (
          <div className="space-y-2">
            <button
              onClick={onUsarLocalizacao}
              disabled={loadingOrigem}
              className="w-full h-11 rounded-xl text-beige text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
            >
              <Locate size={13} strokeWidth={2.2} />
              {loadingOrigem ? "Localizando..." : "Usar minha localização"}
            </button>

            {erroGeo && (
              <div
                className="rounded-xl border p-2.5 text-[11px] leading-relaxed"
                style={{
                  background: "rgba(217,138,0,0.08)",
                  borderColor: "rgba(217,138,0,0.32)",
                  color: "#8a5c00",
                }}
              >
                {erroGeo}
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setDropdownAberto((v) => !v)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-sky/60 text-navy text-[12px] font-medium flex items-center gap-2 hover:border-teal"
              >
                <Search size={12} className="text-teal" />
                <span className="flex-1 text-left text-navy/70">Ou digite um endereço</span>
                <ChevronDown size={12} className={`text-teal transition-transform ${dropdownAberto ? "rotate-180" : ""}`} />
              </button>
              {dropdownAberto && (
                <div className="absolute inset-x-0 top-full mt-1.5 z-30 rounded-xl bg-white border border-sky/70 overflow-hidden" style={{ boxShadow: "0 20px 44px -12px rgba(47,65,86,0.22)" }}>
                  <div className="p-2 border-b border-sky/60">
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Rua, número, bairro, cidade..."
                      className="w-full h-9 px-3 rounded-lg bg-beige border border-sky/60 text-navy text-[12px] outline-none focus:border-teal"
                    />
                    <p className="text-[9.5px] text-teal mt-1.5 leading-tight">
                      Busca em todo o Brasil · resultados do RJ aparecem primeiro
                    </p>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto">
                    {buscandoEnd && <p className="p-3 text-[11.5px] text-teal text-center">Buscando...</p>}
                    {!buscandoEnd && query.length < 3 && <p className="p-3 text-[11.5px] text-teal text-center">Digite pelo menos 3 caracteres</p>}
                    {!buscandoEnd && query.length >= 3 && sug.length === 0 && (
                      <div className="p-3 text-center">
                        <p className="text-[11.5px] text-navy font-semibold">Nenhum endereço encontrado</p>
                        <p className="text-[10.5px] text-teal mt-1">
                          Tenta um formato como &quot;Rua X, 100, Icaraí&quot; ou &quot;Cambuci, São Paulo&quot;.
                        </p>
                      </div>
                    )}
                    {sug.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onDefinirOrigem({ lat: s.lat, lon: s.lon, label: s.label })
                          setDropdownAberto(false); setQuery("")
                        }}
                        className="w-full text-left p-2.5 hover:bg-beige/60 border-b border-sky/40 last:border-b-0"
                      >
                        <div className="text-[12px] font-bold text-navy line-clamp-1">{s.label}</div>
                        <div className="text-[10px] text-teal line-clamp-1 mt-0.5">{s.displayName}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Chip de origem definida */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-teal/40 mb-3">
              <div className="w-7 h-7 rounded-full grid place-items-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #567C8D, #2F4156)" }}>
                <div className="w-2 h-2 rounded-full bg-beige" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-teal">Origem</p>
                <p className="text-[11.5px] font-semibold text-navy truncate">{origem.label}</p>
              </div>
              <button onClick={onLimparOrigem} className="text-teal hover:text-navy" title="Limpar">
                <X size={12} />
              </button>
            </div>

            {/* Rota + custo - MÚLTIPLAS OPÇÕES */}
            {rotas && rotas.length > 0 && rotaSelecionada && (
              <div className="space-y-3">
                {/* Seletor de Rotas */}
                {rotas.length > 1 && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-teal">Escolha a rota</p>
                    {rotas.map((rota, idx) => {
                      const selecionada = rota === rotaSelecionada
                      const cor = rota.tipo === "economica" ? "#10B981" : rota.tipo === "rapida" ? "#567C8D" : "#F59E0B"
                      return (
                        <button
                          key={idx}
                          onClick={() => onSelecionarRota(rota)}
                          className="w-full p-2.5 rounded-xl border transition-all text-left"
                          style={{
                            background: selecionada ? `${cor}15` : "white",
                            borderColor: selecionada ? cor : "rgba(200,217,230,0.6)",
                            borderWidth: selecionada ? "2px" : "1px",
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: cor }} />
                              <span className="text-[11px] font-bold text-navy">
                                {rota.tipo === "economica" && "Mais econômica"}
                                {rota.tipo === "rapida" && "Mais rápida"}
                                {rota.tipo === "alternativa" && "Alternativa"}
                                {rota.recomendada && " ✨"}
                              </span>
                            </div>
                            <span className="text-[13px] font-bold text-navy">{fmtReais(rota.custo.total)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-teal">
                            <span>{fmtKm(rota.distanciaKm * 2)}</span>
                            <span>·</span>
                            <span>{fmtMin(rota.duracaoMin * 2)}</span>
                            {rota.economia > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-green-700 font-semibold">Economiza {fmtReais(rota.economia)}</span>
                              </>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Distância / tempo */}
                <div className="grid grid-cols-2 gap-2">
                  <BadgeRota label="Distância" valor={fmtKm(rotaSelecionada.distanciaKm * 2)} sub="ida+volta" />
                  <BadgeRota label="Tempo" valor={fmtMin(rotaSelecionada.duracaoMin * 2)} sub="ida+volta" />
                </div>

                {/* 3 opções de transporte */}
                <div className="space-y-1.5">
                  <TransporteRow 
                    icon={Car} 
                    label="Uber" 
                    valor={rotaSelecionada.custo.uber} 
                    destaque={rotaSelecionada.custo.uber <= Math.min(rotaSelecionada.custo.taxi, rotaSelecionada.custo.gasolina)} 
                  />
                  <TransporteRow 
                    icon={Bike} 
                    label="Táxi" 
                    valor={rotaSelecionada.custo.taxi} 
                    destaque={rotaSelecionada.custo.taxi <= Math.min(rotaSelecionada.custo.uber, rotaSelecionada.custo.gasolina)} 
                  />
                  <TransporteRow 
                    icon={Fuel} 
                    label="Gasolina" 
                    valor={rotaSelecionada.custo.gasolina} 
                    destaque={rotaSelecionada.custo.gasolina <= Math.min(rotaSelecionada.custo.uber, rotaSelecionada.custo.taxi)} 
                  />
                </div>

                {/* Pedágio se houver */}
                {rotaSelecionada.custo.pedagio > 0 && (
                  <div className="p-2.5 rounded-xl border border-amber-300/60" style={{ background: "rgba(245,158,11,0.10)" }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight className="w-3 h-3 text-amber-700" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pedágio</span>
                      </div>
                      <span className="text-[12px] font-bold text-amber-900">{fmtReais(rotaSelecionada.custo.pedagio)}</span>
                    </div>
                    <p className="text-[9.5px] text-amber-700 mt-1">Estimativa ida+volta (incluso no total)</p>
                  </div>
                )}

                {/* Parecer - calculado do custo da rota selecionada */}
                {rotaSelecionada.recomendada && (
                  <div className="p-3 rounded-xl text-[11.5px] leading-relaxed" style={{
                    background: "rgba(16,185,129,0.10)",
                    color: "#2F4156",
                  }}>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Sparkles size={11} />
                      Melhor custo-benefício
                    </div>
                    Esta rota oferece o melhor equilíbrio entre custo e tempo de viagem.
                  </div>
                )}

                {/* Salvar */}
                <button
                  onClick={onSalvar}
                  disabled={salvo}
                  className="w-full h-11 rounded-xl text-beige text-[12.5px] font-bold flex items-center justify-center gap-2 transition-colors"
                  style={{ background: salvo ? "#10B981" : "linear-gradient(135deg, #2F4156, #567C8D)", boxShadow: "0 8px 20px -6px rgba(47,65,86,0.45)" }}
                >
                  {salvo ? <><Check className="w-3.5 h-3.5" /> Salvo no financeiro</> : <><Save className="w-3.5 h-3.5" strokeWidth={2.2} /> Salvar trajeto</>}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Ficha({ icon: Icon, v, l }: { icon: typeof Bed; v: string | number; l: string }) {
  return (
    <div className="p-2 rounded-xl bg-white border border-sky/60 text-center">
      <Icon className="w-3 h-3 text-teal mx-auto" strokeWidth={2} />
      <div className="text-[13px] font-bold text-navy mt-1 leading-none tabular-nums" style={{ fontFamily: "Manrope, Inter, sans-serif" }}>{v}</div>
      <div className="text-[8.5px] text-teal mt-1 uppercase tracking-wider font-bold">{l}</div>
    </div>
  )
}

function BadgeRota({ label, valor, sub }: { label: string; valor: string; sub: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-white border border-sky/60">
      <p className="text-[9px] font-bold uppercase tracking-wider text-teal">{label}</p>
      <p className="text-[13.5px] font-bold text-navy leading-none mt-1 tabular-nums" style={{ fontFamily: "Manrope, Inter, sans-serif" }}>{valor}</p>
      <p className="text-[9.5px] text-teal mt-1">{sub}</p>
    </div>
  )
}

function TransporteRow({ icon: Icon, label, valor, destaque }: { icon: typeof Car; label: string; valor: number; destaque: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{
      background: destaque ? "linear-gradient(135deg, rgba(86,124,141,0.14), rgba(200,217,230,0.35))" : "#FFFFFF",
      border: `1px solid ${destaque ? "#567C8D" : "rgba(200,217,230,0.7)"}`,
    }}>
      <Icon className="w-3.5 h-3.5 text-teal flex-shrink-0" strokeWidth={2} />
      <span className="text-[11.5px] font-semibold text-navy flex-1">{label}</span>
      {destaque && <span className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-navy">Barato</span>}
      <span className="text-[13px] font-bold text-navy tabular-nums" style={{ fontFamily: "Manrope, Inter, sans-serif" }}>{fmtReais(valor)}</span>
    </div>
  )
}
