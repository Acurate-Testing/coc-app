import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { TestType } from "@/types/sample";

export async function GET(
  request: NextRequest,
  { params }: { params: { sampleId: string } }
) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // const session = await requireAuth(request);
    // if (session instanceof NextResponse) return session;

    const { data, error } = await supabase
      .from("samples")
      .select(
        `
      *,
      account:accounts(name),
      agency:agencies(name),
      test_types:test_types(id,name),
        coc_transfers(
          id,
          transferred_by,
          received_by,
          timestamp,
          latitude,
          longitude,
          signature,
          received_by_user:users!coc_transfers_received_by_fkey(id, full_name, email,role)
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
    // const session = await requireAuth(request);
    // if (session instanceof NextResponse) return session;

    const token = await getToken({ req: request });
    if (!token) {
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
      "status",
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
    if (updateData.test_types.length > 0) {
      const testTypeEntries = updateData.test_types.map(
        (testType: TestType) => ({
          sample_id: data.id,
          test_type_id: testType.id,
        })
      );

      const { data: testSamplesData, error: testSampleError } = await supabase
        .from("sample_test_types")
        .insert(testTypeEntries)
        .select();

      if (testSampleError) {
        console.error("Error inserting test types:", testSampleError);
        return NextResponse.json(
          { error: "Failed to associate test types with sample" },
          { status: 500 }
        );
      }
    }

    // if (updateData?.coc_transfers) {
    //   const { data: cocTransferData, error: cocTransferError } = await supabase
    //     .from("coc_transfers")
    //     .insert({
    //       sample_id: data?.id,
    //       transferred_by: token?.sub,
    //       received_by: updateData.coc_transfers,
    //       latitude: data?.latitude,
    //       longitude: data?.longitude, // Fixed typo
    //       signature: token?.sub,
    //     })
    //     .select()
    //     .single();

    //   transferData = cocTransferData;

    //   if (cocTransferError) {
    //     return NextResponse.json(
    //       { error: cocTransferError.message },
    //       { status: 500 }
    //     );
    //   }
    // }

    if (error) {
      return NextResponse.json({ error: error }, { status: 500 });
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
