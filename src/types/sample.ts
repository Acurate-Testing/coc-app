import { Database } from "./supabase";
import { SampleStatus } from "@/constants/enums";

export type Sample = Database["public"]["Tables"]["samples"]["Row"] & {
  test_types?: Array<{
    id: string;
    name: string;
  }>;
  account?: {
    name: string;
  };
  agency?: {
    name: string;
  };
  created_by_user?: {
    id: string;
    full_name: string;
  };
  address?: string;
};

export const sampleInitialValues: Partial<Sample> = {
  project_id: "",
  agency_id: null,
  account_id: null,
  created_by: null,
  pws_id: "",
  matrix_type: "",
  matrix_name: "",
  sample_privacy: null,
  compliance: null,
  chlorine_residual: "",
  county: "",
  sample_type: "",
  sample_location: "",
  source: "",
  latitude: null,
  longitude: null,
  sample_collected_at: null,
  temperature: null,
  notes: "",
  status: SampleStatus.Pending,
  pass_fail_notes: "",
  attachment_url: "",
  deleted_at: null,
  test_group_id: null,
  test_types: [],
};
