-- ============================================================
-- iCine — Curtidas nas avaliações (❤️ no Feed → Avaliações)
-- Rode no Supabase: Dashboard → SQL Editor → New query → Run
-- Pré-requisito: a tabela "avaliacoes" já existe (2026-10-05_avaliacoes.sql).
-- ============================================================

-- Uma linha por curtida. Cada pessoa curte uma avaliação no máximo uma vez.
-- Se a avaliação for excluída, as curtidas dela somem junto.
CREATE TABLE IF NOT EXISTS public.avaliacao_curtidas (
  avaliacao_id UUID NOT NULL REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (avaliacao_id, user_id)
);

ALTER TABLE public.avaliacao_curtidas ENABLE ROW LEVEL SECURITY;

-- Todo mundo logado vê as curtidas (para somar e saber se você já curtiu)
DROP POLICY IF EXISTS "Curtidas visiveis a todos os autenticados" ON public.avaliacao_curtidas;
CREATE POLICY "Curtidas visiveis a todos os autenticados"
  ON public.avaliacao_curtidas FOR SELECT TO authenticated USING (true);

-- Cada um só cria e remove a própria curtida
DROP POLICY IF EXISTS "Usuario cria a propria curtida" ON public.avaliacao_curtidas;
CREATE POLICY "Usuario cria a propria curtida"
  ON public.avaliacao_curtidas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuario remove a propria curtida" ON public.avaliacao_curtidas;
CREATE POLICY "Usuario remove a propria curtida"
  ON public.avaliacao_curtidas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Conferência: deve mostrar 0 (tabela nova e vazia)
SELECT COUNT(*) AS total_curtidas FROM public.avaliacao_curtidas;


-- COMO REVERTER (não rode agora)
--   DROP TABLE IF EXISTS public.avaliacao_curtidas;
