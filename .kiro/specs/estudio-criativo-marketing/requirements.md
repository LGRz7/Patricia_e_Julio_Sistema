# Requirements Document

## Introduction

O módulo Marketing do MazyOS (em `/painel/marketing`) precisa deixar de ser um gerador de imagens baseado em formulários e virar um Estúdio Criativo completo — a mesma filosofia do resto da MazyOS: simples, bonito, inteligente, focado no trabalho do corretor. Este documento define os requisitos para reestruturar todo o módulo (não apenas o estúdio) para que Patrícia e Júlio consigam criar posts, carrosseis, stories, reels, campanhas, lançamentos e material institucional a partir de uma única descrição em linguagem natural, com preview 3D em tempo real, chat lateral para refinar sem sair da edição, biblioteca de componentes arrastáveis e geração de variações que mantêm a mesma identidade visual.

O ponto de partida são os 5 templates React existentes (`carrossel-aluguel`, `imovel-destaque`, `prestacao-vs-aluguel`, `story-foto-grande`, `guia-bairro`), a API `/api/marketing/pedidos` já em produção, a paleta oficial (navy `#2F4156`, teal `#567C8D`, sky `#C8D9E6`, beige `#F5EFEB`) e as fontes Inter/Manrope/Playfair. O padrão de qualidade visual está formalizado nos HTMLs de referência em `marketing/conteudo/posts/`.

Decisões técnicas fixadas para escopo deste documento:
- **Motor de IA**: parser local expandido (regex + heurística determinística), sem LLM externo. Zero custo, zero chave, resposta síncrona no navegador.
- **Persistência de histórico**: reaproveita o mesmo store server-side dos pedidos (`marketing-store.server`), autenticado por cookie de sessão, por corretor.
- **Preview 3D**: Framer Motion sobre a versão escalada do template React que já existe hoje.

## Glossary

- **Modulo_Marketing**: A aplicação Next.js em `/painel/marketing` e suas sub-rotas, incluindo `/estudio`, histórico, KPIs e configurações. É o nível superior.
- **Estudio_Criativo**: A sub-aplicação em `/painel/marketing/estudio` responsável por criar, editar e exportar criativos.
- **Seletor_Objetivo**: A tela de entrada do Estudio_Criativo, com botões grandes para cada Objetivo_Criativo.
- **Objetivo_Criativo**: Um dos oito tipos formalizados de material que o corretor pode criar. Valores válidos: `imovel`, `educativo`, `mercado`, `institucional`, `campanha`, `story`, `reel`, `lancamento`.
- **Perfil_Objetivo**: A configuração declarativa associada a cada Objetivo_Criativo, contendo `requerFoto` (boolean), `formatosPadrao` (lista de formatos alvo) e `templatesSugeridos` (lista de IDs).
- **Registro_Templates**: O mapa server-side que resolve `templateId` para um componente React renderizável (equivalente ao `TEMPLATE_REGISTRY` atual, expandido).
- **Template_Inteligente**: Um template do Registro_Templates que declara pelo menos duas Variacoes_Formato e mantém identidade visual entre elas.
- **Variacao_Formato**: Uma renderização do mesmo template em um formato específico. Valores válidos: `post`, `carrossel`, `story`, `banner`, `reel-cover`.
- **Preview_3D**: O componente que renderiza a Variacao_Formato ativa como card com perspectiva, inclinação por gesto e sombra dinâmica.
- **Painel_Preview_Vivo**: A coluna direita do Estudio_Criativo que exibe o Preview_3D atualizando conforme o corretor edita.
- **Motor_IA**: O parser local que extrai campos estruturados (bairro, preço, quartos, área, vagas, gancho, público, tom, CTA, hashtags) a partir de descrição em texto livre.
- **Chat_IA**: O painel de conversa em três colunas do Estudio_Criativo (histórico → conversa → preview) onde o corretor emite comandos em linguagem natural.
- **Comando_Natural**: Uma mensagem do corretor no Chat_IA interpretada pelo Motor_IA como intenção de edição (ex.: "deixa mais elegante", "aumenta o preço", "troca para dourado").
- **Sessao_Conversa**: Um registro persistido no Store_Pedidos contendo `id`, `titulo`, `objetivo`, `templateId`, `dadosAtuais`, `mensagens[]`, `criadoPor`, `criadoEm`, `atualizadoEm`.
- **Historico_Conversas**: A lista de Sessoes_Conversa exibida na coluna esquerda do Chat_IA, filtrada por corretor autenticado.
- **Store_Pedidos**: O módulo `marketing-store.server` que persiste PedidoCriativo e Sessao_Conversa em arquivos JSON em disco.
- **Motor_Carrossel**: O subsistema que, dado um Objetivo_Criativo e um objetivo específico do corretor, gera automaticamente a lista ordenada de slides de um carrossel.
- **Bloco**: Um componente atômico da Biblioteca_Componentes. Valores mínimos aceitos: `selo`, `preco`, `qr-code`, `mapa`, `localizacao`, `botao-whatsapp`, `creci`, `logo`, `assinatura`, `icone`.
- **Biblioteca_Componentes**: A paleta de Blocos disponíveis para arrasto sobre o Painel_Preview_Vivo.
- **Motor_Variacoes**: O subsistema que, a partir de um criativo salvo, gera as demais Variacoes_Formato mantendo a mesma Identidade_Visual.
- **Identidade_Visual**: O conjunto de propriedades que devem permanecer estáveis entre variações do mesmo criativo. Composta por: paleta (navy/teal/sky/beige), tipografia (Inter/Manrope/Playfair conforme papel), assinatura de CRECIs (Patrícia CRECI 68850, Júlio CRECI 79271), handle `@julio_e_patricia_corretores`, texto principal (título/gancho) e valores numéricos (preço, área, aluguel, prestação).
- **Exportador**: O subsistema que converte a Variacao_Formato ativa em arquivo. Formatos aceitos: `png`, `jpg`, `pdf`.
- **Pacote_Exportacao**: O arquivo ZIP gerado quando o corretor exporta múltiplas Variacoes_Formato do mesmo criativo em uma operação, nomeado `{objetivo}-{templateId}-{timestamp}` com `timestamp` no formato UTC `YYYYMMDDTHHmmss`.
- **Latencia_Preview**: Tempo entre uma alteração no formulário ou no Chat_IA e a atualização visível no Painel_Preview_Vivo, medido em milissegundos.
- **prefers-reduced-motion**: A media query CSS padrão do usuário indicando que animações devem ser reduzidas.

