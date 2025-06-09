import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.supabaseToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookies().set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookies().set({ name, value: "", ...options });
          },
        },
      }
    );

    const { agency_name, address, email, phone, password } = await request.json();

    // Create the agency
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .insert([{ name: agency_name, address }])
      .select()
      .single();

    if (agencyError) {
      console.error("Customer creation error:", agencyError);
      return NextResponse.json(
        { error: "Failed to create agency" },
        { status: 500 }
      );
    }

    // Create the user with the agency
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          agency_id: agency.id,
          role: "agency_admin",
        },
      },
    });

    if (authError) {
      console.error("User creation error:", authError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create the user profile
    const { error: profileError } = await supabase
      .from("users")
      .insert([
        {
          id: authData.user?.id,
          email,
          phone,
          agency_id: agency.id,
          role: "agency_admin",
          full_name: email.split("@")[0], // Default name from email
        },
      ]);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agency,
      user: authData.user,
    });
  } catch (error) {
    console.error("Customer onboard error:", error);
    return NextResponse.json(
      { error: "Failed to onboard agency" },
      { status: 500 }
    );
  }
}
