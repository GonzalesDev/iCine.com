# Contexto consolidado do projeto iCine para continuidade por outra IA

> Este documento é um briefing técnico e operacional para uma IA que vai continuar o desenvolvimento do iCine.  
> Antes de editar qualquer coisa, confira o estado real dos arquivos, porque este documento pode ficar desatualizado.

---

## 1. Instrução principal para a IA

Você é uma IA de desenvolvimento responsável por continuar o projeto **iCine**. Trabalhe diretamente no código existente, preservando as funcionalidades que já estão funcionando.

Regras obrigatórias:

1. Leia os arquivos atuais antes de propor ou aplicar alterações.
2. Não reescreva o projeto inteiro sem necessidade.
3. Preserve o idioma da interface em português do Brasil, salvo pedido contrário.
4. Não exponha, copie ou repita chaves de API, tokens, senhas ou credenciais.
5. Não trate dados de um usuário como se fossem dados do usuário logado.
6. Toda operação de leitura, alteração e remoção de dados privados deve respeitar `user_id` e as políticas RLS do Supabase.
7. Nunca faça alterações destrutivas no banco sem explicar o impacto e pedir confirmação.
8. Depois de editar, execute uma verificação prática no app usando o workflow existente.
9. Se uma funcionalidade depender de uma tabela, coluna, bucket ou política que não está confirmada no código, diga isso explicitamente.
10. Priorize correções funcionais, segurança e consistência dos dados antes de melhorias cosméticas.

Quando receber uma nova tarefa:

1. Identifique os arquivos e funções afetados.
2. Explique brevemente o diagnóstico.
3. Faça a menor alteração segura.
4. Verifique o fluxo completo, incluindo recarregar a página e trocar de usuário quando isso for relevante.
5. Informe exatamente o que foi alterado, o que foi testado e o que ainda depende de configuração externa.

---

## 2. Visão do produto

O **iCine** é um diário de filmes social, com foco em:

- registrar filmes que o usuário quer assistir;
- registrar filmes já assistidos;
- criar playlists pessoais;
- explorar o catálogo de filmes;
- ver notas, sinopse, trailer e onde assistir oficialmente;
- abrir filmes no Stremio ou em players web de terceiros;
- consumir um feed de cenas curtas;
- compartilhar playlists públicas na comunidade;
- adicionar amigos por username;
- visualizar as listas e playlists de amigos;
- enviar recomendações de filmes para amigos;
- conversar com uma IA cinéfila;
- funcionar como PWA instalável no celular.

Posicionamento do produto: o iCine combina a experiência de diário e comunidade do
Letterboxd com recursos de descoberta e acesso a serviços de streaming, Stremio e
players web externos. A identidade principal continua sendo a organização pessoal
de filmes e a interação entre cinéfilos.

O estilo visual atual é dark, com fundo azul quase preto, cartões escuros, gradientes roxo/rosa e uso frequente de emojis.

Principais cores:

- fundo: `#030712`;
- texto principal: `#f9fafb`;
- texto secundário: `#9ca3af`;
- roxo: `#8b5cf6`;
- rosa: `#ec4899`;
- fundo dos cartões: `#111827`;
- azul: `#3b82f6`;
- vermelho: `#ef4444`.

---

## 3. Estrutura atual do projeto

O projeto é atualmente um site estático sem bundler ou framework:

```text
/
├── index.html
├── manifest.json
├── service-worker.js
├── icon-512.png
├── supabase_social.sql
├── admin/
│   └── index.html
├── attached_assets/
│   ├── imagens e logos enviados pelo usuário
│   └── arquivos de instruções colados no projeto
├── .replit
└── .agents/
```

### Arquivo principal

`index.html` concentra:

- HTML da aplicação;
- todo o CSS;
- todo o JavaScript;
- autenticação;
- chamadas ao Supabase;
- chamadas ao TMDB, OMDb e Groq;
- renderização das abas, cards, modais e feed;
- lógica de playlists, amigos, recomendações e chat.

