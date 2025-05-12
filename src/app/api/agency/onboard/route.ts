import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { token, name, address, contactEmail, password } =
      await request.json();

    if (!token || !name || !address || !contactEmail || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Verify invite token
    const { data: invite, error: inviteError } = await supabase
      .from("agency_invites")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite token" },
        { status: 400 }
      );
    }

    // Create agency
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .insert({
        name,
        contact_email: contactEmail,
        created_by: invite.created_by,
      })
      .select()
      .single();

    if (agencyError) {
      return NextResponse.json({ error: agencyError.message }, { status: 500 });
    }

    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: contactEmail,
      password,
      options: {
        data: {
          full_name: name,
          role: "agency",
        },
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 500 }
      );
    }

    // Create user record
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user.id,
      full_name: name,
      email: contactEmail,
      role: "agency",
      agency_id: agency.id,
    });

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Delete used invite
    await supabase.from("agency_invites").delete().eq("token", token);

    // Set auth cookie
    if (authData.session) {
      await setAuthCookie(authData.session.access_token);
    }

    return NextResponse.json({
      agency,
      user: authData.user,
    });
  } catch (error) {
    console.error("Agency onboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
