# iCine — documento de passagem de bastão para outra IA

> Atualizado em **25/10/2026**. Escrito para uma IA que vai continuar o projeto sem ter visto as conversas anteriores.
> Antes de editar qualquer coisa, **confira o estado real dos arquivos**: este documento pode ficar desatualizado.
> O arquivo `CLAUDE.md` (mesma pasta) é o diário técnico detalhado, com um parágrafo por decisão e por armadilha. Leia os dois.

---

## 0. Como começar (leia primeiro)

**Quem é o usuário:** fala **português do Brasil**, **não é programador**. Explique em passos simples, sem jargão.
Ele faz o trabalho de publicação sozinho (Replit) e roda os SQLs sozinho (Supabase). Peça confirmação antes de qualquer coisa destrutiva.

**Como ele gosta de trabalhar:**
- pede **ajustes pequenos, um de cada vez**;
- para mudanças maiores, gosta de **ver um protótipo (imagem) antes** de aprovar ("vamos planejar antes de fazer");
- visual **minimalista**, ações com ícones, nada poluído; roxo com fundo escuro é a identidade;
- fala sempre "faça um protótipo" ou "faça um print" quando quer ver antes.

**Ordem de leitura sugerida para a IA:**
1. Este arquivo (visão geral, mapa do código, regras).
2. `CLAUDE.md` (detalhes e armadilhas por assunto).
3. `index.html` — use a busca por `=== BLOCO:` para pular direto para o assunto (mapa na seção 4).
4. `novo-visual.css` e a pasta `migrations/`.

**Fluxo de trabalho combinado:** editar → testar localmente → commit → **enviar direto para o `main`** (o usuário deu permissão permanente: juntar com o `main` antes, sem forçar, sem perguntar) → o usuário faz **Pull → Run → Republicar** no Replit.

---

## 1. O que é o produto

**iCine** é um **diário de filmes e séries social**, em formato PWA (site instalável no celular), usado no celular e no computador.
A ambição do usuário é transformá-lo numa **rede social de filmes e séries**: pessoas mostram seu gosto, recomendam e descobrem títulos.

O que já existe:
- **Listas** pessoais: Quero Assistir, Assistidos e Playlists (públicas ou privadas); busca por título.
- **Explorar**: catálogo TMDB com filtros, Top 10 por streaming, alternância Filmes/Séries.
- **Cenas**: feed vertical de vídeos curtos (estilo Reels) com curtidas e comentários.
- **Roleta**: sorteio de um filme ou série por gênero/streaming, ou **só da sua lista Quero Assistir**.
- **Feed**: avaliações de todos (amigos primeiro), com curtidas; e playlists públicas.
- **Perfil social completo** (tela cheia): capa, foto, frase, números, **Top 5 filmes e Top 5 séries**, **favoritos do cinema** (atriz, ator, diretor), abas Assistidos/Avaliações/Playlists/Quero ver, % de gosto em comum.
- **Amigos**: pedido, aceitar/recusar, lista, busca por @, recomendações recebidas, **avisos no celular (Web Push)**.
- **Detalhes** do título: trailer de fundo (prioriza dublado pt-BR), sinopse/avaliações em abas, onde assistir oficialmente, **elenco e direção** (fila de fotos clicáveis → tela da pessoa).
- **Chat com IA** cinéfila (Groq).
- Séries: assistir por temporada/episódio.

Navegação: barra inferior **Listas, Explorar, Cenas, Roleta, Feed**. No cabeçalho, a **foto do usuário** abre o perfil dele; o botão **Amigos** fica dentro do perfil.

---

## 2. Estrutura do repositório

