import { PrivacyPolicy, SampleStatus } from "@/constants/enums";
import { SampleStatusType } from "./supabase";

export interface TestType {
  id: string;
  name: string;
}

export interface Sample {
  id: string;
  project_id: string | null;
  matrix_type: string | null;
  matrix_name: string | null;
  sample_type: string | null;
  sample_location: string | null;
  sample_privacy: string | null;
  status: string;
  sample_collected_at: string | null;
  created_at: string;
  updated_at: string;
  temperature: number | null;
  notes: string | null;
  pass_fail_notes: string | null;
  attachment_url: string | null;
  latitude: number | null;
  longitude: number | null;
  county: string | null;
  compliance: string | null;
  chlorine_residual: string | null;
  pws_id: string | null;
  source: string | null;
  address: string | null;
  account_id: string | null;
  agency_id: string | null;
  created_by: string | null;
  created_by_user?: {
    id: string;
    full_name: string;
  };
  agency?: {
    id: string;
    name: string;
  };
  account?: {
    id: string;
    name: string;
  };
  test_types?: {
    id: string;
    name: string;
  }[];
  coc_transfers?: any[];
}

export const sampleInitialValues: Partial<Sample> = {
  project_id: "",
  agency_id: null,
  account_id: null,
  created_by: null,
  pws_id: "",
  source: "",
  matrix_type: "",
  matrix_name: "",
  sample_type: "",
  chlorine_residual: "",
  address: "",
  sample_privacy: null,
  compliance: null,
  sample_location: "",
  coc_transfers: [],
  test_types: [],
  latitude: undefined,
  longitude: undefined,
  temperature: undefined,
  notes: "",
  status: SampleStatus.Pending,
  pass_fail_notes: "",
  attachment_url: "",
  sample_collected_at: new Date().toISOString(),
  // created_at: new Date().toISOString(),
  // updated_at: new Date().toISOString(),
};
