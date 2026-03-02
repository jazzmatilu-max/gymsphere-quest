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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checkins: {
        Row: {
          coins_earned: number
          created_at: string
          distance_meters: number
          id: string
          latitude: number
          longitude: number
          user_id: string
          validated: boolean
          xp_earned: number
        }
        Insert: {
          coins_earned?: number
          created_at?: string
          distance_meters: number
          id?: string
          latitude: number
          longitude: number
          user_id: string
          validated?: boolean
          xp_earned?: number
        }
        Update: {
          coins_earned?: number
          created_at?: string
          distance_meters?: number
          id?: string
          latitude?: number
          longitude?: number
          user_id?: string
          validated?: boolean
          xp_earned?: number
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          emoji: string | null
          fitness_goals: string[]
          id: string
          in_stock: boolean
          name: string
          price: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          fitness_goals?: string[]
          id?: string
          in_stock?: boolean
          name: string
          price: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          fitness_goals?: string[]
          id?: string
          in_stock?: boolean
          name?: string
          price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_hair_color: string | null
          avatar_photo_url: string | null
          avatar_skin_tone: string | null
          coins: number
          created_at: string
          fitness_goal: string
          gym_lat: number | null
          gym_lng: number | null
          gym_name: string
          height_cm: number | null
          id: string
          level: number
          streak_days: number
          total_workouts: number
          updated_at: string
          user_id: string
          username: string
          weight_kg: number | null
          xp: number
        }
        Insert: {
          age?: number | null
          avatar_hair_color?: string | null
          avatar_photo_url?: string | null
          avatar_skin_tone?: string | null
          coins?: number
          created_at?: string
          fitness_goal?: string
          gym_lat?: number | null
          gym_lng?: number | null
          gym_name?: string
          height_cm?: number | null
          id?: string
          level?: number
          streak_days?: number
          total_workouts?: number
          updated_at?: string
          user_id: string
          username?: string
          weight_kg?: number | null
          xp?: number
        }
        Update: {
          age?: number | null
          avatar_hair_color?: string | null
          avatar_photo_url?: string | null
          avatar_skin_tone?: string | null
          coins?: number
          created_at?: string
          fitness_goal?: string
          gym_lat?: number | null
          gym_lng?: number | null
          gym_name?: string
          height_cm?: number | null
          id?: string
          level?: number
          streak_days?: number
          total_workouts?: number
          updated_at?: string
          user_id?: string
          username?: string
          weight_kg?: number | null
          xp?: number
        }
        Relationships: []
      }
      training_matches: {
        Row: {
          affinity_score: number
          created_at: string
          id: string
          requester_id: string
          status: string
          target_id: string
        }
        Insert: {
          affinity_score?: number
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          target_id: string
        }
        Update: {
          affinity_score?: number
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          target_id?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          id: string
          item_id: string
          purchased_at: string
          quantity: number
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          purchased_at?: string
          quantity?: number
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          purchased_at?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_xp: {
        Args: { p_coins?: number; p_user_id: string; p_xp: number }
        Returns: Json
      }
      purchase_item: {
        Args: { p_item_id: string; p_user_id: string }
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
