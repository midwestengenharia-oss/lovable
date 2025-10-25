
-- =====================================================
-- MIGRATION: Sistema Moreira Solar - Schema Completo
-- =====================================================

-- 1. ENUM DE ROLES
CREATE TYPE app_role AS ENUM ('admin', 'gestor', 'vendedor');

-- 2. TABELA DE PERFIS (ligada ao auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  perfil app_role NOT NULL DEFAULT 'vendedor',
  gestor_id UUID REFERENCES profiles(id),
  ativo BOOLEAN DEFAULT true,
  data_cadastro TIMESTAMPTZ DEFAULT NOW(),
  ultimo_acesso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE ROLES (SEPARADA - CRÍTICO PARA SEGURANÇA)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4. TABELA DE PERMISSÕES
CREATE TABLE permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  criar BOOLEAN DEFAULT false,
  editar BOOLEAN DEFAULT false,
  excluir BOOLEAN DEFAULT false,
  visualizar BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, modulo)
);

-- 5. LEADS
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data TIMESTAMPTZ DEFAULT NOW(),
  cliente TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  cidade TEXT,
  uf TEXT,
  fonte TEXT,
  status TEXT DEFAULT 'Novo' CHECK (status IN ('Novo', 'Qualificado', 'Follow-up', 'Perdido')),
  dono_id UUID REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CLIENTES
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf_cnpj TEXT UNIQUE,
  telefone TEXT NOT NULL,
  email TEXT,
  rua TEXT,
  numero TEXT,
  bairro TEXT,
  cep TEXT,
  cidade TEXT,
  estado TEXT,
  profissao TEXT,
  tempo_profissao TEXT,
  estado_civil TEXT,
  tempo_residencia TEXT,
  renda DECIMAL(12,2),
  fantasia TEXT,
  observacoes TEXT,
  vendedor_id UUID REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  data_cadastro TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORÇAMENTOS
CREATE TABLE orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  data TIMESTAMPTZ DEFAULT NOW(),
  validade DATE,
  cliente_id UUID REFERENCES clientes(id),
  cliente_nome TEXT,
  geracao_kwh DECIMAL(10,2),
  qtd_modulos INTEGER,
  modelo_modulo TEXT,
  potencia_modulo_w INTEGER,
  inversor_kw DECIMAL(10,2),
  valor_base DECIMAL(12,2),
  custo_estrutura_solo DECIMAL(12,2),
  valor_total DECIMAL(12,2),
  estrutura_solo BOOLEAN DEFAULT false,
  parcela_selecionada INTEGER,
  prestacao DECIMAL(12,2),
  economia_mensal DECIMAL(12,2),
  economia_percentual DECIMAL(5,2),
  payback_meses INTEGER,
  status TEXT DEFAULT 'pendente',
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  vendedor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROPOSTAS
CREATE TABLE propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  data TIMESTAMPTZ DEFAULT NOW(),
  validade DATE,
  cliente_id UUID REFERENCES clientes(id),
  cliente_nome TEXT,
  orcamento_id UUID REFERENCES orcamentos(id),
  valor_total DECIMAL(12,2),
  entrada DECIMAL(12,2),
  parcelas INTEGER,
  valor_parcela DECIMAL(12,2),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'em_revisao')),
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  vendedor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PROJETOS
CREATE TABLE projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  cliente_nome TEXT,
  proposta_id UUID REFERENCES propostas(id),
  data_inicio DATE,
  data_conclusao_prevista DATE,
  data_conclusao_real DATE,
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  status TEXT DEFAULT 'planejamento' CHECK (status IN ('planejamento', 'em_andamento', 'concluido', 'cancelado', 'pausado')),
  valor_total DECIMAL(12,2),
  observacoes TEXT,
  responsavel_id UUID REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. COBRANÇAS
CREATE TABLE cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  tipo TEXT CHECK (tipo IN ('boleto', 'pix', 'cartao', 'transferencia')),
  cliente_id UUID REFERENCES clientes(id),
  cliente_nome TEXT,
  projeto_id UUID REFERENCES projetos(id),
  valor DECIMAL(12,2) NOT NULL,
  vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TITULARES DE ENERGIA
