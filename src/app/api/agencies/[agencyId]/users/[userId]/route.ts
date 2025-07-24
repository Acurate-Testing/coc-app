import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { agencyId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", params.userId)
      .eq("agency_id", params.agencyId)
      .is("deleted_at", null)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { agencyId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, full_name, role, agency_name, phone, street, city, state, zip } = body;

    // Update user
    const { data, error } = await supabase
      .from("users")
      .update({
        email,
        full_name,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.userId)
      .eq("agency_id", params.agencyId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If role is not "user", update agency details if provided
    if (role && role !== "user") {
      const agencyUpdate: Record<string, any> = {};
      if (agency_name !== undefined) agencyUpdate.name = agency_name;
      if (phone !== undefined) agencyUpdate.phone = phone;
      if (street !== undefined) agencyUpdate.street = street;
      if (city !== undefined) agencyUpdate.city = city;
      if (state !== undefined) agencyUpdate.state = state;
      if (zip !== undefined) agencyUpdate.zip = zip;

      if (Object.keys(agencyUpdate).length > 0) {
        const { error: agencyError } = await supabase
          .from("agencies")
          .update(agencyUpdate)
          .eq("id", params.agencyId);

        if (agencyError) {
          return NextResponse.json({ error: agencyError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { agencyId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("users")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", params.userId)
      .eq("agency_id", params.agencyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}