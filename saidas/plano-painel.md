# Plano do Painel — Patrícia e Júlio Corretores

> Fonte de verdade única do roadmap do painel interno (`MazyOS/site/src/app/painel/`).
> Atualizado em 29/07/2026 — Yann alinhou execução completa (Fase 0 → D).
> Toda alteração no painel referencia esse plano.

## Regra arquitetural gravada

**O painel captura e estrutura dados. O MazyOS (fora do painel) faz o raciocínio pesado.**

- Nada de chamada direta pra OpenAI / Anthropic / Gemini a partir do painel.
- **Sem Firecrawl** (scraper) e **sem Gooseworks** (gerador de criativo) na sessão atual — confirmado pelo Yann em 30/07/2026. Extração de amostras do ACM fica no regex parser local + preenchimento manual. Geração de criativo do Marketing vai por fluxo offline (Yann roda o MazyOS, sobe o resultado no painel).
- Onde precisar de inteligência (extrair dados de texto colado, gerar copy, sugerir imagem), o fluxo é:
  1. Painel captura input bruto (texto, form, imagem) e salva
  2. Corretor (ou o Yann via MazyOS) processa fora do painel usando skills do MazyOS
  3. Resultado volta pro painel via API ou colagem
- Isso mantém o painel barato, offline-tolerante e sem chave de API vazando no client.

## Estado atual (o que existe hoje)

Já implementado em `MazyOS/site/src/app/painel/`:

- **Login** (`/painel/login`) — email + senha, JWT em cookie httpOnly, "manter 7 dias"
- **Home** (`/painel`) — saudação personalizada, 4 KPIs (trajetos no mês, distância, gasto, catálogo), atalhos rápidos, últimos trajetos
- **Trajeto** (`/painel/mapa`) — cálculo origem → imóvel, custo Uber / táxi / gasolina
- **Catálogo** (`/painel/catalogo` + `/painel/catalogo/novo`) — CRUD dos imóveis
- **Financeiro** (`/painel/financeiro`) — gastos de deslocamento
- **PWA completo** — manifest, service worker, modal de install, viewportFit cover
- **Shell responsivo** — sidebar desktop + drawer mobile + bottom nav

Stack: Next.js 14 App Router + TypeScript + Tailwind + Leaflet + lucide-react + GSAP.

## Nav reorganizada (para acomodar ACM + Marketing)

**Desktop (sidebar):**
1. Início
2. Trajeto
3. Catálogo
4. **ACM** ← novo
5. **Marketing** ← novo
6. Financeiro

**Mobile (bottom nav — 5 slots + overflow):**
1. Início
2. Catálogo
3. **ACM**
4. **Marketing**
5. Mais (sheet: Trajeto, Financeiro, Perfil, Sair)

Motivo: no dia-a-dia deles ACM (precificação) e Marketing (posts) serão usados mais que Trajeto e Financeiro. Trajeto/Financeiro seguem existindo, só saem da barra principal do celular.

---

## Fase 0 · Alinhamento ✅ (concluída em 29/07/2026)

- [x] SPEC.md do site atualizado (São Gonçalo → Niterói/Maricá/Rio, público 7k+, 26+, 5 personas)
- [x] Este plano criado

## Fase A · Polimento (1 dia)

Meta: deixar o painel atual production-ready antes de adicionar features.

- [ ] Fix hydration warning (`Extra attributes from the server: style`)
  - Adicionar `suppressHydrationWarning` no `<body>` do layout raiz
  - Investigar se GSAP está setando style antes de hidratar (mover pra `useEffect`)
- [ ] Mover check de sessão pro middleware
  - Hoje o `/painel/login` chama `/api/auth/me` num `useEffect` — causa piscar
  - Passar pro `src/middleware.ts` — redirect server-side quando já autenticado
- [ ] Nova rota `/painel/perfil`
  - Preferências: custo/km, valor médio de Uber, WhatsApp de cada corretor
  - Foto + CRECI de cada um (readonly — vem do `_memoria/empresa.md`)
- [ ] Skeleton loaders nos KPIs da home (evita salto de layout no primeiro paint)

## Decisão de escopo — 30/07/2026 (Yann escolheu opção C)

Depois do texto-visão do SIAI (Sistema Inteligente de Avaliação Imobiliária) que o Yann mandou, alinhamos:

- **Agora:** motor rules-based com inteligência real (similaridade multi-dimensional, confidence score, explicabilidade em texto, simulador de cenários, faixas agressiva/recomendada/premium) — **sem** Firecrawl, LLM ou APIs externas
- **Roadmap (fase B++):** pontos de extensão deixados no código pra plugar depois: (a) scraper de comparáveis, (b) LLM pra explicação rica + conversação, (c) visão computacional de fotos, (d) ML com histórico de vendas, (e) integrações Fipe/IBGE
- Cada ponto de extensão marcado em comentário `TODO(siai):` no código pra achar rápido depois

Extension points (documentados aqui pra memória):

1. `SampleSource` — hoje `CopiarColarSource` (dumb, corretor cola). Futuro: `ScraperZapSource`, `ScraperVivarealSource`
2. `ExplanationSource` — hoje `RegrasExplanationSource` (template + números). Futuro: `LLMExplanationSource` chamando MazyOS
3. `SimilarityWeights` — hoje pesos fixos por atributo. Futuro: pesos aprendidos por ML sobre vendas passadas
4. `AjusteAutomatico` — hoje só ajuste manual (slider %). Futuro: regras automáticas por diferença detectada + LLM sobre fotos

## Aprendizado — Cloudflare do ZAP em 30/07/2026

Tentativa de scraping automático 100% (sem Firecrawl/Gooseworks) esbarrou em:

1. **HTTP direto do Node** → 403 (Cloudflare identifica TLS/JA3 fingerprint diferente de browser)
2. **Playwright chromium headless com fetch cross-origin** → CORS bloqueou (`x-domain` custom header dispara preflight)
3. **Playwright chromium com waitForResponse (deixando o próprio site fazer a chamada)** → Cloudflare detecta `navigator.webdriver`, retornou 403 até no HTML da página pública

Rotas realistas pra 100% automático (fora do escopo desta sessão):

