-- ============================================================
-- iCine — Suporte a séries em meus_filmes
-- Rode no Supabase: Dashboard → SQL Editor → New query → Run
-- ============================================================

-- PASSO 1 — VERIFICAÇÃO (só leitura, não altera nada)
-- Mostra restrições e índices da tabela. Se existir um UNIQUE em
-- (user_id, tmdb_id), um filme e uma série com o mesmo número do TMDB
-- não poderão ser salvos pelo mesmo usuário — avise antes de seguir.
SELECT conname AS restricao, pg_get_constraintdef(oid) AS definicao
FROM pg_constraint
WHERE conrelid = 'public.meus_filmes'::regclass;

SELECT indexname AS indice, indexdef AS definicao
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'meus_filmes';


-- PASSO 2 — MIGRAÇÃO
-- Adiciona a coluna "tipo". Todas as linhas existentes viram 'filme'
-- automaticamente (DEFAULT). Nenhum dado é apagado. As políticas RLS
-- não mudam (elas usam user_id).
ALTER TABLE public.meus_filmes
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'filme';

ALTER TABLE public.meus_filmes
  DROP CONSTRAINT IF EXISTS meus_filmes_tipo_check;

ALTER TABLE public.meus_filmes
  ADD CONSTRAINT meus_filmes_tipo_check CHECK (tipo IN ('filme', 'serie'));


-- COMO REVERTER (não rode agora)
-- Atenção: se já houver séries salvas, apague-as antes; senão elas
-- passariam a ser tratadas como filmes com o ID errado.
--   DELETE FROM public.meus_filmes WHERE tipo = 'serie';
--   ALTER TABLE public.meus_filmes DROP CONSTRAINT IF EXISTS meus_filmes_tipo_check;
--   ALTER TABLE public.meus_filmes DROP COLUMN IF EXISTS tipo;
