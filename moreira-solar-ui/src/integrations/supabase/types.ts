export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cpf_cnpj: string | null
          created_at: string | null
          data_cadastro: string | null
          email: string | null
          estado: string | null
          estado_civil: string | null
          fantasia: string | null
          id: string
          nome: string
          numero: string | null
          observacoes: string | null
          profissao: string | null
          renda: number | null
          rua: string | null
          telefone: string
          tempo_profissao: string | null
          tempo_residencia: string | null
          updated_at: string | null
          user_id: string
          vendedor_id: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          data_cadastro?: string | null
          email?: string | null
          estado?: string | null
          estado_civil?: string | null
          fantasia?: string | null
          id?: string
          nome: string
          numero?: string | null
          observacoes?: string | null
          profissao?: string | null
          renda?: number | null
          rua?: string | null
          telefone: string
          tempo_profissao?: string | null
          tempo_residencia?: string | null
          updated_at?: string | null
          user_id: string
          vendedor_id?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          data_cadastro?: string | null
          email?: string | null
          estado?: string | null
          estado_civil?: string | null
          fantasia?: string | null
          id?: string
          nome?: string
          numero?: string | null
          observacoes?: string | null
          profissao?: string | null
          renda?: number | null
          rua?: string | null
          telefone?: string
          tempo_profissao?: string | null
          tempo_residencia?: string | null
          updated_at?: string | null
          user_id?: string
          vendedor_id?: string | null
        }
        Relationships: []
      }
      cobrancas: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string | null
          data_pagamento: string | null
          id: string
          numero: string
          observacoes: string | null
          projeto_id: string | null
          status: string | null
          tipo: string | null
          updated_at: string | null
          user_id: string
          valor: number
          vencimento: string
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          projeto_id?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id: string
          valor: number
          vencimento: string
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          projeto_id?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobrancas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          potencia_w: number | null
          tipo: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          potencia_w?: number | null
          tipo?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          potencia_w?: number | null
          tipo?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      faturas: {
        Row: {
          arquivo_url: string | null
          consumo_kwh: number | null
          created_at: string | null
          credito_anterior_kwh: number | null
          credito_mes_kwh: number | null
          data_processamento: string | null
          geracao_kwh: number | null
          id: string
          mes_referencia: string
          processado: boolean | null
          saldo_kwh: number | null
          unidade_id: string | null
          updated_at: string | null
          user_id: string
          valor_demanda: number | null
          valor_energia: number | null
          valor_total: number | null
        }
        Insert: {
          arquivo_url?: string | null
          consumo_kwh?: number | null
          created_at?: string | null
          credito_anterior_kwh?: number | null
          credito_mes_kwh?: number | null
          data_processamento?: string | null
          geracao_kwh?: number | null
          id?: string
          mes_referencia: string
          processado?: boolean | null
          saldo_kwh?: number | null
          unidade_id?: string | null
          updated_at?: string | null
          user_id: string
          valor_demanda?: number | null
          valor_energia?: number | null
          valor_total?: number | null
        }
        Update: {
          arquivo_url?: string | null
          consumo_kwh?: number | null
          created_at?: string | null
          credito_anterior_kwh?: number | null
          credito_mes_kwh?: number | null
          data_processamento?: string | null
          geracao_kwh?: number | null
          id?: string
          mes_referencia?: string
          processado?: boolean | null
          saldo_kwh?: number | null
          unidade_id?: string | null
          updated_at?: string | null
          user_id?: string
          valor_demanda?: number | null
          valor_energia?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faturas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades_consumidoras"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cidade: string | null
          cliente: string
          created_at: string | null
          data: string | null
          dono_id: string | null
          email: string | null
          fonte: string | null
          id: string
          status: string | null
          telefone: string
          uf: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cidade?: string | null
          cliente: string
          created_at?: string | null
          data?: string | null
          dono_id?: string | null
          email?: string | null
          fonte?: string | null
          id?: string
          status?: string | null
          telefone: string
          uf?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cidade?: string | null
          cliente?: string
          created_at?: string | null
          data?: string | null
          dono_id?: string | null
          email?: string | null
          fonte?: string | null
          id?: string
          status?: string | null
          telefone?: string
          uf?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      logs_integracoes: {
        Row: {
          created_at: string | null
          data: string | null
          id: string
          mensagem: string | null
          origem: string
          payload: Json | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          id?: string
          mensagem?: string | null
          origem: string
          payload?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          id?: string
          mensagem?: string | null
          origem?: string
          payload?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string | null
          custo_estrutura_solo: number | null
          data: string | null
          economia_mensal: number | null
          economia_percentual: number | null
          estrutura_solo: boolean | null
          geracao_kwh: number | null
          id: string
          inversor_kw: number | null
          modelo_modulo: string | null
          numero: string
          parcela_selecionada: number | null
          payback_meses: number | null
          potencia_modulo_w: number | null
          prestacao: number | null
          qtd_modulos: number | null
          status: string | null
          updated_at: string | null
          user_id: string
          validade: string | null
          valor_base: number | null
          valor_total: number | null
          vendedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          custo_estrutura_solo?: number | null
          data?: string | null
          economia_mensal?: number | null
          economia_percentual?: number | null
          estrutura_solo?: boolean | null
          geracao_kwh?: number | null
          id?: string
          inversor_kw?: number | null
          modelo_modulo?: string | null
          numero: string
          parcela_selecionada?: number | null
          payback_meses?: number | null
          potencia_modulo_w?: number | null
          prestacao?: number | null
          qtd_modulos?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          validade?: string | null
          valor_base?: number | null
          valor_total?: number | null
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          custo_estrutura_solo?: number | null
          data?: string | null
          economia_mensal?: number | null
          economia_percentual?: number | null
          estrutura_solo?: boolean | null
          geracao_kwh?: number | null
          id?: string
          inversor_kw?: number | null
          modelo_modulo?: string | null
          numero?: string
          parcela_selecionada?: number | null
          payback_meses?: number | null
          potencia_modulo_w?: number | null
          prestacao?: number | null
          qtd_modulos?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          validade?: string | null
          valor_base?: number | null
          valor_total?: number | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros: {
        Row: {
          chave: string
          descricao: string | null
          id: string
          updated_at: string | null
          valor: Json
        }
        Insert: {
          chave: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor: Json
        }
        Update: {
          chave?: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: Json
        }
        Relationships: []
      }
      permissoes: {
        Row: {
          created_at: string | null
          criar: boolean | null
          editar: boolean | null
          excluir: boolean | null
          id: string
          modulo: string
          user_id: string | null
          visualizar: boolean | null
        }
        Insert: {
          created_at?: string | null
          criar?: boolean | null
          editar?: boolean | null
          excluir?: boolean | null
          id?: string
          modulo: string
          user_id?: string | null
          visualizar?: boolean | null
        }
        Update: {
          created_at?: string | null
          criar?: boolean | null
          editar?: boolean | null
          excluir?: boolean | null
          id?: string
          modulo?: string
          user_id?: string | null
          visualizar?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean | null
          avatar: string | null
          created_at: string | null
          data_cadastro: string | null
          email: string | null
          gestor_id: string | null
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["app_role"]
          ultimo_acesso: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar?: string | null
          created_at?: string | null
          data_cadastro?: string | null
          email?: string | null
          gestor_id?: string | null
          id: string
          nome: string
          perfil?: Database["public"]["Enums"]["app_role"]
          ultimo_acesso?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar?: string | null
          created_at?: string | null
          data_cadastro?: string | null
          email?: string | null
          gestor_id?: string | null
          id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["app_role"]
          ultimo_acesso?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string | null
          data_conclusao_prevista: string | null
          data_conclusao_real: string | null
          data_inicio: string | null
          id: string
          nome: string
          numero: string
          observacoes: string | null
          progresso: number | null
          proposta_id: string | null
          responsavel_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          valor_total: number | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data_conclusao_prevista?: string | null
          data_conclusao_real?: string | null
          data_inicio?: string | null
          id?: string
          nome: string
          numero: string
          observacoes?: string | null
          progresso?: number | null
          proposta_id?: string | null
          responsavel_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data_conclusao_prevista?: string | null
          data_conclusao_real?: string | null
          data_inicio?: string | null
          id?: string
          nome?: string
          numero?: string
          observacoes?: string | null
          progresso?: number | null
          proposta_id?: string | null
          responsavel_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string | null
          data: string | null
          entrada: number | null
          id: string
          numero: string
          observacoes: string | null
          orcamento_id: string | null
          parcelas: number | null
          status: string | null
          updated_at: string | null
          user_id: string
          validade: string | null
          valor_parcela: number | null
          valor_total: number | null
          vendedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data?: string | null
          entrada?: number | null
          id?: string
          numero: string
          observacoes?: string | null
          orcamento_id?: string | null
          parcelas?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          validade?: string | null
          valor_parcela?: number | null
          valor_total?: number | null
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data?: string | null
          entrada?: number | null
          id?: string
          numero?: string
          observacoes?: string | null
          orcamento_id?: string | null
          parcelas?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          validade?: string | null
          valor_parcela?: number | null
          valor_total?: number | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      titulares_energia: {
        Row: {
          cpf_cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      unidades_consumidoras: {
        Row: {
          ativo: boolean | null
          cidade: string | null
          classe: string | null
          cliente_id: string | null
          created_at: string | null
          distribuidora: string | null
          grupo: string | null
          id: string
          modalidade: string | null
          numero_instalacao: string
          projeto_id: string | null
          titular_id: string | null
          uf: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          cidade?: string | null
          classe?: string | null
          cliente_id?: string | null
          created_at?: string | null
          distribuidora?: string | null
          grupo?: string | null
          id?: string
          modalidade?: string | null
          numero_instalacao: string
          projeto_id?: string | null
          titular_id?: string | null
          uf?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          cidade?: string | null
          classe?: string | null
          cliente_id?: string | null
          created_at?: string | null
          distribuidora?: string | null
          grupo?: string | null
          id?: string
          modalidade?: string | null
          numero_instalacao?: string
          projeto_id?: string | null
          titular_id?: string | null
          uf?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_consumidoras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_consumidoras_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_consumidoras_titular_id_fkey"
            columns: ["titular_id"]
            isOneToOne: false
            referencedRelation: "titulares_energia"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_user_data: {
        Args: { _target_user_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "vendedor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gestor", "vendedor"],
    },
  },
} as const
