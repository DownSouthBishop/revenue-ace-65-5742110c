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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          avg_job_value: number | null
          blackout_end: number | null
          blackout_start: number | null
          booking_link: string | null
          business_name: string
          business_number: string | null
          created_at: string | null
          daily_sms_cap: number
          forward_timeout_seconds: number
          google_review_link: string | null
          id: string
          industry: string | null
          owner_id: string
          respondfall_number: string | null
          send_delay_seconds: number | null
          sms_consent_text: string | null
          sms_template: string | null
          system_active: boolean | null
          terms_accepted_at: string | null
          timezone: string
          twilio_number_sid: string | null
          twilio_sid: string | null
        }
        Insert: {
          avg_job_value?: number | null
          blackout_end?: number | null
          blackout_start?: number | null
          booking_link?: string | null
          business_name: string
          business_number?: string | null
          created_at?: string | null
          daily_sms_cap?: number
          forward_timeout_seconds?: number
          google_review_link?: string | null
          id?: string
          industry?: string | null
          owner_id: string
          respondfall_number?: string | null
          send_delay_seconds?: number | null
          sms_consent_text?: string | null
          sms_template?: string | null
          system_active?: boolean | null
          terms_accepted_at?: string | null
          timezone?: string
          twilio_number_sid?: string | null
          twilio_sid?: string | null
        }
        Update: {
          avg_job_value?: number | null
          blackout_end?: number | null
          blackout_start?: number | null
          booking_link?: string | null
          business_name?: string
          business_number?: string | null
          created_at?: string | null
          daily_sms_cap?: number
          forward_timeout_seconds?: number
          google_review_link?: string | null
          id?: string
          industry?: string | null
          owner_id?: string
          respondfall_number?: string | null
          send_delay_seconds?: number | null
          sms_consent_text?: string | null
          sms_template?: string | null
          system_active?: boolean | null
          terms_accepted_at?: string | null
          timezone?: string
          twilio_number_sid?: string | null
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          appt_confirmed: boolean | null
          caller_number: string
          client_id: string
          created_at: string | null
          id: string
          intent: string | null
          last_reply_at: string | null
          sequence_step: number | null
          status: string | null
          urgency: string | null
        }
        Insert: {
          appt_confirmed?: boolean | null
          caller_number: string
          client_id: string
          created_at?: string | null
          id?: string
          intent?: string | null
          last_reply_at?: string | null
          sequence_step?: number | null
          status?: string | null
          urgency?: string | null
        }
        Update: {
          appt_confirmed?: boolean | null
          caller_number?: string
          client_id?: string
          created_at?: string | null
          id?: string
          intent?: string | null
          last_reply_at?: string | null
          sequence_step?: number | null
          status?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          ai_generated: boolean | null
          body: string
          caller_number: string
          client_id: string
          direction: string
          id: string
          sent_at: string | null
          status: string
          step_label: string | null
          twilio_sid: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          body: string
          caller_number: string
          client_id: string
          direction: string
          id?: string
          sent_at?: string | null
          status?: string
          step_label?: string | null
          twilio_sid?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          body?: string
          caller_number?: string
          client_id?: string
          direction?: string
          id?: string
          sent_at?: string | null
          status?: string
          step_label?: string | null
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      missed_calls: {
        Row: {
          call_sid: string | null
          called_at: string | null
          caller_number: string
          client_id: string
          id: string
          recording_url: string | null
          sequence_triggered: boolean | null
          transcript: string | null
          voicemail_url: string | null
        }
        Insert: {
          call_sid?: string | null
          called_at?: string | null
          caller_number: string
          client_id: string
          id?: string
          recording_url?: string | null
          sequence_triggered?: boolean | null
          transcript?: string | null
          voicemail_url?: string | null
        }
        Update: {
          call_sid?: string | null
          called_at?: string | null
          caller_number?: string
          client_id?: string
          id?: string
          recording_url?: string | null
          sequence_triggered?: boolean | null
          transcript?: string | null
          voicemail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missed_calls_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      opt_outs: {
        Row: {
          caller_number: string
          client_id: string
          created_at: string
          id: string
        }
        Insert: {
          caller_number: string
          client_id: string
          created_at?: string
          id?: string
        }
        Update: {
          caller_number?: string
          client_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          referral_code: string | null
          referred_name: string | null
          referrer_number: string | null
          status: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          referral_code?: string | null
          referred_name?: string | null
          referrer_number?: string | null
          status?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          referral_code?: string | null
          referred_name?: string | null
          referrer_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_messages: {
        Row: {
          attempts: number
          body: string
          caller_number: string
          client_id: string
          created_at: string
          id: string
          last_error: string | null
          send_at: string
          status: string
          step_label: string | null
        }
        Insert: {
          attempts?: number
          body: string
          caller_number: string
          client_id: string
          created_at?: string
          id?: string
          last_error?: string | null
          send_at: string
          status?: string
          step_label?: string | null
        }
        Update: {
          attempts?: number
          body?: string
          caller_number?: string
          client_id?: string
          created_at?: string
          id?: string
          last_error?: string | null
          send_at?: string
          status?: string
          step_label?: string | null
        }
        Relationships: []
      }
      system_health: {
        Row: {
          client_id: string
          consecutive_failures: number | null
          id: string
          last_error: string | null
          last_successful_send: string | null
          last_webhook_ping: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          consecutive_failures?: number | null
          id?: string
          last_error?: string | null
          last_successful_send?: string | null
          last_webhook_ping?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          consecutive_failures?: number | null
          id?: string
          last_error?: string | null
          last_successful_send?: string | null
          last_webhook_ping?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_health_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
