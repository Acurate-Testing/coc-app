import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// List all users
export async function GET() {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, assigned_tests:test_types(id, name)")
    .is("deleted_at", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// Assign tests to a user
export async function PATCH(req: NextRequest) {
  const { userId, testIds } = await req.json();
  if (!userId || !Array.isArray(testIds)) {
    return NextResponse.json({ error: "userId and testIds[] are required" }, { status: 400 });
  }
  // Remove existing assignments
  const { error: deleteError } = await supabase
    .from("user_test_types")
    .delete()
    .eq("user_id", userId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Add new assignments if any are provided
  if (testIds.length > 0) {
    const inserts = testIds.map((testId: string) => ({
      user_id: userId,
      test_type_id: testId,
    }));
    const { error: insertError } = await supabase
      .from("user_test_types")
      .insert(inserts);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
