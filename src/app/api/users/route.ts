import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // adjust based on your project structure
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { UserRole } from "@/constants/enums";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active") === "true";

    const baseQuery = supabase
      .from("users")
      .select("id, full_name, email, role, active, created_at")
      .is("deleted_at", null) // soft delete filter
      .order("created_at", { ascending: false });

    // Apply agency filter only if not lab admin and agency_id exists
    if (session.user.role !== UserRole.LABADMIN && session.user.agency_id) {
      baseQuery.eq("agency_id", session.user.agency_id);
    }

    // Filter by active status if requested
    if (active) {
      baseQuery.eq("active", true);
    }

    const { data, error } = await baseQuery;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ users: [] });
    }

    return NextResponse.json({ users: data });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has required role
    if (![UserRole.LABADMIN, UserRole.AGENCY].includes(userData.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete the user by setting deleted_at
    const { error: deleteError } = await supabase
      .from("users")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", user_id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
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
