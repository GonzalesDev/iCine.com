-- ============================================================
-- iCine — Amigos duplicados
-- Rode no Supabase: Dashboard → SQL Editor → New query → Run
-- ============================================================
-- Causa: a tabela "amizades" só impedia repetir o mesmo pedido na MESMA direção.
-- Se A adicionou B e B também adicionou A, ficavam duas linhas e o amigo aparecia duas vezes.

-- 1) CONFERIR (só leitura): pares com mais de uma linha
SELECT LEAST(solicitante_id, destinatario_id)    AS pessoa_1,
       GREATEST(solicitante_id, destinatario_id) AS pessoa_2,
       COUNT(*) AS linhas
FROM public.amizades
GROUP BY 1, 2
HAVING COUNT(*) > 1;

-- 2) LIMPAR: em cada par, mantém UMA linha (prefere a aceita; depois a mais antiga) e apaga as outras.
--    Ninguém deixa de ser amigo: quem tinha amizade aceita continua com ela.
DELETE FROM public.amizades a
USING (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY LEAST(solicitante_id, destinatario_id), GREATEST(solicitante_id, destinatario_id)
           ORDER BY (status = 'aceite') DESC, created_at ASC, id ASC
         ) AS pos
  FROM public.amizades
) d
WHERE a.id = d.id AND d.pos > 1;

-- 3) BLOQUEAR de vez: um par de pessoas só pode ter UMA linha, em qualquer direção
CREATE UNIQUE INDEX IF NOT EXISTS amizades_par_unico
  ON public.amizades (LEAST(solicitante_id, destinatario_id), GREATEST(solicitante_id, destinatario_id));

-- Conferência: deve voltar vazio
SELECT LEAST(solicitante_id, destinatario_id), GREATEST(solicitante_id, destinatario_id), COUNT(*)
FROM public.amizades GROUP BY 1, 2 HAVING COUNT(*) > 1;


-- COMO REVERTER o bloqueio (não rode agora; as linhas apagadas no passo 2 não voltam)
--   DROP INDEX IF EXISTS public.amizades_par_unico;
