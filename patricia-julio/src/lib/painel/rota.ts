/**
 * rota.ts — cálculos de rota, geocoding e custos.
 *
 * Serviços públicos usados (grátis, sem key):
 *   - Nominatim (OpenStreetMap) pra geocoding
 *   - OSRM (router.project-osrm.org) pra rota entre 2 pontos
 *
 * Nota: os dois têm rate-limit e usage policy. Pra produção séria,
 * migrar pra Mapbox / OpenRouteService com key. Por enquanto atende.
 */
import type { Prefs } from "./storage"

export interface LatLon { lat: number; lon: number }

export interface EnderecoBusca {
  label: string
  lat: number
  lon: number
  displayName: string
}

export interface Rota {
  distanciaKm: number    // ida
  duracaoMin: number     // ida
  geometry: [number, number][]  // [lat, lon] pra plotar polyline no Leaflet
  tipo?: "rapida" | "economica" | "alternativa"  // NOVO
  pedagios?: number  // NOVO - estimativa de pedágios
  evitaPedagios?: boolean  // NOVO
}

export interface RotaComCusto extends Rota {
  custo: {
    uber: number
    taxi: number
    gasolina: number
    pedagio: number
    total: number
  }
  economia: number  // quanto economiza vs rota mais cara
  recomendada: boolean  // melhor custo-benefício
}

export interface Custo {
  uber: number
  taxi: number
  gasolina: number
  uberIdaVolta: number
  taxiIdaVolta: number
  gasolinaIdaVolta: number
  economiaMaxima: number
  comissaoEstimada: number | null
  vale: "sim" | "duvidoso" | "nao"
  /** Comentário curto sobre a decisão */
  parecer: string
}

// ============================================================
// Geocoding via Nominatim
// ============================================================
export async function geocode(query: string): Promise<EnderecoBusca[]> {
  if (!query.trim()) return []

  // Roda 3 provedores em paralelo e combina os resultados:
  //   1. Photon com viewbox RJ (bom pra autocomplete estilo Google)
  //   2. Nominatim com viewbox RJ (backup pro Photon quando não pega)
  //   3. Nominatim Brasil todo (fallback amplo)
  // Se algum falhar, os outros ainda respondem — dedup por coordenada.
  const [photonRJ, nominatimRJ, nominatimBR] = await Promise.all([
    buscarPhoton(query, {
      lat: -22.9,
      lon: -43.2,
      bboxSize: 3.0, // pesa mais o RJ mas aceita todo Brasil
      limit: 8,
    }).catch(() => []),
    buscarNominatim(query, {
      viewbox: "-44.4,-22.4,-42.4,-23.3", // estado do Rio
      bounded: false,
      limit: 6,
    }).catch(() => []),
    buscarNominatim(query, {
      countrycodes: "br",
      limit: 8,
    }).catch(() => []),
  ])

  const vistos = new Set<string>()
  const combinado: EnderecoBusca[] = []
  for (const item of [...photonRJ, ...nominatimRJ, ...nominatimBR]) {
    const chave = `${item.lat.toFixed(4)}_${item.lon.toFixed(4)}`
    if (vistos.has(chave)) continue
    vistos.add(chave)
    combinado.push(item)
  }
  return combinado.slice(0, 18)
}

// ============================================================
// Photon — autocomplete-first (feito pra typeahead)
// https://photon.komoot.io
// ============================================================
async function buscarPhoton(
  query: string,
  opts: { lat: number; lon: number; bboxSize?: number; limit?: number },
): Promise<EnderecoBusca[]> {
  const url = new URL("https://photon.komoot.io/api/")
  url.searchParams.set("q", query)
  url.searchParams.set("lang", "pt")
  url.searchParams.set("lat", String(opts.lat))
  url.searchParams.set("lon", String(opts.lon))
  url.searchParams.set("limit", String(opts.limit ?? 10))

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`Photon ${res.status}`)
  const j = (await res.json()) as {
    features?: Array<{
      geometry: { coordinates: [number, number] }
      properties: {
        name?: string
        street?: string
        housenumber?: string
        district?: string
        city?: string
        state?: string
        country?: string
        countrycode?: string
        type?: string
        osm_key?: string
        osm_value?: string
      }
    }>
  }

  // Só resultados do Brasil (Photon busca mundial)
  const filtrados = (j.features || []).filter(
    (f) => f.properties.countrycode === "BR" || f.properties.country === "Brasil",
  )

  return filtrados.map((f) => {
    const [lon, lat] = f.geometry.coordinates
    const p = f.properties
    const partes: string[] = []
    if (p.street) {
      partes.push(p.housenumber ? `${p.street}, ${p.housenumber}` : p.street)
    } else if (p.name) {
      partes.push(p.name)
    }
    if (p.district) partes.push(p.district)
    if (p.city) partes.push(p.city)
    const label = partes.length ? partes.join(" · ") : p.name || query
    const displayName = [p.name, p.street, p.housenumber, p.district, p.city, p.state, p.country]
      .filter(Boolean)
      .join(", ")
    return { label, displayName, lat, lon }
  })
}

