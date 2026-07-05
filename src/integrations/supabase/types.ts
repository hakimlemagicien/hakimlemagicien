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
      leads: {
        Row: {
          access_token: string
          answers: Json
          challenge_id: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gender: string | null
          goal_id: string | null
          id: string
          location_preference: string | null
          payment_amount: number | null
          payment_currency: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          plan_price: number | null
          proof_path: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tier_id: string | null
          tier_name: string | null
          training_mode: string | null
          updated_at: string
          phone: string | null
        }
        Insert: {
          access_token?: string
          answers?: Json
          challenge_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          goal_id?: string | null
          id?: string
          location_preference?: string | null
          payment_amount?: number | null
          payment_currency?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan_price?: number | null
          proof_path?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tier_id?: string | null
          tier_name?: string | null
          training_mode?: string | null
          updated_at?: string
          phone?: string | null
        }
        Update: {
          access_token?: string
          answers?: Json
          challenge_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          goal_id?: string | null
          id?: string
          location_preference?: string | null
          payment_amount?: number | null
          payment_currency?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan_price?: number | null
          proof_path?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tier_id?: string | null
          tier_name?: string | null
          training_mode?: string | null
          updated_at?: string
          phone?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string | null
          plan_id: string | null
          proof_url: string | null
          provider: string | null
          provider_payment_id: string | null
          reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string | null
          plan_id?: string | null
          proof_url?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string | null
          plan_id?: string | null
          proof_url?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          currency: string | null
          duration_weeks: number | null
          id: string
          is_active: boolean
          price: number | null
          selected_at: string
          tier_id: string
          tier_name: string | null
          training_mode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          duration_weeks?: number | null
          id?: string
          is_active?: boolean
          price?: number | null
          selected_at?: string
          tier_id: string
          tier_name?: string | null
          training_mode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          duration_weeks?: number | null
          id?: string
          is_active?: boolean
          price?: number | null
          selected_at?: string
          tier_id?: string
          tier_name?: string | null
          training_mode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          goal: string | null
          id: string
          location_preference: string | null
          phone: string | null
          program_start_date: string | null
          training_type: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          goal?: string | null
          id: string
          location_preference?: string | null
          phone?: string | null
          program_start_date?: string | null
          training_type?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          goal?: string | null
          id?: string
          location_preference?: string | null
          phone?: string | null
          program_start_date?: string | null
          training_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answers: Json
          created_at: string
          goal: string | null
          id: string
          location: string | null
          training_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          goal?: string | null
          id?: string
          location?: string | null
          training_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          goal?: string | null
          id?: string
          location?: string | null
          training_type?: string | null
          updated_at?: string
          user_id?: string
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
      admin_list_submitted_leads: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          full_name: string | null
          email: string | null
          phone: string | null
          payment_amount: number | null
          payment_currency: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          proof_path: string | null
          created_at: string
        }[]
      }
      admin_update_lead_payment_status: {
        Args: {
          p_lead_id: string
          p_payment_status: Database["public"]["Enums"]["payment_status"]
        }
        Returns: undefined
      }
      create_lead: {
        Args: { p_payload: Json }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_proof_upload_reserved: {
        Args: { p_path: string }
        Returns: boolean
      }
      reserve_proof_upload: {
        Args: {
          p_file_ext: string
          p_lead_id: string
          p_access_token: string
        }
        Returns: string
      }
      submit_payment_proof_metadata: {
        Args: {
          p_lead_id: string
          p_access_token: string
          p_proof_path: string
        }
        Returns: undefined
      }
      update_lead: {
        Args: {
          p_lead_id: string
          p_access_token: string
          p_payload: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      lead_status: "pending_lead" | "plan_selected" | "payment_submitted"
      payment_method:
        | "binance"
        | "paypal"
        | "wise"
        | "skrill"
        | "bank_nbd_uae"
        | "bank_cih_morocco"
        | "bank_bmce_morocco"
        | "pix_brazil"
        | "stripe"
        | "apple_pay"
        | "google_pay"
        | "other"
      payment_status:
        | "pending"
        | "submitted"
        | "confirmed"
        | "rejected"
        | "refunded"
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
      app_role: ["admin", "user"],
      lead_status: ["pending_lead", "plan_selected", "payment_submitted"],
      payment_method: [
        "binance",
        "paypal",
        "wise",
        "skrill",
        "bank_nbd_uae",
        "bank_cih_morocco",
        "bank_bmce_morocco",
        "pix_brazil",
        "stripe",
        "apple_pay",
        "google_pay",
        "other",
      ],
      payment_status: [
        "pending",
        "submitted",
        "confirmed",
        "rejected",
        "refunded",
      ],
    },
  },
} as const