É um arquivo grande e monolítico. Não faça uma migração para framework ou divisão em vários arquivos sem uma solicitação específica ou um plano de migração seguro.

### Execução local

O projeto usa o Python estático:

```bash
python3 -m http.server 5000
```

O workflow configurado é **Start application**, na porta `5000`. O deploy está configurado como estático, com a raiz do projeto como diretório público.

Não há `package.json`, testes automatizados ou pipeline de build confirmado no projeto.

---

## 4. Serviços e integrações

### Supabase

É usado para:

- autenticação por e-mail e senha;
- persistência das listas de filmes;
- perfis e usernames;
- amizades;
- playlists;
- armazenamento de capas;
- feed de cenas;
- recomendações entre amigos;
- radar de próximos lançamentos.

O cliente Supabase é criado no `index.html`. As credenciais estão atualmente no código-fonte e devem ser consideradas um problema de segurança:

- nunca copie os valores reais para uma resposta ou documento;
- não solicite que o usuário cole chaves no chat;
- planeje migrar chaves sensíveis para um backend ou mecanismo seguro de secrets;
- a chave anon/public do Supabase não substitui RLS;
- a chave do Groq não deve ficar exposta no navegador e precisa ser movida para um endpoint server-side;
- se uma chave privada já foi exposta no código publicado, recomende rotação.

### TMDB

Usado para:

- busca e catálogo;
- filmes populares;
- lançamentos;
- filtro por gênero;
- radar curado;
- top 10 por plataforma;
- IMDb ID;
- provedores oficiais de streaming;
- trailers e vídeos;
- pôsteres.

Base:

```text
https://api.themoviedb.org/3
https://image.tmdb.org/t/p/w500
```

O código usa `language=pt-BR` e, em alguns casos, faz fallback para `en-US`.

### OMDb

Foi integrado anteriormente para obter notas do IMDb e Rotten Tomatoes, mas a integração deve ser conferida antes de novas alterações. O código atual trabalha principalmente com os dados do TMDB e com campos de nota armazenados no Supabase.

### Groq

O chat da IA faz uma chamada direta do navegador para:

```text
https://api.groq.com/openai/v1/chat/completions
```

Modelo atualmente usado no código:

```text
llama-3.3-70b-versatile
```

O prompt do chat obriga a IA a escrever filmes no formato:

```text
[Título do Filme | Ano]
```

O front-end identifica esse formato, busca o título no TMDB e injeta um card com botão para abrir os detalhes.

Essa chamada direta expõe a chave do Groq ao cliente. Não aumente esse risco; a correção correta é criar um endpoint protegido.

---

## 5. Fluxos da interface

### Login

A tela inicial mostra:

- e-mail;
- senha;
- botão Entrar;
- botão Criar Conta Grátis.

Funções principais:

- `checarSessao()`;
- `signInWithPassword`;
- `signUp`;
- `signOut`.

Depois do login, o código carrega:

- filmes do usuário;
- playlists do usuário;
- filtros da aba Explorar;
- top 10 da Netflix;
- perfil social e amigos.

### Abas principais

IDs atuais:

```text
aba-inicio
aba-explorar
aba-cenas
aba-comunidade
aba-amigos
```

Botões da navegação:

```text
btn-inicio
btn-explorar
btn-cenas
btn-comunidade
btn-amigos
```

A função central de navegação é:

```text
mudarAba(abaId)
```

Na aba Cenas, o header e o chat são escondidos para criar uma experiência de tela cheia.

### Minhas Listas

A aba inicial tem:

1. **Quero Assistir**
2. **Assistidos Recentemente**
3. **Minhas Playlists**

IDs:

```text
watchlist-grid
ja-assisti-grid
pesquisa-ja-assisti
playlists-grid
```

Funções principais:

- `carregarFilmesDaNuvem()`;
- `renderizarMinhasListas()`;
- `salvarNoGrupo(grupo)`;
- `moverFilme(tmdb_id, novoGrupo)`;
- `removerFilme(tmdb_id)`.