CREATE TABLE titulares_energia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  cpf_cnpj TEXT UNIQUE,
  email TEXT,
  telefone TEXT,
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. UNIDADES CONSUMIDORAS
CREATE TABLE unidades_consumidoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_instalacao TEXT UNIQUE NOT NULL,
  titular_id UUID REFERENCES titulares_energia(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id),
  projeto_id UUID REFERENCES projetos(id),
  cidade TEXT,
  uf TEXT,
  distribuidora TEXT,
  grupo TEXT CHECK (grupo IN ('A', 'B')),
  classe TEXT,
  modalidade TEXT,
  ativo BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. FATURAS
CREATE TABLE faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID REFERENCES unidades_consumidoras(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  consumo_kwh DECIMAL(10,2),
  geracao_kwh DECIMAL(10,2),
  credito_anterior_kwh DECIMAL(10,2),
  credito_mes_kwh DECIMAL(10,2),
  saldo_kwh DECIMAL(10,2),
  valor_total DECIMAL(12,2),
  valor_energia DECIMAL(12,2),
  valor_demanda DECIMAL(12,2),
  arquivo_url TEXT,
  processado BOOLEAN DEFAULT false,
  data_processamento TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(unidade_id, mes_referencia)
);

-- 14. EQUIPAMENTOS
CREATE TABLE equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('modulo', 'inversor')),
  nome TEXT NOT NULL,
  potencia_w INTEGER,
  valor DECIMAL(12,2) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. PARÂMETROS DO SISTEMA
CREATE TABLE parametros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. LOG DE INTEGRAÇÕES
CREATE TABLE logs_integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data TIMESTAMPTZ DEFAULT NOW(),
  origem TEXT NOT NULL,
  status TEXT CHECK (status IN ('Sucesso', 'Erro')),
  mensagem TEXT,
  payload JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_leads_user ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_clientes_user ON clientes(user_id);
CREATE INDEX idx_clientes_vendedor ON clientes(vendedor_id);
CREATE INDEX idx_orcamentos_user ON orcamentos(user_id);
CREATE INDEX idx_orcamentos_cliente ON orcamentos(cliente_id);
CREATE INDEX idx_propostas_user ON propostas(user_id);
CREATE INDEX idx_propostas_status ON propostas(status);
CREATE INDEX idx_projetos_user ON projetos(user_id);
CREATE INDEX idx_projetos_status ON projetos(status);
CREATE INDEX idx_cobrancas_user ON cobrancas(user_id);
CREATE INDEX idx_cobrancas_status ON cobrancas(status);
CREATE INDEX idx_faturas_unidade ON faturas(unidade_id);
CREATE INDEX idx_faturas_mes ON faturas(mes_referencia);
CREATE INDEX idx_unidades_titular ON unidades_consumidoras(titular_id);

-- =====================================================
-- TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers em todas as tabelas relevantes
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orcamentos_updated_at BEFORE UPDATE ON orcamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_propostas_updated_at BEFORE UPDATE ON propostas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projetos_updated_at BEFORE UPDATE ON projetos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cobrancas_updated_at BEFORE UPDATE ON cobrancas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_titulares_updated_at BEFORE UPDATE ON titulares_energia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unidades_updated_at BEFORE UPDATE ON unidades_consumidoras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faturas_updated_at BEFORE UPDATE ON faturas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parametros_updated_at BEFORE UPDATE ON parametros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar profile ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'perfil')::app_role, 'vendedor')
  );
  
  -- Criar role padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'perfil')::app_role, 'vendedor'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Função security definer para checar roles (EVITA RECURSÃO)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para checar hierarquia
