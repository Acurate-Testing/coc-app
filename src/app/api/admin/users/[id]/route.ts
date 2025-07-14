import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Soft delete a user by setting deleted_at timestamp
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  // Perform soft delete by updating deleted_at field
  const { error } = await supabase
    .from("agencies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "User successfully deleted" });
}
