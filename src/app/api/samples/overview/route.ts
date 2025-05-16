import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { SampleStatus } from "@/constants/enums";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencyId = session.user.agency_id;

    const queryForStatus = async (status?: SampleStatus) => {
      let query = supabase.from("samples").select("id", { count: "exact" });
      if (status) {
        query = query.eq("status", status);
      }
      return query.eq("agency_id", agencyId).is("deleted_at", null);
    };

    const [pending, inCoc, submitted, pass, fail, total] = await Promise.all([
      queryForStatus(SampleStatus.Pending),
      queryForStatus(SampleStatus.InCOC),
      queryForStatus(SampleStatus.Submitted),
      queryForStatus(SampleStatus.Pass),
      queryForStatus(SampleStatus.Fail),
      queryForStatus(), // total without status filter
    ]);

    if (
      pending.error ||
      inCoc.error ||
      submitted.error ||
      pass.error ||
      fail.error ||
      total.error
    ) {
      console.error("Error fetching sample counts:", {
        pendingError: pending.error,
        inCocError: inCoc.error,
        submittedError: submitted.error,
        passError: pass.error,
        failError: fail.error,
        totalError: total.error,
      });
      return NextResponse.json(
        { error: "Failed to fetch sample counts" },
        { status: 500 }
      );
    }

    const overview = {
      total: total.data?.length || 0,
      byStatus: {
        pending: pending.data?.length || 0,
        in_coc: inCoc.data?.length || 0,
        submitted: submitted.data?.length || 0,
        pass: pass.data?.length || 0,
        fail: fail.data?.length || 0,
      },
    };

    return NextResponse.json({ overview });
  } catch (error) {
    console.error("Sample overview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
// import { NextRequest, NextResponse } from "next/server";
// import { supabase } from "@/lib/supabase";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth-options";
// import { SampleStatus } from "@/constants/enums";

// export async function GET(request: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Get counts for each status
//     const { data: pendingCount, error: pendingError } = await supabase
//       .from("samples")
//       .select("id", { count: "exact" })
//       .eq("status", SampleStatus.Pending)
//       .is("deleted_at", null);

//     const { data: inCocCount, error: inCocError } = await supabase
//       .from("samples")
//       .select("id", { count: "exact" })
//       .eq("status", SampleStatus.InCOC)
//       .is("deleted_at", null);

//     const { data: submittedCount, error: submittedError } = await supabase
//       .from("samples")
//       .select("id", { count: "exact" })
//       .eq("status", SampleStatus.Submitted)
//       .is("deleted_at", null);

//     const { data: passCount, error: passError } = await supabase
//       .from("samples")
//       .select("id", { count: "exact" })
//       .eq("status", SampleStatus.Pass)
//       .is("deleted_at", null);

//     const { data: failCount, error: failError } = await supabase
//       .from("samples")
//       .select("id", { count: "exact" })
//       .eq("status", SampleStatus.Fail)
//       .is("deleted_at", null);

//     // Get total count
//     const { data: totalCount, error: totalError } = await supabase
//       .from("samples")
//       .select("id", { count: "exact" })
//       .is("deleted_at", null);

//     if (
//       pendingError ||
//       inCocError ||
//       submittedError ||
//       passError ||
//       failError ||
//       totalError
//     ) {
//       console.error("Error fetching sample counts:", {
//         pendingError,
//         inCocError,
//         submittedError,
//         passError,
//         failError,
//         totalError,
//       });
//       return NextResponse.json(
//         { error: "Failed to fetch sample counts" },
//         { status: 500 }
//       );
//     }

//     // Format the response
//     const overview = {
//       total: totalCount?.length || 0,
//       byStatus: {
//         pending: pendingCount?.length || 0,
//         in_coc: inCocCount?.length || 0,
//         submitted: submittedCount?.length || 0,
//         pass: passCount?.length || 0,
//         fail: failCount?.length || 0,
//       },
//     };

//     return NextResponse.json({ overview });
//   } catch (error) {
//     console.error("Sample overview error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
