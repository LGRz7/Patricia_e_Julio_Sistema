# SPEC — Site Imobiliário · Patrícia e Júlio Corretores de Imóveis

> Documento de planejamento (Spec Driven Development). Nenhum código é
> escrito antes da aprovação desta SPEC. Versão 0.1 — aguardando aprovação.

---

## 1. Entendimento do projeto

Site institucional imobiliário **premium** para uma dupla de corretores
autônomos (Patrícia Vidal e Júlio Aguiar), atuando em São Gonçalo/RJ e
região. Não é ERP, marketplace nem portal genérico — é uma vitrine
editorial de alto padrão, focada em apresentar os profissionais como
especialistas reais, valorizar cada imóvel como produto de alto valor e
converter visitantes em conversas no WhatsApp.

O projeto nasce de um gargalo real do negócio: muitos leads entrando
(~30/semana) mas pouquíssima conversão (~2 visitas/mês, nenhuma venda no
mesmo período) e posicionamento digital amador. O site é a peça que
constrói **credibilidade e confiança** para virar essa chave.

## 2. Objetivo principal

**Gerar contato qualificado via WhatsApp**, transmitindo autoridade,
sofisticação e atendimento personalizado. Toda a arquitetura da página
empurra, de forma elegante e não agressiva, para a conversa no WhatsApp
com o profissional certo.

## 3. Público-alvo

Famílias de médio a alto ticket em São Gonçalo/RJ e arredores — desde
quem busca a primeira casa própria (ticket mais acessível) até clientes
de alto padrão. Pessoas que valorizam segurança, atendimento próximo e
querem sentir que estão lidando com profissionais sérios, não com mais
um corretor genérico.

## 4. Perfil dos profissionais

- **Patrícia Vidal** — Corretora — CRECI 68850
- **Júlio Aguiar** — Corretor — CRECI 79271
- Atuam juntos, tocam o negócio sozinhos.
- **Restrição legal:** não são CNPJ. Toda identificação oficial usa
  "Corretores de Imóveis" + nomes + CRECI. **Não há logo de marca** —
  o nome + CRECI cumpre o papel da assinatura visual.

## 5. Tipos de imóvel e regiões

- **Tipos:** apartamentos, casas, imóveis para morar ou investir.
  (Confirmar com eles a lista final de categorias.)
- **Região:** São Gonçalo/RJ e arredores (ex. real fornecido: Parada 40,
  Rua da Caminhada).

## 6. Posicionamento e direção visual

Estética **editorial imobiliária premium** — cruzamento entre site de
arquitetura, portfólio de alto padrão e catálogo de conversão. As três
referências orientam:

- **Ref. 1 (Haven monumental):** tipografia gigante integrada à
  fotografia arquitetônica; título atrás/sobre a construção.
- **Ref. 2 (Haven editorial):** limpeza, muito espaço branco, imagem
  pequena inserida dentro do título, ritmo calmo e sofisticado.
- **Ref. 3 (DREAM HOUSE):** composição assimétrica, imersão, navegação
  horizontal discreta de categorias, riqueza de detalhes.

### Paleta (alinhada à marca + referências)
| Token | Hex | Uso |
|-------|-----|-----|
| `navy` | `#2F4156` | Texto sobre claro, seções escuras, rodapé, CTA forte |
| `teal` | `#567C8D` | Destaques, links, detalhes, hover |
| `sky` | `#C8D9E6` | Fundos suaves, divisórias, seção institucional |
| `beige` | `#F5EFEB` | Branco quente — fundo principal editorial |
| `white` | `#FFFFFF` | Branco puro — respiro |

A **fotografia é a principal fonte de cor**. A paleta é o cenário neutro
e sofisticado. Proibido: roxo tech, azul neon, gradientes chamativos,
brilhos artificiais, cores saturadas sem propósito.

### Tipografia
- Sans-serif limpa e contemporânea para títulos e interface (escala
  monumental, peso médio/semibold, tracking controlado).
- Escalas fluidas com `clamp()`.
- Forte contraste entre título monumental, texto de apoio e dados
  técnicos.
