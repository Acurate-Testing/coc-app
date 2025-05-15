import { PrivacyPolicy } from "@/constants/enums";

export interface TestType {
  id: string;
  name: string;
}

export interface Sample {
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
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  sample_collected_at: string | null;
  temperature: number | null | undefined;
  notes: string | null;
  status: "pending" | "in_coc" | "submitted" | "pass" | "fail";
  pass_fail_notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at?: string;
  saved_at: string;
  deleted_at: string | null;
  coc_transfers?: any[];
  test_types?: TestType[];
}
