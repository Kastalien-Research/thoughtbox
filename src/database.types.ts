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
      branches: {
        Row: {
          branch_from_thought: number
          branch_id: string
          completed_at: string | null
          created_by: string | null
          description: string | null
          id: string
          merge_thought_number: number | null
          session_id: string
          spawned_at: string
          status: string
          workspace_id: string
        }
        Insert: {
          branch_from_thought: number
          branch_id: string
          completed_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          merge_thought_number?: number | null
          session_id: string
          spawned_at?: string
          status?: string
          workspace_id: string
        }
        Update: {
          branch_from_thought?: number
          branch_id?: string
          completed_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          merge_thought_number?: number | null
          session_id?: string
          spawned_at?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_edges: {
        Row: {
          created_at: string
          created_by: string
          from_claim: string
          kind: string
          tenant_workspace_id: string
          to_claim: string
        }
        Insert: {
          created_at?: string
          created_by: string
          from_claim: string
          kind: string
          tenant_workspace_id: string
          to_claim: string
        }
        Update: {
          created_at?: string
          created_by?: string
          from_claim?: string
          kind?: string
          tenant_workspace_id?: string
          to_claim?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_edges_from_claim_fkey"
            columns: ["from_claim"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_edges_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_edges_to_claim_fkey"
            columns: ["to_claim"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_subscriptions: {
        Row: {
          claim_id: string
          created_at: string
          created_by: string
          subscriber: string
          tenant_workspace_id: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          created_by: string
          subscriber: string
          tenant_workspace_id: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          created_by?: string
          subscriber?: string
          tenant_workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_subscriptions_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_subscriptions_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          created_at: string
          created_by: string
          evidence_refs: Json
          id: string
          statement: string
          status: string
          status_changed_at: string
          superseded_by: string | null
          tenant_workspace_id: string
          type: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          evidence_refs?: Json
          id: string
          statement: string
          status?: string
          status_changed_at?: string
          superseded_by?: string | null
          tenant_workspace_id: string
          type: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          evidence_refs?: Json
          id?: string
          statement?: string
          status?: string
          status_changed_at?: string
          superseded_by?: string | null
          tenant_workspace_id?: string
          type?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "hub_workspaces"
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
      hub_agents: {
        Row: {
          agent_id: string
          client_info: string | null
          name: string
          profile: string | null
          registered_at: string
          role: string
          user_id: string | null
        }
        Insert: {
          agent_id: string
          client_info?: string | null
          name: string
          profile?: string | null
          registered_at?: string
          role?: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          client_info?: string | null
          name?: string
          profile?: string | null
          registered_at?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      hub_channel_messages: {
        Row: {
          agent_id: string
          channel_id: string
          content: string
          created_at: string
          id: string
          ref: Json | null
          tenant_workspace_id: string
        }
        Insert: {
          agent_id: string
          channel_id: string
          content: string
          created_at?: string
          id: string
          ref?: Json | null
          tenant_workspace_id: string
        }
        Update: {
          agent_id?: string
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          ref?: Json | null
          tenant_workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_channel_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "hub_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_channel_messages_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_channels: {
        Row: {
          id: string
          problem_id: string
          tenant_workspace_id: string
          workspace_id: string
        }
        Insert: {
          id: string
          problem_id: string
          tenant_workspace_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          problem_id?: string
          tenant_workspace_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_channels_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "hub_problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_channels_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "hub_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_consensus_endorsements: {
        Row: {
          agent_id: string
          created_at: string
          marker_id: string
          tenant_workspace_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          marker_id: string
          tenant_workspace_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          marker_id?: string
          tenant_workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_consensus_endorsements_marker_id_fkey"
            columns: ["marker_id"]
            isOneToOne: false
            referencedRelation: "hub_consensus_markers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_consensus_endorsements_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_consensus_markers: {
        Row: {
          branch_id: string | null
          created_at: string
          description: string
          id: string
          name: string
          tenant_workspace_id: string
          thought_ref: number
          workspace_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          description?: string
          id: string
          name: string
          tenant_workspace_id: string
          thought_ref: number
          workspace_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          tenant_workspace_id?: string
          thought_ref?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_consensus_markers_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_consensus_markers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "hub_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_problems: {
        Row: {
          assigned_to: string | null
          branch_from_thought: number | null
          branch_id: string | null
          comments: Json
          created_at: string
          created_by: string
          depends_on: Json
          description: string
          id: string
          parent_id: string | null
          resolution: string | null
          status: string
          tenant_workspace_id: string
          title: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          branch_from_thought?: number | null
          branch_id?: string | null
          comments?: Json
          created_at?: string
          created_by: string
          depends_on?: Json
          description?: string
          id: string
          parent_id?: string | null
          resolution?: string | null
          status?: string
          tenant_workspace_id: string
          title: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          branch_from_thought?: number | null
          branch_id?: string | null
          comments?: Json
          created_at?: string
          created_by?: string
          depends_on?: Json
          description?: string
          id?: string
          parent_id?: string | null
          resolution?: string | null
          status?: string
          tenant_workspace_id?: string
          title?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_problems_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "hub_problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_problems_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_problems_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "hub_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_proposal_reviews: {
        Row: {
          created_at: string
          id: string
          proposal_id: string
          reasoning: string
          reviewer_id: string
          tenant_workspace_id: string
          thought_refs: Json | null
          verdict: string
        }
        Insert: {
          created_at?: string
          id: string
          proposal_id: string
          reasoning?: string
          reviewer_id: string
          tenant_workspace_id: string
          thought_refs?: Json | null
          verdict: string
        }
        Update: {
          created_at?: string
          id?: string
          proposal_id?: string
          reasoning?: string
          reviewer_id?: string
          tenant_workspace_id?: string
          thought_refs?: Json | null
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_proposal_reviews_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "hub_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_proposal_reviews_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_proposals: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          merge_thought_number: number | null
          problem_id: string | null
          source_branch: string
          status: string
          tenant_workspace_id: string
          title: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          id: string
          merge_thought_number?: number | null
          problem_id?: string | null
          source_branch?: string
          status?: string
          tenant_workspace_id: string
          title: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          merge_thought_number?: number | null
          problem_id?: string | null
          source_branch?: string
          status?: string
          tenant_workspace_id?: string
          title?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_proposals_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "hub_problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_proposals_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_proposals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "hub_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_workspaces: {
        Row: {
          agents: Json
          created_at: string
          created_by: string
          description: string
          id: string
          main_session_id: string
          name: string
          tenant_workspace_id: string
          updated_at: string
          version: number
        }
        Insert: {
          agents?: Json
          created_at?: string
          created_by: string
          description?: string
          id: string
          main_session_id?: string
          name: string
          tenant_workspace_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          agents?: Json
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          main_session_id?: string
          name?: string
          tenant_workspace_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "hub_workspaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "hub_agents"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "hub_workspaces_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorization_codes: {
        Row: {
          client_id: string
          code: string
          code_challenge: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          redirect_uri: string
          scopes: string[]
          workspace_id: string
        }
        Insert: {
          client_id: string
          code: string
          code_challenge: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          redirect_uri: string
          scopes?: string[]
          workspace_id: string
        }
        Update: {
          client_id?: string
          code?: string
          code_challenge?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          redirect_uri?: string
          scopes?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorization_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      oauth_clients: {
        Row: {
          client_id: string
          client_id_issued_at: number
          client_secret: string | null
          client_secret_expires_at: number | null
          created_at: string
          metadata: Json
        }
        Insert: {
          client_id: string
          client_id_issued_at?: number
          client_secret?: string | null
          client_secret_expires_at?: number | null
          created_at?: string
          metadata?: Json
        }
        Update: {
          client_id?: string
          client_id_issued_at?: number
          client_secret?: string | null
          client_secret_expires_at?: number | null
          created_at?: string
          metadata?: Json
        }
        Relationships: []
      }
      oauth_refresh_tokens: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string | null
          revoked_at: string | null
          scopes: string[]
          token_hash: string
          workspace_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at?: string | null
          revoked_at?: string | null
          scopes?: string[]
          token_hash: string
          workspace_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string | null
          revoked_at?: string | null
          scopes?: string[]
          token_hash?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_refresh_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["client_id"]
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
      peer_artifacts: {
        Row: {
          byte_size: number
          created_at: string
          id: string
          invocation_id: string | null
          kind: string
          mime_type: string
          name: string
          peer_id: string | null
          preview: Json | null
          retention_expires_at: string | null
          sha256: string
          storage_backend: string
          storage_bucket: string
          storage_path: string
          workspace_id: string
        }
        Insert: {
          byte_size: number
          created_at?: string
          id?: string
          invocation_id?: string | null
          kind: string
          mime_type: string
          name: string
          peer_id?: string | null
          preview?: Json | null
          retention_expires_at?: string | null
          sha256: string
          storage_backend: string
          storage_bucket: string
          storage_path: string
          workspace_id: string
        }
        Update: {
          byte_size?: number
          created_at?: string
          id?: string
          invocation_id?: string | null
          kind?: string
          mime_type?: string
          name?: string
          peer_id?: string | null
          preview?: Json | null
          retention_expires_at?: string | null
          sha256?: string
          storage_backend?: string
          storage_bucket?: string
          storage_path?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_artifacts_invocation_id_fkey"
            columns: ["invocation_id"]
            isOneToOne: false
            referencedRelation: "peer_invocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_artifacts_peer_id_fkey"
            columns: ["peer_id"]
            isOneToOne: false
            referencedRelation: "peer_notebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_artifacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_invocations: {
        Row: {
          args_hash: string
          caller_id: string | null
          caller_type: string
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error: Json | null
          id: string
          manifest_hash: string
          manifest_id: string
          parent_invocation_id: string | null
          peer_id: string
          result: Json | null
          result_hash: string | null
          runtime_instance_id: string | null
          runtime_provider: string
          started_at: string | null
          status: string
          tool_name: string
          workspace_id: string
        }
        Insert: {
          args_hash: string
          caller_id?: string | null
          caller_type?: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: Json | null
          id?: string
          manifest_hash: string
          manifest_id: string
          parent_invocation_id?: string | null
          peer_id: string
          result?: Json | null
          result_hash?: string | null
          runtime_instance_id?: string | null
          runtime_provider: string
          started_at?: string | null
          status: string
          tool_name: string
          workspace_id: string
        }
        Update: {
          args_hash?: string
          caller_id?: string | null
          caller_type?: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: Json | null
          id?: string
          manifest_hash?: string
          manifest_id?: string
          parent_invocation_id?: string | null
          peer_id?: string
          result?: Json | null
          result_hash?: string | null
          runtime_instance_id?: string | null
          runtime_provider?: string
          started_at?: string | null
          status?: string
          tool_name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_invocations_manifest_id_fkey"
            columns: ["manifest_id"]
            isOneToOne: false
            referencedRelation: "peer_manifests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_invocations_parent_invocation_id_fkey"
            columns: ["parent_invocation_id"]
            isOneToOne: false
            referencedRelation: "peer_invocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_invocations_peer_id_fkey"
            columns: ["peer_id"]
            isOneToOne: false
            referencedRelation: "peer_notebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_invocations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_manifests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          compiled_from: Json
          created_at: string
          created_by: string | null
          id: string
          manifest: Json
          manifest_hash: string
          peer_id: string
          schema_version: string
          status: string
          version: number
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          compiled_from: Json
          created_at?: string
          created_by?: string | null
          id?: string
          manifest: Json
          manifest_hash: string
          peer_id: string
          schema_version: string
          status: string
          version: number
          workspace_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          compiled_from?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          manifest?: Json
          manifest_hash?: string
          peer_id?: string
          schema_version?: string
          status?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_manifests_peer_id_fkey"
            columns: ["peer_id"]
            isOneToOne: false
            referencedRelation: "peer_notebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_manifests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_notebooks: {
        Row: {
          active_manifest_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          slug: string
          source_notebook_ref: Json
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active_manifest_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          slug: string
          source_notebook_ref?: Json
          status: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active_manifest_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          slug?: string
          source_notebook_ref?: Json
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_notebooks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_trace_events: {
        Row: {
          attrs: Json
          body: string | null
          event_type: string
          id: string
          invocation_id: string
          seq: number
          severity: string
          timestamp_at: string
          workspace_id: string
        }
        Insert: {
          attrs?: Json
          body?: string | null
          event_type: string
          id?: string
          invocation_id: string
          seq: number
          severity: string
          timestamp_at?: string
          workspace_id: string
        }
        Update: {
          attrs?: Json
          body?: string | null
          event_type?: string
          id?: string
          invocation_id?: string
          seq?: number
          severity?: string
          timestamp_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_trace_events_invocation_id_fkey"
            columns: ["invocation_id"]
            isOneToOne: false
            referencedRelation: "peer_invocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_trace_events_workspace_id_fkey"
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
          workspace_id: string
        }
        Insert: {
          approved: boolean
          commit_message: string
          created_at?: string
          diff_hash: string
          feedback?: string | null
          id?: string
          session_id: string
          workspace_id: string
        }
        Update: {
          approved?: boolean
          commit_message?: string
          created_at?: string
          diff_hash?: string
          feedback?: string | null
          id?: string
          session_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_audits_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "protocol_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_audits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_json: Json
          event_type: string
          id?: string
          session_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_json?: Json
          event_type?: string
          id?: string
          session_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "protocol_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          workspace_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          session_id: string
          source?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          session_id?: string
          source?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_scope_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "protocol_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_scope_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          protocol: string
          state_json?: Json
          status?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          protocol?: string
          state_json?: Json
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_visas: {
        Row: {
          anti_pattern_acknowledged: boolean
          created_at: string
          file_path: string
          id: string
          justification: string
          session_id: string
          workspace_id: string
        }
        Insert: {
          anti_pattern_acknowledged?: boolean
          created_at?: string
          file_path: string
          id?: string
          justification: string
          session_id: string
          workspace_id: string
        }
        Update: {
          anti_pattern_acknowledged?: boolean
          created_at?: string
          file_path?: string
          id?: string
          justification?: string
          session_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_visas_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "protocol_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_visas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      runbook_cell_executions: {
        Row: {
          agent_id: string
          cell_id: string
          expectations: Json
          inputs_digest: string
          instance_id: string
          outputs_ref: string | null
          recorded_at: string
          seq: number
          started_at: string
          status: string
          tenant_workspace_id: string
        }
        Insert: {
          agent_id: string
          cell_id: string
          expectations?: Json
          inputs_digest: string
          instance_id: string
          outputs_ref?: string | null
          recorded_at?: string
          seq: number
          started_at: string
          status: string
          tenant_workspace_id: string
        }
        Update: {
          agent_id?: string
          cell_id?: string
          expectations?: Json
          inputs_digest?: string
          instance_id?: string
          outputs_ref?: string | null
          recorded_at?: string
          seq?: number
          started_at?: string
          status?: string
          tenant_workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runbook_cell_executions_instance_tenant_fkey"
            columns: ["instance_id", "tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "runbook_instances"
            referencedColumns: ["id", "tenant_workspace_id"]
          },
          {
            foreignKeyName: "runbook_cell_executions_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      runbook_fitness_ledger: {
        Row: {
          actual: Json | null
          agent_id: string
          cell_id: string
          error: string | null
          expected: Json
          id: number
          instance_id: string
          pass: boolean
          result: string
          template_id: string
          template_version: number
          tenant_workspace_id: string
          tier: number
          ts: string
        }
        Insert: {
          actual?: Json | null
          agent_id: string
          cell_id: string
          error?: string | null
          expected: Json
          id?: never
          instance_id: string
          pass: boolean
          result: string
          template_id: string
          template_version: number
          tenant_workspace_id: string
          tier: number
          ts?: string
        }
        Update: {
          actual?: Json | null
          agent_id?: string
          cell_id?: string
          error?: string | null
          expected?: Json
          id?: never
          instance_id?: string
          pass?: boolean
          result?: string
          template_id?: string
          template_version?: number
          tenant_workspace_id?: string
          tier?: number
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "runbook_fitness_ledger_instance_tenant_fkey"
            columns: ["instance_id", "tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "runbook_instances"
            referencedColumns: ["id", "tenant_workspace_id"]
          },
          {
            foreignKeyName: "runbook_fitness_ledger_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      runbook_instances: {
        Row: {
          created_at: string
          created_by: string
          id: string
          template_id: string
          template_version: number
          tenant_workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id: string
          template_id: string
          template_version: number
          tenant_workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          template_id?: string
          template_version?: number
          tenant_workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runbook_instances_template_tenant_fkey"
            columns: ["tenant_workspace_id", "template_id", "template_version"]
            isOneToOne: false
            referencedRelation: "runbook_templates"
            referencedColumns: ["tenant_workspace_id", "template_id", "version"]
          },
          {
            foreignKeyName: "runbook_instances_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      runbook_templates: {
        Row: {
          cells: Json
          cells_hash: string
          created_at: string
          created_by: string
          template_id: string
          tenant_workspace_id: string
          version: number
        }
        Insert: {
          cells: Json
          cells_hash: string
          created_at?: string
          created_by: string
          template_id: string
          tenant_workspace_id: string
          version: number
        }
        Update: {
          cells?: Json
          cells_hash?: string
          created_at?: string
          created_by?: string
          template_id?: string
          tenant_workspace_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "runbook_templates_tenant_workspace_id_fkey"
            columns: ["tenant_workspace_id"]
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
          otel_session_id: string | null
          session_id: string
          started_at: string
          workspace_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          otel_session_id?: string | null
          session_id: string
          started_at?: string
          workspace_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
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
          audit_manifest: Json | null
          branch_count: number
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          last_accessed_at: string
          status: string
          tags: string[]
          thought_count: number
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          audit_manifest?: Json | null
          branch_count?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_accessed_at?: string
          status?: string
          tags?: string[]
          thought_count?: number
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          audit_manifest?: Json | null
          branch_count?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
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
      append_peer_trace_event: {
        Args: {
          p_attrs?: Json
          p_body?: string
          p_event_type: string
          p_invocation_id: string
          p_severity: string
          p_workspace_id: string
        }
        Returns: {
          attrs: Json
          body: string | null
          event_type: string
          id: string
          invocation_id: string
          seq: number
          severity: string
          timestamp_at: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "peer_trace_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_protocol_enforcement:
        | { Args: { target_path: string }; Returns: Json }
        | { Args: { target_path: string; ws_id?: string }; Returns: Json }
      invoke_process_thought_queue_from_vault: {
        Args: {
          body?: Json
          function_bearer_secret_name?: string
          project_url_secret_name?: string
        }
        Returns: number
      }
      is_workspace_member: { Args: { ws_id: string }; Returns: boolean }
      otel_session_cost: {
        Args: { p_session_id?: string; p_workspace_id: string }
        Returns: {
          data_points: number
          model: string
          total_cost: number
        }[]
      }
      pgmq_archive_queue_message: {
        Args: { msg_id: number; queue_name: string }
        Returns: boolean
      }
      pgmq_read_queue: {
        Args: { qty?: number; queue_name: string; vt?: number }
        Returns: unknown[]
        SetofOptions: {
          from: "*"
          to: "message_record"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      schedule_process_thought_queue: {
        Args: {
          cron_expr?: string
          function_bearer_secret_name?: string
          job_name?: string
          project_url_secret_name?: string
        }
        Returns: number
      }
      supersede_claim: {
        Args: {
          p_expected_version: number
          p_original_id: string
          p_replacement: Json
          p_superseded_at: string
          p_tenant_workspace_id: string
        }
        Returns: number
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