## Requirements

### Requirement 1: Seleção de Objetivo antes da criação

**User Story:** Como corretor não-técnico, quero escolher primeiro o que quero criar hoje, para que a interface se ajuste ao meu objetivo sem que eu precise decidir template ou formato.

#### Acceptance Criteria

1. WHEN o corretor abre `/painel/marketing/estudio`, THE Seletor_Objetivo SHALL exibir exatamente 8 botões distintos e clicáveis, com rótulo textual visível, um para cada valor de Objetivo_Criativo (`imovel`, `educativo`, `mercado`, `institucional`, `campanha`, `story`, `reel`, `lancamento`).
2. WHEN o corretor seleciona um Objetivo_Criativo pela primeira vez ou troca para um Objetivo_Criativo diferente, THE Estudio_Criativo SHALL carregar o Perfil_Objetivo correspondente em até 2 segundos antes de renderizar a próxima tela.
3. IF o carregamento do Perfil_Objetivo excede 2 segundos ou falha, THEN THE Estudio_Criativo SHALL manter a Seletor_Objetivo visível e exibir uma mensagem observável de erro com opção de tentar novamente, sem descartar a seleção do corretor.
4. THE Perfil_Objetivo SHALL declarar `requerFoto` como `true` para `imovel`, `story` e `reel`, e como `false` para `educativo`, `mercado`, `institucional`, `campanha` e `lancamento`.
5. WHERE o Perfil_Objetivo declara `requerFoto` como `false`, THE Estudio_Criativo SHALL renderizar zero controles de upload de foto visíveis ou acessíveis por teclado na interface subsequente.
6. WHERE o Perfil_Objetivo declara `requerFoto` como `true`, THE Estudio_Criativo SHALL renderizar exatamente um controle de upload de foto visível e habilitado na interface subsequente.
7. WHEN o corretor troca de Objetivo_Criativo após ter preenchido ao menos um campo do criativo em edição, THE Estudio_Criativo SHALL exibir uma confirmação explícita antes de descartar dados, e se o corretor cancelar THE Estudio_Criativo SHALL preservar o Objetivo_Criativo anterior e todos os dados preenchidos.

### Requirement 2: Motor de IA contextual (parser local)

**User Story:** Como corretor, quero descrever o que quero criar em uma frase (ex.: "apartamento 620 mil, 3 quartos, Icaraí") e ter os campos preenchidos sozinho, para que eu não precise navegar por formulários.

#### Acceptance Criteria

1. WHEN o corretor envia uma descrição em texto livre, THE Motor_IA SHALL retornar um objeto estruturado contendo os campos `bairro` (string ou null), `preco` (inteiro entre 1 e 999.999.999 ou null), `quartos` (inteiro entre 0 e 20 ou null), `area` (inteiro em m² entre 1 e 10.000 ou null), `vagas` (inteiro entre 0 e 20 ou null), `gancho` (string ou null), `publicoSugerido` (string ou null), `tomEscrita` (string ou null), `ctaSugerida` (string ou null) e `hashtagsSugeridas` (lista de strings, pode ser vazia), com `null` para campos ausentes na descrição.
2. WHILE o Motor_IA executa uma extração, THE Motor_IA SHALL fazer zero chamadas de rede a serviços externos (observável via inspeção de requisições HTTP do navegador).
3. WHEN o Motor_IA é executado duas vezes consecutivas com o mesmo texto de entrada e o mesmo Perfil_Objetivo ativo, THE Motor_IA SHALL retornar objetos estruturais idênticos em ambas as execuções. (correctness property — idempotência da extração)
4. WHEN o texto contém um valor monetário em qualquer notação suportada (`R$ 620 mil`, `620k`, `1.2 milhões`, `R$ 620.000`), THE Motor_IA SHALL normalizar o campo `preco` para inteiro em reais no intervalo válido definido no critério 1.
5. IF o texto contém um valor monetário fora do intervalo válido ou em notação não suportada, THEN THE Motor_IA SHALL preencher `preco` com `null` e adicionar um item ao `avisos[]` identificando o valor rejeitado.
6. WHEN o texto menciona um bairro registrado no Registro_Templates, THE Motor_IA SHALL preencher `bairro` com a grafia canônica registrada, tolerando diferenças de caixa e acentuação na entrada.
7. IF o Motor_IA não consegue extrair nenhum campo obrigatório para o Objetivo_Criativo ativo, OR IF o texto de entrada contém somente espaços em branco ou está vazio, THEN THE Motor_IA SHALL retornar `avisos[]` com uma entrada por campo faltante, cada uma em linguagem do corretor.
8. WHEN o corretor edita o texto e reenvia, THE Motor_IA SHALL preservar os campos previamente extraídos que não têm valor divergente no novo texto, e sobrescrever apenas os campos com valor novo detectado. (correctness property — extração incremental é aditiva por padrão)
9. WHILE o navegador do corretor é desktop atualizado, THE Motor_IA SHALL completar cada extração em até 50ms para descrições de até 500 caracteres, medido do recebimento do texto até a disponibilização do objeto estruturado.

