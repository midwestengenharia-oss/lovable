-- =====================================================
-- MIGRATION: Tabelas e Campos Faltantes
-- Data: 2025-10-25
-- Descrição: Adiciona todas as tabelas e campos necessários
-- =====================================================

-- =====================================================
-- 1. ADICIONAR CAMPOS FALTANTES EM UNIDADES_CONSUMIDORAS
-- =====================================================

-- Adicionar campos extras para unidades consumidoras
ALTER TABLE unidades_consumidoras
ADD COLUMN IF NOT EXISTS apelido TEXT,
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'convencional' CHECK (tipo IN (
  'geradora_financiamento',
  'geradora_investimento',
  'beneficiaria_acr',
  'beneficiaria_associacao',
  'convencional'
)),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'pendente_analise')),
ADD COLUMN IF NOT EXISTS valor_medio_fatura DECIMAL(12,2) DEFAULT 0;

COMMENT ON COLUMN unidades_consumidoras.apelido IS 'Apelido/nome amigável da unidade';
COMMENT ON COLUMN unidades_consumidoras.tipo IS 'Tipo da unidade: UGF, UGI, UCB ACR, UCB Assoc, Convencional';
COMMENT ON COLUMN unidades_consumidoras.status IS 'Status atual da unidade consumidora';
COMMENT ON COLUMN unidades_consumidoras.valor_medio_fatura IS 'Valor médio mensal da fatura';

-- Atualizar constraint do campo numero_instalacao (era numero_instalacao no schema original)
-- já existe, só garantir que está correto

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_unidades_status ON unidades_consumidoras(status);
CREATE INDEX IF NOT EXISTS idx_unidades_tipo ON unidades_consumidoras(tipo);

-- =====================================================
-- 2. CRIAR TABELA DE CHAMADOS (PÓS-VENDA)
-- =====================================================

CREATE TABLE IF NOT EXISTS chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  cliente TEXT NOT NULL,
  projeto_id UUID REFERENCES projetos(id),
  tipo TEXT CHECK (tipo IN ('Manutenção', 'Garantia', 'Suporte', 'Limpeza')),
  prioridade TEXT CHECK (prioridade IN ('Baixa', 'Média', 'Alta')),
  status TEXT DEFAULT 'Onboarding' CHECK (status IN ('Onboarding', 'Ativo', 'Manutenção', 'Chamado', 'Finalizado')),
  descricao TEXT NOT NULL,
  data TIMESTAMPTZ DEFAULT NOW(),
  tecnico TEXT,
  historico JSONB DEFAULT '[]'::jsonb,
  fotos JSONB DEFAULT '[]'::jsonb,
  resolucao TEXT,
  data_finalizacao TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE chamados IS 'Chamados de pós-venda e suporte técnico';
COMMENT ON COLUMN chamados.numero IS 'Número único do chamado (ex: CH-2025-001)';
COMMENT ON COLUMN chamados.historico IS 'Array de objetos com histórico de atualizações';
COMMENT ON COLUMN chamados.fotos IS 'Array de URLs de fotos do chamado';

-- Índices para chamados
CREATE INDEX IF NOT EXISTS idx_chamados_user ON chamados(user_id);
CREATE INDEX IF NOT EXISTS idx_chamados_projeto ON chamados(projeto_id);
CREATE INDEX IF NOT EXISTS idx_chamados_status ON chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_prioridade ON chamados(prioridade);
CREATE INDEX IF NOT EXISTS idx_chamados_data ON chamados(data);

-- Trigger para updated_at
CREATE TRIGGER update_chamados_updated_at
  BEFORE UPDATE ON chamados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS para chamados
ALTER TABLE chamados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chamados_select" ON chamados
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "chamados_insert" ON chamados
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chamados_update" ON chamados
  FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "chamados_delete" ON chamados
  FOR DELETE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

-- =====================================================
-- 3. VÍNCULOS DE COMPENSAÇÃO (GESTÃO DE FATURAS)
-- =====================================================

CREATE TABLE IF NOT EXISTS vinculos_compensacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ugi_id UUID REFERENCES unidades_consumidoras(id) ON DELETE CASCADE NOT NULL,
  ucb_id UUID REFERENCES unidades_consumidoras(id) ON DELETE CASCADE NOT NULL,
  percentual DECIMAL(5,2) CHECK (percentual > 0 AND percentual <= 100),
  ativo BOOLEAN DEFAULT true,
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE,
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vinculos_diferentes CHECK (ugi_id != ucb_id)
);

