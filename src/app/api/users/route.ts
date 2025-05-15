import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // adjust based on your project structure

export async function GET(request: NextRequest) {
  try {
    // Optional: authentication check
    // const session = await requireAuth(request);
    // if (session instanceof NextResponse) return session;

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email")
      .is("deleted_at", null); // if soft deletes are used

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