CREATE OR REPLACE FUNCTION public.can_access_user_data(_user_id UUID, _target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin vê tudo
  IF has_role(_user_id, 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Usuário vê seus próprios dados
  IF _user_id = _target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Gestor vê dados de seus vendedores
  IF has_role(_user_id, 'gestor') THEN
    RETURN EXISTS (
      SELECT 1 FROM profiles
      WHERE id = _target_user_id
        AND gestor_id = _user_id
    );
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares_energia ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_consumidoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_integracoes ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    id = auth.uid() OR
    (has_role(auth.uid(), 'gestor') AND gestor_id = auth.uid())
  );

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Políticas para USER_ROLES
CREATE POLICY "user_roles_select" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_manage" ON user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas para LEADS
CREATE POLICY "leads_select" ON leads
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "leads_insert" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "leads_update" ON leads
  FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "leads_delete" ON leads
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Políticas para CLIENTES (padrão similar ao leads)
CREATE POLICY "clientes_select" ON clientes
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "clientes_insert" ON clientes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "clientes_update" ON clientes
  FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "clientes_delete" ON clientes
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Políticas para ORÇAMENTOS
CREATE POLICY "orcamentos_select" ON orcamentos
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "orcamentos_insert" ON orcamentos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "orcamentos_update" ON orcamentos
  FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "orcamentos_delete" ON orcamentos
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Políticas para PROPOSTAS
CREATE POLICY "propostas_select" ON propostas
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "propostas_insert" ON propostas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "propostas_update" ON propostas
  FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "propostas_delete" ON propostas
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Políticas para PROJETOS
CREATE POLICY "projetos_select" ON projetos
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "projetos_insert" ON projetos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "projetos_update" ON projetos
  FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "projetos_delete" ON projetos
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Políticas para COBRANÇAS
CREATE POLICY "cobrancas_select" ON cobrancas
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "cobrancas_insert" ON cobrancas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cobrancas_update" ON cobrancas
  FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "cobrancas_delete" ON cobrancas
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Políticas para TITULARES
CREATE POLICY "titulares_select" ON titulares_energia
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "titulares_insert" ON titulares_energia
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "titulares_update" ON titulares_energia
  FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "titulares_delete" ON titulares_energia
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Políticas para UNIDADES CONSUMIDORAS
CREATE POLICY "unidades_select" ON unidades_consumidoras
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "unidades_insert" ON unidades_consumidoras
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "unidades_update" ON unidades_consumidoras
  FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "unidades_delete" ON unidades_consumidoras
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Políticas para FATURAS
CREATE POLICY "faturas_select" ON faturas
  FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "faturas_insert" ON faturas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "faturas_update" ON faturas
  FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));

CREATE POLICY "faturas_delete" ON faturas
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Políticas para EQUIPAMENTOS (Todos leem, só admin modifica)
CREATE POLICY "equipamentos_select" ON equipamentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "equipamentos_modify" ON equipamentos
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas para PARÂMETROS (Todos leem, só admin modifica)
CREATE POLICY "parametros_select" ON parametros
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "parametros_modify" ON parametros
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas para LOGS (Admin vê todos, outros veem só os seus)
CREATE POLICY "logs_select" ON logs_integracoes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

CREATE POLICY "logs_insert" ON logs_integracoes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- SEED DATA
-- =====================================================

-- Inserir equipamentos padrão
INSERT INTO equipamentos (tipo, nome, potencia_w, valor, ativo) VALUES
  ('modulo', 'Módulo 550W', 550, 850.00, true),
  ('modulo', 'Módulo 450W', 450, 700.00, true),
  ('inversor', 'Inversor 3kW', NULL, 2500.00, true),
  ('inversor', 'Inversor 5kW', NULL, 3500.00, true);

-- Inserir parâmetros padrão
INSERT INTO parametros (chave, valor, descricao) VALUES
  ('tarifa_padrao', '"0.89"', 'Tarifa padrão de energia em R$/kWh'),
  ('hsp', '"5.5"', 'Horas de sol pico média'),
  ('taxas_financiamento', '[{"parcelas": 6, "taxa": 0.0}, {"parcelas": 12, "taxa": 0.0199}, {"parcelas": 24, "taxa": 0.0249}, {"parcelas": 36, "taxa": 0.0299}, {"parcelas": 48, "taxa": 0.0349}, {"parcelas": 60, "taxa": 0.0399}]', 'Taxas de financiamento por prazo');
