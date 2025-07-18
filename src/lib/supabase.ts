import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'solicitante' | 'despachante' | 'administrador';
          school: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role?: 'solicitante' | 'despachante' | 'administrador';
          school?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: 'solicitante' | 'despachante' | 'administrador';
          school?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      materials: {
        Row: {
          id: string;
          name: string;
          category: string;
          unit: string;
          current_stock: number;
          min_stock: number;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          unit: string;
          current_stock?: number;
          min_stock?: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          unit?: string;
          current_stock?: number;
          min_stock?: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      stock_entries: {
        Row: {
          id: string;
          material_id: string;
          supplier_id: string;
          quantity: number;
          unit_price: number | null;
          batch: string | null;
          expiry_date: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          supplier_id: string;
          quantity: number;
          unit_price?: number | null;
          batch?: string | null;
          expiry_date?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          supplier_id?: string;
          quantity?: number;
          unit_price?: number | null;
          batch?: string | null;
          expiry_date?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      requests: {
        Row: {
          id: string;
          requester_id: string;
          status: 'pendente' | 'aprovado' | 'rejeitado' | 'despachado' | 'cancelado';
          priority: 'baixa' | 'media' | 'alta';
          notes: string | null;
          approved_by: string | null;
          approved_at: string | null;
          dispatched_by: string | null;
          dispatched_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          status?: 'pendente' | 'aprovado' | 'rejeitado' | 'despachado' | 'cancelado';
          priority?: 'baixa' | 'media' | 'alta';
          notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          dispatched_by?: string | null;
          dispatched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          status?: 'pendente' | 'aprovado' | 'rejeitado' | 'despachado' | 'cancelado';
          priority?: 'baixa' | 'media' | 'alta';
          notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          dispatched_by?: string | null;
          dispatched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      request_items: {
        Row: {
          id: string;
          request_id: string;
          material_id: string;
          requested_quantity: number;
          approved_quantity: number | null;
          dispatched_quantity: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          request_id: string;
          material_id: string;
          requested_quantity: number;
          approved_quantity?: number | null;
          dispatched_quantity?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          request_id?: string;
          material_id?: string;
          requested_quantity?: number;
          approved_quantity?: number | null;
          dispatched_quantity?: number | null;
          notes?: string | null;
        };
      };
    };
    Views: {
      stock_status: {
        Row: {
          id: string;
          name: string;
          category: string;
          unit: string;
          current_stock: number;
          min_stock: number;
          status: string;
          updated_at: string;
        };
      };
      request_summary: {
        Row: {
          id: string;
          status: string;
          priority: string;
          created_at: string;
          requester_name: string;
          school: string | null;
          approver_name: string | null;
          dispatcher_name: string | null;
          items_count: number;
          total_requested: number;
          total_dispatched: number;
        };
      };
    };
    Functions: {
      get_dashboard_stats: {
        Args: { user_id?: string };
        Returns: any;
      };
    };
  };
}