import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "auth_token";

export async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.supabaseToken) return null;

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

  const { data: { user }, error } = await supabase.auth.getUser(session.user.supabaseToken);
  if (error || !user) return null;

  return user;
}

export async function requireAuth(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return session;
}

export async function setAuthCookie(token: string) {
  cookies().set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function clearAuthCookie() {
  cookies().delete(AUTH_COOKIE_NAME);
}

export async function getUserRole(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.supabaseToken) return null;

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

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data.role;
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
) {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const role = await getUserRole(session.id);
  if (!role || !allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return session;
}