```text
/
├── index.html            App inteiro: HTML + CSS + JS (≈ 5.500 linhas). Sem build.
├── novo-visual.css       Camada do "visual novo" (prefixo html.novo). É o padrão desde 18/10.
├── avatares.js           Lista de fotos de perfil prontas (AVATARES_PRONTOS). Ver seção 9.
├── avatares/             Imagens dessa lista (LEIA-ME.txt explica o formato).
├── version.json          {"versao": "..."}; precisa ser IGUAL ao VERSAO_APP do index.html.
├── manifest.json         PWA (ícone icon-512.png: ver seção 11).
├── service-worker.js     Antigo; o app apaga service workers antigos ao abrir.
├── sw-push.js            Único service worker que fica: só recebe avisos push (sem cache).
├── migrations/           SQLs do Supabase em ordem de data. O usuário roda no SQL Editor.
├── supabase/functions/enviar-push/   Edge Function do Web Push (index.ts + LEIA-ME.md).
├── supabase_social.sql   SQL inicial (perfis, amizades, políticas de meus_filmes).
├── admin/index.html      Painel administrativo simples.
├── testes/               Ferramentas de teste (mock do Supabase). Ver seção 8.
├── attached_assets/      Imagens e textos colados pelo usuário em conversas antigas.
├── CLAUDE.md             Diário técnico (para a IA anterior; vale ler).
└── .replit               Replit: python3 -m http.server 5000; deploy estático, raiz = pasta pública.
```

**Execução local:** `python3 -m http.server 5000` na raiz. **Não há** package.json, testes automáticos oficiais nem pipeline de build.

---

## 3. Arquitetura e regras de ouro

- **App de um arquivo só** (`index.html`, JavaScript puro, sem framework). Não divida nem migre para framework sem pedido explícito.
- **Backend:** Supabase (login por e-mail e senha, tabelas, RLS, storage, Edge Function). **Dados de filmes:** TMDB. **IA:** Groq.
- **Chave interna de um título:** filme = **número do TMDB**; série = **`'tv:<id>'`**. Funções: `chaveDaLinha`, `normalizarChave`, `partesDaChave`, `conteudoDaLinha`.
- **Cache dos detalhes:** `bancoDeFilmesLocal` (Map). `abrirDetalhes(id)` só abre se o título já estiver nesse mapa; quem abre os detalhes precisa registrar o título antes.
- **Atualização do app instalado:** a **CADA mudança do app**, troque `VERSAO_APP` (no `index.html`) **e** `version.json` para o **mesmo valor** (ex.: `2026-10-25.1`). Se mudar `novo-visual.css`, suba também o `?v=N` do link do CSS. Esquecer = o app instalado não atualiza.
- **Visual novo:** tudo escopado em `html.novo`. Saída de emergência: `?visual=antigo` (volta com `?visual=novo`).
- **Janelas (modais):** abrir com `abrirModalSeguro(id)`, fechar com `fecharModalSeguro(id)` (integram com o botão voltar do celular). Para abrir uma janela logo depois de fechar outra, use `fecharModalEDepois` (o "voltar" é assíncrono). Pilha de z-index: perfil 2400 → amigos 2420 → top5/favorito 2440 → avatares/bio 2450 → detalhes 2800 → **pessoa 2850** → stremio 3500 → cinema 3800.
- **`position: fixed` dentro de janelas:** `backdrop-filter`, `transform` ou `filter` num ancestral "prendem" o `fixed` a ele. Por isso `.modal` não usa `backdrop-filter` no visual novo.
- **Teclado do celular:** `--vvh` (visualViewport) limita o chat da IA. Qualquer janela nova com campo de texto deve usar a mesma ideia.
- **Emojis:** nas telas redesenhadas foram trocados por ícones SVG de linha. Em telas novas, ícones SVG; emoji só em texto de conteúdo.
- **Segurança de HTML:** muito HTML é montado com template strings. Use `escaparHTML()` em tudo que vier de usuário/TMDB antes de `innerHTML`. Não ponha texto de usuário dentro de `onclick`.
- **Rolagem:** `mudarAba()` começa com `window.scrollTo(0, 0)`.

---

## 4. Mapa do `index.html` (procure por `=== BLOCO:`)

