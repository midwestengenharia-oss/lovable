-- =====================================================
-- MIGRATION: Adicionar campos faltantes
-- Data: 2025-10-25
-- =====================================================

-- Adicionar campos faltantes à tabela PROJETOS
ALTER TABLE projetos
ADD COLUMN IF NOT EXISTS kwp DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prioridade TEXT CHECK (prioridade IN ('Baixa', 'Média', 'Alta')),
ADD COLUMN IF NOT EXISTS proximos_passos TEXT,
ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documentos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS custos JSONB DEFAULT '{"orcado": 0, "real": 0, "itens": []}'::jsonb,
ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;

-- Adicionar comentários para documentação
COMMENT ON COLUMN projetos.kwp IS 'Potência do projeto em kilowatt-peak';
COMMENT ON COLUMN projetos.prioridade IS 'Prioridade do projeto: Baixa, Média ou Alta';
COMMENT ON COLUMN projetos.proximos_passos IS 'Descrição dos próximos passos do projeto';
COMMENT ON COLUMN projetos.checklist IS 'Lista de tarefas do projeto em formato JSON';
COMMENT ON COLUMN projetos.documentos IS 'Documentos do projeto em formato JSON';
COMMENT ON COLUMN projetos.custos IS 'Custos do projeto: orçado, real e itens';
COMMENT ON COLUMN projetos.timeline IS 'Linha do tempo do projeto em formato JSON';

-- Atualizar trigger para os novos campos
DROP TRIGGER IF EXISTS update_projetos_updated_at ON projetos;
CREATE TRIGGER update_projetos_updated_at
  BEFORE UPDATE ON projetos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_projetos_prioridade ON projetos(prioridade);
CREATE INDEX IF NOT EXISTS idx_projetos_kwp ON projetos(kwp);

-- Adicionar campo avatar na tabela profiles (se não existir)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Adicionar campo orcamento_id na tabela projetos (para relacionar com orçamentos)
ALTER TABLE projetos
ADD COLUMN IF NOT EXISTS orcamento_id UUID REFERENCES orcamentos(id);

CREATE INDEX IF NOT EXISTS idx_projetos_orcamento ON projetos(orcamento_id);

COMMENT ON COLUMN projetos.orcamento_id IS 'Referência ao orçamento relacionado';
