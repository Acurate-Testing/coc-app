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

    const agencyID = session?.user?.agency_id;

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

    let filteredGroups = groups || [];

    // If user has an agency ID, check for agency-specific test groups
    if (agencyID) {
      // Query agency_test_type_groups table with assigned_test_type_ids
      const { data: agencyTestGroups, error: agencyError } = await supabase
        .from("agency_test_type_groups")
        .select("test_type_group_id, assigned_test_type_ids")
        .eq("agency_id", agencyID);

      if (agencyError) {
        console.error("Error fetching agency test groups:", agencyError);
      } else if (agencyTestGroups && agencyTestGroups.length > 0) {
        // If agency has specific test groups, filter the list
        const testGroupIds = agencyTestGroups.map(item => item.test_type_group_id);
        filteredGroups = groups.filter(group => 
          testGroupIds.includes(group.id)
        );

        // Add assigned_test_type_ids to each filtered group
        filteredGroups = filteredGroups.map(group => {
          const agencyGroup = agencyTestGroups.find(
            item => item.test_type_group_id === group.id
          );
          
          return {
            ...group,
            assigned_test_type_ids: agencyGroup?.assigned_test_type_ids || null
          };
        });
      }
    }

    // For each group, fetch the full test type details
    const groupsWithTestTypes = await Promise.all(
      filteredGroups.map(async (group) => {
        // Type assertion to include assigned_test_type_ids
        const g = group as typeof group & { assigned_test_type_ids?: string[] };
        let testTypes: any[] = [];
        // Use assigned_test_type_ids if present, otherwise fallback to test_type_ids
        const effectiveTestTypeIds = Array.isArray(g.assigned_test_type_ids) && g.assigned_test_type_ids.length > 0
          ? g.assigned_test_type_ids
          : g.test_type_ids;

        if (effectiveTestTypeIds && effectiveTestTypeIds.length > 0) {
          const { data, error: testTypesError } = await supabase
            .from("test_types")
            .select("id, name, test_code, matrix_types, description")
            .in("id", effectiveTestTypeIds)
            .is("deleted_at", null)
            .order("name");

          if (testTypesError) {
            console.error("Error fetching test types for group:", testTypesError);
            testTypes = [];
          } else {
            testTypes = data || [];
          }
        }

        // Collect all unique matrix types from testTypes
        const allowedMatrixTypes = Array.from(
          new Set(
            testTypes.flatMap(tt => Array.isArray(tt.matrix_types) ? tt.matrix_types : [])
          )
        );

        return { 
          ...g, 
          test_types: testTypes, 
          allowed_matrix_types: allowedMatrixTypes 
        };
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