| Bloco | O que contém |
|---|---|
| CONFIGURAÇÕES E ESTADO GLOBAL | Cliente Supabase, chaves, `URL_BASE`, `IMG_BASE`, variáveis globais, `abrirModalSeguro`/`fecharModalSeguro`, `limparCopiaAntiga`, `VERSAO_APP` |
| JS AUTENTICAÇÃO (LOGIN) | `checarSessao`, login/cadastro/sair; depois do login carrega listas, playlists, Explorar, Top 10, perfil, push |
| JS NAVEGAÇÃO DE ABAS | `mudarAba(abaId)` (`'amigos'` abre a janela de Amigos) |
| JS ABA EXPLORAR & PESQUISA | `aplicarFiltros`, toggle Filmes/Séries |
| JS TOP 10 STREAMINGS | `carregarTop10`, logos de streaming |
| JS DESENHAR CARDS (GRIDS) | `gerarCartaoFilmeHTML`, `renderScoreBadge`, folha de ações dos cards |
| JS MINHAS LISTAS E SUPABASE | `carregarFilmesDaNuvem`, `renderizarMinhasListas`, `salvarNoGrupo`, `moverFilme`, `minhasNotasAval` |
| JS PLAYLISTS | criar/editar/abrir, busca dentro da playlist |
| JS MODAL DETALHES DO FILME | `abrirDetalhes`, `carregarElencoDetalhes`, onde assistir, trailer, botões de assistir |
| JS CENAS (NATIVO HTML5) | feed vertical, `curtirCena`, `enviarCena` |
| JS COMENTÁRIOS NAS CENAS | comentários das cenas |
| JS AMIGOS E REDE SOCIAL | `verificarPerfil`, `carregarAmigos`, `renderizarAbaAmigos`, `pedirAmizade`/`enviarPedido`, caixa de entrada de recomendações |
| JS PERFIL DO USUÁRIO | `abrirPerfil`, Top 5 (arrastar), favoritos, `abrirPessoa`, capa, frase, fotos prontas, tela de Amigos |
| JS COMUNIDADE (FEED PÚBLICO) | playlists públicas |
| JS AVISOS NO CELULAR (WEB PUSH) | inscrição, `atualizarCardPush`, `sincronizarPush` |
| JS FOTO DE PERFIL | troca de foto, `avatarHTML`/`avatarConteudo` |
| JS FEED AVALIAÇÕES | janela de avaliar, curtidas, feed de avaliações, aba Avaliações nos detalhes |
| JS ROLETA | IIFE `roleta` (funil, roda em canvas, botão Girar, "Minha lista") |
| JS CHAT IA (GROQ) | chat flutuante (`#btn-chat-fab`, arrastável na vertical) |

Os blocos de CSS começam com `/* ... CSS ... */` no `<style>` e correspondem às mesmas áreas.

---

## 5. Banco de dados (Supabase)

**Tabelas que o código usa hoje:** `perfis`, `meus_filmes`, `playlists`, `amizades`, `avaliacoes`, `avaliacao_curtidas`, `recomendacoes_amigos`, `cenas_shorts`, `radar_curado`, `push_subscriptions`. **Storage:** bucket público `capas` (capas de playlist, fotos de perfil, capas de perfil). **Funções RPC:** `contar_amigos(alvo)`, `registrar_push`.

Colunas principais (confira o schema real no Supabase antes de migrar algo):

- `perfis`: `user_id` (único), `username` (único), `foto_url`, `created_at`, **`capa_url`, `top_filmes` (jsonb), `top_series` (jsonb), `favoritos` (jsonb), `bio` (até 120 caracteres)**.
  - `top_*`: lista de `{id, titulo, ano, capa, sinopse}` na ordem escolhida.
  - `favoritos`: `{atriz|ator|diretor: {id, nome, foto}}` (ids do TMDB).
- `meus_filmes`: `user_id`, `tmdb_id`, `tipo` (`filme`/`serie`), `titulo`, `ano`, `nota`, `capa`, `sinopse`, `grupo` (`quero` ou `ja`).
- `avaliacoes`: uma por `(user_id, tmdb_id, tipo)`; nota 0–10; comentário até 280.
- `amizades`: `solicitante_id`, `destinatario_id`, `status` (`pendente`/`aceite`); índice único do par.
- `playlists`: `user_id`, `nome`, `capa_url`, `filmes` (array JSON), `publica`, `curtidas`.

