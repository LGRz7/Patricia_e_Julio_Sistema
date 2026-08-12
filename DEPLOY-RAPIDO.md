# ⚡ Deploy Rápido - 5 Minutos

## Passo 1: Commit (escolha uma opção)

### Opção A: GitHub Desktop ✅ RECOMENDADO
1. Abra **GitHub Desktop**
2. Repositório: `MazyOS`
3. Você verá 5 arquivos modificados
4. Marque todos
5. Mensagem de commit:
   ```
   feat: templates HTML + Playwright no Estúdio
   ```
6. **"Commit to main"**
7. **"Push origin"** (botão azul no topo)
8. ✅ PRONTO!

### Opção B: Git CLI (se tiver instalado)
```bash
cd C:\Users\LGR\Downloads\Works\MazyOS
git add -A
git commit -m "feat: templates HTML + Playwright no Estúdio"
git push
```

---

## Passo 2: Variáveis de Ambiente na Vercel

1. Acesse: https://vercel.com/dashboard
2. Clique no projeto **MazyOS**
3. **Settings** → **Environment Variables**
4. Adicione cada uma (clique "Add New"):

```
Nome: PAINEL_JWT_SECRET
Valor: pj_dev_secret_TRQ8gL2mK9pXvB7wCfN3zH5sJyDaVoIhX1rW6qFbEnUk
✅ Production ✅ Preview ✅ Development
```

```
Nome: PAINEL_SENHA_PATRICIA
Valor: patricia123
✅ Production ✅ Preview ✅ Development
```

```
Nome: PAINEL_SENHA_JULIO
Valor: julio123
✅ Production ✅ Preview ✅ Development
```

```
Nome: HUGGINGFACE_API_TOKEN
Valor: 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
✅ Production ✅ Preview ✅ Development
```

5. Clique **"Save"** em cada uma

---

## Passo 3: Aguardar Deploy

1. Vá em **"Deployments"** (aba do topo)
2. O deploy mais recente estará **"Building"** (azul)
3. Aguarde 3-5 minutos
4. Status mudará para **"Ready"** (verde) ✅

**Se der erro (vermelho):**
- Clique no deploy
- Veja o **"Build Logs"**
- Copie o erro e mande aqui

---

## Passo 4: Testar

1. Clique no deploy com status **"Ready"**
2. Clique em **"Visit"** ou copie a URL
3. Acesse: `https://seu-dominio.vercel.app/painel/marketing/estudio`
4. Login: **Patrícia** / `patricia123`
5. Digite: `"post sobre financiamento imobiliário para jovens profissionais"`
6. Clique **"Gerar post"**
7. Aguarde ~5-10 segundos
8. ✅ Deve aparecer um PNG perfeito!

---

## ❌ Se der erro

### Erro: "Function timed out"
- Muitos slides (carrossel grande)
- **Solução:** Teste com post simples primeiro (1 slide)

### Erro: "HUGGINGFACE_API_TOKEN is not defined"
- Variável não foi salva
- **Solução:** Volte no Passo 2, adicione a variável, e clique **"Redeploy"**

### Erro: Playwright não funciona
- Raro, mas pode acontecer
- **Solução:** Adicione no `package.json`:
  ```json
  "scripts": {
    "postinstall": "playwright install chromium --with-deps"
  }
  ```
  E faça commit + push de novo

---

## ✅ Pronto!

Quando o teste funcionar, você terá:
- ✅ Sistema em produção
- ✅ Gera posts perfeitos via Playwright
- ✅ Zero erros visuais
- ✅ 100% padronizado com o design guide

**Próximos testes:**
1. Post de **imóvel** (com foto do catálogo)
2. Post de **corretores** (Patrícia + Júlio)
3. **Carrossel** (3-5 slides)

---

**Dúvidas?** Envie aqui o erro que aparecer!
