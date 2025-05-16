import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { data: agencies, error } = await supabase
      .from("agencies")
      .select("id, name")
      .is("deleted_at", null)
      .order("name");

    if (error) {
      console.error("Error fetching agencies:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agencies: agencies || [] });
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 