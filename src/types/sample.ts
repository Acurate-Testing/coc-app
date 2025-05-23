import { PrivacyPolicy, SampleStatus } from "@/constants/enums";
import { SampleStatusType } from "./supabase";

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
  matrix_name: string | null;
  sample_privacy: PrivacyPolicy.Private | PrivacyPolicy.Public | null;
  compliance: "Yes" | "No" | null;
  chlorine_residual: string | null;
  county: string | null;
  sample_type: string | null;
  sample_location: string | null;
  address: string | null;
  source: string | null;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  sample_collected_at: string | null;
  temperature: number | null | undefined;
  notes: string | null;
  status: SampleStatusType;
  pass_fail_notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at?: string;
  saved_at: string;
  deleted_at: string | null;
  coc_transfers?: any[];
  test_types?: TestType[];
  sample_test_types?: {
    test_types: TestType;
  }[];
  created_by_user?: {
    id: string;
    full_name: string;
  }
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
