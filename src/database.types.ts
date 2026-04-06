export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          created_by_user_id: string
          expires_at: string | null
          id: string
          key_hash: string
          last_used_at: string | null
          name: string
          prefix: string
          revoked_at: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          expires_at?: string | null
          id?: string
          key_hash: string
          last_used_at?: string | null
          name: string
          prefix: string
          revoked_at?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          last_used_at?: string | null
          name?: string
          prefix?: string
          revoked_at?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          access_count: number
          created_at: string
          created_by: string | null
          id: string
          importance_score: number
          label: string
          last_accessed_at: string
          name: string
          properties: Json
          superseded_by: string | null
          type: string
          updated_at: string
          valid_from: string
          valid_to: string | null
          visibility: string
          workspace_id: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          importance_score?: number
          label: string
          last_accessed_at?: string
          name: string
          properties?: Json
          superseded_by?: string | null
          type: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          visibility?: string
          workspace_id: string
        }
        Update: {
          access_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          importance_score?: number
          label?: string
          last_accessed_at?: string
          name?: string
          properties?: Json
          superseded_by?: string | null
          type?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          visibility?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          added_at: string
          added_by: string | null
          content: string
          content_tsv: unknown
          entity_id: string
          id: string
          source_session: string | null
          superseded_by: string | null
          valid_from: string
          valid_to: string | null
          workspace_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          content: string
          content_tsv?: unknown
          entity_id: string
          id?: string
          source_session?: string | null
          superseded_by?: string | null
          valid_from?: string
          valid_to?: string | null
          workspace_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          content?: string
          content_tsv?: unknown
          entity_id?: string
          id?: string
          source_session?: string | null
          superseded_by?: string | null
          valid_from?: string
          valid_to?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observations_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_source_session_fkey"
            columns: ["source_session"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      otel_events: {
        Row: {
          body: string | null
          created_at: string | null
          event_attrs: Json | null
          event_name: string
          event_type: string
          id: string
          metric_value: number | null
          resource_attrs: Json | null
          session_id: string | null
          severity: string | null
          timestamp_at: string
          timestamp_ns: number
          workspace_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          event_attrs?: Json | null
          event_name: string
          event_type: string
          id?: string
          metric_value?: number | null
          resource_attrs?: Json | null
          session_id?: string | null
          severity?: string | null
          timestamp_at: string
          timestamp_ns: number
          workspace_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          event_attrs?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          metric_value?: number | null
          resource_attrs?: Json | null
          session_id?: string | null
          severity?: string | null
          timestamp_at?: string
          timestamp_ns?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "otel_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_workspace_id: string | null
          display_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_workspace_id?: string | null
          display_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_workspace_id?: string | null
          display_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_workspace_id_fkey"
            columns: ["default_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_audits: {
        Row: {
          approved: boolean
          commit_message: string
          created_at: string
          diff_hash: string
          feedback: string | null
          id: string
          session_id: string
        }
        Insert: {
          approved: boolean
          commit_message: string
          created_at?: string
          diff_hash: string
          feedback?: string | null
          id?: string
          session_id: string
        }
        Update: {
          approved?: boolean
          commit_message?: string
          created_at?: string
          diff_hash?: string
          feedback?: string | null
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_audits_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "protocol_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_history: {
        Row: {
          created_at: string
          event_json: Json
          event_type: string
          id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          event_json: Json
          event_type: string
          id?: string
          session_id: string
        }
        Update: {
          created_at?: string
          event_json?: Json
          event_type?: string
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "protocol_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_scope: {
        Row: {
          created_at: string
          file_path: string
          id: string
          session_id: string
          source: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          session_id: string
          source?: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          session_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_scope_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "protocol_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          protocol: string
          state_json: Json
          status: string
          workspace_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          protocol: string
          state_json?: Json
          status?: string
          workspace_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          protocol?: string
          state_json?: Json
          status?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      protocol_visas: {
        Row: {
          anti_pattern_acknowledged: boolean
          created_at: string
          file_path: string
          id: string
          justification: string
          session_id: string
        }
        Insert: {
          anti_pattern_acknowledged?: boolean
          created_at?: string
          file_path: string
          id?: string
          justification: string
          session_id: string
        }
        Update: {
          anti_pattern_acknowledged?: boolean
          created_at?: string
          file_path?: string
          id?: string
          justification?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_visas_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "protocol_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      relations: {
        Row: {
          created_at: string
          created_by: string | null
          from_id: string
          id: string
          properties: Json
          to_id: string
          type: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_id: string
          id?: string
          properties?: Json
          to_id: string
          type: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_id?: string
          id?: string
          properties?: Json
          to_id?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relations_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relations_to_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      runs: {
        Row: {
          ended_at: string | null
          id: string
          mcp_session_id: string | null
          otel_session_id: string | null
          session_id: string
          started_at: string
          workspace_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          mcp_session_id?: string | null
          otel_session_id?: string | null
          session_id: string
          started_at?: string
          workspace_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          mcp_session_id?: string | null
          otel_session_id?: string | null
          session_id?: string
          started_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          branch_count: number
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          mcp_session_id: string | null
          last_accessed_at: string
          status: string
          tags: string[]
          thought_count: number
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          branch_count?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          mcp_session_id?: string | null
          last_accessed_at?: string
          status?: string
          tags?: string[]
          thought_count?: number
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          branch_count?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          mcp_session_id?: string | null
          last_accessed_at?: string
          status?: string
          tags?: string[]
          thought_count?: number
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts: {
        Row: {
          action_result: Json | null
          agent_id: string | null
          agent_name: string | null
          assumption_change: Json | null
          beliefs: Json | null
          branch_from_thought: number | null
          branch_id: string | null
          confidence: string | null
          content_hash: string | null
          context_data: Json | null
          critique: Json | null
          id: string
          is_revision: boolean | null
          needs_more_thoughts: boolean | null
          next_thought_needed: boolean
          options: Json | null
          parent_hash: string | null
          progress_data: Json | null
          receipt_data: Json | null
          revises_thought: number | null
          session_id: string
          thought: string
          thought_number: number
          thought_type: string
          timestamp: string
          total_thoughts: number
          workspace_id: string
        }
        Insert: {
          action_result?: Json | null
          agent_id?: string | null
          agent_name?: string | null
          assumption_change?: Json | null
          beliefs?: Json | null
          branch_from_thought?: number | null
          branch_id?: string | null
          confidence?: string | null
          content_hash?: string | null
          context_data?: Json | null
          critique?: Json | null
          id?: string
          is_revision?: boolean | null
          needs_more_thoughts?: boolean | null
          next_thought_needed: boolean
          options?: Json | null
          parent_hash?: string | null
          progress_data?: Json | null
          receipt_data?: Json | null
          revises_thought?: number | null
          session_id: string
          thought: string
          thought_number: number
          thought_type?: string
          timestamp?: string
          total_thoughts: number
          workspace_id: string
        }
        Update: {
          action_result?: Json | null
          agent_id?: string | null
          agent_name?: string | null
          assumption_change?: Json | null
          beliefs?: Json | null
          branch_from_thought?: number | null
          branch_id?: string | null
          confidence?: string | null
          content_hash?: string | null
          context_data?: Json | null
          critique?: Json | null
          id?: string
          is_revision?: boolean | null
          needs_more_thoughts?: boolean | null
          next_thought_needed?: boolean
          options?: Json | null
          parent_hash?: string | null
          progress_data?: Json | null
          receipt_data?: Json | null
          revises_thought?: number | null
          session_id?: string
          thought?: string
          thought_number?: number
          thought_type?: string
          timestamp?: string
          total_thoughts?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thoughts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thoughts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_memberships: {
        Row: {
          created_at: string
          invited_by_user_id: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          invited_by_user_id?: string | null
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          invited_by_user_id?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          plan_id: string
          slug: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          plan_id?: string
          slug: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          plan_id?: string
          slug?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_protocol_enforcement:
        | { Args: { target_path: string }; Returns: Json }
        | { Args: { target_path: string; ws_id?: string }; Returns: Json }
      is_workspace_member: { Args: { ws_id: string }; Returns: boolean }
      otel_session_cost: {
        Args: { p_session_id?: string; p_workspace_id: string }
        Returns: {
          data_points: number
          model: string
          total_cost: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