- Candidatas: títulos em uma sans editorial (ex. *Schibsted Grotesk*,
  *General Sans* ou *Inter Tight* via next/font); corpo numa neutra
  legível (*Inter*). A decidir na fase de design visual.

## 7. Arquitetura das páginas

1. **Home (`/`)** — narrativa completa (ver seções abaixo).
2. **Imóveis (`/imoveis`)** — listagem editorial; filtros simples só se
   houver volume (no início, poucos imóveis → sem filtros complexos).
3. **Imóvel individual (`/imoveis/[slug]`)** — página dedicada por imóvel,
   gerada a partir de dados tipados centralizados.
4. **Sobre (`/sobre`)** — os dois profissionais, forma de trabalho,
   regiões, especialidades (sem inventar números/certificações).
5. **Contato (`/contato`)** — WhatsApp, redes, formulário que monta
   mensagem e abre o WhatsApp do profissional certo (sem backend).
6. **404** e estado "imóvel indisponível".

## 8. Seções da Home (com ritmo e narrativa)

1. **Cabeçalho** minimalista sobre o hero (transparente → fundo claro no
   scroll); nome/marca à esquerda, navegação, botão de contato à direita.
2. **Hero** ~100vh: fotografia arquitetônica em destaque, título
   monumental integrado à imagem, texto curto de apoio, CTA, indicador
   discreto de scroll.
3. **Manifesto** editorial: frase forte sobre o jeito de atender, imagem
   pequena inserida no título (estilo Ref. 2). Sem cards de benefício.
4. **Apresentação dos profissionais**: imagem fixada enquanto o foco
   alterna entre Patrícia e Júlio; nome, CRECI, especialidade, CTA por
   profissional. Nada de "dois cards iguais lado a lado".
5. **Imóveis em destaque**: composição rica e assimétrica (blocos
   horizontais/verticais alternados, índice editorial, hover sutil).
   Versão horizontal por scroll no desktop, vertical natural no mobile.
6. **Categorias / regiões**: navegação horizontal discreta (estilo
   Ref. 3) como atalhos visuais, não botões genéricos.
7. **Seção institucional**: composição ampla, fundo sky/branco, texto
   progressivo, imagem entrando pela lateral. Sem números inventados.
8. **Contato final**: frase grande, foto pequena no título, botões de
   WhatsApp por profissional, rodapé integrado.

## 9. Estratégia de animação (GSAP + ScrollTrigger + Lenis + SplitType)

- **GSAP** para o que é narrativo/complexo: timeline do hero (máscara da
  imagem revelando verticalmente → nav → título por linhas via SplitType
  → apoio → CTA → indicador de scroll), transições entre blocos,
  galerias, alternância dos profissionais.
- **ScrollTrigger** com intenção (não em toda seção igual): máscaras de
  revelação, parallax discreto, pin temporário na seção de profissionais
  e na horizontal de imóveis, mudança de estado do header, escala sutil
  de fotos.
- **Lenis** sincronizado ao ticker do GSAP, `ScrollTrigger.update` no
  scroll, sem quebrar âncoras nem teclado; adaptado/desligado conforme
  device.
- **SplitType** só nos títulos principais (linha/palavra), nunca letra a
  letra sem motivo.
- **Framer Motion** apenas para UI simples: menu mobile, modais da
  galeria, accordions, estados condicionais.
- **gsap.matchMedia()** para variar desktop/mobile; **prefers-reduced-
  motion** respeitado (animações reduzidas a fade simples / sem pin/
  horizontal). Limpeza via `gsap.context()` no unmount — zero vazamento,
  zero ScrollTrigger duplicado.

## 10. Responsividade

Composições próprias por breakpoint (não é só encolher desktop):
- **Desktop/ultrawide:** tipografia monumental, sobreposição, pin,
  horizontal, assimetria.
- **Tablet:** simplifica sobreposições.
- **Mobile:** títulos menores mas expressivos, vertical, galeria por
  swipe, sem scroll horizontal forçado, sem pin longo, parallax reduzido,
  WhatsApp sempre acessível, áreas de toque adequadas.