- `playwright-stealth` / `patchright` — patches profundos pra parecer browser real (biblioteca de terceiros, +2h de trabalho, quebra a cada update do Cloudflare)
- Serviço externo (Firecrawl / ScrapingBee / ScraperAPI) — resolvido, mas viola a regra "sem serviço externo"
- IP residencial via proxy — custo mensal + complexidade

**Decisão pragmática:** modo assisted (`gerarUrlsAssistidasZap`) fica como padrão robusto. O corretor clica "Buscar", o painel monta 4 URLs pré-filtradas no ZAP (área ±25%, quartos, bairro), abre em abas e o corretor cola o texto — parser regex extrai 9 campos. De 15 min → 3 min. Zero risco de bloqueio, funciona em qualquer infra.

### B.2.9 · Tentativa com playwright-stealth (30/07/2026)

Instalei `playwright-extra` + `puppeteer-extra-plugin-stealth` + Chromium do sistema (`channel: "chrome"`).

Resultado:
- **Cloudflare passou** — a página HTML do ZAP retorna 200 (antes era 403)
- **Bot detection secundária permanece** — o ZAP responde `totalCount: 0` na chamada de facets, e o próprio site NÃO dispara a chamada de listings quando o resultado é vazio
- Ou seja: passamos a primeira camada, tem uma segunda mais profunda (provavelmente fingerprinting via WebGL/Canvas, timing de mouse movements, ou script antipoc customizado deles)

Bypass completo exigiria:
- `patchright` (fork mais agressivo, patches em nível binário do Playwright) — vale tentar +1-2h no futuro
- Solve captcha challenges automatizado — custo por request
- Proxy residencial rotativo — custo mensal
- Firecrawl / ScrapingBee — resolvido, mas viola a regra "sem serviço externo"

Extension points do Playwright + stealth ficam no código (`src/lib/painel/acm-scraper/zap-playwright.ts`). Podem ajudar em outras fontes menos rigorosas (VivaReal, OLX) numa fase futura.

## Fase B · ACM — Análise Comparativa de Mercado (3-4 dias)

Meta: reduzir de "abrir 4 sites + copiar tudo + calcular manualmente + montar PDF" para "colar 4 blocos → clicar → PDF pronto".

### Fluxo do corretor

1. **Identificar imóvel-alvo** — endereço, bairro, área, quartos, banheiros, vagas, condomínio, IPTU, observações, foto (opcional)
2. **Adicionar 4 amostras** — para cada uma, escolher entre:
   - **Colar texto** (do ZAP, VivaReal, OLX, site de imobiliária) — o painel salva o texto bruto + tenta parser regex simples (R$, m², "quartos"). O que o regex não pega, o corretor completa no form abaixo. Extração inteligente completa fica pro MazyOS (offline).
   - **Formulário manual** — se o corretor já tem os dados na mão
3. **Ver comparativo** — tabela lado a lado: Alvo · Amostra 1 · 2 · 3 · 4. Colunas: preço, área, preço/m², quartos, banheiros, vagas, condomínio, IPTU, bairro
4. **Ver sugestão** — média ponderada por preço/m² ajustada pela área do alvo. Range mínimo/máximo + valor recomendado
5. **Exportar PDF** — capa (Patrícia + Júlio + CRECIs), sumário executivo, ficha do imóvel-alvo, tabela comparativa, gráfico de barras, conclusão + assinatura

### Rotas

- `/painel/acm` — lista de ACMs feitas (histórico, filtro por status)
- `/painel/acm/nova` — wizard em 4 passos (alvo → amostras → revisão → PDF)
- `/painel/acm/[id]` — visualização de uma ACM já feita, com botão pra regerar PDF

### Backend

- Novo store `src/lib/painel/acm-store.server.ts` — persistência em arquivo JSON local (mesmo padrão de `imoveis-store.server.ts`)
- API routes:
  - `GET /api/acm` — lista
  - `POST /api/acm` — cria
  - `GET /api/acm/[id]` — detalhe
  - `PUT /api/acm/[id]` — atualiza
  - `DELETE /api/acm/[id]` — remove
  - `POST /api/acm/[id]/pdf` — gera PDF e retorna URL/blob

### Data types

```ts
type AmostraOrigem = "colada" | "manual"
type ACMStatus = "rascunho" | "concluida"

interface AmostraACM {
  id: string
  origem: AmostraOrigem
  textoBruto?: string           // se origem = colada
  fonte?: string                 // "ZAP", "VivaReal", "OLX", "outra"
  linkOriginal?: string
  endereco: string
  bairro: string
  precoAnuncio: number           // R$
  areaTotal: number              // m²
  quartos: number
  banheiros: number
  vagas: number
  condominio?: number
  iptu?: number
  observacoes?: string
  precoM2: number                // calculado
}

interface ACM {
  id: string
  imovelAlvo: {
    apelido: string              // "Apto Icaraí Rua X"
    endereco: string
    bairro: string
    areaTotal: number
    quartos: number
    banheiros: number
    vagas: number
    condominio?: number
    iptu?: number
    observacoes?: string
    fotoUrl?: string
  }
  amostras: AmostraACM[]         // 4 idealmente, 2-6 aceitos
  calculo: {
    precoM2Medio: number
    valorSugerido: number
    valorMinimo: number
    valorMaximo: number
  }
  status: ACMStatus
  criadoEm: string               // ISO
  atualizadoEm: string
}
```

### Parser de texto (regex)

- **Preço:** `/R\$\s*([\d.]+(?:,\d{2})?)/`
- **Área:** `/(\d+(?:[,.]\d+)?)\s*m[²2]/i`
- **Quartos:** `/(\d+)\s*(?:quartos?|dormit[óo]rios?|dorms?|qtos?)/i`
- **Banheiros:** `/(\d+)\s*banheiros?/i`
- **Vagas:** `/(\d+)\s*(?:vagas?|garagens?)/i`
- **Condomínio:** `/condom[íi]nio[:\s]*R\$\s*([\d.]+)/i`
- **IPTU:** `/IPTU[:\s]*R\$\s*([\d.]+)/i`
- Bairro/endereço: input manual (regex de endereço no BR é frágil demais)

Se algum campo não bater no regex, marca com asterisco na UI e pede confirmação do corretor.

### Cálculo de valor sugerido

