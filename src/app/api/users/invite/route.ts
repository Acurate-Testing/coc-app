import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { sendUserInviteEmail } from "@/lib/email";
import { authOptions } from "@/lib/auth-options";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    if (!["lab_admin", "agency"].includes(userData.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, email } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString("hex");

    // Create agency first
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .insert({
        name: `${name}'s Agency`,
        contact_email: email,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (agencyError) {
      console.error("Error creating agency:", agencyError);
      return NextResponse.json({ error: agencyError.message }, { status: 500 });
    }

    // Store user in database with invitation token
    const { data: newUser, error: inviteError } = await supabase
      .from("users")
      .insert({
        email,
        role: "agency",
        active: false,
        full_name: name,
        agency_id: agency.id,
        invitation_token: inviteToken,
      })
      .select()
      .single();

    if (inviteError) {
      // If user creation fails, clean up the agency
      await supabase.from("agencies").delete().eq("id", agency.id);
      console.error("Error creating user:", inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    // Send invite email
    await sendUserInviteEmail(email, inviteToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
