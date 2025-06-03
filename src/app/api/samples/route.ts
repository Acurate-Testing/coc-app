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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const agencyId = searchParams.get("agencyId");

    let query = supabase
      .from("samples")
      .select(
        `
        *,
        account:accounts(name),
        agency:agencies(name),
        test_types:test_types(id,name),
        created_by_user:users(id, full_name)
      `,
        { count: "exact" }
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Apply search filter if provided
    if (search) {
      query = query.or(
        `pws_id.ilike.%${search}%,matrix_name.ilike.%${search}%,sample_location.ilike.%${search}%`
      );
    }

    // Apply status filter if provided
    if (status && status !== "All") {
      query = query.eq("status", status.toLowerCase());
    }

    // Apply agency filter if provided or if user is not a lab admin
    if (agencyId && agencyId !== "null") {
      query = query.eq("agency_id", agencyId);
    } else if (session.user.role === "lab_admin") {
      // No additional filter needed
    } else if (session.user.agency_id) {
      // For non-admin users with an agency, only show their agency's samples
      query = query.eq("agency_id", session.user.agency_id);
    } else {
      // For users without a role or agency, show no samples
      return NextResponse.json({
        samples: [],
        total: 0,
        page,
        pageSize,
      });
    }

    // Apply pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Samples API: Query error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      samples: data,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Samples API: Unexpected error", error);
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