```
precoM2Medio = média(amostra.precoM2) ponderada por proximidade de área ao alvo
valorSugerido = precoM2Medio × imovelAlvo.areaTotal
valorMinimo = valorSugerido × 0.92  (piso de negociação)
valorMaximo = valorSugerido × 1.08  (teto de exposição inicial)
```

Ajuste de ponderação (peso maior pra amostras com área ±20% do alvo):
```
peso(amostra) = 1 / (1 + |amostra.area - alvo.area| / alvo.area × 5)
```

### PDF

- Biblioteca: `@react-pdf/renderer`
- Fontes: Manrope + Inter (já usadas no site)
- Paleta: navy #2F4156 (capa), teal #567C8D (destaques), beige #F5EFEB (fundo), white
- Estrutura:
  - Capa: título "Análise Comparativa de Mercado", apelido do imóvel, bairro, data, corretores + CRECIs
  - Página 2: ficha do imóvel-alvo (com foto se houver)
  - Página 3: tabela comparativa das 4 amostras
  - Página 4: gráfico de barras (preço/m²) — renderizar via Recharts server-side pra PNG e embedar
  - Página 5: conclusão com valor sugerido + range + assinatura dos dois com CRECI

## Fase C · Marketing ✅ (concluída 31/07/2026)

Meta: eles definirem meta de posts e pedirem geração de criativo sem depender do Yann pra tudo. IA fora do painel (MazyOS).

### Rotas

- `/painel/marketing` — dashboard: meta da semana (barra de progresso), próximo criativo sugerido
- `/painel/marketing/publico-alvo` — vê as 5 personas de `_memoria/publico-alvo.md` (readonly pra eles, editável pelo Yann)
- `/painel/marketing/gerar` — wizard: escolhe persona → tipo (carrossel/reels/story) → 3 campos (bairro, faixa, gancho) → salva pedido como pendente
- `/painel/marketing/historico` — grid dos criativos já feitos, filtro por persona

### Backend

- Store `src/lib/painel/marketing-store.server.ts` — pedidos + criativos
- API routes `/api/marketing/*`
- Meta configurável em `/painel/perfil` (ex.: "5 posts/semana")

### Fluxo com MazyOS (offline)

- Corretor cria pedido no painel → status "pendente"
- Yann vê pedidos pendentes no painel do admin OU export
- Yann roda `/carrossel` do MazyOS com o pedido como input
- Yann sobe o criativo gerado de volta pro painel → status "pronto"
- Corretor baixa e posta

Depois (Fase 2 desse módulo): plugar geração automática via MazyOS API se o Yann quiser.

## Fase D · Bônus futuro (depois de tudo rodando)

- Scraper de amostras pro ACM via Playwright headless (economiza o "abrir ZAP + copiar")
- Push notification quando criativo do Marketing fica pronto
- Integração real com Instagram Graph API pra agendar post
- Voice input no ACM (corretor dita, sistema transcreve e preenche)

---

## Checkpoints acordados

- Ao final da Fase A → mostrar as 4 mudanças no painel, pedir GO pra Fase B
- Ao final da Fase B → mostrar o wizard de ACM + PDF de exemplo, pedir GO pra Fase C
- Ao final da Fase C → painel completo pra P&J começarem a usar

Não emendar fases sem GO explícito.

---

## Fase D · Endurecimento pra produção ✅ (concluída 31/07/2026)

### D.1 · Auth production-ready

- `src/lib/painel/auth.ts` reescrito com bcrypt real
- Ordem de resolução da senha: `PAINEL_SENHA_*_HASH` (bcrypt) > `PAINEL_SENHA_*` (texto plano dev) > **nega**
- `PAINEL_DEV_LOGIN=off` bloqueia o modo texto plano em produção
- Rate limit in-memory por IP+email: 8 falhas em 15 min → bloqueia por 30 min
- Delay artificial de 400ms em falhas (mitigação timing attack)
- Script `npm run gerar-hash "senha"` — imprime hash bcrypt pra Yann colar no env da Vercel

### D.2 · Vercel Blob nos stores

- `marketing-store.server.ts` ganhou adapter Blob (mesmo padrão de `imoveis-store` e `acm-store`)
- Todas as 3 stores agora seguem o padrão dual FS/Blob
- `BLOB_READ_WRITE_TOKEN` da Vercel é detectado automaticamente

### D.3 · Deploy checklist e documentação

- `MazyOS/site/README.md` **novo** — visão geral da stack + estrutura + regras arquiteturais
- `MazyOS/site/.env.example` reescrito com todos os env vars necessários + comentários
- `MazyOS/saidas/deploy-checklist.md` **novo** — passo a passo Vercel (JWT + hashes + Blob + domínio + PWA no celular)

### D.4 · Build de produção validado

- `npm run build` roda com exit 0
- BUILD_ID gerado em `.next/BUILD_ID` (`JqZoHWOT8jFi7MG02-sDf`)
- ESLint sem erro. Warnings soft de `<img>` em componentes públicos (não bloqueia deploy)

### O que fica pra pós-deploy (roadmap)

- Notificação push/email quando criativo fica pronto (precisa Resend/similar)
- OAuth Google/Apple (pra Patrícia/Júlio não digitarem senha)
- Métricas de uso (quantas ACMs/mês, taxa de conversão pedidos → publicados)
- Backup automático dos blobs pra storage secundário
- Sync automático de personas entre `MazyOS/_memoria/publico-alvo.md` e `src/data/painel/personas.ts`

## Fase E · Loop admin fechado ✅ (concluída 01/08/2026)

Endpoints e docs pra o Yann operar o painel de fora, sem depender de login browser:

### Novos arquivos

- `src/lib/painel/admin-auth.ts` — helpers `verificarAdmin` + `autor`; aceita header `Authorization: Bearer $PAINEL_ADMIN_TOKEN`
- `src/app/api/marketing/pedidos/[id]/criativos/route.ts` — POST anexa criativos + muda status; aceita JWT ou admin token
- `src/app/api/marketing/uploads/route.ts` — POST sobe arquivo (multipart OU dataUrl); grava no Vercel Blob se disponível, senão filesystem
- `MazyOS/saidas/admin-runbook.md` — passo a passo `curl` pro Yann executar do MazyOS ou terminal

### Env var nova

