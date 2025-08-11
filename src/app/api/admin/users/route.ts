import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// List all users
export async function GET() {
  const { data, error } = await supabase
    .from("agencies")
    .select("id, name, contact_email, phone, street, city, state, zip, PWS_id_prefix, agency_test_type_groups(test_groups(id, name), assigned_test_type_ids), accounts(name)")
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform the data to format accounts as string arrays and flatten test groups
  const formattedData = data?.map(user => ({
    ...user,
    accounts: user.accounts ? user.accounts.map((account: {name: string}) => account.name) : [],
    assigned_test_group: user.agency_test_type_groups ? 
      user.agency_test_type_groups.map((group: any) => ({
        id: group.test_groups?.id,
        name: group.test_groups?.name,
        assigned_test_type_ids: group.assigned_test_type_ids && group.assigned_test_type_ids.length > 0 
          ? group.assigned_test_type_ids 
          : []
      })).filter(g => g.id) : [],
    PWS_id_prefix: user.PWS_id_prefix // <-- Ensure this is included
  }));

  return NextResponse.json(formattedData);
}

// Delete a test assignment from a user
export async function DELETE(req: NextRequest) {
  const { userId, testGroupId } = await req.json();

  if (!userId || !testGroupId) {
    return NextResponse.json({ error: "userId and testGroupId are required" }, { status: 400 });
  }

  // Remove the test group assignment from the agency_test_type_groups table
  const { error } = await supabase
    .from("agency_test_type_groups")
    .delete()
    .eq("agency_id", userId)
    .eq("test_type_group_id", testGroupId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Assign test groups to a user
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { userId, testGroupIds, testTypeIdsByGroup, PWS_id_prefix } = body;

  // If only updating PWS_id_prefix
  if (userId && typeof PWS_id_prefix === "string") {
    const { error } = await supabase
      .from("agencies")
      .update({ PWS_id_prefix })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // Validate input for test group assignment
  if (!userId || !Array.isArray(testGroupIds) || typeof testTypeIdsByGroup !== "object") {
    return NextResponse.json({ error: "userId, testGroupIds[], and testTypeIdsByGroup are required" }, { status: 400 });
  }

  // Fetch existing assignments for this agency
  const { data: existingAssignments, error: fetchError } = await supabase
    .from("agency_test_type_groups")
    .select("id, test_type_group_id")
    .eq("agency_id", userId);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const existingIds = new Set(
    (existingAssignments || []).map((entry) => entry.test_type_group_id)
  );

  // Remove test group assignments that are no longer selected
  const testGroupIdsToRemove = Array.from(existingIds).filter(
    (existingId) => !testGroupIds.includes(existingId)
  );
  if (testGroupIdsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("agency_test_type_groups")
      .delete()
      .eq("agency_id", userId)
      .in("test_type_group_id", testGroupIdsToRemove);

    if (deleteError) {
      if (
        typeof deleteError.message === "string" &&
        deleteError.message.includes("violates foreign key constraint")
      ) {
        return NextResponse.json(
          { error: "Cannot remove test group assignment because it is referenced by other records." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  // Add new assignments for test groups that don't already exist
  const newTestGroupIds = testGroupIds.filter((testGroupId: string) => !existingIds.has(testGroupId));
  if (newTestGroupIds.length > 0) {
    const inserts = newTestGroupIds.map((testGroupId: string) => ({
      agency_id: userId,
      test_type_group_id: testGroupId,
      assigned_test_type_ids: testTypeIdsByGroup[testGroupId] || [],
    }));
    const { error: insertError } = await supabase.from("agency_test_type_groups").insert(inserts);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // Update assigned_test_type_ids for all selected test groups
  for (const testGroupId of testGroupIds) {
    const assignment = (existingAssignments || []).find((a: any) => a.test_type_group_id === testGroupId);
    if (assignment) {
      const { error: updateError } = await supabase
        .from("agency_test_type_groups")
        .update({ assigned_test_type_ids: testTypeIdsByGroup[testGroupId] || [] })
        .eq("id", assignment.id);
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}
