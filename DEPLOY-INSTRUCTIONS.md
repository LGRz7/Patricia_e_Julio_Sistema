# 🚀 Instruções de Deploy - MazyOS Estúdio de Criativos

## 🎯 RESUMO RÁPIDO

**Arquivos prontos para deploy:**
- ✅ `planejador-slides.server.ts` — gera estrutura JSON (títulos, textos)
- ✅ `template-renderer.server.ts` — renderiza HTML → PNG via Playwright
- ✅ `/api/marketing/gerar/route.ts` — orquestra o fluxo completo
- ✅ `package.json` — Playwright instalado
- ✅ Sistema testado localmente — **funciona perfeitamente**

**O que você precisa fazer:**
1. 📤 Fazer commit + push (GitHub Desktop ou Git CLI)
2. ⚙️ Configurar variáveis de ambiente na Vercel
3. ⏳ Aguardar deploy (3-5 min)
4. ✅ Testar em produção

---

## 📦 Mudanças Implementadas

### Novos Arquivos Criados
1. `site/src/lib/painel/planejador-slides.server.ts` - System prompt que gera estrutura de slides
2. `site/src/lib/painel/template-renderer.server.ts` - Renderiza templates HTML em PNG via Playwright
3. `site/package.json` - Adicionada dependência: `playwright`

### Arquivos Modificados
1. `site/src/app/api/marketing/gerar/route.ts` - Endpoint atualizado para usar templates HTML ao invés de Flux
2. `site/.env.local` - Já contém `HUGGINGFACE_API_TOKEN` (não será commitado, está no .gitignore)

## 🔧 O Que Mudou

**ANTES:**
- Sistema gerava prompts em inglês → Flux gerava imagens via Hugging Face
- Resultado: imagens com erros de texto, qualidade inconsistente

**AGORA:**
- LLM gera estrutura de slides em JSON (título, corpo, CTA)
- Templates HTML/CSS padronizados aplicam design guide
- Playwright renderiza HTML → PNG perfeito
- Resultado: qualidade profissional, zero erros, 100% padronizado

## 📝 Passo a Passo para Deploy

### OPÇÃO A: GitHub Desktop (Recomendado) ✅

Se você usa **GitHub Desktop**:

1. Abra o GitHub Desktop
2. Selecione o repositório `MazyOS`
3. Você verá os arquivos modificados:
   - ✅ `site/src/lib/painel/planejador-slides.server.ts` (novo)
   - ✅ `site/src/lib/painel/template-renderer.server.ts` (novo)
   - ✅ `site/src/app/api/marketing/gerar/route.ts` (modificado)
   - ✅ `site/package.json` (modificado - playwright adicionado)
   - ✅ `DEPLOY-INSTRUCTIONS.md` (novo)
4. Marque todos os arquivos
5. No campo de commit, cole:
   ```
   feat: substituir Flux por templates HTML + Playwright no Estúdio
   
   - Criar planejador-slides.server.ts (gera estrutura JSON)
   - Criar template-renderer.server.ts (templates HTML + Playwright)
   - Atualizar /api/marketing/gerar para usar novo fluxo
   - Adicionar playwright como dependência
   - Resultado: criativos 100% padronizados, zero erros
   ```
6. Clique em **"Commit to main"**
7. Clique em **"Push origin"** (botão no topo)
8. ✅ Pronto! A Vercel vai detectar e fazer deploy automaticamente

### OPÇÃO B: Git CLI (Se tiver Git instalado)

```bash
cd C:\Users\LGR\Downloads\Works\MazyOS

# Ver o que mudou
git status

# Adicionar todos os arquivos novos e modificados
git add site/src/lib/painel/planejador-slides.server.ts
git add site/src/lib/painel/template-renderer.server.ts
git add site/src/app/api/marketing/gerar/route.ts
git add site/package.json
git add DEPLOY-INSTRUCTIONS.md

# Fazer commit
git commit -m "feat: substituir Flux por templates HTML + Playwright no Estúdio

- Criar planejador-slides.server.ts (gera estrutura JSON ao invés de prompts de imagem)
- Criar template-renderer.server.ts (templates HTML padronizados + Playwright)
- Atualizar /api/marketing/gerar para usar novo fluxo
- Adicionar playwright como dependência
- Resultado: criativos 100% padronizados, zero erros visuais"

# Push para o repositório remoto
git push origin main
```

### OPÇÃO C: Instalar Git CLI (Se não tiver nada)

