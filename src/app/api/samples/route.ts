import { authOptions } from '@/lib/auth-options';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { handleDatabaseError, handleApiError } from "@/lib/error-handling";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    
    // Get agency filter from query params
    const agencyIdParam = searchParams.get("agencyId");
    
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Use agency_id from session if no explicit agency filter provided
    const agencyId = agencyIdParam || session.user.agency_id;
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookies().set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookies().set({ name, value: "", ...options });
          },
        },
      }
    );

    // Initialize query
    let query = supabase
      .from("samples")
      .select(`
        *,
        account:accounts(name),
        agency:agencies(name,street,city,state,zip),
        test_types:test_types(id,name),
        created_by_user:users(id, full_name)
      `, { count: "exact" })
      .is("deleted_at", null);
    
    // Apply agency filter based on user role
    if (session.user.role !== "lab_admin" && agencyId) {
      query = query.eq("agency_id", agencyId);
    }
    
    // Apply search filter if provided
    if (search) {
      query = query.ilike("project_id", `%${search}%`);
    }
    
    // Apply status filter
    if (status) {
      if (status.includes(',')) {
        // For multiple statuses (e.g., "pending,in_coc")
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
      console.error("Error fetching samples:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      samples: data,
      total: count,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/samples:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.supabaseToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookies().set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookies().set({ name, value: "", ...options });
          },
        },
      }
    );

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
      "test_group_id",
    ];

    const filteredSampleData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in sampleData) {
        filteredSampleData[key] = sampleData[key];
      }
    }

    // Validate required fields
    const requiredFields = ["agency_id"];
    for (const field of requiredFields) {
      if (!filteredSampleData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Add created_by and default status
    filteredSampleData.created_by = session.user.id;
    filteredSampleData.status = "pending";
    filteredSampleData.updated_at = new Date().toISOString();


    // Add created_by and set initial status
    const { data, error } = await supabase
      .from("samples")
      .insert(filteredSampleData)
      .select()
      .single();

    if (error) {
      const appError = handleDatabaseError(error);
      return NextResponse.json({ error: appError.message }, { status: appError.statusCode });
    }

    if (sampleData.test_types?.length > 0) {
      const testTypeEntries = sampleData.test_types.map(
        (testType: any) => ({
          sample_id: data.id,
          test_type_id: testType.id,
        })
      );

      const { error: testSampleError } = await supabase
        .from("sample_test_types")
        .insert(testTypeEntries)
        .select();

      if (testSampleError) {
        const appError = handleDatabaseError(testSampleError);
        return NextResponse.json({ error: appError.message }, { status: appError.statusCode });
      }
    }

    // Store test group information if provided
    if (sampleData.test_group_id) {
      const { error: testGroupError } = await supabase
        .from("samples")
        .update({ test_group_id: sampleData.test_group_id })
        .eq("id", data.id);

      if (testGroupError) {
        console.error("Error updating sample with test group:", testGroupError);
        // Don't fail the request for test group error, just log it
      }
    }

    return NextResponse.json({ sample: data });
  } catch (error) {
    const appError = handleApiError(error);
    return NextResponse.json(
      { error: appError.message },
      { status: appError.statusCode }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookies().set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookies().set({ name, value: "", ...options });
          },
        },
      }
    );

    const searchParams = request.nextUrl.searchParams;
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
    console.error("Error in DELETE /api/samples:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
