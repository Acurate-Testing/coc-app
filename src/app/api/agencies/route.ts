import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.supabaseToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data: agencies, error } = await supabase
      .from("agencies")
      .select("id, name, contact_email")
      .is("deleted_at", null)
      .order("name");

    if (error) {
      console.error("Error fetching agencies:", error);
      return NextResponse.json(
        { error: "Failed to fetch agencies" },
        { status: 500 }
      );
    }

    return NextResponse.json({ agencies });
  } catch (error) {
    console.error("Error in GET /api/agencies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, city, state, zip, phone, email } = body;

    const { data, error } = await supabase
      .from("agencies")
      .insert([
        {
          name,
          address,
          city,
          state,
          zip,
          phone,
          email,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agency: data });
  } catch (error) {
    console.error("Create agency error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 