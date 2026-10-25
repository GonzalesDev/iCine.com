const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'mock-supabase.js'), 'utf8'); const BASE = 'http://127.0.0.1:5077/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const erros = []; const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  p.on('pageerror', e => erros.push(e.message));
  await p.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith(BASE)) return r.continue(); if (u.includes('supabase-js')) return r.fulfill({ contentType: 'application/javascript', body: MOCK });
    if (u.includes('api.themoviedb.org')) { if (u.includes('/genre/')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ genres: [{ id: 28, name: 'Ação' }, { id: 18, name: 'Drama' }] }) });
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ total_results: 40, results: [] }) }); }
    if (u.includes('image.tmdb.org') || /\.(png|jpg)/.test(u)) return r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#7c3aed"/></svg>' });
    return r.abort(); });
  await p.goto(BASE + 'index.html?visual=novo'); await p.waitForTimeout(1200);
  await p.click('#btn-roleta'); await p.waitForTimeout(400);
  await p.click('#aba-roleta .f-tipo[data-tipo="movie"]'); await p.waitForSelector('#rol-generos .f-genero');
  const primeiro = await p.evaluate(() => document.querySelector('#rol-generos .f-genero').innerText);
  await p.click('#rol-generos .f-genero'); await p.waitForTimeout(200);
  const rodape = await p.evaluate(() => document.querySelector('#rol-rodape button').innerText);
  const sub = await p.evaluate(() => document.getElementById('rol-generos-sub').innerText);
  await p.click('#rol-rodape button'); await p.waitForSelector('#rol-titulo', { state: 'visible' }); await p.waitForTimeout(400);
  const roda = await p.evaluate(() => ({ titulo: document.getElementById('rol-titulo').innerText, sub: document.getElementById('rol-sub').innerText, modo: document.getElementById('rol-tela').className }));
  await p.screenshot({ path: path.join(__dirname, 'roleta.png') });
  console.log(JSON.stringify({ primeiro, rodape, sub, roda, erros }, null, 1));
  await b.close();
})().catch(e => { console.error('FALHOU', e.message); process.exit(1); });