COMMENT ON TABLE vinculos_compensacao IS 'Vínculos de compensação entre UGIs e UCBs';
COMMENT ON COLUMN vinculos_compensacao.ugi_id IS 'Unidade Geradora (fonte de créditos)';
COMMENT ON COLUMN vinculos_compensacao.ucb_id IS 'Unidade Beneficiária (recebe créditos)';
COMMENT ON COLUMN vinculos_compensacao.percentual IS 'Percentual de compensação (0-100)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_vinculos_ugi ON vinculos_compensacao(ugi_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_ucb ON vinculos_compensacao(ucb_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_ativo ON vinculos_compensacao(ativo);

-- Trigger
CREATE TRIGGER update_vinculos_updated_at
  BEFORE UPDATE ON vinculos_compensacao
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE vinculos_compensacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vinculos_select" ON vinculos_compensacao
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "vinculos_insert" ON vinculos_compensacao
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "vinculos_update" ON vinculos_compensacao
  FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "vinculos_delete" ON vinculos_compensacao
  FOR DELETE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

-- =====================================================
-- 4. SESSÕES DE AUTENTICAÇÃO (GESTÃO DE FATURAS)
-- =====================================================

CREATE TABLE IF NOT EXISTS sessoes_autenticacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titular_id UUID REFERENCES titulares_energia(id) ON DELETE CASCADE NOT NULL,
  distribuidora TEXT NOT NULL,
  metodo TEXT CHECK (metodo IN ('cpf_cnpj', 'certificado_digital', 'gov_br', 'outro')),
  status TEXT CHECK (status IN ('sucesso', 'falha', 'expirado')),
  data_hora TIMESTAMPTZ DEFAULT NOW(),
  expira_em TIMESTAMPTZ,
  detalhes JSONB,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sessoes_autenticacao IS 'Histórico de autenticações em distribuidoras';
COMMENT ON COLUMN sessoes_autenticacao.metodo IS 'Método usado para autenticação';
COMMENT ON COLUMN sessoes_autenticacao.detalhes IS 'Detalhes adicionais da sessão (JSON)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_sessoes_titular ON sessoes_autenticacao(titular_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_distribuidora ON sessoes_autenticacao(distribuidora);
CREATE INDEX IF NOT EXISTS idx_sessoes_status ON sessoes_autenticacao(status);
CREATE INDEX IF NOT EXISTS idx_sessoes_data ON sessoes_autenticacao(data_hora);
CREATE INDEX IF NOT EXISTS idx_sessoes_user ON sessoes_autenticacao(user_id);

-- RLS
ALTER TABLE sessoes_autenticacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessoes_select" ON sessoes_autenticacao
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "sessoes_insert" ON sessoes_autenticacao
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5. PROCESSAMENTOS DE FATURAS (GESTÃO DE FATURAS)
-- =====================================================

CREATE TABLE IF NOT EXISTS processamentos_faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_hora TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('processando', 'concluido', 'erro', 'cancelado')),
  qtd_ucs INTEGER NOT NULL DEFAULT 0,
  processadas INTEGER DEFAULT 0,
  faturas_baixadas INTEGER DEFAULT 0,
  tempo_decorrido INTEGER,
  erros JSONB DEFAULT '[]'::jsonb,
  detalhes JSONB,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE processamentos_faturas IS 'Histórico de processamentos em lote de faturas';
COMMENT ON COLUMN processamentos_faturas.qtd_ucs IS 'Quantidade total de UCs no processamento';
COMMENT ON COLUMN processamentos_faturas.processadas IS 'Quantidade já processada';
COMMENT ON COLUMN processamentos_faturas.tempo_decorrido IS 'Tempo em milissegundos';
COMMENT ON COLUMN processamentos_faturas.erros IS 'Array de erros ocorridos';

-- Índices
CREATE INDEX IF NOT EXISTS idx_processamentos_user ON processamentos_faturas(user_id);
CREATE INDEX IF NOT EXISTS idx_processamentos_status ON processamentos_faturas(status);
CREATE INDEX IF NOT EXISTS idx_processamentos_data ON processamentos_faturas(data_hora);

-- Trigger
CREATE TRIGGER update_processamentos_updated_at
  BEFORE UPDATE ON processamentos_faturas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE processamentos_faturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processamentos_select" ON processamentos_faturas
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "processamentos_insert" ON processamentos_faturas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "processamentos_update" ON processamentos_faturas
  FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));