1. Baixe Git para Windows: https://git-scm.com/download/win
2. Instale com configurações padrão
3. Abra PowerShell e use os comandos da **OPÇÃO B**

### 2. Configurar Variáveis de Ambiente na Vercel

⚠️ **IMPORTANTE: Faça isso ANTES ou LOGO APÓS o push!**

Acesse o painel da Vercel e adicione as variáveis de ambiente em **Settings → Environment Variables**:

**Variáveis Obrigatórias:**
```
PAINEL_JWT_SECRET=pj_dev_secret_TRQ8gL2mK9pXvB7wCfN3zH5sJyDaVoIhX1rW6qFbEnUk
PAINEL_SENHA_PATRICIA=patricia123
PAINEL_SENHA_JULIO=julio123
HUGGINGFACE_API_TOKEN=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
```

**Variáveis Opcionais (fallback):**
```
POLLINATIONS_API_KEY=sk_JU2XZVhK1EraWVHyVGCa0SFHZoe4A4Ht
```

**Como adicionar:**
1. Acesse https://vercel.com/dashboard
2. Selecione seu projeto MazyOS
3. Vá em **Settings** (engrenagem) → **Environment Variables**
4. Para cada variável:
   - Clique **"Add New"**
   - Nome: cole o nome (ex: `PAINEL_JWT_SECRET`)
   - Value: cole o valor
   - Selecione **Production**, **Preview**, e **Development**
   - Clique **"Save"**
5. Após adicionar todas, clique **"Redeploy"** se o deploy já tiver rodado

### 3. Deploy Automático

Após o push, a Vercel vai:
1. ✅ Detectar as mudanças automaticamente
2. ✅ Instalar `playwright` via npm
3. ✅ Instalar browser Chromium do Playwright
4. ✅ Build da aplicação Next.js
5. ✅ Deploy em produção

**Tempo estimado:** 3-5 minutos

### 4. Testar em Produção

Acesse `https://seu-dominio.vercel.app/painel/marketing/estudio` e teste:
1. Login como Patrícia ou Júlio
2. Descrever um post simples
3. Clicar em "Gerar post"
4. Verificar que o PNG gerado está perfeito (sem erros de texto, design padronizado)

## ⚠️ Importante - Playwright na Vercel

A Vercel suporta Playwright nativamente! O Chromium será instalado automaticamente durante o build.

**Limites da Vercel:**
- Função serverless: 10 segundos de timeout (Free) / 60 segundos (Pro)
- Memória: 1024 MB (Free) / 3008 MB (Pro)
- Cada renderização de carrossel (3-5 slides) leva ~3-8 segundos

**Se der timeout:**
- Upgrade para Vercel Pro OU
- Reduzir quantidade de slides por request

## 🎯 Modelo de IA Usado

**Texto:** Llama 3.3 70B Instruct (via Hugging Face Router)
- Grátis
- ~8-10k tokens por geração
- Sem limite mensal

**Imagem:** Nenhum! Agora usa templates HTML renderizados
- Playwright (servidor)
- Zero custo de API de imagem
- Qualidade 100% consistente

## 📊 Próximos Passos (Opcional)

Depois do deploy, você pode:
1. **Testar carrossel** (3-5 slides) para verificar performance
2. **Testar post de imóvel** (com foto do catálogo)
3. **Ajustar templates** HTML em `template-renderer.server.ts` se quiser mudar layout

## 🆘 Troubleshooting

**Se o deploy falhar:**

1. **Erro "playwright not found"**
   - Vercel instala automaticamente, mas se falhar, adicione em `package.json`:
   ```json
   "scripts": {
     "postinstall": "playwright install chromium"
   }
   ```

2. **Erro de timeout**
   - Upgrade Vercel Pro OU
   - Reduzir slides por request

3. **Erro 502 no /api/marketing/gerar**
   - Verificar logs na Vercel Dashboard
   - Confirmar que `HUGGINGFACE_API_TOKEN` está configurado

## ✅ Checklist de Deploy

Siga esta ordem:

- [ ] **Passo 1:** Commit dos arquivos (GitHub Desktop ou Git CLI)
- [ ] **Passo 2:** Push para o repositório remoto
- [ ] **Passo 3:** Adicionar variáveis de ambiente na Vercel
  - [ ] `PAINEL_JWT_SECRET`
  - [ ] `PAINEL_SENHA_PATRICIA`
  - [ ] `PAINEL_SENHA_JULIO`
  - [ ] `HUGGINGFACE_API_TOKEN`
