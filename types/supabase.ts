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
      store: {
        Row: {
          address: string | null
          created_at: string
          id: string
          instagram: string | null
          latitude: number | null
          longitude: number | null
          mode: string
          name: string
          plan: string
          product_limit: number
          terms_accepted: boolean
          terms_accepted_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id: string
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          mode?: string
          name: string
          plan?: string
          product_limit?: number
          terms_accepted?: boolean
          terms_accepted_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          mode?: string
          name?: string
          plan?: string
          product_limit?: number
          terms_accepted?: boolean
          terms_accepted_at?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