## 11. Dados e conteúdo

- Imóveis centralizados em arquivo tipado (`src/data/imoveis.ts` com
  tipos em `src/types/`). Um dev altera texto/foto/valor/dados sem mexer
  na UI.
- Páginas de imóvel geradas a partir desses dados (static params).
- **Nada inventado:** sem imóveis, números, avaliações, premiações,
  depoimentos ou anos de experiência fictícios. Onde faltar material,
  **placeholder claramente identificado**.

## 12. Fluxo de contato (WhatsApp)

- Botão flutuante de WhatsApp sempre acessível (sem atrapalhar).
- Formulário sem backend: coleta nome, contato, imóvel de interesse e
  mensagem no navegador, monta texto organizado e abre
  `https://wa.me/<numero>?text=<mensagem>` do profissional responsável.
- Cada imóvel tem profissional responsável → roteia para o WhatsApp
  certo.

## 13. SEO técnico

Metadados por página (Next Metadata API), metadata dinâmica por imóvel,
URLs amigáveis, Open Graph + imagem de compartilhamento, sitemap,
robots.txt, `alt` em todas imagens, hierarquia de headings correta,
JSON-LD (`RealEstateAgent` / `Residence`/`Offer`), HTML semântico.

## 14. Performance

next/image (lazy, tamanhos certos, formatos modernos), next/font,
client components só quando necessário, animar só `transform`/`opacity`,
sem layout shift, sem blur/filtros pesados, destruir instâncias de
animação, testar em mobile. Meta: Core Web Vitals saudáveis.

## 15. Acessibilidade

Contraste adequado (a paleta navy/beige ajuda), navegação por teclado,
foco visível, labels no formulário, `prefers-reduced-motion`, alt
textual, landmarks semânticos, áreas de toque ≥ 44px.

## 16. Stack e estrutura de pastas

**Stack:** Next.js (App Router) · React · TypeScript · Tailwind CSS ·
Lucide · GSAP + ScrollTrigger · Lenis · SplitType · Framer Motion (UI).

```
site/
├─ public/
│  ├─ imoveis/            # fotos dos imóveis (placeholders no início)
│  ├─ equipe/             # fotos Patrícia e Júlio
│  └─ og/                 # imagens open graph
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                 # Home
│  │  ├─ imoveis/page.tsx
│  │  ├─ imoveis/[slug]/page.tsx
│  │  ├─ sobre/page.tsx
│  │  ├─ contato/page.tsx
│  │  ├─ not-found.tsx
│  │  ├─ sitemap.ts
│  │  └─ robots.ts
│  ├─ components/
│  │  ├─ layout/         # Header, NavDesktop, MenuMobile, Footer
│  │  ├─ home/           # Hero, Manifesto, Profissionais, Destaques, Categorias, Institucional, ContatoFinal
│  │  ├─ imovel/         # CardImovel, ListaImoveis, Galeria, ModalImagens, FichaTecnica
│  │  ├─ ui/             # Botao, LinkAnimado, WhatsappFloat, Divisor, ScrollIndicator
│  │  └─ contato/        # FormularioContato
│  ├─ data/              # imoveis.ts, profissionais.ts, regioes.ts, site.ts (contatos)
│  ├─ types/             # imovel.ts, profissional.ts
│  ├─ lib/               # whatsapp.ts (monta link), seo.ts
│  ├─ hooks/             # useLenis, useGsapContext, useReducedMotion
│  └─ styles/            # globals.css, tokens
├─ tailwind.config.ts    # cores da marca como tokens
├─ tsconfig.json
└─ package.json
```

## 17. Padrões de código

TypeScript estrito, componentes modulares e reutilizáveis, dados
desacoplados da UI, nomes claros em PT-BR no domínio, animações isoladas
em hooks/utils, sem lógica duplicada, sem `any`.

## 18. Fases de desenvolvimento

- **Fase 0 — Setup:** projeto Next + TS + Tailwind, tokens da paleta,
  fontes, Lenis + GSAP base, estrutura de pastas, dados tipados com
  placeholders.