async function buscarNominatim(
  query: string,
  opts: {
    countrycodes?: string
    viewbox?: string
    bounded?: boolean
    limit?: number
  },
): Promise<EnderecoBusca[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", query)
  url.searchParams.set("format", "json")
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("limit", String(opts.limit ?? 10))
  url.searchParams.set("accept-language", "pt-BR")
  if (opts.countrycodes) url.searchParams.set("countrycodes", opts.countrycodes)
  if (opts.viewbox) url.searchParams.set("viewbox", opts.viewbox)
  if (opts.bounded !== undefined) url.searchParams.set("bounded", opts.bounded ? "1" : "0")

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  const data = (await res.json()) as Array<{
    display_name: string
    lat: string
    lon: string
    name?: string
    type?: string
    address?: { road?: string; suburb?: string; neighbourhood?: string; city?: string; town?: string; state?: string; house_number?: string }
  }>

  return data.map((r) => ({
    label: montarLabel(r),
    displayName: r.display_name,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
  }))
}

function montarLabel(r: {
  name?: string
  display_name: string
  address?: { road?: string; suburb?: string; neighbourhood?: string; city?: string; town?: string; house_number?: string }
}): string {
  const a = r.address || {}
  // Prioriza: Rua Y, N · Bairro, Cidade
  const partes: string[] = []
  if (a.road) {
    partes.push(a.house_number ? `${a.road}, ${a.house_number}` : a.road)
  } else if (r.name) {
    partes.push(r.name)
  }
  const bairro = a.suburb || a.neighbourhood
  if (bairro) partes.push(bairro)
  const cidade = a.city || a.town
  if (cidade) partes.push(cidade)
  if (partes.length === 0) return r.display_name.split(",").slice(0, 3).join(", ")
  return partes.join(" · ")
}

/**
 * Geocoding reverso — coordenada → endereço legível.
 * Útil pra label da localização atual do usuário.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse")
  url.searchParams.set("lat", String(lat))
  url.searchParams.set("lon", String(lon))
  url.searchParams.set("format", "json")
  url.searchParams.set("accept-language", "pt-BR")
  const res = await fetch(url.toString())
  if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  const j = await res.json()
  return (j.display_name as string) || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
}

// ============================================================
// Rota via OSRM público - VERSÃO MELHORADA COM MÚLTIPLAS OPÇÕES
// ============================================================

/**
 * Calcula MÚLTIPLAS rotas com custos reais:
 * 1. Mais rápida (pode ter pedágio)
 * 2. Mais econômica (evita pedágio quando possível)
 * 3. Alternativa (rota diferente)
 */
