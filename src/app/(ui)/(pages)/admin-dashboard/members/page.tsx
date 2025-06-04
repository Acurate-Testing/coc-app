import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import AdminMembersClient from "./client";
import { redirect } from "next/navigation";

export default async function AdminMembersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.supabaseToken) {
    redirect("/login");
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

  // Fetch initial data
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return null;
  }

  return (
    <AdminMembersClient
      initialUsers={users || []}
      userRole={session.user.role || "agency"}
    />
  );
}
