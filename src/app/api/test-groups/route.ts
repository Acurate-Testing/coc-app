import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";

// GET /api/test-groups
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: groups, error } = await supabase
      .from("test_groups")
      .select(`
        id,
        name,
        description,
        test_type_ids,
        created_at,
        updated_at
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each group, fetch the full test type details
    const groupsWithTestTypes = await Promise.all(
      (groups || []).map(async (group) => {
        if (group.test_type_ids && group.test_type_ids.length > 0) {
          const { data: testTypes, error: testTypesError } = await supabase
            .from("test_types")
            .select("id, name, test_code, matrix_types, description")
            .in("id", group.test_type_ids)
            .is("deleted_at", null)
            .order("name");

          if (testTypesError) {
            console.error("Error fetching test types for group:", testTypesError);
            return { ...group, test_types: [] };
          }

          return { ...group, test_types: testTypes || [] };
        }
        
        return { ...group, test_types: [] };
      })
    );

    return NextResponse.json({ groups: groupsWithTestTypes });
  } catch (error) {
    console.error("Error fetching test groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch test groups" },
      { status: 500 }
    );
  }
}

// POST /api/test-groups
export async function POST(request: NextRequest) {
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

    // Validate that all test_type_ids are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = test_type_ids.filter(id => !uuidRegex.test(id));
    
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: "Invalid test type IDs provided" },
        { status: 400 }
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
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        test_type_ids,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ group: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating test group:", error);
    return NextResponse.json(
      { error: "Failed to create test group" },
      { status: 500 }
    );
  }
}
