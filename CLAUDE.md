# iCine — contexto para o Claude

Leia também `CONTEXTO_ICINE_PARA_OUTRA_IA.md` (arquitetura, tabelas, riscos). Este arquivo registra
como trabalhamos e as decisões tomadas desde então.

## Como as mudanças chegam ao app
- O app roda no **Replit**, ligado a este repositório (`GonzalesDev/iCine.com`, privado). O repositório
  `GonzalesDev/iCine` é uma cópia antiga e parcial: não usar.
- Fluxo: editar → testar localmente (`python -m http.server 5000`) → commit + push em `main`.
  **Permissão permanente (18/10):** ao terminar uma atualização, enviar direto para o `main` (juntando com o `main` antes, sem forçar), sem perguntar.
  O usuário acumula várias mudanças e faz **Pull → Run → Republicar** no Replit de uma vez.
- Commits "Published your App" são marcadores de publicação do Replit (não mudam arquivos).
- SQL do Supabase fica em `migrations/`; avisar o usuário quando houver SQL a rodar **antes** de publicar.
- O usuário fala português (Brasil) e não é desenvolvedor: explicar passos de forma simples.
- Testar no tamanho de celular (375×812) e de computador (ex.: 1366×768): o app é usado nos dois.

## Preferências do usuário
- Visual **minimalista**: poucas informações, ações com ícones, nada "poluído".
- Segurança foi **adiada** por decisão do usuário (a chave do Groq está no front-end). Não insistir;
  só mencionar se uma mudança aumentar o risco.
- Para mudanças maiores, ele gosta de ver um protótipo ou plano antes ("vamos planejar antes de fazer").

## O que já foi feito (outubro/2026)
- Séries de TV: Explorar/Top 10 com toggle Filmes/Séries; salvar séries em listas e playlists
  (coluna `tipo` em `meus_filmes` e `recomendacoes_amigos`); recomendar séries; assistir por
  temporada/episódio (Stremio e player). Chave interna: filme = número do TMDB; série = `'tv:<id>'`.
- Detalhes: trailer no topo com som (+ botão de mudo), prioriza trailer **dublado** pt-BR, infos do TMDB.
- Chat IA: modelo do Groq é `openai/gpt-oss-120b` (o antigo `llama-3.3-70b-versatile` foi desativado).
- Navegação: Amigos virou ícone no cabeçalho; barra inferior = Listas, Explorar, Cenas, Roleta, Feed.

## Roleta (aba `#aba-roleta`, bloco "JS ROLETA" — IIFE `roleta`, CSS escopado, IDs `rol-*`)
- Funil em 3 etapas: Filme/Série → Gênero (**até 2**, lógica **E**: `with_genres` com `,`, só títulos que
  têm os dois gêneros — decisão de 11/10; antes era até 3 com OU e misturava filmes de um só gênero) →
  Streamings (opcional, vários, `watch_region=BR`, lógica OU). Filtro de nota foi **removido**.
- Misturas raras (ex.: terror+romance): se der menos de 60 títulos, o mínimo de avaliações baixa em
  degraus (`DEGRAUS_VOTOS`: filmes 300→100→30, séries 150→50→15) até a roda ter títulos suficientes.
- Só títulos conhecidos: `sort_by=vote_count.desc`, mínimo de 300 avaliações (filmes) / 150 (séries);
  no máximo **300** títulos na roda. Títulos já marcados como Assistidos ficam de fora.
- Roda: só **1/4 visível** (centro no canto inferior direito), desenhada em **canvas** (fluida no
  celular); capas com zoom preenchendo as fatias; "quase infinita" (posição lógica L → `filmes[L mod N]`).
- **Minha lista · Quero assistir (23/10):** primeiro item da etapa de gêneros (`escolha.lista`). Marcado, desmarca os gêneros e
  sorteia só os títulos de `listaQueroAssistir` do tipo escolhido (`itensDaLista()`); pula a etapa de streaming. Capa vem do TMDB
  (`/t/p/wNNN/x.jpg`) e é convertida para `/x.jpg`. Escolher um gênero desmarca a lista.
- Gira por arraste com impulso ou botão; para no centro de um pôster; pipocas + confete estourando
  a partir do centro quando para.
- Sorteado ocupa o espaço vazio com capa grande e fundo desfocado; no computador (tela larga),
  layout em duas colunas (sorteado à esquerda, roda à direita).

