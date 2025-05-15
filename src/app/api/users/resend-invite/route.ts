import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { sendUserInviteEmail } from "@/lib/email";
import crypto from "crypto";
import { UserRole } from "@/constants/enums";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
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

    // Get the user to resend invite to
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user_id)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: "Invited User not found" },
        { status: 404 }
      );
    }

    // Generate new invite token
    const inviteToken = crypto.randomBytes(32).toString("hex");

    // Update user with new invitation token
    const { error: updateError } = await supabase
      .from("users")
      .update({ invitation_token: inviteToken })
      .eq("id", user_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send invite email
    await sendUserInviteEmail(targetUser.email, inviteToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
