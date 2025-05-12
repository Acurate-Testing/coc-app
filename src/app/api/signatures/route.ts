import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { sampleId, signature } = await request.json();

    if (!sampleId || !signature) {
      return NextResponse.json(
        { error: "Sample ID and signature are required" },
        { status: 400 }
      );
    }

    // Verify sample exists
    const { data: sample, error: sampleError } = await supabase
      .from("samples")
      .select("id")
      .eq("id", sampleId)
      .is("deleted_at", null)
      .single();

    if (sampleError || !sample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    // Encrypt signature
    const encryptedSignature = encrypt(signature);

    // Store signature
    const { data, error } = await supabase
      .from("signatures")
      .insert({
        sample_id: sampleId,
        signature: encryptedSignature,
        created_by: session.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ signature: data });
  } catch (error) {
    console.error("Store signature error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