## Feed (aba `#aba-comunidade`, bloco "JS FEED AVALIAÇÕES")
- Toggle no topo: **Playlists** (feed antigo de playlists públicas) e **Avaliações** (padrão).
- Tabela `avaliacoes` (`migrations/2026-10-05_avaliacoes.sql`): uma por usuário e título
  (`user_id, tmdb_id, tipo`), nota 0–10, comentário opcional (até 280). Salva com upsert.
- Feed mostra avaliações de **todos**, com as dos **amigos primeiro** e uma estrela verde ao lado do nome.
- Ao marcar como Assistido (`salvarNoGrupo('ja')` / `moverFilme(id,'ja')`) abre a janela de avaliar
  automaticamente com "Agora não" (só se ainda não avaliou).
- Dono da avaliação vê ícones de **editar** (reabre a janela, mantém a data) e **excluir** (confirm).
- Curtidas ❤️ (decisão revista em 11/10): tabela `avaliacao_curtidas` (`migrations/2026-10-11_curtidas_avaliacoes.sql`),
  uma por pessoa e avaliação; coração + contagem no canto inferior direito de cada avaliação.

## Foto de perfil (bloco "JS FOTO DE PERFIL")
- Coluna `perfis.foto_url` (`migrations/2026-10-05_foto_perfil.sql`). Troca pela câmera no avatar do **meu perfil**
  (`#pf-trocar-foto` → `#input-foto-perfil`); a imagem é recortada em quadrado (320px, JPEG) e vai para o bucket `capas`.
- **Fotos prontas (19/10):** o câmera do meu perfil abre `#modal-avatares` (grade de círculos). A lista fica em `avatares.js`
  (`AVATARES_PRONTOS = [{ nome, arquivo: 'avatares/x.png' }]`) e as imagens em `avatares/` (ver `avatares/LEIA-ME.txt`).
  Escolher grava o caminho em `perfis.foto_url`. Imagens quebradas somem da grade. Catálogo vazio mostra "Nenhuma foto pronta ainda.".
- Use `avatarHTML(nome, foto)` / `avatarConteudo(...)` em qualquer lugar que mostre usuário; cache
  `fotosPerfis` (user_id → url). Sem foto ou se a imagem falhar, mostra a inicial.

## Amizades
- `amizades` guarda 1 linha por pedido. O UNIQUE original era só por direção, então A→B e B→A geravam
  2 linhas e o amigo aparecia duplicado. Corrigido em 12/10: `carregarAmigos` deduplica por usuário,
  `enviarPedido` confere os dois sentidos (se a pessoa já tinha te adicionado, aceita o pedido dela) e
  `migrations/2026-10-12_amizades_sem_duplicados.sql` limpa os duplicados e cria índice único do par.

## Avisos no celular (Web Push) — recomendações
- Fluxo: recomendação criada → gatilho `trg_push_recomendacao` (pg_net) → Edge Function `enviar-push`
  (`supabase/functions/enviar-push/`) → aviso. O gatilho lê `push_subscriptions` e `perfis` (roda como dono da tabela,
  por isso passa por RLS) e manda `aparelhos` + `remetente` no corpo; a função só envia, sem ler o banco
  (antes ela lia e recebia lista vazia por RLS, com `{"enviados":0}`).
  SQL: `migrations/2026-10-13_push_notificacoes.sql` (tem o placeholder `COLE_AQUI_O_SEGREDO`; nunca commitar o real).
- App: bloco "JS AVISOS NO CELULAR (WEB PUSH)"; cartão "Ativar/Desativar" (`#push-box`) na tela de Amigos (`#modal-amigos`); `sw-push.js` só recebe
  avisos (sem cache). O app **continua apagando os service workers antigos** ao abrir (exceto `sw-push.js`).
  Tocar no aviso abre `./?aba=amigos` (`abaDoLink`) ou manda mensagem à aba aberta.
- Chave VAPID pública fica no `index.html`; a privada e o `WEBHOOK_SECRET` só nos Secrets do Supabase.
- iPhone só recebe push com o app adicionado à Tela de Início (iOS 16.4+). Desativar fica salvo no aparelho
  (`localStorage.icine_push_off`) para o login não religar sozinho.

