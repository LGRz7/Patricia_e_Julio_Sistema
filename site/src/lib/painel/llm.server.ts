/**
 * llm.server.ts — LLM texto + imagem, multi-provedor.
 *
 * Ordem de resolução (primeiro que tem env var vence):
 *   1. OpenRouter            (acessa múltiplos modelos · precisa API key)
 *   2. Hugging Face          (grátis · 1 token só · Flux + Llama)
 *   3. Cloudflare Workers AI (grátis · precisa Account ID + Token)
 *   4. Pollinations          (gpt-image-2 · precisa pollen)
 *   5. OpenAI direta         (texto só · precisa saldo)
 */
import "server-only"

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ""
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || ""
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || ""
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || ""
const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY || ""
const OPENAI_KEY = process.env.OPENAI_API_KEY || ""

type Provider = "openrouter" | "huggingface" | "cloudflare" | "pollinations" | "openai"

const textProvider: Provider | null =
  OPENROUTER_KEY ? "openrouter"
    : HF_TOKEN ? "huggingface"
      : CF_ACCOUNT_ID && CF_TOKEN ? "cloudflare"
        : POLLINATIONS_KEY ? "pollinations"
          : OPENAI_KEY ? "openai"
            : null

const imageProvider: Provider | null =
  HF_TOKEN ? "huggingface"
    : CF_ACCOUNT_ID && CF_TOKEN ? "cloudflare"
      : POLLINATIONS_KEY ? "pollinations"
        : null

// Modelos padrão por provedor
const OPENROUTER_TEXT_MODEL = "meta-llama/llama-3.3-70b-instruct" // Modelo grátis no OpenRouter
const HF_TEXT_MODEL = "meta-llama/Llama-3.3-70B-Instruct"
const HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell"
const CF_TEXT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
const CF_IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell"
const POLL_TEXT_MODEL = "openai"
const POLL_IMAGE_MODEL = "gpt-image-2"
const OPENAI_TEXT_MODEL = "gpt-4o-mini"

export function llmConfigured(): boolean { return !!textProvider }
export function imageProviderConfigured(): boolean { return !!imageProvider }
export function llmProvider(): string | null { return textProvider }
export function imageProviderName(): string | null { return imageProvider }

// ============================================================
// Erro tipado
// ============================================================
export class LlmError extends Error {
  status: number
  provider: string
  raw: string
  constructor(status: number, provider: string, raw: string, msg: string) {
    super(msg)
    this.name = "LlmError"
    this.status = status
    this.provider = provider
    this.raw = raw
  }
}

function extractApiError(raw: string): string {
  try {
    const j = JSON.parse(raw)
    return j?.error?.message
      || j?.error
      || j?.errors?.[0]?.message
      || j?.message
      || raw.slice(0, 300)
  } catch { return raw.slice(0, 300) }
}

// ============================================================
// Texto
// ============================================================
export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ChatOpts {
  model?: string
  temperature?: number
  maxTokens?: number
  json?: boolean
}

export interface ChatResult {
  content: string
  model: string
  provider: string
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}

/**
 * Timeout padrão pra qualquer chamada HTTP de LLM — 25s dá folga pro modelo
 * responder mas evita que o request fique pendurado indefinidamente (o que
 * trava a lambda e resulta em Load failed / string did not match no cliente).
 */
const LLM_TIMEOUT_MS = 25000

