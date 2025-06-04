import { SampleStatus } from "@/constants/enums";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agency = searchParams.get('agency');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status');

  let query = supabase
    .from("samples")
    .select("*", { count: "exact" })
    .is("deleted_at", null);

  if (agency) {
    query = query.eq("agency_id", agency);
  }

  if (search) {
    query = query.ilike("project_id", `%${search}%`);
  }

  // Handle status filter
  if (status) {
    if (status.includes(',')) {
      // For "All" tab in admin view, show submitted, passed, and failed samples
      const statuses = status.split(',');
      query = query.in('status', statuses);
    } else {
      query = query.eq('status', status);
    }
  }

  // Add pagination
  query = query
    .range(page * limit, (page + 1) * limit - 1)
    .order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    samples: data,
    total: count,
    totalPages: Math.ceil((count || 0) / limit)
  });
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Sample ID is required" },
        { status: 400 }
      );
    }

    // Verify sample exists before deleting
    const { data: existingSample, error: fetchError } = await supabase
      .from("samples")
      .select("id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existingSample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    // Soft delete the sample
    const { error } = await supabase
      .from("samples")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error deleting sample:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/samples:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}