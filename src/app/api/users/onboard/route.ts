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

    // Create an admin client for admin operations
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    let authData;
    try {
      // Try to create a new user
      const { data, error: createError } = await adminClient.auth.admin.createUser({
        email: user.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          email_confirmed: true,
          role: user.role,
          agency_id: user.agency_id,
          full_name: user.full_name
        }
      });

      if (createError) {
        // If user already exists, try to update them
        if (createError.message.includes("already been registered")) {
          // Get the user by email using the signIn method
          const { data: existingUser, error: getUserError } = await adminClient.auth.signInWithPassword({
            email: user.email,
            password: "temporary-password" // This will fail but give us the user
          });
          
          if (getUserError?.message?.includes("Invalid login credentials")) {
            // User exists but password is wrong, which is what we want
            const { data: userData, error: userError } = await adminClient.auth.admin.listUsers();
            
            if (userError || !userData.users) {
              console.error("Get users error:", userError);
              return NextResponse.json(
                { error: "Failed to get existing user" },
                { status: 400 }
              );
            }

            const existingUser = userData.users.find(u => u.email === user.email);
            if (!existingUser) {
              return NextResponse.json(
                { error: "Failed to find existing user" },
                { status: 400 }
              );
            }

            // Update the existing user
            const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
              existingUser.id,
              {
                password: password,
                email_confirm: true,
                user_metadata: {
                  email_confirmed: true,
                  role: user.role,
                  agency_id: user.agency_id,
                  full_name: user.full_name
                }
              }
            );

            if (updateError) {
              console.error("Update user error:", updateError);
              return NextResponse.json(
                { error: "Failed to update existing user" },
                { status: 400 }
              );
            }

            authData = { user: updatedUser.user };
          } else {
            console.error("Create user error:", createError);
            return NextResponse.json(
              { error: "Failed to create user account" },
              { status: 400 }
            );
          }
        } else {
          console.error("Create user error:", createError);
          return NextResponse.json(
            { error: "Failed to create user account" },
            { status: 400 }
          );
        }
      } else {
        authData = { user: data.user };
      }
    } catch (error) {
      console.error("Auth operation error:", error);
      return NextResponse.json(
        { error: "Failed to process user account" },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to process user account" },
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
      console.error("Update error:", updateError);
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