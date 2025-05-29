import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { TestType } from "@/types/sample";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { sampleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("samples")
      .select(
        `
      *,
      account:accounts(name),
      agency:agencies(name),
      test_types:test_types(id,name),
      created_by_user:users(id, full_name),
        coc_transfers(
          id,
          transferred_by,
          received_by,
          timestamp,
          latitude,
          longitude,
          signature,
          photo_url,
          received_by_user:users!coc_transfers_received_by_fkey(id, full_name, email,role)
        )
      `
      )
      .eq("id", params.sampleId)
      .is("deleted_at", null)
      .order("timestamp", { foreignTable: "coc_transfers", ascending: false })
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData = await request.json();
    const allowedFields = [
      "project_id",
      "agency_id",
      "account_id",
      "created_by",
      "pws_id",
      "matrix_type",
      "matrix_name",
      "sample_privacy",
      "compliance",
      "chlorine_residual",
      "county",
      "sample_type",
      "sample_location",
      "source",
      "latitude",
      "longitude",
      "sample_collected_at",
      "temperature",
      "notes",
      "pass_fail_notes",
      "attachment_url",
      "created_at",
      "updated_at",
      "saved_at",
      "deleted_at",
    ];

    // Filter only valid fields
    const filteredUpdateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in updateData) {
        filteredUpdateData[key] = updateData[key];
      }
    }

    // Always update the updated_at timestamp
    filteredUpdateData.updated_at = new Date().toISOString();

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
      .update(filteredUpdateData)
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
