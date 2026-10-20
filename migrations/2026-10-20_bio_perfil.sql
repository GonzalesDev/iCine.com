-- ============================================================
-- iCine — Frase do perfil (20/10/2026)
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run.
-- Rode depois dos SQLs de 18/10 e 19/10.
--
-- Nova coluna perfis.bio: uma frase curta (até 120 caracteres) que aparece embaixo do @ do perfil.
-- As regras de acesso de perfis já servem (todos leem, cada um muda o próprio).
-- ============================================================

ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.perfis DROP CONSTRAINT IF EXISTS perfis_bio_tamanho;
ALTER TABLE public.perfis ADD CONSTRAINT perfis_bio_tamanho CHECK (bio IS NULL OR char_length(bio) <= 120);

-- Conferência: deve listar a coluna bio
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'perfis' AND column_name = 'bio';

-- Para desfazer:
--   ALTER TABLE public.perfis DROP COLUMN IF EXISTS bio;