A busca em tempo real foi adicionada à lista **Assistidos Recentemente**. Ela filtra por título e trata:

- lista vazia;
- nenhum resultado;
- resultados filtrados;
- limite inicial de 15 cards com opção “Ver Todos”.

### Explorar

A aba Explorar tem:

- pills para Netflix, Prime Video, Disney+, Max e Apple TV;
- Top 10 do provedor selecionado;
- busca por título;
- filtro por gênero;
- ordenação por populares, próximos lançamentos, recém-lançados ou maior nota;
- botão Carregar Mais.

Funções principais:

- `aplicarFiltros()`;
- `carregarTop10()`;
- `mudarProvedorStreaming()`;
- `renderizarGridExplorar()`;
- `gerarCartaoFilmeHTML()`;
- `mapearBotoesGrid()`.

O radar curado usa a tabela `radar_curado` e é visível no select “Próximos Lançamentos”.

### Modal de detalhes

ID:

```text
modal-detalhes
```

Função principal:

```text
abrirDetalhes(id)
```

O modal mostra:

- capa/hero;
- trailer do YouTube como vídeo de fundo quando disponível;
- título;
- ano;
- nota;
- sinopse;
- provedores oficiais de streaming via TMDB Watch Providers;
- botão Stremio;
- player web;
- botão Organizar;
- botão Recomendar;
- link de Edits/Shorts;
- link do Trailer;
- botão administrativo para fixar no radar.

Os provedores oficiais priorizam a região BR e fazem fallback para PT. Só o bloco `flatrate` é exibido.

O botão Organizar abre `modal-escolha` e permite salvar em:

- Quero Assistir;
- Assistidos Recentemente;
- uma playlist.

### Playlists

O usuário pode:

- criar playlist;
- enviar capa para o bucket `capas`;
- marcar playlist como pública;
- editar nome, capa e visibilidade;
- apagar playlist;
- adicionar filmes;
- remover filmes;
- abrir playlists próprias;
- abrir playlists de amigos;
- ver playlists públicas na Comunidade.

Funções principais:

- `carregarPlaylistsDaNuvem()`;
- `adicionarFilmeNaPlaylist()`;
- `removerFilmeDaPlaylist()`;
- `abrirVerPlaylist()`;
- `abrirVerPlaylistGlobal()`.

Os filmes da playlist são armazenados dentro do campo `filmes`, aparentemente como um array JSON/JSONB com objetos contendo dados como `id`, `titulo`, `ano`, `capa`, `sinopse` e notas.

### Cenas

A aba Cenas funciona como um feed vertical de vídeos curtos usando HTML5. A função principal é:

```text
carregarCenas()
```

Também existem:

- curtidas;
- comentários armazenados na própria linha da cena;
- carregamento preguiçoso de dados do TMDB;
- um player global para melhorar o comportamento em iOS.

Tabela utilizada:

```text
cenas_shorts
```

Os campos de comentários e curtidas são tratados como arrays JSON pelo JavaScript. Confira o schema real antes de fazer migrações.

### Comunidade

A aba Comunidade lista playlists públicas:

- mostra capa;
- mostra nome;
- mostra username do criador;
- mostra quantidade de filmes;
- permite curtir/descurtir;
- ordena por quantidade de curtidas e depois por nome;
- abre a playlist em modo somente leitura.

Tabela utilizada:

```text
playlists
```

Campos esperados pelo front-end:

```text
id
user_id
nome
capa_url
filmes
publica
curtidas
```

### Amigos e sistema social

A aba Amigos foi adicionada ao projeto.

Fluxo:

1. O usuário entra na aba Amigos.
2. Se ainda não possui perfil, escolhe um username.
3. O username é normalizado para letras minúsculas, números e `_`.
4. O usuário busca outro usuário por `@username`.
5. Envia um pedido.
6. O destinatário aceita ou rejeita.
7. Amigos aceitos podem visualizar:
   - Assistidos;
   - Quer Assistir;
   - Playlists.

