import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const agencyId = searchParams.get("agencyId");
    const status = searchParams.get("status");
    const testType = searchParams.get("testType");
    const limit = 10;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("samples")
      .select(
        `
        *,
        agency:agencies(name),
        account:accounts(name),
        test_types:test_types(name)
      `,
        { count: "exact" }
      )
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

    if (testType) {
      query = query.contains("test_types", [{ id: testType }]);
    }

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

    // Validate required fields
    const requiredFields = ["agency_id"];
    for (const field of requiredFields) {
      if (!sampleData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Add created_by and set initial status
    const { data, error } = await supabase
      .from("samples")
      .insert({
        ...sampleData,
        created_by: token.sub,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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
