-- Schema do banco de dados para o app Nossos Missionários
-- Execute este script no SQL Editor do Supabase

-- Tabela de missionários
CREATE TABLE missionaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ala TEXT NOT NULL,
  foto_url TEXT,
  data_inicio DATE,
  data_termino DATE,
  pais_missao TEXT,
  nome_missao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER missionaries_updated_at
  BEFORE UPDATE ON missionaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Bucket de armazenamento de fotos (execute no Storage do Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-missionarios', 'fotos-missionarios', true);

-- Política de acesso público para leitura das fotos
-- CREATE POLICY "Fotos públicas" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-missionarios');
-- CREATE POLICY "Upload de fotos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fotos-missionarios');
-- CREATE POLICY "Update de fotos" ON storage.objects FOR UPDATE USING (bucket_id = 'fotos-missionarios');
-- CREATE POLICY "Delete de fotos" ON storage.objects FOR DELETE USING (bucket_id = 'fotos-missionarios');