### Requirement 3: Chat_IA lateral em três colunas

**User Story:** Como corretor, quero conversar com o sistema em uma coluna do lado enquanto vejo o preview mudando na outra, para que eu refine o criativo sem clicar em "gerar" toda hora.

#### Acceptance Criteria

1. WHERE a viewport tem largura maior ou igual a 1024px, THE Chat_IA SHALL renderizar três colunas simultaneamente: à esquerda o Historico_Conversas (largura entre 240 e 320px), ao centro a conversa da Sessao_Conversa ativa (largura entre 380 e 520px), à direita o Painel_Preview_Vivo (largura restante mínima de 360px).
2. WHEN o corretor envia um Comando_Natural com 1 a 500 caracteres via tecla Enter ou botão de envio, THE Chat_IA SHALL aplicar o comando ao criativo em edição em até 3 segundos sem exigir clique adicional em botão "gerar".
3. IF o Comando_Natural tem 0 caracteres úteis (só espaços) ou excede 500 caracteres, THEN THE Chat_IA SHALL rejeitar o envio, preservar o texto no campo de entrada, exibir mensagem de erro observável, e manter o criativo em edição inalterado.
4. WHEN o Comando_Natural inclui um valor numérico em uma das notações reconhecidas (moeda `R$ 620 mil` / `620k` / `1.2 mi`, inteiro + unidade `3 quartos` / `78m²` / `2 vagas`, percentual `+10%`), THE Motor_IA SHALL substituir o campo canônico associado (preço, quartos, área, vagas, aluguel, prestação) mesmo se o nome do campo não estiver explícito na mensagem.
5. WHEN o Comando_Natural corresponde exatamente a uma das quatro diretrizes de estilo suportadas (`mais elegante`, `mais direto`, `mais formal`, `mais descontraído`, comparação case-insensitive), THE Motor_IA SHALL aplicar a variante pré-definida do template correspondente e refletir no Painel_Preview_Vivo em até 3 segundos.
6. IF o Motor_IA não reconhece o Comando_Natural, THEN THE Chat_IA SHALL manter o criativo inalterado, responder com uma mensagem explicando o que consegue entender, e sugerir exatamente 3 reformulações.
7. THE Chat_IA SHALL registrar cada Comando_Natural do corretor e cada resposta do Motor_IA como mensagens ordenadas cronologicamente na Sessao_Conversa ativa, até o limite de 200 mensagens por sessão.
8. WHERE a viewport tem largura entre 768px (inclusive) e 1024px (exclusive), THE Chat_IA SHALL colapsar a coluna Historico_Conversas em um menu recolhível preservando conversa e Painel_Preview_Vivo simultaneamente visíveis.
9. WHERE a viewport tem largura menor que 768px, THE Chat_IA SHALL apresentar as três seções (histórico, conversa, preview) como abas navegáveis, com a aba de conversa como padrão inicial.

### Requirement 4: Histórico de Conversas persistido

**User Story:** Como corretora Patrícia, quero abrir minhas conversas antigas em qualquer computador ou celular, para retomar um post que comecei ontem sem perder o que já tinha combinado com o sistema.

#### Acceptance Criteria

1. WHEN o corretor autenticado envia a primeira mensagem em um novo criativo, THE Estudio_Criativo SHALL criar uma Sessao_Conversa no Store_Pedidos em até 1 segundo, com título derivado dos primeiros 60 caracteres da mensagem (truncado com reticências se maior) e `criadoPor` igual ao corretor autenticado.
2. WHEN o corretor altera dados do criativo, envia mensagem no Chat_IA, ou exporta, THE Estudio_Criativo SHALL atualizar `atualizadoEm` da Sessao_Conversa ativa em até 1 segundo.
3. WHEN o corretor abre `/painel/marketing/estudio`, THE Historico_Conversas SHALL listar as Sessoes_Conversa cujo `criadoPor` corresponde ao corretor autenticado, ordenadas por `atualizadoEm` decrescente, carregando os primeiros 20 registros em até 2 segundos.
4. WHEN o corretor seleciona uma Sessao_Conversa do Historico_Conversas, THE Estudio_Criativo SHALL restaurar `objetivo`, `templateId`, `dadosAtuais` e `mensagens[]` exatamente como foram salvos, em até 2 segundos.
5. IF a restauração falha por dados corrompidos ou timeout de 2 segundos, THEN THE Estudio_Criativo SHALL exibir mensagem observável de erro, preservar o Historico_Conversas navegável, e não SHALL substituir a Sessao_Conversa ativa anterior.
6. IF o Store_Pedidos recebe leitura de Sessao_Conversa cujo `criadoPor` não corresponde ao corretor autenticado, THEN THE Store_Pedidos SHALL rejeitar a leitura retornando erro observável de autorização sem expor nenhum campo da sessão solicitada.
7. WHEN o corretor pede para duplicar uma Sessao_Conversa existente, THE Store_Pedidos SHALL criar uma nova Sessao_Conversa com novo `id`, `criadoEm` igual ao momento atual, `criadoPor` igual ao corretor autenticado, `mensagens[]` vazio, e `objetivo`, `templateId`, `dadosAtuais` idênticos à sessão de origem.
8. WHILE o Historico_Conversas contém mais de 50 sessões para o corretor autenticado, THE Estudio_Criativo SHALL paginar em blocos de 20 e carregar cada bloco adicional sob demanda em até 2 segundos.
9. IF a chamada ao Store_Pedidos para criar ou atualizar uma Sessao_Conversa falha, THEN THE Estudio_Criativo SHALL manter o rascunho local em memória, tentar novamente em intervalos exponenciais (2s, 4s, 8s, 16s, 32s, 60s, até 8 tentativas) e exibir indicador visual "rascunho não salvo" até o sucesso.

