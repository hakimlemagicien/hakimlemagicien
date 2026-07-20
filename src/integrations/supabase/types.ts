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
      exercise_muscle_groups: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          coach_notes: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["exercise_difficulty"] | null
          duration_seconds: number
          equipment: string | null
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          external_id: string
          id: string
          instructions_status: Database["public"]["Enums"]["exercise_media_status"]
          instructions_video_path: string | null
          is_active: boolean
          metadata: Json
          muscle_group_id: string
          name_ar: string
          name_en: string
          primary_muscle: string | null
          secondary_muscles: string[]
          slug: string
          sort_order: number
          thumbnail_path: string | null
          updated_at: string
          video_path: string | null
          video_status: Database["public"]["Enums"]["exercise_media_status"]
          youtube_url: string | null
        }
        Insert: {
          coach_notes?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["exercise_difficulty"] | null
          duration_seconds?: number
          equipment?: string | null
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          external_id: string
          id?: string
          instructions_status?: Database["public"]["Enums"]["exercise_media_status"]
          instructions_video_path?: string | null
          is_active?: boolean
          metadata?: Json
          muscle_group_id: string
          name_ar: string
          name_en: string
          primary_muscle?: string | null
          secondary_muscles?: string[]
          slug: string
          sort_order?: number
          thumbnail_path?: string | null
          updated_at?: string
          video_path?: string | null
          video_status?: Database["public"]["Enums"]["exercise_media_status"]
          youtube_url?: string | null
        }
        Update: {
          coach_notes?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["exercise_difficulty"] | null
          duration_seconds?: number
          equipment?: string | null
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          external_id?: string
          id?: string
          instructions_status?: Database["public"]["Enums"]["exercise_media_status"]
          instructions_video_path?: string | null
          is_active?: boolean
          metadata?: Json
          muscle_group_id?: string
          name_ar?: string
          name_en?: string
          primary_muscle?: string | null
          secondary_muscles?: string[]
          slug?: string
          sort_order?: number
          thumbnail_path?: string | null
          updated_at?: string
          video_path?: string | null
          video_status?: Database["public"]["Enums"]["exercise_media_status"]
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_muscle_group_id_fkey"
            columns: ["muscle_group_id"]
            isOneToOne: false
            referencedRelation: "exercise_muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_proof_uploads: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          lead_id: string
          storage_path: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          lead_id: string
          storage_path: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          lead_id?: string
          storage_path?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_proof_uploads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
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
          phone: string | null
          plan_price: number | null
          proof_path: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tier_id: string | null
          tier_name: string | null
          training_mode: string | null
          updated_at: string
          user_id: string | null
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
          phone?: string | null
          plan_price?: number | null
          proof_path?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tier_id?: string | null
          tier_name?: string | null
          training_mode?: string | null
          updated_at?: string
          user_id?: string | null
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
          phone?: string | null
          plan_price?: number | null
          proof_path?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tier_id?: string | null
          tier_name?: string | null
          training_mode?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      membership_tiers: {
        Row: {
          created_at: string
          features: Json
          is_free: boolean
          name_ar: string
          name_en: string | null
          sort_order: number
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json
          is_free?: boolean
          name_ar: string
          name_en?: string | null
          sort_order?: number
          tier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json
          is_free?: boolean
          name_ar?: string
          name_en?: string | null
          sort_order?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          source: string
          starts_at: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          source?: string
          starts_at?: string
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          source?: string
          starts_at?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tier_fkey"
            columns: ["tier"]
            isOneToOne: false
            referencedRelation: "membership_tiers"
            referencedColumns: ["tier"]
          },
        ]
      }
      onboarding_drafts: {
        Row: {
          answers: Json
          avatar_path: string | null
          city: string | null
          country: string | null
          created_at: string
          draft_token: string
          email: string | null
          expires_at: string
          finalized_at: string | null
          finalized_user_id: string | null
          full_name: string | null
          goal: string | null
          id: string
          location_preference: string | null
          phone: string | null
          status: string
          training_type: string | null
          updated_at: string
        }
        Insert: {
          answers?: Json
          avatar_path?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          draft_token?: string
          email?: string | null
          expires_at?: string
          finalized_at?: string | null
          finalized_user_id?: string | null
          full_name?: string | null
          goal?: string | null
          id?: string
          location_preference?: string | null
          phone?: string | null
          status?: string
          training_type?: string | null
          updated_at?: string
        }
        Update: {
          answers?: Json
          avatar_path?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          draft_token?: string
          email?: string | null
          expires_at?: string
          finalized_at?: string | null
          finalized_user_id?: string | null
          full_name?: string | null
          goal?: string | null
          id?: string
          location_preference?: string | null
          phone?: string | null
          status?: string
          training_type?: string | null
          updated_at?: string
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
          avatar_path: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          first_login_seen_at: string | null
          full_name: string | null
          goal: string | null
          id: string
          location_preference: string | null
          onboarding_completed_at: string | null
          phone: string | null
          program_start_date: string | null
          training_type: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_login_seen_at?: string | null
          full_name?: string | null
          goal?: string | null
          id: string
          location_preference?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          program_start_date?: string | null
          training_type?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_login_seen_at?: string | null
          full_name?: string | null
          goal?: string | null
          id?: string
          location_preference?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          program_start_date?: string | null
          training_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      program_template_days: {
        Row: {
          created_at: string
          day_number: number
          day_type: Database["public"]["Enums"]["program_day_type"]
          estimated_calories: number | null
          estimated_minutes: number | null
          id: string
          muscle_focus: string | null
          title_ar: string
          updated_at: string
          week_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          day_type?: Database["public"]["Enums"]["program_day_type"]
          estimated_calories?: number | null
          estimated_minutes?: number | null
          id?: string
          muscle_focus?: string | null
          title_ar: string
          updated_at?: string
          week_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          day_type?: Database["public"]["Enums"]["program_day_type"]
          estimated_calories?: number | null
          estimated_minutes?: number | null
          id?: string
          muscle_focus?: string | null
          title_ar?: string
          updated_at?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_template_days_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "program_template_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      program_template_exercises: {
        Row: {
          created_at: string
          day_id: string
          exercise_id: string
          id: string
          notes_ar: string | null
          reps_label: string | null
          reps_max: number | null
          reps_min: number | null
          rest_seconds: number
          sets: number
          sort_order: number
          suggested_weight_kg: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_id: string
          exercise_id: string
          id?: string
          notes_ar?: string | null
          reps_label?: string | null
          reps_max?: number | null
          reps_min?: number | null
          rest_seconds?: number
          sets?: number
          sort_order?: number
          suggested_weight_kg?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_id?: string
          exercise_id?: string
          id?: string
          notes_ar?: string | null
          reps_label?: string | null
          reps_max?: number | null
          reps_min?: number | null
          rest_seconds?: number
          sets?: number
          sort_order?: number
          suggested_weight_kg?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_template_exercises_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "program_template_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      program_template_weeks: {
        Row: {
          created_at: string
          id: string
          notes_ar: string | null
          template_id: string
          title_ar: string | null
          updated_at: string
          week_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes_ar?: string | null
          template_id: string
          title_ar?: string | null
          updated_at?: string
          week_number: number
        }
        Update: {
          created_at?: string
          id?: string
          notes_ar?: string | null
          template_id?: string
          title_ar?: string | null
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_template_weeks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "program_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      program_templates: {
        Row: {
          created_at: string
          days_per_week: number
          description_ar: string | null
          duration_weeks: number
          goal: Database["public"]["Enums"]["program_goal"] | null
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["program_level"] | null
          metadata: Json
          name_ar: string
          name_en: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_per_week?: number
          description_ar?: string | null
          duration_weeks?: number
          goal?: Database["public"]["Enums"]["program_goal"] | null
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["program_level"] | null
          metadata?: Json
          name_ar: string
          name_en?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_per_week?: number
          description_ar?: string | null
          duration_weeks?: number
          goal?: Database["public"]["Enums"]["program_goal"] | null
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["program_level"] | null
          metadata?: Json
          name_ar?: string
          name_en?: string | null
          slug?: string
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
      training_profiles: {
        Row: {
          answers: Json
          avatar_path: string | null
          city: string | null
          completed_at: string
          country: string | null
          created_at: string
          full_name: string | null
          goal: string | null
          id: string
          location_preference: string | null
          onboarding_draft_id: string | null
          phone: string | null
          training_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          avatar_path?: string | null
          city?: string | null
          completed_at?: string
          country?: string | null
          created_at?: string
          full_name?: string | null
          goal?: string | null
          id?: string
          location_preference?: string | null
          onboarding_draft_id?: string | null
          phone?: string | null
          training_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          avatar_path?: string | null
          city?: string | null
          completed_at?: string
          country?: string | null
          created_at?: string
          full_name?: string | null
          goal?: string | null
          id?: string
          location_preference?: string | null
          onboarding_draft_id?: string | null
          phone?: string | null
          training_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_profiles_onboarding_draft_id_fkey"
            columns: ["onboarding_draft_id"]
            isOneToOne: false
            referencedRelation: "onboarding_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_set_logs: {
        Row: {
          created_at: string
          effort: Database["public"]["Enums"]["workout_effort_level"] | null
          exercise_external_id: string
          exercise_id: string | null
          id: string
          notes: string | null
          reps: number | null
          session_date: string
          set_number: number
          skipped: boolean
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          effort?: Database["public"]["Enums"]["workout_effort_level"] | null
          exercise_external_id: string
          exercise_id?: string | null
          id?: string
          notes?: string | null
          reps?: number | null
          session_date?: string
          set_number: number
          skipped?: boolean
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          effort?: Database["public"]["Enums"]["workout_effort_level"] | null
          exercise_external_id?: string
          exercise_id?: string | null
          id?: string
          notes?: string | null
          reps?: number | null
          session_date?: string
          set_number?: number
          skipped?: boolean
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_approved_leads: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          payment_amount: number
          payment_currency: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          phone: string
          proof_path: string
        }[]
      }
      admin_list_submitted_leads: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          payment_amount: number
          payment_currency: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          phone: string
          proof_path: string
        }[]
      }
      admin_update_lead_payment_status: {
        Args: {
          p_lead_id: string
          p_payment_status: Database["public"]["Enums"]["payment_status"]
        }
        Returns: undefined
      }
      create_lead: { Args: { p_payload: Json }; Returns: Json }
      create_onboarding_draft: { Args: { p_payload?: Json }; Returns: Json }
      finalize_onboarding: { Args: { p_draft_token: string }; Returns: Json }
      get_my_membership: { Args: never; Returns: Json }
      get_my_onboarding_state: { Args: never; Returns: Json }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_own_avatar_path: { Args: { p_path: string }; Returns: boolean }
      is_proof_upload_reserved: { Args: { p_path: string }; Returns: boolean }
      mark_first_login_seen: { Args: never; Returns: Json }
      read_onboarding_draft_by_token: {
        Args: { p_draft_token: string }
        Returns: {
          answers: Json
          avatar_path: string | null
          city: string | null
          country: string | null
          created_at: string
          draft_token: string
          email: string | null
          expires_at: string
          finalized_at: string | null
          finalized_user_id: string | null
          full_name: string | null
          goal: string | null
          id: string
          location_preference: string | null
          phone: string | null
          status: string
          training_type: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "onboarding_drafts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reserve_proof_upload: {
        Args: { p_access_token: string; p_file_ext: string; p_lead_id: string }
        Returns: string
      }
      submit_payment_proof_metadata: {
        Args: {
          p_access_token: string
          p_lead_id: string
          p_proof_path: string
        }
        Returns: undefined
      }
      update_lead: {
        Args: { p_access_token: string; p_lead_id: string; p_payload: Json }
        Returns: undefined
      }
      update_onboarding_draft: {
        Args: { p_draft_token: string; p_payload?: Json }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      exercise_difficulty: "beginner" | "intermediate" | "advanced"
      exercise_media_status: "placeholder" | "ready" | "missing" | "review_required" | "rejected"
      exercise_type: "strength" | "cardio" | "mobility" | "warmup" | "other"
      lead_status:
        | "pending_lead"
        | "plan_selected"
        | "payment_submitted"
        | "active"
      payment_method: "stripe" | "bank_transfer" | "cash"
      payment_status: "pending" | "submitted" | "approved" | "rejected"
      program_day_type: "workout" | "rest" | "active_recovery"
      program_goal: "cut" | "bulk" | "fitness" | "recomp"
      program_level: "beginner" | "intermediate" | "advanced"
      workout_effort_level: "easy" | "medium" | "hard"
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
    Enums: {
      app_role: ["admin", "user"],
      exercise_difficulty: ["beginner", "intermediate", "advanced"],
      exercise_media_status: ["placeholder", "ready", "missing", "review_required", "rejected"],
      exercise_type: ["strength", "cardio", "mobility", "warmup", "other"],
      lead_status: [
        "pending_lead",
        "plan_selected",
        "payment_submitted",
        "active",
      ],
      payment_method: ["stripe", "bank_transfer", "cash"],
      payment_status: ["pending", "submitted", "approved", "rejected"],
      program_day_type: ["workout", "rest", "active_recovery"],
      program_goal: ["cut", "bulk", "fitness", "recomp"],
      program_level: ["beginner", "intermediate", "advanced"],
      workout_effort_level: ["easy", "medium", "hard"],
    },
  },
} as const
