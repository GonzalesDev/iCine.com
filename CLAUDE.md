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
