import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { TestType } from "@/types/sample";

const LAB_ADMIN_ID = process.env.NEXT_PUBLIC_LAB_ADMIN_ID;

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
    if (updateData.test_types.length > 0) {
      const testTypeEntries = updateData.test_types.map(
        (testType: TestType) => ({
          sample_id: data.id,
          test_type_id: testType.id,
        })
      );

      // Step 1: Fetch existing entries for this sample_id
      const { data: existingEntries, error: fetchError } = await supabase
        .from("sample_test_types")
        .select("test_type_id")
        .eq("sample_id", data.id);

      if (fetchError) {
        console.error("Error fetching existing test types:", fetchError);
        return NextResponse.json(
          { error: "Failed to fetch existing test types" },
          { status: 500 }
        );
      }

      // Step 2: Filter out test types that already exist
      const existingIds = new Set(
        (existingEntries || []).map((entry) => entry.test_type_id)
      );
      const newEntries = testTypeEntries.filter(
        (entry: any) => !existingIds.has(entry.test_type_id)
      );

      if (newEntries.length > 0) {
        // Step 3: Insert only new test_type entries
        const { error: insertError } = await supabase
          .from("sample_test_types")
          .insert(newEntries);

        if (insertError) {
          console.error("Error inserting test types:", insertError);
          return NextResponse.json(
            { error: "Failed to associate new test types with sample" },
            { status: 500 }
          );
        }
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