**Decisão de privacidade (18/10):** qualquer usuário logado pode **ler as listas** (`meus_filmes`) de qualquer outro, para poder abrir o perfil sem ser amigo. Só as **playlists públicas** aparecem para os outros. `contar_amigos` devolve só o número, sem revelar quem. Escrita continua só do dono.

**Regra crítica:** a tela "Minhas Listas" **sempre** filtra `.eq('user_id', usuarioAtual.id)`. Como as listas de todos são legíveis, esquecer esse filtro mistura filmes de outras pessoas na sua lista (já aconteceu uma vez). Alterações e remoções também filtram por usuário.

### SQLs, em ordem (pasta `migrations/`)

```text
2026-10-01_tipo_em_meus_filmes.sql
2026-10-01_tipo_em_recomendacoes.sql
2026-10-05_avaliacoes.sql
2026-10-05_foto_perfil.sql
2026-10-11_curtidas_avaliacoes.sql
2026-10-12_amizades_sem_duplicados.sql
2026-10-13_push_notificacoes.sql      (tem o marcador COLE_AQUI_O_SEGREDO: nunca commitar o valor real)
2026-10-18_perfil_publico.sql
2026-10-19_perfil_personalizado.sql
2026-10-20_bio_perfil.sql
```

**Confirme com o usuário quais já foram rodados** (só ele tem acesso ao painel do Supabase). Sem o de 19/10, o perfil abre mas salvar capa/Top 5/favoritos falha com aviso; sem o de 20/10, a frase não salva.
A IA **não tem acesso** ao Supabase nem ao Replit: SQL fica em `migrations/` e o usuário roda.

---

## 6. Integrações

- **TMDB** (`https://api.themoviedb.org/3`, imagens `https://image.tmdb.org/t/p/...`): catálogo, detalhes, créditos, pessoas, provedores de streaming (região **BR**), trailers. `language=pt-BR`.
- **Groq** (chat da IA, direto do navegador). Modelo atual: **`openai/gpt-oss-120b`** (o `llama-3.3-70b-versatile` foi desativado). O prompt faz a IA escrever filmes como `[Título | Ano]`; o front busca no TMDB e mostra um card.
- **Web Push:** recomendação criada → gatilho `trg_push_recomendacao` (pg_net) → Edge Function `enviar-push` → aviso. A chave VAPID **pública** fica no `index.html`; a privada e o `WEBHOOK_SECRET` só nos **Secrets do Supabase**. iPhone só recebe com o app na Tela de Início (iOS 16.4+). Tocar no aviso abre `./?aba=amigos`.
- **Links compartilháveis:** `?perfil=<username>` abre o perfil depois do login; `?aba=amigos` abre a tela de Amigos.
- **Assistir:** veja a seção 11 (ponto de atenção).

---

## 7. Perfil e telas filhas (resumo funcional)

- **Meu perfil:** ícones pequenos no banner (trocar **capa** pela galeria; compartilhar); câmera no avatar abre `#modal-avatares` (fotos prontas) com opção de galeria; **frase** (toque para editar, até 120 caracteres); números Assistidos / Quero ver / Avaliações / **Amigos** (botão com contador de pedidos); **Top 5 filmes** e **Top 5 séries** (busca, ✕, **segurar e arrastar** para reordenar); **Meus favoritos do cinema** (atriz, ator, diretor; tocar na foto abre a tela da pessoa); abas com **9 itens** e "Ver tudo".
- **Perfil dos outros:** botão Adicionar amigo / Aceitar pedido / Pedido enviado / Amigos; "% de gosto em comum" (compara notas, só com 2+ títulos avaliados pelos dois); mesmos blocos sem os botões de editar.
- **Notas lado a lado (regra do usuário):** em capas, nota do TMDB (amarela) **+** nota pessoal (roxa) quando houver — `selosHTML()`. No perfil, a roxa é a do dono do perfil; na tela da pessoa, a do usuário logado.
- **Tela da pessoa** (`#modal-pessoa`): TMDB `/person/{id}` com `combined_credits`; abas Atuou/Dirigiu; ✓ verde nos que o usuário já viu; barra "X de N títulos que você já viu".
- **Tela de Amigos** (`#modal-amigos`, aberta pelo botão Amigos do perfil; a antiga aba foi removida): criar @username (quem ainda não tem), busca, recomendações recebidas, pedidos, lista de amigos, cartão de avisos.
- **Detalhes:** elenco em fila (diretor ou criador primeiro, depois até 8 do elenco; papel embaixo de cada foto).