- `PAINEL_ADMIN_TOKEN` — token bearer pro Yann usar externamente. Gerar com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### Fluxo end-to-end testado

- Pedido `pendente` (0 criativos) → POST em `/api/marketing/pedidos/[slug]/criativos` com admin token → pedido vira `pronto` com 2 criativos anexados
- Home marketing atualiza barra "1 de 3 posts prontos"
- Histórico mostra pedido com StatusPill verde
- Autor registrado corretamente como `{ papel: "admin", fonte: "token" }`

### Build

`npm run build` sai com exit 0. BUILD_ID `N4AJiy2fkl2K1JKRu9ry2`.

## ⚠️ Aprendizado registrado — 01/08/2026

**Nunca rodar `npm run build` enquanto `next dev` estiver rodando.** Ambos escrevem em `.next/` e conflitam. Sintomas quando acontece:

- `Cannot find module './XXXX.js'` no webpack-runtime
- HTTP 500 em rotas API que antes funcionavam
- 404 em chunks `.next/static/*.js` no browser

Fix: `Ctrl+C` no dev, `Remove-Item -Recurse -Force .next`, `npm run dev` de novo.

Pra validar build sem impactar dev:

- Parar dev antes do build
- Ou usar clone/branch separada
- Ou `PORT=3001 npm run build && npm start` em terminal isolado

## Fase G · Estúdio de Criativos self-service (em progresso — 02/08/2026)

**Motivação (virada estratégica do Yann):** o fluxo "corretor pede → Yann gera → sobe criativo" cria dependência do Yann pra cada post. O Yann pediu que Patrícia e Júlio consigam gerar criativos sozinhos, com paleta, tipografia e CRECI já pré-configurados no padrão deles. Templates prontos, preview em tempo real, download em PNG. Sem IA externa, sem chave de API — tudo no browser.

### G.1 · Setup + primeiro template ✅ (concluído 02/08/2026)

- `html-to-image` instalado (client-side, sem serviço externo)
- `src/data/painel/templates-marketing.ts` — metadata dos templates (id, nome, tipo, aspecto, dimensões, campos, personaSugerida, corAcento) + constantes globais (`RODAPE_OFICIAL` com CRECIs, `PALETA` navy/teal/sky/beige)
- `src/components/painel/marketing/estudio/templates/ImovelDestaque.tsx` — primeiro template (Post 4:5, 1080×1350). Layout: foto 60% no topo com badge/selo opcional + bairro no canto, faixa navy 40% embaixo com título, preço + bairro, chips de características (até 5) e rodapé duplo (CRECIs Patrícia+Júlio à esquerda, marca PV·JA à direita)
- `src/components/painel/marketing/estudio/TemplateEditor.tsx` — editor side-by-side. Esquerda: campos (texto, textarea, moeda, foto). Direita: preview escalado responsivo (respeita largura do container, sempre 4:5). Node oculto full-res (1080×1350) usado pelo `html-to-image.toPng()` pra exportar. Preço formatado (`Intl.NumberFormat pt-BR BRL`) antes de salvar
- `src/components/painel/marketing/estudio/TemplateGaleria.tsx` — grid de cards com thumbnail simulado (paleta + camada foto/faixa) + tag do aspecto + persona sugerida
- `src/app/painel/marketing/estudio/page.tsx` — orquestrador com estado local (galeria ↔ editor) e `TEMPLATE_REGISTRY` mapeando id → componente React
- `src/app/painel/marketing/page.tsx` — home reordenada: **hero "Estúdio de Criativos" (Novo · Recomendado)** vira atalho principal, wizard antigo (`/gerar`) vira secundário "Pedir pro Yann"

### Como funciona

1. Corretor abre `/painel/marketing/estudio` → vê galeria de templates
2. Clica no template → entra no editor side-by-side
3. Preenche foto (upload local → data URL), bairro, título, preço, gancho opcional, características opcionais
4. Preview atualiza em tempo real (React state → mesma árvore JSX renderizada em duas escalas)
5. Clica **Baixar PNG** → `html-to-image.toPng(nodeOculto, { width: 1080, height: 1350 })` gera dataURL → download automático + `apiCreatePedido` salva no histórico como `status: "pronto"`
6. Botão "Abrir no histórico" leva pro card do pedido salvo

### Validação end-to-end

- PNG exportado tem exatamente **1080×1350px, RGBA, ~320KB** com foto real + template
- Pedido salvo no histórico com `faixaPreco: "R$ 620.000"` (formatado), `briefing` completo (template + título + características), `status: "pronto"`, `personaId: "upgrade-familiar"` (herdada do template)
- Botão "Marcar como publicado" no histórico funciona pra fechar o loop de meta semanal
- Zero chamada a serviço externo. Zero LLM. Foto do imóvel nunca sai da máquina do corretor (data URL local)

### G.2 · Mais 3 templates ✅ (concluído 02/08/2026)

Padrão de expansão validado: cada template = 1 componente + 1 entrada em `TEMPLATES_MARKETING` + 1 registro em `TEMPLATE_REGISTRY`. Sem tocar em nenhum outro arquivo.

Templates novos, todos testados end-to-end (preencher → preview → PNG na dimensão certa → salva histórico com persona correta):

- **`prestacao-vs-aluguel`** — Post 1:1, 1080×1080. Persona: `primeira-compra-consciente`. Layout: duas colunas lado a lado — coluna Aluguel (sky, neutra, "sem construir patrimônio") vs coluna Prestação (navy, destacada com badge "Melhor", "vira patrimônio"). Diferença mensal + anual calculada automaticamente. Sem foto — é comparativo puro
- **`story-foto-grande`** — Story 9:16, 1080×1920. Persona: `upgrade-familiar`. Foto full-bleed com gradientes navy no topo e base. Badge do bairro topo esquerda, marca PV·JA topo direita. Gancho gigante no terço inferior + subtítulo + pill de CTA ("Arrasta pra cima" padrão) + CRECI rodapé
- **`guia-bairro`** — Post 4:5, 1080×1350. Persona: `migrante-rio-niteroi`. Foto do bairro com overlay navy escuro. Badge "Guia de bairro" topo esquerda, tag do bairro topo direita. Título grande + lista numerada de até 3 pontos (padaria a pé, travessia 20 min, m² menor que Barra, etc) + CTA final + CRECI

