import React, { createContext, useContext, useState, useEffect } from "react";

// Types
export type PerfilTipo = "admin" | "gestor" | "vendedor";

export interface Permissao {
  modulo: string;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  visualizar: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilTipo;
  gestorId?: string;
  permissoes: Permissao[];
  ativo: boolean;
  dataCadastro: string;
  ultimoAcesso?: string;
  avatar?: string;
}

export interface Lead {
  id: string;
  data: string;
  cliente: string;
  telefone: string;
  email: string;
  cidade: string;
  uf: string;
  fonte: string;
  status: "Novo" | "Qualificado" | "Follow-up" | "Perdido";
  dono: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj?: string;
  telefone: string;
  email?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  profissao?: string;
  tempoProfissao?: string;
  estadoCivil?: string;
  tempoResidencia?: string;
  renda?: number;
  fantasia?: string;
  observacoes?: string;
  dataCadastro: string;
  vendedorId?: string;
  usuarioId?: string;
}

export interface Equipamento {
  id: string;
  tipo: "modulo" | "inversor";
  nome: string;
  potenciaW?: number; // só para módulos
  valor: number;
  ativo: boolean;
}

export interface Simulacao {
  id: string;
  data: string;
  clienteId?: string;
  clienteNome?: string;
  // Inputs
  valorConta?: number;
  geracaoAlvo?: number;
  modoCalculo: "conta" | "geracao";
  tarifa: number;
  // Resultados
  geracaoReal: number;
  qtdModulos: number;
  modeloModulo: string;
  potenciaModulo: number;
  inversorKw: number;
  valorBase: number;
  custoEstruturaSolo: number;
  valorTotal: number;
  estruturaSolo: boolean;
  // Parcelas selecionadas
  parcelaSelecionada?: number;
  prestacao?: number;
  economiaMensal?: number;
  economiaPercentual?: number;
  paybackMeses?: number;
  paybackAnos?: number;
  economiaTotal30Anos?: number;
  ganhosDuranteParcelas?: number;
  tabelaEconomia?: Array<{ano: number, economia: number, acumulado: number}>;
  // Metadata
  vendedor: string;
  status: "calculado" | "salvo_rascunho" | "orcamento";
}

export interface Orcamento {
  id: string;
  numero: string;
  cliente: string;
  conta?: number;
  consumo?: number;
  kwp: number;
  placas: number;
  modeloPlaca: string;
  inversor: string;
  tipoTelhado: string;
  fase: string;
  estruturaSolo: boolean;
  total: number;
  status: "Rascunho" | "Enviado" | "Aprovado" | "Reprovado";
  validade: string;
  dono: string;
  precoBase: number;
  maoDeObra: number;
  frete: number;
  adicionais: number;
  desconto: number;
  markup: number;
  observacoes?: string;
  simulacaoId?: string;
  origem?: "manual" | "calculadora" | "assinatura";
  tipoCalculadora?: "financiamento" | "manual" | "assinatura" | "investimento";
  tarifaVenda?: number;
  economiaTotal15Anos?: number;
  // Campos Investimento (Fase 7)
  taxaCompraEnergia?: number;
  prazoContrato?: number;
  roiPercentual?: number;
  paybackAnos?: number;
  receitaMensal?: number;
  receitaTotal?: number;
  tarifaVendaGC?: number;
}

export interface Proposta {
  id: string;
  numero: string;
  orcamentoId: string;
  orcamentoNumero: string;
  cliente: string;
  parcelaEscolhida: number;
  valorParcela: number;
  total: number;
  status: "Rascunho" | "Enviada" | "Visualizada" | "Aprovada" | "Reprovada";
  validade: string;
}

export interface Projeto {
  id: string;
  cliente: string;
  orcamentoNumero: string;
  kwp: number;
  responsavel: string;
  status: "Vistoria" | "Projeto/ART" | "Homologação" | "Compra" | "Instalação" | "Comissionamento" | "Entrega" | "Concluído";
  proximosPassos: string;
  prazo: string;
  prioridade: "Baixa" | "Média" | "Alta";
  progresso: number; // 0-100
  avatar?: string;
  checklist: Array<{ id: string; titulo: string; concluido: boolean }>;
  documentos: Array<{ id: string; nome: string; url: string; tipo: string; data: string }>;
  custos: {
    orcado: number;
    real: number;
    itens: Array<{ descricao: string; orcado: number; real: number }>;
  };
  timeline: Array<{ id: string; data: string; titulo: string; descricao: string }>;
}

export interface Chamado {
  id: string;
  numero: string;
  cliente: string;
  projetoId?: string;
  tipo: "Manutenção" | "Garantia" | "Suporte" | "Limpeza";
  prioridade: "Baixa" | "Média" | "Alta";
  status: "Onboarding" | "Ativo" | "Manutenção" | "Chamado" | "Finalizado";
  descricao: string;
  data: string;
  tecnico?: string;
  avatar?: string;
  historico: Array<{ id: string; data: string; acao: string; usuario: string }>;
  fotos: Array<{ id: string; url: string; descricao: string; data: string }>;
  resolucao?: string;
  dataFinalizacao?: string;
}

export interface LogIntegracao {
  id: string;
  dataHora: string;
  origem: string;
  status: "Sucesso" | "Erro";
  mensagem: string;
  payload: Record<string, any>;
}

export interface Parametros {
  taxaJurosMes: number;
  potenciaPorPlacaWp: number;
  adicionalEstrutSoloPorPlaca: number;
  prazos: number[];
  numeroWhatsApp: string;
  // Novos parâmetros
  tusd: number;
  te: number;
  fioB: number;
  reajusteMedio: number;
  geracaoKwp: number;
  overLoad: number;
  pisConfins: number;
  icms: number;
  uf: string;
  tarifaComercial: number;
  // Parâmetros Investimento (Fase 7)
  taxaCompraEnergiaInvestimento: number; // R$/kWh
  prazoContratoInvestimento: number; // anos
  descontoVendaGC: number; // decimal (0.20 = 20%)
}

export interface UserProfile {
  nome: string;
  email: string;
  role: "vendedor" | "gestor" | "admin";
}

export interface CatalogItem {
  id: string;
  nome: string;
  valor?: number;
  potencia?: number;
}

// Fase 8 - Gestão de Cobranças
export interface Cobranca {
  id: string;
  numero: string;
  tipo: "Financiamento" | "Geração Compartilhada";
  clienteId: string;
  clienteNome: string;
  projetoId?: string;
  orcamentoId?: string;
  valor: number;
  vencimento: string;
  status: "A Gerar" | "Gerado" | "Enviado" | "A Vencer" | "Pago" | "Atrasado" | "Cancelado" | "Pendente Aprovação";
  parcela?: string;
  parcelaNumero?: number;
  parcelaTotal?: number;
  dataEmissao: string;
  dataPagamento?: string;
  dataEnvio?: string;
  urlBoleto?: string;
  boletoNumero?: string;
  valorPago?: number;
  observacoes?: string;
  responsavel?: string;
  historicoStatus: Array<{
    status: string;
    data: string;
    usuario: string;
    obs?: string;
  }>;
  // Campos GC (Fase 10A)
  unidadeConsumidoraId?: string;
  energiaRecebida?: number;
  descontoGC?: number;
  valorFixoGC?: number;
}

// Fase 10A - Gestão de Faturas
export type TipoUC = "geradora_financiamento" | "geradora_investimento" | "beneficiaria_acr" | "beneficiaria_associacao" | "convencional";
export type StatusUnidade = "ativa" | "inativa" | "pendente_analise" | "em_analise";
export type TipoConcessionaria = "energisa" | "cemig" | "copel" | "celpe" | "outras";
export type ModeloCompensacao = "acr" | "associacao";

