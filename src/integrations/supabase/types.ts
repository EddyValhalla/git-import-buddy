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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          agendado_por_ia: boolean | null
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string | null
          data_hora_fim: string | null
          data_hora_inicio: string
          data_retorno: string | null
          duracao_minutos: number | null
          funcionario_id: string | null
          id: string
          procedimento_id: string | null
          procedimento_nome: string | null
          status_agenda: string | null
          status_kanban: string | null
          tipo_atendimento: string | null
        }
        Insert: {
          agendado_por_ia?: boolean | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data_hora_fim?: string | null
          data_hora_inicio: string
          data_retorno?: string | null
          duracao_minutos?: number | null
          funcionario_id?: string | null
          id?: string
          procedimento_id?: string | null
          procedimento_nome?: string | null
          status_agenda?: string | null
          status_kanban?: string | null
          tipo_atendimento?: string | null
        }
        Update: {
          agendado_por_ia?: boolean | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data_hora_fim?: string | null
          data_hora_inicio?: string
          data_retorno?: string | null
          duracao_minutos?: number | null
          funcionario_id?: string | null
          id?: string
          procedimento_id?: string | null
          procedimento_nome?: string | null
          status_agenda?: string | null
          status_kanban?: string | null
          tipo_atendimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_aniversariantes_mes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_frios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          aguardando_humano: boolean | null
          atendimento_ia: boolean | null
          consentimento_marketing: boolean | null
          created_at: string | null
          data_nascimento: string | null
          id: string
          nome: string
          origem: string | null
          setor: string | null
          telefone: string
          temperatura: string | null
          ultima_interacao: string | null
          updated_at: string | null
        }
        Insert: {
          aguardando_humano?: boolean | null
          atendimento_ia?: boolean | null
          consentimento_marketing?: boolean | null
          created_at?: string | null
          data_nascimento?: string | null
          id?: string
          nome: string
          origem?: string | null
          setor?: string | null
          telefone: string
          temperatura?: string | null
          ultima_interacao?: string | null
          updated_at?: string | null
        }
        Update: {
          aguardando_humano?: boolean | null
          atendimento_ia?: boolean | null
          consentimento_marketing?: boolean | null
          created_at?: string | null
          data_nascimento?: string | null
          id?: string
          nome?: string
          origem?: string | null
          setor?: string | null
          telefone?: string
          temperatura?: string | null
          ultima_interacao?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fotos_paciente: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          id: string
          tipo: string
          url_foto: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          tipo: string
          url_foto: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          tipo?: string
          url_foto?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_paciente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_paciente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_aniversariantes_mes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_paciente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_frios"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean | null
          auth_user_id: string | null
          id: string
          nome: string
          procedimentos_habilitados: string[] | null
          role: string
          status: string | null
        }
        Insert: {
          ativo?: boolean | null
          auth_user_id?: string | null
          id?: string
          nome: string
          procedimentos_habilitados?: string[] | null
          role: string
          status?: string | null
        }
        Update: {
          ativo?: boolean | null
          auth_user_id?: string | null
          id?: string
          nome?: string
          procedimentos_habilitados?: string[] | null
          role?: string
          status?: string | null
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          cliente_id: string | null
          id: string
          remetente: string
          texto: string
          timestamp: string | null
        }
        Insert: {
          cliente_id?: string | null
          id?: string
          remetente: string
          texto: string
          timestamp?: string | null
        }
        Update: {
          cliente_id?: string | null
          id?: string
          remetente?: string
          texto?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_aniversariantes_mes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_frios"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimentos: {
        Row: {
          ativo: boolean | null
          comissao_tipo: string | null
          comissao_valor: number | null
          duracao_minutos: number | null
          id: string
          nome: string
          status: string | null
          valor_sugerido: number | null
        }
        Insert: {
          ativo?: boolean | null
          comissao_tipo?: string | null
          comissao_valor?: number | null
          duracao_minutos?: number | null
          id?: string
          nome: string
          status?: string | null
          valor_sugerido?: number | null
        }
        Update: {
          ativo?: boolean | null
          comissao_tipo?: string | null
          comissao_valor?: number | null
          duracao_minutos?: number | null
          id?: string
          nome?: string
          status?: string | null
          valor_sugerido?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nome?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      prontuarios: {
        Row: {
          alergias: string | null
          cirurgias: string | null
          cliente_id: string | null
          created_at: string | null
          gestante: boolean | null
          id: string
          medicamentos: string | null
          observacoes: string | null
          updated_at: string | null
        }
        Insert: {
          alergias?: string | null
          cirurgias?: string | null
          cliente_id?: string | null
          created_at?: string | null
          gestante?: boolean | null
          id?: string
          medicamentos?: string | null
          observacoes?: string | null
          updated_at?: string | null
        }
        Update: {
          alergias?: string | null
          cirurgias?: string | null
          cliente_id?: string | null
          created_at?: string | null
          gestante?: boolean | null
          id?: string
          medicamentos?: string | null
          observacoes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prontuarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_aniversariantes_mes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_frios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_agendamentos_hoje: {
        Row: {
          agendado_por_ia: boolean | null
          cliente_id: string | null
          cliente_nome: string | null
          cliente_nome_real: string | null
          created_at: string | null
          data_hora_fim: string | null
          data_hora_inicio: string | null
          data_retorno: string | null
          duracao_minutos: number | null
          funcionario_id: string | null
          id: string | null
          procedimento_id: string | null
          procedimento_nome: string | null
          procedimento_nome_real: string | null
          status_agenda: string | null
          status_kanban: string | null
          telefone: string | null
          tipo_atendimento: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_aniversariantes_mes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_frios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_aniversariantes_mes: {
        Row: {
          data_nascimento: string | null
          id: string | null
          nome: string | null
          telefone: string | null
        }
        Insert: {
          data_nascimento?: string | null
          id?: string | null
          nome?: string | null
          telefone?: string | null
        }
        Update: {
          data_nascimento?: string | null
          id?: string | null
          nome?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      vw_leads_frios: {
        Row: {
          created_at: string | null
          id: string | null
          nome: string | null
          origem: string | null
          telefone: string | null
          ultima_interacao: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          nome?: string | null
          origem?: string | null
          telefone?: string | null
          ultima_interacao?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          nome?: string | null
          origem?: string | null
          telefone?: string | null
          ultima_interacao?: string | null
        }
        Relationships: []
      }
      vw_resumo_mensal: {
        Row: {
          cancelados: number | null
          clientes_unicos: number | null
          compareceram: number | null
          mes: string | null
          nao_compareceram: number | null
          total_agendamentos: number | null
        }
        Relationships: []
      }
      vw_retornos_proximos: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          data_retorno: string | null
          id: string | null
          procedimento_nome: string | null
          telefone: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_aniversariantes_mes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_frios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "atendente"
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
      app_role: ["admin", "atendente"],
    },
  },
} as const
