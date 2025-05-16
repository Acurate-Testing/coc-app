import { UserRole } from "@/constants/enums";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, phone, agency_name, address, password } =
      await request.json();
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 400 }
      );
    }

    // 2. First create the user record
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user.id,
      email,
      role: UserRole.AGENCY,
    });

    if (userError) {
      // If user creation fails, clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    // 3. Create the agency record now that the user exists
    const { data: agencyData, error: agencyError } = await supabase
      .from("agencies")
      .insert({
        name: agency_name,
        contact_email: email,
        phone,
        address,
        created_by: authData.user.id,
      })
      .select()
      .single();

    if (agencyError) {
      // If agency creation fails, clean up the user and auth user
      await supabase.from("users").delete().eq("id", authData.user.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: agencyError.message }, { status: 400 });
    }

    // 4. Update the user with the agency_id
    const { error: updateUserError } = await supabase
      .from("users")
      .update({ agency_id: agencyData.id })
      .eq("id", authData.user.id);

    if (updateUserError) {
      // If user update fails, clean up everything
      await supabase.from("agencies").delete().eq("id", agencyData.id);
      await supabase.from("users").delete().eq("id", authData.user.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: updateUserError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