### Validação end-to-end (todos os 3)

- `prestacao-vs-aluguel-*.png` → 1080×1080, 140KB
- `story-foto-grande-*.png` → 1080×1920, 589KB
- `guia-bairro-*.png` → 1080×1350, 764KB
- Zero erro no console, dev server compilou sem warning novo
- Cada pedido apareceu no histórico com persona certa (`primeira-compra-consciente`, `upgrade-familiar`, `migrante-rio-niteroi`) e tipo certo (`post`, `story`, `post`)
- Placeholder "Mais templates chegando" removido da galeria — agora tem 4 templates ativos

### Arquivos criados/modificados na G.2

- `MazyOS/site/src/components/painel/marketing/estudio/templates/PrestacaoVsAluguel.tsx` (novo)
- `MazyOS/site/src/components/painel/marketing/estudio/templates/StoryFotoGrande.tsx` (novo)
- `MazyOS/site/src/components/painel/marketing/estudio/templates/GuiaBairro.tsx` (novo)
- `MazyOS/site/src/data/painel/templates-marketing.ts` (modificado — 3 entradas novas em `TEMPLATES_MARKETING`)
- `MazyOS/site/src/app/painel/marketing/estudio/page.tsx` (modificado — 3 imports + 3 linhas no `TEMPLATE_REGISTRY`)
- `MazyOS/site/src/components/painel/marketing/estudio/TemplateGaleria.tsx` (modificado — removido placeholder "chegando")

### G.3 · Integração histórico + Reels script (pendente)

- Botão "Ver PNG" no histórico → abrir preview do último rendering (reconstruir dados do briefing)
- Template "Roteiro de Reels" — não gera PNG, gera texto do roteiro (formato scene 1 / scene 2 / scene 3 + CTA) copiável pro celular. Sem `html-to-image`, só um export text

### Arquivos criados/modificados na G.1

- `MazyOS/site/src/data/painel/templates-marketing.ts` (novo)
- `MazyOS/site/src/components/painel/marketing/estudio/templates/ImovelDestaque.tsx` (novo)
- `MazyOS/site/src/components/painel/marketing/estudio/TemplateEditor.tsx` (novo)
- `MazyOS/site/src/components/painel/marketing/estudio/TemplateGaleria.tsx` (novo)
- `MazyOS/site/src/app/painel/marketing/estudio/page.tsx` (novo)
- `MazyOS/site/src/app/painel/marketing/page.tsx` (modificado — hero novo + atalhos reorganizados)
- `MazyOS/site/package.json` (dep nova: `html-to-image@1.11.13`)

## Fase H · Marketing como Hub ✅ (concluído 02/08/2026)

**Motivação:** Yann pediu que a área de marketing do painel "puxasse" como o MazyOS cria posts e virasse um **hub** — não só um menu com atalhos, mas uma central que explica o processo inteiro (as skills `/publicar-tema`, `/carrossel`, `/aprovar-post` do MazyOS) e liga cada etapa a onde ela acontece no painel.

### O que existe agora

`/painel/marketing` foi refeito em 6 blocos:

1. **Hero** — meta semanal + barra de progresso + CTA "Abrir Estúdio"
2. **Pipeline** (novo) — as 5 fases do processo do MazyOS numa timeline horizontal (desktop) / vertical (mobile), cada fase expansível pra mostrar "no Estúdio" vs "pedindo pro Yann"
3. **Caminhos** (novo) — 2 cards lado a lado (Estúdio vs Yann) com: tempo, fases cobertas (barra visual das 5 fases), quando usar, quando evitar, CTA
4. **Regras da casa** (novo, extraído do Estúdio) — 6 regras editoriais globais em cards, fonte única
5. **KPIs** — pendentes / gerando / prontos / publicados
6. **Últimos pedidos** — mantido, com link pro público-alvo e histórico como rodapé

### Fonte de verdade única

Todo o conteúdo do hub vive em `src/data/painel/marketing-hub.ts`, espelhando as skills do MazyOS:

- **`FASES_MARKETING`** — 5 fases (Estratégia, Copy, Visual, Legenda, Publicação) com título, subtítulo, descrição, "no Estúdio", "pelo Yann", onde acontece (aqui/mazyos/corretor), ícone lucide. Fonte: `MazyOS/.claude/skills/carrossel/SKILL.md` (5 passos) + `publicar-tema/SKILL.md` (orquestração)
- **`CAMINHOS_MARKETING`** — 2 caminhos (Estúdio, Yann) com título, descrição, tempo, quando usar, quando evitar, quais fases executa
- **`REGRAS_CASA`** — 6 regras globais (uma persona por criativo, bairro no card, preço no primeiro slide, foto por dentro, CRECI no rodapé, zero clichê)

Quando qualquer skill do MazyOS evoluir, atualiza esse arquivo — os 3 componentes seguem automaticamente.

### Componentes novos

- `src/components/painel/marketing/HubPipeline.tsx` — timeline das 5 fases com accordion (só 1 aberta por vez). Cada fase mostra ícone + número, título/subtítulo, badge "onde acontece" (verde: no painel · teal: MazyOS · âmbar: você posta). Ao abrir: descrição + 2 blocos comparativos "No Estúdio" (verde) vs "Pedindo pro Yann" (teal)
- `src/components/painel/marketing/HubCaminhos.tsx` — 2 cards grandes lado a lado. Cada card mostra ícone + subtítulo, título, descrição, tempo estimado, barra de 5 segmentos indicando fases cobertas, lista "ideal quando é...", aviso "evita quando...", CTA. Estúdio marcado como "Recomendado"
- `src/components/painel/marketing/HubRegras.tsx` — 6 cards com as regras editoriais. Reutilizado no Estúdio via prop `compacto`

### Reorganização

- `/painel/marketing/estudio` passou a usar `HubRegras compacto` no lugar do bloco inline duplicado — regras editoriais têm agora fonte única e viram atualizações automáticas em ambas as telas
- Wizard antigo `/painel/marketing/gerar` renomeado conceitualmente pra "Pedir pro Yann" no card do caminho — a URL fica igual, só o framing muda

### Validação end-to-end