### Requirement 5: Preview 3D interativo

**User Story:** Como corretor, quero que o preview pareça um cartão físico que reage quando passo o mouse ou o dedo, para que o processo de criar seja prazeroso e não pareça um formulário.

#### Acceptance Criteria

1. THE Preview_3D SHALL renderizar o criativo com perspectiva CSS entre 800px e 1200px de forma que o card pareça ter profundidade sem distorção do texto.
2. WHEN o cursor do mouse se move dentro do Preview_3D em desktop, THE Preview_3D SHALL inclinar o card proporcionalmente à posição do cursor com inclinação máxima de 6 graus em cada eixo, atualizando a inclinação em até 16ms por evento (para sustentar 60fps).
3. WHEN o dedo do usuário se move sobre o Preview_3D em dispositivo touch, THE Preview_3D SHALL inclinar o card proporcionalmente à posição do toque com o mesmo limite de 6 graus e a mesma latência máxima de 16ms.
4. WHEN o cursor sai do Preview_3D em desktop OR WHEN o toque termina em touch, THE Preview_3D SHALL retornar o card à posição neutra (0 graus em ambos os eixos) em animação de mola do Framer Motion com duração entre 200ms e 400ms.
5. WHILE o cursor está posicionado sobre o Preview_3D, THE Preview_3D SHALL aplicar efeito de elevação com sombra ampliada e translação vertical entre 4px e 8px, iniciando a transição em até 150ms.
6. WHEN o corretor troca de Variacao_Formato dentro da mesma Sessao_Conversa, THE Preview_3D SHALL animar a transição entre os dois formatos com duração entre 300ms e 500ms, mantendo o texto principal legível durante toda a transição.
7. WHERE `prefers-reduced-motion` está ativo no sistema do usuário, THE Preview_3D SHALL desativar a transição de troca de formato e o efeito de elevação por hover, preservando a inclinação por gesto de mouse ou toque como resposta imediata à intenção do corretor.
8. THE Preview_3D SHALL manter fluidez de renderização acima de 55fps por janelas contínuas de 100ms para gestos contínuos em navegador desktop atualizado (Chrome, Firefox, Safari e Edge nas duas versões mais recentes).
9. IF o dispositivo não suporta perspectiva CSS 3D OR IF a média de fps cai abaixo de 30 por mais de 500ms contínuos, THEN THE Preview_3D SHALL desativar automaticamente a inclinação e a elevação, exibindo o card em modo estático 2D, e registrar aviso interno de degradação.

### Requirement 6: Preview em Tempo Real

**User Story:** Como corretor, quero que qualquer coisa que eu digite ou solte no criativo apareça na hora no preview, para que eu sinta que estou desenhando ao vivo, como no Figma.

#### Acceptance Criteria

1. WHEN o corretor edita um campo do criativo por formulário ou por Comando_Natural, THE Painel_Preview_Vivo SHALL refletir a mudança dentro do limite definido pela Latencia_Preview.
2. THE Latencia_Preview SHALL ser inferior a 100ms no percentil 95 para alterações em campos de texto, em navegador desktop atualizado.
3. THE Latencia_Preview SHALL ser inferior a 250ms no percentil 95 para alterações em campos de foto após o carregamento do arquivo local, para fotos até 8MB nos formatos `image/jpeg`, `image/png` e `image/webp`.
4. THE Painel_Preview_Vivo SHALL manter o preview inalterado enquanto o corretor não executa nenhuma alteração de dados. (correctness property — idempotência da renderização)
5. WHEN o corretor aplica ao mesmo campo a mesma alteração pela segunda vez em sequência, THE Painel_Preview_Vivo SHALL produzir uma imagem final pixel a pixel idêntica à primeira aplicação, na mesma resolução do template ativo. (correctness property — determinismo da renderização)
6. IF o carregamento de uma foto local falha por tipo inválido, tamanho maior que 8MB ou erro de leitura, THEN THE Painel_Preview_Vivo SHALL exibir o placeholder de foto do template E THE Chat_IA SHALL registrar um aviso descritivo ao corretor, ambas as ações sendo obrigatórias para considerar a falha tratada.
7. IF uma das duas ações do tratamento de falha de foto não é concluída em até 2 segundos, THEN THE Estudio_Criativo SHALL registrar um erro interno de sistema para análise posterior e concluir a segunda ação de forma síncrona antes de aceitar novas edições.
8. WHEN um dado do criativo é inválido para o template atual, THE Painel_Preview_Vivo SHALL preservar a última renderização válida E destacar o campo problemático com marcador visual observável (contorno ou ícone), sem substituir o preview por estado de erro.

