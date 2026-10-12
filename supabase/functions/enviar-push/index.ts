// iCine — Edge Function "enviar-push"
// Chamada pelo gatilho do banco (trg_push_recomendacao) a cada recomendação nova.
// O próprio banco manda no corpo os aparelhos do destinatário e o nome de quem recomendou,
// então esta função NÃO lê o banco e não precisa de chave de acesso ao banco.
//
// Secrets necessários (Edge Functions → Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, WEBHOOK_SECRET
// "Verify JWT" deve ficar DESLIGADO.

import webpush from 'npm:web-push@3.6.7';

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'https://kvwwbnwpnrzghgblgjpj.supabase.co',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

const cortar = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

type Aparelho = { id: string; endpoint: string; p256dh: string; auth: string };

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) {
    return new Response('forbidden', { status: 403 });
  }

  const evento = await req.json().catch(() => null);
  const rec = evento?.record;
  if (evento?.type !== 'INSERT' || evento?.table !== 'recomendacoes_amigos' || !rec?.destinatario_id) {
    return Response.json({ ignorado: true });
  }

  const aparelhos: Aparelho[] = evento.aparelhos ?? [];
  if (!aparelhos.length) return Response.json({ enviados: 0, expirados: 0, aparelhos: 0 });

  const quem = evento.remetente ? `@${evento.remetente}` : 'Um amigo';
  const oQue = rec.tipo === 'serie' ? 'a série' : 'o filme';
  let corpo = `${quem} recomendou ${oQue} ${rec.titulo_filme}`;
  if (rec.mensagem) corpo += `\n“${cortar(String(rec.mensagem), 100)}”`;
  const mensagem = JSON.stringify({
    titulo: 'Nova recomendação 🎬',
    corpo,
    imagem: rec.capa_filme || undefined,
    tag: `rec-${rec.id ?? Date.now()}`,
    aba: 'amigos',
  });

  let enviados = 0;
  const expirados: string[] = [];
  await Promise.all(aparelhos.map(async (a) => {
    try {
      await webpush.sendNotification(
        { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
        mensagem,
        { TTL: 60 * 60 * 24, urgency: 'normal' },
      );
      enviados++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) expirados.push(a.id); // aparelho desinstalou ou revogou
      else console.error('Falha ao enviar push', status, (e as Error).message);
    }
  }));

  return Response.json({ enviados, expirados: expirados.length, aparelhos: aparelhos.length });
});