- Hub carregou sem erro no console (`0 errors, 1 warning` — só a warning pré-existente de PWA meta tag)
- Accordion abre/fecha corretamente (testado com Fase 1 default → clicou Fase 3 → Fase 3 abriu, Fase 1 fechou)
- Layout desktop (1440px): pipeline em 5 colunas, caminhos em 2 colunas, regras em 3 colunas
- Layout mobile (390px): tudo empilhado vertical, cards mantém legibilidade
- Botão "Abrir Estúdio" do hero e card "Estúdio" do caminho apontam ambos pra `/painel/marketing/estudio`
- Regras da casa aparecem idênticas no hub e no Estúdio (fonte única funcionando)

### Arquivos criados/modificados na Fase H

- `MazyOS/site/src/data/painel/marketing-hub.ts` (novo) — 5 fases + 2 caminhos + 6 regras
- `MazyOS/site/src/components/painel/marketing/HubPipeline.tsx` (novo)
- `MazyOS/site/src/components/painel/marketing/HubCaminhos.tsx` (novo)
- `MazyOS/site/src/components/painel/marketing/HubRegras.tsx` (novo)
- `MazyOS/site/src/app/painel/marketing/page.tsx` (reescrito — 6 seções na ordem hero→pipeline→caminhos→regras→kpis→pedidos)
- `MazyOS/site/src/app/painel/marketing/estudio/page.tsx` (modificado — troca do bloco inline "regras da casa" pelo `<HubRegras compacto />`)

## Fase I · Duas opções de criação no Estúdio ✅ (concluída 03/08/2026)

**Motivação:** Yann pediu que o Estúdio ficasse mais parecido com a experiência do MazyOS — o corretor **digita o que quer** e o sistema resolve, sem escolher template no dedo primeiro. Também pediu uma segunda opção: **puxar de imóveis já cadastrados no catálogo** (com fotos + dados) pra não precisar redigitar nada.

### I.1 · Parser de texto livre ✅

Novo `src/lib/painel/marketing-parser.ts` com `analisarPedidoLivre({ tipo, texto, personaId, foto? })` que devolve `{ templateId, dados, avisos, explicacao }`.

**Heurísticas:**
- **Bairro** — lista de bairros conhecidos (Icaraí, Piratininga, Fonseca, Itaipuaçu, Camboinhas, Tijuca, etc — total: 35+ bairros de Niterói/Maricá/Rio). Match case-insensitive + acentuação normalizada
- **Preço** — 4 regexes por prioridade: milhões (`1.2 milhões`, `1.5 mi`) → mil (`620 mil`, `350k`) → R$ formatado (`R$ 1.850.000`) → bruto (`780000`)
- **Quartos / Área / Vagas** — regex nos padrões óbvios (`2 quartos`, `78m²`, `1 vaga`)
- **Aluguel + Prestação** — regex específicos pra extrair valores no template Prestação vs Aluguel
- **Gancho** — palavras-chave dão selo automático ("vista permanente", "novo lançamento", "preço reduzido")

**Escolha do template:**
1. `tipo === "story"` → `story-foto-grande`
2. `tipo === "reels"` → `story-foto-grande` (frame estático) + aviso pra pedir vídeo pro Yann
3. Persona `primeira-compra-consciente` + palavras `aluguel|prestação|financiamento|FGTS` → `prestacao-vs-aluguel`
4. Persona `migrante-rio-niteroi` + palavras `guia|coisas sobre|conhecer|morar em|bairro` OU `tipo === "carrossel"` → `guia-bairro`
5. Default → `imovel-destaque`

**Bug corrigido:** regex antigo `M\b` batia em "78m²" e transformava em "78 milhões". Substituído por `\bmi(?![a-zA-Zçãõáéíóúâêô])` (word boundary + lookahead defensivo).

### I.2 · Suite de smoke tests do parser ✅

Novo `scripts/test-parser.mjs` — roda offline via Node com TS in-memory compile, sem browser. Cobre 8 casos:

1. Imóvel destaque · preço em mil + área em m²
2. Imóvel destaque · preço em milhões
3. Prestação vs Aluguel (primeira compra + palavras de financiamento)
4. Guia de Bairro (migrante Niterói)
5. Story (tipo story)
6. Reels usa story-foto-grande com aviso
7. Preço bruto (sem "mil", 5-7 dígitos)
8. Preço com R$ formatado ("R$ 1.850.000")

**Resultado:** `8 passou · 0 falhou`

Executa: `cd MazyOS/site && node scripts/test-parser.mjs`

### I.3 · CriarRapido — modo "do zero" ✅

Novo `src/components/painel/marketing/estudio/CriarRapido.tsx`. Tela única com:
- 4 pills de **tipo** (Post / Carrossel / Story / Reels)
- Textarea grande **"Sobre o quê?"** com placeholder rotativo (4 exemplos aleatórios)
- Grid de **5 personas** pra clicar
- Upload de **foto opcional** (data URL local)
- Botão **"Gerar preview"** → chama o parser e abre o TemplateEditor pré-preenchido

Bottom bar sticky com status ("post · Upgrade familiar · com foto") e CTA.

### I.4 · CriarDoCatalogo — modo "do imóvel cadastrado" ✅

Novo `src/components/painel/marketing/estudio/CriarDoCatalogo.tsx`. 2 telas:

**Tela 1 — Lista de imóveis:**
- Puxa `apiListImoveis()` e filtra vendidos
- Grid 3 colunas (mobile: 1) mostrando thumbnail (primeira foto), título, localização, valor
- Badge "Reservado" quando aplicável, badge "N fotos" quando > 1
- Busca opcional (só aparece quando ≥ 4 imóveis)

**Tela 2 — Refinamento:**
- Resumo do que vai ser pré-preenchido (bairro, preço, área, quartos, vagas)
- 4 pills de tipo (Post / Carrossel / Story / Reels)
- Grid de todas as fotos do imóvel pra escolher qual usar de capa
- Se imóvel não tem fotos, mostra fallback educativo apontando pro `/painel/catalogo`

Ao confirmar → monta o mesmo `ResultadoParse` do parser (mas com dados vindos do `Imovel`) e abre o TemplateEditor.

**Extração de bairro:** `"Parada 40, São Gonçalo / RJ"` → `"Parada 40"` (split por `,` ou `·`).

### I.5 · Estúdio virou orquestrador de 3 modos ✅

