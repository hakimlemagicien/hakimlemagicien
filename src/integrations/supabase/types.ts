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
      _staging_gate_scratch: {
        Row: {
          detail: string | null
          outcome: string | null
          section: string | null
          test_name: string | null
        }
        Insert: {
          detail?: string | null
          outcome?: string | null
          section?: string | null
          test_name?: string | null
        }
        Update: {
          detail?: string | null
          outcome?: string | null
          section?: string | null
          test_name?: string | null
        }
        Relationships: []
      }
      account_deletion_requests: {
        Row: {
          created_at: string
          id: string
          processed_at: string | null
          reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      adaptive_decision_logs: {
        Row: {
          assignment_id: string | null
          confidence: string | null
          created_at: string
          decision_type: string
          evaluation_key: string | null
          exercise_external_id: string | null
          id: string
          input_snapshot: Json
          program_version: number | null
          reason_code: string | null
          user_id: string
          workout_session_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          confidence?: string | null
          created_at?: string
          decision_type: string
          evaluation_key?: string | null
          exercise_external_id?: string | null
          id?: string
          input_snapshot?: Json
          program_version?: number | null
          reason_code?: string | null
          user_id: string
          workout_session_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          confidence?: string | null
          created_at?: string
          decision_type?: string
          evaluation_key?: string | null
          exercise_external_id?: string | null
          id?: string
          input_snapshot?: Json
          program_version?: number | null
          reason_code?: string | null
          user_id?: string
          workout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adaptive_decision_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "client_program_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adaptive_decision_logs_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
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
      client_account_deletion_requests: {
        Row: {
          block_codes: Json
          client_id: string
          confirmation_email: string
          created_at: string
          executed_at: string | null
          id: string
          idempotency_key: string
          reason: string
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          block_codes?: Json
          client_id: string
          confirmation_email: string
          created_at?: string
          executed_at?: string | null
          id?: string
          idempotency_key: string
          reason: string
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          block_codes?: Json
          client_id?: string
          confirmation_email?: string
          created_at?: string
          executed_at?: string | null
          id?: string
          idempotency_key?: string
          reason?: string
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_account_deletion_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_exercise_experience: {
        Row: {
          baseline_established_at: string | null
          created_at: string
          exercise_external_id: string
          exercise_id: string | null
          experience_state: string
          first_exposure_at: string | null
          id: string
          last_calibrated_at: string | null
          last_exposure_at: string | null
          successful_exposure_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_established_at?: string | null
          created_at?: string
          exercise_external_id: string
          exercise_id?: string | null
          experience_state?: string
          first_exposure_at?: string | null
          id?: string
          last_calibrated_at?: string | null
          last_exposure_at?: string | null
          successful_exposure_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_established_at?: string | null
          created_at?: string
          exercise_external_id?: string
          exercise_id?: string | null
          experience_state?: string
          first_exposure_at?: string | null
          id?: string
          last_calibrated_at?: string | null
          last_exposure_at?: string | null
          successful_exposure_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_exercise_experience_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      client_goal_history: {
        Row: {
          canonical_goal_id: string | null
          changed_at: string
          id: string
          legacy_goal_id: string | null
          previous_canonical_goal_id: string | null
          previous_legacy_goal_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          canonical_goal_id?: string | null
          changed_at?: string
          id?: string
          legacy_goal_id?: string | null
          previous_canonical_goal_id?: string | null
          previous_legacy_goal_id?: string | null
          source?: string
          user_id: string
        }
        Update: {
          canonical_goal_id?: string | null
          changed_at?: string
          id?: string
          legacy_goal_id?: string | null
          previous_canonical_goal_id?: string | null
          previous_legacy_goal_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      client_nutrition_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_version: number
          client_id: string
          created_at: string
          decision_trace_id: string | null
          ended_at: string | null
          id: string
          library_version: string | null
          name_ar: string | null
          notes_ar: string | null
          replaces_assignment_id: string | null
          resolved_snapshot: Json | null
          schema_version: string
          starts_on: string | null
          status: string
          strategy_version: string | null
          target_id: string | null
          updated_at: string
          validation_status: string | null
          watch_allergens: string[]
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_version?: number
          client_id: string
          created_at?: string
          decision_trace_id?: string | null
          ended_at?: string | null
          id?: string
          library_version?: string | null
          name_ar?: string | null
          notes_ar?: string | null
          replaces_assignment_id?: string | null
          resolved_snapshot?: Json | null
          schema_version?: string
          starts_on?: string | null
          status?: string
          strategy_version?: string | null
          target_id?: string | null
          updated_at?: string
          validation_status?: string | null
          watch_allergens?: string[]
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_version?: number
          client_id?: string
          created_at?: string
          decision_trace_id?: string | null
          ended_at?: string | null
          id?: string
          library_version?: string | null
          name_ar?: string | null
          notes_ar?: string | null
          replaces_assignment_id?: string | null
          resolved_snapshot?: Json | null
          schema_version?: string
          starts_on?: string | null
          status?: string
          strategy_version?: string | null
          target_id?: string | null
          updated_at?: string
          validation_status?: string | null
          watch_allergens?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "client_nutrition_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_nutrition_assignments_decision_trace_id_fkey"
            columns: ["decision_trace_id"]
            isOneToOne: false
            referencedRelation: "nutrition_decision_traces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_nutrition_assignments_replaces_assignment_id_fkey"
            columns: ["replaces_assignment_id"]
            isOneToOne: false
            referencedRelation: "client_nutrition_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_nutrition_assignments_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "client_nutrition_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      client_nutrition_consumption_events: {
        Row: {
          assignment_id: string | null
          consumed_servings: number
          created_at: string
          event_type: string
          id: string
          idempotency_key: string | null
          macros_consumed: Json
          planned_servings: number
          session_date: string
          slot_id: string | null
          slot_key: string
          source_external_id: string
          status: string
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          consumed_servings?: number
          created_at?: string
          event_type: string
          id?: string
          idempotency_key?: string | null
          macros_consumed?: Json
          planned_servings: number
          session_date: string
          slot_id?: string | null
          slot_key: string
          source_external_id: string
          status: string
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          consumed_servings?: number
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string | null
          macros_consumed?: Json
          planned_servings?: number
          session_date?: string
          slot_id?: string | null
          slot_key?: string
          source_external_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_nutrition_consumption_events_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "client_nutrition_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_nutrition_consumption_events_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "client_nutrition_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      client_nutrition_meal_logs: {
        Row: {
          assignment_id: string | null
          consumed_servings: number
          consumption_state: string
          created_at: string
          id: string
          macros_consumed: Json | null
          planned_servings: number
          session_date: string
          slot_id: string | null
          slot_key: string
          source_external_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          consumed_servings?: number
          consumption_state?: string
          created_at?: string
          id?: string
          macros_consumed?: Json | null
          planned_servings?: number
          session_date?: string
          slot_id?: string | null
          slot_key: string
          source_external_id: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          consumed_servings?: number
          consumption_state?: string
          created_at?: string
          id?: string
          macros_consumed?: Json | null
          planned_servings?: number
          session_date?: string
          slot_id?: string | null
          slot_key?: string
          source_external_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_nutrition_meal_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "client_nutrition_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_nutrition_meal_logs_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "client_nutrition_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      client_nutrition_profiles: {
        Row: {
          allergy_status: string
          client_id: string
          confirmed_none_at: string | null
          dietary_restrictions: string[]
          known_allergens: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allergy_status?: string
          client_id: string
          confirmed_none_at?: string | null
          dietary_restrictions?: string[]
          known_allergens?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allergy_status?: string
          client_id?: string
          confirmed_none_at?: string | null
          dietary_restrictions?: string[]
          known_allergens?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_nutrition_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_nutrition_slots: {
        Row: {
          allergens: string[]
          assignment_id: string
          calories: number
          carbs_g: number
          counts_toward_day_totals: boolean
          created_at: string
          display_order: number | null
          fat_g: number
          hour: number
          id: string
          meal_type: string | null
          minute: number
          name_ar: string
          name_en: string | null
          notes_ar: string | null
          planned_servings: number | null
          protein_g: number
          satisfied_by_slot_key: string | null
          serving_policy: string | null
          serving_size: number | null
          serving_unit: string | null
          servings: number
          slot_key: string
          slot_label: string
          slot_role: string | null
          slot_state: string
          sort_order: number
          source_external_id: string
          source_meal_id: string | null
          time_label: string
          updated_at: string
        }
        Insert: {
          allergens?: string[]
          assignment_id: string
          calories?: number
          carbs_g?: number
          counts_toward_day_totals?: boolean
          created_at?: string
          display_order?: number | null
          fat_g?: number
          hour: number
          id?: string
          meal_type?: string | null
          minute: number
          name_ar: string
          name_en?: string | null
          notes_ar?: string | null
          planned_servings?: number | null
          protein_g?: number
          satisfied_by_slot_key?: string | null
          serving_policy?: string | null
          serving_size?: number | null
          serving_unit?: string | null
          servings?: number
          slot_key: string
          slot_label: string
          slot_role?: string | null
          slot_state?: string
          sort_order?: number
          source_external_id: string
          source_meal_id?: string | null
          time_label: string
          updated_at?: string
        }
        Update: {
          allergens?: string[]
          assignment_id?: string
          calories?: number
          carbs_g?: number
          counts_toward_day_totals?: boolean
          created_at?: string
          display_order?: number | null
          fat_g?: number
          hour?: number
          id?: string
          meal_type?: string | null
          minute?: number
          name_ar?: string
          name_en?: string | null
          notes_ar?: string | null
          planned_servings?: number | null
          protein_g?: number
          satisfied_by_slot_key?: string | null
          serving_policy?: string | null
          serving_size?: number | null
          serving_unit?: string | null
          servings?: number
          slot_key?: string
          slot_label?: string
          slot_role?: string | null
          slot_state?: string
          sort_order?: number
          source_external_id?: string
          source_meal_id?: string | null
          time_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_nutrition_slots_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "client_nutrition_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_nutrition_slots_satisfied_by_fk"
            columns: ["assignment_id", "satisfied_by_slot_key"]
            isOneToOne: false
            referencedRelation: "client_nutrition_slots"
            referencedColumns: ["assignment_id", "slot_key"]
          },
          {
            foreignKeyName: "client_nutrition_slots_source_meal_id_fkey"
            columns: ["source_meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      client_nutrition_targets: {
        Row: {
          calories: number
          carbs_g: number
          client_id: string
          created_at: string
          created_by: string | null
          fat_g: number
          goal_context: string
          id: string
          nutrition_objective: string
          previous_target_id: string | null
          protein_g: number
          reference_weight_kg: number | null
          reference_weight_source: string | null
          status: string
          strategy_version: string
          superseded_at: string | null
          target_reason: string
          target_source: string
          version: number
        }
        Insert: {
          calories: number
          carbs_g: number
          client_id: string
          created_at?: string
          created_by?: string | null
          fat_g: number
          goal_context: string
          id?: string
          nutrition_objective: string
          previous_target_id?: string | null
          protein_g: number
          reference_weight_kg?: number | null
          reference_weight_source?: string | null
          status?: string
          strategy_version: string
          superseded_at?: string | null
          target_reason: string
          target_source: string
          version: number
        }
        Update: {
          calories?: number
          carbs_g?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          fat_g?: number
          goal_context?: string
          id?: string
          nutrition_objective?: string
          previous_target_id?: string | null
          protein_g?: number
          reference_weight_kg?: number | null
          reference_weight_source?: string | null
          status?: string
          strategy_version?: string
          superseded_at?: string | null
          target_reason?: string
          target_source?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_nutrition_targets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_nutrition_targets_previous_target_id_fkey"
            columns: ["previous_target_id"]
            isOneToOne: false
            referencedRelation: "client_nutrition_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      client_program_assignments: {
        Row: {
          archived_at: string | null
          assigned_at: string
          assigned_by: string | null
          client_id: string
          created_at: string
          days_per_week: number | null
          duration_weeks: number | null
          ended_at: string | null
          generation_source: string
          goal: string | null
          id: string
          level: string | null
          name_ar: string | null
          name_en: string | null
          source_template_id: string | null
          starts_on: string | null
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
          days_per_week?: number | null
          duration_weeks?: number | null
          ended_at?: string | null
          generation_source?: string
          goal?: string | null
          id?: string
          level?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_template_id?: string | null
          starts_on?: string | null
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
          days_per_week?: number | null
          duration_weeks?: number | null
          ended_at?: string | null
          generation_source?: string
          goal?: string | null
          id?: string
          level?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_template_id?: string | null
          starts_on?: string | null
          status?: string
          template_version?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_program_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_program_assignments_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "program_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      client_program_days: {
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
            foreignKeyName: "client_program_days_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "client_program_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      client_program_exercises: {
        Row: {
          created_at: string
          day_id: string
          exercise_external_id: string
          exercise_id: string | null
          exercise_name_ar: string
          exercise_name_en: string | null
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
          exercise_external_id: string
          exercise_id?: string | null
          exercise_name_ar: string
          exercise_name_en?: string | null
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
          exercise_external_id?: string
          exercise_id?: string | null
          exercise_name_ar?: string
          exercise_name_en?: string | null
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
            foreignKeyName: "client_program_exercises_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "client_program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_program_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      client_program_weeks: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          notes_ar: string | null
          title_ar: string | null
          updated_at: string
          week_number: number
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          notes_ar?: string | null
          title_ar?: string | null
          updated_at?: string
          week_number: number
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          notes_ar?: string | null
          title_ar?: string | null
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_program_weeks_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "client_program_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      client_training_levels: {
        Row: {
          created_at: string
          level_confidence: string | null
          prescription_state: string | null
          training_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          level_confidence?: string | null
          prescription_state?: string | null
          training_level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          level_confidence?: string | null
          prescription_state?: string | null
          training_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_training_safety_signals: {
        Row: {
          created_at: string
          exercise_external_id: string | null
          id: string
          safety_reason: string | null
          safety_signal: string
          set_log_id: string | null
          user_id: string
          workout_session_id: string | null
        }
        Insert: {
          created_at?: string
          exercise_external_id?: string | null
          id?: string
          safety_reason?: string | null
          safety_signal: string
          set_log_id?: string | null
          user_id: string
          workout_session_id?: string | null
        }
        Update: {
          created_at?: string
          exercise_external_id?: string | null
          id?: string
          safety_reason?: string | null
          safety_signal?: string
          set_log_id?: string | null
          user_id?: string
          workout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_training_safety_signals_set_log_id_fkey"
            columns: ["set_log_id"]
            isOneToOne: false
            referencedRelation: "workout_set_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_training_safety_signals_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "coach_client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
        Relationships: [
          {
            foreignKeyName: "coaching_attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coaching_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "coaching_messages"
            referencedColumns: ["id"]
          },
        ]
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
          last_message_kind:
            | Database["public"]["Enums"]["coaching_message_kind"]
            | null
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
          last_message_kind?:
            | Database["public"]["Enums"]["coaching_message_kind"]
            | null
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
          last_message_kind?:
            | Database["public"]["Enums"]["coaching_message_kind"]
            | null
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
        Relationships: [
          {
            foreignKeyName: "coaching_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coaching_conversations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "coaching_notifications_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coaching_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "coaching_messages"
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
          workout_session_id: string | null
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
          workout_session_id?: string | null
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
          workout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_readiness_checks_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      discover_categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          image_path: string | null
          name_ar: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          image_path?: string | null
          name_ar: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          image_path?: string | null
          name_ar?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      discover_content: {
        Row: {
          access_level: Database["public"]["Enums"]["discover_access_level"]
          author_id: string | null
          author_name: string | null
          body: string
          category_id: string | null
          content_type: Database["public"]["Enums"]["discover_content_type"]
          cover_image_path: string | null
          created_at: string
          created_by: string | null
          featured: boolean
          id: string
          language: string
          publish_at: string | null
          published_by: string | null
          reading_time_minutes: number | null
          seo_description: string | null
          seo_title: string | null
          short_description: string
          slug: string
          sort_priority: number
          status: Database["public"]["Enums"]["discover_content_status"]
          tags: string[]
          title: string
          type_payload: Json
          updated_at: string
          updated_by: string | null
          video_duration_seconds: number | null
          video_source: string | null
          view_count: number
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["discover_access_level"]
          author_id?: string | null
          author_name?: string | null
          body?: string
          category_id?: string | null
          content_type: Database["public"]["Enums"]["discover_content_type"]
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          featured?: boolean
          id?: string
          language?: string
          publish_at?: string | null
          published_by?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string
          slug: string
          sort_priority?: number
          status?: Database["public"]["Enums"]["discover_content_status"]
          tags?: string[]
          title: string
          type_payload?: Json
          updated_at?: string
          updated_by?: string | null
          video_duration_seconds?: number | null
          video_source?: string | null
          view_count?: number
        }
        Update: {
          access_level?: Database["public"]["Enums"]["discover_access_level"]
          author_id?: string | null
          author_name?: string | null
          body?: string
          category_id?: string | null
          content_type?: Database["public"]["Enums"]["discover_content_type"]
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          featured?: boolean
          id?: string
          language?: string
          publish_at?: string | null
          published_by?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string
          slug?: string
          sort_priority?: number
          status?: Database["public"]["Enums"]["discover_content_status"]
          tags?: string[]
          title?: string
          type_payload?: Json
          updated_at?: string
          updated_by?: string | null
          video_duration_seconds?: number | null
          video_source?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "discover_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "discover_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      discover_content_likes: {
        Row: {
          content_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discover_content_likes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "discover_content"
            referencedColumns: ["id"]
          },
        ]
      }
      discover_content_saves: {
        Row: {
          content_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discover_content_saves_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "discover_content"
            referencedColumns: ["id"]
          },
        ]
      }
      discover_success_consents: {
        Row: {
          allowed_fields: Json
          approved_at: string
          approved_channels: string[]
          approved_text: string
          consent_version: string
          content_id: string
          created_at: string
          display_name: string
          id: string
          withdrawn_at: string | null
        }
        Insert: {
          allowed_fields?: Json
          approved_at: string
          approved_channels?: string[]
          approved_text: string
          consent_version: string
          content_id: string
          created_at?: string
          display_name: string
          id?: string
          withdrawn_at?: string | null
        }
        Update: {
          allowed_fields?: Json
          approved_at?: string
          approved_channels?: string[]
          approved_text?: string
          consent_version?: string
          content_id?: string
          created_at?: string
          display_name?: string
          id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discover_success_consents_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "discover_content"
            referencedColumns: ["id"]
          },
        ]
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
          beginner_eligible: boolean | null
          coach_notes: string | null
          complexity: string | null
          conditioning_class: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["exercise_difficulty"] | null
          duration_seconds: number
          equipment: string | null
          equipment_state: string
          execution_sides: string | null
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
          is_bodyweight: boolean | null
          is_unilateral: boolean | null
          loading_type: string | null
          location_compatibility: string[]
          mechanics: string | null
          metadata: Json
          muscle_contributions: Json
          muscle_group_id: string
          name_ar: string
          name_en: string
          prescription_mode: string | null
          primary_movement_role: string | null
          primary_muscle: string | null
          primary_muscle_canonical: string | null
          required_equipment: string[]
          secondary_movement_roles: string[]
          secondary_muscles: string[]
          secondary_muscles_canonical: string[]
          slug: string
          sort_order: number
          substitution_group: string | null
          supports_timed_prescription: boolean | null
          thumbnail_path: string | null
          updated_at: string
          v2_metadata_status: string
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
          beginner_eligible?: boolean | null
          coach_notes?: string | null
          complexity?: string | null
          conditioning_class?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["exercise_difficulty"] | null
          duration_seconds?: number
          equipment?: string | null
          equipment_state?: string
          execution_sides?: string | null
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
          is_bodyweight?: boolean | null
          is_unilateral?: boolean | null
          loading_type?: string | null
          location_compatibility?: string[]
          mechanics?: string | null
          metadata?: Json
          muscle_contributions?: Json
          muscle_group_id: string
          name_ar: string
          name_en: string
          prescription_mode?: string | null
          primary_movement_role?: string | null
          primary_muscle?: string | null
          primary_muscle_canonical?: string | null
          required_equipment?: string[]
          secondary_movement_roles?: string[]
          secondary_muscles?: string[]
          secondary_muscles_canonical?: string[]
          slug: string
          sort_order?: number
          substitution_group?: string | null
          supports_timed_prescription?: boolean | null
          thumbnail_path?: string | null
          updated_at?: string
          v2_metadata_status?: string
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
          beginner_eligible?: boolean | null
          coach_notes?: string | null
          complexity?: string | null
          conditioning_class?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["exercise_difficulty"] | null
          duration_seconds?: number
          equipment?: string | null
          equipment_state?: string
          execution_sides?: string | null
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
          is_bodyweight?: boolean | null
          is_unilateral?: boolean | null
          loading_type?: string | null
          location_compatibility?: string[]
          mechanics?: string | null
          metadata?: Json
          muscle_contributions?: Json
          muscle_group_id?: string
          name_ar?: string
          name_en?: string
          prescription_mode?: string | null
          primary_movement_role?: string | null
          primary_muscle?: string | null
          primary_muscle_canonical?: string | null
          required_equipment?: string[]
          secondary_movement_roles?: string[]
          secondary_muscles?: string[]
          secondary_muscles_canonical?: string[]
          slug?: string
          sort_order?: number
          substitution_group?: string | null
          supports_timed_prescription?: boolean | null
          thumbnail_path?: string | null
          updated_at?: string
          v2_metadata_status?: string
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
      media_consents: {
        Row: {
          asset_ids: string[] | null
          created_at: string
          granted: boolean
          id: string
          scope: string
          user_id: string
          version: string | null
        }
        Insert: {
          asset_ids?: string[] | null
          created_at?: string
          granted: boolean
          id?: string
          scope: string
          user_id: string
          version?: string | null
        }
        Update: {
          asset_ids?: string[] | null
          created_at?: string
          granted?: boolean
          id?: string
          scope?: string
          user_id?: string
          version?: string | null
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
          current_period_end: string | null
          current_period_start: string | null
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
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          source: string
          starts_at: string
          subscription_activated_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          billing_period_months?: number | null
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          last_renewal_reminder_at?: string | null
          next_renewal_at?: string | null
          paid_period_end?: string | null
          payment_succeeded_at?: string | null
          personal_program_delivered_at?: string | null
          personal_program_started_at?: string | null
          premium_access_granted_at?: string | null
          price_amount?: number | null
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          source?: string
          starts_at?: string
          subscription_activated_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          billing_period_months?: number | null
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          last_renewal_reminder_at?: string | null
          next_renewal_at?: string | null
          paid_period_end?: string | null
          payment_succeeded_at?: string | null
          personal_program_delivered_at?: string | null
          personal_program_started_at?: string | null
          premium_access_granted_at?: string | null
          price_amount?: number | null
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          source?: string
          starts_at?: string
          subscription_activated_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
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
      nutrition_decision_traces: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          assignment_id: string | null
          client_id: string
          created_at: string
          id: string
          metadata: Json
          reason: string
          strategy_version: string
          summary: string
          target_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          assignment_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          metadata?: Json
          reason: string
          strategy_version: string
          summary: string
          target_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          assignment_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string
          strategy_version?: string
          summary?: string
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_decision_traces_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "client_nutrition_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_decision_traces_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_decision_traces_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "client_nutrition_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_meal_swaps: {
        Row: {
          created_at: string
          from_meal_id: string | null
          id: string
          swap_date: string
          to_meal_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          from_meal_id?: string | null
          id?: string
          swap_date: string
          to_meal_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          from_meal_id?: string | null
          id?: string
          swap_date?: string
          to_meal_id?: string | null
          user_id?: string
        }
        Relationships: []
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
      payment_provider_events: {
        Row: {
          error_code: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          payload_hash: string | null
          processed_at: string | null
          processing_status: string
          provider: string
          provider_event_id: string
          received_at: string
          user_id: string | null
        }
        Insert: {
          error_code?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json
          payload_hash?: string | null
          processed_at?: string | null
          processing_status?: string
          provider: string
          provider_event_id: string
          received_at?: string
          user_id?: string | null
        }
        Update: {
          error_code?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          payload_hash?: string | null
          processed_at?: string | null
          processing_status?: string
          provider?: string
          provider_event_id?: string
          received_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          billing_period_months: number | null
          created_at: string
          currency: string
          id: string
          membership_id: string | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string | null
          plan_id: string | null
          proof_url: string | null
          provider: string | null
          provider_event_id: string | null
          provider_payment_id: string | null
          reference: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_period_months?: number | null
          created_at?: string
          currency?: string
          id?: string
          membership_id?: string | null
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string | null
          plan_id?: string | null
          proof_url?: string | null
          provider?: string | null
          provider_event_id?: string | null
          provider_payment_id?: string | null
          reference?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_period_months?: number | null
          created_at?: string
          currency?: string
          id?: string
          membership_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string | null
          plan_id?: string | null
          proof_url?: string | null
          provider?: string | null
          provider_event_id?: string | null
          provider_payment_id?: string | null
          reference?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
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
      policy_acceptances: {
        Row: {
          accepted_at: string
          amount: number | null
          billing_period_months: number | null
          checkout_disclosure_version: string | null
          consent_text: string | null
          currency: string | null
          id: string
          language: string | null
          plan: string | null
          policy: string
          renewal_disclosure_version: string | null
          source: string
          user_id: string | null
          version: string
        }
        Insert: {
          accepted_at?: string
          amount?: number | null
          billing_period_months?: number | null
          checkout_disclosure_version?: string | null
          consent_text?: string | null
          currency?: string | null
          id?: string
          language?: string | null
          plan?: string | null
          policy: string
          renewal_disclosure_version?: string | null
          source?: string
          user_id?: string | null
          version: string
        }
        Update: {
          accepted_at?: string
          amount?: number | null
          billing_period_months?: number | null
          checkout_disclosure_version?: string | null
          consent_text?: string | null
          currency?: string | null
          id?: string
          language?: string | null
          plan?: string | null
          policy?: string
          renewal_disclosure_version?: string | null
          source?: string
          user_id?: string | null
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_deleted_at: string | null
          account_status: string
          account_status_changed_at: string | null
          account_status_changed_by: string | null
          account_status_reason: string | null
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
          account_deleted_at?: string | null
          account_status?: string
          account_status_changed_at?: string | null
          account_status_changed_by?: string | null
          account_status_reason?: string | null
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
          account_deleted_at?: string | null
          account_status?: string
          account_status_changed_at?: string | null
          account_status_changed_by?: string | null
          account_status_reason?: string | null
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
      provider_product_map: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_public_sale: boolean
          provider: string
          provider_price_id: string | null
          provider_product_id: string | null
          term_months: number
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_public_sale?: boolean
          provider: string
          provider_price_id?: string | null
          provider_product_id?: string | null
          term_months: number
          tier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_public_sale?: boolean
          provider?: string
          provider_price_id?: string | null
          provider_product_id?: string | null
          term_months?: number
          tier?: string
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
      renewal_reminders: {
        Row: {
          channel: string
          created_at: string
          expected_amount: number | null
          id: string
          membership_id: string
          plan: string | null
          planned_for: string
          renewal_at: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          expected_amount?: number | null
          id?: string
          membership_id: string
          plan?: string | null
          planned_for: string
          renewal_at?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          expected_amount?: number | null
          id?: string
          membership_id?: string
          plan?: string | null
          planned_for?: string
          renewal_at?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_reminders_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          display_name: string | null
          granted_at: string
          granted_by: string | null
          staff_role: Database["public"]["Enums"]["staff_role"]
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          granted_at?: string
          granted_by?: string | null
          staff_role: Database["public"]["Enums"]["staff_role"]
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          granted_at?: string
          granted_by?: string | null
          staff_role?: Database["public"]["Enums"]["staff_role"]
          status?: string
          updated_at?: string
          user_id?: string
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
      training_goal_legacy_map: {
        Row: {
          canonical_id: string | null
          created_at: string
          legacy_id: string
          mapping_status: string
          notes: string | null
        }
        Insert: {
          canonical_id?: string | null
          created_at?: string
          legacy_id: string
          mapping_status: string
          notes?: string | null
        }
        Update: {
          canonical_id?: string | null
          created_at?: string
          legacy_id?: string
          mapping_status?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_goal_legacy_map_canonical_id_fkey"
            columns: ["canonical_id"]
            isOneToOne: false
            referencedRelation: "training_goal_profiles"
            referencedColumns: ["canonical_id"]
          },
        ]
      }
      training_goal_profiles: {
        Row: {
          body_composition_dependency: boolean
          canonical_id: string
          created_at: string
          label_ar: string
          status: string
        }
        Insert: {
          body_composition_dependency?: boolean
          canonical_id: string
          created_at?: string
          label_ar: string
          status?: string
        }
        Update: {
          body_composition_dependency?: boolean
          canonical_id?: string
          created_at?: string
          label_ar?: string
          status?: string
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
      workout_sessions: {
        Row: {
          assignment_day_id: string | null
          assignment_id: string | null
          completed_at: string | null
          completed_exercise_count: number | null
          completed_working_sets: number | null
          counters_authority: string
          created_at: string
          id: string
          last_activity_at: string
          prescribed_exercise_count: number | null
          prescribed_working_sets: number | null
          program_template_id: string | null
          session_date: string
          session_key: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_day_id?: string | null
          assignment_id?: string | null
          completed_at?: string | null
          completed_exercise_count?: number | null
          completed_working_sets?: number | null
          counters_authority?: string
          created_at?: string
          id?: string
          last_activity_at?: string
          prescribed_exercise_count?: number | null
          prescribed_working_sets?: number | null
          program_template_id?: string | null
          session_date?: string
          session_key: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_day_id?: string | null
          assignment_id?: string | null
          completed_at?: string | null
          completed_exercise_count?: number | null
          completed_working_sets?: number | null
          counters_authority?: string
          created_at?: string
          id?: string
          last_activity_at?: string
          prescribed_exercise_count?: number | null
          prescribed_working_sets?: number | null
          program_template_id?: string | null
          session_date?: string
          session_key?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_assignment_day_id_fkey"
            columns: ["assignment_day_id"]
            isOneToOne: false
            referencedRelation: "client_program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "client_program_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_program_template_id_fkey"
            columns: ["program_template_id"]
            isOneToOne: false
            referencedRelation: "program_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_set_logs: {
        Row: {
          actual_duration_seconds: number | null
          actual_load: number | null
          actual_reps: number | null
          actual_rest_seconds: number | null
          assignment_exercise_id: string | null
          assignment_id: string | null
          completed_at: string | null
          created_at: string
          effort: Database["public"]["Enums"]["workout_effort_level"] | null
          effort_v2: string | null
          exercise_external_id: string
          exercise_id: string | null
          id: string
          notes: string | null
          prescribed_duration_seconds: number | null
          prescribed_load: number | null
          prescribed_reps_max: number | null
          prescribed_reps_min: number | null
          prescribed_rest_seconds: number | null
          reps: number | null
          rest_completed_at: string | null
          rest_started_at: string | null
          session_date: string
          set_completed: boolean | null
          set_number: number
          set_type: string | null
          skipped: boolean
          started_at: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
          workout_session_id: string | null
        }
        Insert: {
          actual_duration_seconds?: number | null
          actual_load?: number | null
          actual_reps?: number | null
          actual_rest_seconds?: number | null
          assignment_exercise_id?: string | null
          assignment_id?: string | null
          completed_at?: string | null
          created_at?: string
          effort?: Database["public"]["Enums"]["workout_effort_level"] | null
          effort_v2?: string | null
          exercise_external_id: string
          exercise_id?: string | null
          id?: string
          notes?: string | null
          prescribed_duration_seconds?: number | null
          prescribed_load?: number | null
          prescribed_reps_max?: number | null
          prescribed_reps_min?: number | null
          prescribed_rest_seconds?: number | null
          reps?: number | null
          rest_completed_at?: string | null
          rest_started_at?: string | null
          session_date?: string
          set_completed?: boolean | null
          set_number: number
          set_type?: string | null
          skipped?: boolean
          started_at?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
          workout_session_id?: string | null
        }
        Update: {
          actual_duration_seconds?: number | null
          actual_load?: number | null
          actual_reps?: number | null
          actual_rest_seconds?: number | null
          assignment_exercise_id?: string | null
          assignment_id?: string | null
          completed_at?: string | null
          created_at?: string
          effort?: Database["public"]["Enums"]["workout_effort_level"] | null
          effort_v2?: string | null
          exercise_external_id?: string
          exercise_id?: string | null
          id?: string
          notes?: string | null
          prescribed_duration_seconds?: number | null
          prescribed_load?: number | null
          prescribed_reps_max?: number | null
          prescribed_reps_min?: number | null
          prescribed_rest_seconds?: number | null
          reps?: number | null
          rest_completed_at?: string | null
          rest_started_at?: string | null
          session_date?: string
          set_completed?: boolean | null
          set_number?: number
          set_type?: string | null
          skipped?: boolean
          started_at?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
          workout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_set_logs_assignment_exercise_id_fkey"
            columns: ["assignment_exercise_id"]
            isOneToOne: false
            referencedRelation: "client_program_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "client_program_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_logs_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _admin_save_client_nutrition_slots_legacy: {
        Args: {
          p_admin: string
          p_assignment_id: string
          p_client_id: string
          p_payload: Json
        }
        Returns: undefined
      }
      _allergen_overlap: {
        Args: { p_left: string[]; p_right: string[] }
        Returns: boolean
      }
      _assign_generated_v2_program_snapshot: {
        Args: {
          p_assigned_by: string
          p_client_id: string
          p_generation_status: string
          p_payload: Json
          p_replace: boolean
          p_starts_on: string
          p_validation_status: string
        }
        Returns: Json
      }
      _assignment_tree: { Args: { p_id: string }; Returns: Json }
      _copy_meals_to_nutrition_assignment: {
        Args: { p_assignment_id: string; p_slots: Json }
        Returns: undefined
      }
      _copy_template_to_assignment: {
        Args: { p_assignment_id: string; p_template_id: string }
        Returns: undefined
      }
      _nutrition_insert_slots_from_payload: {
        Args: { p_assignment_id: string; p_slots: Json }
        Returns: undefined
      }
      _nutrition_planned_totals: {
        Args: { p_assignment_id: string }
        Returns: {
          calories: number
          carbs_g: number
          fat_g: number
          protein_g: number
        }[]
      }
      _nutrition_slot_meta: {
        Args: { p_key: string }
        Returns: {
          hour: number
          minute: number
          slot_label: string
          sort_order: number
          time_label: string
        }[]
      }
      _nutrition_strategy_guard_allergy: {
        Args: { p_client_id: string }
        Returns: undefined
      }
      _nutrition_tree: { Args: { p_id: string }; Returns: Json }
      _require_admin: { Args: never; Returns: string }
      _require_staff_permission: {
        Args: { p_permission: string }
        Returns: string
      }
      _resolve_active_membership: {
        Args: { _user_id: string }
        Returns: {
          auto_renew: boolean
          billing_period_months: number | null
          cancel_at_period_end: boolean
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
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
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          source: string
          starts_at: string
          subscription_activated_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _tier_capability_features: { Args: { _tier: string }; Returns: Json }
      _utc_membership_day: { Args: never; Returns: string }
      _write_audit_event: {
        Args: {
          p_actor: string
          p_metadata?: Json
          p_subject: string
          p_type: string
        }
        Returns: undefined
      }
      accept_checkout_policies: {
        Args: {
          p_amount: number
          p_billing_period_months: number
          p_checkout_disclosure_version: string
          p_consent_text: string
          p_currency: string
          p_plan: string
          p_policy_version: string
          p_privacy_version: string
          p_refund_policy_version: string
          p_renewal_disclosure_version: string
          p_terms_version: string
        }
        Returns: Json
      }
      accept_policy_version: {
        Args: { p_language?: string; p_policy: string; p_version: string }
        Returns: Json
      }
      admin_add_client_note: {
        Args: { p_body: string; p_client_id: string }
        Returns: string
      }
      admin_apply_membership_override: {
        Args: {
          p_billing_period_months?: number
          p_client_id: string
          p_reason?: string
          p_tier: string
        }
        Returns: Json
      }
      admin_archive_client_note: {
        Args: { p_note_id: string }
        Returns: undefined
      }
      admin_archive_program_template: { Args: { p_id: string }; Returns: Json }
      admin_assign_client_nutrition: {
        Args: {
          p_client_id: string
          p_payload: Json
          p_replace?: boolean
          p_starts_on?: string
        }
        Returns: Json
      }
      admin_assign_client_program: {
        Args: {
          p_client_id: string
          p_replace?: boolean
          p_starts_on?: string
          p_template_id: string
        }
        Returns: Json
      }
      admin_assign_generated_v2_program: {
        Args: {
          p_client_id: string
          p_generation_status: string
          p_payload: Json
          p_replace: boolean
          p_starts_on: string
          p_validation_status: string
        }
        Returns: Json
      }
      admin_end_client_nutrition: {
        Args: { p_assignment_id: string; p_status?: string }
        Returns: Json
      }
      admin_end_client_program: {
        Args: { p_assignment_id: string; p_status?: string }
        Returns: Json
      }
      admin_execute_client_account_deletion: {
        Args: {
          p_client_id: string
          p_confirmation_email: string
          p_idempotency_key: string
          p_reason: string
        }
        Returns: Json
      }
      admin_exercise_filter_options: { Args: never; Returns: Json }
      admin_generate_client_nutrition: {
        Args: {
          p_client_id: string
          p_payload: Json
          p_replace?: boolean
          p_starts_on?: string
        }
        Returns: Json
      }
      admin_get_client_assignment: {
        Args: { p_assignment_id: string }
        Returns: Json
      }
      admin_get_client_nutrition_assignment: {
        Args: { p_assignment_id: string }
        Returns: Json
      }
      admin_get_client_overview: {
        Args: { p_client_id: string }
        Returns: Json
      }
      admin_get_discover_content: { Args: { p_id: string }; Returns: Json }
      admin_get_exercise: { Args: { p_id: string }; Returns: Json }
      admin_get_meal: { Args: { p_id: string }; Returns: Json }
      admin_get_operations_snapshot: { Args: never; Returns: Json }
      admin_get_program_template: { Args: { p_id: string }; Returns: Json }
      admin_get_staff_session: { Args: never; Returns: Json }
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
      admin_list_audit_events: {
        Args: {
          p_event_type?: string
          p_limit?: number
          p_offset?: number
          p_subject_user_id?: string
        }
        Returns: {
          actor_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
          subject_user_id: string
        }[]
      }
      admin_list_client_adaptive_decisions: {
        Args: { p_client_id: string; p_limit?: number }
        Returns: Json
      }
      admin_list_client_assignments: {
        Args: { p_client_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          assigned_at: string
          ended_at: string
          id: string
          name_ar: string
          snapshot_complete: boolean
          source_template_id: string
          starts_on: string
          status: string
          template_version: number
          total_count: number
        }[]
      }
      admin_list_client_notes: {
        Args: {
          p_client_id: string
          p_include_archived?: boolean
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          archived_at: string
          author_id: string
          body: string
          client_id: string
          created_at: string
          id: string
          updated_at: string
        }[]
      }
      admin_list_client_nutrition_assignments: {
        Args: { p_client_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          allergen_conflict: boolean
          assigned_at: string
          ended_at: string
          id: string
          name_ar: string
          snapshot_complete: boolean
          starts_on: string
          status: string
          total_count: number
        }[]
      }
      admin_list_client_nutrition_logs: {
        Args: { p_client_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          assignment_id: string
          created_at: string
          id: string
          session_date: string
          slot_key: string
          source_external_id: string
          status: string
          total_count: number
        }[]
      }
      admin_list_client_set_logs: {
        Args: {
          p_client_id: string
          p_exercise_id?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          assignment_id: string
          created_at: string
          effort: Database["public"]["Enums"]["workout_effort_level"]
          exercise_external_id: string
          exercise_id: string
          id: string
          reps: number
          session_date: string
          set_number: number
          skipped: boolean
          total_count: number
          weight_kg: number
        }[]
      }
      admin_list_clients: {
        Args: {
          p_account_status?: string
          p_limit?: number
          p_offset?: number
          p_onboarding?: string
          p_plan?: string
          p_query?: string
        }
        Returns: {
          account_status: string
          avatar_path: string
          city: string
          created_at: string
          email: string
          full_name: string
          goal: string
          id: string
          last_activity_at: string
          membership_active: boolean
          membership_plan: string
          onboarding_completed_at: string
          phone: string
          total_count: number
          unread_coaching_count: number
          waiting_coaching: boolean
        }[]
      }
      admin_list_coaching_inbox: {
        Args: {
          p_search?: string
          p_status?: Database["public"]["Enums"]["coaching_conversation_status"]
        }
        Returns: {
          created_at: string
          id: string
          last_actor: Database["public"]["Enums"]["coaching_actor"]
          last_message_at: string
          last_message_kind: Database["public"]["Enums"]["coaching_message_kind"]
          last_message_preview: string
          member_avatar_path: string
          member_email: string
          member_goal: string
          member_id: string
          member_name: string
          membership_tier: string
          status: Database["public"]["Enums"]["coaching_conversation_status"]
          unread_count: number
        }[]
      }
      admin_list_discover_categories: { Args: never; Returns: Json }
      admin_list_discover_content: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_status?: string
          p_type?: string
        }
        Returns: {
          author_name: string
          content_type: Database["public"]["Enums"]["discover_content_type"]
          featured: boolean
          id: string
          publish_at: string
          slug: string
          status: Database["public"]["Enums"]["discover_content_status"]
          title: string
          total_count: number
          updated_at: string
        }[]
      }
      admin_list_exercises: {
        Args: {
          p_active?: boolean
          p_difficulty?: string
          p_equipment?: string
          p_limit?: number
          p_muscle?: string
          p_offset?: number
          p_query?: string
          p_type?: string
        }
        Returns: {
          difficulty: Database["public"]["Enums"]["exercise_difficulty"]
          equipment: string
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          external_id: string
          id: string
          instructions_status: Database["public"]["Enums"]["exercise_media_status"]
          is_active: boolean
          muscle_group_name_ar: string
          name_ar: string
          name_en: string
          primary_muscle: string
          slug: string
          thumbnail_path: string
          total_count: number
          updated_at: string
          v2_metadata_status: string
          video_status: Database["public"]["Enums"]["exercise_media_status"]
        }[]
      }
      admin_list_meals: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_status?: string
          p_type?: string
        }
        Returns: {
          calories: number
          carbs_g: number
          external_id: string
          fat_g: number
          id: string
          image_status: Database["public"]["Enums"]["meal_image_status"]
          image_thumb_path: string
          is_active: boolean
          meal_type: Database["public"]["Enums"]["meal_type"]
          name_ar: string
          name_en: string
          protein_g: number
          review_status: string
          status: Database["public"]["Enums"]["meal_library_status"]
          total_count: number
          updated_at: string
        }[]
      }
      admin_list_member_subscriptions: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          auto_renew: boolean
          billing_period_months: number
          cancel_at_period_end: boolean
          currency: string
          current_period_end: string
          current_period_start: string
          email: string
          exception_state: string
          full_name: string
          is_active: boolean
          last_payment_at: string
          last_payment_status: string
          next_renewal_at: string
          paid_period_end: string
          price_amount: number
          provider: string
          subscription_status: string
          tier: string
          user_id: string
        }[]
      }
      admin_list_payment_exceptions: {
        Args: never
        Returns: {
          detail: string
          exception_id: string
          exception_type: string
          href: string
          occurred_at: string
          priority: string
          subject_label: string
        }[]
      }
      admin_list_payment_provider_events: {
        Args: { p_limit?: number; p_offset?: number; p_status?: string }
        Returns: {
          email: string
          error_code: string
          error_summary: string
          event_type: string
          id: string
          processed_at: string
          processing_status: string
          provider: string
          provider_event_id: string
          received_at: string
          user_id: string
        }[]
      }
      admin_list_program_templates: {
        Args: {
          p_goal?: string
          p_level?: string
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_status?: string
        }
        Returns: {
          archived_at: string
          assignment_count: number
          days_per_week: number
          duration_weeks: number
          goal: Database["public"]["Enums"]["program_goal"]
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["program_level"]
          name_ar: string
          name_en: string
          slug: string
          total_count: number
          updated_at: string
          version: number
        }[]
      }
      admin_list_psp_payments: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          amount: number
          billing_period_months: number
          created_at: string
          currency: string
          email: string
          id: string
          paid_at: string
          provider: string
          provider_payment_id: string
          refunded_at: string
          status: string
          tier: string
          user_id: string
        }[]
      }
      admin_list_staff_members: {
        Args: never
        Returns: {
          display_name: string
          email: string
          granted_at: string
          last_sign_in_at: string
          staff_role: string
          status: string
          user_id: string
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
      admin_list_support_tickets: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_status?: string
          p_user_id?: string
        }
        Returns: {
          category: string
          created_at: string
          display_name: string
          email: string
          id: string
          status: string
          subject: string
          ticket_code: string
          updated_at: string
          user_id: string
        }[]
      }
      admin_preview_client_account_deletion: {
        Args: { p_client_id: string }
        Returns: Json
      }
      admin_publish_program_template: { Args: { p_id: string }; Returns: Json }
      admin_record_adaptive_decision: {
        Args: {
          p_assignment_id?: string
          p_client_id: string
          p_confidence: string
          p_decision_type: string
          p_evaluation_key: string
          p_input_snapshot: Json
          p_program_version?: number
          p_reason_code: string
        }
        Returns: Json
      }
      admin_replace_exercise_media: {
        Args: {
          p_asset: string
          p_expected_updated_at?: string
          p_id: string
          p_path: string
        }
        Returns: Json
      }
      admin_save_client_assignment_exercises: {
        Args: {
          p_assignment_id: string
          p_expected_updated_at?: string
          p_payload: Json
        }
        Returns: Json
      }
      admin_save_client_nutrition_slots: {
        Args: {
          p_assignment_id: string
          p_expected_updated_at?: string
          p_payload: Json
        }
        Returns: Json
      }
      admin_save_discover_content: {
        Args: { p_expected_updated_at?: string; p_payload: Json }
        Returns: Json
      }
      admin_save_exercise: {
        Args: { p_expected_updated_at?: string; p_payload: Json }
        Returns: Json
      }
      admin_save_hero_goal_card_theme: {
        Args: { p_gender: string; p_goal_id: string; p_payload: Json }
        Returns: Json
      }
      admin_save_hero_goal_framing: {
        Args: {
          p_asset_file_name: string
          p_gender: string
          p_goal_id: string
          p_payload: Json
        }
        Returns: Json
      }
      admin_save_meal: {
        Args: { p_expected_updated_at?: string; p_payload: Json }
        Returns: Json
      }
      admin_save_program_template: {
        Args: { p_expected_updated_at?: string; p_payload: Json }
        Returns: Json
      }
      admin_reset_hero_goal_setting: {
        Args: {
          p_asset_file_name?: string
          p_gender: string
          p_goal_id: string
          p_kind: string
        }
        Returns: Json
      }
      admin_set_client_account_status: {
        Args: { p_action: string; p_client_id: string; p_reason: string }
        Returns: Json
      }
      admin_set_coaching_conversation_status: {
        Args: {
          p_conversation_id: string
          p_status: Database["public"]["Enums"]["coaching_conversation_status"]
        }
        Returns: undefined
      }
      admin_set_discover_content_status: {
        Args: { p_id: string; p_status: string }
        Returns: Json
      }
      admin_set_exercise_active: {
        Args: { p_active: boolean; p_id: string }
        Returns: Json
      }
      admin_set_meal_status: {
        Args: { p_id: string; p_status: string }
        Returns: Json
      }
      admin_set_support_ticket_status: {
        Args: { p_status: string; p_ticket_id: string }
        Returns: undefined
      }
      admin_update_lead_payment_status: {
        Args: {
          p_lead_id: string
          p_payment_status: Database["public"]["Enums"]["payment_status"]
          p_reason?: string
        }
        Returns: undefined
      }
      admin_update_staff_role: {
        Args: {
          p_reason?: string
          p_staff_role: Database["public"]["Enums"]["staff_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      apply_provider_subscription_event: {
        Args: { p_event: Json }
        Returns: Json
      }
      can_access_coaching_conversation: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      cancel_my_renewal: { Args: never; Returns: Json }
      client_account_deletion_blockers: {
        Args: { p_client_id: string }
        Returns: Json
      }
      client_account_deletion_impact: { Args: never; Returns: Json }
      client_assign_generated_v2_program: {
        Args: {
          p_generation_status: string
          p_payload: Json
          p_replace: boolean
          p_starts_on: string
          p_validation_status: string
        }
        Returns: Json
      }
      client_ensure_exercise_experience: {
        Args: { p_external_id: string }
        Returns: Json
      }
      client_ensure_training_level: { Args: never; Returns: Json }
      client_ensure_workout_session: {
        Args: {
          p_assignment_day_id?: string
          p_assignment_id?: string
          p_prescribed_exercise_count?: number
          p_prescribed_working_sets?: number
          p_session_date?: string
          p_session_key: string
        }
        Returns: Json
      }
      client_get_hero_goal_settings: { Args: never; Returns: Json }
      client_get_active_workout_session: { Args: never; Returns: Json }
      client_get_my_nutrition_runtime: { Args: never; Returns: Json }
      client_get_my_training_runtime: { Args: never; Returns: Json }
      client_list_exercise_set_history: {
        Args: { p_external_id: string; p_limit?: number }
        Returns: Json
      }
      client_list_hidden_library_keys: { Args: never; Returns: Json }
      client_list_own_adaptive_decisions: {
        Args: { p_decision_types?: string[]; p_limit?: number }
        Returns: Json
      }
      client_log_nutrition_meal:
        | {
            Args: {
              p_session_date?: string
              p_slot_id: string
              p_status: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_consumed_servings?: number
              p_session_date?: string
              p_slot_id: string
              p_status: string
            }
            Returns: Json
          }
      client_map_legacy_goal: { Args: { p_legacy_id: string }; Returns: Json }
      client_update_workout_session_status: {
        Args: { p_session_id: string; p_status: string }
        Returns: Json
      }
      client_upsert_adaptive_decision: {
        Args: {
          p_assignment_id?: string
          p_confidence: string
          p_decision_type: string
          p_evaluation_key: string
          p_exercise_external_id?: string
          p_input_snapshot: Json
          p_program_version?: number
          p_reason_code: string
          p_workout_session_id?: string
        }
        Returns: Json
      }
      coaching_unread_count: { Args: never; Returns: number }
      create_lead: { Args: { p_payload: Json }; Returns: Json }
      create_onboarding_draft: { Args: { p_payload?: Json }; Returns: Json }
      create_support_ticket: {
        Args: {
          p_category: string
          p_email?: string
          p_language?: string
          p_message: string
          p_name?: string
          p_subject: string
        }
        Returns: Json
      }
      ensure_my_coaching_conversation: {
        Args: never
        Returns: {
          closed_at: string | null
          closed_by: string | null
          coach_last_read_at: string | null
          created_at: string
          id: string
          last_actor: Database["public"]["Enums"]["coaching_actor"] | null
          last_message_at: string | null
          last_message_kind:
            | Database["public"]["Enums"]["coaching_message_kind"]
            | null
          last_message_preview: string | null
          member_id: string
          member_last_read_at: string | null
          status: Database["public"]["Enums"]["coaching_conversation_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "coaching_conversations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      exercise_v2_is_eligible: {
        Args: { e: Database["public"]["Tables"]["exercises"]["Row"] }
        Returns: boolean
      }
      exercise_v2_validate_row: {
        Args: { e: Database["public"]["Tables"]["exercises"]["Row"] }
        Returns: undefined
      }
      finalize_onboarding: { Args: { p_draft_token: string }; Returns: Json }
      get_my_account_lifecycle: { Args: never; Returns: Json }
      get_my_billing: { Args: never; Returns: Json }
      get_my_entitlements: { Args: never; Returns: Json }
      get_my_membership: { Args: never; Returns: Json }
      get_my_onboarding_state: { Args: never; Returns: Json }
      get_my_payment_history: {
        Args: { p_limit?: number }
        Returns: {
          amount: number
          billing_period_months: number
          created_at: string
          currency: string
          id: string
          paid_at: string
          provider: string
          status: string
          tier: string
        }[]
      }
      grant_founder_review_access: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_staff_portal_access: { Args: { p_user_id: string }; Returns: boolean }
      is_coaching_chat_path: { Args: { p_path: string }; Returns: boolean }
      is_founder_review_email: { Args: { p_email: string }; Returns: boolean }
      is_own_avatar_path: { Args: { p_path: string }; Returns: boolean }
      is_proof_upload_reserved: { Args: { p_path: string }; Returns: boolean }
      list_coaching_messages: {
        Args: {
          p_before?: string
          p_before_id?: string
          p_conversation_id: string
          p_limit?: number
        }
        Returns: {
          actor: Database["public"]["Enums"]["coaching_actor"]
          attachment_kind: string
          body: string
          byte_size: number
          conversation_id: string
          created_at: string
          duration_ms: number
          id: string
          kind: Database["public"]["Enums"]["coaching_message_kind"]
          mime_type: string
          sender_id: string
          storage_path: string
        }[]
      }
      list_my_coaching_notifications: {
        Args: { p_limit?: number }
        Returns: {
          body: string | null
          conversation_id: string | null
          created_at: string
          id: string
          kind: string
          message_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "coaching_notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      map_legacy_effort_to_v2: {
        Args: { p_effort: Database["public"]["Enums"]["workout_effort_level"] }
        Returns: string
      }
      mark_coaching_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      mark_first_login_seen: { Args: never; Returns: Json }
      member_can_use_coach_chat: {
        Args: { _user_id: string }
        Returns: boolean
      }
      nutrition_apply_swap: {
        Args: { p_payload: Json; p_session_date?: string; p_slot_id: string }
        Returns: Json
      }
      nutrition_create_target: {
        Args: { p_client_id: string; p_payload: Json }
        Returns: Json
      }
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
      record_media_consent: {
        Args: {
          p_asset_ids?: string[]
          p_granted: boolean
          p_scope: string
          p_version?: string
        }
        Returns: Json
      }
      record_nutrition_meal_swap: {
        Args: {
          p_from_meal_id?: string
          p_swap_date?: string
          p_to_meal_id?: string
        }
        Returns: Json
      }
      request_account_deletion: { Args: { p_reason?: string }; Returns: Json }
      reserve_proof_upload: {
        Args: { p_access_token: string; p_file_ext: string; p_lead_id: string }
        Returns: string
      }
      resolve_staff_role: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["staff_role"]
      }
      send_coaching_message: {
        Args: {
          p_attachment_kind?: string
          p_body?: string
          p_byte_size?: number
          p_client_id?: string
          p_conversation_id: string
          p_duration_ms?: number
          p_kind: Database["public"]["Enums"]["coaching_message_kind"]
          p_message_id?: string
          p_mime_type?: string
          p_storage_path?: string
        }
        Returns: Json
      }
      staff_has_permission: {
        Args: { p_permission: string; p_user_id: string }
        Returns: boolean
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
      coaching_conversation_status:
        | "new"
        | "waiting_for_reply"
        | "replied"
        | "closed"
      coaching_message_kind: "text" | "image" | "voice" | "video"
      discover_access_level: "free" | "premium"
      discover_content_status:
        | "draft"
        | "scheduled"
        | "published"
        | "unpublished"
        | "archived"
      discover_content_type:
        | "article"
        | "video"
        | "recipe"
        | "success_story"
        | "challenge"
        | "daily_tip"
        | "platform_update"
        | "promotional"
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
        | "approved"
      program_day_type: "workout" | "rest" | "active_recovery"
      program_goal: "cut" | "bulk" | "fitness" | "recomp"
      program_level: "beginner" | "intermediate" | "advanced"
      staff_role:
        | "super_admin"
        | "coach"
        | "nutrition"
        | "support"
        | "finance"
        | "read_only"
      subscription_status:
        | "active"
        | "past_due"
        | "cancel_at_period_end"
        | "cancelled"
        | "expired"
        | "refunded"
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
      coaching_conversation_status: [
        "new",
        "waiting_for_reply",
        "replied",
        "closed",
      ],
      coaching_message_kind: ["text", "image", "voice", "video"],
      discover_access_level: ["free", "premium"],
      discover_content_status: [
        "draft",
        "scheduled",
        "published",
        "unpublished",
        "archived",
      ],
      discover_content_type: [
        "article",
        "video",
        "recipe",
        "success_story",
        "challenge",
        "daily_tip",
        "platform_update",
        "promotional",
      ],
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
        "approved",
      ],
      program_day_type: ["workout", "rest", "active_recovery"],
      program_goal: ["cut", "bulk", "fitness", "recomp"],
      program_level: ["beginner", "intermediate", "advanced"],
      staff_role: [
        "super_admin",
        "coach",
        "nutrition",
        "support",
        "finance",
        "read_only",
      ],
      subscription_status: [
        "active",
        "past_due",
        "cancel_at_period_end",
        "cancelled",
        "expired",
        "refunded",
      ],
      workout_effort_level: ["easy", "medium", "hard"],
    },
  },
} as const
{"_tag":"Error","error":{"code":"UnknownError","message":"Timeout while shutting down PostHog. Some events may not have been sent."}}
