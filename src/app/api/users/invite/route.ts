import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { sendUserInviteEmail } from "@/lib/email";
import { authOptions } from "@/lib/auth-options";
import crypto from "crypto";
import { UserRole } from "@/constants/enums";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has required role
    if (![UserRole.LABADMIN, UserRole.AGENCY].includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, email, role } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (role && ![UserRole.USER, UserRole.AGENCY].includes(role as UserRole)) {
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString("hex");

    let agencyId = session.user.agency_id;

    // If role is agency, create a new agency first
    if (role === UserRole.AGENCY) {
      const { data: agency, error: agencyError } = await supabase
        .from("agencies")
        .insert({
          name: name + "'s Agency", // Default agency name
          contact_email: email,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (agencyError) {
        console.error("Error creating agency:", agencyError);
        return NextResponse.json({ error: agencyError.message }, { status: 500 });
      }

      agencyId = agency.id;
    }

    // Store user in database with invitation token
    const { data: newUser, error: inviteError } = await supabase
      .from("users")
      .insert({
        email,
        role: role || UserRole.USER,
        active: false,
        full_name: name,
        agency_id: agencyId,
        invitation_token: inviteToken,
      })
      .select()
      .single();

    if (inviteError) {
      // If user creation fails and we created an agency, clean it up
      if (role === UserRole.AGENCY) {
        await supabase.from("agencies").delete().eq("id", agencyId);
      }
      console.error("Error creating user:", inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    // Send invite email
    await sendUserInviteEmail(email, inviteToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
