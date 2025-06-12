import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First, get the test group to get the test_type_ids
    const { data: testGroup, error: groupError } = await supabase
      .from("test_groups")
      .select("test_type_ids")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single();

    if (groupError || !testGroup) {
      return NextResponse.json(
        { error: "Test group not found" },
        { status: 404 }
      );
    }

    // If no test types in the group, return empty array
    if (!testGroup.test_type_ids || testGroup.test_type_ids.length === 0) {
      return NextResponse.json({ testTypes: [] });
    }

    // Fetch the test types based on the IDs
    const { data: testTypes, error: testTypesError } = await supabase
      .from("test_types")
      .select("id, name, test_code, matrix_types")
      .in("id", testGroup.test_type_ids)
      .is("deleted_at", null)
      .order("name");

    if (testTypesError) {
      return NextResponse.json(
        { error: testTypesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ testTypes: testTypes || [] });
  } catch (error) {
    console.error("Error fetching test types for group:", error);
    return NextResponse.json(
      { error: "Failed to fetch test types" },
      { status: 500 }
    );
  }
}