---

## 8. Como testar

O app precisa de login Supabase, então os testes usam um **Supabase falso**: `testes/mock-supabase.js` (tabelas em memória, usuário `u1` já logado) e rotas do Playwright para TMDB/imagens. Veja `testes/LEIA-ME.md` e `testes/exemplo-perfil.js`.

Regras combinadas:
- testar sempre em **375×812** (celular) e **1366×768** (computador);
- após mudança, rodar a navegação principal: Listas, Explorar, Cenas, Roleta, Feed, perfil, Amigos;
- usar Chromium do Playwright (`/opt/pw-browsers/chromium` no ambiente anterior);
- imagens de prototipo são feitas em HTML e fotografadas com Playwright; o usuário aprova olhando a imagem.

---

## 9. Decisões do usuário e coisas descartadas

- **Descartado por enquanto:** gêneros na busca de Listas (exigiria coluna nova em `meus_filmes`), pontos de posição e legenda nas Cenas, modo claro.
- **Segurança foi adiada por decisão do usuário** (a chave do Groq está no front-end). Não insistir; só mencionar quando uma mudança aumentar o risco. Nunca copie valores de chaves para respostas ou documentos.
- **Identidade visual:** roxo (`#8b5cf6`) com fundo escuro; luz roxa no topo das páginas (Explorar: só no topo do Top 10). Títulos de seção com barra roxa, chips ativos roxos, contadores roxos. Fonte Inter.
- **Perfil:** público por padrão (qualquer logado vê); amizade só para ficar mais próximo e receber avisos.
- **Fotos de perfil prontas:** estrutura pronta (`avatares.js` + `avatares/`), alimentada pelo próprio usuário com **ilustrações próprias**. A IA anterior **recusou** montar um catálogo com fotos de atores reais e cenas de filmes (uso de rosto de pessoa real como avatar). Atenção: o `avatares.js` atual ainda lista 18 entradas com nomes de atores reais, apontando para `.png` enquanto os arquivos são `.jpg` (por isso os círculos aparecem vazios). **Decisão pendente do usuário** — pergunte antes de mexer.
- **Player próprio:** o usuário aprovou o visual de um player (protótipo: barra roxa, ±10 s, qualidade, legendas por idioma, picture-in-picture, menu "Transmitir para dispositivo" com Chromecast/AirPlay/Compartilhar/Copiar link/Abrir em player externo). **Ficou para depois**, para vídeos de fontes que o usuário tenha direito de tocar (ex.: servidor próprio Jellyfin/Plex, conteúdo gratuito legal).

---

## 10. Pendências e ideias em aberto

**Pendências práticas**
- Confirmar quais SQLs de `migrations/` o usuário já rodou (principalmente 18/10, 19/10 e 20/10).
- Decidir o que fazer com `avatares.js` e com os 18 arquivos `.jpg` da pasta `avatares/` (ver seção 9).
- Testar no celular o caminho "escolher um gênero" na roleta depois da opção "Minha lista" (só o caminho da lista foi testado).
- Corrigir `icon-512.png` (é JPEG com extensão `.png`).
- Decidir a estratégia do service worker (hoje o app apaga todos, exceto `sw-push.js`).

**Plano de rede social (5 fases, sem ordem fechada)**
1. Perfil público e descoberta — feito em boa parte; falta "pessoas com gosto parecido".
2. Seguir sem amizade mútua + feed de atividade.
3. Comentários em avaliações/filmes — **antes**, denunciar e bloquear.
4. "Para se atualizar": sugestões por gosto e estreias das séries acompanhadas.
5. Clubes de cinema e desafios.

