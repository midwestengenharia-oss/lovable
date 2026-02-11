-- =====================================================
-- RESET COMPLETO: Sistema Moreira Solar
-- Cole este script no SQL Editor do Supabase
-- ATENÇÃO: Isso APAGA todos os dados e recria do zero!
-- =====================================================

-- =====================================================
-- PARTE 0: LIMPAR TUDO (DROP)
-- =====================================================

-- Remover triggers primeiro
DROP TRIGGER IF EXISTS trigger_atualizar_valor_medio ON faturas;
DROP TRIGGER IF EXISTS trigger_auto_numero_chamado ON chamados;
DROP TRIGGER IF EXISTS update_processamentos_updated_at ON processamentos_faturas;
DROP TRIGGER IF EXISTS update_vinculos_updated_at ON vinculos_compensacao;
DROP TRIGGER IF EXISTS update_chamados_updated_at ON chamados;
DROP TRIGGER IF EXISTS update_parametros_updated_at ON parametros;
DROP TRIGGER IF EXISTS update_faturas_updated_at ON faturas;
DROP TRIGGER IF EXISTS update_unidades_updated_at ON unidades_consumidoras;
DROP TRIGGER IF EXISTS update_titulares_updated_at ON titulares_energia;
DROP TRIGGER IF EXISTS update_cobrancas_updated_at ON cobrancas;
DROP TRIGGER IF EXISTS update_projetos_updated_at ON projetos;
DROP TRIGGER IF EXISTS update_propostas_updated_at ON propostas;
DROP TRIGGER IF EXISTS update_orcamentos_updated_at ON orcamentos;
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover views
DROP VIEW IF EXISTS vw_unidades_stats CASCADE;

