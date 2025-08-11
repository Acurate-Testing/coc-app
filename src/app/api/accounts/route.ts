import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.agency_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencyId = session.user.agency_id;
    const { data, error } = await supabase
      .from("accounts")
      .select("id, name, agencies(PWS_id_prefix)")
      .eq("agency_id", agencyId)
      .order("name", { ascending: true });

    if (error) {
      if (
        typeof error.message === "string" &&
        error.message.includes("violates foreign key constraint")
      ) {
        return NextResponse.json(
          { error: "Cannot update or delete account because it is referenced by samples." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const accounts = (data ?? []).map((account: any) => ({
      id: account.id,
      name: account.name,
      PWS_id_prefix: account.agencies?.PWS_id_prefix ?? null,
    }));

    return NextResponse.json({ accounts });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}