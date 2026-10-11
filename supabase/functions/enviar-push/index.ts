// iCine — Edge Function "enviar-push"
// Chamada pelo banco (gatilho em recomendacoes_amigos) a cada recomendação nova.
// Envia um aviso push para todos os aparelhos inscritos do destinatário.
//
// Segredos necessários (Supabase → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  — chaves do Web Push
//   WEBHOOK_SECRET                       — senha que o gatilho do banco manda no cabeçalho x-webhook-secret
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem automaticamente)
// Desligue "Verify JWT" desta função: quem chama é o banco, e a proteção é o WEBHOOK_SECRET.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? SUPABASE_URL,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

const cortar = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) {
    return new Response('forbidden', { status: 403 });
  }

  const evento = await req.json().catch(() => null);
  const rec = evento?.record;
  if (evento?.type !== 'INSERT' || evento?.table !== 'recomendacoes_amigos' || !rec?.destinatario_id) {
    return Response.json({ ignorado: true });
  }

  const [{ data: remetente }, { data: aparelhos }] = await Promise.all([
    supabase.from('perfis').select('username').eq('user_id', rec.remetente_id).maybeSingle(),
    supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', rec.destinatario_id),
  ]);
  if (!aparelhos?.length) return Response.json({ enviados: 0 });

  const quem = remetente?.username ? `@${remetente.username}` : 'Um amigo';
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
  const mortos: string[] = [];
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
      if (status === 404 || status === 410) mortos.push(a.id); // aparelho desinstalou ou revogou: limpa
      else console.error('Falha ao enviar push', status, (e as Error).message);
    }
  }));
  if (mortos.length) await supabase.from('push_subscriptions').delete().in('id', mortos);

  return Response.json({ enviados, removidos: mortos.length });
});
