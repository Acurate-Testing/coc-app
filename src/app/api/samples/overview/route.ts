import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { SampleStatus, UserRole } from "@/constants/enums";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencyId = session.user.agency_id;
    const isLabAdmin = session.user.role === UserRole.LABADMIN;

    const queryForStatus = async (status?: SampleStatus) => {
      let query = supabase.from("samples").select("id", { count: "exact" });
      if (status) {
        query = query.eq("status", status);
      }
      if (!isLabAdmin) {
        query = query.eq("agency_id", agencyId);
      }
      return query.is("deleted_at", null);
    };

    // Build queries depending on role
    const queries = isLabAdmin
      ? [
          queryForStatus(SampleStatus.Submitted),
          queryForStatus(SampleStatus.Pass),
          queryForStatus(SampleStatus.Fail),
        ]
      : [
          queryForStatus(SampleStatus.Pending),
          queryForStatus(SampleStatus.InCOC),
          queryForStatus(SampleStatus.Submitted),
          queryForStatus(SampleStatus.Pass),
          queryForStatus(SampleStatus.Fail),
          queryForStatus(), // total
        ];

    const results: any = await Promise.all(queries);

    // Check for any errors
    const hasError = results.some((res: any) => res.error);
    if (hasError) {
      console.error(
        "Error fetching sample counts:",
        results.map((r: any) => r.error)
      );
      return NextResponse.json(
        { error: "Failed to fetch sample counts" },
        { status: 500 }
      );
    }

    if (isLabAdmin) {
      const [submitted, pass, fail] = results;
      return NextResponse.json({
        overview: {
          total:
            submitted?.data?.length + pass?.data?.length + fail?.data?.length,
          byStatus: {
            submitted: submitted.data.length,
            pass: pass.data.length,
            fail: fail.data.length,
          },
        },
      });
    } else {
      const [pending, inCoc, submitted, pass, fail, total] = results;
      return NextResponse.json({
        overview: {
          total: total.data.length,
          byStatus: {
            pending: pending.data.length,
            in_coc: inCoc.data.length,
            submitted: submitted.data.length,
            pass: pass.data.length,
            fail: fail.data.length,
          },
        },
      });
    }
  } catch (error) {
    console.error("Sample overview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
