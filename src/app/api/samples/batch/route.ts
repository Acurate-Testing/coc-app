import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parse } from "papaparse";

export async function POST(request: Request) {
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

    const { samples } = await request.json();

    // Verify user has access to create samples
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("agency_id, role")
      .eq("id", session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only allow lab admin or agency users to create samples
    if (user.role !== "lab_admin" && user.role !== "agency_user") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Add agency_id and created_by to each sample
    const samplesWithMetadata = samples.map((sample: any) => ({
      ...sample,
      agency_id: user.agency_id,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("samples")
      .insert(samplesWithMetadata)
      .select();

    if (error) {
      console.error("Batch insert error:", error);
      return NextResponse.json(
        { error: "Failed to create samples" },
        { status: 500 }
      );
    }

    return NextResponse.json({ samples: data });
  } catch (error) {
    console.error("Batch samples error:", error);
    return NextResponse.json(
      { error: "Failed to process samples" },
      { status: 500 }
    );
  }
}
