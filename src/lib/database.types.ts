// Aligned with supabase/schema.sql — regenerate via Supabase CLI when the schema changes.

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
      farmers: {
        Row: {
          rsbsa_code: string;
          last_name: string;
          first_name: string;
          middle_name: string | null;
          full_name: string;
          gender: string | null;
          birthdate: string | null;
          phone: string | null;
          is_farmer: boolean | null;
          is_farmworker: boolean | null;
          is_fisherfolk: boolean | null;
          is_agriyouth: boolean | null;
          is_indigenous_people: boolean | null;
          is_organic_practitioner: boolean | null;
          is_arb: boolean | null;
          farmer_address_1: string | null;
          farmer_address_2: string | null;
          farmer_address_3: string | null;
          parcel_no: number | null;
          parcel_address_1: string | null;
          parcel_address_2: string | null;
          parcel_address_3: string | null;
          parcel_area: number | null;
          crop_area: number | null;
          farm_type: string | null;
          tribe: string | null;
          agency: string | null;
          ownership_type: string | null;
          owner_name: string | null;
          date_encoded: string | null;
          notes: string | null;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          rsbsa_code: string;
          last_name: string;
          first_name: string;
          middle_name?: string | null;
          full_name: string;
          gender?: string | null;
          birthdate?: string | null;
          phone?: string | null;
          is_farmer?: boolean | null;
          is_farmworker?: boolean | null;
          is_fisherfolk?: boolean | null;
          is_agriyouth?: boolean | null;
          is_indigenous_people?: boolean | null;
          is_organic_practitioner?: boolean | null;
          is_arb?: boolean | null;
          farmer_address_1?: string | null;
          farmer_address_2?: string | null;
          farmer_address_3?: string | null;
          parcel_no?: number | null;
          parcel_address_1?: string | null;
          parcel_address_2?: string | null;
          parcel_address_3?: string | null;
          parcel_area?: number | null;
          crop_area?: number | null;
          farm_type?: string | null;
          tribe?: string | null;
          agency?: string | null;
          ownership_type?: string | null;
          owner_name?: string | null;
          date_encoded?: string | null;
          notes?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          rsbsa_code?: string;
          last_name?: string;
          first_name?: string;
          middle_name?: string | null;
          full_name?: string;
          gender?: string | null;
          birthdate?: string | null;
          phone?: string | null;
          is_farmer?: boolean | null;
          is_farmworker?: boolean | null;
          is_fisherfolk?: boolean | null;
          is_agriyouth?: boolean | null;
          is_indigenous_people?: boolean | null;
          is_organic_practitioner?: boolean | null;
          is_arb?: boolean | null;
          farmer_address_1?: string | null;
          farmer_address_2?: string | null;
          farmer_address_3?: string | null;
          parcel_no?: number | null;
          parcel_address_1?: string | null;
          parcel_address_2?: string | null;
          parcel_address_3?: string | null;
          parcel_area?: number | null;
          crop_area?: number | null;
          farm_type?: string | null;
          tribe?: string | null;
          agency?: string | null;
          ownership_type?: string | null;
          owner_name?: string | null;
          date_encoded?: string | null;
          notes?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      farmer_commodities: {
        Row: {
          id: string;
          rsbsa_code: string;
          commodity_name: string;
          number_of_heads: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rsbsa_code: string;
          commodity_name: string;
          number_of_heads?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rsbsa_code?: string;
          commodity_name?: string;
          number_of_heads?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          rsbsa_code: string;
          transaction_type: string;
          amount: number | null;
          description: string | null;
          notes: string | null;
          status: string;
          office_visit_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          rsbsa_code: string;
          transaction_type: string;
          amount?: number | null;
          description?: string | null;
          notes?: string | null;
          status?: string;
          office_visit_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          rsbsa_code?: string;
          transaction_type?: string;
          amount?: number | null;
          description?: string | null;
          notes?: string | null;
          status?: string;
          office_visit_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      app_users: {
        Row: {
          id: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          role: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          role?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          full_name?: string;
          email?: string;
          role?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          project_type: string;
          status: string;
          implemented_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_type: string;
          status?: string;
          implemented_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_type?: string;
          status?: string;
          implemented_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      dashboard_stats: {
        Row: {
          total_farmers: number | null;
          total_transactions: number | null;
          visits_this_month: number | null;
          farmers_visited_this_month: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
