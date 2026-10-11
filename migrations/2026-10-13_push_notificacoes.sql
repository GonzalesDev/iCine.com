-- ============================================================
-- iCine — Avisos no celular (Web Push) para recomendações
-- UM SCRIPT SÓ. Rode inteiro no Supabase: SQL Editor → New query → cole → Run.
-- Pode rodar mais de uma vez sem problema.
--
-- ANTES de rodar: no gatilho (item 4), trocar o valor do cabeçalho x-webhook-secret
-- pelo mesmo valor do Secret WEBHOOK_SECRET (Edge Functions → Secrets).
-- Nunca commitar o valor real.
-- ============================================================

-- 1) Extensão que faz as chamadas HTTP do banco para a Edge Function
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2) Aparelhos que aceitaram receber avisos (um usuário pode ter vários)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions (user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cada um só vê e remove os próprios aparelhos
DROP POLICY IF EXISTS "Ver os proprios aparelhos" ON public.push_subscriptions;
CREATE POLICY "Ver os proprios aparelhos"
  ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Remover os proprios aparelhos" ON public.push_subscriptions;
CREATE POLICY "Remover os proprios aparelhos"
  ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3) Função que o app chama para gravar o aparelho (rpc 'registrar_push')
--    Se o mesmo celular trocar de conta, ele passa a pertencer à conta atual.
CREATE OR REPLACE FUNCTION public.registrar_push(p_endpoint TEXT, p_p256dh TEXT, p_auth TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth)
  VALUES (auth.uid(), p_endpoint, p_p256dh, p_auth)
  ON CONFLICT (endpoint) DO UPDATE
    SET user_id = auth.uid(), p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth;
$$;

REVOKE ALL ON FUNCTION public.registrar_push(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_push(TEXT, TEXT, TEXT) TO authenticated;

-- 4) Gatilho: a cada recomendação nova, chama a Edge Function enviar-push.
--    Acha sozinho o schema do pg_net. Se der erro, registra o motivo nos logs
--    e NÃO impede a recomendação de ser salva.
CREATE OR REPLACE FUNCTION public.notificar_push_recomendacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  sch TEXT;
BEGIN
  SELECT COALESCE(
    (SELECT n.nspname::text
       FROM pg_extension e
       JOIN pg_namespace n ON n.oid = e.extnamespace
      WHERE e.extname = 'pg_net'),
    'net')
  INTO sch;

  EXECUTE format('SELECT %I.http_post(url := $1, headers := $2, body := $3)', sch)
    USING
      'https://kvwwbnwpnrzghgblgjpj.supabase.co/functions/v1/enviar-push',
      jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', 'COLE_AQUI_O_SEGREDO'),
      jsonb_build_object('type', 'INSERT', 'table', 'recomendacoes_amigos', 'record', to_jsonb(NEW));

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Falha ao disparar aviso de recomendação: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_push_recomendacao ON public.recomendacoes_amigos;
CREATE TRIGGER trg_push_recomendacao
  AFTER INSERT ON public.recomendacoes_amigos
  FOR EACH ROW EXECUTE FUNCTION public.notificar_push_recomendacao();

-- Conferência: deve listar 3 linhas: tabela (0), gatilho e pg_net
SELECT 'tabela' AS item, COUNT(*)::text AS valor FROM public.push_subscriptions
UNION ALL
SELECT 'gatilho', tgname FROM pg_trigger WHERE tgname = 'trg_push_recomendacao'
UNION ALL
SELECT 'pg_net', extname FROM pg_extension WHERE extname = 'pg_net';


-- COMO REVERTER (não rode agora)
--   DROP TRIGGER IF EXISTS trg_push_recomendacao ON public.recomendacoes_amigos;
--   DROP FUNCTION IF EXISTS public.notificar_push_recomendacao();
--   DROP FUNCTION IF EXISTS public.registrar_push(TEXT, TEXT, TEXT);
--   DROP TABLE IF EXISTS public.push_subscriptions;
