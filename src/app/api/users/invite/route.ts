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

    const { name, email } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
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

    // Set role based on inviter's role
    const newUserRole = session.user.role === UserRole.LABADMIN ? UserRole.AGENCY : UserRole.USER;

    // Store user in database with invitation token
    const { data: newUser, error: inviteError } = await supabase
      .from("users")
      .insert({
        email,
        role: newUserRole,
        active: false,
        full_name: name,
        agency_id: session.user.agency_id,
        invitation_token: inviteToken,
      })
      .select()
      .single();

    if (inviteError) {
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
