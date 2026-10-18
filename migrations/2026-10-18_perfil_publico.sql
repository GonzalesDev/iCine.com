-- ============================================================
-- iCine — Perfil público (18/10/2026)
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run.
--
-- O que muda:
-- 1) Qualquer pessoa logada pode VER as listas (Quero Assistir / Assistidos)
--    de qualquer usuário, para abrir o perfil sem precisar ser amigo.
--    Continua valendo: cada um só cria, muda e apaga os próprios filmes.
-- 2) Função contar_amigos(): mostra QUANTOS amigos alguém tem, sem
--    revelar QUEM são (a tabela amizades continua fechada).
--
-- Playlists: o app só mostra as playlists PÚBLICAS no perfil dos outros.
-- ============================================================

-- 1) Listas visíveis a todos os usuários logados
DROP POLICY IF EXISTS "Listas visiveis a todos os autenticados" ON public.meus_filmes;
CREATE POLICY "Listas visiveis a todos os autenticados"
  ON public.meus_filmes FOR SELECT TO authenticated USING (true);

-- 2) Número de amigos de um usuário (cada amigo conta uma vez,
--    mesmo que existam dois pedidos aceitos entre o mesmo par)
CREATE OR REPLACE FUNCTION public.contar_amigos(alvo UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT CASE WHEN solicitante_id = alvo THEN destinatario_id ELSE solicitante_id END)::INTEGER
  FROM public.amizades
  WHERE status = 'aceite' AND (solicitante_id = alvo OR destinatario_id = alvo);
$$;

REVOKE ALL ON FUNCTION public.contar_amigos(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.contar_amigos(UUID) TO authenticated;

-- Conferência: deve aparecer a política nova e um número (seus amigos)
SELECT policyname FROM pg_policies WHERE tablename = 'meus_filmes' AND policyname = 'Listas visiveis a todos os autenticados';
SELECT public.contar_amigos(auth.uid()) AS meus_amigos;

-- Para desfazer:
--   DROP POLICY IF EXISTS "Listas visiveis a todos os autenticados" ON public.meus_filmes;
--   DROP FUNCTION IF EXISTS public.contar_amigos(UUID);
