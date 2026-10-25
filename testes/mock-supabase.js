// Supabase falso para testes: tabelas em memória, filtros básicos, login já feito como u1
(function () {
  const agora = Date.now(); const dia = 86400000;
  const iso = (d) => new Date(agora - d * dia).toISOString();
  const capa = (n) => `https://image.tmdb.org/t/p/w500/capa${n}.jpg`;
  const filme = (uid, id, titulo, grupo, nota, tipo = 'filme') => ({ id: uid + '-' + id + '-' + grupo, user_id: uid, tmdb_id: id, titulo, ano: '2020', nota, capa: capa(id), sinopse: 'Sinopse', grupo, tipo });
  const db = window.__db = {
    perfis: [
      { user_id: 'u1', username: 'cinefiloadmin', foto_url: null, created_at: '2026-10-01T10:00:00Z' },
      { user_id: 'u2', username: 'superstar', foto_url: null, created_at: '2026-10-03T10:00:00Z' },
      { user_id: 'u3', username: 'estranho', foto_url: null, created_at: '2026-10-05T10:00:00Z' }
    ],
    meus_filmes: [
      filme('u1', 101, 'Capitão Fantástico', 'ja', '7.9'), filme('u1', 102, 'Outra Mamãe', 'ja', '6.1'), filme('u1', 103, 'Duna', 'ja', '7.8'),
      filme('u1', 104, 'A Chegada', 'ja', '7.6'), filme('u1', 900, 'Dark', 'ja', '8.4', 'serie'),
      filme('u1', 105, 'Hereditário', 'ja', '7.3'), filme('u1', 106, 'Midsommar', 'ja', '7.1'), filme('u1', 107, 'Corra!', 'ja', '7.6'), filme('u1', 108, 'Nós', 'ja', '6.8'), filme('u1', 109, 'A Bruxa', 'ja', '6.9'), filme('u1', 110, 'Fale Comigo', 'ja', '7.1'), filme('u1', 111, 'Longlegs', 'ja', '6.7'),
      filme('u1', 201, 'Idiocracia', 'quero', '6.4'), filme('u1', 202, 'Unabomber', 'quero', '6.6'),
      filme('u2', 101, 'Capitão Fantástico', 'ja', '7.9'), filme('u2', 103, 'Duna', 'ja', '7.8'), filme('u2', 301, 'A Viagem de Chihiro', 'ja', '8.5'),
      filme('u2', 302, 'Orgulho e Preconceito', 'ja', '7.8'), filme('u2', 401, 'Ponyo', 'quero', '7.7'),
      filme('u3', 104, 'A Chegada', 'ja', '7.6')
    ],
    avaliacoes: [
      { id: 'a1', user_id: 'u1', tmdb_id: 101, tipo: 'filme', titulo: 'Capitão Fantástico', ano: '2016', capa: capa(101), sinopse: 's', nota: 10, comentario: 'Lindo demais.', created_at: iso(1) },
      { id: 'a2', user_id: 'u1', tmdb_id: 102, tipo: 'filme', titulo: 'Outra Mamãe', ano: '2026', capa: capa(102), sinopse: 's', nota: 6, comentario: null, created_at: iso(2) },
      { id: 'a3', user_id: 'u1', tmdb_id: 103, tipo: 'filme', titulo: 'Duna', ano: '2021', capa: capa(103), sinopse: 's', nota: 9, comentario: 'Villeneuve sendo Villeneuve.', created_at: iso(3) },
      { id: 'a4', user_id: 'u2', tmdb_id: 101, tipo: 'filme', titulo: 'Capitão Fantástico', ano: '2016', capa: capa(101), sinopse: 's', nota: 9, comentario: 'Muito bom', created_at: iso(1) },
      { id: 'a5', user_id: 'u2', tmdb_id: 103, tipo: 'filme', titulo: 'Duna', ano: '2021', capa: capa(103), sinopse: 's', nota: 8, comentario: null, created_at: iso(2) },
      { id: 'a6', user_id: 'u2', tmdb_id: 301, tipo: 'filme', titulo: 'A Viagem de Chihiro', ano: '2001', capa: capa(301), sinopse: 's', nota: 10, comentario: 'Revi pela quinta vez e ainda chorei no trem.', created_at: iso(4) },
      { id: 'a7', user_id: 'u3', tmdb_id: 104, tipo: 'filme', titulo: 'A Chegada', ano: '2016', capa: capa(104), sinopse: 's', nota: 7, comentario: 'Bom, mas lento.', created_at: iso(0.5) }
    ],
    avaliacao_curtidas: [],
    playlists: [
      { id: 'p1', user_id: 'u1', nome: 'Favoritos da vida', capa_url: capa(1), filmes: [], publica: true, curtidas: [] },
      { id: 'p2', user_id: 'u2', nome: 'Ghibli', capa_url: capa(2), filmes: [], publica: true, curtidas: [] },
      { id: 'p3', user_id: 'u2', nome: 'Secreta', capa_url: capa(3), filmes: [], publica: false, curtidas: [] }
    ],
    amizades: [
      { id: 'f1', solicitante_id: 'u1', destinatario_id: 'u2', status: 'aceite' },
      { id: 'f2', solicitante_id: 'u3', destinatario_id: 'u1', status: 'pendente' }
    ],
    recomendacoes_amigos: [], push_subscriptions: [], cenas_shorts: [], comentarios_cenas: [], curtidas_cenas: []
  };
  window.__log = [];
  function builder(tabela) {
    const st = { filtros: [], or: null, ordem: null, limite: null, unico: null, op: 'select', valores: null, contar: false };
    const calc = () => {
      const t = db[tabela] || (db[tabela] = []);
      if (st.op === 'insert') { (Array.isArray(st.valores) ? st.valores : [st.valores]).forEach(v => t.push({ id: 'n' + Math.random().toString(36).slice(2), created_at: new Date().toISOString(), ...v })); window.__log.push(['insert', tabela, st.valores]); return { data: null, error: null }; }
      let linhas = t.filter(r => st.filtros.every(f => f(r)));
      if (st.or) { const ids = [...new Set((st.or.match(/u\d+/g) || []))]; linhas = linhas.filter(r => ids.length === 1 ? (ids.includes(r.solicitante_id) || ids.includes(r.destinatario_id)) : (ids.includes(r.solicitante_id) && ids.includes(r.destinatario_id))); }
      if (st.op === 'update') { linhas.forEach(r => Object.assign(r, st.valores)); window.__log.push(['update', tabela, st.valores]); return { data: null, error: null }; }
      if (st.op === 'delete') { db[tabela] = t.filter(r => !linhas.includes(r)); return { data: null, error: null }; }
      if (st.ordem) linhas = [...linhas].sort((a, b) => (a[st.ordem.c] > b[st.ordem.c] ? 1 : -1) * (st.ordem.asc ? 1 : -1));
      if (st.limite != null) linhas = linhas.slice(0, st.limite);
      if (st.unico) return { data: linhas[0] || null, error: null };
      return { data: linhas.map(r => ({ ...r })), error: null, count: linhas.length };
    };
    const b = new Proxy({}, { get(_, k) {
      if (k === 'then') return (ok, erro) => Promise.resolve().then(calc).then(ok, erro);
      if (k === 'select') return (_c, o) => { if (o && o.count) st.contar = true; return b; };
      if (k === 'eq') return (c, v) => { st.filtros.push(r => String(r[c]) === String(v)); return b; };
      if (k === 'neq') return (c, v) => { st.filtros.push(r => String(r[c]) !== String(v)); return b; };
      if (k === 'in') return (c, vs) => { st.filtros.push(r => vs.map(String).includes(String(r[c]))); return b; };
      if (k === 'or') return (s) => { st.or = s; return b; };
      if (k === 'order') return (c, o) => { st.ordem = { c, asc: !(o && o.ascending === false) }; return b; };
      if (k === 'limit') return (n) => { st.limite = n; return b; };
      if (k === 'range') return (a, z) => { st.limite = z - a + 1; return b; };
      if (k === 'maybeSingle' || k === 'single') return () => { st.unico = true; return b; };
      if (k === 'insert' || k === 'upsert') return (v) => { st.op = 'insert'; st.valores = v; return b; };
      if (k === 'update') return (v) => { st.op = 'update'; st.valores = v; return b; };
      if (k === 'delete') return () => { st.op = 'delete'; return b; };
      return () => b; // gte, lte, ilike, not, is...
    } });
    return b;
  }
  const cliente = {
    from: builder,
    rpc: async (nome, args) => {
      if (nome === 'contar_amigos') { const ids = new Set(); db.amizades.filter(a => a.status === 'aceite' && (a.solicitante_id === args.alvo || a.destinatario_id === args.alvo)).forEach(a => ids.add(a.solicitante_id === args.alvo ? a.destinatario_id : a.solicitante_id)); return { data: ids.size, error: null }; }
      return { data: null, error: null };
    },
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'u1', email: 'eu@teste.com' } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ error: null }), signUp: async () => ({ error: null }), signOut: async () => ({ error: null })
    },
    storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: (n) => ({ data: { publicUrl: 'https://x/' + n } }) }) },
    channel: () => { const c = { on: () => c, subscribe: () => c }; return c; }, removeChannel: () => {}
  };
  window.supabase = { createClient: () => cliente };
})();
