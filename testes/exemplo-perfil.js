const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'mock-supabase.js'), 'utf8');
const BASE = 'http://127.0.0.1:5077/';
function tmdb(url) {
  if (/\/search\/(movie|tv)/.test(url)) { const tv = url.includes('/search/tv'); return { results: [1, 2, 3, 4].map(n => ({ id: (tv ? 600 : 500) + n, title: tv ? undefined : 'Duna ' + n, name: tv ? 'Série ' + n : undefined, release_date: '202' + n + '-01-01', first_air_date: '201' + n + '-01-01', poster_path: '/s' + n + '.jpg', overview: 'x' })) }; }
  if (url.includes('/search/person')) return { results: [
    { id: 7002, name: 'Fernando Meirelles', gender: 2, known_for_department: 'Directing', profile_path: '/fm.jpg', known_for: [{ title: 'Cidade de Deus' }], popularity: 30 },
    { id: 7001, name: 'Fernanda Torres', gender: 1, known_for_department: 'Acting', profile_path: '/ft.jpg', known_for: [{ title: 'Ainda Estou Aqui' }, { title: 'O Que É Isso, Companheiro?' }], popularity: 10 },
    { id: 7003, name: 'Fernanda Montenegro', gender: 1, known_for_department: 'Acting', profile_path: null, known_for: [{ title: 'Central do Brasil' }], popularity: 8 } ] };
  const pm = url.match(/\/person\/(\d+)/);
  if (pm) { const cast = []; for (let k = 0; k < 13; k++) cast.push({ id: k === 0 ? 101 : 800 + k, media_type: 'movie', title: 'Filme ' + k, release_date: (2000 + k) + '-01-01', poster_path: '/pp' + k + '.jpg', vote_count: 1000 - k * 10, vote_average: 7.1 });
    cast.push({ id: 990, media_type: 'tv', name: 'Talk Show', genre_ids: [10767], poster_path: '/t.jpg', vote_count: 5000, character: 'Self' });
    cast.push({ id: 101, media_type: 'movie', title: 'Filme 0 repetido', poster_path: '/pp0.jpg', vote_count: 999 });
    return { id: Number(pm[1]), name: 'Fernanda Torres', gender: 1, known_for_department: 'Acting', place_of_birth: 'Rio de Janeiro, Brasil', birthday: '1965-09-15', profile_path: '/ft.jpg', combined_credits: { cast, crew: [{ id: 950, media_type: 'movie', job: 'Director', title: 'Curta dela', release_date: '2010-01-01', poster_path: '/c.jpg', vote_count: 3 }] } }; }
  const m = url.match(/\/(movie|tv)\/(\d+)(\?|$)/); const id = m ? Number(m[2]) : 0;
  return { results: [], total_pages: 1, page: 1, id, title: 'T' + id, name: 'T' + id, genres: [{ name: 'Drama' }], runtime: 100, backdrop_path: '/fundo' + id + '.jpg', poster_path: '/p.jpg', vote_average: 7.5, overview: 'x', seasons: [], imdb_id: null };
}
const cor = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const erros = [];
  async function pagina(vp, extra = '') {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => erros.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) erros.push('console: ' + m.text()); });
    p.on('dialog', d => { erros.push('dialog: ' + d.message()); d.dismiss(); });
    await p.route('**/*', (r) => {
      const u = r.request().url();
      if (u.startsWith(BASE)) return r.continue();
      if (u.includes('supabase-js')) return r.fulfill({ contentType: 'application/javascript', body: MOCK });
      if (u.includes('api.themoviedb.org')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify(tmdb(u)) });
      if (u.includes('image.tmdb.org') || u.startsWith('https://x/') || /\.(jpg|png)(\?|$)/.test(u)) return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${cor(u)},70%,55%)"/><stop offset="1" stop-color="hsl(${cor(u)},60%,18%)"/></linearGradient></defs><rect width="200" height="300" fill="url(#g)"/></svg>` });
      return r.abort();
    });
    await p.goto(BASE + 'index.html?visual=novo' + extra, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    return p;
  }
  const vis = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; }, sel);
  const r = {};
  const p = await pagina({ width: 375, height: 812 });
  await p.click('#btn-amigos');
  await p.waitForSelector('#pf-tela .pf-numeros');
  r.perfil = await p.evaluate(() => ({
    icones: ['#pf-trocar-capa', '#pf-compartilhar', '#pf-trocar-foto'].map(s => !!document.querySelector(s)),
    botoesGrandes: document.querySelectorAll('#pf-tela .pf-acoes .pf-btn').length,
    amigosPill: document.querySelector('#pf-ver-amigos')?.innerText.replace(/\n/g, ' '),
    top5: [...document.querySelectorAll('#pf-tela .pf-bloco h3')].map(h => h.childNodes[0].textContent),
    vagosFilmes: document.querySelectorAll('#pf-tela .pf-top5')[0]?.querySelectorAll('.pf-vago').length,
    favoritos: [...document.querySelectorAll('.pf-fav')].map(f => f.innerText.replace(/\n/g, ' ')),
    capasGrade: document.querySelectorAll('#pf-conteudo .pf-capa').length, verTudo: document.querySelector('[data-ver-tudo]')?.innerText,
    duplas: [...document.querySelectorAll('#pf-conteudo .pf-selos')].filter(x => x.children.length === 2).map(x => x.innerText.replace(/\s+/g, ' ')),
    semCinefilo: !document.getElementById('pf-numeros-cinefilo') }));
  await p.click('[data-ver-tudo]'); r.depoisVerTudo = await p.evaluate(() => document.querySelectorAll('#pf-conteudo .pf-capa').length + ' / ' + document.querySelector('[data-ver-tudo]').innerText);
  await p.click('[data-ver-tudo]');
  await p.screenshot({ path: path.join(__dirname, 'v2-perfil-topo.png') });

  // ---- Top 5 ----
  await p.click('.pf-acao[data-editar-top="filme"]');
  await p.waitForSelector('#modal-top5', { state: 'visible' });
  await p.fill('#t5-busca', 'duna'); await p.waitForSelector('#t5-resultados [data-add]');
  for (const i of [0, 1, 2]) { await p.click(`#t5-resultados [data-add="${i}"]`); await p.waitForTimeout(100); }
  r.top5Slots = await p.evaluate(() => [...document.querySelectorAll('#t5-slots .t5-slot[data-i] img')].map(i => i.alt));
  const a = await p.locator('#t5-slots .t5-slot[data-i="0"]').boundingBox(); const c2 = await p.locator('#t5-slots .t5-slot[data-i="2"]').boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
  for (let k = 1; k <= 10; k++) await p.mouse.move(a.x + a.width / 2 + (c2.x - a.x) * k / 10, a.y + a.height / 2);
  await p.mouse.up(); await p.waitForTimeout(200);
  r.top5DepoisArrastar = await p.evaluate(() => [...document.querySelectorAll('#t5-slots .t5-slot[data-i] img')].map(i => i.alt));
  r.top5Salvo = await p.evaluate(() => window.__db.perfis.find(x => x.user_id === 'u1').top_filmes.map(t => t.titulo));
  await p.screenshot({ path: path.join(__dirname, 'v2-top5.png') });
  await p.click('#t5-slots [data-remover="1"]'); await p.waitForTimeout(150);
  await p.click('#modal-top5 .tf-chips button[data-tipo="serie"]'); await p.waitForSelector('#t5-resultados [data-add]');
  await p.click('#t5-resultados [data-add="0"]'); await p.waitForTimeout(150);
  r.salvoFinal = await p.evaluate(() => { const x = window.__db.perfis.find(y => y.user_id === 'u1'); return { filmes: x.top_filmes.map(t => t.titulo), series: x.top_series.map(t => t.titulo) }; });
  await p.click('#t5-pronto'); await p.waitForTimeout(400);
  r.voltouPerfil = (await vis(p, '#modal-perfil')) && !(await vis(p, '#modal-top5'));
  r.top5NoPerfil = await p.evaluate(() => [...document.querySelectorAll('#pf-tela .pf-top5')].map(t => t.querySelectorAll('.pf-pos').length + ' + ' + t.querySelectorAll('.pf-vago').length + ' vagos'));

  // ---- Favoritos ----
  await p.click('.pf-fav[data-escolher-fav="atriz"]');
  await p.waitForSelector('#modal-favorito', { state: 'visible' });
  await p.fill('#fav-busca', 'fern'); await p.waitForSelector('#fav-resultados [data-escolher]');
  r.favOrdem = await p.evaluate(() => [...document.querySelectorAll('#fav-resultados .tf-res')].map(x => x.innerText.replace(/\n/g, ' | ')));
  await p.click('#fav-resultados [data-escolher="0"]'); await p.waitForTimeout(200);
  r.favAtual = await p.evaluate(() => document.getElementById('fav-atual').innerText);
  await p.screenshot({ path: path.join(__dirname, 'v2-favorito.png') });
  await p.click('#fav-voltar'); await p.waitForTimeout(400);
  r.favNoPerfil = await p.evaluate(() => [...document.querySelectorAll('.pf-fav')].map(f => f.innerText.replace(/\n/g, ' ')));
  r.favSalvo = await p.evaluate(() => window.__db.perfis.find(y => y.user_id === 'u1').favoritos);
  // ---- Pessoa ----
  await p.click('.pf-fav[data-pessoa]'); await p.waitForSelector('#pp-tela .pp-grade .pf-capa');
  r.pessoa = await p.evaluate(() => ({ nome: document.querySelector('#pp-tela .pf-nome').innerText, sub: document.querySelector('#pp-tela .pf-arroba').innerText, prog: document.querySelector('.pp-progresso')?.innerText.replace(/\n/g, ' '),
    abas: [...document.querySelectorAll('[data-pp-aba]')].map(b => b.innerText), capas: document.querySelectorAll('#pp-tela .pp-grade .pf-capa').length, viu: document.querySelectorAll('#pp-tela .pf-viu').length, talkShow: document.body.innerText.includes('Talk Show') }));
  await p.screenshot({ path: path.join(__dirname, 'v2-pessoa.png') });
  await p.click('#pp-tela .pp-grade .pf-capa'); await p.waitForTimeout(500);
  r.pessoaAbreDetalhes = await vis(p, '#modal-detalhes');
  await p.goBack(); await p.waitForTimeout(300); await p.click('#pp-voltar'); await p.waitForTimeout(300);
  r.pessoaFechou = !(await vis(p, '#modal-pessoa')) && await vis(p, '#modal-perfil');

  // ---- Capa e foto ----
  const png = path.join(__dirname, 'img.png');
  if (!fs.existsSync(png)) fs.writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAAFAQEBaIsPfgAAAABJRU5ErkJggg==', 'base64'));
  await p.setInputFiles('#input-capa-perfil', png); await p.waitForTimeout(800);
  r.capa = await p.evaluate(() => ({ banner: document.getElementById('pf-banner').style.backgroundImage.slice(0, 40), salvo: window.__db.perfis.find(y => y.user_id === 'u1').capa_url?.slice(0, 20) }));
  await p.setInputFiles('#input-foto-perfil', png); await p.waitForTimeout(800);
  r.foto = await p.evaluate(() => ({ img: !!document.querySelector('#pf-tela .pf-foto img'), header: !!document.querySelector('#btn-amigos img') }));

  // ---- Amigos ----
  await p.click('#pf-ver-amigos'); await p.waitForSelector('#modal-amigos', { state: 'visible' }); await p.waitForTimeout(600);
  r.amigos = await p.evaluate(() => ({ busca: getComputedStyle(document.getElementById('am-busca')).display, pedidos: document.getElementById('lista-pedidos').innerText.replace(/\n/g, ' '), lista: [...document.querySelectorAll('#lista-amigos .amigo-item')].map(x => x.innerText), push: getComputedStyle(document.getElementById('push-box')).display, setup: getComputedStyle(document.getElementById('setup-username-card')).display, abaAntiga: !!document.getElementById('aba-amigos') }));
  await p.screenshot({ path: path.join(__dirname, 'v2-amigos.png') });
  await p.click('#lista-amigos .amigo-item'); await p.waitForFunction(() => document.querySelector('#pf-tela .pf-nome')?.textContent === 'superstar' && document.querySelector('#pf-tela .pf-numeros'));
  r.amigoAbriu = { amigosFechou: !(await vis(p, '#modal-amigos')), perfil: await vis(p, '#modal-perfil') };
  r.perfilAmiga = await p.evaluate(() => ({ icones: ['#pf-trocar-capa', '#pf-compartilhar', '#pf-trocar-foto'].map(s => !!document.querySelector(s)), botao: document.querySelector('#pf-amizade')?.innerText, top5: document.querySelectorAll('#pf-tela .pf-top5').length, favs: document.querySelectorAll('.pf-fav').length }));
  await p.click('#pf-voltar'); await p.waitForFunction(() => document.querySelector('#pf-tela .pf-nome')?.textContent === 'cinefiloadmin' && document.querySelector('#pf-tela .pf-numeros'));
  r.voltarVoltaParaMeu = await vis(p, '#modal-perfil');
  // busca de usuário
  await p.click('#pf-ver-amigos'); await p.waitForSelector('#modal-amigos', { state: 'visible' });
  await p.fill('#input-busca-amigo', 'estranho'); await p.click('#btn-pesquisar-amigo'); await p.waitForSelector('#resultado-busca-amigo .amigo-item');
  await p.click('#resultado-busca-amigo .amigo-username'); await p.waitForFunction(() => document.querySelector('#pf-tela .pf-nome')?.textContent === 'estranho' && document.querySelector('#pf-amizade'));
  r.buscaAbrePerfil = await p.evaluate(() => document.querySelector('#pf-amizade').innerText);
  await p.close();
  // ---- link dos avisos ----
  const p3 = await pagina({ width: 375, height: 812 }, '&aba=amigos'); await p3.waitForTimeout(800);
  r.linkAvisoAbreAmigos = await vis(p3, '#modal-amigos'); await p3.close();
  // ---- computador ----
  const p2 = await pagina({ width: 1366, height: 768 }); await p2.click('#btn-amigos'); await p2.waitForSelector('#pf-tela .pf-numeros'); await p2.waitForTimeout(400);
  await p2.screenshot({ path: path.join(__dirname, 'v2-computador.png') }); await p2.close();
  console.log(JSON.stringify(r, null, 1)); console.log('ERROS:', erros.length ? erros : 'nenhum');
  await b.close();
})().catch(e => { console.error('FALHOU:', e); process.exit(1); });
