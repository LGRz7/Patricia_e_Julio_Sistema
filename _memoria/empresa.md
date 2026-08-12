# Empresa

> Memória central do negócio. O Claude lê esse arquivo antes de cada resposta.

**Nome:** Patrícia e Júlio — Corretores de Imóveis
**Negócio:** Corretagem de imóveis (compra, venda e intermediação)
**O que faz:** Ajudam famílias a comprar a casa própria com segurança e atendimento próximo. Trabalham desde imóveis mais acessíveis até imóveis de valor alto.
**Perfil:** Dupla de corretores autônomos atuando juntos (não são CNPJ — operam pelo CRECI individual)
**Atende clientes:** Renda mensal a partir de R$7 mil, idade 26+, qualquer gênero. Buscam imóveis em **Niterói, Maricá e Rio de Janeiro**. Público em transição — antes o foco era São Gonçalo, agora migrou pra essas três praças (ticket médio-alto e potencial de investimento, especialmente em Maricá pela valorização com os royalties).
**Equipe:** Os dois tocam sozinhos
- Patrícia Vidal — Corretora — CRECI 68850
- Júlio Aguiar — Corretor — CRECI 79271
**Ferramentas:** Instagram e Facebook (canais atuais). Sem site.
**Principais entregas:** Anúncios de imóveis, atendimento e intermediação de vendas

## Contexto adicional

- Antes vendiam também planos de saúde, mas o foco atual é 100% corretagem de imóveis.
- Mudança de praça em curso: saíram de São Gonçalo, migraram pra **Niterói + Maricá + Rio**. Toda a criação nova precisa refletir isso (imóveis, região, tom, referências urbanas).
- Origem dos clientes hoje: Facebook, indicação e parceiro.
- Volume: ~30 leads por semana, mas só ~2 visitas e sem conversão no mesmo mês/momento. O funil vaza muito entre lead e visita.
- Não são CNPJ — toda comunicação oficial deve usar "Corretores de Imóveis" + os nomes + CRECI. Não podem ter logo de marca própria.
- Definição de público-alvo detalhada em `_memoria/publico-alvo.md` — esse arquivo é o cérebro do posicionamento, a ferramenta de geração de criativo do Yann lê dele.

## Contexto do projeto (quem opera o MazyOS)

Quem opera esse sistema é o Yann — dono de uma empresa de implementação com IA. Ele está construindo o marketing da Patrícia e Júlio (site, carrosséis, conteúdo, posicionamento) sem cobrar, em troca de futuras indicações. O objetivo é fazer eles venderem mais e, de quebra, gerar indicações orgânicas pro Yann. Tudo que o sistema produz aqui é PARA o negócio da Patrícia e Júlio.

## ⚠️ REGRA DE ESCOPO — não misturar projetos

O Yann opera dois projetos distintos no mesmo workspace. Não confundir:

- **MazyOS** (esta pasta, `c:\Users\LGR\Downloads\Works\MazyOS\`) — sistema pessoal do Yann pra atender Patrícia e Júlio. **Todo conteúdo sobre corretagem, os corretores, público-alvo deles, criativos deles, Instagram deles, posicionamento deles, mapa mental deles → vai aqui, em `_memoria/`, `saidas/`, `marketing/`.** Só isso.
- **Glitch Leads** (outra pasta, `c:\Users\LGR\Downloads\Works\glitch-leads\`) — produto SaaS próprio do Yann (o "carro autônomo comercial B2B"). É negócio dele, não é dos corretores. **Nada sobre Patrícia e Júlio entra no código, docs ou banco do Glitch Leads.**

Quando o Yann diz "o painel deles" sem contexto de arquivo aberto:
- Se o arquivo ativo estiver em `MazyOS/` → é dos corretores
- Se o arquivo ativo estiver em `glitch-leads/` → é do produto SaaS dele (usuários do Glitch, não corretores)
- Em dúvida, **perguntar antes de agir** — não assumir.
