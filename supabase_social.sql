-- ============================================================
-- iCine Social — Script SQL para o Supabase
-- Execute este script no Supabase Dashboard:
-- Acede a https://supabase.com/dashboard → teu projeto
-- → SQL Editor → New Query → cola este código → Run
-- ============================================================

-- 1. TABELA DE PERFIS (usernames públicos)
CREATE TABLE IF NOT EXISTS perfis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis visíveis a todos os autenticados"
  ON perfis FOR SELECT TO authenticated USING (true);

CREATE POLICY "Utilizador gere o seu próprio perfil"
  ON perfis FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 2. TABELA DE AMIZADES
CREATE TABLE IF NOT EXISTS amizades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitante_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destinatario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceite')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(solicitante_id, destinatario_id)
);

ALTER TABLE amizades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver as próprias amizades"
  ON amizades FOR SELECT TO authenticated
  USING (auth.uid() = solicitante_id OR auth.uid() = destinatario_id);

CREATE POLICY "Enviar pedido de amizade"
  ON amizades FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = solicitante_id);

CREATE POLICY "Aceitar pedido de amizade"
  ON amizades FOR UPDATE TO authenticated
  USING (auth.uid() = destinatario_id);

CREATE POLICY "Remover amizade"
  ON amizades FOR DELETE TO authenticated
  USING (auth.uid() = solicitante_id OR auth.uid() = destinatario_id);


-- 3. POLÍTICAS EM meus_filmes (para amigos verem as listas)
-- ATENÇÃO: Se a tabela meus_filmes ainda não tem RLS ativa,
-- este bloco vai ativá-la. Certifica-te que as tuas políticas
-- existentes não conflituam. Se der erro, adiciona apenas a
-- última política (Ver filmes de amigos aceites).

ALTER TABLE meus_filmes ENABLE ROW LEVEL SECURITY;

-- Utilizador lê e gere os seus próprios filmes
CREATE POLICY "Utilizador lê os seus filmes"
  ON meus_filmes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Utilizador escreve os seus filmes"
  ON meus_filmes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizador atualiza os seus filmes"
  ON meus_filmes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Utilizador remove os seus filmes"
  ON meus_filmes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Amigos aceites podem ver as listas um do outro
CREATE POLICY "Ver filmes de amigos aceites"
  ON meus_filmes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM amizades
      WHERE status = 'aceite' AND (
        (solicitante_id = auth.uid() AND destinatario_id = meus_filmes.user_id) OR
        (destinatario_id = auth.uid() AND solicitante_id = meus_filmes.user_id)
      )
    )
  );
