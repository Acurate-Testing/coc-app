import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    // Create a Supabase client without cookie handling for this public route
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { token, password } = await request.json();

    // Validate the token
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("invitation_token", token)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired invite link" },
        { status: 400 }
      );
    }

    // Check if user already has a password set
    if (user.password_hash) {
      return NextResponse.json(
        { error: "This invite has already been used" },
        { status: 400 }
      );
    }

    // Create the user in Supabase Auth with email confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.email,
      password: password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          email_confirmed: true
        }
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 400 }
      );
    }

    // Confirm the email automatically since we've verified through invitation
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      authData.user.id,
      { 
        email_confirm: true,
        user_metadata: {
          email_confirmed: true
        }
      }
    );

    if (confirmError) {
      // If email confirmation fails, clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to confirm email" },
        { status: 400 }
      );
    }

    // Update the user record in the users table
    const { error: updateError } = await supabase
      .from("users")
      .update({
        id: authData.user.id,
        invitation_token: null,
        active: true,
      })
      .eq("invitation_token", token);

    if (updateError) {
      // If user update fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to update user record" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 