**Perfil — ideias de métricas (só brainstorm)**
Sem SQL: DNA cinéfilo (radar de gêneros), décadas favoritas, distribuição de notas, "generoso ou exigente" (média pessoal vs TMDB), países/idiomas, prateleira de Quero ver, avaliação em destaque, curtidas recebidas. Com dados novos: "filme que me define", culpa-prazer, ritmo mensal e sequência de dias (precisa da data em que marcou como assistido), percentil, conquistas. Controle de privacidade por bloco ainda sem decisão.

**Atores e diretores:** falta filtrar Explorar por diretor/ator e seguir uma pessoa (tabela nova).

---

## 11. Riscos e pontos de atenção (leia com cuidado)

1. **Chaves no front-end.** Há chaves de serviços no JavaScript (Supabase anon, TMDB, Groq). A do Groq é a mais sensível: qualquer pessoa pode ler. A correção é um endpoint server-side. Não imprimir valores; recomendar rotação se uma chave privada foi exposta.
2. **RLS aberta por decisão.** Listas de todos são legíveis por qualquer logado (seção 5). Se o produto crescer, reavalie, e acrescente bloqueio/denúncia antes de comentários.
3. **Fontes de vídeo de terceiros.** Os botões **"Assistir Online (Legendado)"** (janela `#modal-cinema`, páginas incorporadas de servidores externos, função `trocarServidorCinema`) e **"Assistir com Stremio"** (abre o app Stremio; a janela de instruções sugere complementos que apontam para fontes de torrent) dependem de **fontes sem licença** de terceiros. O assistente anterior **não ampliou** essas integrações e **recusou** construir um player próprio sobre elas ou extrair endereços de vídeo delas. O usuário está ciente. Fica a decisão de quem continuar; tratar isso com transparência, sem prometer disponibilidade.
4. **Imagens de pessoas reais como avatar** — ver seção 9.
5. **Dívida técnica:** `index.html` grande e monolítico, CSS com regras que se sobrescrevem, erros do Supabase por vezes ignorados, sem testes automáticos oficiais. Não refatore tudo sem tarefa específica.
6. **Replit:** o usuário publica manualmente (Pull → Run → Republicar). Os commits "Published your App" são marcadores do Replit e não mudam arquivos.

---

## 12. Cronologia resumida (outubro/2026)

- Séries de TV (Explorar, listas, recomendar, episódios); trailer dublado; avaliações (nota 0–10, comentário, curtidas) e Feed de avaliações; foto de perfil; correção de amigos duplicados; Web Push; busca dentro de playlist; aba Avaliações nos detalhes; atualização automática do app instalado.
- **18/10:** visual novo completo; identidade roxa; botão da IA como "etiqueta" na borda; roleta com botão Girar integrado; notas amarela+roxa lado a lado.
- **19/10:** perfil completo (capa, Top 5, favoritos, abas, Amigos como tela dentro do perfil); fotos prontas (estrutura).
- **20/10:** frase do perfil.
- **23–25/10:** roleta "Minha lista · Quero assistir"; botão Girar no tamanho do miolo com texto em arco; elenco nos detalhes.
- Estudo de player (protótipos aprovados; implementação adiada).

---

## 13. Primeira mensagem sugerida para colar na nova IA

```text
Vou continuar o projeto iCine com você. Leia primeiro CONTEXTO_ICINE_PARA_OUTRA_IA.md e CLAUDE.md
(na raiz do projeto), depois explore index.html pelos blocos "=== BLOCO:".
Eu falo português do Brasil e não sou programador: explique em passos simples.
Para mudanças maiores, mostre um protótipo (imagem) antes de aplicar.
Sempre que mudar o app, troque VERSAO_APP no index.html e o valor de version.json (os dois iguais).
Antes de mexer em qualquer coisa que dependa do banco, me diga qual SQL eu preciso rodar no Supabase.
Comece me confirmando o que entendeu do projeto e quais SQLs de migrations/ ainda preciso rodar.
```