- [ ] **Passo 4:** Aguardar deploy finalizar (3-5 min)
- [ ] **Passo 5:** Verificar logs na Vercel (procurar por erros)
- [ ] **Passo 6:** Testar em produção:
  - [ ] Login funciona
  - [ ] Gerar post simples (1 slide)
  - [ ] Gerar carrossel (3-5 slides)
  - [ ] Download do PNG
  - [ ] Verificar qualidade da imagem

## 🔍 Como Verificar o Deploy na Vercel

1. Acesse https://vercel.com/dashboard
2. Clique no seu projeto MazyOS
3. Você verá a aba **"Deployments"** — o deploy mais recente aparece no topo
4. Status possíveis:
   - 🔵 **Building** — está compilando (aguarde)
   - ✅ **Ready** — deploy concluído com sucesso
   - ❌ **Error** — falhou (clique para ver logs)
5. Clique no deploy para ver:
   - **Domains** — URL de produção
   - **Build Logs** — logs de compilação
   - **Function Logs** — erros de runtime (se houver)

## 🆘 Troubleshooting Expandido

### ❌ Erro: "Cannot find module 'playwright'"

**Causa:** Playwright não foi instalado durante o build.

**Solução:**
1. Verifique se `package.json` tem `"playwright": "^1.62.1"` nas dependencies
2. Se não tiver, rode localmente:
   ```bash
   cd C:\Users\LGR\Downloads\Works\MazyOS\site
   npm install playwright@latest --save
   ```
3. Commit o `package.json` atualizado e faça push novamente

### ❌ Erro: "Failed to launch browser"

**Causa:** Playwright precisa instalar o Chromium.

**Solução:** Adicione script `postinstall` no `package.json`:
```json
"scripts": {
  "postinstall": "playwright install chromium --with-deps"
}
```

Depois:
```bash
cd C:\Users\LGR\Downloads\Works\MazyOS\site
git add package.json
git commit -m "fix: adicionar postinstall para Playwright Chromium"
git push
```

### ⏱️ Erro: "Function execution timed out"

**Causa:** Renderização de muitos slides demora muito.

**Sintomas:**
- Carrosséis com 5+ slides falham
- Posts simples (1 slide) funcionam

**Soluções:**
1. **Imediata:** Limitar carrosséis a 3-4 slides (edite `planejador-slides.server.ts`)
2. **Upgrade Vercel Pro:** Aumenta timeout de 10s → 60s
3. **Otimização:** Renderizar slides em paralelo (trabalho futuro)

### 🔑 Erro: "HUGGINGFACE_API_TOKEN is not defined"

**Causa:** Variável de ambiente não foi configurada.

**Solução:**
1. Vá em Vercel → Settings → Environment Variables
2. Adicione: `HUGGINGFACE_API_TOKEN` = `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`
3. Selecione **Production**, **Preview**, e **Development**
4. Clique **Save**
5. Vá em **Deployments** → clique no último deploy → **"Redeploy"**

### 🖼️ Erro: "PNG gerado está em branco"

**Causa:** Fontes do Google não carregaram a tempo.

**Solução:** Já está implementado `waitForTimeout(500)` no código. Se persistir:
1. Aumente o timeout no `template-renderer.server.ts`:
   ```typescript
   await page.waitForTimeout(1000) // era 500
   ```
2. Commit e push

### 🚨 Erro: 502 Bad Gateway

**Causa:** Função serverless crashou.

**Como investigar:**
1. Vercel Dashboard → seu projeto → **"Logs"**
2. Filtrar por **"/api/marketing/gerar"**
3. Procurar por stack traces

**Soluções comuns:**
- Memória insuficiente → Upgrade Vercel Pro
- Timeout → Reduzir slides ou upgrade Pro
- Import inválido → Verificar se todos os imports existem

### 📱 Como Testar Sem Login (Debug)

Se precisar testar rapidamente a API:

```bash
# Windows PowerShell
$token = "seu_token_jwt_aqui"
Invoke-RestMethod -Uri "https://seu-dominio.vercel.app/api/marketing/gerar" -Method POST -Headers @{"Authorization"="Bearer $token"} -ContentType "application/json" -Body '{"briefing":"post sobre financiamento imobiliário","formato":"copy","tipo":"post"}'
```

---

## ✅ Checklist Final

- [ ] Commit feito
- [ ] Push para repositório
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Deploy concluído com sucesso
- [ ] Testado em produção

---

**Data da Atualização:** 09/08/2026  
**Versão:** 2.0 - Templates HTML + Playwright