### Requirement 7: Templates Inteligentes com Variações

**User Story:** Como corretor, quero pegar um template que gostei e ver o mesmo texto vira post, carrossel, story e capa de reel sem que eu precise refazer, para postar em vários lugares com a mesma cara.

#### Acceptance Criteria

1. THE Registro_Templates SHALL manter compatibilidade com os 5 templates React existentes (`carrossel-aluguel`, `imovel-destaque`, `prestacao-vs-aluguel`, `story-foto-grande`, `guia-bairro`) preservando seus identificadores como imutáveis.
2. THE Registro_Templates SHALL permitir que cada Template_Inteligente declare entre 1 e 5 Variacoes_Formato dentro do conjunto fechado (`post`, `carrossel`, `story`, `banner`, `reel-cover`), rejeitando valores fora desse conjunto.
3. WHEN o corretor visualiza um Template_Inteligente, THE Estudio_Criativo SHALL listar todas as Variacoes_Formato declaradas com miniatura de preview visível em até 2 segundos.
4. WHEN o corretor troca a Variacao_Formato ativa, THE Painel_Preview_Vivo SHALL usar os mesmos `dadosAtuais` da Sessao_Conversa para renderizar o novo formato em até 1 segundo.
5. FOR ALL variações do mesmo Template_Inteligente com os mesmos `dadosAtuais`, THE Painel_Preview_Vivo SHALL preservar as seguintes propriedades da Identidade_Visual entre elas: paleta oficial, tipografia por papel (Inter/Manrope/Playfair), logotipo, assinatura de CRECIs, handle, texto principal e valores numéricos, sem divergência entre variações. (correctness property — invariante de identidade visual entre variações)
6. IF um Template_Inteligente não declara uma determinada Variacao_Formato, THEN THE Estudio_Criativo SHALL renderizar a opção correspondente em estado desabilitado com tooltip explicando o motivo, ao invés de omiti-la silenciosamente.
7. IF a renderização de uma miniatura ou da Variacao_Formato ativa falha por dados inválidos ou erro de recurso, THEN THE Estudio_Criativo SHALL exibir marcador visual de erro no lugar da miniatura, preservar as demais variações navegáveis, e registrar aviso interno.

### Requirement 8: Motor de Carrossel Inteligente

**User Story:** Como corretor, quero clicar em "criar carrossel" e o sistema me perguntar só o objetivo, e depois ele monta todos os slides sozinho, para eu só ajustar o que quiser.

#### Acceptance Criteria

1. WHEN o corretor seleciona Objetivo_Criativo `educativo`, `mercado`, `institucional`, `campanha` ou `lancamento`, THE Motor_Carrossel SHALL exibir exatamente uma pergunta ao corretor solicitando o subobjetivo do carrossel, apresentando a lista completa de subobjetivos válidos definidos no critério 2 como opções selecionáveis, em até 2 segundos após a seleção do Objetivo_Criativo.
2. THE Motor_Carrossel SHALL aceitar como subobjetivos válidos exclusivamente os seguintes valores: `vender-imovel`, `captar-clientes`, `ensinar`, `autoridade`, `financiamento`, `mercado-bairro`.
3. IF o corretor submete um subobjetivo cujo valor não pertence à lista definida no critério 2, THEN THE Motor_Carrossel SHALL rejeitar a submissão, preservar o estado anterior sem gerar slides, e exibir aviso no Chat_IA indicando que o subobjetivo é inválido e listando os valores aceitos.
4. WHEN o subobjetivo é definido com um valor válido, THE Motor_Carrossel SHALL gerar uma lista ordenada contendo entre 3 e 10 slides em até 5 segundos, antes que o corretor precise editar qualquer campo.
5. WHERE o subobjetivo é `ensinar` aplicado ao tema "primeiro imóvel", THE Motor_Carrossel SHALL gerar exatamente 5 slides com os identificadores `titulo`, `entrada`, `documentacao`, `financiamento`, `cta`, nessa ordem, sem slides adicionais e sem omissões.
6. WHERE o subobjetivo é `mercado-bairro`, THE Motor_Carrossel SHALL gerar exatamente 5 slides com os identificadores `titulo`, `preco-medio`, `valorizacao`, `oportunidade`, `cta`, nessa ordem, sem slides adicionais e sem omissões.
7. THE Motor_Carrossel SHALL ser determinístico, garantindo que para o mesmo par (subobjetivo, dados iniciais) a lista ordenada de slides gerada seja idêntica em identificadores, quantidade e ordem em execuções repetidas. (correctness property — determinismo da geração de carrossel)
8. WHEN a lista de slides é apresentada, THE Estudio_Criativo SHALL permitir ao corretor editar o texto de cada slide (limite de 500 caracteres por campo de texto), reordenar slides via arrasto e remover slides individuais, refletindo cada alteração na lista em até 1 segundo.
9. IF o corretor remove todos os slides da lista, THEN THE Motor_Carrossel SHALL restaurar automaticamente apenas o slide de `titulo` na primeira posição em até 1 segundo, e exibir aviso no Chat_IA indicando que a lista não pode ficar vazia e que o slide `titulo` foi restaurado.

