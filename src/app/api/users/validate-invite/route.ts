import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
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

    // Check if token exists in users table
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("invitation_token", token)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
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

    return NextResponse.json({
      valid: true,
      email: user.email,
      agency_id: user.agency_id,
      role: user.role,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate token" },
      { status: 500 }
    );
  }
} 