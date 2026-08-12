# Painel dos Corretores · Patrícia e Júlio

Site institucional + painel interno pra dupla de corretores de imóveis (Niterói / Maricá / Rio).

## O que tem aqui

- **Site público** (`/`, `/imoveis`, `/imoveis/[slug]`, `/sobre`, `/contato`, `/quiz`, `/links`) — SEO, WhatsApp, catálogo editorial
- **Painel interno** (`/painel/*`) — PWA com auth JWT, protegido por middleware
  - `/painel` — dashboard com KPIs e atalhos
  - `/painel/catalogo` — CRUD de imóveis publicados
  - `/painel/acm` — Análise Comparativa de Mercado (wizard + PDF)
  - `/painel/marketing` — pedidos de criativo com 5 personas + regras editoriais
  - `/painel/mapa` — cálculo de trajeto Uber/táxi/gasolina
  - `/painel/financeiro` — gastos com deslocamento
  - `/painel/perfil` — preferências pessoais

## Stack

- Next.js 14 App Router · TypeScript · Tailwind · React-PDF · Leaflet · Playwright (opcional)
- Auth JWT (jose) + bcrypt (bcryptjs) em cookie httpOnly
- Storage dual: filesystem em dev, Vercel Blob em prod

## Rodar local

```bash
npm install
cp .env.example .env.local
# preencha PAINEL_SENHA_PATRICIA / PAINEL_SENHA_JULIO (texto puro em dev)
# ou gere hashes: npm run gerar-hash "senha"
npm run dev
```

Painel disponível em `http://localhost:3000/painel`.

## Deploy em produção

Ver `../saidas/deploy-checklist.md` — passo a passo pra Vercel com Blob + hashes bcrypt.

## Scripts úteis

- `npm run dev` — dev server em `localhost:3000`
- `npm run build` — build de produção
- `npm run gerar-hash "senha"` — gera hash bcrypt pra colar no env de produção

## Estrutura

```
src/
├── app/                   # rotas (App Router)
│   ├── (público)          # home, imoveis, contato, sobre
│   ├── painel/            # todo o painel interno
│   └── api/               # rotas server
├── components/
│   ├── layout/            # header, footer, menu-mobile
│   ├── home/              # blocos da home
│   ├── imovel/            # cards de imóvel
│   └── painel/            # componentes do painel (Shell, ACM wizard, PersonaCard)
├── data/                  # dados tipados (imoveis, profissionais, personas)
├── lib/
│   ├── painel/
│   │   ├── auth.ts        # login + JWT + rate limit
│   │   ├── acm-*.ts       # motor + storage + scraper + PDF do ACM
│   │   ├── marketing-*.ts # storage + API do marketing
│   │   └── imoveis-*.ts   # storage do catálogo
│   ├── format.ts
│   ├── gsap.ts
│   └── whatsapp.ts
├── types/                 # tipos globais (imovel, acm, marketing, profissional)
└── middleware.ts          # protege /painel/* — checa JWT
```

## Regras arquiteturais gravadas

1. **Painel captura + estrutura.** Toda "inteligência" (LLM, scraping externo, geração de criativo) roda **fora** — MazyOS offline. Sem chave de API no client.
2. **Não são CNPJ.** Toda assinatura oficial usa `Patrícia Vidal / CRECI 68850 · Júlio Aguiar / CRECI 79271`. Zero logo de marca.
3. **Uma persona por criativo.** As 5 personas em `src/data/painel/personas.ts` são sincronizadas manualmente de `MazyOS/_memoria/publico-alvo.md`.
4. **Paleta oficial** — Navy `#2F4156` · Teal `#567C8D` · Sky `#C8D9E6` · Beige `#F5EFEB` · White `#FFFFFF`. Fora disso é bug.

## Onde a documentação vive

- Este README — orientação rápida
- `SPEC.md` (nesta pasta) — spec do site público
- `MazyOS/saidas/plano-painel.md` — roadmap completo + decisões arquiteturais
- `MazyOS/saidas/deploy-checklist.md` — passo a passo Vercel
- `MazyOS/saidas/admin-runbook.md` — como o Yann opera o painel via API/curl (entregar criativos, upload de arquivo)
- `MazyOS/_memoria/` — cérebro do negócio (público-alvo, empresa, estratégia)