export interface TitularEnergia {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  concessionaria: TipoConcessionaria;
  dataCadastro: string;
  usuarioId: string;
  ultimoAcesso?: string;
}

export interface FaturaDetalhes {
  id: string;
  mesReferencia: string;
  energiaInjetada?: number;
  energiaRecebida?: number;
  consumo: number;
  saldo: number;
  valorConta: number;
  dataLeitura: string;
  dadosLeitura?: Record<string, any>;
  pdfUrl?: string;
}

export interface UnidadeConsumidora {
  id: string;
  titularId: string;
  numeroUC: string;
  apelido?: string;
  endereco: string;
  cidade: string;
  estado: string;
  concessionaria: TipoConcessionaria;
  tipo: TipoUC;
  status: StatusUnidade;
  clienteId?: string;
  dataCadastro: string;
  usuarioId: string;
  faturamentoMedioKwh: number;
  valorMedioFatura: number;
  ultimaFatura?: FaturaDetalhes;
  faturas: FaturaDetalhes[];
  gerarRelatorioAutomatico: boolean;
}

export interface VinculoCompensacao {
  id: string;
  ugiId: string;
  ucbId: string;
  modeloCompensacao: ModeloCompensacao;
  percentualCompensacao: number;
  dataCriacao: string;
  ativo: boolean;
}

export interface SessaoAutenticacao {
  id: string;
  titularId: string;
  concessionaria: TipoConcessionaria;
  dataHora: string;
  status: "sucesso" | "erro";
  mensagem?: string;
}

export interface ProcessamentoFatura {
  id: string;
  status: "em_fila" | "processando" | "concluido" | "erro";
  dataHora: string;
  qtdUCs: number;
  processadas: number;
  faturasBaixadas: number;
  tempoDecorrido?: number;
  usuarioId?: string;
  erro?: string;
  mesReferencia: string;
  ucsProcessadas: Array<{ ucId: string; sucesso: boolean; erro?: string }>;
}

interface AppState {
  leads: Lead[];
  clientes: Cliente[];
  equipamentos: Equipamento[];
  simulacoes: Simulacao[];
  orcamentos: Orcamento[];
  propostas: Proposta[];
  projetos: Projeto[];
  chamados: Chamado[];
  logs: LogIntegracao[];
  parametros: Parametros;
  catalogoPlacas: CatalogItem[];
  catalogoInversores: CatalogItem[];
  catalogoEstruturas: CatalogItem[];
  userProfile: UserProfile;
  cobrancas: Cobranca[];
  usuarios: Usuario[];
  usuarioLogado: Usuario | null;
  titularesEnergia: TitularEnergia[];
  unidadesConsumidoras: UnidadeConsumidora[];
  vinculosCompensacao: VinculoCompensacao[];
  sessoesAutenticacao: SessaoAutenticacao[];
  processamentosFaturas: ProcessamentoFatura[];
}

