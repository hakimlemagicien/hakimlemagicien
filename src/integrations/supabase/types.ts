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
    PostgrestVersion: "14.15"
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
      coaching_attachments: {
        Row: {
          byte_size: number | null
          conversation_id: string
          created_at: string
          duration_ms: number | null
          id: string
          kind: string
          message_id: string
          mime_type: string | null
          storage_path: string
        }
        Insert: {
          byte_size?: number | null
          conversation_id: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          kind: string
          message_id: string
          mime_type?: string | null
          storage_path: string
        }
        Update: {
          byte_size?: number | null
          conversation_id?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          kind?: string
          message_id?: string
          mime_type?: string | null
          storage_path?: string
        }
        Relationships: []
      }
      coaching_conversations: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          coach_last_read_at: string | null
          created_at: string
          id: string
          last_actor: Database["public"]["Enums"]["coaching_actor"] | null
          last_message_at: string | null
          last_message_kind: Database["public"]["Enums"]["coaching_message_kind"] | null
          last_message_preview: string | null
          member_id: string
          member_last_read_at: string | null
          status: Database["public"]["Enums"]["coaching_conversation_status"]
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          coach_last_read_at?: string | null
          created_at?: string
          id?: string
          last_actor?: Database["public"]["Enums"]["coaching_actor"] | null
          last_message_at?: string | null
          last_message_kind?: Database["public"]["Enums"]["coaching_message_kind"] | null
          last_message_preview?: string | null
          member_id: string
          member_last_read_at?: string | null
          status?: Database["public"]["Enums"]["coaching_conversation_status"]
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          coach_last_read_at?: string | null
          created_at?: string
          id?: string
          last_actor?: Database["public"]["Enums"]["coaching_actor"] | null
          last_message_at?: string | null
          last_message_kind?: Database["public"]["Enums"]["coaching_message_kind"] | null
          last_message_preview?: string | null
          member_id?: string
          member_last_read_at?: string | null
          status?: Database["public"]["Enums"]["coaching_conversation_status"]
          updated_at?: string
        }
        Relationships: []
      }
      coaching_messages: {
        Row: {
          actor: Database["public"]["Enums"]["coaching_actor"]
          body: string | null
          client_id: string | null
          conversation_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["coaching_message_kind"]
          sender_id: string
        }
        Insert: {
          actor: Database["public"]["Enums"]["coaching_actor"]
          body?: string | null
          client_id?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["coaching_message_kind"]
          sender_id: string
        }
        Update: {
          actor?: Database["public"]["Enums"]["coaching_actor"]
          body?: string | null
          client_id?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["coaching_message_kind"]
          sender_id?: string
        }
        Relationships: []
      }
      coaching_notifications: {
        Row: {
          body: string | null
          conversation_id: string | null
          created_at: string
          id: string
          kind: string
          message_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          kind: string
          message_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          message_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
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
          instructions_file_size: number | null
          instructions_mime_type: string | null
          instructions_reviewed_at: string | null
          instructions_reviewed_by: string | null
          instructions_status: Database["public"]["Enums"]["exercise_media_status"]
          instructions_updated_at: string | null
          instructions_version: number
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
          video_file_size: number | null
          video_mime_type: string | null
          video_path: string | null
          video_reviewed_at: string | null
          video_reviewed_by: string | null
          video_status: Database["public"]["Enums"]["exercise_media_status"]
          video_updated_at: string | null
          video_version: number
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
          instructions_file_size?: number | null
          instructions_mime_type?: string | null
          instructions_reviewed_at?: string | null
          instructions_reviewed_by?: string | null
          instructions_status?: Database["public"]["Enums"]["exercise_media_status"]
          instructions_updated_at?: string | null
          instructions_version?: number
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
          video_file_size?: number | null
          video_mime_type?: string | null
          video_path?: string | null
          video_reviewed_at?: string | null
          video_reviewed_by?: string | null
          video_status?: Database["public"]["Enums"]["exercise_media_status"]
          video_updated_at?: string | null
          video_version?: number
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
          instructions_file_size?: number | null
          instructions_mime_type?: string | null
          instructions_reviewed_at?: string | null
          instructions_reviewed_by?: string | null
          instructions_status?: Database["public"]["Enums"]["exercise_media_status"]
          instructions_updated_at?: string | null
          instructions_version?: number
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
          video_file_size?: number | null
          video_mime_type?: string | null
          video_path?: string | null
          video_reviewed_at?: string | null
          video_reviewed_by?: string | null
          video_status?: Database["public"]["Enums"]["exercise_media_status"]
          video_updated_at?: string | null
          video_version?: number
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
      meal_ingredients: {
        Row: {
          carbs_g: number | null
          created_at: string
          fat_g: number | null
          id: string
          ingredient_key: string
          ingredient_order: number
          kcal: number | null
          meal_id: string
          name_ar: string
          name_en: string
          protein_g: number | null
          quantity: number
          source: string | null
          source_query_url: string | null
          unit: string
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          id?: string
          ingredient_key: string
          ingredient_order: number
          kcal?: number | null
          meal_id: string
          name_ar: string
          name_en: string
          protein_g?: number | null
          quantity: number
          source?: string | null
          source_query_url?: string | null
          unit: string
        }
        Update: {
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          id?: string
          ingredient_key?: string
          ingredient_order?: number
          kcal?: number | null
          meal_id?: string
          name_ar?: string
          name_en?: string
          protein_g?: number | null
          quantity?: number
          source?: string | null
          source_query_url?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_ingredients_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          allergens: string[]
          calories: number
          carbs_g: number
          created_at: string
          description_ar: string | null
          description_en: string | null
          dietary_tags: string[]
          external_id: string
          fat_g: number
          id: string
          image_alt_ar: string | null
          image_alt_en: string | null
          image_master_path: string | null
          image_path: string | null
          image_status: Database["public"]["Enums"]["meal_image_status"]
          image_thumb_path: string | null
          is_active: boolean
          meal_type: Database["public"]["Enums"]["meal_type"]
          name_ar: string
          name_en: string
          notes: string | null
          preparation_steps_ar: string[]
          preparation_steps_en: string[]
          preparation_time_minutes: number | null
          protein_g: number
          qa: Json
          review_status: string | null
          serving_size: number
          serving_unit: string
          sort_order: number
          status: Database["public"]["Enums"]["meal_library_status"]
          substitution_profile: Json
          suitable_goals: string[]
          updated_at: string
          yield_servings: number
        }
        Insert: {
          allergens?: string[]
          calories: number
          carbs_g: number
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          dietary_tags?: string[]
          external_id: string
          fat_g: number
          id?: string
          image_alt_ar?: string | null
          image_alt_en?: string | null
          image_master_path?: string | null
          image_path?: string | null
          image_status?: Database["public"]["Enums"]["meal_image_status"]
          image_thumb_path?: string | null
          is_active?: boolean
          meal_type: Database["public"]["Enums"]["meal_type"]
          name_ar: string
          name_en: string
          notes?: string | null
          preparation_steps_ar?: string[]
          preparation_steps_en?: string[]
          preparation_time_minutes?: number | null
          protein_g: number
          qa?: Json
          review_status?: string | null
          serving_size: number
          serving_unit?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["meal_library_status"]
          substitution_profile?: Json
          suitable_goals?: string[]
          updated_at?: string
          yield_servings?: number
        }
        Update: {
          allergens?: string[]
          calories?: number
          carbs_g?: number
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          dietary_tags?: string[]
          external_id?: string
          fat_g?: number
          id?: string
          image_alt_ar?: string | null
          image_alt_en?: string | null
          image_master_path?: string | null
          image_path?: string | null
          image_status?: Database["public"]["Enums"]["meal_image_status"]
          image_thumb_path?: string | null
          is_active?: boolean
          meal_type?: Database["public"]["Enums"]["meal_type"]
          name_ar?: string
          name_en?: string
          notes?: string | null
          preparation_steps_ar?: string[]
          preparation_steps_en?: string[]
          preparation_time_minutes?: number | null
          protein_g?: number
          qa?: Json
          review_status?: string | null
          serving_size?: number
          serving_unit?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["meal_library_status"]
          substitution_profile?: Json
          suitable_goals?: string[]
          updated_at?: string
          yield_servings?: number
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
          auto_renew: boolean
          billing_period_months: number | null
          cancel_at_period_end: boolean
          created_at: string
          currency: string
          ends_at: string | null
          id: string
          is_active: boolean
          last_renewal_reminder_at: string | null
          next_renewal_at: string | null
          paid_period_end: string | null
          payment_succeeded_at: string | null
          personal_program_delivered_at: string | null
          personal_program_started_at: string | null
          premium_access_granted_at: string | null
          price_amount: number | null
          source: string
          starts_at: string
          subscription_activated_at: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
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
          archived_at: string | null
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
          version: number
        }
        Insert: {
          archived_at?: string | null
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
          version?: number
        }
        Update: {
          archived_at?: string | null
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
          version?: number
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
      daily_readiness_checks: {
        Row: {
          adjustment_choice: string | null
          adjustment_decision: string | null
          body: string | null
          created_at: string
          energy: string | null
          id: string
          level: string | null
          local_date: string
          score: number | null
          sleep: string | null
          source: string
          status: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adjustment_choice?: string | null
          adjustment_decision?: string | null
          body?: string | null
          created_at?: string
          energy?: string | null
          id?: string
          level?: string | null
          local_date: string
          score?: number | null
          sleep?: string | null
          source?: string
          status: string
          timezone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adjustment_choice?: string | null
          adjustment_decision?: string | null
          body?: string | null
          created_at?: string
          energy?: string | null
          id?: string
          level?: string | null
          local_date?: string
          score?: number | null
          sleep?: string | null
          source?: string
          status?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      audit_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          subject_user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          subject_user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          subject_user_id?: string | null
        }
        Relationships: []
      }
      coach_client_notes: {
        Row: {
          archived_at: string | null
          author_id: string
          body: string
          client_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          author_id: string
          body: string
          client_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          author_id?: string
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_program_assignments: {
        Row: {
          archived_at: string | null
          assigned_at: string
          assigned_by: string | null
          client_id: string
          created_at: string
          id: string
          source_template_id: string
          status: string
          template_version: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assigned_at?: string
          assigned_by?: string | null
          client_id: string
          created_at?: string
          id?: string
          source_template_id: string
          status?: string
          template_version: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assigned_at?: string
          assigned_by?: string | null
          client_id?: string
          created_at?: string
          id?: string
          source_template_id?: string
          status?: string
          template_version?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_role: string | null
          assigned_user_id: string | null
          category: string
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          language: string | null
          message: string
          status: string
          subject: string
          ticket_code: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_role?: string | null
          assigned_user_id?: string | null
          category: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string | null
          message: string
          status?: string
          subject: string
          ticket_code: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_role?: string | null
          assigned_user_id?: string | null
          category?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string | null
          message?: string
          status?: string
          subject?: string
          ticket_code?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_clients: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_onboarding?: string | null
          p_plan?: string | null
          p_query?: string | null
        }
        Returns: {
          avatar_path: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          goal: string | null
          id: string
          last_activity_at: string | null
          membership_active: boolean | null
          membership_plan: string | null
          onboarding_completed_at: string | null
          phone: string | null
          total_count: number
          unread_coaching_count: number
          waiting_coaching: boolean
        }[]
      }
      admin_get_client_overview: {
        Args: { p_client_id: string }
        Returns: Json
      }
      admin_list_client_notes: {
        Args: {
          p_client_id: string
          p_include_archived?: boolean
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          archived_at: string | null
          author_id: string
          body: string
          client_id: string
          created_at: string
          id: string
          updated_at: string
        }[]
      }
      admin_add_client_note: {
        Args: { p_body: string; p_client_id: string }
        Returns: string
      }
      admin_archive_client_note: {
        Args: { p_note_id: string }
        Returns: undefined
      }
      admin_list_audit_events: {
        Args: {
          p_event_type?: string | null
          p_limit?: number
          p_offset?: number
          p_subject_user_id?: string | null
        }
        Returns: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          subject_user_id: string | null
        }[]
      }
      admin_get_operations_snapshot: { Args: never; Returns: Json }
      admin_list_support_tickets: {
        Args: {
          p_category?: string | null
          p_limit?: number
          p_offset?: number
          p_status?: string | null
          p_user_id?: string | null
        }
        Returns: {
          category: string
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          status: string
          subject: string
          ticket_code: string
          updated_at: string
          user_id: string | null
        }[]
      }
      admin_set_support_ticket_status: {
        Args: { p_status: string; p_ticket_id: string }
        Returns: undefined
      }
      admin_list_coaching_inbox: {
        Args: {
          p_search?: string | null
          p_status?: Database["public"]["Enums"]["coaching_conversation_status"] | null
        }
        Returns: {
          created_at: string
          id: string
          last_actor: Database["public"]["Enums"]["coaching_actor"] | null
          last_message_at: string | null
          last_message_kind: Database["public"]["Enums"]["coaching_message_kind"] | null
          last_message_preview: string | null
          member_avatar_path: string | null
          member_email: string | null
          member_goal: string | null
          member_id: string
          member_name: string
          membership_tier: string | null
          status: Database["public"]["Enums"]["coaching_conversation_status"]
          unread_count: number
        }[]
      }
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
          p_reason?: string | null
        }
        Returns: undefined
      }
      admin_set_coaching_conversation_status: {
        Args: {
          p_conversation_id: string
          p_status: Database["public"]["Enums"]["coaching_conversation_status"]
        }
        Returns: undefined
      }
      can_access_coaching_conversation: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      coaching_unread_count: { Args: never; Returns: number }
      ensure_my_coaching_conversation: {
        Args: never
        Returns: Database["public"]["Tables"]["coaching_conversations"]["Row"]
      }
      is_coaching_chat_path: { Args: { p_path: string }; Returns: boolean }
      list_coaching_messages: {
        Args: {
          p_before?: string | null
          p_before_id?: string | null
          p_conversation_id: string
          p_limit?: number
        }
        Returns: {
          actor: Database["public"]["Enums"]["coaching_actor"]
          attachment_kind: string | null
          body: string | null
          byte_size: number | null
          conversation_id: string
          created_at: string
          duration_ms: number | null
          id: string
          kind: Database["public"]["Enums"]["coaching_message_kind"]
          mime_type: string | null
          sender_id: string
          storage_path: string | null
        }[]
      }
      list_my_coaching_notifications: {
        Args: { p_limit?: number }
        Returns: Database["public"]["Tables"]["coaching_notifications"]["Row"][]
      }
      mark_coaching_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      member_can_use_coach_chat: { Args: { _user_id: string }; Returns: boolean }
      send_coaching_message: {
        Args: {
          p_attachment_kind?: string | null
          p_body?: string | null
          p_byte_size?: number | null
          p_client_id?: string | null
          p_conversation_id: string
          p_duration_ms?: number | null
          p_kind: Database["public"]["Enums"]["coaching_message_kind"]
          p_message_id?: string | null
          p_mime_type?: string | null
          p_storage_path?: string | null
        }
        Returns: Json
      }
      create_lead: { Args: { p_payload: Json }; Returns: Json }
      create_onboarding_draft: { Args: { p_payload?: Json }; Returns: Json }
      finalize_onboarding: { Args: { p_draft_token: string }; Returns: Json }
      get_my_membership: { Args: never; Returns: Json }
      get_my_billing: { Args: never; Returns: Json }
      create_support_ticket: {
        Args: {
          p_category: string
          p_subject: string
          p_message: string
          p_email?: string | null
          p_name?: string | null
          p_language?: string | null
        }
        Returns: Json
      }
      accept_checkout_policies: {
        Args: {
          p_plan: string
          p_billing_period_months: number
          p_amount: number
          p_currency: string
          p_terms_version: string
          p_refund_policy_version: string
          p_privacy_version: string
          p_checkout_disclosure_version: string
          p_renewal_disclosure_version: string
          p_consent_text: string
          p_policy_version: string
        }
        Returns: Json
      }
      accept_policy_version: {
        Args: { p_policy: string; p_version: string; p_language?: string | null }
        Returns: Json
      }
      cancel_my_renewal: { Args: never; Returns: Json }
      request_account_deletion: { Args: { p_reason?: string | null }; Returns: Json }
      record_media_consent: {
        Args: {
          p_granted: boolean
          p_scope: string
          p_asset_ids?: string[] | null
          p_version?: string | null
        }
        Returns: Json
      }
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
      coaching_actor: "member" | "coach"
      coaching_conversation_status: "new" | "waiting_for_reply" | "replied" | "closed"
      coaching_message_kind: "text" | "image" | "voice" | "video"
      exercise_difficulty: "beginner" | "intermediate" | "advanced"
      exercise_media_status:
        | "placeholder"
        | "ready"
        | "missing"
        | "review_required"
        | "rejected"
      exercise_type: "strength" | "cardio" | "mobility" | "warmup" | "other"
      lead_status:
        | "pending_lead"
        | "plan_selected"
        | "payment_submitted"
        | "active"
      meal_image_status: "placeholder" | "ready" | "missing" | "review_required"
      meal_library_status: "pilot" | "published" | "archived"
      meal_type:
        | "breakfast"
        | "lunch"
        | "dinner"
        | "snack"
        | "pre_workout"
        | "post_workout"
        | "drinks"
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
      coaching_actor: ["member", "coach"],
      coaching_conversation_status: ["new", "waiting_for_reply", "replied", "closed"],
      coaching_message_kind: ["text", "image", "voice", "video"],
      exercise_difficulty: ["beginner", "intermediate", "advanced"],
      exercise_media_status: [
        "placeholder",
        "ready",
        "missing",
        "review_required",
        "rejected",
      ],
      exercise_type: ["strength", "cardio", "mobility", "warmup", "other"],
      lead_status: [
        "pending_lead",
        "plan_selected",
        "payment_submitted",
        "active",
      ],
      meal_image_status: ["placeholder", "ready", "missing", "review_required"],
      meal_library_status: ["pilot", "published", "archived"],
      meal_type: [
        "breakfast",
        "lunch",
        "dinner",
        "snack",
        "pre_workout",
        "post_workout",
        "drinks",
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
{"_tag":"Error","error":{"code":"UnknownError","message":"Timeout while shutting down PostHog. Some events may not have been sent."}}
