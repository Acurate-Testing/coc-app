import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// List all users
export async function GET() {
  const { data, error } = await supabase
    .from("agencies")
    .select("id, name, contact_email, agency_test_type_groups(test_groups(id, name)), accounts(name)")
    .is("deleted_at", null);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Transform the data to format accounts as string arrays and flatten test groups
  const formattedData = data?.map(user => ({
    ...user,
    accounts: user.accounts ? user.accounts.map((account: {name: string}) => account.name) : [],
    assigned_test_group: user.agency_test_type_groups ? 
      user.agency_test_type_groups.map((group: any) => group.test_groups).filter(Boolean) : []
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
  const { userId, testGroupIds } = await req.json();
  if (!userId || !Array.isArray(testGroupIds)) {
    return NextResponse.json({ error: "userId and testGroupIds[] are required" }, { status: 400 });
  }

  // Fetch existing assignments for this agency
  const { data: existingAssignments, error: fetchError } = await supabase
    .from("agency_test_type_groups")
    .select("test_type_group_id")
    .eq("agency_id", userId);
    
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  
  // Create a set of existing test group IDs
  const existingIds = new Set(
    (existingAssignments || []).map((entry) => entry.test_type_group_id)
  );
  
  // Identify test group IDs that need to be removed (exist in DB but not in new testGroupIds)
  const testGroupIdsToRemove = Array.from(existingIds).filter(
    (existingId) => !testGroupIds.includes(existingId)
  );
  
  // Remove test group assignments that are no longer selected
  if (testGroupIdsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("agency_test_type_groups")
      .delete()
      .eq("agency_id", userId)
      .in("test_type_group_id", testGroupIdsToRemove);
      
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }
  
  // Filter to only add test groups that don't already exist
  const newTestGroupIds = testGroupIds.filter((testGroupId: string) => !existingIds.has(testGroupId));
  
  // Add new assignments if any are provided
  if (newTestGroupIds.length > 0) {
    const inserts = newTestGroupIds.map((testGroupId: string) => ({
      agency_id: userId,
      test_type_group_id: testGroupId,
    }));
    
    const { error: insertError } = await supabase.from("agency_test_type_groups").insert(inserts);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
