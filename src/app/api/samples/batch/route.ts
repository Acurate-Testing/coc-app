import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { parse } from "papaparse";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const { data: csvData, errors } = parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Invalid CSV format", details: errors },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["project_id", "agency_id", "account_id"];
    const invalidRows = csvData.filter((row: any) =>
      requiredFields.some((field) => !row[field])
    );

    if (invalidRows.length > 0) {
      return NextResponse.json(
        { error: "Missing required fields in some rows", rows: invalidRows },
        { status: 400 }
      );
    }

    // Prepare samples for insertion
    const samples = csvData.map((row: any) => ({
      ...row,
      created_by: session.id,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert samples
    const { data, error } = await supabase
      .from("samples")
      .insert(samples)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Successfully imported ${data.length} samples`,
      samples: data,
    });
  } catch (error) {
    console.error("Batch import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
