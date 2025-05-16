import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

// After the checks, we can safely assert these are strings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export const getServiceSupabase = () => {
  return createClient<Database>(supabaseUrl, supabaseKey);
};
