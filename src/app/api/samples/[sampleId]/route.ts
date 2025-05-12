import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { sampleId: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { data, error } = await supabase
      .from("samples")
      .select(
        `
        *,
        agency:agencies(name),
        account:accounts(name),
        test_types:test_types(name),
        coc_transfers(
          id,
          transferred_by,
          received_by,
          timestamp,
          latitude,
          longitude,
          signature
        )
      `
      )
      .eq("id", params.sampleId)
      .is("deleted_at", null)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    return NextResponse.json({ sample: data });
  } catch (error) {
    console.error("Get sample error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { sampleId: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const updateData = await request.json();

    // Verify sample exists
    const { data: existingSample, error: fetchError } = await supabase
      .from("samples")
      .select("id")
      .eq("id", params.sampleId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existingSample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    // Update sample
    const { data, error } = await supabase
      .from("samples")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.sampleId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sample: data });
  } catch (error) {
    console.error("Update sample error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