interface AppContextType {
  state: AppState;
  addLead: (lead: Omit<Lead, "id">) => void;
  updateLead: (id: string, lead: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addCliente: (cliente: Omit<Cliente, "id" | "dataCadastro">) => void;
  updateCliente: (id: string, cliente: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;
  addEquipamento: (equip: Omit<Equipamento, "id">) => void;
  updateEquipamento: (id: string, equip: Partial<Equipamento>) => void;
  deleteEquipamento: (id: string) => void;
  addSimulacao: (sim: Omit<Simulacao, "id" | "data">) => void;
  updateSimulacao: (id: string, sim: Partial<Simulacao>) => void;
  addOrcamento: (orc: Omit<Orcamento, "id" | "numero">) => void;
  updateOrcamento: (id: string, orc: Partial<Orcamento>) => void;
  deleteOrcamento: (id: string) => void;
  addProposta: (prop: Omit<Proposta, "id" | "numero">) => void;
  updateProposta: (id: string, prop: Partial<Proposta>) => void;
  addProjeto: (proj: Omit<Projeto, "id">) => void;
  updateProjeto: (id: string, proj: Partial<Projeto>) => void;
  addChamado: (ch: Omit<Chamado, "id" | "numero">) => void;
  updateChamado: (id: string, ch: Partial<Chamado>) => void;
  addCobranca: (cob: Omit<Cobranca, "id" | "numero">) => void;
  updateCobranca: (id: string, cob: Partial<Cobranca>) => void;
  deleteCobranca: (id: string) => void;
  gerarCobrancasAutomaticas: (params: {
    tipo: "Financiamento" | "Geração Compartilhada";
    orcamentoId?: string;
    clienteId?: string;
    valorMensal?: number;
    diaVencimento: number;
    dataInicio: string;
    dataFim?: string;
  }) => void;
  updateParametros: (params: Partial<Parametros>) => void;
  reloadSeed: () => void;
  addUsuario: (usuario: Omit<Usuario, "id" | "dataCadastro">) => void;
  updateUsuario: (id: string, usuario: Partial<Usuario>) => void;
  deleteUsuario: (id: string) => void;
  login: (email: string, senha: string) => boolean;
  logout: () => void;
  checkPermissao: (modulo: string, acao: "criar" | "editar" | "excluir" | "visualizar") => boolean;
  getVendedoresDoGestor: (gestorId: string) => Usuario[];
  getPermissoesDefault: (perfil: PerfilTipo) => Permissao[];
  // Fase 10A - Gestão de Faturas
  addTitularEnergia: (titular: Omit<TitularEnergia, "id" | "dataCadastro" | "usuarioId">) => string;
  updateTitularEnergia: (id: string, titular: Partial<TitularEnergia>) => void;
  deleteTitularEnergia: (id: string) => void;
  addUnidadeConsumidora: (uc: Omit<UnidadeConsumidora, "id" | "dataCadastro" | "usuarioId">) => string;
  updateUnidadeConsumidora: (id: string, uc: Partial<UnidadeConsumidora>) => void;
  deleteUnidadeConsumidora: (id: string) => void;
  addVinculoCompensacao: (vinculo: Omit<VinculoCompensacao, "id" | "dataCriacao">) => string;
  updateVinculoCompensacao: (id: string, vinculo: Partial<VinculoCompensacao>) => void;
  deleteVinculoCompensacao: (id: string) => void;
  getVinculosPorUG: (ugiId: string) => VinculoCompensacao[];
  getVinculosPorUCB: (ucbId: string) => VinculoCompensacao[];
  addSessaoAutenticacao: (sessao: Omit<SessaoAutenticacao, "id" | "dataHora">) => string;
  updateSessaoAutenticacao: (id: string, sessao: Partial<SessaoAutenticacao>) => void;
  addProcessamentoFatura: (proc: Omit<ProcessamentoFatura, "id">) => string;
  updateProcessamentoFatura: (id: string, proc: Partial<ProcessamentoFatura>) => void;
  calcularCobrancasGC: (processamentoId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "moreira_v2_ui_seed";

const MODULOS = ["dashboard", "crm", "propostas", "clientes", "orcamentos", "projetos", "pos-venda", "cobrancas", "faturas", "usuarios", "parametros", "integracoes"];

const getPermissoesDefault = (perfil: PerfilTipo): Permissao[] => {
  if (perfil === "admin") {
    return MODULOS.map(m => ({ modulo: m, criar: true, editar: true, excluir: true, visualizar: true }));
  } else if (perfil === "gestor") {
    return MODULOS.map(m => {
      if (["parametros", "integracoes"].includes(m)) {
        return { modulo: m, criar: false, editar: false, excluir: false, visualizar: false };
      }
      return { modulo: m, criar: true, editar: true, excluir: false, visualizar: true };
    });
  } else {
    return MODULOS.map(m => {
      if (["dashboard", "crm", "propostas", "clientes", "orcamentos"].includes(m)) {
        return { modulo: m, criar: true, editar: true, excluir: false, visualizar: true };
      }
      return { modulo: m, criar: false, editar: false, excluir: false, visualizar: false };
    });
  }
};

const generateSeed = (): AppState => ({
  usuarios: [
    {
      id: "U001",
      nome: "João Silva",
      email: "admin@moreira.com",
      senha: "admin123",
      perfil: "admin",
      permissoes: getPermissoesDefault("admin"),
      ativo: true,
      dataCadastro: new Date().toISOString(),
    },
    {
      id: "U002",
      nome: "Maria Santos",
      email: "gestor@moreira.com",
      senha: "gestor123",
      perfil: "gestor",
      permissoes: getPermissoesDefault("gestor"),
      ativo: true,
      dataCadastro: new Date().toISOString(),
    },
    {
      id: "U003",
      nome: "Pedro Costa",
      email: "vendedor@moreira.com",
      senha: "vendedor123",
      perfil: "vendedor",
      gestorId: "U002",
      permissoes: getPermissoesDefault("vendedor"),
      ativo: true,
      dataCadastro: new Date().toISOString(),
    },
  ],
  usuarioLogado: null,
  leads: [
    {
      id: "L001",
      data: "2025-01-20",
      cliente: "João Silva",
      telefone: "(11) 98765-4321",
      email: "joao@email.com",
      cidade: "São Paulo",
      uf: "SP",
      fonte: "Google Ads",
      status: "Novo",
      dono: "Carlos Vendedor",
    },
    {
      id: "L002",
      data: "2025-01-18",
      cliente: "Maria Santos",
      telefone: "(21) 97654-3210",
      email: "maria@email.com",
      cidade: "Rio de Janeiro",
      uf: "RJ",
      fonte: "Indicação",
      status: "Qualificado",
      dono: "Ana Comercial",
    },
    {
      id: "L003",
      data: "2025-01-15",
      cliente: "Pedro Costa",
      telefone: "(31) 96543-2109",
      email: "pedro@email.com",
      cidade: "Belo Horizonte",
      uf: "MG",
      fonte: "Facebook",
      status: "Follow-up",
      dono: "Carlos Vendedor",
    },
  ],
  clientes: [
    {
      id: "C001",
      nome: "João Silva",
      cpfCnpj: "123.456.789-00",
      telefone: "(11) 98765-4321",
      email: "joao@email.com",
      cidade: "São Paulo",
      estado: "SP",
      dataCadastro: "2025-01-15",
    },
    {
      id: "C002",
      nome: "Maria Santos",
      cpfCnpj: "987.654.321-00",
      telefone: "(21) 97654-3210",
      email: "maria@email.com",
      cidade: "Rio de Janeiro",
      estado: "RJ",
      dataCadastro: "2025-01-10",
    },
  ],
  equipamentos: [
    { id: "MOD001", tipo: "modulo", nome: "Canadian Solar 565Wp", potenciaW: 565, valor: 800, ativo: true },
    { id: "MOD002", tipo: "modulo", nome: "Jinko Solar 550Wp", potenciaW: 550, valor: 780, ativo: true },
    { id: "MOD003", tipo: "modulo", nome: "Trina Solar 575Wp", potenciaW: 575, valor: 820, ativo: true },
    { id: "INV001", tipo: "inversor", nome: "Growatt 5kW", valor: 3500, ativo: true },
    { id: "INV002", tipo: "inversor", nome: "Growatt 10kW", valor: 6500, ativo: true },
  ],
  simulacoes: [],
  orcamentos: [
    {
      id: "O001",
      numero: "ORC-2025-001",
      cliente: "João Silva",
      conta: 850,
      consumo: 680,
      kwp: 5.67,
      placas: 10,
      modeloPlaca: "Canadian Solar 565Wp",
      inversor: "Growatt 5kW",
      tipoTelhado: "Cerâmico",
      fase: "Bifásico",
      estruturaSolo: false,
      total: 28500,
      status: "Enviado",
      validade: "2025-02-20",
      dono: "Carlos Vendedor",
      precoBase: 22000,
      maoDeObra: 4000,
      frete: 1500,
      adicionais: 500,
      desconto: 0,
      markup: 1.3,
      origem: "manual",
    },
    {
      id: "O002",
      numero: "ORC-2025-002",
      cliente: "Maria Santos",
      consumo: 1200,
      kwp: 10,
      placas: 18,
      modeloPlaca: "Canadian Solar 565Wp",
      inversor: "Growatt 10kW",
      tipoTelhado: "Metálico",
      fase: "Trifásico",
      estruturaSolo: true,
      total: 54500,
      status: "Aprovado",
      validade: "2025-02-18",
      dono: "Ana Comercial",
      precoBase: 40000,
      maoDeObra: 7000,
      frete: 2500,
      adicionais: 500,
      desconto: 500,
      markup: 1.25,
      origem: "manual",
    },
  ],
  propostas: [
    {
      id: "P001",
      numero: "PROP-2025-001",
      orcamentoId: "O001",
      orcamentoNumero: "ORC-2025-001",
      cliente: "João Silva",
      parcelaEscolhida: 36,
      valorParcela: 1118,
      total: 28500,
      status: "Enviada",
      validade: "2025-02-20",
    },
    {
      id: "P002",
      numero: "PROP-2025-002",
      orcamentoId: "O002",
      orcamentoNumero: "ORC-2025-002",
      cliente: "Maria Santos",
      parcelaEscolhida: 48,
      valorParcela: 1700,
      total: 54500,
      status: "Aprovada",
      validade: "2025-02-18",
    },
  ],
  projetos: [
    {
      id: "PR001",
      cliente: "Maria Santos",
      orcamentoNumero: "ORC-2025-002",
      kwp: 10,
      responsavel: "Eng. Roberto",
      status: "Projeto/ART",
      proximosPassos: "Finalizar projeto elétrico e registrar ART",
      prazo: "2025-02-05",
      prioridade: "Alta",
      progresso: 35,
      checklist: [
        { id: "c1", titulo: "Solicitar documentação do cliente", concluido: true },
        { id: "c2", titulo: "Realizar vistoria técnica", concluido: true },
        { id: "c3", titulo: "Elaborar projeto elétrico", concluido: false },
        { id: "c4", titulo: "Registrar ART", concluido: false },
      ],
      documentos: [],
      custos: {
        orcado: 54500,
        real: 32000,
        itens: [
          { descricao: "Módulos", orcado: 30000, real: 28000 },
          { descricao: "Inversores", orcado: 12000, real: 12000 },
          { descricao: "Estrutura", orcado: 8000, real: 7500 },
        ],
      },
      timeline: [
        { id: "t1", data: "2025-01-20", titulo: "Projeto Iniciado", descricao: "Cliente aprovou proposta" },
        { id: "t2", data: "2025-01-22", titulo: "Vistoria Concluída", descricao: "Vistoria técnica realizada com sucesso" },
      ],
    },
    {
      id: "PR002",
      cliente: "Carlos Mendes",
      orcamentoNumero: "ORC-2024-089",
      kwp: 7.5,
      responsavel: "Eng. Roberto",
      status: "Instalação",
      proximosPassos: "Concluir instalação dos painéis",
      prazo: "2025-01-28",
      prioridade: "Média",
      progresso: 70,
      checklist: [
        { id: "c1", titulo: "Comprar equipamentos", concluido: true },
        { id: "c2", titulo: "Instalar estrutura", concluido: true },
        { id: "c3", titulo: "Instalar painéis", concluido: true },
        { id: "c4", titulo: "Instalar inversores", concluido: false },
        { id: "c5", titulo: "Realizar conexões elétricas", concluido: false },
      ],
      documentos: [],
      custos: {
        orcado: 42000,
        real: 38500,
        itens: [
          { descricao: "Módulos", orcado: 22000, real: 21000 },
          { descricao: "Inversores", orcado: 10000, real: 9500 },
          { descricao: "Estrutura", orcado: 6000, real: 5800 },
        ],
      },
      timeline: [
        { id: "t1", data: "2024-12-10", titulo: "Projeto Aprovado", descricao: "Homologação concluída" },
        { id: "t2", data: "2024-12-20", titulo: "Equipamentos Comprados", descricao: "Todos os equipamentos foram adquiridos" },
        { id: "t3", data: "2025-01-15", titulo: "Instalação Iniciada", descricao: "Início da instalação no local" },
      ],
    },
  ],
  chamados: [
    {
      id: "CH001",
      numero: "CH-2025-001",
      cliente: "José Almeida",
      projetoId: "PR003",
      tipo: "Manutenção",
      prioridade: "Média",
      status: "Ativo",
      descricao: "Limpeza dos painéis solares",
      data: "2025-01-22",
      tecnico: "Técnico João",
      historico: [
        { id: "h1", data: "2025-01-22", acao: "Chamado criado", usuario: "Sistema" },
        { id: "h2", data: "2025-01-23", acao: "Técnico atribuído", usuario: "Admin" },
      ],
      fotos: [],
    },
  ],
  logs: [
    {
      id: "LOG001",
      dataHora: "2025-01-22 10:30:15",
      origem: "RD Station",
      status: "Sucesso",
      mensagem: "Lead sincronizado com sucesso",
      payload: { lead_id: "L005", nome: "Roberto Lima" },
    },
    {
      id: "LOG002",
      dataHora: "2025-01-22 09:15:42",
      origem: "WhatsApp API",
      status: "Sucesso",
      mensagem: "Proposta enviada via WhatsApp",
      payload: { proposta_id: "P001", telefone: "5511987654321" },
    },
  ],
  parametros: {
    taxaJurosMes: 0.02,
    potenciaPorPlacaWp: 565,
    adicionalEstrutSoloPorPlaca: 250,
    prazos: [36, 48, 60, 72],
    numeroWhatsApp: "5511999999999",
    tusd: 0.35,
    te: 0.45,
    fioB: 0.15,
    reajusteMedio: 0.08,
    geracaoKwp: 0.14,
    overLoad: 1.3,
    pisConfins: 0.0925,
    icms: 0.18,
    uf: "SP",
    tarifaComercial: 1.1,
    taxaCompraEnergiaInvestimento: 0.60,
    prazoContratoInvestimento: 10,
    descontoVendaGC: 0.20,
  },
  cobrancas: [
    {
      id: "COB001",
      numero: "COB-2025-001",
      tipo: "Financiamento",
      clienteId: "C001",
      clienteNome: "João Silva",
      orcamentoId: "O001",
      valor: 1118,
      vencimento: "2025-02-15",
      status: "Enviado",
      parcela: "1/36",
      parcelaNumero: 1,
      parcelaTotal: 36,
      dataEmissao: "2025-01-20",
      dataEnvio: "2025-01-20",
      responsavel: "Carlos Vendedor",
      historicoStatus: [
        { status: "A Gerar", data: "2025-01-20 10:00", usuario: "Sistema", obs: "Cobrança criada automaticamente" },
        { status: "Gerado", data: "2025-01-20 10:05", usuario: "Carlos Vendedor", obs: "Boleto gerado" },
        { status: "Enviado", data: "2025-01-20 10:10", usuario: "Carlos Vendedor", obs: "Enviado via WhatsApp" },
      ],
    },
    {
      id: "COB002",
      numero: "COB-2025-002",
      tipo: "Geração Compartilhada",
      clienteId: "C002",
      clienteNome: "Maria Santos",
      valor: 450,
      vencimento: "2025-02-10",
      status: "Pago",
      dataEmissao: "2025-01-10",
      dataPagamento: "2025-02-08",
      valorPago: 450,
      responsavel: "Ana Comercial",
      historicoStatus: [
        { status: "A Gerar", data: "2025-01-10 09:00", usuario: "Sistema" },
        { status: "Gerado", data: "2025-01-10 09:30", usuario: "Ana Comercial" },
        { status: "Enviado", data: "2025-01-10 10:00", usuario: "Ana Comercial" },
        { status: "Pago", data: "2025-02-08 14:30", usuario: "Ana Comercial", obs: "Pagamento confirmado" },
      ],
    },
    {
      id: "COB003",
      numero: "COB-2025-003",
      tipo: "Financiamento",
      clienteId: "C001",
      clienteNome: "João Silva",
      orcamentoId: "O001",
      valor: 1118,
      vencimento: "2025-01-15",
      status: "Atrasado",
      parcela: "0/36",
      parcelaNumero: 0,
      parcelaTotal: 36,
      dataEmissao: "2024-12-20",
      dataEnvio: "2024-12-20",
      responsavel: "Carlos Vendedor",
      historicoStatus: [
        { status: "Enviado", data: "2024-12-20 10:00", usuario: "Carlos Vendedor" },
        { status: "Atrasado", data: "2025-01-16 00:00", usuario: "Sistema", obs: "Vencimento ultrapassado" },
      ],
    },
  ],
  catalogoPlacas: [
    { id: "PL001", nome: "Canadian Solar 565Wp", potencia: 565, valor: 800 },
    { id: "PL002", nome: "Jinko Solar 550Wp", potencia: 550, valor: 780 },
    { id: "PL003", nome: "Trina Solar 575Wp", potencia: 575, valor: 820 },
  ],
  catalogoInversores: [
    { id: "INV001", nome: "Growatt 5kW", valor: 3500 },
    { id: "INV002", nome: "Growatt 10kW", valor: 6500 },
  ],
  catalogoEstruturas: [
    { id: "EST001", nome: "Estrutura Telhado Cerâmico", valor: 150 },
    { id: "EST002", nome: "Estrutura Telhado Metálico", valor: 180 },
  ],
  userProfile: {
    nome: "Admin Mock",
    email: "admin@moreira.com",
    role: "admin",
  },
  // Fase 10A - Gestão de Faturas
  titularesEnergia: [
    {
      id: "TIT001",
      nome: "João Silva",
      cpfCnpj: "123.456.789-00",
      telefone: "(79) 99999-8888",
      email: "joao.silva@email.com",
      concessionaria: "energisa",
      dataCadastro: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      usuarioId: "U001",
      ultimoAcesso: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "TIT002",
      nome: "Empresa Solar XYZ Ltda",
      cpfCnpj: "12.345.678/0001-99",
      telefone: "(31) 98888-7777",
      email: "contato@solarxyz.com.br",
      concessionaria: "cemig",
      dataCadastro: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      usuarioId: "U001",
    },
  ],
  unidadesConsumidoras: [
    {
      id: "UC001",
      titularId: "TIT001",
      numeroUC: "123456789",
      apelido: "Casa Principal - João",
      endereco: "Rua das Flores, 123",
      cidade: "Aracaju",
      estado: "SE",
      concessionaria: "energisa",
      tipo: "geradora_investimento",
      status: "ativa",
      clienteId: "C001",
      dataCadastro: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      usuarioId: "U001",
      faturamentoMedioKwh: 500,
      valorMedioFatura: 350,
      ultimaFatura: {
        id: "FAT001",
        mesReferencia: "2025-01",
        energiaInjetada: 520,
        consumo: 50,
        saldo: 470,
        valorConta: 35,
        dataLeitura: new Date().toISOString(),
      },
      faturas: [
        {
          id: "FAT001",
          mesReferencia: "2025-01",
          energiaInjetada: 520,
          consumo: 50,
          saldo: 470,
          valorConta: 35,
          dataLeitura: new Date().toISOString(),
        },
        {
          id: "FAT002",
          mesReferencia: "2024-12",
          energiaInjetada: 510,
          consumo: 45,
          saldo: 465,
          valorConta: 32,
          dataLeitura: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      gerarRelatorioAutomatico: true,
    },
    {
      id: "UC002",
      titularId: "TIT001",
      numeroUC: "987654321",
      apelido: "Comércio - João",
      endereco: "Av. Central, 456",
      cidade: "Aracaju",
      estado: "SE",
      concessionaria: "energisa",
      tipo: "beneficiaria_acr",
      status: "ativa",
      dataCadastro: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      usuarioId: "U001",
      faturamentoMedioKwh: 300,
      valorMedioFatura: 210,
      ultimaFatura: {
        id: "FAT003",
        mesReferencia: "2025-01",
        energiaRecebida: 200,
        consumo: 300,
        saldo: -100,
        valorConta: 70,
        dataLeitura: new Date().toISOString(),
      },
      faturas: [
        {
          id: "FAT003",
          mesReferencia: "2025-01",
          energiaRecebida: 200,
          consumo: 300,
          saldo: -100,
          valorConta: 70,
          dataLeitura: new Date().toISOString(),
        },
      ],
      gerarRelatorioAutomatico: false,
    },
    {
      id: "UC003",
      titularId: "TIT002",
      numeroUC: "456789123",
      apelido: "Usina Solar XYZ",
      endereco: "Rod. BR-040, Km 120",
      cidade: "Belo Horizonte",
      estado: "MG",
      concessionaria: "cemig",
      tipo: "geradora_investimento",
      status: "ativa",
      dataCadastro: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
      usuarioId: "U001",
      faturamentoMedioKwh: 2000,
      valorMedioFatura: 1400,
      ultimaFatura: {
        id: "FAT004",
        mesReferencia: "2025-01",
        energiaInjetada: 2050,
        consumo: 100,
        saldo: 1950,
        valorConta: 70,
        dataLeitura: new Date().toISOString(),
      },
      faturas: [
        {
          id: "FAT004",
          mesReferencia: "2025-01",
          energiaInjetada: 2050,
          consumo: 100,
          saldo: 1950,
          valorConta: 70,
          dataLeitura: new Date().toISOString(),
        },
      ],
      gerarRelatorioAutomatico: true,
    },
    {
      id: "UC004",
      titularId: "TIT002",
      numeroUC: "789123456",
      apelido: "Loja Centro - XYZ",
      endereco: "Rua Bahia, 789",
      cidade: "Belo Horizonte",
      estado: "MG",
      concessionaria: "cemig",
      tipo: "beneficiaria_acr",
      status: "ativa",
      dataCadastro: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      usuarioId: "U001",
      faturamentoMedioKwh: 800,
      valorMedioFatura: 560,
      ultimaFatura: {
        id: "FAT005",
        mesReferencia: "2025-01",
        energiaRecebida: 700,
        consumo: 800,
        saldo: -100,
        valorConta: 70,
        dataLeitura: new Date().toISOString(),
      },
      faturas: [
        {
          id: "FAT005",
          mesReferencia: "2025-01",
          energiaRecebida: 700,
          consumo: 800,
          saldo: -100,
          valorConta: 70,
          dataLeitura: new Date().toISOString(),
        },
      ],
      gerarRelatorioAutomatico: false,
    },
    {
      id: "UC005",
      titularId: "TIT001",
      numeroUC: "321654987",
      apelido: "Sítio - Financiamento",
      endereco: "Zona Rural, s/n",
      cidade: "Aracaju",
      estado: "SE",
      concessionaria: "energisa",
      tipo: "geradora_financiamento",
      status: "ativa",
      dataCadastro: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      usuarioId: "U001",
      faturamentoMedioKwh: 250,
      valorMedioFatura: 175,
      ultimaFatura: {
        id: "FAT006",
        mesReferencia: "2025-01",
        energiaInjetada: 260,
        consumo: 240,
        saldo: 20,
        valorConta: 15,
        dataLeitura: new Date().toISOString(),
      },
      faturas: [
        {
          id: "FAT006",
          mesReferencia: "2025-01",
          energiaInjetada: 260,
          consumo: 240,
          saldo: 20,
          valorConta: 15,
          dataLeitura: new Date().toISOString(),
        },
      ],
      gerarRelatorioAutomatico: true,
    },
  ],
  vinculosCompensacao: [
    {
      id: "VINC001",
      ugiId: "UC001",
      ucbId: "UC002",
      modeloCompensacao: "acr",
      percentualCompensacao: 40,
      dataCriacao: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      ativo: true,
    },
    {
      id: "VINC002",
      ugiId: "UC003",
      ucbId: "UC004",
      modeloCompensacao: "acr",
      percentualCompensacao: 35,
      dataCriacao: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      ativo: true,
    },
    {
      id: "VINC003",
      ugiId: "UC001",
      ucbId: "UC004",
      modeloCompensacao: "associacao",
      percentualCompensacao: 25,
      dataCriacao: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      ativo: true,
    },
  ],
  sessoesAutenticacao: [
    {
      id: "SESS001",
      titularId: "TIT001",
      concessionaria: "energisa",
      dataHora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "sucesso",
    },
    {
      id: "SESS002",
      titularId: "TIT002",
      concessionaria: "cemig",
      dataHora: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: "sucesso",
    },
  ],
  processamentosFaturas: [
    {
      id: "PROC001",
      status: "concluido",
      dataHora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      qtdUCs: 3,
      processadas: 3,
      faturasBaixadas: 3,
      tempoDecorrido: 6000,
      usuarioId: "U001",
      mesReferencia: "2025-01",
      ucsProcessadas: [
        { ucId: "UC001", sucesso: true },
        { ucId: "UC002", sucesso: true },
        { ucId: "UC005", sucesso: true },
      ],
    },
  ],
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // FASE 9: Migrar para sistema de usuários
      if (!parsed.usuarios) {
        const seed = generateSeed();
        parsed.usuarios = seed.usuarios;
      }
      if (parsed.usuarioLogado === undefined) {
        parsed.usuarioLogado = null;
      }
      
      // FASE 10A: Migrar para Gestão de Faturas - Popular com seed data se não existir
      if (!parsed.titularesEnergia || parsed.titularesEnergia.length === 0) {
        const seedData = generateSeed();
        parsed.titularesEnergia = seedData.titularesEnergia;
        parsed.unidadesConsumidoras = seedData.unidadesConsumidoras;
        parsed.vinculosCompensacao = seedData.vinculosCompensacao;
        parsed.sessoesAutenticacao = seedData.sessoesAutenticacao;
        parsed.processamentosFaturas = seedData.processamentosFaturas;
        
        // Adicionar cobranças GC de exemplo (3 pendentes aprovação)
        const cobrancasGC = [
          {
            id: `COB-GC-${Date.now()}-1`,
            clienteId: "C001",
            unidadeConsumidoraId: "UC002",
            valor: 147.00,
            vencimento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "Pendente Aprovação" as const,
            descricao: "Geração Compartilhada - Jan/2025",
            tipo: "GC" as const,
            energiaRecebida: 300,
            descontoGC: 30,
            dataCriacao: new Date().toISOString(),
            usuarioId: parsed.usuarios?.[0]?.id || "U001",
          },
          {
            id: `COB-GC-${Date.now()}-2`,
            clienteId: "C001",
            unidadeConsumidoraId: "UC004",
            valor: 392.00,
            vencimento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "Pendente Aprovação" as const,
            descricao: "Geração Compartilhada - Jan/2025",
            tipo: "GC" as const,
            energiaRecebida: 800,
            descontoGC: 30,
            dataCriacao: new Date().toISOString(),
            usuarioId: parsed.usuarios?.[0]?.id || "U001",
          },
          {
            id: `COB-GC-${Date.now()}-3`,
            clienteId: "C001",
            unidadeConsumidoraId: "UC005",
            valor: 122.50,
            vencimento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "Pendente Aprovação" as const,
            descricao: "Geração Compartilhada - Jan/2025",
            tipo: "GC" as const,
            energiaRecebida: 250,
            descontoGC: 30,
            dataCriacao: new Date().toISOString(),
            usuarioId: parsed.usuarios?.[0]?.id || "U001",
          },
        ];
        
        parsed.cobrancas = [...(parsed.cobrancas || []), ...cobrancasGC];
      }
      
      // Migrar clientes para adicionar usuarioId
      if (parsed.clientes && Array.isArray(parsed.clientes)) {
        parsed.clientes = parsed.clientes.map((c: any) => ({
          ...c,
          usuarioId: c.usuarioId || (parsed.usuarios && parsed.usuarios[0] ? parsed.usuarios[0].id : undefined),
        }));
      }
      
      // Migrar dados antigos: adicionar campos novos se não existirem
      if (parsed.parametros) {
        parsed.parametros = {
          ...parsed.parametros,
          tusd: parsed.parametros.tusd ?? 0.35,
          te: parsed.parametros.te ?? 0.45,
          fioB: parsed.parametros.fioB ?? 0.15,
          reajusteMedio: parsed.parametros.reajusteMedio ?? 0.08,
          geracaoKwp: parsed.parametros.geracaoKwp ?? 0.14,
          overLoad: parsed.parametros.overLoad ?? 1.3,
          pisConfins: parsed.parametros.pisConfins ?? 0.0925,
          icms: parsed.parametros.icms ?? 0.18,
          uf: parsed.parametros.uf ?? "SP",
          tarifaComercial: parsed.parametros.tarifaComercial ?? 1.1,
          taxaCompraEnergiaInvestimento: parsed.parametros.taxaCompraEnergiaInvestimento ?? 0.60,
          prazoContratoInvestimento: parsed.parametros.prazoContratoInvestimento ?? 10,
          descontoVendaGC: parsed.parametros.descontoVendaGC ?? 0.20,
        };
      }
      if (!parsed.cobrancas) parsed.cobrancas = [];
      // Adicionar arrays se não existirem
      if (!parsed.clientes) parsed.clientes = [];
      if (!parsed.equipamentos) {
        parsed.equipamentos = [
          { id: "MOD001", tipo: "modulo", nome: "Canadian Solar 565Wp", potenciaW: 565, valor: 800, ativo: true },
          { id: "MOD002", tipo: "modulo", nome: "Jinko Solar 550Wp", potenciaW: 550, valor: 780, ativo: true },
          { id: "MOD003", tipo: "modulo", nome: "Trina Solar 575Wp", potenciaW: 575, valor: 820, ativo: true },
          { id: "INV001", tipo: "inversor", nome: "Growatt 5kW", valor: 3500, ativo: true },
          { id: "INV002", tipo: "inversor", nome: "Growatt 10kW", valor: 6500, ativo: true },
        ];
      }
      if (!parsed.simulacoes) parsed.simulacoes = [];
      if (!parsed.userProfile) {
        parsed.userProfile = {
          nome: "Admin Mock",
          email: "admin@moreira.com",
          role: "admin",
        };
      }
      return parsed;
    }
    return generateSeed();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addLead = (lead: Omit<Lead, "id">) => {
    const newLead: Lead = { ...lead, id: `L${Date.now()}` };
    setState((prev) => ({ ...prev, leads: [...prev.leads, newLead] }));
  };

  const updateLead = (id: string, lead: Partial<Lead>) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => (l.id === id ? { ...l, ...lead } : l)),
    }));
  };

  const deleteLead = (id: string) => {
    setState((prev) => ({ ...prev, leads: prev.leads.filter((l) => l.id !== id) }));
  };

  const addCliente = (cliente: Omit<Cliente, "id" | "dataCadastro">) => {
    const newCliente: Cliente = {
      ...cliente,
      id: `C${Date.now()}`,
      dataCadastro: new Date().toISOString().split("T")[0],
    };
    setState((prev) => ({ ...prev, clientes: [...prev.clientes, newCliente] }));
  };

  const updateCliente = (id: string, cliente: Partial<Cliente>) => {
    setState((prev) => ({
      ...prev,
      clientes: prev.clientes.map((c) => (c.id === id ? { ...c, ...cliente } : c)),
    }));
  };

  const deleteCliente = (id: string) => {
    setState((prev) => ({ ...prev, clientes: prev.clientes.filter((c) => c.id !== id) }));
  };

  const addEquipamento = (equip: Omit<Equipamento, "id">) => {
    const prefix = equip.tipo === "modulo" ? "MOD" : "INV";
    const newEquip: Equipamento = { ...equip, id: `${prefix}${Date.now()}` };
    setState((prev) => ({ ...prev, equipamentos: [...prev.equipamentos, newEquip] }));
  };

  const updateEquipamento = (id: string, equip: Partial<Equipamento>) => {
    setState((prev) => ({
      ...prev,
      equipamentos: prev.equipamentos.map((e) => (e.id === id ? { ...e, ...equip } : e)),
    }));
  };

  const deleteEquipamento = (id: string) => {
    setState((prev) => ({ ...prev, equipamentos: prev.equipamentos.filter((e) => e.id !== id) }));
  };

  const addSimulacao = (sim: Omit<Simulacao, "id" | "data">) => {
    const newSim: Simulacao = {
      ...sim,
      id: `SIM${Date.now()}`,
      data: new Date().toISOString().split("T")[0],
    };
    setState((prev) => ({ ...prev, simulacoes: [...prev.simulacoes, newSim] }));
  };

  const updateSimulacao = (id: string, sim: Partial<Simulacao>) => {
    setState((prev) => ({
      ...prev,
      simulacoes: prev.simulacoes.map((s) => (s.id === id ? { ...s, ...sim } : s)),
    }));
  };

  const addOrcamento = (orc: Omit<Orcamento, "id" | "numero">) => {
    const count = state.orcamentos.length + 1;
    const newOrc: Orcamento = {
      ...orc,
      id: `O${Date.now()}`,
      numero: `ORC-2025-${String(count).padStart(3, "0")}`,
    };
    setState((prev) => ({ ...prev, orcamentos: [...prev.orcamentos, newOrc] }));
  };

  const updateOrcamento = (id: string, orc: Partial<Orcamento>) => {
    setState((prev) => ({
      ...prev,
      orcamentos: prev.orcamentos.map((o) => (o.id === id ? { ...o, ...orc } : o)),
    }));
  };

  const deleteOrcamento = (id: string) => {
    setState((prev) => ({ ...prev, orcamentos: prev.orcamentos.filter((o) => o.id !== id) }));
  };

  const addProposta = (prop: Omit<Proposta, "id" | "numero">) => {
    const count = state.propostas.length + 1;
    const newProp: Proposta = {
      ...prop,
      id: `P${Date.now()}`,
      numero: `PROP-2025-${String(count).padStart(3, "0")}`,
    };
    setState((prev) => ({ ...prev, propostas: [...prev.propostas, newProp] }));
  };

  const updateProposta = (id: string, prop: Partial<Proposta>) => {
    setState((prev) => ({
      ...prev,
      propostas: prev.propostas.map((p) => (p.id === id ? { ...p, ...prop } : p)),
    }));
  };

  const addProjeto = (proj: Omit<Projeto, "id">) => {
    const newProj: Projeto = { ...proj, id: `PR${Date.now()}` };
    setState((prev) => ({ ...prev, projetos: [...prev.projetos, newProj] }));
  };

  const updateProjeto = (id: string, proj: Partial<Projeto>) => {
    setState((prev) => ({
      ...prev,
      projetos: prev.projetos.map((p) => (p.id === id ? { ...p, ...proj } : p)),
    }));
  };

  const addChamado = (ch: Omit<Chamado, "id" | "numero">) => {
    const count = state.chamados.length + 1;
    const newCh: Chamado = {
      ...ch,
      id: `CH${Date.now()}`,
      numero: `CH-2025-${String(count).padStart(3, "0")}`,
    };
    setState((prev) => ({ ...prev, chamados: [...prev.chamados, newCh] }));
  };

  const updateChamado = (id: string, ch: Partial<Chamado>) => {
    setState((prev) => ({
      ...prev,
      chamados: prev.chamados.map((c) => (c.id === id ? { ...c, ...ch } : c)),
    }));
  };

  const addCobranca = (cob: Omit<Cobranca, "id" | "numero">) => {
    const count = state.cobrancas.length + 1;
    const newCob: Cobranca = {
      ...cob,
      id: `COB${Date.now()}`,
      numero: `COB-2025-${String(count).padStart(3, "0")}`,
    };
    setState((prev) => ({ ...prev, cobrancas: [...prev.cobrancas, newCob] }));
  };

  const updateCobranca = (id: string, cob: Partial<Cobranca>) => {
    setState((prev) => ({
      ...prev,
      cobrancas: prev.cobrancas.map((c) => (c.id === id ? { ...c, ...cob } : c)),
    }));
  };

  const deleteCobranca = (id: string) => {
    setState((prev) => ({ ...prev, cobrancas: prev.cobrancas.filter((c) => c.id !== id) }));
  };

  const gerarCobrancasAutomaticas = (params: {
    tipo: "Financiamento" | "Geração Compartilhada";
    orcamentoId?: string;
    clienteId?: string;
    valorMensal?: number;
    diaVencimento: number;
    dataInicio: string;
    dataFim?: string;
  }) => {
    const cobrancasGeradas: Cobranca[] = [];
    const dataInicial = new Date(params.dataInicio);

    if (params.tipo === "Financiamento" && params.orcamentoId) {
      const orcamento = state.orcamentos.find((o) => o.id === params.orcamentoId);
      if (!orcamento) return;

      const numParcelas = 60; // default, pode vir do orçamento
      const valorParcela = orcamento.total / numParcelas;

      for (let i = 0; i < numParcelas; i++) {
        const vencimento = new Date(dataInicial);
        vencimento.setMonth(vencimento.getMonth() + i);
        vencimento.setDate(params.diaVencimento);

        cobrancasGeradas.push({
          id: `COB${Date.now()}_${i}`,
          numero: `COB-2025-${String(state.cobrancas.length + i + 1).padStart(3, "0")}`,
          tipo: "Financiamento",
          clienteId: orcamento.cliente,
          clienteNome: orcamento.cliente,
          orcamentoId: orcamento.id,
          valor: valorParcela,
          vencimento: vencimento.toISOString().split("T")[0],
          status: "A Gerar",
          parcela: `${i + 1}/${numParcelas}`,
          parcelaNumero: i + 1,
          parcelaTotal: numParcelas,
          dataEmissao: new Date().toISOString().split("T")[0],
          responsavel: orcamento.dono,
          historicoStatus: [
            {
              status: "A Gerar",
              data: new Date().toISOString(),
              usuario: "Sistema",
              obs: "Gerado automaticamente",
            },
          ],
        });
      }
    } else if (params.tipo === "Geração Compartilhada" && params.clienteId && params.valorMensal) {
      const cliente = state.clientes.find((c) => c.id === params.clienteId);
      if (!cliente) return;

      const dataFim = params.dataFim ? new Date(params.dataFim) : new Date(dataInicial.getFullYear() + 1, dataInicial.getMonth(), dataInicial.getDate());
      const meses = Math.ceil((dataFim.getTime() - dataInicial.getTime()) / (1000 * 60 * 60 * 24 * 30));

      for (let i = 0; i < meses; i++) {
        const vencimento = new Date(dataInicial);
        vencimento.setMonth(vencimento.getMonth() + i);
        vencimento.setDate(params.diaVencimento);

        cobrancasGeradas.push({
          id: `COB${Date.now()}_${i}`,
          numero: `COB-2025-${String(state.cobrancas.length + i + 1).padStart(3, "0")}`,
          tipo: "Geração Compartilhada",
          clienteId: cliente.id,
          clienteNome: cliente.nome,
          valor: params.valorMensal,
          vencimento: vencimento.toISOString().split("T")[0],
          status: "A Gerar",
          dataEmissao: new Date().toISOString().split("T")[0],
          responsavel: state.userProfile.nome,
          historicoStatus: [
            {
              status: "A Gerar",
              data: new Date().toISOString(),
              usuario: "Sistema",
              obs: "Gerado automaticamente",
            },
          ],
        });
      }
    }

    setState((prev) => ({ ...prev, cobrancas: [...prev.cobrancas, ...cobrancasGeradas] }));
  };

  const updateParametros = (params: Partial<Parametros>) => {
    setState((prev) => ({ ...prev, parametros: { ...prev.parametros, ...params } }));
  };

  const reloadSeed = () => {
    setState(generateSeed());
  };

  const addUsuario = (usuario: Omit<Usuario, "id" | "dataCadastro">) => {
    const newUsuario: Usuario = {
      ...usuario,
      id: `U${Date.now()}`,
      dataCadastro: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, usuarios: [...prev.usuarios, newUsuario] }));
  };

  const updateUsuario = (id: string, usuario: Partial<Usuario>) => {
    setState((prev) => ({
      ...prev,
      usuarios: prev.usuarios.map((u) => (u.id === id ? { ...u, ...usuario } : u)),
    }));
  };

  const deleteUsuario = (id: string) => {
    setState((prev) => ({ ...prev, usuarios: prev.usuarios.filter((u) => u.id !== id) }));
  };

  const login = (email: string, senha: string): boolean => {
    const usuario = state.usuarios.find((u) => u.email === email && u.senha === senha && u.ativo);
    if (usuario) {
      setState((prev) => ({ ...prev, usuarioLogado: usuario }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState((prev) => ({ ...prev, usuarioLogado: null }));
  };

  const checkPermissao = (modulo: string, acao: "criar" | "editar" | "excluir" | "visualizar"): boolean => {
    if (!state.usuarioLogado) return false;
    if (state.usuarioLogado.perfil === "admin") return true;
    const perm = state.usuarioLogado.permissoes.find((p) => p.modulo === modulo);
    return perm ? perm[acao] : false;
  };

  const getVendedoresDoGestor = (gestorId: string): Usuario[] => {
    return state.usuarios.filter((u) => u.gestorId === gestorId);
  };

  // Fase 10A - Gestão de Faturas
  const addTitularEnergia = (titular: Omit<TitularEnergia, "id" | "dataCadastro" | "usuarioId">): string => {
    const id = `TIT${Date.now()}`;
    const newTitular: TitularEnergia = {
      ...titular,
      id,
      dataCadastro: new Date().toISOString(),
      usuarioId: state.usuarioLogado?.id || "U001",
    };
    setState((prev) => ({ ...prev, titularesEnergia: [...prev.titularesEnergia, newTitular] }));
    return id;
  };

  const updateTitularEnergia = (id: string, titular: Partial<TitularEnergia>) => {
    setState((prev) => ({
      ...prev,
      titularesEnergia: prev.titularesEnergia.map((t) => (t.id === id ? { ...t, ...titular } : t)),
    }));
  };

  const deleteTitularEnergia = (id: string) => {
    setState((prev) => ({ ...prev, titularesEnergia: prev.titularesEnergia.filter((t) => t.id !== id) }));
  };

  const addUnidadeConsumidora = (uc: Omit<UnidadeConsumidora, "id" | "dataCadastro" | "usuarioId">): string => {
    const id = `UC${Date.now()}`;
    const newUC: UnidadeConsumidora = {
      ...uc,
      id,
      dataCadastro: new Date().toISOString(),
      usuarioId: state.usuarioLogado?.id || "U001",
    };
    setState((prev) => ({ ...prev, unidadesConsumidoras: [...prev.unidadesConsumidoras, newUC] }));
    return id;
  };

  const updateUnidadeConsumidora = (id: string, uc: Partial<UnidadeConsumidora>) => {
    setState((prev) => ({
      ...prev,
      unidadesConsumidoras: prev.unidadesConsumidoras.map((u) => (u.id === id ? { ...u, ...uc } : u)),
    }));
  };

  const deleteUnidadeConsumidora = (id: string) => {
    setState((prev) => ({ ...prev, unidadesConsumidoras: prev.unidadesConsumidoras.filter((u) => u.id !== id) }));
  };

  const addVinculoCompensacao = (vinculo: Omit<VinculoCompensacao, "id" | "dataCriacao">): string => {
    const id = `VINC${Date.now()}`;
    const newVinculo: VinculoCompensacao = {
      ...vinculo,
      id,
      dataCriacao: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, vinculosCompensacao: [...prev.vinculosCompensacao, newVinculo] }));
    return id;
  };

  const updateVinculoCompensacao = (id: string, vinculo: Partial<VinculoCompensacao>) => {
    setState((prev) => ({
      ...prev,
      vinculosCompensacao: prev.vinculosCompensacao.map((v) => (v.id === id ? { ...v, ...vinculo } : v)),
    }));
  };

  const deleteVinculoCompensacao = (id: string) => {
    setState((prev) => ({ ...prev, vinculosCompensacao: prev.vinculosCompensacao.filter((v) => v.id !== id) }));
  };

  const getVinculosPorUG = (ugiId: string): VinculoCompensacao[] => {
    return state.vinculosCompensacao.filter((v) => v.ugiId === ugiId && v.ativo);
  };

  const getVinculosPorUCB = (ucbId: string): VinculoCompensacao[] => {
    return state.vinculosCompensacao.filter((v) => v.ucbId === ucbId && v.ativo);
  };

  const addSessaoAutenticacao = (sessao: Omit<SessaoAutenticacao, "id" | "dataHora">): string => {
    const id = `SESS${Date.now()}`;
    const newSessao: SessaoAutenticacao = {
      ...sessao,
      id,
      dataHora: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, sessoesAutenticacao: [...prev.sessoesAutenticacao, newSessao] }));
    return id;
  };

  const updateSessaoAutenticacao = (id: string, sessao: Partial<SessaoAutenticacao>) => {
    setState((prev) => ({
      ...prev,
      sessoesAutenticacao: prev.sessoesAutenticacao.map((s) => (s.id === id ? { ...s, ...sessao } : s)),
    }));
  };

  const addProcessamentoFatura = (proc: Omit<ProcessamentoFatura, "id">): string => {
    const id = `PROC${Date.now()}`;
    const newProc: ProcessamentoFatura = {
      ...proc,
      id,
    };
    setState((prev) => ({ ...prev, processamentosFaturas: [...prev.processamentosFaturas, newProc] }));
    return id;
  };

  const updateProcessamentoFatura = (id: string, proc: Partial<ProcessamentoFatura>) => {
    setState((prev) => ({
      ...prev,
      processamentosFaturas: prev.processamentosFaturas.map((p) => (p.id === id ? { ...p, ...proc } : p)),
    }));
  };

  const calcularCobrancasGC = (processamentoId: string) => {
    // Função simulada - na implementação real, processaria as faturas e geraria cobranças
    const cobrancasGeradas: Cobranca[] = [
      {
        id: `COB${Date.now()}_1`,
        numero: `COB-GC-${String(state.cobrancas.length + 1).padStart(3, "0")}`,
        tipo: "Geração Compartilhada",
        clienteId: "C001",
        clienteNome: "Cliente Exemplo",
        valor: 450,
        vencimento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "Pendente Aprovação",
        dataEmissao: new Date().toISOString().split("T")[0],
        responsavel: state.usuarioLogado?.nome || "Sistema",
        historicoStatus: [
          {
            status: "Pendente Aprovação",
            data: new Date().toISOString(),
            usuario: "Sistema",
            obs: "Gerado automaticamente via processamento de faturas",
          },
        ],
      },
    ];
    
    setState((prev) => ({ ...prev, cobrancas: [...prev.cobrancas, ...cobrancasGeradas] }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        addLead,
        updateLead,
        deleteLead,
        addCliente,
        updateCliente,
        deleteCliente,
        addEquipamento,
        updateEquipamento,
        deleteEquipamento,
        addSimulacao,
        updateSimulacao,
        addOrcamento,
        updateOrcamento,
        deleteOrcamento,
        addProposta,
        updateProposta,
        addProjeto,
        updateProjeto,
        addChamado,
        updateChamado,
        addCobranca,
        updateCobranca,
        deleteCobranca,
        gerarCobrancasAutomaticas,
        updateParametros,
        reloadSeed,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        login,
        logout,
        checkPermissao,
        getVendedoresDoGestor,
        getPermissoesDefault,
        // Fase 10A
        addTitularEnergia,
        updateTitularEnergia,
        deleteTitularEnergia,
        addUnidadeConsumidora,
        updateUnidadeConsumidora,
        deleteUnidadeConsumidora,
        addVinculoCompensacao,
        updateVinculoCompensacao,
        deleteVinculoCompensacao,
        getVinculosPorUG,
        getVinculosPorUCB,
        addSessaoAutenticacao,
        updateSessaoAutenticacao,
        addProcessamentoFatura,
        updateProcessamentoFatura,
        calcularCobrancasGC,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
