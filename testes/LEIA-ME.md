# Ferramentas de teste do iCine

O app precisa de login no Supabase, então os testes trocam o Supabase e o TMDB por versões falsas.

## O que tem aqui
- `mock-supabase.js` — Supabase falso: tabelas em memória (`window.__db`), usuário logado `u1` (cinefiloadmin), amiga `u2` (superstar) e `u3` (estranho). Aceita `select/eq/or/order/insert/update/delete`, `rpc('contar_amigos')`, storage e auth.
- `exemplo-perfil.js` — teste completo do perfil (Top 5 com arrastar, favoritos, tela da pessoa, capa/foto, Amigos, link `?perfil=`).
- `exemplo-roleta.js` — teste da roleta no modo "Minha lista · Quero assistir".

## Como rodar (Playwright + Chromium)
1. Na raiz do projeto: `python3 -m http.server 5077`
2. Em outro terminal: `node testes/exemplo-perfil.js`

Os scripts usam `executablePath: '/opt/pw-browsers/chromium'` (caminho do ambiente anterior). Ajuste para o seu Chromium.
Cada script intercepta `supabase-js`, a API do TMDB e as imagens com `page.route`, abre `index.html?visual=novo` e imprime um JSON com o que verificou.

## Regras
- Testar sempre em 375×812 (celular) e 1366×768 (computador).
- Ao criar um teste novo, copie o padrão de rotas de um dos exemplos e acrescente os dados que precisar em `mock-supabase.js`.
- Esses arquivos são só de teste: não têm nenhuma chave real.