IDs principais:

```text
setup-username-card
meu-perfil-card
secao-pedidos
secao-amigos-lista
modal-buscar-amigo
modal-perfil-amigo
```

Funções principais:

- `verificarPerfil()`;
- `carregarAmigos()`;
- `atualizarBadgeAmigos()`;
- `renderizarAbaAmigos()`;
- `buscarAmigo()`;
- `enviarPedido()`;
- `aceitarPedido()`;
- `rejeitarPedido()`;
- `abrirPerfilAmigo()`;
- `renderizarFilmesAmigo()`;
- `renderizarPlaylistsAmigo()`.

O perfil do amigo é carregado em um modal separado. A consulta usa explicitamente o `user_id` do amigo:

```javascript
supabaseClient.from('meus_filmes').select('*').eq('user_id', userId)
```

---

## 6. Banco de dados e RLS

O arquivo `supabase_social.sql` cria ou configura:

### `perfis`

Campos:

```text
id
user_id
username
created_at
```

Regras:

- `user_id` é único;
- `username` é único;
- usuários autenticados podem consultar perfis;
- cada usuário só pode gerenciar o próprio perfil.

### `amizades`

Campos:

```text
id
solicitante_id
destinatario_id
status
created_at
```

Status atuais:

```text
pendente
aceite
```

Regras:

- usuários podem consultar apenas amizades das quais participam;
- o solicitante pode inserir um pedido;
- o destinatário pode aceitar;
- qualquer participante pode remover a amizade.

### `meus_filmes`

O SQL ativa RLS e cria políticas para:

- o usuário ler os próprios filmes;
- inserir apenas filmes com seu próprio `user_id`;
- atualizar apenas os próprios filmes;
- remover apenas os próprios filmes;
- amigos aceitos lerem os filmes uns dos outros.

**Regra crítica:** as políticas do banco permitem que um amigo leia seus filmes, mas isso não significa que a tela “Minhas Listas” deve carregar filmes de amigos. A consulta da lista pessoal precisa continuar assim:

```javascript
supabaseClient
  .from('meus_filmes')
  .select('*')
  .eq('user_id', usuarioAtual.id)
```

E operações de alteração/remoção também devem filtrar pelo usuário atual.

### Outras tabelas usadas pelo front-end

O código também referencia estas tabelas:

```text
playlists
cenas_shorts
radar_curado
recomendacoes_amigos
```

Os schemas completos dessas tabelas não estão documentados no arquivo `supabase_social.sql`. Antes de alterar alguma delas, consulte o schema real no Supabase.

O bucket de Storage usado para capas é:

```text
capas
```

O arquivo SQL social não deve ser executado cegamente várias vezes sem conferir as políticas existentes. `CREATE POLICY` pode gerar erro se a política já existir. Em uma futura migração, prefira SQL idempotente, renomeie políticas conscientemente ou remova políticas antigas apenas após explicar o impacto.

---

## 7. Recomendações entre amigos

O modal de detalhes possui o botão Recomendar.

Fluxo:

1. Seleciona um amigo;
2. opcionalmente escreve uma mensagem;
3. grava uma recomendação;
4. o amigo vê a recomendação na Caixa de Entrada da aba Amigos;
5. pode abrir os detalhes ou organizar o filme na própria lista;
6. pode apagar a recomendação.

Tabela:

```text
recomendacoes_amigos
```

Campos usados no front-end:

```text
id
remetente_id
destinatario_id
tmdb_id
titulo_filme
capa_filme
mensagem
created_at
```

Funções:

- `carregarCaixaEntrada()`;
- `renderizarCaixaEntrada()`;
- `apagarRecomendacao()`.

---

## 8. Histórico de problemas e estado atual

### Bug dos filmes do amigo entrando na lista pessoal

Esse bug aconteceu quando a consulta principal de `meus_filmes` passou a receber dados permitidos pela política de amigos. A correção aplicada foi adicionar:

```javascript
.eq('user_id', usuarioAtual.id)
```