/** Fetch com AbortController + timeout. Rejeita como LlmError timeout. */
async function fetchComTimeout(
  url: string,
  init: RequestInit,
  provider: string,
  timeoutMs = LLM_TIMEOUT_MS,
): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new LlmError(408, provider, "", `${provider} timeout ${timeoutMs}ms`)
    }
    throw new LlmError(0, provider, "", `${provider} rede: ${(err as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Ordem de fallback pra chat.
 * Se o primeiro provedor falhar (timeout / 402 / 5xx), tenta o próximo.
 * Ordem final = textProvider primeiro, depois os outros que têm env var configurada.
 */
function ordemFallbackChat(): Provider[] {
  const disponiveis: Provider[] = []
  if (OPENROUTER_KEY) disponiveis.push("openrouter")
  if (HF_TOKEN) disponiveis.push("huggingface")
  if (CF_ACCOUNT_ID && CF_TOKEN) disponiveis.push("cloudflare")
  if (POLLINATIONS_KEY) disponiveis.push("pollinations")
  if (OPENAI_KEY) disponiveis.push("openai")
  if (!textProvider) return disponiveis
  // Coloca o textProvider na frente e não duplica
  return [textProvider, ...disponiveis.filter((p) => p !== textProvider)]
}

async function chamarProvider(prov: Provider, messages: ChatMessage[], opts: ChatOpts): Promise<ChatResult | null> {
  if (prov === "openrouter") return chatOpenRouter(messages, opts)
  if (prov === "huggingface") return chatHuggingFace(messages, opts)
  if (prov === "cloudflare") return chatCloudflare(messages, opts)
  return chatOpenAICompat(prov, messages, opts)
}

/** Quantas vezes re-tentar o MESMO provider quando ele retorna vazio ou erro transitório. */
const RETRIES_POR_PROVIDER = 2

export async function chat(messages: ChatMessage[], opts: ChatOpts = {}): Promise<ChatResult | null> {
  const ordem = ordemFallbackChat()
  if (ordem.length === 0) return null

  let ultimoErro: LlmError | null = null

  for (let i = 0; i < ordem.length; i++) {
    const prov = ordem[i]

    // Retry no mesmo provider — o Cloudflare Workers AI (grátis) é instável e
    // retorna resposta vazia ou 5xx de forma intermitente. Retentar resolve a
    // maioria dos casos sem precisar cair pro fallback (que pode estar sem saldo).
    for (let tentativa = 1; tentativa <= RETRIES_POR_PROVIDER; tentativa++) {
      try {
        const r = await chamarProvider(prov, messages, opts)
        if (r) return r
        console.warn(`[llm] ${prov} vazio (tentativa ${tentativa}/${RETRIES_POR_PROVIDER})`)
      } catch (err) {
        ultimoErro = err instanceof LlmError ? err : new LlmError(500, prov, "", (err as Error).message)
        console.warn(`[llm] ${prov} erro ${ultimoErro.status} (tentativa ${tentativa}/${RETRIES_POR_PROVIDER}): ${ultimoErro.message}`)

        // Erros permanentes — não adianta retentar nem esse provider nem com os mesmos dados:
        //   400 = payload inválido (bug nosso) → aborta tudo
        //   401/403 = credencial ruim → pula pro próximo provider já
        //   402 = sem saldo → pula pro próximo provider já
        if (ultimoErro.status === 400) throw ultimoErro
        if (ultimoErro.status === 401 || ultimoErro.status === 403 || ultimoErro.status === 402) break
      }
      // Backoff curto entre tentativas do mesmo provider
      if (tentativa < RETRIES_POR_PROVIDER) {
        await new Promise((r) => setTimeout(r, 600))
      }
    }
    // Esgotou as tentativas desse provider — passa pro próximo
    if (i < ordem.length - 1) {
      console.warn(`[llm] ${prov} esgotou tentativas — caindo pro fallback ${ordem[i + 1]}`)
    }
  }

  // Todos falharam — propaga o último erro pro caller tratar
  if (ultimoErro) throw ultimoErro
  return null
}

/**
 * OpenRouter — acessa múltiplos modelos via API OpenAI-compatível.
 * Endpoint: https://openrouter.ai/api/v1/chat/completions
 */
async function chatOpenRouter(messages: ChatMessage[], opts: ChatOpts): Promise<ChatResult | null> {
  const model = opts.model || OPENROUTER_TEXT_MODEL
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 4000,
  }
  if (opts.json) body.response_format = { type: "json_object" }

  const r = await fetchComTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://mazyos.com",
      "X-Title": "MazyOS Estúdio",
    },
    body: JSON.stringify(body),
  }, "openrouter")
  if (!r.ok) {
    const raw = await r.text().catch(() => "")
    throw new LlmError(r.status, "openrouter", raw, extractApiError(raw))
  }
  const j = await r.json()
  const content: string = j?.choices?.[0]?.message?.content || ""
  if (!content.trim()) return null
  return { content, model, provider: "openrouter", usage: j?.usage }
}

/**
 * HuggingFace Inference API — modelo Llama-3.3-70B-Instruct via router OpenAI-compatível.
 * Endpoint: https://router.huggingface.co/v1/chat/completions
 * Formato: 100% compatível com OpenAI SDK.
 */
async function chatHuggingFace(messages: ChatMessage[], opts: ChatOpts): Promise<ChatResult | null> {
  const model = opts.model || HF_TEXT_MODEL
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 4000,
  }
  if (opts.json) body.response_format = { type: "json_object" }

  const r = await fetchComTimeout("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }, "huggingface")
  if (!r.ok) {
    const raw = await r.text().catch(() => "")
    throw new LlmError(r.status, "huggingface", raw, extractApiError(raw))
  }
  const j = await r.json()
  const content: string = j?.choices?.[0]?.message?.content || ""
  if (!content.trim()) return null
  return { content, model, provider: "huggingface", usage: j?.usage }
}

async function chatCloudflare(messages: ChatMessage[], opts: ChatOpts): Promise<ChatResult | null> {
  const model = opts.model || CF_TEXT_MODEL
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`
  const body: Record<string, unknown> = {
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 4000,
  }
  if (opts.json) body.response_format = { type: "json_object" }

  const r = await fetchComTimeout(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }, "cloudflare")
  if (!r.ok) {
    const raw = await r.text().catch(() => "")
    throw new LlmError(r.status, "cloudflare", raw, extractApiError(raw))
  }
  const j = await r.json()
  if (!j?.success) {
    throw new LlmError(500, "cloudflare", JSON.stringify(j), extractApiError(JSON.stringify(j)))
  }
  // Com response_format json_object, o CF devolve result.response já como OBJETO
  // (não string). Sem json mode, vem string. Normaliza os dois pra string.
  const respostaRaw = j?.result?.response
  const content: string = typeof respostaRaw === "string"
    ? respostaRaw
    : respostaRaw != null
      ? JSON.stringify(respostaRaw)
      : ""
  if (!content.trim()) return null
  return { content, model, provider: "cloudflare", usage: j?.result?.usage }
}

