import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// List all users
export async function GET() {
  const { data, error } = await supabase
    .from("agencies")
    .select("id, name, contact_email, assigned_tests:test_types(id, name, test_code, matrix_types), accounts(name)")
    .is("deleted_at", null);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Transform the data to format accounts as string arrays
  const formattedData = data?.map(user => ({
    ...user,
    accounts: user.accounts ? user.accounts.map((account: {name: string}) => account.name) : []
  }));
  
  return NextResponse.json(formattedData);
}

// Delete a test assignment from a user
export async function DELETE(req: NextRequest) {
  const { userId, testId } = await req.json();

  if (!userId || !testId) {
    return NextResponse.json({ error: "userId and testId are required" }, { status: 400 });
  }

  // Remove the test assignment from the agency_test_types table
  const { error } = await supabase
    .from("agency_test_types")
    .delete()
    .eq("agency_id", userId)
    .eq("test_type_id", testId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Assign tests to a user
export async function PATCH(req: NextRequest) {
  const { userId, testIds } = await req.json();
  if (!userId || !Array.isArray(testIds)) {
    return NextResponse.json({ error: "userId and testIds[] are required" }, { status: 400 });
  }

  // Fetch existing assignments for this agency
  const { data: existingAssignments, error: fetchError } = await supabase
    .from("agency_test_types")
    .select("test_type_id")
    .eq("agency_id", userId);
    
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  
  // Create a set of existing test type IDs
  const existingIds = new Set(
    (existingAssignments || []).map((entry) => entry.test_type_id)
  );
  
  // Identify test IDs that need to be removed (exist in DB but not in new testIds)
  const testIdsToRemove = Array.from(existingIds).filter(
    (existingId) => !testIds.includes(existingId)
  );
  
  // Remove test assignments that are no longer selected
  if (testIdsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("agency_test_types")
      .delete()
      .eq("agency_id", userId)
      .in("test_type_id", testIdsToRemove);
      
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }
  
  // Filter to only add test types that don't already exist
  const newTestIds = testIds.filter((testId: string) => !existingIds.has(testId));
  
  // Add new assignments if any are provided
  if (newTestIds.length > 0) {
    const inserts = newTestIds.map((testId: string) => ({
      agency_id: userId,
      test_type_id: testId,
    }));
    
    const { error: insertError } = await supabase.from("agency_test_types").insert(inserts);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