### Requirement 9: Biblioteca de Componentes (Blocos)

**User Story:** Como corretor, quero arrastar um selo de "novo lançamento", um QR Code, um botão de WhatsApp ou meu CRECI direto sobre o preview, para não depender só de templates fechados.

#### Acceptance Criteria

1. THE Biblioteca_Componentes SHALL disponibilizar, no mínimo, os seguintes tipos de Bloco identificados de forma única: `selo`, `preco`, `qr-code`, `mapa`, `localizacao`, `botao-whatsapp`, `creci`, `logo`, `assinatura`, `icone`.
2. WHEN o corretor arrasta um Bloco sobre a área visível do Painel_Preview_Vivo e solta, THE Estudio_Criativo SHALL adicionar o Bloco à posição solta em até 500ms, com feedback visual observável durante o arrasto, e permitir movimentação subsequente com granularidade mínima de 1px.
3. IF o corretor solta um Bloco fora da área visível do Painel_Preview_Vivo, THEN THE Estudio_Criativo SHALL rejeitar o drop, retornar o Bloco à Biblioteca_Componentes com animação de reversão em até 300ms, e não SHALL adicionar o Bloco ao criativo.
4. WHERE o Bloco `qr-code` é adicionado, THE Estudio_Criativo SHALL gerar o QR Code a partir da URL de contato configurada nas preferências do corretor autenticado; IF a URL não está configurada, THEN THE Estudio_Criativo SHALL abortar o drop e exibir aviso no Chat_IA pedindo pra configurar a URL antes.
5. WHERE o Bloco `botao-whatsapp` é adicionado, THE Estudio_Criativo SHALL preencher automaticamente o número do corretor autenticado; IF o número não está configurado, THEN THE Estudio_Criativo SHALL abortar o drop e exibir aviso no Chat_IA.
6. WHERE o Bloco `creci` é adicionado, THE Estudio_Criativo SHALL usar as strings oficiais `Patrícia Vidal · CRECI 68850` e `Júlio Aguiar · CRECI 79271` sem permitir edição no editor de texto do Bloco.
7. WHEN o corretor solta um Bloco em posição cuja bounding box sobrepõe outro Bloco existente, THE Estudio_Criativo SHALL empilhar o novo acima com Z-index observável maior, e permitir reordenar Z-index via menu de contexto.
8. IF o número de Blocos por Variacao_Formato ativa alcança 50, THEN THE Estudio_Criativo SHALL rejeitar novos drops com aviso no Chat_IA e não SHALL adicionar mais Blocos até que um seja removido.
9. THE Estudio_Criativo SHALL persistir a lista de Blocos adicionados no `dadosAtuais` da Sessao_Conversa junto com sua posição (x, y em pixels), escala (entre 0.25 e 3.0), rotação (entre -180° e 180°) e Z-index, em até 1 segundo após cada alteração.
10. WHEN o corretor troca a Variacao_Formato ativa, THE Estudio_Criativo SHALL reposicionar cada Bloco proporcionalmente às novas dimensões do preview, garantindo que 100% da bounding box de cada Bloco permaneça visível dentro da nova área.

### Requirement 10: Motor de Variações (mesma identidade em múltiplos formatos)

**User Story:** Como corretor, quero gerar de uma vez as versões feed, carrossel, story e capa de reel do mesmo criativo, para postar em todo lugar com a mesma cara.

#### Acceptance Criteria

1. WHEN o corretor solicita "gerar todas variações" a partir de um criativo finalizado, THE Motor_Variacoes SHALL produzir renderizações para cada Variacao_Formato declarada pelo Template_Inteligente ativo, nas dimensões oficiais de cada formato (post `1080x1080`, carrossel slide `1080x1350`, story `1080x1920`, banner `1200x628`, reel-cover `1080x1920`).
2. THE Motor_Variacoes SHALL concluir cada renderização de variação em até 30 segundos; IF uma renderização excede 30 segundos, THEN THE Motor_Variacoes SHALL abortá-la, marcar a variação como "não disponível" com causa "timeout", e continuar com as demais.
3. FOR ALL variações produzidas em uma única execução do Motor_Variacoes, THE Motor_Variacoes SHALL preservar exatamente a paleta oficial (navy `#2F4156`, teal `#567C8D`, sky `#C8D9E6`, beige `#F5EFEB`) sem substituição, aproximação ou alteração de tom entre variações. (correctness property — invariante de paleta)
4. FOR ALL variações produzidas em uma única execução do Motor_Variacoes, THE Motor_Variacoes SHALL preservar exatamente a assinatura de CRECIs (`Patrícia Vidal · CRECI 68850`, `Júlio Aguiar · CRECI 79271`) e o handle `@julio_e_patricia_corretores` do criativo original, com grafia idêntica caractere a caractere. (correctness property — invariante de identidade dos corretores)
5. FOR ALL variações produzidas em uma única execução do Motor_Variacoes, THE Motor_Variacoes SHALL preservar o texto principal (gancho/título) e os valores numéricos (preço, área, aluguel, prestação) do criativo original, com grafia idêntica caractere a caractere. (correctness property — invariante de conteúdo)
6. WHEN o Template_Inteligente ativo declara N Variacoes_Formato onde N está entre 1 e 10, THE Motor_Variacoes SHALL produzir exatamente N renderizações na mesma ordem declarada.
7. WHEN o Motor_Variacoes conclui, THE Estudio_Criativo SHALL exibir todas as variações lado a lado com opção de exportar individualmente ou em Pacote_Exportacao.
8. IF a renderização de uma variação falha por dados inválidos, timeout ou erro de recurso, THEN THE Motor_Variacoes SHALL registrar no Chat_IA uma mensagem indicando qual formato falhou e a causa (dados inválidos / timeout / erro de recurso), marcar essa variação como "não disponível" no painel, e continuar produzindo as demais variações sem interromper.
9. IF todas as variações da execução falham, THEN THE Motor_Variacoes SHALL exibir no painel um estado de erro consolidado com opção de tentar novamente, e não SHALL apresentar nenhuma opção de exportação.

