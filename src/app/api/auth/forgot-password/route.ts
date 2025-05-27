import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // First, check if the user exists
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError) {
      console.error("Error finding user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a reset token
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/set-password`,
    });

    if (error) {
      console.error("Supabase reset password error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send custom reset email using the user's ID as token
    if (userData?.id) {
      try {
        const emailResult = await sendPasswordResetEmail(email, userData.id);
      } catch (emailError) {
        console.error("Error sending custom reset email:", emailError);
        // Don't return error here, as Supabase reset email was sent successfully
      }
    } else {
      console.error("No user ID available for custom reset email");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
