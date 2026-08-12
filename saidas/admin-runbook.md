# Admin Runbook — Painel dos Corretores

> Guia do Yann (admin) pra operar o painel de fora — via `curl`, script Node,
> ou dentro do MazyOS. Como entregar criativos, gerenciar pedidos, upload de
> arquivos, tudo sem precisar logar no browser.

---

## Setup — token admin

### Gera o token (uma vez)

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Guarda em lugar seguro. Vira `PAINEL_ADMIN_TOKEN`.

### Configura na Vercel

```powershell
cd C:\Users\LGR\Downloads\Works\MazyOS\site
vercel env add PAINEL_ADMIN_TOKEN production
# cola: <o token gerado>
vercel --prod
```

Também dá pra usar em dev — está no `.env.local`.

### Convenção de uso

Todos os comandos aqui assumem que você exportou o token na sessão:

```powershell
$env:BASE_URL = "https://patricia-julio-painel.vercel.app"  # ou http://localhost:3000
$env:ADMIN_TOKEN = "<cola-o-token-aqui>"
```

No bash/mac:

```bash
export BASE_URL="https://..."
export ADMIN_TOKEN="..."
```

---

## Operações principais

### 1. Listar pedidos pendentes

```powershell
curl.exe -H "Authorization: Bearer $env:ADMIN_TOKEN" "$env:BASE_URL/api/marketing/pedidos"
```

Retorna todos os pedidos. Filtra os pendentes localmente com `ConvertFrom-Json`:

```powershell
$r = curl.exe -H "Authorization: Bearer $env:ADMIN_TOKEN" "$env:BASE_URL/api/marketing/pedidos" | ConvertFrom-Json
$r.pedidos | Where-Object { $_.status -eq 'pendente' } | Select-Object slug, gancho, tipo, personaId
```

### 2. Ver detalhe de UM pedido (pega o brief completo)

```powershell
$slug = "reels-primeira-compra-consciente-prestacao-menor-que-aluguel"
curl.exe -H "Authorization: Bearer $env:ADMIN_TOKEN" "$env:BASE_URL/api/marketing/pedidos/$slug"
```

O JSON contém:
- `imovelAlvo` (não aplicável em marketing — só ACM tem esse campo)
- `gancho`, `briefing`, `bairro`, `faixaPreco`, `tipo`, `personaId`
- Use isso como input pro MazyOS gerar o carrossel/reels.

### 3. Upload de arquivo (imagem, PDF, MP4)

**Modo multipart (recomendado):**

```powershell
curl.exe -X POST `
  -H "Authorization: Bearer $env:ADMIN_TOKEN" `
  -F "file=@C:/caminho/pro/slide-1.png" `
  "$env:BASE_URL/api/marketing/uploads"
```

Resposta:

```json
{
  "url": "https://<blob>.public.blob.vercel-storage.com/marketing/2026-08/abc12345-slide-1.png",
  "bytes": 234567,
  "contentType": "image/png",
  "storage": "vercel-blob"
}
```

Guarda a `url` — vai usar no próximo passo.

**Modo dataUrl (útil quando você já tem a imagem em memória):**

```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"slide-1.png","dataUrl":"data:image/png;base64,iVBORw0KG..."}' \
  "$BASE_URL/api/marketing/uploads"
```

### 4. Anexar criativos ao pedido (fecha o loop)

Depois de gerar os arquivos e ter as URLs:

```powershell
$body = @{
  substituir = $true
  status = 'pronto'
  criativos = @(
    @{
      titulo = 'Slide 1 — abertura'
      legendaSugerida = 'Sua prestação pode ser menor que o aluguel em Icaraí.'
      hashtags = @('icarai', 'niteroi', 'financiamento')
      arquivoUrl = 'https://<url do upload passo 3>'
    },
    @{
      titulo = 'Slide 2 — comparativo'
      legendaSugerida = 'Aluguel R$ 2.500 vs Prestação R$ 2.100.'
      hashtags = @('icarai', 'financiamento')
      arquivoUrl = 'https://<outra url>'
    }
  )
} | ConvertTo-Json -Depth 6

curl.exe -X POST `
  -H "Authorization: Bearer $env:ADMIN_TOKEN" `
  -H "Content-Type: application/json" `
  -d $body `
  "$env:BASE_URL/api/marketing/pedidos/$slug/criativos"
```

Ao terminar, o corretor vê no `/painel/marketing/historico` o pedido com status **Pronto** (verde) e os criativos anexados prontos pra baixar.

### 5. Marcar pedido como cancelado / rascunho / etc

Usa PUT genérico:

```powershell
$body = @{ status = 'cancelado' } | ConvertTo-Json
curl.exe -X PUT `
  -H "Authorization: Bearer $env:ADMIN_TOKEN" `
  -H "Content-Type: application/json" `
  -d $body `
  "$env:BASE_URL/api/marketing/pedidos/$slug"
