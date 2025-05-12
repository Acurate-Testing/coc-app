import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";

export async function GET(
  request: NextRequest,
  { params }: { params: { sampleId: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { data, error } = await supabase
      .from("coc_transfers")
      .select(
        `
        *,
        transferred_by:users!transferred_by(full_name),
        received_by:users!received_by(full_name)
      `
      )
      .eq("sample_id", params.sampleId)
      .is("deleted_at", null)
      .order("timestamp", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transfers: data });
  } catch (error) {
    console.error("Get COC history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sampleId: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { received_by, latitude, longitude, signature } =
      await request.json();

    if (!received_by || !signature) {
      return NextResponse.json(
        { error: "Received by and signature are required" },
        { status: 400 }
      );
    }

    // Verify sample exists and is not deleted
    const { data: sample, error: sampleError } = await supabase
      .from("samples")
      .select("*")
      .eq("id", params.sampleId)
      .is("deleted_at", null)
      .single();

    if (sampleError || !sample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    // Create transfer record
    const { data, error } = await supabase
      .from("coc_transfers")
      .insert({
        sample_id: params.sampleId,
        transferred_by: session.id,
        received_by,
        latitude,
        longitude,
        signature: encrypt(signature), // Encrypt signature
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update sample status
    const { error: updateError } = await supabase
      .from("samples")
      .update({ status: "in_coc" })
      .eq("id", params.sampleId);

    if (updateError) {
      console.error("Failed to update sample status:", updateError);
    }

    return NextResponse.json({ transfer: data });
  } catch (error) {
    console.error("Create COC transfer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
