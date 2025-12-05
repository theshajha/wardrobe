export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          showcase_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          showcase_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          showcase_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string | null;
          subcategory: string | null;
          color: string | null;
          brand: string | null;
          purchase_date: string | null;
          cost: number | null;
          currency: string;
          condition: string | null;
          notes: string | null;
          location: string | null;
          climate: string | null;
          occasion: string | null;
          is_phase_out: boolean;
          is_featured: boolean;
          image_url: string | null;
          image_hash: string | null;
          size: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: string | null;
          subcategory?: string | null;
          color?: string | null;
          brand?: string | null;
          purchase_date?: string | null;
          cost?: number | null;
          currency?: string;
          condition?: string | null;
          notes?: string | null;
          location?: string | null;
          climate?: string | null;
          occasion?: string | null;
          is_phase_out?: boolean;
          is_featured?: boolean;
          image_url?: string | null;
          image_hash?: string | null;
          size?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string | null;
          subcategory?: string | null;
          color?: string | null;
          brand?: string | null;
          purchase_date?: string | null;
          cost?: number | null;
          currency?: string;
          condition?: string | null;
          notes?: string | null;
          location?: string | null;
          climate?: string | null;
          occasion?: string | null;
          is_phase_out?: boolean;
          is_featured?: boolean;
          image_url?: string | null;
          image_hash?: string | null;
          size?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          destination: string | null;
          start_date: string | null;
          end_date: string | null;
          climate: string | null;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          destination?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          climate?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          destination?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          climate?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      trip_items: {
        Row: {
          id: string;
          trip_id: string | null;
          item_id: string | null;
          packed: boolean;
          quantity: number;
        };
        Insert: {
          id?: string;
          trip_id?: string | null;
          item_id?: string | null;
          packed?: boolean;
          quantity?: number;
        };
        Update: {
          id?: string;
          trip_id?: string | null;
          item_id?: string | null;
          packed?: boolean;
          quantity?: number;
        };
      };
      outfits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          occasion: string | null;
          season: string | null;
          notes: string | null;
          rating: number | null;
          last_worn: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          occasion?: string | null;
          season?: string | null;
          notes?: string | null;
          rating?: number | null;
          last_worn?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          occasion?: string | null;
          season?: string | null;
          notes?: string | null;
          rating?: number | null;
          last_worn?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      outfit_items: {
        Row: {
          id: string;
          outfit_id: string | null;
          item_id: string | null;
        };
        Insert: {
          id?: string;
          outfit_id?: string | null;
          item_id?: string | null;
        };
        Update: {
          id?: string;
          outfit_id?: string | null;
          item_id?: string | null;
        };
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string | null;
          quantity: number;
          priority: string | null;
          estimated_cost: number | null;
          currency: string;
          link: string | null;
          notes: string | null;
          is_purchased: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: string | null;
          quantity?: number;
          priority?: string | null;
          estimated_cost?: number | null;
          currency?: string;
          link?: string | null;
          notes?: string | null;
          is_purchased?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string | null;
          quantity?: number;
          priority?: string | null;
          estimated_cost?: number | null;
          currency?: string;
          link?: string | null;
          notes?: string | null;
          is_purchased?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