- **Fase 1 — Layout base:** Header/nav, MenuMobile, Footer, WhatsApp
  flutuante, rolagem suave funcionando.
- **Fase 2 — Home estática:** todas as seções com composição e conteúdo
  (placeholders identificados), responsiva, sem animação ainda.
- **Fase 3 — Imóveis:** listagem + página individual + galeria/modal +
  fluxo WhatsApp.
- **Fase 4 — Sobre + Contato:** profissionais + formulário→WhatsApp.
- **Fase 5 — Animações:** hero timeline, reveals, parallax, pin,
  horizontal, alternância de profissionais; matchMedia + reduced-motion.
- **Fase 6 — SEO + performance + acessibilidade:** metadata, sitemap,
  robots, JSON-LD, otimização de imagem, auditoria.
- **Fase 7 — QA final:** critérios de aceite, console limpo, mobile real.

## 19. Critérios de aceite

SPEC aprovada · design fiel às referências · responsivo de verdade ·
páginas completas · links ok · imóveis estruturados em dados tipados ·
WhatsApp abre com mensagem correta · animações fluidas · GSAP/ScrollTrigger
sem conflito · Lenis sincronizado · menu mobile funcional · galerias ok ·
reduced-motion respeitado · console sem erros · nada quebrado · nada
inventado · SEO básico configurado · performance validada · acessibilidade
essencial validada · parece produto real, não protótipo.

## 20. Materiais ainda necessários

**Conteúdo (sem isso, vai placeholder identificado):**
- Fotos reais da Patrícia e do Júlio (individuais + em conjunto, alta
  resolução, com espaço negativo p/ título). A imagem de dois
  profissionais enviada parece **stock/placeholder** — confirmar se é
  pra usar provisoriamente ou se virão fotos reais deles.
- Número(s) de WhatsApp (um por profissional, ou um único).
- Telefone, e-mail, Instagram/Facebook (vi "@julio..." na conversa).
- Horário de atendimento (se quiserem exibir).
- História / forma de trabalho / especialidades de cada um (texto real,
  curto — eu rascunho e vocês validam, sem inventar números).
- Lista real de imóveis: título, localização, valor (se autorizado),
  quartos/suítes/banheiros/vagas, área, tipo, status, diferenciais,
  fotos, e qual profissional responsável por cada um.

**Decisões de produto:**
- Categorias/regiões que querem destacar.
- Confirmar fonte tipográfica (eu sugiro 2 opções na fase de design).
- Onde hospedar (sugiro Vercel — grátis e nativo pra Next.js).

---

## Decisões fechadas (após aprovação)

- **Fotos dos profissionais:** usar provisoriamente a imagem enviada no
  chat (parece stock). Substituir por foto real depois. Arquivo deve ser
  salvo em `public/equipe/patricia-julio.png` pelo Yann.
- **Contatos (WhatsApp, telefone, Instagram):** placeholders no início,
  centralizados em `src/data/site.ts`. **LEMBRAR o Yann de preencher.**
- **Hospedagem:** não agora.
- **Texto institucional:** enxuto e honesto, sem inventar números,
  prêmios, tempo de mercado ou resultados. Foco em atendimento próximo,
  segurança e seriedade. Refinar quando houver mais info real deles.
- **Imagem de imóvel/prédio:** Yann vai enviar; até lá placeholder
  identificado em `public/imoveis/`.
- **Imóveis:** começar com 1-2 exemplos estruturados (base real: Parada
  40, São Gonçalo, a partir de R$170.000), claramente marcados como
  exemplo, prontos pra troca.

## Lembretes pendentes (cobrar do Yann no fim)

- [ ] Número(s) de WhatsApp (um único ou um por profissional)
- [ ] Telefone de contato
- [ ] Instagram / Facebook
- [ ] Foto real da Patrícia e do Júlio (substituir a provisória)
- [ ] Imagem do prédio/imóvel real
- [ ] Dados reais dos imóveis a divulgar

## Próximo passo

SPEC aprovada. Iniciando **Fase 0 (setup)** e **Fase 1 (layout base)**
com placeholders claros onde faltar material.