### Requirement 11: Exportação Múltipla

**User Story:** Como corretor, quero baixar meu criativo em PNG para o Instagram, JPG para WhatsApp ou PDF para email, individualmente ou em lote, para não perder tempo convertendo depois.

#### Acceptance Criteria

1. WHEN o corretor solicita exportação, THE Exportador SHALL oferecer os formatos `png`, `jpg` e `pdf`.
2. WHEN o corretor exporta a Variacao_Formato ativa em `png`, THE Exportador SHALL gerar arquivo com dimensões exatas declaradas pelo template com 0px de tolerância, e alpha channel conforme declaração do template.
3. WHEN o corretor exporta em `jpg`, THE Exportador SHALL gerar arquivo com qualidade entre 92 e 95 (escala 0-100), sem alpha channel.
4. WHEN o corretor exporta um carrossel em `pdf`, THE Exportador SHALL gerar um único arquivo `.pdf` contendo todos os slides na ordem original, uma página por slide.
5. WHEN o corretor exporta um post único em `pdf`, THE Exportador SHALL gerar um único arquivo `.pdf` com exatamente uma página.
6. WHEN o corretor exporta múltiplas Variacoes_Formato do mesmo criativo em uma operação, THE Exportador SHALL agrupar os arquivos em um Pacote_Exportacao `.zip` nomeado `{objetivo}-{templateId}-{timestamp}` (timestamp UTC `YYYYMMDDTHHmmss`), entregue ao corretor em até 30 segundos.
7. WHEN os arquivos exportados chegam ao download do corretor com sucesso, THE Exportador SHALL considerar a operação bem-sucedida independentemente do resultado da criação do PedidoCriativo no Store_Pedidos, E THE Estudio_Criativo SHALL solicitar ao Store_Pedidos o registro do PedidoCriativo em segundo plano com `status = pronto`, preservando gancho, bairro, tipo e briefing conforme o schema atual da API `/api/marketing/pedidos`. (correctness property — round-trip preview → arquivo → histórico)
8. IF a criação do PedidoCriativo no Store_Pedidos falha, THEN THE Estudio_Criativo SHALL tentar novamente em intervalos exponenciais (1s, 2s, 4s, 8s, 16s, com teto de 60s, máximo 5 tentativas) e sinalizar no Chat_IA que o arquivo foi baixado mas ainda não apareceu no histórico.
9. IF as 5 tentativas do critério 8 se esgotam sem sucesso, THEN THE Estudio_Criativo SHALL exibir aviso permanente no Chat_IA com opção manual de "salvar no histórico agora" e não SHALL bloquear outras operações do corretor.
10. IF a captura do preview falha, THEN THE Exportador SHALL exibir mensagem descritiva no Chat_IA, restaurar o Painel_Preview_Vivo ao estado anterior à tentativa, e não SHALL criar registro no Store_Pedidos para essa tentativa.
11. THE Exportador SHALL sempre preservar dimensões finais em pixels e proporção declaradas pelo template original, independentemente da escala usada no Painel_Preview_Vivo.

### Requirement 12: Qualidade Visual e Microinterações

**User Story:** Como corretor, quero uma interface que pareça um estúdio criativo profissional, não um dashboard, para me orgulhar da ferramenta que estou usando.

#### Acceptance Criteria

1. THE Estudio_Criativo SHALL usar as fontes Inter, Manrope e Playfair conforme o papel tipográfico declarado por template, com fallback para as fontes de sistema equivalentes se as fontes web não carregarem em até 3 segundos.
2. THE Estudio_Criativo SHALL usar exclusivamente as cores da paleta oficial (navy `#2F4156`, teal `#567C8D`, sky `#C8D9E6`, beige `#F5EFEB`) em superfícies, texto e bordas da UI, rejeitando qualquer valor de cor fora dessa lista em elementos de chrome (excluído conteúdo dos criativos do usuário).
3. THE Estudio_Criativo SHALL aplicar microinteração observável em todo botão interativo, cobrindo os estados `hover`, `active` e `focus-visible`, com duração de transição entre 100ms e 300ms e ao menos uma propriedade visual mudando por estado.
4. WHILE o corretor faz scroll, arrasta um Bloco ou inclina o Preview_3D, THE Estudio_Criativo SHALL manter uma taxa de renderização de pelo menos 60 fps medida em janela deslizante de 1 segundo, com no máximo 2 quedas abaixo de 55fps por minuto de interação contínua em navegador desktop atualizado.
5. WHERE `prefers-reduced-motion` está ativo, THE Estudio_Criativo SHALL desativar animações não essenciais (troca de formato, elevação por hover, animações decorativas), preservando transições de estado de botão com duração reduzida (≤100ms).
6. THE Estudio_Criativo SHALL manter contraste mínimo WCAG 2.1 AA para texto sobre superfícies coloridas (4.5:1 para texto normal com tamanho menor que 18pt / 14pt bold, 3:1 para texto grande igual ou maior).
7. WHERE o dispositivo tem viewport menor ou igual a 768px, THE Estudio_Criativo SHALL preservar a paleta oficial, permitindo ajuste proporcional de tamanho tipográfico entre 87.5% e 100% e simplificação de microinterações limitadas a duração ≤150ms.
8. IF uma ou mais das fontes Inter, Manrope ou Playfair falham em carregar em até 3 segundos, THEN THE Estudio_Criativo SHALL continuar renderizando com fallback do sistema, registrar aviso interno de degradação, e não SHALL bloquear o corretor de continuar editando.

