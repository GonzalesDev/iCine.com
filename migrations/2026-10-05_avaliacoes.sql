-- ============================================================
-- iCine — Avaliações de filmes e séries (aba Feed → Avaliações)
-- Rode no Supabase: Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Cada usuário tem no máximo UMA avaliação por título (filme ou série).
-- Avaliar de novo o mesmo título substitui a anterior.
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id     INTEGER NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'filme' CHECK (tipo IN ('filme', 'serie')),
  titulo      TEXT NOT NULL,
  ano         TEXT,
  capa        TEXT,
  sinopse     TEXT,
  nota        SMALLINT NOT NULL CHECK (nota BETWEEN 0 AND 10),
  comentario  TEXT CHECK (comentario IS NULL OR char_length(comentario) <= 280),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tmdb_id, tipo)
);

CREATE INDEX IF NOT EXISTS avaliacoes_created_at_idx ON public.avaliacoes (created_at DESC);

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- Todo mundo logado vê todas as avaliações (feed público)
DROP POLICY IF EXISTS "Avaliacoes visiveis a todos os autenticados" ON public.avaliacoes;
CREATE POLICY "Avaliacoes visiveis a todos os autenticados"
  ON public.avaliacoes FOR SELECT TO authenticated USING (true);

-- Cada um só cria, edita e apaga as próprias
DROP POLICY IF EXISTS "Usuario gere as proprias avaliacoes" ON public.avaliacoes;
CREATE POLICY "Usuario gere as proprias avaliacoes"
  ON public.avaliacoes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Conferência: deve mostrar 0 (tabela nova e vazia)
SELECT COUNT(*) AS total_avaliacoes FROM public.avaliacoes;


-- COMO REVERTER (não rode agora)
--   DROP TABLE IF EXISTS public.avaliacoes;
