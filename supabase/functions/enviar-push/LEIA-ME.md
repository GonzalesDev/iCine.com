# enviar-push

Edge Function que manda o aviso (Web Push) quando alguém recomenda um filme/série.

Fluxo: `recomendacoes_amigos` (INSERT) → gatilho `trg_push_recomendacao` (pg_net) → esta função
→ aviso no celular. O gatilho manda no corpo os aparelhos do destinatário (`aparelhos`) e o nome de quem
recomendou (`remetente`), então a função NÃO lê o banco e não precisa de chave de acesso ao banco.

Configuração (uma vez), no Supabase:
1. Rodar `migrations/2026-10-13_push_notificacoes.sql` (trocando `COLE_AQUI_O_SEGREDO`).
2. Edge Functions → criar `enviar-push` com o conteúdo de `index.ts` e **desligar "Verify JWT"**.
3. Edge Functions → Secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `WEBHOOK_SECRET`
   (não é preciso nenhuma chave de service role)
   (o mesmo valor colocado no SQL). A chave pública também está em `index.html` (`VAPID_PUBLIC_KEY`).

Se trocar o par de chaves VAPID, a pública no `index.html` e os Secrets precisam ser trocados juntos, e
cada pessoa precisa reativar os avisos (as inscrições antigas deixam de valer).
Nunca commitar a chave privada nem o WEBHOOK_SECRET.
