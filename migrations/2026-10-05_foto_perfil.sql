-- ============================================================
-- iCine — Foto de perfil
-- Rode no Supabase: Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Guarda o link da foto de cada usuário. Quem não tiver foto continua
-- vendo a inicial do nome. Nenhum dado é apagado; as políticas de
-- perfis (cada um edita o próprio) já cobrem a atualização.
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Conferência: deve listar os perfis com foto_url vazia
SELECT username, foto_url FROM public.perfis LIMIT 5;


-- COMO REVERTER (não rode agora)
--   ALTER TABLE public.perfis DROP COLUMN IF EXISTS foto_url;
