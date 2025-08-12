import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface Account {
  id?: string;
  name: string;
  pws_id?: string;
}

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

  // Fetch existing accounts for this agency
  const { data: existingAccounts, error: fetchError } = await supabase
    .from("accounts")
    .select("id, name, pws_id")
    .eq("agency_id", userId)
    .is("deleted_at", null);
    
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  
  // Create a map of existing account names to their data
  const existingAccountsMap = new Map(
    (existingAccounts || []).map((entry) => [entry.name, entry])
  );
  
  // Identify accounts that need to be removed (exist in DB but not in new accounts)
  const newAccountNames = new Set(accounts.map((acc: Account) => acc.name));
  const accountsToRemove = Array.from(existingAccountsMap.keys()).filter(
    (existingName) => !newAccountNames.has(existingName)
  );
  
  // Remove accounts that are no longer in the list
  if (accountsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("accounts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("agency_id", userId)
      .in("name", accountsToRemove);
      
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }
  
  // Process each account - update existing ones and insert new ones
  for (const account of accounts) {
    const existingAccount = existingAccountsMap.get(account.name);
    
    if (existingAccount) {
      // Update existing account if PWS ID changed
      if (existingAccount.pws_id !== account.pws_id) {
        const { error: updateError } = await supabase
          .from("accounts")
          .update({ pws_id: account.pws_id || null })
          .eq("id", existingAccount.id);
          
        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
      }
    } else {
      // Insert new account
      const { error: insertError } = await supabase
        .from("accounts")
        .insert({
          agency_id: userId,
          name: account.name,
          pws_id: account.pws_id || null,
        });
        
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
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

  // Soft delete the account from the accounts table
  const { error } = await supabase
    .from("accounts")
    .update({ deleted_at: new Date().toISOString() })
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

  // Fetch accounts for the specified user
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("id, name, pws_id")
    .eq("agency_id", userId)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ accounts: accounts || [] });
}
