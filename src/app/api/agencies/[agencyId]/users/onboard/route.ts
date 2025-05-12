import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { setAuthCookie } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { agencyId: string } }
) {
  try {
    const { token, fullName, password } = await request.json();

    if (!token || !fullName || !password) {
      return NextResponse.json(
        { error: "Token, full name, and password are required" },
        { status: 400 }
      );
    }

    // Verify invite token
    const { data: invite, error: inviteError } = await supabase
      .from("user_invites")
      .select("*")
      .eq("token", token)
      .eq("agency_id", params.agencyId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite token" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: invite.role,
        },
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 500 }
      );
    }

    // Create user record in database
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user.id,
      full_name: fullName,
      email: invite.email,
      role: invite.role,
      agency_id: params.agencyId,
    });

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Delete used invite
    await supabase.from("user_invites").delete().eq("token", token);

    // Set auth cookie
    if (authData.session) {
      await setAuthCookie(authData.session.access_token);
    }

    return NextResponse.json({
      user: authData.user,
    });
  } catch (error) {
    console.error("User onboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
