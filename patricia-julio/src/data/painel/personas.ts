/**
 * personas.ts — 5 personas do público-alvo da Patrícia e Júlio.
 *
 * ⚠️  ARQUIVO GERADO AUTOMATICAMENTE — não edite à mão.
 * Fonte: MazyOS/_memoria/publico-alvo.md (bloco JSON no fim).
 * Regeneração: cd MazyOS/site && npm run sync-personas
 *
 * Sincronizado em: 2026-08-02T03:13:02.778Z
 */

export interface Persona {
  id: string
  name: string
  age: [number, number]
  incomeBrl: [number, number]
  regions: string[]
  product: string
  pain: string[]
  hook: string[]
  objection: string
  closer: string
}

export const PERSONAS: Persona[] = [
  {
    id: "primeira-compra-consciente",
    name: "Primeira compra consciente",
    age: [26, 34],
    incomeBrl: [7000, 15000],
    regions: [
      "Niterói (Fonseca, Santa Rosa)",
      "Rio (Tijuca, Grajaú)",
      "Maricá (Itaipuaçu)",
    ],
    product: "apartamento 2 quartos, financiamento com FGTS",
    pain: [
      "não entende financiamento",
      "medo de errar",
      "se perdeu em portal",
    ],
    hook: [
      "preço fixo no card",
      "prestação vs aluguel",
      "foto real por dentro",
    ],
    objection: "não tenho entrada / banco não aprova",
    closer: "simulação de financiamento na hora",
  },
  {
    id: "upgrade-familiar",
    name: "Upgrade familiar",
    age: [32, 45],
    incomeBrl: [12000, 25000],
    regions: [
      "Niterói (Icaraí, Piratininga, São Francisco)",
      "Rio (Barra, Recreio, Tijuca alta)",
    ],
    product: "3 quartos, vaga, lazer, escola perto",
    pain: [
      "corretor ruim antes",
      "sem tempo pra 15 visitas",
      "escola dos filhos",
      "foto bonita imóvel feio",
    ],
    hook: [
      "vídeo por dentro",
      "roteiro de bairro",
      "depoimento em vídeo",
    ],
    objection: "vou pensar / vou conversar com marido/esposa",
    closer: "3 opções filtradas num único fim de semana",
  },
  {
    id: "investidor-marica",
    name: "Investidor Maricá",
    age: [28, 55],
    incomeBrl: [10000, 999999],
    regions: [
      "Maricá (Itaipuaçu, Barra de Maricá, Centro)",
    ],
    product: "planta ou pronto, potencial temporada + valorização",
    pain: [
      "não confia em promessa",
      "quer dado de infra",
      "medo de bairro que não anda",
    ],
    hook: [
      "número de valorização",
      "comparativo m²",
      "case real",
    ],
    objection: "vou esperar",
    closer: "dado histórico + estimativa realista de aluguel temporada",
  },
  {
    id: "segunda-casa-praia",
    name: "Segunda casa / praia",
    age: [38, 60],
    incomeBrl: [15000, 999999],
    regions: [
      "Maricá (Ponta Negra, Barra)",
      "Niterói (Piratininga, Camboinhas)",
    ],
    product: "casa/apto próximo à praia, condomínio seguro",
    pain: [
      "manutenção à distância",
      "segurança quando ausente",
      "compara com Búzios/Cabo Frio",
    ],
    hook: [
      "pôr do sol na varanda",
      "distância até o trabalho",
      "condomínio fechado",
    ],
    objection: "prefiro Búzios/Cabo Frio",
    closer: "custo total X distância X tempo de viagem",
  },
  {
    id: "migrante-rio-niteroi",
    name: "Migrante do Rio pra Niterói",
    age: [30, 45],
    incomeBrl: [10000, 25000],
    regions: [
      "Niterói (Icaraí, Santa Rosa, Ingá, São Francisco)",
    ],
    product: "apto em bairro seguro, padaria a pé, vista",
    pain: [
      "não conhece Niterói de morar",
      "medo de errar bairro",
      "travessia diária",
    ],
    hook: [
      "guia de bairros",
      "comparativo m² Niterói vs Zona Sul",
      "tour caminhando",
    ],
    objection: "e se não me adaptar?",
    closer: "tour presencial pelo bairro antes do imóvel",
  },
]

// ============================================================
// Regras editoriais globais
// ============================================================
export const REGRAS_CRIATIVO = {
  ligeirosDeReferencia: [
      "Uma persona por criativo — nunca falar com duas ao mesmo tempo.",
      "Bairro sempre no card (Icaraí, não Niterói).",
      "Preço no primeiro slide quando for imóvel específico.",
      "Foto/vídeo por dentro do imóvel — evitar fachada solta.",
      "CRECI de ambos no rodapé.",
      "CTA claro: Chama no WhatsApp / Agende visita.",
    ],
  clichesProibidos: [
      "realize seu sonho",
      "vamos juntos",
      "imóvel dos seus sonhos",
      "alavancar",
      "sinergia",
      "caro cliente",
    ],
} as const

export function getPersona(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id)
}
