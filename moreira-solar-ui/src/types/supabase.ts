// Tipos mapeados do Supabase para o sistema
export interface Lead {
  id: string;
  data: string;
  cliente: string;
  telefone: string;
  email?: string | null;
  cidade?: string | null;
  uf?: string | null;
  fonte?: string | null;
  status: 'Novo' | 'Qualificado' | 'Follow-up' | 'Perdido';
  dono_id?: string | null;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj?: string | null;
  telefone: string;
  email?: string | null;
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  estado?: string | null;
  profissao?: string | null;
  tempo_profissao?: string | null;
  estado_civil?: string | null;
  tempo_residencia?: string | null;
  renda?: number | null;
  fantasia?: string | null;
  observacoes?: string | null;
  vendedor_id?: string | null;
  user_id: string;
  data_cadastro?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Orcamento {
  id: string;
  numero: string;
  data: string;
  validade?: string | null;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  geracao_kwh?: number | null;
  qtd_modulos?: number | null;
  modelo_modulo?: string | null;
  potencia_modulo_w?: number | null;
  inversor_kw?: number | null;
  valor_base?: number | null;
  custo_estrutura_solo?: number | null;
  valor_total?: number | null;
  estrutura_solo?: boolean;
  parcela_selecionada?: number | null;
  prestacao?: number | null;
  economia_mensal?: number | null;
  economia_percentual?: number | null;
  payback_meses?: number | null;
  status?: string;
  user_id: string;
  vendedor_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Proposta {
  id: string;
  numero: string;
  data: string;
  validade?: string | null;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  orcamento_id?: string | null;
  valor_total?: number | null;
  entrada?: number | null;
  parcelas?: number | null;
  valor_parcela?: number | null;
  status?: string;
  observacoes?: string | null;
  user_id: string;
  vendedor_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Projeto {
  id: string;
  numero: string;
  nome: string;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  proposta_id?: string | null;
  data_inicio?: string | null;
  data_conclusao_prevista?: string | null;
  data_conclusao_real?: string | null;
  progresso?: number;
  status?: string;
  valor_total?: number | null;
  observacoes?: string | null;
  responsavel_id?: string | null;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Cobranca {
  id: string;
  numero: string;
  tipo?: string | null;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  projeto_id?: string | null;
  valor: number;
  vencimento: string;
  data_pagamento?: string | null;
  status?: string;
  observacoes?: string | null;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface UnidadeConsumidora {
  id: string;
  numero_instalacao: string;
  titular_id?: string | null;
  cliente_id?: string | null;
  projeto_id?: string | null;
  cidade?: string | null;
  uf?: string | null;
  distribuidora?: string | null;
  grupo?: string | null;
  classe?: string | null;
  modalidade?: string | null;
  ativo?: boolean;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Fatura {
  id: string;
  unidade_id?: string | null;
  mes_referencia: string;
  consumo_kwh?: number | null;
  geracao_kwh?: number | null;
  credito_anterior_kwh?: number | null;
  credito_mes_kwh?: number | null;
  saldo_kwh?: number | null;
  valor_total?: number | null;
  valor_energia?: number | null;
  valor_demanda?: number | null;
  arquivo_url?: string | null;
  processado?: boolean;
  data_processamento?: string | null;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}