na carga da lista pessoal e também manter esse filtro nas operações de update/delete.

O fluxo ainda precisa ser validado com duas contas reais:

1. Conta A adiciona filmes.
2. Conta B vira amiga da Conta A.
3. Conta B abre o perfil da Conta A.
4. Conta B recarrega “Minhas Listas”.
5. Os filmes de A não podem aparecer na lista pessoal de B.
6. Remover um filme de B não pode apagar ou alterar um filme de A.

Não resolva esse problema removendo a política de leitura dos amigos. O correto é separar:

- consulta pessoal;
- consulta do perfil do amigo;
- consulta de playlists do amigo.

### Cache e Service Worker

Existe `service-worker.js`, mas há uma inconsistência importante:

- o `index.html` chama `navigator.serviceWorker.getRegistrations()` e desregistra todos os Service Workers no carregamento;
- portanto, o Service Worker pode não permanecer ativo;
- o `service-worker.js` atual usa a cache `icine-v2`;
- ele utiliza estratégia Network First;
- a lista de assets inclui `./`, `./index.html` e `./manifest.json`;
- ele faz cache de qualquer requisição GET que não falhe, inclusive podendo capturar chamadas externas, apesar do comentário dizer que APIs seriam ignoradas.

Se for corrigir PWA/cache:

1. escolha conscientemente entre remover o Service Worker ou mantê-lo;
2. não deixe o `index.html` desregistrar o Service Worker se a intenção é usar PWA offline;
3. se mantiver cache, limite o cache aos assets do próprio app;
4. trate atualização de versão com uma estratégia consistente;
5. teste atualização em navegador normal e no modo instalado;
6. não prometa que o ícone será atualizado instantaneamente em todos os dispositivos.

### Ícone PWA

O manifest aponta para:

```text
icon-512.png
```

O arquivo tem resolução 512×512, mas atualmente seu conteúdo é JPEG, apesar da extensão `.png`. Isso deve ser corrigido convertendo a imagem para um PNG verdadeiro. Também é recomendável adicionar:

```html
<link rel="apple-touch-icon" href="icon-512.png">
```

e, se possível, gerar versões reais 192×192 e 512×512.

### Credenciais expostas

O front-end contém chaves de serviços diretamente no JavaScript. Isso é uma pendência de segurança prioritária, especialmente a chave do Groq. A próxima IA deve:

- não imprimir os valores;
- não colocá-los em documentação;
- não criar outra chave hardcoded;
- propor um backend ou endpoint server-side;
- usar o sistema de secrets do ambiente;
- recomendar rotação de qualquer chave privada já exposta.

### Consistência de campos de filmes

O código lê campos como:

```text
notaTmdb
notaImdb
notaRt
```

mas a função de inserção de filme usa uma propriedade chamada `nota` em parte do objeto. Antes de modificar ratings, confira as colunas reais da tabela `meus_filmes` e padronize o modelo para não perder dados.

---

## 9. Pontos de atenção de segurança e qualidade

Há bastante HTML gerado com template strings e dados vindos do TMDB, Supabase ou usuário. Ao adicionar novas telas:

- escape conteúdo antes de inserir em `innerHTML`;
- prefira `textContent` quando não for necessário HTML;
- não use username, nome de playlist ou mensagem de usuário diretamente em atributos `onclick`;
- evite XSS em comentários, playlists, usernames e recomendações;
- valide IDs no cliente, mas não confie apenas nessa validação;
- mantenha RLS como proteção real no banco;
- confira autorização também em operações de likes, playlists e recomendações.

Existem algumas áreas de dívida técnica:

- `index.html` é grande e contém responsabilidades demais;
- há estilos duplicados e regras CSS que se sobrescrevem;
- há atribuições duplicadas de eventos em alguns pontos do modal de detalhes;
- muitos erros de Supabase são ignorados;
- várias chamadas não exibem estado de carregamento ou erro detalhado;
- não há testes automatizados confirmados;
- os players e addons externos devem ser tratados com cuidado quanto à disponibilidade, segurança e direitos de uso.

