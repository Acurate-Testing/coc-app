import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { SampleStatus, UserRole } from "@/constants/enums";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencyId = session.user.agency_id;
    
    // Initialize query
    let query = supabase.from("samples").select("status", { count: "exact" })
      .is("deleted_at", null);
    
    // Apply agency filter based on user role
    if (session.user.role !== UserRole.LABADMIN && agencyId) {
      query = query.eq("agency_id", agencyId);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching sample overview:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Count samples by status
    const overview = {
      byStatus: {
        pending: data.filter(s => s.status === SampleStatus.Pending).length,
        in_coc: data.filter(s => s.status === SampleStatus.InCOC).length,
        submitted: data.filter(s => s.status === SampleStatus.Submitted).length,
        pass: data.filter(s => s.status === SampleStatus.Pass).length,
        fail: data.filter(s => s.status === SampleStatus.Fail).length
      },
      total: data.length
    };
    
    return NextResponse.json({ overview });
  } catch (error) {
    console.error("Unexpected error in GET /api/samples/overview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