`/painel/marketing/estudio/page.tsx` refeito com state machine simples (`modo: home | rapido | catalogo | templates`) + estado do editor.

Home mostra 3 cards grandes lado a lado:
1. **Descrever em texto** (recomendado, mais rápido) — vai pro CriarRapido
2. **A partir do catálogo** — vai pro CriarDoCatalogo
3. **Escolher template** — mantém o fluxo antigo (galeria + editor)

`TemplateEditor` ganhou 2 props novas: `dadosIniciais` (pré-preenche state) e `avisosIniciais` (mostra "Nota do sistema" com a explicação do parser + avisos).

### I.6 · Validação end-to-end ✅

**Suite Node offline:** parser passou **8/8 casos** (preço em mil, milhões, R$ formatado, bruto; Prestação vs Aluguel, Guia Bairro, Story, Reels).

**Browser — modo "Do zero":**
- Texto `"vista permanente em Icaraí, 620 mil, 2 quartos, 78m², 1 vaga, andar alto"` → template `imovel-destaque` com bairro: Icaraí, preço: 620000, título: "2 quartos, 78m², 1 vaga", selo: "Vista permanente", características: "78m², 2 quartos, 1 vaga"
- Texto `"aluguel 2500 vs prestação 2100 em Fonseca, financiamento com FGTS"` + persona `primeira-compra-consciente` → template `prestacao-vs-aluguel` com valores extraídos + bairro + selo padrão + contexto
- PNG baixado: `prestacao-vs-aluguel-*.png` → **1080×1080 · 138 KB** ✅

**Browser — modo "Do catálogo":**
- Escolheu "Apartamento na Parada 40" (170k, 38m², 1 quarto, 1 banheiro, 1 vaga, 2 fotos)
- Editor abriu pré-preenchido: bairro "Parada 40" (extraído de "Parada 40, São Gonçalo / RJ"), preço 170000, título "1 quarto, 38m², 1 vaga", selo "Excelente localização" (primeiro diferencial), características, foto da fachada carregada
- PNG baixado: `imovel-destaque-*.png` → **1080×1350 · 1.8 MB** (tamanho grande confirma que a foto real do imóvel entrou no PNG, não é placeholder) ✅
- Salvou no histórico como `pronto`, `faixaPreco: "R$ 170.000"`, briefing completo com título e características ✅

**Bug fixado:** "1 quartos" → "1 quarto" (singular quando qty === 1) — ajustado tanto no parser (`marketing-parser.ts`) quanto no CriarDoCatalogo.

**Build production:**
- `npm run build` → **exit 0**
- `BUILD_ID: veswjVwNt9lLDSnxsb-Jx`
- 5 rotas de marketing compiladas: `/painel/marketing`, `/estudio`, `/gerar`, `/historico`, `/publico-alvo`
- APIs compiladas: `/api/marketing/{meta,pedidos,pedidos/[id],pedidos/[id]/criativos,uploads}`
- 2 warnings pré-existentes de `jose` no Edge Runtime (não bloqueiam deploy)

### Arquivos criados/modificados na Fase I

- `MazyOS/site/src/lib/painel/marketing-parser.ts` (novo)
- `MazyOS/site/scripts/test-parser.mjs` (novo — suite Node)
- `MazyOS/site/src/components/painel/marketing/estudio/CriarRapido.tsx` (novo)
- `MazyOS/site/src/components/painel/marketing/estudio/CriarDoCatalogo.tsx` (novo)
- `MazyOS/site/src/components/painel/marketing/estudio/TemplateEditor.tsx` (modificado — aceita `dadosIniciais` e `avisosIniciais`)
- `MazyOS/site/src/app/painel/marketing/estudio/page.tsx` (reescrito — orquestra 3 modos)

## Fase J · Templates reescritos com sistema editorial do MazyOS ✅ (concluída 04/08/2026)

**Motivação:** Yann viu os 4 templates originais (Fase G) e disse que ficaram "horríveis, uma merda, parece design porco". Feedback correto — eu tinha usado Manrope sans-serif nos títulos, ignorando o `identidade/design-guide.md` que sempre pediu **serifada elegante** (Playfair Display / Cormorant / DM Serif Display) nos títulos. Também não tinha aplicado o sistema tipográfico editorial completo da skill `/carrossel` (kerning apertado nos títulos, aberto nas eyebrows, régua fina, stamps circulares, layouts nomeados).

### J.1 · Playfair Display adicionado ao next/font ✅

- `src/app/layout.tsx` — importa `Playfair_Display` do `next/font/google` com weights 400/500/600/700/800/900 e variável CSS `--font-serif`
- `tailwind.config.ts` — adiciona `fontFamily.serif: ["var(--font-serif)", "Georgia", "serif"]`
- HTML root recebe as 3 variáveis: `--font-sans` (Inter) · `--font-display` (Manrope) · `--font-serif` (Playfair)

### J.2 · Sistema tipográfico editorial aplicado em todos os templates

Constantes reusadas em todos os 4 templates:
```
const SERIF = "var(--font-serif), 'Playfair Display', Georgia, serif"
const SANS = "var(--font-sans), Inter, sans-serif"
```

**Regras tipográficas espelhadas da skill /carrossel do MazyOS:**
- Títulos: Playfair 60-100px, weight 900, line-height 0.96-1.02, letter-spacing **-0.035em a -0.045em**
- Eyebrows: Inter 12-18px, weight 800, UPPERCASE, letter-spacing **0.28em a 0.32em**
- Corpo/subtítulos: Playfair itálico 500 (mais editorial que sans) ou Inter 500
- CRECIs: nome em Playfair 600, "CRECI XXXX" em Inter 700 UPPERCASE 0.18em
- Preços: Playfair 88-92px weight 700
- Elementos: régua fina 3px como separador, stamp circular rotate -10deg com borda 3-3.5px

### J.3 · Layouts nomeados por template ✅

