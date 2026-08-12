/**
 * marketing-contexto.server.ts — carrega a MEMÓRIA VIVA do MazyOS em runtime.
 *
 * Lê os mesmos `.md` que a skill `/carrossel` do Claude Code lê antes de
 * compor: empresa, público-alvo, preferências (tom de voz), estratégia e
 * design-guide. Concatena tudo num único bloco pra injetar no system prompt.
 *
 * O gerador não hardcoda contexto — ele lê o arquivo NA HORA. Se o Yann
 * editar `_memoria/empresa.md`, o próximo carrossel já reflete a mudança.
 */
import "server-only"
import { promises as fs } from "fs"
import path from "path"

// Do `MazyOS/site/`, sobe um nível pra `MazyOS/`
const RAIZ_MAZYOS = path.join(process.cwd(), "..")

const FONTES = [
  { titulo: "EMPRESA", caminho: "_memoria/empresa.md" },
  { titulo: "PÚBLICO-ALVO (5 PERSONAS DETALHADAS)", caminho: "_memoria/publico-alvo.md" },
  { titulo: "TOM DE VOZ E PREFERÊNCIAS", caminho: "_memoria/preferencias.md" },
  { titulo: "ESTRATÉGIA ATUAL", caminho: "_memoria/estrategia.md" },
  { titulo: "IDENTIDADE VISUAL (design-guide oficial)", caminho: "identidade/design-guide.md" },
] as const

export interface ContextoMazyOS {
  /** Bloco pronto pra colar num system prompt. */
  texto: string
  /** Arquivos que foram lidos com sucesso. */
  fontesCarregadas: string[]
  /** Arquivos que faltaram/deram erro. */
  fontesFaltantes: string[]
}

/**
 * Lê todos os arquivos de memória do MazyOS e devolve um bloco de texto.
 * Nunca estoura — se um arquivo falta, ignora e continua com o resto.
 */
export async function carregarContextoMazyOS(): Promise<ContextoMazyOS> {
  const partes: string[] = []
  const carregadas: string[] = []
  const faltantes: string[] = []

  for (const fonte of FONTES) {
    try {
      const conteudo = await fs.readFile(path.join(RAIZ_MAZYOS, fonte.caminho), "utf-8")
      partes.push(`## ${fonte.titulo}\n\n${conteudo.trim()}`)
      carregadas.push(fonte.caminho)
    } catch {
      faltantes.push(fonte.caminho)
    }
  }

  return {
    texto: partes.join("\n\n---\n\n"),
    fontesCarregadas: carregadas,
    fontesFaltantes: faltantes,
  }
}