Não transforme essas observações em uma refatoração ampla sem uma tarefa específica.

---

## 10. Plano recomendado para futuras evoluções

### Curto prazo

1. Validar o fluxo social com duas contas.
2. Corrigir e testar o isolamento das listas pessoais.
3. Confirmar o schema real de todas as tabelas usadas.
4. Melhorar mensagens de erro das operações do Supabase.
5. Corrigir o formato real do ícone PWA.
6. Decidir e corrigir a estratégia do Service Worker.
7. Remover chaves privadas do front-end.

### Médio prazo

1. Criar um backend pequeno para Groq e demais APIs privadas.
2. Extrair JavaScript e CSS do `index.html` sem mudar comportamento.
3. Criar camada única de acesso ao Supabase.
4. Padronizar o modelo de dados de filmes.
5. Adicionar estados de loading, vazio, erro e sucesso.
6. Adicionar testes para autorização e isolamento entre usuários.
7. Adicionar paginação real no feed social e nas listas.

### Evoluções sociais possíveis

- desfazer amizade;
- cancelar pedido enviado;
- bloquear usuário;
- privacidade individual para lista, perfil e playlist;
- filmes em comum;
- comentários em playlists;
- reações nas recomendações;
- feed de atividade;
- notificações;
- busca por nome;
- ordenação e filtros nas listas de amigos.

Não implemente essas evoluções sem conferir o modelo atual de permissões.

---

## 10A. Contexto adicional fornecido pelo Gemini

O contexto original usado no desenvolvimento descreve o iCine como uma plataforma
pessoal de filmes que combina:

- diário de filmes;
- comunidade de cinéfilos;
- agregação de informações de streaming;
- feed de edições de filmes no estilo TikTok/Reels;
- integração com Stremio;
- players web incorporados.

Esse contexto confirma que o modal de detalhes é o centro da experiência. A versão
atual já refinou:

- botões com estética Glassmorphism;
- proporção 16:9 para o trailer de fundo;
- cantos inferiores arredondados no hero;
- trailer do YouTube em autoplay silencioso;
- escala do iframe para esconder elementos visuais indesejados do YouTube.

### Próximo desafio principal: suporte a séries de TV

A próxima grande evolução planejada é permitir filmes **e séries de TV** no mesmo
produto. Essa mudança deve ser planejada antes de ser implementada, porque afeta o
modelo de dados, a busca, os cards, os detalhes, as listas, as playlists e o
player.

Requisitos funcionais planejados:

1. O usuário deve conseguir pesquisar séries usando o endpoint de TV do TMDB:

   ```text
   /search/tv
   /discover/tv
   /tv/{id}
   ```

2. O app deve distinguir filme de série no Supabase. A solução provável é uma
   coluna como:

   ```text
   tipo = 'filme' | 'serie'
   ```

   Não altere a tabela antes de conferir o schema atual de `meus_filmes`,
   `playlists` e os dados já salvos.

3. O modal de detalhes deve identificar o tipo de conteúdo e adaptar:

   - título original e título exibido;
   - ano/data de lançamento;
   - sinopse;
   - nota;
   - trailer;
   - provedores oficiais;
   - botões de organização;
   - botão Stremio;
   - player web.

4. Para séries, o fluxo de reprodução precisa pedir:

   - temporada;
   - episódio;
   - confirmação para abrir o conteúdo.

5. O player web e o deep link do Stremio precisam receber os parâmetros
   apropriados para conteúdo episódico, sem quebrar o fluxo de filmes.

6. Playlists podem conter filmes e séries. O objeto armazenado no campo `filmes`
   deve carregar o tipo do conteúdo e os identificadores necessários para abrir
   novamente os detalhes.

7. As listas “Quero Assistir” e “Assistidos Recentemente” devem continuar
   funcionando para os dois tipos sem misturar IDs incompatíveis.

### Recomendação de implementação para séries

Antes de adicionar telas, faça uma análise de impacto:

