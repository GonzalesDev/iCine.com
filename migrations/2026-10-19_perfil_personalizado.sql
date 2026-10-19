-- ============================================================
-- iCine — Perfil personalizado (19/10/2026)
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run.
-- (Rode também o 2026-10-18_perfil_publico.sql, se ainda não rodou.)
--
-- Novas colunas em perfis:
--   capa_url    → foto de capa escolhida da galeria (arquivo no bucket 'capas')
--   top_filmes  → Top 5 filmes: lista [{ id, titulo, ano, capa, sinopse }] na ordem escolhida
--   top_series  → Top 5 séries: mesma forma
--   favoritos   → { atriz: { id, nome, foto }, ator: {...}, diretor: {...} } (ids do TMDB)
--
-- As regras de acesso de perfis já servem: todos os logados leem, cada um só muda o próprio.
-- ============================================================

ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS capa_url TEXT;
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS top_filmes JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS top_series JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS favoritos JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Conferência: deve listar as 4 colunas novas
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'perfis'
  AND column_name IN ('capa_url', 'top_filmes', 'top_series', 'favoritos');

-- Para desfazer:
--   ALTER TABLE public.perfis DROP COLUMN IF EXISTS capa_url, DROP COLUMN IF EXISTS top_filmes,
--     DROP COLUMN IF EXISTS top_series, DROP COLUMN IF EXISTS favoritos;
