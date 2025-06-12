import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";

// GET /api/test-groups/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: group, error } = await supabase
      .from("test_groups")
      .select(`
        id,
        name,
        description,
        test_type_ids,
        created_at,
        updated_at,
        created_by
      `)
      .eq("id", params.id)
      .is("deleted_at", null)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!group) {
      return NextResponse.json(
        { error: "Test group not found" },
        { status: 404 }
      );
    }

    interface TestType {
      id: string;
      name: string;
      test_code: string;
      matrix_types: string[];
      description: string | null;
    }

    const testTypes: TestType[] = [];
    if (group.test_type_ids && group.test_type_ids.length > 0) {
      const { data: testTypesData, error: testTypesError } = await supabase
        .from("test_types")
        .select("id, name, test_code, matrix_types, description")
        .in("id", group.test_type_ids)
        .is("deleted_at", null)
        .order("name");

      if (testTypesError) {
        console.error("Error fetching test types for group:", testTypesError);
      } else {
        testTypes.push(...(testTypesData || []));
      }
    }

    const groupWithTestTypes = { ...group, test_types: testTypes };

    return NextResponse.json({ group: groupWithTestTypes });
  } catch (error) {
    console.error("Error fetching test group:", error);
    return NextResponse.json(
      { error: "Failed to fetch test group" },
      { status: 500 }
    );
  }
}

// PUT /api/test-groups/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, test_type_ids } = await request.json();

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(test_type_ids) || test_type_ids.length === 0) {
      return NextResponse.json(
        { error: "At least one test type must be selected" },
        { status: 400 }
      );
    }

    // Verify test group exists
    const { data: existingGroup, error: fetchError } = await supabase
      .from("test_groups")
      .select("id")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existingGroup) {
      return NextResponse.json(
        { error: "Test group not found" },
        { status: 404 }
      );
    }

    // Verify that all test types exist
    const { data: existingTestTypes, error: verifyError } = await supabase
      .from("test_types")
      .select("id")
      .in("id", test_type_ids)
      .is("deleted_at", null);

    if (verifyError) {
      return NextResponse.json({ error: verifyError.message }, { status: 500 });
    }

    if (existingTestTypes.length !== test_type_ids.length) {
      return NextResponse.json(
        { error: "Some test types do not exist" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("test_groups")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        test_type_ids,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ group: data });
  } catch (error) {
    console.error("Error updating test group:", error);
    return NextResponse.json(
      { error: "Failed to update test group" },
      { status: 500 }
    );
  }
}

// DELETE /api/test-groups/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify test group exists
    const { data: existingGroup, error: fetchError } = await supabase
      .from("test_groups")
      .select("id")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existingGroup) {
      return NextResponse.json(
        { error: "Test group not found" },
        { status: 404 }
      );
    }

    // Soft delete the test group
    const { error } = await supabase
      .from("test_groups")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Test group deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting test group:", error);
    return NextResponse.json(
      { error: "Failed to delete test group" },
      { status: 500 }
    );
  }
}
