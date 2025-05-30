import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { clearAuthCookie } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.supabaseToken) {
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

      await supabase.auth.signOut();
    }

    // Clear the auth cookie
    await clearAuthCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}
