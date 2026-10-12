// iCine — este service worker agora só se desativa.
// Ele substitui a versão antiga (que guardava uma cópia velha do app no aparelho):
// apaga os caches, se remove e recarrega as abas abertas para mostrar a versão nova.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const chave of await caches.keys()) await caches.delete(chave);
    await self.registration.unregister();
    const abas = await self.clients.matchAll({ type: 'window' });
    abas.forEach((aba) => aba.navigate(aba.url));
  })());
});