## Ícone de Amigos no cabeçalho
- O botão `#btn-amigos` (ao lado da logo) mostra a foto de perfil do próprio usuário (ou a inicial, se não houver foto).
  Desde 18/10 ele abre o **meu perfil** (`abrirPerfil`); sem @username ainda, abre a tela de Amigos para criar.
  Atualizado por `atualizarAvatarHeader()`: chamada em `verificarPerfil`, ao criar o @username e ao trocar a foto.
- Consistência do cartão: se o banco recusar a gravação do aparelho (`gravarOuDesfazerPush`), a inscrição do
  navegador é desfeita; o cartão só mostra "ativado" quando o servidor conhece o aparelho.
- Último perfil conhecido fica em `localStorage.icine_meu_perfil` (username e foto). O cabeçalho usa esse cache
  ao abrir o app e depois confirma com o servidor (`verificarPerfil`). Some ao sair da conta.

## Busca dentro da playlist
- Na tela de uma playlist **própria** (`abrirVerPlaylist`), `#busca-playlist-box` pesquisa filmes e séries juntos
  (`/search/multi`) e o botão "+ Adicionar" grava direto em `playlists.filmes`. Playlists de amigos e da
  comunidade não mostram a busca. Ao criar uma playlist, ela abre sozinha já com o campo de busca focado.

## Aba Avaliações nos detalhes do filme/série
- Nos detalhes (`abrirDetalhes`), abas **Sinopse | Avaliações (N)** acima do texto. Usa a tabela `avaliacoes` do Feed por
  título (`tmdb_id` + `tipo`), sem SQL novo. Resumo com média e nº de avaliações (e quantas de amigos), botão
  Avaliar/Editar (mesma janela do Feed), sua avaliação no topo com editar/excluir, amigos primeiro, ❤️ (reusa
  `alternarCurtidaAvaliacao`), 15 por vez com "Ver mais". Avaliações só com nota aparecem (só estrelas).
  Estado em `detAval`; `recarregarAvaliacoesDetalhes()` é chamado ao publicar/excluir.

## Rolagem ao trocar de aba
- `mudarAba()` começa com `window.scrollTo(0, 0)`: toda aba da barra inferior abre no topo (antes herdava a rolagem da anterior).

## Atualização automática do app instalado
- O app instalado (PWA) guardava o `index.html` antigo em cache. Agora `index.html` tem `VERSAO_APP` e existe `version.json`
  (`{"versao": "..."}`). O app confere o `version.json` sem cache ao abrir, ao voltar para o app e a cada 5 min; se for diferente,
  recarrega em `?v=<versão>`. **A CADA PUSH que muda o app: trocar o valor nos DOIS lugares (mesmo valor)**, ex. `2026-10-15.2`.
  A primeira vez que cada aparelho abrir a versão que contém isso ainda pode precisar de um refresh manual (a versão velha não tem a checagem).

## Visual novo (já é o PADRÃO desde 18/10)
- Modernização do visual **sem mudar a estrutura** (decisão: nada de destaque grande/estilo streaming, nada de botões de gênero, sem lupa
  no cabeçalho; manter toggle Filmes/Séries, logos de streaming que filtram o Top 10, busca e selects). Vive em `novo-visual.css`
  (camada com prefixo `html.novo`), carregado por um script no fim do `<head>`. Saída de emergência: `?visual=antigo` (grava
  `localStorage.icine_visual`); `?visual=novo` religa. Ao mudar o CSS, subir o `?v=` do link e o `VERSAO_APP`/`version.json`.
- Linguagem: fonte Inter, cabeçalho de vidro, barra inferior de vidro com ícones de linha (máscara SVG sobre `.nav-btn .icon`),
  chips Filmes/Séries (ativo branco), nota em selo sobre a capa, Top 10 com número vazado atrás da capa (celular) / na frente (600px+),
  grade `minmax(0,1fr)` (títulos longos não esticam colunas), detalhes com abas sublinhadas e botões de 12px.
- Descartado por enquanto (18/10, decisão do usuário): gêneros na busca de Listas, pontos de posição e legenda da Cenas, modo claro.

## "Ver todos" no fim das listas (Listas)
- Os blocos tracejados viraram `.card-ver-todos`: botão redondo com seta + "Ver todos" e "+N" pequenos (CSS no `index.html`, antes do bloco
  de responsividade). Gerado em `renderizarMinhasListas`; ao clicar mostra a lista inteira. No computador (600px+) ocupa uma célula da grade.

