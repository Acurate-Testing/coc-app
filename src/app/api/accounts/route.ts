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
      .select("id, name")
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

    return NextResponse.json({ accounts: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}