```

⚠️ Nota: hoje o PUT `pedidos/[id]` só aceita JWT session, não admin token. Se precisar mudar status sem estar logado no browser, use o endpoint de criativos com `status` OU eu adiciono admin auth no PUT genérico depois.

### 6. Baixar backup dos dados

Não tem endpoint de export ainda (roadmap). No curto prazo:

- **Local (dev):** copia `data/marketing-pedidos.json` e `data/acm.json` etc.
- **Produção:** dashboard Vercel → Storage → Blob → download manual dos JSON.

---

## Fluxo completo — passo a passo (Yann roda uma vez por semana)

Cenário: Patrícia criou 3 pedidos ao longo da semana. Yann senta, gera os 3 e entrega no painel.

```powershell
# 1. Setup
$env:BASE_URL = "https://patricia-julio-painel.vercel.app"
$env:ADMIN_TOKEN = "<cola-o-token>"

# 2. Pega os pendentes
$r = curl.exe -H "Authorization: Bearer $env:ADMIN_TOKEN" "$env:BASE_URL/api/marketing/pedidos" | ConvertFrom-Json
$pendentes = $r.pedidos | Where-Object { $_.status -eq 'pendente' }
$pendentes | Select-Object slug, gancho, tipo, personaId

# 3. Pra cada pendente:
foreach ($p in $pendentes) {
  Write-Host "==== $($p.slug) ===="
  Write-Host "  Persona: $($p.personaId)"
  Write-Host "  Tipo:    $($p.tipo)"
  Write-Host "  Bairro:  $($p.bairro)"
  Write-Host "  Gancho:  $($p.gancho)"
  Write-Host "  Brief:   $($p.briefing)"
  Write-Host ""
  # (roda o MazyOS pra gerar, salva os arquivos)
}
```

Depois de gerar cada criativo com o MazyOS:

```powershell
# 4a. Upload dos slides do carrossel
$urls = @()
foreach ($f in @("slide-1.png", "slide-2.png", "slide-3.png", "slide-4.png")) {
  $up = curl.exe -X POST `
    -H "Authorization: Bearer $env:ADMIN_TOKEN" `
    -F "file=@saida-mazyos/$f" `
    "$env:BASE_URL/api/marketing/uploads" | ConvertFrom-Json
  $urls += $up.url
}

# 4b. Anexa no pedido
$body = @{
  substituir = $true
  status = 'pronto'
  criativos = @(
    @{ titulo = 'Slide 1'; arquivoUrl = $urls[0]; legendaSugerida = '...' }
    @{ titulo = 'Slide 2'; arquivoUrl = $urls[1] }
    @{ titulo = 'Slide 3'; arquivoUrl = $urls[2] }
    @{ titulo = 'Slide 4'; arquivoUrl = $urls[3]; hashtags = @('icarai', 'financiamento') }
  )
} | ConvertTo-Json -Depth 6

curl.exe -X POST `
  -H "Authorization: Bearer $env:ADMIN_TOKEN" `
  -H "Content-Type: application/json" `
  -d $body `
  "$env:BASE_URL/api/marketing/pedidos/$slug/criativos"
```

Pronto — Patrícia abre o app no celular, vê "Pronto" no pedido, baixa os 4 arquivos, sobe no Instagram.

---

## Endpoints admin (referência rápida)

| Método | Path | Auth | Uso |
|---|---|---|---|
| `GET` | `/api/marketing/pedidos` | JWT (patricia/julio logados) | Lista pedidos |
| `GET` | `/api/marketing/pedidos/[id]` | JWT | Detalhe |
| `POST` | `/api/marketing/pedidos/[id]/criativos` | **JWT OU admin token** | Anexa criativos, muda status |
| `POST` | `/api/marketing/uploads` | **JWT OU admin token** | Upload de arquivo → URL pública |
| `PUT` | `/api/marketing/pedidos/[id]` | JWT | Atualiza qualquer campo |
| `DELETE` | `/api/marketing/pedidos/[id]` | JWT | Remove pedido |

---

## Segurança

- **Nunca** publique o `PAINEL_ADMIN_TOKEN` em código, logs ou README público.
- Rotacione periodicamente (`vercel env rm` + `vercel env add`).
- Se suspeitar de vazamento, gera outro imediatamente — todo request antigo com o token vazado é rejeitado.
- Rate limit do login não se aplica ao admin token (é você, não força bruta) — mas Vercel tem rate limit global.

---

## Roadmap admin (pós-MVP)

- Endpoint `GET /api/marketing/pedidos/pendentes` — atalho pra filtrar
- Endpoint `POST /api/admin/export` — baixa TUDO num zip (backup)
- Página `/painel/admin` acessível com admin token via query string (mesmo sem JWT)
- Webhook opcional pra avisar o Yann quando pedido novo cai
