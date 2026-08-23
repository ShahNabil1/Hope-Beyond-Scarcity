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
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          completed_at: string | null
          email: string | null
          id: string
          requested_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          email?: string | null
          id?: string
          requested_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          email?: string | null
          id?: string
          requested_at?: string
          user_id?: string
        }
        Relationships: []
      }
      care_package_pitches: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          estimated_cost_cents: number | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          estimated_cost_cents?: number | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          estimated_cost_cents?: number | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          donation_type: string
          email: string | null
          environment: string
          id: string
          receipt_sent_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          donation_type?: string
          email?: string | null
          environment?: string
          id?: string
          receipt_sent_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          donation_type?: string
          email?: string | null
          environment?: string
          id?: string
          receipt_sent_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          capacity: number | null
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          event_type: string
          id: string
          is_active: boolean
          is_featured: boolean
          is_virtual: boolean
          registration_url: string | null
          slug: string
          sort_order: number
          starts_at: string
          summary: string
          timezone: string
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          capacity?: number | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_virtual?: boolean
          registration_url?: string | null
          slug: string
          sort_order?: number
          starts_at: string
          summary: string
          timezone?: string
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          capacity?: number | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_virtual?: boolean
          registration_url?: string | null
          slug?: string
          sort_order?: number
          starts_at?: string
          summary?: string
          timezone?: string
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      news_comments: {
        Row: {
          author_avatar_url: string | null
          author_name: string
          body: string
          created_at: string
          id: string
          is_hidden: boolean
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_name?: string
          body: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "news_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      news_posts: {
        Row: {
          author_name: string | null
          body: string | null
          category: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          gallery_images: string[]
          headline: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          location: string | null
          published_at: string
          read_minutes: number
          slug: string
          sort_order: number
          tags: string[]
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_name?: string | null
          body?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt: string
          gallery_images?: string[]
          headline?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          location?: string | null
          published_at?: string
          read_minutes?: number
          slug: string
          sort_order?: number
          tags?: string[]
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_name?: string | null
          body?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          gallery_images?: string[]
          headline?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          location?: string | null
          published_at?: string
          read_minutes?: number
          slug?: string
          sort_order?: number
          tags?: string[]
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      news_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "news_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          policies_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          policies_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          policies_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          description: string | null
          focus_area: string | null
          gallery_images: string[]
          highlights: string[]
          icon: string | null
          id: string
          image_url: string | null
          impact_label: string | null
          impact_stat: string | null
          is_active: boolean
          location: string | null
          name: string
          slug: string
          sort_order: number
          summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          focus_area?: string | null
          gallery_images?: string[]
          highlights?: string[]
          icon?: string | null
          id?: string
          image_url?: string | null
          impact_label?: string | null
          impact_stat?: string | null
          is_active?: boolean
          location?: string | null
          name: string
          slug: string
          sort_order?: number
          summary: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          focus_area?: string | null
          gallery_images?: string[]
          highlights?: string[]
          icon?: string | null
          id?: string
          image_url?: string | null
          impact_label?: string | null
          impact_stat?: string | null
          is_active?: boolean
          location?: string | null
          name?: string
          slug?: string
          sort_order?: number
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          contact_address: string
          contact_email: string
          contact_hours: string
          contact_intro: string
          contact_map_url: string
          contact_phone: string
          created_at: string
          emergency_active: boolean
          emergency_cta_label: string
          emergency_cta_url: string
          emergency_ends_at: string | null
          emergency_headline: string
          emergency_message: string
          emergency_starts_at: string | null
          id: string
          updated_at: string
        }
        Insert: {
          contact_address?: string
          contact_email?: string
          contact_hours?: string
          contact_intro?: string
          contact_map_url?: string
          contact_phone?: string
          created_at?: string
          emergency_active?: boolean
          emergency_cta_label?: string
          emergency_cta_url?: string
          emergency_ends_at?: string | null
          emergency_headline?: string
          emergency_message?: string
          emergency_starts_at?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          contact_address?: string
          contact_email?: string
          contact_hours?: string
          contact_intro?: string
          contact_map_url?: string
          contact_phone?: string
          created_at?: string
          emergency_active?: boolean
          emergency_cta_label?: string
          emergency_cta_url?: string
          emergency_ends_at?: string | null
          emergency_headline?: string
          emergency_message?: string
          emergency_starts_at?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_cents: number | null
          cancel_at_period_end: boolean
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
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
      volunteer_applications: {
        Row: {
          admin_notes: string | null
          availability: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          interest_area: string
          message: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          availability?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          interest_area: string
          message?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          availability?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          interest_area?: string
          message?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      volunteer_roles: {
        Row: {
          commitment: string | null
          created_at: string
          description: string | null
          id: string
          interest_area: string
          is_active: boolean
          is_remote: boolean
          location: string | null
          skills: string[]
          slug: string
          sort_order: number
          spots_available: number | null
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          commitment?: string | null
          created_at?: string
          description?: string | null
          id?: string
          interest_area?: string
          is_active?: boolean
          is_remote?: boolean
          location?: string | null
          skills?: string[]
          slug: string
          sort_order?: number
          spots_available?: number | null
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          commitment?: string | null
          created_at?: string
          description?: string | null
          id?: string
          interest_area?: string
          is_active?: boolean
          is_remote?: boolean
          location?: string | null
          skills?: string[]
          slug?: string
          sort_order?: number
          spots_available?: number | null
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      purge_account_data: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "editor" | "donor"
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
      app_role: ["admin", "editor", "donor"],
    },
  },
} as const