export async function calcularRotasComCustos(
  origem: LatLon,
  destino: LatLon,
  prefs: Prefs
): Promise<RotaComCusto[]> {
  try {
    console.log("🔄 Calculando rotas entre:", origem, "→", destino)
    
    // Busca 3 rotas diferentes em paralelo
    const [rotaRapida, rotaEconomica, rotaAlternativa] = await Promise.all([
      calcularRotaOSRM(origem, destino, "fastest"),      // mais rápida
      calcularRotaOSRM(origem, destino, "short"),        // mais curta (geralmente mais econômica)
      calcularRotaOSRM(origem, destino, "alternative"),  // alternativa
    ])

    console.log("📍 Rotas brutas:", { rotaRapida, rotaEconomica, rotaAlternativa })

    const rotas: Rota[] = []
    if (rotaRapida) rotas.push({ ...rotaRapida, tipo: "rapida" })
    if (rotaEconomica && rotaEconomica.distanciaKm !== rotaRapida?.distanciaKm) {
      rotas.push({ ...rotaEconomica, tipo: "economica", evitaPedagios: true })
    }
    if (rotaAlternativa && !rotas.some(r => Math.abs(r.distanciaKm - rotaAlternativa.distanciaKm) < 0.5)) {
      rotas.push({ ...rotaAlternativa, tipo: "alternativa" })
    }

    // Se nenhuma rota foi encontrada, cria uma linha reta como fallback
    if (rotas.length === 0) {
      console.warn("⚠️ Nenhuma rota via OSRM, usando linha reta")
      const distancia = calcularDistanciaHaversine(origem, destino)
      rotas.push({
        distanciaKm: distancia,
        duracaoMin: (distancia / 40) * 60, // assume 40km/h
        geometry: [[origem.lat, origem.lon], [destino.lat, destino.lon]],
        tipo: "rapida"
      })
    }

    console.log("✅ Rotas finais:", rotas.length, rotas)

    // Calcula custos pra cada rota
    const rotasComCusto: RotaComCusto[] = rotas.map(rota => {
      const kmIV = rota.distanciaKm * 2
      
      // Estima pedágios baseado na distância e tipo de rota
      const pedagioEstimado = estimarPedagios(rota)
      
      const uber = (prefs.uberBase * 2 + prefs.uberKm * kmIV) + pedagioEstimado
      const taxi = (prefs.taxiBase * 2 + prefs.taxiKm * kmIV) + pedagioEstimado
      const gasolina = ((kmIV / Math.max(prefs.autonomia, 1)) * prefs.precoGasolina) + pedagioEstimado

      return {
        ...rota,
        custo: {
          uber,
          taxi,
          gasolina,
          pedagio: pedagioEstimado,
          total: Math.min(uber, taxi, gasolina),
        },
        economia: 0,  // será calculado depois
        recomendada: false,  // será definido depois
      }
    })

    // Encontra mais cara e marca a mais barata como recomendada
    const custosTotal = rotasComCusto.map(r => r.custo.total)
    const maxCusto = Math.max(...custosTotal)
    const minCusto = Math.min(...custosTotal)
    const idxMaisBarata = custosTotal.indexOf(minCusto)

    rotasComCusto.forEach((r, i) => {
      r.economia = maxCusto - r.custo.total
      r.recomendada = i === idxMaisBarata
    })

    return rotasComCusto.sort((a, b) => a.custo.total - b.custo.total)
  } catch (error) {
    console.error("❌ Erro em calcularRotasComCustos:", error)
    // Fallback: retorna apenas uma rota simples
    const rotaSimples = await calcularRota(origem, destino)
    const kmIV = rotaSimples.distanciaKm * 2
    const uber = prefs.uberBase * 2 + prefs.uberKm * kmIV
    const taxi = prefs.taxiBase * 2 + prefs.taxiKm * kmIV
    const gasolina = (kmIV / Math.max(prefs.autonomia, 1)) * prefs.precoGasolina

    return [{
      ...rotaSimples,
      tipo: "rapida",
      custo: {
        uber,
        taxi,
        gasolina,
        pedagio: 0,
        total: Math.min(uber, taxi, gasolina),
      },
      economia: 0,
      recomendada: true,
    }]
  }
}