### Requirement 13: Reestruturação do Módulo Marketing

**User Story:** Como corretor, quero abrir `/painel/marketing` e ver o estúdio criativo já como coração da tela, não como um botão escondido, para começar a criar em um clique.

#### Acceptance Criteria

1. WHEN o corretor abre `/painel/marketing`, THE Modulo_Marketing SHALL exibir o Seletor_Objetivo como elemento central da página inicial em até 3 segundos.
2. THE Modulo_Marketing SHALL preservar a área de KPIs com exatamente 4 indicadores (pendentes, gerando, prontos, publicados) exibindo valores numéricos entre 0 e 999.
3. THE Modulo_Marketing SHALL manter o Historico_Conversas acessível a partir da home do módulo via botão visível permanente, abrindo em até 2 segundos.
4. THE Modulo_Marketing SHALL manter a compatibilidade completa com a API existente `/api/marketing/pedidos` para leitura via `GET` e criação via `POST` de PedidoCriativo, preservando os campos e a estrutura de resposta atuais.
5. WHEN o corretor acessa uma rota antiga do módulo (`/painel/marketing/estudio` com modo `ultra`, `rapido`, `catalogo` ou `templates`), THE Modulo_Marketing SHALL redirecionar para o Seletor_Objetivo em até 2 segundos, carregando o Objetivo_Criativo mapeado (`ultra`/`rapido` → objetivo mais recente do corretor ou `imovel`, `catalogo` → `imovel`, `templates` → escolha manual).
6. IF o Seletor_Objetivo não consegue carregar após o redirecionamento em até 5 segundos, THEN THE Modulo_Marketing SHALL exibir uma página de erro dedicada contendo mensagem descritiva, botão "recarregar" que preserva a rota tentada, e link direto para o histórico de pedidos.
7. THE Modulo_Marketing SHALL manter o Chat_IA acessível a partir de qualquer sub-rota do módulo via botão flutuante fixo no canto inferior direito, abrindo em até 1 segundo.

### Requirement 14: Round-trip e integridade de dados entre camadas

**User Story:** Como sistema, quero garantir que o criativo que aparece no preview é exatamente o mesmo que vai para o arquivo exportado e para o histórico, para que o corretor nunca receba surpresa depois de baixar.

#### Acceptance Criteria

1. FOR ALL Sessoes_Conversa lidas do Store_Pedidos, THE Estudio_Criativo SHALL reproduzir no Painel_Preview_Vivo uma renderização com no máximo 1% de pixels distintos em comparação pixel a pixel com o pixel renderizado no momento do save, na mesma resolução do template ativo, se os campos `objetivo`, `templateId` e `dadosAtuais` não tiverem sido alterados. (correctness property — round-trip persistência)
2. FOR ALL PedidoCriativo criados pelo Exportador, THE Store_Pedidos SHALL registrar `bairro`, `gancho`, `tipo` e `briefing` idênticos byte a byte (incluindo espaços e acentuação) aos valores presentes na Sessao_Conversa origem no momento da exportação. (correctness property — round-trip export ↔ histórico)
3. WHEN o corretor edita manualmente um campo já extraído pelo Motor_IA, THE Estudio_Criativo SHALL marcar o campo com origem `manual`, E WHEN o corretor envia novo Comando_Natural que não referencia explicitamente esse campo, THE Motor_IA SHALL preservar o valor manualmente editado sem sobrescrever. (correctness property — prioridade de edição manual sobre extração)
4. IF a Sessao_Conversa ativa tem alterações não persistidas por mais de 5 segundos, THEN THE Estudio_Criativo SHALL salvar automaticamente no Store_Pedidos e exibir indicador visual observável de "salvo" em até 1 segundo após o sucesso.
5. IF a chamada ao Store_Pedidos falha em uma tentativa de save automático, THEN THE Estudio_Criativo SHALL manter o rascunho em memória, exibir indicador visual "rascunho não salvo", tentar novamente em intervalos exponenciais (2s, 4s, 8s, 16s, 32s, 60s, dobrando até o teto de 60s com no máximo 8 tentativas) sem bloquear a edição.
6. IF as 8 tentativas do critério 5 se esgotam sem sucesso, THEN THE Estudio_Criativo SHALL exibir mensagem observável de falha permanente, oferecer opção manual de "tentar salvar agora", e preservar o rascunho em memória até o corretor sair da sessão do navegador.