## Visual novo: Listas, Cenas, Roleta e Feed (18/10)
- **Folha de ações dos cards** (Listas, Explorar, Top 10, playlists): o painel que aparecia sobre a capa agora é uma folha que sobe de baixo
  (`.movie-card-overlay` com `position: fixed` + fundo escuro via `.movie-card.aberto::before`). O cabeçalho da folha é `.sheet-topo` (capa,
  título, ano), preenchido nos templates; os ícones das ações vêm de `ICO` (JS, perto de `gerarCardTop10HTML`). Etiqueta "Série" = `_tagSerie(f)`.
- **Listas**: contadores nos títulos (`#cont-quero/#cont-ja/#cont-pl`, atualizados em `renderizarMinhasListas`), busca de Assistidos vira lupa
  que abre ao focar (só CSS), cartão de playlist com nome + "N títulos · Pública/Privada" (`.qtd-pl`), botão "Nova playlist".
- **Cenas**: ícones de linha (coração/balão/salvar) no lugar dos emojis; `curtirCena` NÃO mexe mais no texto do botão (só na classe `liked`).
  Pontos de posição e legenda: descartados por enquanto (ver "Visual novo" acima).
- **Roleta**: só CSS/ícones: fundo degradê animado, funil com chips/cartões, aro de vidro com brilho, miolo escuro, ponteiro branco minimalista
  (SVG em `#rol-ponteiro`), botão Girar branco. A lógica da roda, o arrastar com impulso e as pipocas NÃO mudaram.
- **Feed**: cartão por avaliação (`.aval-item`: usuário, filme com pílula de nota + barra de 10 segmentos, comentário, rodapé com ❤️);
  suas avaliações têm menu "⋯" (`.aval-mais`) que abre folha com Editar/Excluir (`.aval-item.aberto`); cartão de playlist `.plf` com capa grande.
  Cuidado: `.aval-acoes-dono`/`.aval-acao` também são usados na aba Avaliações dos detalhes (escopar sempre com `.aval-item`).

## Listas (saudação/busca/"Ver tudo") e botão Girar — 18/10
- Topo de Listas: "Olá, @usuario" (`atualizarSaudacao`, usa `meuPerfil` ou o cache `icine_meu_perfil`), título "Suas listas" e UMA busca
  (`#busca-listas`) que filtra "Quero Assistir" e "Assistidos" **só por título** (a tabela `meus_filmes` não guarda gênero).