async function chatOpenAICompat(prov: Provider, messages: ChatMessage[], opts: ChatOpts): Promise<ChatResult | null> {
  const key = prov === "pollinations" ? POLLINATIONS_KEY : OPENAI_KEY
  const baseUrl = prov === "pollinations" ? "https://gen.pollinations.ai/v1" : "https://api.openai.com/v1"
  const model = opts.model || (prov === "pollinations" ? POLL_TEXT_MODEL : OPENAI_TEXT_MODEL)

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 4000,
  }
  if (opts.json) body.response_format = { type: "json_object" }

  const r = await fetchComTimeout(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }, prov)
  if (!r.ok) {
    const raw = await r.text().catch(() => "")
    throw new LlmError(r.status, prov, raw, extractApiError(raw))
  }
  const j = await r.json()
  const content: string = j?.choices?.[0]?.message?.content || ""
  if (!content.trim()) return null
  return { content, model, provider: prov, usage: j?.usage }
}

// ============================================================
// Imagem
// ============================================================
export interface ImageOpts {
  model?: string
  width?: number
  height?: number
  seed?: number
}

export interface ImageResult {
  bytes: Buffer
  contentType: string
  model: string
  provider: string
  promptUsed: string
}

export async function generateImage(prompt: string, opts: ImageOpts = {}): Promise<ImageResult | null> {
  if (!imageProvider) return null

  if (imageProvider === "huggingface") return generateImageHuggingFace(prompt, opts)
  if (imageProvider === "cloudflare") return generateImageCloudflare(prompt, opts)
  if (imageProvider === "pollinations") return generateImagePollinations(prompt, opts)
  return null
}

