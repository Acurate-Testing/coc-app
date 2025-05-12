import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clear the auth cookie
    await clearAuthCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
