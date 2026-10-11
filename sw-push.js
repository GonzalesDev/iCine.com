// iCine — service worker só para AVISOS (push). Não guarda arquivos em cache nem intercepta nada:
// o app continua sempre carregando a versão mais nova da internet.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Chegou um aviso do servidor (função enviar-push no Supabase)
self.addEventListener('push', (event) => {
  let dados = {};
  try { dados = event.data ? event.data.json() : {}; } catch (e) { dados = { corpo: event.data ? event.data.text() : '' }; }
  const titulo = dados.titulo || 'iCine';
  event.waitUntil(self.registration.showNotification(titulo, {
    body: dados.corpo || '',
    icon: dados.icone || './icon-512.png',
    badge: './icon-512.png',
    image: dados.imagem || undefined,
    tag: dados.tag || undefined,          // mesma tag substitui o aviso anterior em vez de empilhar
    data: { aba: dados.aba || 'amigos' }
  }));
});

// Tocou no aviso: abre o app (ou traz o que já está aberto) direto na aba certa
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const aba = (event.notification.data && event.notification.data.aba) || 'amigos';
  event.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of abertas) {
      if ('focus' in c) { await c.focus(); c.postMessage({ aba }); return; }
    }
    await self.clients.openWindow(`./?aba=${encodeURIComponent(aba)}`);
  })());
});
