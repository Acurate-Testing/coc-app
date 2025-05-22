import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Update user accounts - handles both adding and removing accounts
export async function PATCH(req: NextRequest) {
  const { userId, accounts } = await req.json();
  
  if (!userId || !Array.isArray(accounts)) {
    return NextResponse.json({ error: "userId and accounts[] are required" }, { status: 400 });
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
  const { userId, accountName } = await req.json();

  if (!userId || !accountName) {
    return NextResponse.json({ error: "userId and accountName are required" }, { status: 400 });
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
