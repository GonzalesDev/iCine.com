# iCine — contexto para o Claude

Leia também `CONTEXTO_ICINE_PARA_OUTRA_IA.md` (arquitetura, tabelas, riscos). Este arquivo registra
como trabalhamos e as decisões tomadas desde então.

## Como as mudanças chegam ao app
- O app roda no **Replit**, ligado a este repositório (`GonzalesDev/iCine.com`, privado). O repositório
  `GonzalesDev/iCine` é uma cópia antiga e parcial: não usar.
- Fluxo: editar → testar localmente (`python -m http.server 5000`) → commit + push em `main`.
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
- Coluna `perfis.foto_url` (`migrations/2026-10-05_foto_perfil.sql`). Troca tocando no próprio avatar
  na tela de Amigos; a imagem é recortada em quadrado (320px, JPEG) e vai para o bucket `capas`.
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
- App: bloco "JS AVISOS NO CELULAR (WEB PUSH)"; cartão "Ativar/Desativar" na tela de Amigos; `sw-push.js` só recebe
  avisos (sem cache). O app **continua apagando os service workers antigos** ao abrir (exceto `sw-push.js`).
  Tocar no aviso abre `./?aba=amigos` (`abaDoLink`) ou manda mensagem à aba aberta.
- Chave VAPID pública fica no `index.html`; a privada e o `WEBHOOK_SECRET` só nos Secrets do Supabase.
- iPhone só recebe push com o app adicionado à Tela de Início (iOS 16.4+). Desativar fica salvo no aparelho
  (`localStorage.icine_push_off`) para o login não religar sozinho.

## Ícone de Amigos no cabeçalho
- O botão `#btn-amigos` (ao lado da logo) mostra a foto de perfil do próprio usuário (ou a inicial, se não houver foto).
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

## Visual novo (em prévia)
- Modernização do visual **sem mudar a estrutura** (decisão: nada de destaque grande/estilo streaming; manter toggle Filmes/Séries e
  filtros em selects, não em botões de gênero). Vive em `novo-visual.css`, uma camada com prefixo `html.novo`, carregada pelo
  script no fim do `<head>` só quando `?visual=novo` (grava `localStorage.icine_visual`; `?visual=antigo` desliga). Quando aprovado,
  vira padrão (remover o script condicional e o prefixo). Ao mudar o CSS, subir `?v=` do link e o `VERSAO_APP`/`version.json`.
- Feito (linguagem do protótipo streaming, mesma estrutura): Inter, cabeçalho flutuante, barra inferior de vidro com ícones de linha, chips Filmes/Séries (ativo branco), nota em selo sobre a capa, Top 10 com número vazado atrás da capa, detalhes com abas sublinhadas, botões de 12px e ações em ícones limpos.
  títulos sem barrinha colorida, toggle segmentado, campos/selects planos, cards sem caixa (capa arredondada + texto embaixo), Top 10 vazado.
- Falta: tela de detalhes, Feed, Amigos, modais, Roleta (ajustes finos), telas de login.