1. Padronize um modelo interno de conteúdo, por exemplo:

   ```javascript
   {
     id: Number,
     tipo: 'filme' ou 'serie',
     titulo: String,
     tituloOriginal: String,
     ano: String,
     notaTmdb: String,
     notaImdb: String,
     notaRt: String,
     capa: String,
     sinopse: String,
     temporadas: Number opcional
   }
   ```

2. Separe claramente:

   - `tmdb_id` do filme;
   - `tmdb_id` da série;
   - `tipo` do conteúdo;
   - `temporada` e `episodio` quando necessário.

3. Evite assumir que todo ID TMDB é filme.
4. Não duplique todo o código de cards e detalhes; crie normalizadores ou
   adaptadores pequenos quando isso reduzir risco.
5. Preserve a compatibilidade com registros antigos, que provavelmente ainda não
   têm a coluna `tipo`.
6. Faça uma migração reversível e explique o impacto antes de executá-la.
7. Teste separadamente:

   - busca de filme;
   - busca de série;
   - salvar filme;
   - salvar série;
   - abrir detalhes de filme;
   - abrir detalhes de série;
   - adicionar ambos à mesma playlist;
   - remover cada tipo;
   - ver conteúdo de um amigo;
   - recarregar a página.

### Regra de comunicação para mudanças futuras

O arquivo `index.html` é muito grande. Ao apresentar alterações para o usuário:

- envie apenas os blocos que precisam ser substituídos ou adicionados;
- indique com clareza onde cada bloco deve ser colocado;
- não envie a página inteira, salvo se o usuário solicitar;
- explique se uma alteração exige SQL, mudança de tabela, configuração no
  Supabase, nova secret ou novo endpoint;
- não diga que uma mudança está pronta sem verificar o comportamento real.

### Regras de estilo para novas telas

- manter HTML, CSS e JavaScript Vanilla;
- não introduzir Tailwind, Bootstrap ou outro framework sem pedido explícito;
- preservar a estética Glassmorphism;
- usar fundo escuro, bordas sutis, blur, gradientes roxo/rosa e componentes
  adequados para toque;
- manter o layout responsivo e prioritariamente mobile;
- não sacrificar acessibilidade, estados de carregamento ou mensagens de erro por
  causa do visual.

---

## 11. Checklist de validação antes de entregar uma alteração

### Front-end

- A tela abre sem erro no console?
- Login e logout continuam funcionando?
- A alteração funciona em tela pequena?
- Modais abrem e fecham corretamente?
- O botão voltar do navegador não deixa modal aberto incorretamente?
- Nenhum card pessoal recebe dados de outro usuário?
- Estados vazios e erros são tratados?

### Supabase

- A consulta usa o `user_id` correto?
- A operação depende de uma política RLS existente?
- O schema da tabela foi confirmado?
- Erros de insert/update/delete são tratados?
- A alteração pode expor dados privados?

### PWA

- Manifesto continua válido?
- O MIME/formato dos ícones está correto?
- O Service Worker está realmente registrado?
- A atualização de versão foi testada?
- O app continua abrindo pelo workflow estático?

### Segurança

- Nenhuma chave foi adicionada ao código?
- Nenhum segredo apareceu na resposta?
- Dados inseridos por usuários estão escapados?
- Endpoints externos são realmente apropriados para chamada no navegador?

---

## 12. Pedido inicial para a próxima IA

Comece confirmando que entendeu este contexto. Em seguida:

1. faça uma inspeção rápida do estado atual do repositório;
2. compare o código real com este documento;
3. liste divergências encontradas;
4. não edite nada até identificar claramente a tarefa atual;
5. para qualquer bug envolvendo listas, usuários ou amigos, reproduza mentalmente o fluxo com duas contas e confira as consultas e políticas RLS;
6. para qualquer mudança de segurança, explique o risco antes de aplicar a correção.

O objetivo é evoluir o iCine com segurança, sem quebrar as listas pessoais, o sistema social, as playlists, o PWA ou a experiência mobile.