-- Remover tabelas (ordem reversa de dependência)
DROP TABLE IF EXISTS processamentos_faturas CASCADE;
DROP TABLE IF EXISTS sessoes_autenticacao CASCADE;
DROP TABLE IF EXISTS vinculos_compensacao CASCADE;
DROP TABLE IF EXISTS chamados CASCADE;
DROP TABLE IF EXISTS faturas CASCADE;
DROP TABLE IF EXISTS unidades_consumidoras CASCADE;
DROP TABLE IF EXISTS titulares_energia CASCADE;
DROP TABLE IF EXISTS cobrancas CASCADE;
DROP TABLE IF EXISTS projetos CASCADE;
DROP TABLE IF EXISTS propostas CASCADE;
DROP TABLE IF EXISTS orcamentos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS logs_integracoes CASCADE;
DROP TABLE IF EXISTS parametros CASCADE;
DROP TABLE IF EXISTS equipamentos CASCADE;
DROP TABLE IF EXISTS auth_local_users CASCADE;
DROP TABLE IF EXISTS permissoes CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Remover funções
DROP FUNCTION IF EXISTS atualizar_valor_medio_fatura() CASCADE;
DROP FUNCTION IF EXISTS auto_gerar_numero_chamado() CASCADE;
DROP FUNCTION IF EXISTS gerar_numero_chamado() CASCADE;
DROP FUNCTION IF EXISTS can_access_user_data(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS has_role(UUID, app_role) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Remover tipo enum
DROP TYPE IF EXISTS app_role CASCADE;


-- =====================================================
-- PARTE 1: ENUM DE ROLES
-- =====================================================
CREATE TYPE app_role AS ENUM ('admin', 'gestor', 'vendedor');


-- =====================================================
-- PARTE 2: TABELAS PRINCIPAIS
-- =====================================================

-- PERFIS (ligada ao auth.users)
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

-- ROLES (SEPARADA - CRÍTICO PARA SEGURANÇA)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- AUTH LOCAL (senhas dos usuários para login local)
CREATE TABLE auth_local_users (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_local_email ON auth_local_users(email);

-- PERMISSÕES
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

-- LEADS
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

-- CLIENTES
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
  origem TEXT,
  tipo_pessoa TEXT CHECK (tipo_pessoa IN ('PF', 'PJ')),
  uf TEXT,
  senha TEXT,
  convite_aceito BOOLEAN DEFAULT false,
  convite_token TEXT,
  convite_expira_em TIMESTAMPTZ,
  vendedor_id UUID REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  data_cadastro TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORÇAMENTOS
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

-- PROPOSTAS
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

-- PROJETOS (já com campos extras)
CREATE TABLE projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  cliente_nome TEXT,
  proposta_id UUID REFERENCES propostas(id),
  orcamento_id UUID REFERENCES orcamentos(id),
  data_inicio DATE,
  data_conclusao_prevista DATE,
  data_conclusao_real DATE,
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  status TEXT DEFAULT 'planejamento' CHECK (status IN ('planejamento', 'em_andamento', 'concluido', 'cancelado', 'pausado')),
  valor_total DECIMAL(12,2),
  kwp DECIMAL(10,2),
  prioridade TEXT CHECK (prioridade IN ('Baixa', 'Média', 'Alta')),
  proximos_passos TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  documentos JSONB DEFAULT '[]'::jsonb,
  custos JSONB DEFAULT '{"orcado": 0, "real": 0, "itens": []}'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT,
  responsavel_id UUID REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COBRANÇAS
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

-- TITULARES DE ENERGIA
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

-- UNIDADES CONSUMIDORAS (já com campos extras)
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
  apelido TEXT,
  tipo TEXT DEFAULT 'convencional' CHECK (tipo IN (
    'geradora_financiamento',
    'geradora_investimento',
    'beneficiaria_acr',
    'beneficiaria_associacao',
    'convencional'
  )),
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'pendente_analise')),
  valor_medio_fatura DECIMAL(12,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FATURAS
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

-- EQUIPAMENTOS
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

-- PARÂMETROS DO SISTEMA
CREATE TABLE parametros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOG DE INTEGRAÇÕES
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

-- CHAMADOS (PÓS-VENDA)
CREATE TABLE chamados (
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

-- VÍNCULOS DE COMPENSAÇÃO
CREATE TABLE vinculos_compensacao (
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

-- SESSÕES DE AUTENTICAÇÃO
CREATE TABLE sessoes_autenticacao (
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

-- PROCESSAMENTOS DE FATURAS
CREATE TABLE processamentos_faturas (
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


-- =====================================================
-- PARTE 3: ÍNDICES
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
CREATE INDEX idx_projetos_prioridade ON projetos(prioridade);
CREATE INDEX idx_projetos_kwp ON projetos(kwp);
CREATE INDEX idx_projetos_orcamento ON projetos(orcamento_id);
CREATE INDEX idx_cobrancas_user ON cobrancas(user_id);
CREATE INDEX idx_cobrancas_status ON cobrancas(status);
CREATE INDEX idx_faturas_unidade ON faturas(unidade_id);
CREATE INDEX idx_faturas_mes ON faturas(mes_referencia);
CREATE INDEX idx_unidades_titular ON unidades_consumidoras(titular_id);
CREATE INDEX idx_unidades_status ON unidades_consumidoras(status);
CREATE INDEX idx_unidades_tipo ON unidades_consumidoras(tipo);
CREATE INDEX idx_chamados_user ON chamados(user_id);
CREATE INDEX idx_chamados_projeto ON chamados(projeto_id);
CREATE INDEX idx_chamados_status ON chamados(status);
CREATE INDEX idx_chamados_prioridade ON chamados(prioridade);
CREATE INDEX idx_chamados_data ON chamados(data);
CREATE INDEX idx_vinculos_ugi ON vinculos_compensacao(ugi_id);
CREATE INDEX idx_vinculos_ucb ON vinculos_compensacao(ucb_id);
CREATE INDEX idx_vinculos_ativo ON vinculos_compensacao(ativo);
CREATE INDEX idx_sessoes_titular ON sessoes_autenticacao(titular_id);
CREATE INDEX idx_sessoes_distribuidora ON sessoes_autenticacao(distribuidora);
CREATE INDEX idx_sessoes_status ON sessoes_autenticacao(status);
CREATE INDEX idx_sessoes_data ON sessoes_autenticacao(data_hora);
CREATE INDEX idx_sessoes_user ON sessoes_autenticacao(user_id);
CREATE INDEX idx_processamentos_user ON processamentos_faturas(user_id);
CREATE INDEX idx_processamentos_status ON processamentos_faturas(status);
CREATE INDEX idx_processamentos_data ON processamentos_faturas(data_hora);


-- =====================================================
-- PARTE 4: FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers de updated_at
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

CREATE TRIGGER update_chamados_updated_at BEFORE UPDATE ON chamados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vinculos_updated_at BEFORE UPDATE ON vinculos_compensacao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processamentos_updated_at BEFORE UPDATE ON processamentos_faturas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
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

-- Função para gerar número de chamado
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
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'CH-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO proximo_numero
  FROM chamados
  WHERE numero LIKE 'CH-' || ano || '-%';
  numero_formatado := 'CH-' || ano || '-' || LPAD(proximo_numero::TEXT, 3, '0');
  RETURN numero_formatado;
END;
$$;

-- Trigger para auto-gerar número do chamado
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

CREATE TRIGGER trigger_atualizar_valor_medio
  AFTER INSERT OR UPDATE ON faturas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_valor_medio_fatura();


-- =====================================================
-- PARTE 5: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Funções de segurança
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

CREATE OR REPLACE FUNCTION public.can_access_user_data(_user_id UUID, _target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(_user_id, 'admin') THEN RETURN TRUE; END IF;
  IF _user_id = _target_user_id THEN RETURN TRUE; END IF;
  IF has_role(_user_id, 'gestor') THEN
    RETURN EXISTS (
      SELECT 1 FROM profiles
      WHERE id = _target_user_id AND gestor_id = _user_id
    );
  END IF;
  RETURN FALSE;
END;
$$;

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_local_users ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE vinculos_compensacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_autenticacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE processamentos_faturas ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR id = auth.uid() OR (has_role(auth.uid(), 'gestor') AND gestor_id = auth.uid()));

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- USER_ROLES
CREATE POLICY "user_roles_select" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_manage" ON user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- PERMISSOES
CREATE POLICY "permissoes_select" ON permissoes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "permissoes_manage" ON permissoes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- LEADS
CREATE POLICY "leads_select" ON leads FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "leads_insert" ON leads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "leads_update" ON leads FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "leads_delete" ON leads FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- CLIENTES
CREATE POLICY "clientes_select" ON clientes FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "clientes_insert" ON clientes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "clientes_update" ON clientes FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "clientes_delete" ON clientes FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- ORÇAMENTOS
CREATE POLICY "orcamentos_select" ON orcamentos FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "orcamentos_insert" ON orcamentos FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "orcamentos_update" ON orcamentos FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "orcamentos_delete" ON orcamentos FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- PROPOSTAS
CREATE POLICY "propostas_select" ON propostas FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "propostas_insert" ON propostas FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "propostas_update" ON propostas FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "propostas_delete" ON propostas FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- PROJETOS
CREATE POLICY "projetos_select" ON projetos FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "projetos_insert" ON projetos FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "projetos_update" ON projetos FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "projetos_delete" ON projetos FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- COBRANÇAS
CREATE POLICY "cobrancas_select" ON cobrancas FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "cobrancas_insert" ON cobrancas FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "cobrancas_update" ON cobrancas FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "cobrancas_delete" ON cobrancas FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- TITULARES
CREATE POLICY "titulares_select" ON titulares_energia FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "titulares_insert" ON titulares_energia FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "titulares_update" ON titulares_energia FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "titulares_delete" ON titulares_energia FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- UNIDADES CONSUMIDORAS
CREATE POLICY "unidades_select" ON unidades_consumidoras FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "unidades_insert" ON unidades_consumidoras FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "unidades_update" ON unidades_consumidoras FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "unidades_delete" ON unidades_consumidoras FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- FATURAS
CREATE POLICY "faturas_select" ON faturas FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "faturas_insert" ON faturas FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "faturas_update" ON faturas FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "faturas_delete" ON faturas FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- EQUIPAMENTOS (Todos leem, só admin modifica)
CREATE POLICY "equipamentos_select" ON equipamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "equipamentos_modify" ON equipamentos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- PARÂMETROS (Todos leem, só admin modifica)
CREATE POLICY "parametros_select" ON parametros FOR SELECT TO authenticated USING (true);
CREATE POLICY "parametros_modify" ON parametros FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- LOGS
CREATE POLICY "logs_select" ON logs_integracoes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());
CREATE POLICY "logs_insert" ON logs_integracoes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- CHAMADOS
CREATE POLICY "chamados_select" ON chamados FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "chamados_insert" ON chamados FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "chamados_update" ON chamados FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "chamados_delete" ON chamados FOR DELETE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

-- VÍNCULOS
CREATE POLICY "vinculos_select" ON vinculos_compensacao FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "vinculos_insert" ON vinculos_compensacao FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "vinculos_update" ON vinculos_compensacao FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "vinculos_delete" ON vinculos_compensacao FOR DELETE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));

-- SESSÕES
CREATE POLICY "sessoes_select" ON sessoes_autenticacao FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "sessoes_insert" ON sessoes_autenticacao FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- PROCESSAMENTOS
CREATE POLICY "processamentos_select" ON processamentos_faturas FOR SELECT TO authenticated
  USING (can_access_user_data(auth.uid(), user_id));
CREATE POLICY "processamentos_insert" ON processamentos_faturas FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "processamentos_update" ON processamentos_faturas FOR UPDATE TO authenticated
  USING (can_access_user_data(auth.uid(), user_id))
  WITH CHECK (can_access_user_data(auth.uid(), user_id));


-- =====================================================
-- PARTE 6: VIEW
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


-- =====================================================
-- PARTE 7: SEED DATA (Equipamentos + Parâmetros)
-- =====================================================

-- Equipamentos padrão
INSERT INTO equipamentos (tipo, nome, potencia_w, valor, ativo) VALUES
  ('modulo', 'Módulo 550W', 550, 850.00, true),
  ('modulo', 'Módulo 450W', 450, 700.00, true),
  ('inversor', 'Inversor 3kW', NULL, 2500.00, true),
  ('inversor', 'Inversor 5kW', NULL, 3500.00, true);

-- Parâmetros do sistema
INSERT INTO parametros (chave, valor, descricao) VALUES
  ('tarifa_padrao', '"0.89"', 'Tarifa padrão de energia em R$/kWh'),
  ('hsp', '"5.5"', 'Horas de sol pico média'),
  ('taxas_financiamento', '[{"parcelas": 6, "taxa": 0.0}, {"parcelas": 12, "taxa": 0.0199}, {"parcelas": 24, "taxa": 0.0249}, {"parcelas": 36, "taxa": 0.0299}, {"parcelas": 48, "taxa": 0.0349}, {"parcelas": 60, "taxa": 0.0399}]', 'Taxas de financiamento por prazo')
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, descricao = EXCLUDED.descricao;

INSERT INTO parametros (chave, valor, descricao) VALUES
  ('taxa_juros_mes', '0.02'::jsonb, 'Taxa de juros mensal para financiamento (decimal)'),
  ('potencia_por_placa_wp', '565'::jsonb, 'Potência padrão por placa em Watts'),
  ('adicional_estrut_solo_por_placa', '250'::jsonb, 'Custo adicional por placa para estrutura de solo (R$)'),
  ('prazos', '[36, 48, 60, 72, 84, 96, 108, 120]'::jsonb, 'Opções de prazos de financiamento em meses'),
  ('numero_whatsapp', '"67999999999"'::jsonb, 'Número do WhatsApp para contato'),
  ('tusd', '0.3'::jsonb, 'TUSD - Tarifa de Uso do Sistema de Distribuição (R$/kWh)'),
  ('te', '0.4'::jsonb, 'TE - Tarifa de Energia (R$/kWh)'),
  ('fio_b', '0.05'::jsonb, 'Fio B - Componente tarifário (R$/kWh)'),
  ('reajuste_medio', '0.08'::jsonb, 'Reajuste médio anual da tarifa de energia (8% ao ano)'),
  ('geracao_kwp', '130'::jsonb, 'Geração mensal estimada por kWp instalado (kWh/kWp/mês)'),
  ('over_load', '1.35'::jsonb, 'Fator de overload permitido para dimensionamento do inversor'),
  ('pis_confins', '0.0965'::jsonb, 'Alíquota PIS/COFINS sobre tarifa de energia (9.65%)'),
  ('icms', '0.18'::jsonb, 'Alíquota ICMS sobre tarifa de energia (18%)'),
  ('uf', '"MS"'::jsonb, 'Estado (UF) padrão para cálculos'),
  ('tarifa_comercial', '1.1'::jsonb, 'Tarifa comercial média da distribuidora (R$/kWh)'),
  ('taxa_compra_energia_investimento', '0.65'::jsonb, 'Taxa de compra de energia para modelo de investimento (R$/kWh)'),
  ('prazo_contrato_investimento', '15'::jsonb, 'Prazo padrão do contrato para modelo de investimento (anos)'),
  ('desconto_venda_gc', '0.20'::jsonb, 'Desconto oferecido na venda de energia por GC (20%)')
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, descricao = EXCLUDED.descricao;


-- =====================================================
-- PARTE 8: PRIMEIRO USUÁRIO ADMIN
-- =====================================================

-- Limpar usuário admin anterior (se existir)
DELETE FROM auth.users WHERE email = 'admin@moreirasolar.com';

-- Criar usuário no Supabase Auth
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'admin@moreirasolar.com',
  crypt('Moreira@2025', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"nome":"Administrador","perfil":"admin"}',
  NOW(), NOW(),
  '', '', '', ''
);

-- O trigger handle_new_user já criou o profile e user_role automaticamente.
-- Agora adicionamos a senha local para login via BFF:
INSERT INTO auth_local_users (id, email, password_hash, created_at, updated_at)
SELECT id, 'admin@moreirasolar.com',
  '$2b$10$apAkbHdrRFJl7oOPB.OZHeaXw2GnB6AZ9wg09HrgtP6X/MD5MQxSC',
  NOW(), NOW()
FROM auth.users WHERE email = 'admin@moreirasolar.com';

-- =====================================================
-- FIM! Todas as tabelas, funções, triggers, RLS,
-- dados iniciais e usuário admin foram criados.
--
-- Login: admin@moreirasolar.com / Moreira@2025
-- =====================================================
