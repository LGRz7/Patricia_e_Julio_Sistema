# Prompt Master — Recriação completa do sistema

> Copie e cole esse prompt inteiro numa nova conversa com qualquer IA para
> recriar todo o contexto do projeto. Ele explica quem você é, o que faz,
> a estrutura atual e o próximo passo (sistema de leads).

---

## PROMPT:

```
Você é meu assistente de implementação. Vou explicar todo o contexto do meu projeto e depois te pedir para criar um sistema de captação de leads. Leia tudo antes de agir.

---

## QUEM EU SOU

Sou Yann, dono da Mazzeo IA (mazzeoia.com.br) — empresa de implementação com inteligência artificial para negócios. Construo sistemas operacionais de marketing e vendas para clientes usando IA como motor principal.

Meu modelo de trabalho: implemento marketing digital completo (site, conteúdo, posicionamento, funil) para clientes sem cobrar na fase inicial, em troca de futuras indicações e cases. O resultado que entrego gera retorno real pro cliente e prova de valor pra mim.

---

## O CLIENTE ATUAL

**Patrícia Vidal** (CRECI 68850) e **Júlio Aguiar** (CRECI 79271) — dupla de corretores de imóveis autônomos em São Gonçalo/RJ e região.

- Não são CNPJ — operam pelo CRECI individual
- Tocam o negócio sozinhos (sem equipe)
- Atendem famílias buscando primeira casa própria até clientes de ticket alto
- Região: São Gonçalo, Niterói e arredores
- Instagram: @julio_e_patricia_corretores
- Origem de leads atual: Facebook, indicação e parceiros

### O PROBLEMA CENTRAL

~30 leads entram por semana, mas só ~2 viram visita e quase nenhuma converte em venda no mesmo mês. O funil vaza entre lead → visita → fechamento. O posicionamento digital era amador.

---

## O QUE JÁ FOI CONSTRUÍDO

### 1. Sistema MazyOS (pasta raiz do projeto)
Sistema operacional do negócio rodando no Claude Code com:
- `_memoria/` — contexto do negócio (empresa, preferências, estratégia)
- `identidade/` — design guide com paleta e regras visuais
- `marketing/` — posts, carrosséis, conteúdo produzido
- `.claude/skills/` — 15 skills automáticas (carrossel, SEO, anúncio, etc.)
- `site/` — site institucional completo

### 2. Site institucional (Next.js)
Site editorial premium hospedado na Netlify. Stack:
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- GSAP + ScrollTrigger + Lenis (animações narrativas)
- Framer Motion (UI leve)

**Páginas:**
- Home (/) — hero monumental, manifesto, profissionais, imóveis destaque, categorias, contato
- Imóveis (/imoveis) — listagem editorial com dados tipados
- Imóvel individual (/imoveis/[slug]) — página por imóvel com galeria e CTA WhatsApp
- Sobre (/sobre) — apresentação dos profissionais
- Contato (/contato) — formulário que monta mensagem e abre WhatsApp
- Quiz (/quiz) — quiz interativo para qualificação
- Links (/links) — página de links (linktree próprio)

**Dados centralizados em:**
- `src/data/imoveis.ts` — imóveis tipados
- `src/data/profissionais.ts` — dados dos corretores
- `src/data/site.ts` — contatos e configurações
- `src/data/quiz.ts` — perguntas do quiz
- `src/data/faq.ts` — FAQ

**Fluxo de contato:** Formulário coleta dados no navegador → monta texto → abre wa.me com mensagem pronta pro corretor responsável pelo imóvel. Sem backend.

### 3. Conteúdo produzido
- 2 carrosséis de Instagram (7 e 6 slides cada) — tema: sair do aluguel
- 6 posts de autoridade com foto real dos corretores
- Catálogo HTML de todos os posts com versão PDF (base64 embutida)
- Identidade visual aplicada em tudo (paleta azul + bege)

### 4. Identidade visual
| Cor | Hex | Uso |
|-----|-----|-----|
| Navy | #2F4156 | Textos, seções escuras, CTA |
| Teal | #567C8D | Destaques, links, botões |
| Sky Blue | #C8D9E6 | Fundos suaves, cards |
| Beige | #F5EFEB | Fundo principal |
| White | #FFFFFF | Respiro |

- Tipografia: serifada elegante (títulos) + sans-serif limpa (corpo)
- Sem logo (não podem — não são CNPJ). Usam nome + CRECI como assinatura.

---

## ESTRUTURA DE PASTAS ATUAL

```
MazyOS/
├── _memoria/          (empresa.md, preferencias.md, estrategia.md)
├── .claude/skills/    (15 skills: carrossel, seo, anuncio-google, etc.)
├── identidade/        (design-guide.md)
├── marketing/conteudo/posts/  (HTMLs dos posts + imagens)
├── dados/
├── saidas/
├── scripts/
├── site/              (app Next.js completo)
│   ├── public/        (imoveis/, equipe/, catalogo/)
│   └── src/
│       ├── app/       (pages: home, imoveis, sobre, contato, quiz, links)
│       ├── components/ (home/, imovel/, layout/, ui/, contato/, quiz/, links/, seo/)
│       ├── data/      (imoveis.ts, profissionais.ts, site.ts, quiz.ts, faq.ts)
│       ├── hooks/     (useGsapLayout, useReducedMotion)
│       ├── lib/       (whatsapp.ts, gsap.ts, format.ts)
│       ├── types/     (imovel.ts, profissional.ts)
│       └── styles/    (globals.css)
├── netlify.toml
└── CLAUDE.md
```

---

## O QUE PRECISO AGORA: SISTEMA DE CAPTAÇÃO DE LEADS

O site converte para WhatsApp, mas não captura dados de forma estruturada. Preciso de um sistema que:

1. **Capture leads de forma inteligente** — não só formulário genérico. Usar o quiz que já existe (/quiz) como ferramenta de qualificação, capturando nome, telefone, email e perfil do lead antes de direcionar pro WhatsApp.

2. **Armazene os leads** — preciso de um banco/planilha/sistema onde os dados ficam salvos e organizados (não só abrir WhatsApp e perder o rastro). Pode ser:
   - Planilha Google Sheets (simples, grátis)
   - Supabase/Firebase (mais robusto)
   - Airtable
   - Ou outra solução que faça sentido sem custo alto

3. **Classifique automaticamente** — baseado nas respostas do quiz e no comportamento, classificar o lead como quente/morno/frio.

4. **Notifique os corretores** — quando um lead quente entrar, avisar imediatamente (WhatsApp, email ou push).

5. **Dashboard simples** — onde a Patrícia e o Júlio possam ver os leads, status e histórico sem complicação.

6. **Integre com o site atual** — sem quebrar o que já funciona. O quiz e o formulário de contato devem alimentar esse sistema.

### RESTRIÇÕES:
- Orçamento zero ou quase zero (eles não têm $ pra ferramentas caras)
- Sem complexidade técnica pra eles operarem — tem que ser simples
- Manter a identidade visual em qualquer interface nova
- Não criar dependência de ferramentas que vão parar de funcionar
- O site já está na Netlify — qualquer backend precisa ser serverless ou externo

### PREFERÊNCIAS TÉCNICAS:
- Se precisar de backend: Supabase (grátis até certo ponto) ou Google Sheets API
- Se precisar de notificação: webhook pro WhatsApp ou email
- Manter TypeScript e a stack atual do site
- Código limpo, tipado, sem gambiarras

---

Analise tudo, me diga qual arquitetura faz mais sentido dado o contexto (custo zero, simplicidade pra eles, robustez pra escalar depois) e depois implemente.
```

---

*Prompt gerado em Julho/2026 a partir do estado atual do projeto MazyOS — Patrícia e Júlio Corretores.*
