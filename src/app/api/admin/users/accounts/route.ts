import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Update user accounts - handles both adding and removing accounts
export async function PATCH(req: NextRequest) {
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

  const { userId, accounts } = await req.json();
  
  if (!userId || !Array.isArray(accounts)) {
    return NextResponse.json({ error: "userId and accounts[] are required" }, { status: 400 });
  }

  // Verify user has access to this agency
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!userData || userData.role !== "lab_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Fetch existing accounts for this agency
  const { data: existingAccounts, error: fetchError } = await supabase
    .from("accounts")
    .select("name")
    .eq("agency_id", userId);
    
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  
  // Create a set of existing account names
  const existingNames = new Set(
    (existingAccounts || []).map((entry) => entry.name)
  );
  
  // Identify accounts that need to be removed (exist in DB but not in new accounts)
  const accountsToRemove = Array.from(existingNames).filter(
    (existingName) => !accounts.includes(existingName)
  );
  
  // Remove accounts that are no longer in the list
  if (accountsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("accounts")
      .delete()
      .eq("agency_id", userId)
      .in("name", accountsToRemove);
      
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }
  
  // Filter to only add accounts that don't already exist
  const newAccounts = accounts.filter((account: string) => !existingNames.has(account));
  
  // Add new accounts if any are provided
  if (newAccounts.length > 0) {
    const inserts = newAccounts.map((name: string) => ({
      agency_id: userId,
      name: name,
    }));
    
    const { error: insertError } = await supabase.from("accounts").insert(inserts);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

// Delete a specific account from a user
export async function DELETE(req: NextRequest) {
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

  const { userId, accountName } = await req.json();

  if (!userId || !accountName) {
    return NextResponse.json({ error: "userId and accountName are required" }, { status: 400 });
  }

  // Verify user has access to this agency
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!userData || userData.role !== "lab_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Remove the account from the accounts table
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("agency_id", userId)
    .eq("name", accountName);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Get accounts for a user
export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Verify user has access to this agency
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!userData || userData.role !== "lab_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Fetch accounts for the specified user
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("name")
    .eq("agency_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ accounts: accounts || [] });
}
