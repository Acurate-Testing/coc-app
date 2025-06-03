import { UserRole } from "@/constants/enums";
import { supabase } from "@/lib/supabase";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { handleDatabaseError, handleApiError } from "@/lib/error-handling";

export async function PUT(
  request: NextRequest,
  { params }: { params: { sampleId: string } }
) {
  try {
    // Verify authentication
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is lab admin (only lab admins can update status)
    if (token.role !== UserRole.LABADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const { status, notes } = await request.json();
    
    // Validate inputs
    if (!status || !['pass', 'fail'].includes(status)) {
      return NextResponse.json(
        { error: "Status must be either 'pass' or 'fail'" },
        { status: 400 }
      );
    }

    // Check if sample exists
    const { data: existingSample, error: fetchError } = await supabase
      .from("samples")
      .select("id")
      .eq("id", params.sampleId)
      .is("deleted_at", null)
      .single();

    if (fetchError) {
      const appError = handleDatabaseError(fetchError);
      return NextResponse.json({ error: appError.message }, { status: appError.statusCode });
    }

    if (!existingSample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    // Update sample with new status and notes
    const { data, error } = await supabase
      .from("samples")
      .update({
        status: status,
        pass_fail_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.sampleId)
      .select()
      .single();

    if (error) {
      const appError = handleDatabaseError(error);
      return NextResponse.json({ error: appError.message }, { status: appError.statusCode });
    }

    return NextResponse.json({ 
      success: true, 
      sample: data,
      message: `Sample status updated to ${status}` 
    });
  } catch (error) {
    const appError = handleApiError(error);
    return NextResponse.json(
      { error: appError.message },
      { status: appError.statusCode }
    );
  }
}