-- =====================================================
-- 6. FUNÇÃO AUXILIAR PARA GERAR NÚMERO DE CHAMADO
-- =====================================================

CREATE OR REPLACE FUNCTION gerar_numero_chamado()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  ano TEXT;
  proximo_numero INTEGER;
  numero_formatado TEXT;
BEGIN
  ano := TO_CHAR(NOW(), 'YYYY');

  -- Buscar o último número do ano atual
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'CH-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO proximo_numero
  FROM chamados
  WHERE numero LIKE 'CH-' || ano || '-%';

  -- Formatar com zero à esquerda (3 dígitos)
  numero_formatado := 'CH-' || ano || '-' || LPAD(proximo_numero::TEXT, 3, '0');

  RETURN numero_formatado;
END;
$$;

COMMENT ON FUNCTION gerar_numero_chamado IS 'Gera número sequencial para chamados (ex: CH-2025-001)';

-- =====================================================
-- 7. TRIGGER PARA AUTO-GERAR NÚMERO DO CHAMADO
-- =====================================================

CREATE OR REPLACE FUNCTION auto_gerar_numero_chamado()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := gerar_numero_chamado();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_numero_chamado
  BEFORE INSERT ON chamados
  FOR EACH ROW
  EXECUTE FUNCTION auto_gerar_numero_chamado();

-- =====================================================
-- 8. VIEW PARA ESTATÍSTICAS DE UNIDADES
-- =====================================================

CREATE OR REPLACE VIEW vw_unidades_stats AS
SELECT
  uc.id,
  uc.numero_instalacao,
  uc.apelido,
  uc.tipo,
  uc.status,
  uc.titular_id,
  t.nome as titular_nome,
  COUNT(f.id) as total_faturas,
  COALESCE(AVG(f.valor_total), 0) as valor_medio_fatura,
  MAX(f.mes_referencia) as ultima_fatura,
  COALESCE(SUM(f.consumo_kwh), 0) as consumo_total_kwh,
  COALESCE(SUM(f.geracao_kwh), 0) as geracao_total_kwh
FROM unidades_consumidoras uc
LEFT JOIN titulares_energia t ON t.id = uc.titular_id
LEFT JOIN faturas f ON f.unidade_id = uc.id
GROUP BY uc.id, uc.numero_instalacao, uc.apelido, uc.tipo, uc.status, uc.titular_id, t.nome;

COMMENT ON VIEW vw_unidades_stats IS 'Estatísticas agregadas de unidades consumidoras';

-- =====================================================
-- 9. ATUALIZAR VALOR MÉDIO DE FATURAS
-- =====================================================

-- Função para recalcular valor médio de fatura
CREATE OR REPLACE FUNCTION atualizar_valor_medio_fatura()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE unidades_consumidoras
  SET valor_medio_fatura = (
    SELECT COALESCE(AVG(valor_total), 0)
    FROM faturas
    WHERE unidade_id = NEW.unidade_id
  )
  WHERE id = NEW.unidade_id;

  RETURN NEW;
END;
$$;

-- Trigger para atualizar automaticamente após inserir/atualizar fatura
CREATE TRIGGER trigger_atualizar_valor_medio
  AFTER INSERT OR UPDATE ON faturas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_valor_medio_fatura();

COMMENT ON FUNCTION atualizar_valor_medio_fatura IS 'Recalcula valor médio de fatura ao inserir/atualizar faturas';

-- =====================================================
-- 10. SEED DATA PARA TESTES (OPCIONAL)
-- =====================================================

-- Inserir alguns tipos padrão se ainda não existirem
-- (Já existe na migração principal, mas garantindo)

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Resumo das alterações:
-- ✅ Campos adicionados em unidades_consumidoras (apelido, tipo, status, valor_medio_fatura)
-- ✅ Tabela chamados criada com RLS
-- ✅ Tabela vinculos_compensacao criada com RLS
-- ✅ Tabela sessoes_autenticacao criada com RLS
-- ✅ Tabela processamentos_faturas criada com RLS
-- ✅ Função para gerar número de chamado automaticamente
-- ✅ Trigger para auto-numeração de chamados
-- ✅ View para estatísticas de unidades
-- ✅ Trigger para atualizar valor médio de faturas automaticamente
-- ✅ Todos os índices de performance criados
-- ✅ Todas as policies RLS configuradas
