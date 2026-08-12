# Checklist de deploy — Painel dos Corretores

> Passo a passo pra colocar o painel no ar via Vercel.
> **Rota A (recomendada, mais rápida):** Vercel CLI direto — sem precisar de Git.
> **Rota B (padrão):** via GitHub — se você quiser rastrear versões.

Tempo total: ~20 min na primeira vez, ~2 min nos deploys seguintes.

---

## 0. Pré-requisitos

- [ ] Conta Vercel criada (grátis em [vercel.com](https://vercel.com))
- [ ] Vercel CLI instalado ✅ (já detectei aqui)
- [ ] Node 18+ ✅

Se for pela Rota B (Git):
- [ ] Git instalado (Windows: [git-scm.com](https://git-scm.com))
- [ ] Conta no GitHub

---

## 1. Login na Vercel (30 segundos)

Rode local, abre o browser pra autenticar:

```powershell
cd C:\Users\LGR\Downloads\Works\MazyOS\site
vercel login
```

Escolhe o método (GitHub / Email / SSO). Confirma no browser. Fecha.

Confirma que logou:

```powershell
vercel whoami
```

Deve imprimir seu username.

---

## 2. Gerar credenciais reais (5 min)

### 2.1 JWT secret (já gerado — pronto pra usar)

Um secret válido foi pré-gerado. Copia essa string e guarda num lugar seguro:

```
JBMFw5XhtK7b5oSw9KhnYN/a7yK3+Yj8cWVeFmjgMTRqtqUA2oBh+IK0bXz4uoeZ
```

Se preferir gerar outro (a qualquer momento):

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### 2.2 Senhas da Patrícia e Júlio (hash bcrypt)

Escolhe senhas fortes (mínimo 8 chars, ideal 12+) — anota em lugar seguro (LastPass, 1Password, papel):

```powershell
npm run gerar-hash "SenhaDaPatricia2026!"
npm run gerar-hash "SenhaDoJulio2026!"
```

Cada comando imprime um hash `$2b$12$...`. **Copia cada hash — não a senha em texto.**

---

## 3. Primeiro deploy — via Vercel CLI (Rota A · recomendada)

Ainda em `C:\Users\LGR\Downloads\Works\MazyOS\site`:

```powershell
vercel
```

Vai fazer perguntas na primeira vez:

- **Set up and deploy?** `Y`
- **Which scope?** (sua conta / time) — escolha
- **Link to existing project?** `N` (primeira vez)
- **Project name?** `patricia-julio-painel` (ou o que quiser)
- **Directory?** `.` (ENTER — usa a pasta atual)
- **Modify settings?** `N`

Ele builda e sobe. Termina com uma URL tipo `https://patricia-julio-painel-abc123.vercel.app`.

### Testar rápido no domínio de preview

Abre a URL — vai carregar o site público. Tenta `/painel/login` — vai dar tela de login mas SEM env vars, login não funciona ainda. É esperado.

---

## 4. Configurar env vars de produção (5 min)

Roda os comandos abaixo em sequência. Cada `vercel env add` pede o valor (cola quando ele perguntar):

```powershell
# JWT (cola: JBMFw5XhtK7b5oSw9KhnYN/a7yK3+Yj8cWVeFmjgMTRqtqUA2oBh+IK0bXz4uoeZ)
vercel env add PAINEL_JWT_SECRET production

# Hash da Patrícia (cola o hash do passo 2.2)
vercel env add PAINEL_SENHA_PATRICIA_HASH production

# Hash do Júlio (cola o hash do passo 2.2)
vercel env add PAINEL_SENHA_JULIO_HASH production

# Bloqueia login em texto puro (segurança extra)
vercel env add PAINEL_DEV_LOGIN production
# Cola: off
```

**Verifica que foi:**

```powershell
vercel env ls
```

Deve listar as 4 variáveis.

---

## 5. Ativar Vercel Blob (persistência dos dados)

Sem isso, tudo que a Patrícia e o Júlio criarem (imóveis, ACMs, pedidos) **some a cada deploy**.

No dashboard da Vercel (`https://vercel.com/dashboard`):

- Vai no projeto → **Storage** (tab superior) → **Create Database**
- Escolhe **Blob** → **Continue** → **Connect** ao projeto

A Vercel adiciona `BLOB_READ_WRITE_TOKEN` automaticamente. Não precisa copiar.

---

## 6. Redeploy pra pegar as env vars novas

Env vars adicionadas depois do primeiro deploy exigem redeploy:

```powershell
vercel --prod
```

Termina com a URL final (mesma de antes se você não trocou o nome).

---

## 7. Teste em produção (3 min)

Abre a URL do deploy. Chega em `/`:

- [ ] Site público carrega — home, imóveis, contato
- [ ] `/painel/login` abre sem piscar
- [ ] Tenta login com senha errada → 401
- [ ] Tenta login com a senha real que você usou pra gerar o hash → entra
- [ ] Home `/painel` mostra "Bom dia/tarde/noite, Patrícia/Júlio"
- [ ] Cria 1 imóvel no catálogo → refresh → sobrevive (isso confirma que Blob tá ligado)
- [ ] Cria 1 ACM completa → gera PDF → PDF baixa
- [ ] Cria 1 pedido de marketing → aparece no histórico

**Se algo falhar**, ver logs em: `vercel logs <sua-url>.vercel.app` ou dashboard → Deployments → Runtime Logs.

---

## 8. Domínio custom (opcional, 5 min)

Na Vercel: **Settings → Domains → Add**.

Se você tem `patricia-julio.com.br` (por exemplo):

1. Adiciona lá
2. Vercel dá 2 registros DNS (CNAME + A) — cola no provedor do domínio
3. Espera ~1h propagação

O painel fica em `https://<seu-dominio>/painel`.

---

## 9. Instalar como PWA no celular da Patrícia e Júlio (2 min cada)

Depois do deploy:

1. Abre `https://<seu-domínio>/painel` no Chrome/Safari do celular
2. Faz login com as senhas reais
3. O modal `InstallPwaModal` sugere adicionar à tela inicial — aceitar
4. Vira ícone do painel no celular como se fosse app

O painel abre em fullscreen sem barra do browser depois de instalado.

---

## Manutenção contínua

- **Trocar senha:** `npm run gerar-hash "novaSenha"`, cola o hash em `vercel env rm PAINEL_SENHA_PATRICIA_HASH production` + `vercel env add PAINEL_SENHA_PATRICIA_HASH production`, `vercel --prod`
- **Deploy nova versão:** `vercel --prod`
- **Ver logs:** `vercel logs`
- **Baixar dados do Blob:** dashboard → Storage → seu Blob → download manual dos JSON

---

## Rota B · via GitHub (alternativa)

Se preferir versionar com Git em vez de deploy direto:

1. Instala Git: [git-scm.com/download/win](https://git-scm.com/download/win)
2. `cd C:\Users\LGR\Downloads\Works\MazyOS\site`
3. `git init && git add . && git commit -m "initial"`
4. Cria repo vazio no GitHub → `git remote add origin <url>` → `git push -u origin main`
5. Na Vercel dashboard: **Add New → Project → Import Git Repository**
6. Configura env vars pelo dashboard (Settings → Environment Variables)
7. Push subsequentes deploym automaticamente

---

## O que NÃO fica na Vercel (dev local ainda)

- Scraper Playwright do ZAP (Vercel free tier não tem Chromium; assisted mode continua funcionando)
- MazyOS gerando criativos offline — Yann roda local, sobe resultado pelo painel

Ambos são features de admin (Yann), não afetam a experiência da Patrícia e Júlio.

---

## Roadmap pós-deploy

- Notificação push quando criativo fica pronto (Resend/similar)
- OAuth Google/Apple no login (senha zero)
- Endpoint admin de export dos dados
- Sync automático das personas MazyOS ↔ painel
- Métricas de uso
