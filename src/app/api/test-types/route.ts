import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ["lab_admin", "agency", "user"]);
    if (session instanceof NextResponse) return session;

    const { data, error } = await supabase
      .from("test_types")
      .select("*")
      .is("deleted_at", null)
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ testTypes: data });
  } catch (error) {
    console.error("Get test types error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["lab_admin"]);
    if (session instanceof NextResponse) return session;

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("test_types")
      .insert({
        name,
        description,
        created_by: session.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ testType: data });
  } catch (error) {
    console.error("Create test type error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
