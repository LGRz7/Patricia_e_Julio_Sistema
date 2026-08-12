# 🏠 Projeto Patrícia e Júlio - Sistema Imobiliário

## 📋 Sobre

Sistema completo de gerenciamento imobiliário com:
- ✅ Site público com catálogo de imóveis
- ✅ Painel administrativo (Patrícia e Júlio)
- ✅ Estúdio de Marketing com geração de posts via IA
- ✅ Templates HTML + Playwright para renderização
- ✅ Sistema de ACM (Automação de Conteúdo para Marketing)

---

## 🚀 Deploy na Vercel

### Configuração do Projeto

**Root Directory:** `patricia-julio`  
**Framework:** Next.js  
**Build Command:** `npm run build`  
**Output Directory:** `.next`

### Variáveis de Ambiente

Adicione estas variáveis na Vercel (Settings → Environment Variables):

```
PAINEL_JWT_SECRET=(use o valor do arquivo .env.local)
PAINEL_SENHA_PATRICIA=(use o valor do arquivo .env.local)
PAINEL_SENHA_JULIO=(use o valor do arquivo .env.local)
HUGGINGFACE_API_TOKEN=(use o valor do arquivo .env.local)
```

**⚠️ Importante:** Os valores reais estão no arquivo `.env.local` que NÃO está no Git por segurança.

---

## 🧪 Testar Localmente

```bash
cd patricia-julio
npm install
npm run dev
```

Acesse: http://localhost:3000

### Painel de Marketing

Acesse: http://localhost:3000/painel/marketing/estudio

**Login:**
- Usuário: Patrícia ou Júlio
- Senha: (consulte o .env.local)

---

## 📂 Estrutura

```
patricia-julio/
├── src/
│   ├── app/              # Rotas Next.js
│   ├── components/       # Componentes React
│   ├── lib/             # Bibliotecas e utilitários
│   │   ├── painel/      # Lógica do painel
│   │   ├── planejador-slides.server.ts
│   │   └── template-renderer.server.ts
│   └── styles/          # Estilos globais
├── public/              # Arquivos estáticos
├── data/               # Dados JSON (ACM, imóveis, pedidos)
├── package.json
├── vercel.json         # Config Vercel (timeout 60s, 3GB RAM)
└── .env.local          # Variáveis de ambiente (NÃO commitar!)
```

---

## 🎨 Features Principais

### 1. Estúdio de Marketing
- Geração de posts via IA (Hugging Face)
- Templates HTML profissionais
- Renderização via Playwright
- Export para PNG/PDF

### 2. ACM (Automação de Conteúdo)
- Parser de dados estruturados
- Geração em lote
- Histórico de pedidos

### 3. Catálogo de Imóveis
- Listagem com filtros
- Detalhes com galeria
- Mapa interativo (Leaflet)

---

## 📞 Suporte

Documentação completa:
- `ATUALIZAR-VERCEL.md` - Guia de deploy
- `DEPLOY-RAPIDO.md` - Deploy em 5 minutos
- `DEPLOY-INSTRUCTIONS.md` - Instruções detalhadas

---

**Última atualização:** 11 de agosto de 2026
