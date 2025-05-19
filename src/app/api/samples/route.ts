import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getToken } from "next-auth/jwt";
import { TestType } from "@/types/sample";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page"));
    const limit = 10;
    const search = searchParams.get("search") || "";
    const agencyId = searchParams.get("agencyId");
    const status = searchParams.get("status");
    // const testType = searchParams.get("testType");
    const offset = page * 10;

    let query = supabase
      .from("samples")
      .select(
        `
        *,
        agency:agencies(name),
        account:accounts(name),
        sample_test_types(
          test_types(id, name)
        )
      `,
        { count: "exact" }
      )
      .eq("agency_id", token.agency_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`project_id.ilike.%${search}%,pws_id.ilike.%${search}%`);
    }

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // if (testType) {
    //   query = query.contains("test_types", [{ id: testType }]);
    // }

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      samples: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Get samples error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sampleData = await request.json();

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
      "status",
      "pass_fail_notes",
      "attachment_url",
      "created_at",
      "updated_at",
      "saved_at",
      "deleted_at",
    ];

    const filteredSampleData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in sampleData) {
        filteredSampleData[key] = sampleData[key];
      }
    }

    // ✅ Validate required fields
    const requiredFields = ["agency_id"];
    for (const field of requiredFields) {
      if (!filteredSampleData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // ✅ Add created_by and default status
    filteredSampleData.created_by = token.sub;
    filteredSampleData.status = "pending";
    filteredSampleData.updated_at = new Date().toISOString();

    // Add created_by and set initial status
    const { data, error } = await supabase
      .from("samples")
      .insert(filteredSampleData)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (sampleData.test_types.length > 0) {
      const testTypeEntries = sampleData.test_types.map(
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

    return NextResponse.json({ sample: data });
  } catch (error) {
    console.error("Create sample error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Sample ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("samples")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Sample deleted successfully" });
  } catch (error) {
    console.error("Delete sample error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
