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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          starts_at: string | null
          title: string
          type: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          starts_at?: string | null
          title: string
          type?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          starts_at?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      assignment_rules: {
        Row: {
          assigned_to: string
          conditions: Json
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          name: string
          priority: number
          updated_at: string | null
        }
        Insert: {
          assigned_to: string
          conditions: Json
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string
          conditions?: Json
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      attachments: {
        Row: {
          complaint_id: string
          created_at: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          mime_type: string
          user_id: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          file_name: string
          file_size: number
          file_url: string
          id?: string
          mime_type: string
          user_id: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          mime_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      canned_responses: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          complaint_id: string
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          is_solution: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          complaint_id: string
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          is_solution?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          complaint_id?: string
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          is_solution?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_tags: {
        Row: {
          complaint_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_tags_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_watchers: {
        Row: {
          complaint_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_watchers_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          category_id: string | null
          closed_at: string | null
          created_at: string
          description: string
          feedback: string | null
          first_response_at: string | null
          id: string
          is_anonymous: boolean | null
          is_public: boolean | null
          priority: Database["public"]["Enums"]["priority_level"]
          resolution_notes: string | null
          resolved_at: string | null
          satisfaction_rating: number | null
          sla_breach_at: string | null
          sla_status: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          student_id: string
          ticket_number: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          category_id?: string | null
          closed_at?: string | null
          created_at?: string
          description: string
          feedback?: string | null
          first_response_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_public?: boolean | null
          priority?: Database["public"]["Enums"]["priority_level"]
          resolution_notes?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          sla_breach_at?: string | null
          sla_status?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          student_id: string
          ticket_number: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          category_id?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string
          feedback?: string | null
          first_response_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_public?: boolean | null
          priority?: Database["public"]["Enums"]["priority_level"]
          resolution_notes?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          sla_breach_at?: string | null
          sla_status?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          student_id?: string
          ticket_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          created_at: string | null
          id: string
          notify_assignment: boolean | null
          notify_new_comment: boolean | null
          notify_sla_warning: boolean | null
          notify_status_change: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notify_assignment?: boolean | null
          notify_new_comment?: boolean | null
          notify_sla_warning?: boolean | null
          notify_status_change?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notify_assignment?: boolean | null
          notify_new_comment?: boolean | null
          notify_sla_warning?: boolean | null
          notify_status_change?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      escalations: {
        Row: {
          complaint_id: string
          created_at: string
          escalated_by: string
          escalated_to: string | null
          id: string
          reason: string
          resolved_at: string | null
          status: string | null
        }
        Insert: {
          complaint_id: string
          created_at?: string
          escalated_by: string
          escalated_to?: string | null
          id?: string
          reason: string
          resolved_at?: string | null
          status?: string | null
        }
        Update: {
          complaint_id?: string
          created_at?: string
          escalated_by?: string
          escalated_to?: string | null
          id?: string
          reason?: string
          resolved_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalations_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          order_index: number | null
          question: string
          updated_at: string
          views: number | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          question: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          question?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          helpful: number | null
          id: string
          is_published: boolean | null
          not_helpful: number | null
          tags: string[] | null
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by: string
          helpful?: number | null
          id?: string
          is_published?: boolean | null
          not_helpful?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          helpful?: number | null
          id?: string
          is_published?: boolean | null
          not_helpful?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          complaint_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          complaint_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          complaint_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          batch: string | null
          bio: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_filters: {
        Row: {
          created_at: string | null
          filter_data: Json
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filter_data: Json
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filter_data?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sla_policies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          priority: Database["public"]["Enums"]["priority_level"]
          resolution_hours: number
          response_hours: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          priority: Database["public"]["Enums"]["priority_level"]
          resolution_hours: number
          response_hours: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          resolution_hours?: number
          response_hours?: number
        }
        Relationships: []
      }
      sla_tracking: {
        Row: {
          complaint_id: string
          created_at: string
          first_response_at: string | null
          id: string
          is_resolution_breached: boolean | null
          is_response_breached: boolean | null
          policy_id: string
          resolution_deadline: string
          resolved_at: string | null
          response_deadline: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          first_response_at?: string | null
          id?: string
          is_resolution_breached?: boolean | null
          is_response_breached?: boolean | null
          policy_id: string
          resolution_deadline: string
          resolved_at?: string | null
          response_deadline: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          first_response_at?: string | null
          id?: string
          is_resolution_breached?: boolean | null
          is_response_breached?: boolean | null
          policy_id?: string
          resolution_deadline?: string
          resolved_at?: string | null
          response_deadline?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_tracking_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: true
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_tracking_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "sla_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      calculate_sla_breach_time: {
        Args: {
          p_created_at: string
          p_priority: Database["public"]["Enums"]["priority_level"]
        }
        Returns: string
      }
      generate_ticket_number: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_sla_status: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "student" | "admin"
      complaint_status:
        | "open"
        | "in_progress"
        | "under_review"
        | "resolved"
        | "closed"
        | "rejected"
      priority_level: "low" | "medium" | "high" | "urgent"
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
      app_role: ["student", "admin"],
      complaint_status: [
        "open",
        "in_progress",
        "under_review",
        "resolved",
        "closed",
        "rejected",
      ],
      priority_level: ["low", "medium", "high", "urgent"],
    },
  },
} as const
