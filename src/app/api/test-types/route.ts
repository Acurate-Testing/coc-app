import { requireRole } from "@/lib/auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";


export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const agencyID = session?.user?.agency_id;
    
    // Fetch all test types
    const { data: testTypes, error } = await supabase
      .from("test_types")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If user has an agency ID, check for agency-specific test types
    if (agencyID) {
      // Query agency_test_types table
      const { data: agencyTestTypes, error: agencyError } = await supabase
        .from("agency_test_types")
        .select("test_type_id")
        .eq("agency_id", agencyID);

      if (agencyError) {
        console.error("Error fetching agency test types:", agencyError);
      } else if (agencyTestTypes && agencyTestTypes.length > 0) {
        // If agency has specific test types, filter the list
        const testTypeIds = agencyTestTypes.map(item => item.test_type_id);
        const filteredTestTypes = testTypes.filter(testType => 
          testTypeIds.includes(testType.id)
        );
        
        // Return filtered test types
        return NextResponse.json({ testTypes: filteredTestTypes });
      }
    }

    // If no agency ID, no matching test types, or error occurred, return all test types
    return NextResponse.json({ testTypes });
  } catch (error) {
    console.error("Error fetching test types:", error);
    return NextResponse.json(
      { error: "Failed to fetch test types" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["lab_admin"]);
    if (session instanceof NextResponse) return session;

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("test_types")
      .insert({
        name,
        description,
        created_by: session.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ testType: data });
  } catch (error) {
    console.error("Create test type error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
