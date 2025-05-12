import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(request, ["lab_admin"]);
    if (session instanceof NextResponse) return session;

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Verify test type exists
    const { data: existingType, error: fetchError } = await supabase
      .from("test_types")
      .select("id")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existingType) {
      return NextResponse.json(
        { error: "Test type not found" },
        { status: 404 }
      );
    }

    // Update test type
    const { data, error } = await supabase
      .from("test_types")
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ testType: data });
  } catch (error) {
    console.error("Update test type error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(request, ["lab_admin"]);
    if (session instanceof NextResponse) return session;

    // Verify test type exists
    const { data: existingType, error: fetchError } = await supabase
      .from("test_types")
      .select("id")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existingType) {
      return NextResponse.json(
        { error: "Test type not found" },
        { status: 404 }
      );
    }

    // Soft delete test type
    const { error } = await supabase
      .from("test_types")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete test type error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
