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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      cart_item: {
        Row: {
          created_at: string
          id: string
          quantity: number
          user_id: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity: number
          user_id: string
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          user_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "listing_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      category: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          listing_type: Database["public"]["Enums"]["listing_type"]
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          listing_type?: Database["public"]["Enums"]["listing_type"]
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          listing_type?: Database["public"]["Enums"]["listing_type"]
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_batch: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          scheduled_window: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          scheduled_window?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          scheduled_window?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      listing: {
        Row: {
          category_id: string
          characteristics: Json
          condition: string | null
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          longitude: number | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          moderation_status: string
          price: number | null
          status: Database["public"]["Enums"]["listing_status"]
          stock: number
          store_id: string
          title: string | null
        }
        Insert: {
          category_id: string
          characteristics?: Json
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          longitude?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          stock?: number
          store_id: string
          title?: string | null
        }
        Update: {
          category_id?: string
          characteristics?: Json
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          longitude?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          stock?: number
          store_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_template: {
        Row: {
          category_id: string
          created_at: string
          id: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          template: Json
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          template?: Json
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          listing_type?: Database["public"]["Enums"]["listing_type"]
          template?: Json
        }
        Relationships: [
          {
            foreignKeyName: "listing_template_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_variant: {
        Row: {
          attributes_json: Json
          created_at: string
          id: string
          is_default: boolean
          listing_id: string
          name: string
          price: number
          sku: string
          stock: number
        }
        Insert: {
          attributes_json?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          listing_id: string
          name?: string
          price: number
          sku: string
          stock?: number
        }
        Update: {
          attributes_json?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          listing_id?: string
          name?: string
          price?: number
          sku?: string
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_variant_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_report: {
        Row: {
          assigned_to: string | null
          created_at: string
          details: string | null
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reporter_id: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          details?: string | null
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reporter_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          details?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reporter_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification: {
        Row: {
          audience: string
          body: string
          created_at: string
          href: string | null
          id: string
          metadata: Json
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          audience: string
          body: string
          created_at?: string
          href?: string | null
          id?: string
          metadata?: Json
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          href?: string | null
          id?: string
          metadata?: Json
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order: {
        Row: {
          buyer_id: string
          created_at: string
          delivery_price: number
          id: string
          payment_status: string
          seller_id: string
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          buyer_id: string
          created_at?: string
          delivery_price?: number
          id?: string
          payment_status?: string
          seller_id: string
          status?: string
          subtotal?: number
          total?: number
        }
        Update: {
          buyer_id?: string
          created_at?: string
          delivery_price?: number
          id?: string
          payment_status?: string
          seller_id?: string
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          order_id: string
          price_snapshot: number
          quantity: number
          title_snapshot: string
          variant_id: string
          variant_snapshot: Json
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          order_id: string
          price_snapshot: number
          quantity: number
          title_snapshot: string
          variant_id: string
          variant_snapshot?: Json
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          order_id?: string
          price_snapshot?: number
          quantity?: number
          title_snapshot?: string
          variant_id?: string
          variant_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "order_item_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "listing_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment: {
        Row: {
          batch_id: string | null
          carbon_level: string | null
          created_at: string
          delivery_method: string | null
          distance_km: number | null
          id: string
          order_id: string
          scheduled_window: Json | null
          sequence: number
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          carbon_level?: string | null
          created_at?: string
          delivery_method?: string | null
          distance_km?: number | null
          id?: string
          order_id: string
          scheduled_window?: Json | null
          sequence?: number
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          carbon_level?: string | null
          created_at?: string
          delivery_method?: string | null
          distance_km?: number | null
          id?: string
          order_id?: string
          scheduled_window?: Json | null
          sequence?: number
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "delivery_batch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
        ]
      }
      store: {
        Row: {
          address: string | null
          allow_followers: boolean
          banner_url: string | null
          bio: string | null
          created_at: string
          follower_count: number
          id: string
          instagram: string | null
          last_active_at: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          mode: string
          name: string
          plan: string
          product_limit: number
          rating_avg: number
          review_count: number
          show_whatsapp: boolean
          slug: string | null
          status: string
          suspended_at: string | null
          suspension_reason: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          allow_followers?: boolean
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          follower_count?: number
          id: string
          instagram?: string | null
          last_active_at?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          mode?: string
          name: string
          plan?: string
          product_limit?: number
          rating_avg?: number
          review_count?: number
          show_whatsapp?: boolean
          slug?: string | null
          status?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          allow_followers?: boolean
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          follower_count?: number
          id?: string
          instagram?: string | null
          last_active_at?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          mode?: string
          name?: string
          plan?: string
          product_limit?: number
          rating_avg?: number
          review_count?: number
          show_whatsapp?: boolean
          slug?: string | null
          status?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      store_review: {
        Row: {
          author_avatar_url: string | null
          author_id: string
          author_name: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          store_id: string
          updated_at: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_id: string
          author_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          store_id: string
          updated_at?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string
          author_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_review_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      vendor_follower: {
        Row: {
          created_at: string
          follower_id: string
          store_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          store_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_follower_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_telegram: {
        Row: {
          chat_id: string | null
          connected_at: string | null
          created_at: string
          enabled: boolean
          link_token: string | null
          link_token_expires_at: string | null
          notify_low_stock: boolean
          notify_new_followers: boolean
          notify_new_orders: boolean
          notify_new_reviews: boolean
          store_id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          chat_id?: string | null
          connected_at?: string | null
          created_at?: string
          enabled?: boolean
          link_token?: string | null
          link_token_expires_at?: string | null
          notify_low_stock?: boolean
          notify_new_followers?: boolean
          notify_new_orders?: boolean
          notify_new_reviews?: boolean
          store_id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          chat_id?: string | null
          connected_at?: string | null
          created_at?: string
          enabled?: boolean
          link_token?: string | null
          link_token_expires_at?: string | null
          notify_low_stock?: boolean
          notify_new_followers?: boolean
          notify_new_orders?: boolean
          notify_new_reviews?: boolean
          store_id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_telegram_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
      has_role: { Args: { target_role: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      slugify: { Args: { value: string }; Returns: string }
    }
    Enums: {
      listing_status: "draft" | "published"
      listing_type: "product" | "service" | "property"
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
      listing_status: ["draft", "published"],
      listing_type: ["product", "service", "property"],
    },
  },
} as const

