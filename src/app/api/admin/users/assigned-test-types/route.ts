import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Get all assigned test groups for the user
  const { data: assignments, error: assignmentError } = await supabase
    .from("agency_test_type_groups")
    .select("assigned_test_type_ids")
    .eq("agency_id", userId);

  if (assignmentError) {
    return NextResponse.json({ error: assignmentError.message }, { status: 500 });
  }

  // Collect all assigned test type IDs
  const assignedTestTypeIds = Array.from(
    new Set(
      (assignments || [])
        .flatMap((a: any) => Array.isArray(a.assigned_test_type_ids) ? a.assigned_test_type_ids : [])
        .filter(Boolean)
    )
  );

  if (assignedTestTypeIds.length === 0) {
    return NextResponse.json({ testTypes: [] });
  }

  // Fetch test type details
  const { data: testTypes, error: testTypesError } = await supabase
    .from("test_types")
    .select("id, name, test_code, matrix_types, description")
    .in("id", assignedTestTypeIds)
    .is("deleted_at", null)
    .order("name");

  if (testTypesError) {
    return NextResponse.json({ error: testTypesError.message }, { status: 500 });
  }

  return NextResponse.json({ testTypes: testTypes || [] });
}
