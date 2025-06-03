import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { handleDatabaseError, handleAuthError, handleApiError } from "@/lib/error-handling";

export async function POST(request: Request) {
  try {
    const { agency_name, email, phone, address, password } = await request.json();

    // Validate required fields
    if (!agency_name || !email || !password) {
      return NextResponse.json(
        { error: "Agency name, email and password are required" },
        { status: 400 }
      );
    }

    // 1. Create the agency first
    const { data: agencyData, error: agencyError } = await supabase
      .from("agencies")
      .insert([
        {
          name: agency_name,
          email,
          phone,
          address,
        },
      ])
      .select()
      .single();

    if (agencyError) {
      const error = handleDatabaseError(agencyError);
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    // 2. Create the auth user
    let authData;
    try {
      const { data, error: createError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "agency_admin",
            agency_id: agencyData.id,
            full_name: email.split("@")[0], // Default name from email
          },
        },
      });

      if (createError) {
        const error = handleAuthError(createError);
        // If user creation fails, clean up the agency
        await supabase.from("agencies").delete().eq("id", agencyData.id);
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }

      authData = { user: data.user };
    } catch (error) {
      const appError = handleAuthError(error);
      // If user creation fails, clean up the agency
      await supabase.from("agencies").delete().eq("id", agencyData.id);
      return NextResponse.json({ error: appError.message }, { status: appError.statusCode });
    }

    if (!authData.user) {
      const error = new Error("Failed to create user account");
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 3. Update the user with the agency_id
    const { error: updateUserError } = await supabase
      .from("users")
      .update({ agency_id: agencyData.id })
      .eq("id", authData.user.id);

    if (updateUserError) {
      const error = handleDatabaseError(updateUserError);
      // If user update fails, clean up everything
      await supabase.from("agencies").delete().eq("id", agencyData.id);
      await supabase.from("users").delete().eq("id", authData.user.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 201 }
    );
  } catch (error) {
    const appError = handleApiError(error);
    return NextResponse.json(
      { error: appError.message },
      { status: appError.statusCode }
    );
  }
}