- "Ver tudo / Ver menos" fica no topo de cada lista (`#ver-tudo-quero`, `#ver-tudo-ja`, visível só com mais de 6 itens: `LIMITE_CAPAS_LISTA`); o cartão do fim da fila foi removido.
- Roleta: o botão Girar tem o mesmo tamanho e centro do miolo da roda (`rc` = R*0.26, posicionado pelo JS em `btnGirar`); visual roxo com anel (24/10).
- Botão "Assistir Online (Legendado)": contorno rosado (opção C aprovada: fundo rgba(251,113,133,.14), borda .7, texto #ff9aab).

## Ícone Explorar e botão da IA — 18/10
- Explorar usa uma bússola (círculo + agulha em losango) na barra inferior (máscara SVG em `#btn-explorar`).
- `#btn-chat-fab` virou pílula lilás (#a678ff) com ícone de faíscas + texto "IA do iCine" (`.fab-ico`, `.fab-txt`; no visual antigo continua o ✨ redondo).
  Continua arrastável (usa transform) e escondido na aba Cenas.

## Correções 18/10 (playlist e chat da IA)
- Folhas de ações dos cards (`.movie-card-overlay`) ficam `visibility: hidden` quando fechadas; dentro de janelas (`.modal`) o `backdrop-filter`
  prendia o `position: fixed` à janela (a folha aparecia no meio da playlist). No visual novo `.modal` não usa backdrop-filter.
- Chat da IA: `--vvh` (JS `acompanharTeclado`, usa `visualViewport`) limita `.chat-window` à altura visível quando o teclado abre.

## Pendências do visual novo resolvidas — 18/10
- Janelas (`.modal-content`): folha escura com alça, botões em linhas, campos planos, arquivo com botão lilás; o botão da IA some com janela aberta
  (`body:has(.modal[style*="display: flex"])`). Login com degradê animado. Amigos/chat/playlist aberta restilizados (só CSS + emojis trocados por SVG).
- Cenas: botão **Enviar** (`enviarCena`, abre a mesma janela de recomendar) e barra de progresso (`.short-prog`, atualizada pelo `timeupdate` do player único).
- Assistidos mostram a **sua nota** (`minhasNotasAval`, carregada por `carregarMinhasNotas`; selo roxo) e caem na nota do TMDB se não avaliou.
  Recarrega ao publicar/excluir avaliação e ao carregar os filmes; limpa ao sair.

## Perfil do usuário (18–19/10) — bloco "JS PERFIL DO USUÁRIO", CSS `.pf-*`/`.tf-*`/`.t5-*`/`.am-*`/`.pp-*` no index.html
- Janelas (todas `.modal.modal-tela`, tela cheia, máx. 600px): `#modal-perfil` 2400 → `#modal-amigos` 2420 → `#modal-top5` e
  `#modal-favorito` 2440 → `#modal-pessoa` 2460 → detalhes 2800. Para abrir um perfil a partir da tela de Amigos usa-se
  `fecharModalEDepois` (o "voltar" do histórico é assíncrono). `historicoPerfis`: o botão voltar do perfil volta ao perfil anterior.
- Abre por: foto no cabeçalho (meu perfil; sem @username vai para a tela de Amigos criar), amigos/pedidos/busca na tela de Amigos e
  foto/nome de quem avaliou no Feed (`data-perfil`). Link `?perfil=<username>` (ícone compartilhar) abre o perfil depois do login.
- Meu perfil: ícones pequenos no banner (trocar **capa** pela galeria → `#input-capa-perfil`, reduzida a 1280px, bucket `capas`,
  `perfis.capa_url`; compartilhar) e câmera no avatar. Sem capa escolhida, o banner é o fundo (TMDB) do título com a maior nota.
  Números: Assistidos, Quero ver, Avaliações e botão **Amigos** (com contador de pedidos) que abre `#modal-amigos`.
  Perfil dos outros: botão Adicionar amigo / Aceitar pedido / Pedido enviado / Amigos (`pedirAmizade`) e "% de gosto em comum".
- **Top 5 filmes** e **Top 5 séries** escolhidos pela pessoa (`perfis.top_filmes`/`top_series`, listas `{id,titulo,ano,capa,sinopse}`):
  editor `#modal-top5` com busca no TMDB, ✕ para tirar e **segurar e arrastar** para reordenar (pointer events no `#t5-slots`,
  `touch-action: none`). Salva a cada mudança. Nos outros perfis, Top 5 vazio não aparece.
- **Meus favoritos do cinema**: 3 cards — Atriz, Ator e Diretor favoritos (`perfis.favoritos` = `{atriz|ator|diretor: {id,nome,foto}}`),
  escolhidos em `#modal-favorito` (busca `/search/person`, quem combina com a categoria e o gênero vem primeiro). Tocar na foto abre
  `#modal-pessoa`: `/person/{id}?append_to_response=combined_credits`, abas Atuou/Dirigiu (sem talk shows/aparições, sem repetidos,
  por nº de votos), "X de N títulos que você já viu", ✓ verde nos vistos. (O "Cinéfilo em números" automático foi removido em 19/10.)
- Abas de baixo (Assistidos | Avaliações | Playlists | Quero ver) e a tela da pessoa mostram **9** itens e "Ver tudo (N) ⌄" / "Ver menos".
- **Notas lado a lado** (regra do usuário): capa com nota do TMDB (amarela) + nota pessoal (roxa) quando houver — `selosHTML()`.
  No perfil, a roxa é a do dono do perfil; na tela da pessoa, a minha.
- SQL: `migrations/2026-10-18_perfil_publico.sql` (listas visíveis a todos os logados + `contar_amigos`) e
  `migrations/2026-10-19_perfil_personalizado.sql` (capa_url, top_filmes, top_series, favoritos). Sem o de 19/10 o perfil abre,
  mas salvar capa/Top 5/favoritos falha (aviso na tela). Outros só veem playlists **públicas**. Frase/bio: adiada.

## Tela de Amigos (19/10) — `#modal-amigos`, aberta pelo botão Amigos do perfil (a aba `#aba-amigos` antiga foi REMOVIDA)
- Contém (mesmos IDs de antes, só mudaram de lugar): `#setup-username-card` (quem ainda não tem @), busca `#input-busca-amigo`
  (resultado abre o perfil), `#secao-inbox` (recomendações recebidas), `#secao-pedidos` (Aceitar/Recusar), `#secao-amigos-lista`
  e `#push-box` (avisos no celular). `mudarAba('amigos')` agora chama `abrirAmigos()` — vale para `?aba=amigos` e para o toque no aviso.
  A janela `#modal-buscar-amigo` foi removida.

## ONDE PARAMOS (resumo para começar uma conversa nova) — 18/10/2026
- **Estado:** todo o visual novo (Listas, Explorar, Cenas, Roleta, Feed, janelas, login, Amigos, chat da IA) está no GitHub (`main`).
  O usuário publica no Replit com Pull → Run → Republicar. **SQL pendente:** `migrations/2026-10-18_perfil_publico.sql` e
  `migrations/2026-10-19_perfil_personalizado.sql` (rodar os dois, nessa ordem, antes de publicar). Toda mudança no app exige subir `VERSAO_APP` (index.html) e
  `version.json` (mesmo valor) e o `?v=` do link do `novo-visual.css`; assim o app instalado se atualiza sozinho.
- **Visual novo:** `novo-visual.css` (prefixo `html.novo`) + trechos no `index.html`. Saída de emergência: `?visual=antigo`.
- **Pendências:** nenhuma. Gênero na busca de Listas, pontos de posição/legenda das Cenas e modo claro foram descartados por enquanto (18/10).
- **Como testar:** Playwright com Chromium em `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` e mocks de Supabase/TMDB (ver scripts
  `teste-*.js` e `*-check.js` na pasta de rascunho da sessão anterior; se sumiram, recriar mocks pelo padrão descrito nas seções acima).
- **Preferências do usuário:** fala português (BR), não é desenvolvedor; gosta de aprovar protótipo antes de mudar o app; visual minimalista,
  estilo de app moderno (parecido com streaming, mas **sem** destaque grande e sem botões de gênero); pede ajustes pequenos um de cada vez.

## Fatos técnicos e armadilhas (para não redescobrir)
- **Arquitetura:** app de um arquivo só (`index.html`, JS puro) + `novo-visual.css`; Supabase (auth, tabelas, RLS, Edge Function `enviar-push`) e TMDB.
  Publicação = Replit (site estático servindo a pasta raiz). Não há build.
- **Acesso ao Supabase:** o Claude NÃO tem acesso ao painel do Supabase nem ao Replit. SQL fica em `migrations/` e o usuário roda no SQL Editor;
  segredos (VAPID privada, WEBHOOK_SECRET) ficam só nos Secrets do Supabase — nunca no repositório nem no chat.
- **Atualização do app instalado:** `VERSAO_APP` + `version.json` (sempre o mesmo valor) e `novo-visual.css?v=N`. Esquecer = app instalado não atualiza.
- **Cache antigo:** `limparCopiaAntiga()` apaga service workers/caches antigos (só `sw-push.js` fica). Não reintroduzir cache de app no service worker.
- **`position: fixed` dentro de janelas:** `backdrop-filter`/`transform`/`filter` em um ancestral prende o `fixed` a ele (já causou folhas aparecendo
  no meio da playlist). Por isso `.modal` não usa backdrop-filter no visual novo e as folhas fechadas ficam `visibility: hidden`.
- **Classes compartilhadas:** `.aval-acoes-dono`/`.aval-acao` existem no Feed e na aba Avaliações dos detalhes — sempre escopar com `.aval-item`.
  `.movie-card` e seu overlay são usados em Listas, Explorar, Top 10 e playlists.
- **Teclado do celular:** `--vvh` (visualViewport) limita o chat da IA; qualquer janela nova com campo de texto deve usar a mesma ideia.
- **Emojis:** foram trocados por ícones SVG de linha nas telas redesenhadas; manter esse padrão em telas novas (emoji só em texto de conteúdo).
- **Testes:** conferir sempre no tamanho 375×812 e 1366×768; rodar os testes de regressão (aba de avaliações, busca em playlist, amigos, roleta, feed).
