import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { sendUserInviteEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: { agencyId: string } }
) {
  try {
    const session = await requireRole(request, ["lab_admin", "agency"]);
    if (session instanceof NextResponse) return session;

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Verify agency exists
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id")
      .eq("id", params.agencyId)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString("hex");

    // Store invite in database
    const { error: inviteError } = await supabase.from("user_invites").insert({
      email,
      role,
      agency_id: params.agencyId,
      token: inviteToken,
      created_by: session.id,
    });

    if (inviteError) {
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
