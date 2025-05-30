import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: { agencyId: string } }
) {
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

    const { email, phone, password } = await request.json();

    // Verify user has access to this agency
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("agency_id, role")
      .eq("id", session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is lab admin or belongs to the same agency
    if (user.role !== "lab_admin" && user.agency_id !== params.agencyId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          agency_id: params.agencyId,
          role: "agency_user",
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
          agency_id: params.agencyId,
          role: "agency_user",
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
      user: authData.user,
    });
  } catch (error) {
    console.error("User onboard error:", error);
    return NextResponse.json(
      { error: "Failed to onboard user" },
      { status: 500 }
    );
  }
}
