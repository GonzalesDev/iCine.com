-- ============================================================
-- iCine — Avisos no celular (Web Push) para recomendações
-- Rode no Supabase: Dashboard → SQL Editor → New query → Run
--
-- ANTES: troque COLE_AQUI_O_SEGREDO (mais abaixo) pelo mesmo valor que você
-- cadastrar como WEBHOOK_SECRET em Edge Functions → Secrets.
-- ============================================================

-- 1) Aparelhos que aceitaram receber avisos (um usuário pode ter vários)
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

-- Cada um só vê e remove os próprios aparelhos (quem grava é a função registrar_push, abaixo)
DROP POLICY IF EXISTS "Ver os proprios aparelhos" ON public.push_subscriptions;
CREATE POLICY "Ver os proprios aparelhos"
  ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Remover os proprios aparelhos" ON public.push_subscriptions;
CREATE POLICY "Remover os proprios aparelhos"
  ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2) Gravar o aparelho. Se o mesmo celular trocar de conta, ele passa a pertencer à conta atual.
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

-- 3) Gatilho: a cada recomendação nova, chama a função enviar-push
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notificar_push_recomendacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://kvwwbnwpnrzghgblgjpj.supabase.co/functions/v1/enviar-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', 'COLE_AQUI_O_SEGREDO'),
    body    := jsonb_build_object('type', 'INSERT', 'table', 'recomendacoes_amigos', 'record', to_jsonb(NEW))
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;   -- se o aviso falhar, a recomendação é salva do mesmo jeito
END;
$$;

DROP TRIGGER IF EXISTS trg_push_recomendacao ON public.recomendacoes_amigos;
CREATE TRIGGER trg_push_recomendacao
  AFTER INSERT ON public.recomendacoes_amigos
  FOR EACH ROW EXECUTE FUNCTION public.notificar_push_recomendacao();

-- Conferência: deve listar a tabela e o gatilho
SELECT 'tabela' AS item, COUNT(*)::text AS valor FROM public.push_subscriptions
UNION ALL
SELECT 'gatilho', tgname FROM pg_trigger WHERE tgname = 'trg_push_recomendacao';


-- COMO REVERTER (não rode agora)
--   DROP TRIGGER IF EXISTS trg_push_recomendacao ON public.recomendacoes_amigos;
--   DROP FUNCTION IF EXISTS public.notificar_push_recomendacao();
--   DROP FUNCTION IF EXISTS public.registrar_push(TEXT, TEXT, TEXT);
--   DROP TABLE IF EXISTS public.push_subscriptions;