**`imovel-destaque` · Post 4:5 · Layout SOLO**
- Foto 55% no topo (743px altura, não 810px — deixa mais respiro)
- Overlay tipográfico sobre foto: eyebrow "À VENDA · BAIRRO" spaced 0.32em no canto esquerdo + assinatura serif "PV·JA" no direito
- Stamp circular gancho rotate -10deg saindo pela borda inferior direita da foto (borda navy 3.5px, fundo bege, texto Playfair 26px)
- Base navy 45% (607px) com: eyebrow → régua sky 60px 3px → título Playfair 60px weight 900 → preço com "R$" pequeno + Playfair 92px → grid tipográfico de características em Inter 20px weight 600 (com bordas horizontais finas) → dois CRECIs em coluna esquerda + assinatura "Corretores de Imóveis" à direita

**`prestacao-vs-aluguel` · Post 1:1 · Layout DUO**
- Cabeçalho editorial: eyebrow "COMPARATIVO · BAIRRO" teal → régua navy 60px 3px → título "Aluguel × Prestação" (Playfair 74px, com × em serif itálico teal 62px como caractere separador elegante)
- Duas colunas com border-radius 16px:
  - Coluna A (Aluguel): fundo bege, borda sky, texto navy, número Playfair 88px, sub em Playfair itálico "sem construir patrimônio"
  - Coluna B (Prestação): fundo navy, texto bege, mesma tipografia, sombra 24px 50px -18px opacity 0.4
- Stamp circular "Melhor / Escolha" rotate -10deg entre as colunas, meio direito, borda bege 3px, Playfair 30px weight 800
- Rodapé: "Economia mensal" em Playfair 62px weight 900 → dois CRECIs compactos à direita

**`story-foto-grande` · Story 9:16 · Layout CAPA**
- Foto full-bleed com dois overlays gradientes suaves:
  - Topo: navy 0.55 → 0 (protege eyebrow)
  - Base: transparent → navy 0.98 (contraste pra tipografia)
- Topo esquerdo: eyebrow "À VENDA" 0.32em → régua bege 44px 3px → nome do bairro em Playfair 32px capitalizado
- Topo direito: assinatura "PV·JA" Playfair 32px
- Base: régua bege 60px → gancho Playfair **100px weight 900 letter-spacing -0.045em** (dominante visual) → subtítulo em Playfair itálico 30px → pill CTA bege com "FALE CONOSCO" spaced + texto CTA em Playfair + seta ArrowUpRight → dois CRECIs claros em row

**`guia-bairro` · Post 4:5 · Layout NÚMERO**
- Foto topo 40% (540px) com overlay navy 0.35 → 0.6
- Overlay tipográfico sobre foto: topo com "GUIA DE BAIRRO" 0.32em + assinatura PV·JA no direito; base da foto com "BAIRRO" eyebrow + nome bairro em Playfair 60px sobre foto
- Base bege 60% (810px):
  - Régua navy 60px → título serifado (Playfair 54px)
  - **3 pontos numerados com "01" "02" "03" em Playfair itálico 56px teal** como watermark à esquerda, texto do ponto em Playfair 26px weight 500 navy com border-top fina de separação
  - CTA em Playfair itálico teal 20px "salva esse post..." → dois CRECIs escuros compactos

### J.4 · Sistema apontado pro Estúdio no MazyOS ✅

Duas atualizações que criam o loop bidirecional entre painel e MazyOS:

**`MazyOS/.claude/skills/carrossel/SKILL.md`** — adicionado bloco no topo:
> **⚠️ Patrícia e Júlio · Corretores — usar o painel deles**
>
> Contexto: workspace opera pra dupla P&J. Painel dedicado em `MazyOS/site/src/app/painel/marketing/estudio`.
>
> Regra: pedido de post/carrossel/story pra P&J → caminho preferencial é o Estúdio, não gerar HTML+Playwright aqui. Estúdio já tem: 4 templates React com o sistema editorial dessa skill aplicado, paleta correta, CRECIs pré-preenchidos, parser de texto livre, integração com catálogo, export PNG client-side.
>
> Só cair no `/carrossel` legado quando formato for único não-recorrente. Se aparecer necessidade recorrente, abrir template novo no Estúdio.

**`MazyOS/CLAUDE.md`** — adicionada seção "Criação de posts pra Instagram — sempre pelo Painel":
- Templates e modos disponíveis
- Fluxo passo-a-passo pro Yann quando pedirem post

**Nota no Estúdio** — banner discreto na home explica que o design segue o mesmo sistema, referencia `identidade/design-guide.md`.

### J.5 · Validação end-to-end ✅

Todos os 4 templates baixados como PNG:
- `imovel-destaque` (do catálogo Parada 40 com foto real): **1080×1350 · 1.6 MB** ✅
- `prestacao-vs-aluguel` (Fonseca, 2500 vs 2100): **1080×1080 · 153 KB** ✅
- `guia-bairro` (Icaraí, 3 pontos): **1080×1350 · 331 KB** ✅
- `story-foto-grande` (Icaraí, vista permanente): **1080×1920 · 922 KB** ✅

Preservado nos screenshots `design-v2-*.png` na raiz do workspace pra comparação visual.

### J.6 · Build production ✅

- `npm run build` → **exit 0** limpo
- `BUILD_ID: k6lF32m95sRpc3D9q9m3L`
- `/painel/marketing/estudio` = 30.6 kB / 127 kB First Load JS (aumento por causa dos 4 templates React + parser + CriarRapido + CriarDoCatalogo — mas ainda leve pra o que oferece)
- Todas as 42 rotas compilaram, 3 imóveis pré-renderizados como SSG

### Arquivos modificados na Fase J

- `MazyOS/site/src/app/layout.tsx` (Playfair Display adicionado)
- `MazyOS/site/tailwind.config.ts` (`font-serif` no config)
- `MazyOS/site/src/components/painel/marketing/estudio/templates/ImovelDestaque.tsx` (reescrito)
- `MazyOS/site/src/components/painel/marketing/estudio/templates/PrestacaoVsAluguel.tsx` (reescrito)
- `MazyOS/site/src/components/painel/marketing/estudio/templates/StoryFotoGrande.tsx` (reescrito)
- `MazyOS/site/src/components/painel/marketing/estudio/templates/GuiaBairro.tsx` (reescrito)
- `MazyOS/site/src/app/painel/marketing/estudio/page.tsx` (nota "mesmo sistema do MazyOS")
- `MazyOS/.claude/skills/carrossel/SKILL.md` (bloco P&J no topo)
- `MazyOS/CLAUDE.md` (regra "posts pelo painel")
