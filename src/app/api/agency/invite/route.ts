import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { sendAgencyInviteEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["lab_admin"]);
    if (session instanceof NextResponse) return session;

    const { email, name } = await request.json();

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
        name: name + "'s Agency", // Default agency name
        contact_email: email,
        created_by: session.id,
      })
      .select()
      .single();

    if (agencyError) {
      return NextResponse.json({ error: agencyError.message }, { status: 500 });
    }

    // Create user with agency role
    const { error: userError } = await supabase
      .from("users")
      .insert({
        email,
        full_name: name,
        role: "agency",
        agency_id: agency.id,
        active: false,
        invitation_token: inviteToken,
      });

    if (userError) {
      // Clean up agency if user creation fails
      await supabase.from("agencies").delete().eq("id", agency.id);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Send invite email
    await sendAgencyInviteEmail(email, inviteToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Customer invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