// Função helper: calcular distância em linha reta (Haversine)
function calcularDistanciaHaversine(p1: LatLon, p2: LatLon): number {
  const R = 6371 // raio da Terra em km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180
  const dLon = ((p2.lon - p1.lon) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Estima pedágios baseado na distância e tipo de rota
 * Região RJ/Niterói: Ponte Rio-Niterói = R$ 8,50 (2024)
 */
function estimarPedagios(rota: Rota): number {
  const { distanciaKm, tipo, evitaPedagios } = rota
  
  if (evitaPedagios) return 0
  
  // Se cruza Baía de Guanabara (distância >15km entre RJ e Niterói/SG)
  // provavelmente usa Ponte Rio-Niterói
  if (distanciaKm > 15 && distanciaKm < 35 && tipo === "rapida") {
    return 8.50 * 2  // ida e volta
  }
  
  // Rotas longas podem ter pedágios em rodovias
  if (distanciaKm > 50) {
    return Math.floor(distanciaKm / 50) * 7 * 2  // ~R$ 7 a cada 50km, ida+volta
  }
  
  return 0
}

async function calcularRotaOSRM(
  origem: LatLon,
  destino: LatLon,
  tipo: "fastest" | "short" | "alternative"
): Promise<Rota | null> {
  try {
    // OSRM suporta alternatives=true pra pegar até 3 rotas diferentes
    const alternatives = tipo === "alternative" ? "true" : "false"
    const url = `https://router.project-osrm.org/route/v1/driving/${origem.lon},${origem.lat};${destino.lon},${destino.lat}?overview=full&geometries=geojson&alternatives=${alternatives}`
    
    console.log(`🌐 Buscando rota ${tipo}:`, url)
    
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`❌ OSRM ${tipo} falhou:`, res.status, res.statusText)
      return null
    }
    
    const data = await res.json()
    console.log(`📦 Resposta OSRM ${tipo}:`, data)
    
    const routes = data?.routes || []
    
    if (routes.length === 0) {
      console.warn(`⚠️ OSRM ${tipo}: sem rotas encontradas`)
      return null
    }
    
    // Pega a rota específica baseada no tipo
    let route = routes[0]
    if (tipo === "alternative" && routes.length > 1) {
      route = routes[1]  // segunda rota alternativa
    } else if (tipo === "short" && routes.length > 0) {
      // Busca a mais curta entre as disponíveis
      route = routes.reduce((prev: any, curr: any) => 
        (curr.distance < prev.distance) ? curr : prev
      )
    }

    const coords = (route.geometry?.coordinates || []) as [number, number][]
    console.log(`✅ Rota ${tipo} processada:`, {
      distance: route.distance,
      duration: route.duration,
      points: coords.length
    })
    
    return {
      distanciaKm: (route.distance || 0) / 1000,
      duracaoMin: (route.duration || 0) / 60,
      geometry: coords.map(([lon, lat]) => [lat, lon] as [number, number]),
    }
  } catch (err) {
    console.error(`❌ Erro calcularRotaOSRM ${tipo}:`, err)
    return null
  }
}

export async function calcularRota(origem: LatLon, destino: LatLon): Promise<Rota> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origem.lon},${origem.lat};${destino.lon},${destino.lat}?overview=full&geometries=geojson`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM ${res.status}`)
  const data = await res.json()
  const route = data?.routes?.[0]
  if (!route) throw new Error("Rota não encontrada")

  const coords = (route.geometry?.coordinates || []) as [number, number][]
  return {
    distanciaKm: (route.distance || 0) / 1000,
    duracaoMin: (route.duration || 0) / 60,
    // OSRM retorna [lon, lat] — Leaflet quer [lat, lon]
    geometry: coords.map(([lon, lat]) => [lat, lon] as [number, number]),
  }
}

// ============================================================
// Custos
// ============================================================
export function calcularCusto(distanciaKm: number, prefs: Prefs, valorImovel?: number | null): Custo {
  // Ida-volta = 2× distância
  const kmIV = distanciaKm * 2

  const uberIV     = prefs.uberBase * 2 + prefs.uberKm * kmIV
  const taxiIV     = prefs.taxiBase * 2 + prefs.taxiKm * kmIV
  const gasolinaIV = (kmIV / Math.max(prefs.autonomia, 1)) * prefs.precoGasolina

  const menor = Math.min(uberIV, taxiIV, gasolinaIV)
  const maior = Math.max(uberIV, taxiIV, gasolinaIV)

  const comissaoEstimada = valorImovel ? (valorImovel * prefs.comissaoPct) / 100 : null

  let vale: Custo["vale"] = "sim"
  let parecer = "Distância curta — vale a pena visitar."
  if (comissaoEstimada) {
    const ratio = menor / comissaoEstimada
    if (ratio > 0.05) { vale = "nao";       parecer = "Custo alto vs comissão potencial — reconsidere ou peça reembolso." }
    else if (ratio > 0.02) { vale = "duvidoso"; parecer = "Custo relevante — avalie chance real de fechamento." }
    else                { vale = "sim";      parecer = "Custo pequeno frente à comissão. Vale visitar." }
  } else {
    if (distanciaKm > 50) { vale = "duvidoso"; parecer = "Distância grande — confirme interesse do cliente antes." }
    if (distanciaKm > 100) { vale = "nao";     parecer = "Muito longe — considere videochamada ou reagendar." }
  }

  return {
    uber: uberIV / 2, taxi: taxiIV / 2, gasolina: gasolinaIV / 2,
    uberIdaVolta: uberIV, taxiIdaVolta: taxiIV, gasolinaIdaVolta: gasolinaIV,
    economiaMaxima: maior - menor,
    comissaoEstimada,
    vale,
    parecer,
  }
}

// ============================================================
// Utils
// ============================================================
export function slugify(str: string): string {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function fmtKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function fmtMin(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h ? `${h}h ${m}min` : `${m} min`
}

export function fmtReais(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
