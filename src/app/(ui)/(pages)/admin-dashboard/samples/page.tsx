import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import AdminSamplesClient from "./client";
import { redirect } from "next/navigation";

export default async function AdminSamplesPage() {
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
  const { data: agencies } = await supabase.from("agencies").select("id, name");

  const { data: samples, error } = await supabase
    .from("samples")
    .select(
      `
      *,
      account:accounts(name),
      agency:agencies(name),
      test_types:test_types(id,name),
      created_by_user:users(id, full_name)
    `
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching samples:", error);
    return null;
  }

  return (
    <AdminSamplesClient
      initialSamples={samples || []}
      initialAgencies={agencies || []}
      userRole={session.user.role}
    />
  );
}
