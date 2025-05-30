import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { SampleStatus } from "@/constants/enums";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { sendEmail } from "@/lib/email";
import { sampleDetailTemplate } from "@/lib/emailTemplates";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Get bucket name from env or default
const COC_BUCKET = process.env.SUPABASE_COC_BUCKET || 'acurate-testing-data';
if (!COC_BUCKET) {
  throw new Error('Missing SUPABASE_COC_BUCKET environment variable');
}

const LAB_ADMIN_ID = process.env.NEXT_PUBLIC_LAB_ADMIN_ID;

export async function GET(
  request: NextRequest,
  { params }: { params: { sampleId: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { data, error } = await supabase
      .from("coc_transfers")
      .select(
        `
        *,
        transferred_by:users!transferred_by(full_name),
        received_by:users!received_by(full_name)
      `
      )
      .eq("sample_id", params.sampleId)
      .is("deleted_at", null)
      .order("timestamp", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transfers: data });
  } catch (error) {
    console.error("Get COC history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { sample_id, coc_data } = await request.json();

    // Verify user has access to this sample
    const { data: sample, error: sampleError } = await supabase
      .from("samples")
      .select("agency_id")
      .eq("id", sample_id)
      .single();

    if (sampleError || !sample) {
      return NextResponse.json(
        { error: "Sample not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this agency
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

    // Allow access if user is lab admin or belongs to the same agency
    if (user.role !== "lab_admin" && user.agency_id !== sample.agency_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update the sample with COC data
    const { error: updateError } = await supabase
      .from("samples")
      .update({
        coc_data,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id,
      })
      .eq("id", sample_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update sample" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("COC update error:", error);
    return NextResponse.json(
      { error: "Failed to update COC" },
      { status: 500 }
    );
  }
}
