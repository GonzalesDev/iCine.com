-- ============================================================
-- iCine — Suporte a séries em recomendacoes_amigos
-- Rode no Supabase: Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Adiciona a coluna "tipo". Recomendações existentes viram 'filme'
-- automaticamente (DEFAULT). Nenhum dado é apagado. As políticas RLS
-- não mudam.
ALTER TABLE public.recomendacoes_amigos
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'filme';

ALTER TABLE public.recomendacoes_amigos
  DROP CONSTRAINT IF EXISTS recomendacoes_amigos_tipo_check;

ALTER TABLE public.recomendacoes_amigos
  ADD CONSTRAINT recomendacoes_amigos_tipo_check CHECK (tipo IN ('filme', 'serie'));

-- Conferência: deve mostrar só 'filme' com o total atual
SELECT tipo, COUNT(*) FROM public.recomendacoes_amigos GROUP BY tipo;


-- COMO REVERTER (não rode agora)
--   DELETE FROM public.recomendacoes_amigos WHERE tipo = 'serie';
--   ALTER TABLE public.recomendacoes_amigos DROP CONSTRAINT IF EXISTS recomendacoes_amigos_tipo_check;
--   ALTER TABLE public.recomendacoes_amigos DROP COLUMN IF EXISTS tipo;
