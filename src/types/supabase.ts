import { PrivacyPolicy } from "@/constants/enums";

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
      agencies: {
        Row: {
          id: string;
          name: string;
          contact_email: string;
          created_by: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          contact_email: string;
          created_by?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          contact_email?: string;
          created_by?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      accounts: {
        Row: {
          id: string;
          name: string;
          agency_id: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          agency_id: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          agency_id?: string;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      test_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: "lab_admin" | "agency" | "user";
          agency_id: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role: "lab_admin" | "agency" | "user";
          agency_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: "lab_admin" | "agency" | "user";
          agency_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      agency_test_types: {
        Row: {
          agency_id: string;
          test_type_id: string;
          deleted_at: string | null;
        };
        Insert: {
          agency_id: string;
          test_type_id: string;
          deleted_at?: string | null;
        };
        Update: {
          agency_id?: string;
          test_type_id?: string;
          deleted_at?: string | null;
        };
      };
      samples: {
        Row: {
          id: string;
          project_id: string | null;
          agency_id: string | null;
          account_id: string | null;
          created_by: string | null;
          pws_id: string | null;
          matrix_type: string | null;
          sample_privacy: PrivacyPolicy.Private | PrivacyPolicy.Public | null;
          compliance: "Yes" | "No" | null;
          chlorine_residual: string | null;
          county: string | null;
          sample_type: string | null;
          sample_location: string | null;
          source: string | null;
          latitude: number | null;
          longitude: number | null;
          sample_collected_at: string | null;
          temperature: number | null;
          notes: string | null;
          status: "pending" | "in_coc" | "submitted" | "pass" | "fail";
          pass_fail_notes: string | null;
          attachment_url: string | null;
          created_at: string;
          updated_at: string;
          saved_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          agency_id?: string | null;
          account_id?: string | null;
          created_by?: string | null;
          pws_id?: string | null;
          matrix_type?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          sample_collected_at?: string | null;
          temperature?: number | null;
          notes?: string | null;
          status?: "pending" | "in_coc" | "submitted" | "pass" | "fail";
          pass_fail_notes?: string | null;
          attachment_url?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          agency_id?: string | null;
          account_id?: string | null;
          created_by?: string | null;
          pws_id?: string | null;
          matrix_type?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          sample_collected_at?: string | null;
          temperature?: number | null;
          notes?: string | null;
          status?: "pending" | "in_coc" | "submitted" | "pass" | "fail";
          pass_fail_notes?: string | null;
          attachment_url?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      sample_test_types: {
        Row: {
          sample_id: string;
          test_type_id: string;
          deleted_at: string | null;
        };
        Insert: {
          sample_id: string;
          test_type_id: string;
          deleted_at?: string | null;
        };
        Update: {
          sample_id?: string;
          test_type_id?: string;
          deleted_at?: string | null;
        };
      };
      coc_transfers: {
        Row: {
          id: string;
          sample_id: string;
          transferred_by: string | null;
          received_by: string | null;
          timestamp: string;
          latitude: number | null;
          longitude: number | null;
          signature: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          sample_id: string;
          transferred_by?: string | null;
          received_by?: string | null;
          timestamp?: string;
          latitude?: number | null;
          longitude?: number | null;
          signature?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          sample_id?: string;
          transferred_by?: string | null;
          received_by?: string | null;
          timestamp?: string;
          latitude?: number | null;
          longitude?: number | null;
          signature?: string | null;
          deleted_at?: string | null;
        };
      };
    };
  };
}