/**
 * HuggingFace text-to-image via SDK oficial `@huggingface/inference`.
 * O SDK resolve o provedor certo (fal-ai, together, nebius) pra cada modelo
 * — evita eu chutar URLs.
 */
async function generateImageHuggingFace(prompt: string, opts: ImageOpts): Promise<ImageResult | null> {
  const model = opts.model || HF_IMAGE_MODEL

  // Import dinâmico — o SDK usa fetch internamente e resolve provedor por modelo
  const { InferenceClient } = await import("@huggingface/inference")
  const client = new InferenceClient(HF_TOKEN)

  const parameters: Record<string, unknown> = {
    num_inference_steps: 4,
  }
  if (opts.width) parameters.width = opts.width
  if (opts.height) parameters.height = opts.height
  if (opts.seed !== undefined) parameters.seed = opts.seed

  try {
    // textToImage retorna Blob
    const blob = await client.textToImage({
      model,
      inputs: prompt,
      parameters,
    })
    const arrayBuffer = await blob.arrayBuffer()
    return {
      bytes: Buffer.from(arrayBuffer),
      contentType: blob.type || "image/jpeg",
      model,
      provider: "huggingface",
      promptUsed: prompt,
    }
  } catch (err) {
    // O SDK lança HubApiError com .status e .message
    const anyErr = err as { status?: number; message?: string; toString(): string }
    const status = anyErr.status || 500
    const msg = anyErr.message || anyErr.toString()
    throw new LlmError(status, "huggingface-image", msg, msg)
  }
}

async function generateImageCloudflare(prompt: string, opts: ImageOpts): Promise<ImageResult | null> {
  const model = opts.model || CF_IMAGE_MODEL
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`

  const body: Record<string, unknown> = { prompt, steps: 4 }
  if (opts.width) body.width = opts.width
  if (opts.height) body.height = opts.height
  if (opts.seed !== undefined) body.seed = opts.seed

  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const raw = await r.text().catch(() => "")
    throw new LlmError(r.status, "cloudflare-image", raw, extractApiError(raw))
  }
  const j = await r.json()
  if (!j?.success) {
    throw new LlmError(500, "cloudflare-image", JSON.stringify(j), extractApiError(JSON.stringify(j)))
  }
  const b64: string = j?.result?.image || ""
  if (!b64) return null
  return {
    bytes: Buffer.from(b64, "base64"),
    contentType: "image/jpeg",
    model,
    provider: "cloudflare",
    promptUsed: prompt,
  }
}

async function generateImagePollinations(prompt: string, opts: ImageOpts): Promise<ImageResult | null> {
  const model = opts.model || POLL_IMAGE_MODEL
  const width = opts.width || 1080
  const height = opts.height || 1350

  const params = new URLSearchParams({
    model,
    width: String(width),
    height: String(height),
    nologo: "true",
    enhance: "false",
  })
  if (opts.seed !== undefined) params.set("seed", String(opts.seed))

  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${params.toString()}`

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${POLLINATIONS_KEY}` },
  })
  if (!r.ok) {
    const raw = await r.text().catch(() => "")
    throw new LlmError(r.status, "pollinations-image", raw, extractApiError(raw))
  }
  const contentType = r.headers.get("content-type") || "image/png"
  const arrayBuffer = await r.arrayBuffer()
  return {
    bytes: Buffer.from(arrayBuffer),
    contentType,
    model,
    provider: "pollinations",
    promptUsed: prompt,
  }
}
