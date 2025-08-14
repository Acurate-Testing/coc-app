import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// List all agencies and users (including deleted ones)
export async function GET() {
  try {
    // Fetch all agencies
    const { data: agencies, error: agenciesError } = await supabase
      .from("agencies")
      .select("id, name, contact_email, phone, street, city, state, zip, deleted_at, agency_test_type_groups(test_groups(id, name), assigned_test_type_ids), accounts(id, name, pws_id)")
      .order("deleted_at", { ascending: true }); // Show non-deleted first

    if (agenciesError) {
      return NextResponse.json({ error: agenciesError.message }, { status: 500 });
    }

    // Fetch users (excluding lab_admin role)
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, role, agency_id, deleted_at, active")
      .neq("role", "lab_admin")
      .order("deleted_at", { ascending: true }); // Show non-deleted first

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // Filter agencies to only include those that have non-lab_admin users
    const agenciesWithNonLabAdminUsers = agencies?.filter(agency => {
      const hasNonLabAdminUsers = users?.some(user => user.agency_id === agency.id);
      return hasNonLabAdminUsers;
    }) || [];

    // Transform agencies data
    const formattedAgencies = agenciesWithNonLabAdminUsers.map(agency => ({
      ...agency,
      type: 'agency',
      contact_email: agency.contact_email,
      accounts: agency.accounts || [],
      assigned_test_group: agency.agency_test_type_groups ? 
        agency.agency_test_type_groups.map((group: any) => ({
          id: group.test_groups?.id,
          name: group.test_groups?.name,
          assigned_test_type_ids: group.assigned_test_type_ids && group.assigned_test_type_ids.length > 0 
            ? group.assigned_test_type_ids 
            : []
        })).filter(g => g.id) : []
    })) || [];

    // Transform users data
    const formattedUsers = users?.map(user => ({
      id: user.id,
      name: user.full_name,
      contact_email: user.email,
      type: 'user',
      role: user.role,
      agency_id: user.agency_id,
      deleted_at: user.deleted_at,
      active: user.active,
      accounts: [],
      assigned_test_group: []
    })) || [];

    // Combine and sort by deletion status
    const combinedData = [...formattedAgencies, ...formattedUsers].sort((a, b) => {
      if (a.deleted_at && !b.deleted_at) return 1;
      if (!a.deleted_at && b.deleted_at) return -1;
      return 0;
    });

    return NextResponse.json(combinedData);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Reactivate a deleted user or assign test groups
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if this is a reactivation request
    if (body.action === "reactivate") {
      const { userId } = body;

      if (!userId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
      }

      // Create admin client for Supabase Auth operations
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Check if this is an agency or user ID
      let isAgency = false;
      let isUser = false;
      let existingRecord: any = null;

      // First try to find it as an agency
      const { data: existingAgency, error: agencyError } = await supabase
        .from("agencies")
        .select("id, name, contact_email, deleted_at")
        .eq("id", userId)
        .single();

      if (!agencyError && existingAgency) {
        isAgency = true;
        existingRecord = existingAgency;
      } else {
        // If not found as agency, try as user
        const { data: existingUser, error: userError } = await supabase
          .from("users")
          .select("id, email, full_name, agency_id, deleted_at")
          .eq("id", userId)
          .single();

        if (!userError && existingUser) {
          isUser = true;
          existingRecord = existingUser;
        }
      }

      if (!existingRecord) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
      }

      if (!existingRecord.deleted_at) {
        return NextResponse.json({ error: "Record is not deleted" }, { status: 400 });
      }

      // Reactivate based on type
      if (isAgency) {
        // Reactivate agency
        const { error: reactivateError } = await supabase
          .from("agencies")
          .update({
            deleted_at: null
          })
          .eq("id", userId);

        if (reactivateError) {
          return NextResponse.json({ error: reactivateError.message }, { status: 500 });
        }

        // Also reactivate any associated users for this agency
        const { error: usersReactivateError } = await supabase
          .from("users")
          .update({
            deleted_at: null,
            active: true
          })
          .eq("agency_id", userId)
          .not("deleted_at", "is", null);

        if (usersReactivateError) {
          console.error("Users reactivation error:", usersReactivateError);
          // Don't fail the whole operation if users reactivation fails
        }

        // Reactivate associated users in Supabase Auth
        try {
          const { data: agencyUsers, error: fetchUsersError } = await supabase
            .from("users")
            .select("id")
            .eq("agency_id", userId);

          if (!fetchUsersError && agencyUsers) {
            for (const user of agencyUsers) {
              try {
                await adminClient.auth.admin.updateUserById(user.id, {
                  user_metadata: {
                    deleted: false
                  }
                });
              } catch (authError) {
                console.error(`Auth reactivation error for user ${user.id}:`, authError);
                // Continue with other users even if one fails
              }
            }
          }
        } catch (authError) {
          console.error("Auth reactivation error:", authError);
          // Don't fail the whole operation if auth update fails
        }

        return NextResponse.json({ success: true, message: "Agency and associated users reactivated successfully" });
      } else if (isUser) {
        // Reactivate individual user
        const { error: reactivateError } = await supabase
          .from("users")
          .update({
            deleted_at: null,
            active: true
          })
          .eq("id", userId);

        if (reactivateError) {
          return NextResponse.json({ error: reactivateError.message }, { status: 500 });
        }

        // Reactivate user in Supabase Auth
        try {
          await adminClient.auth.admin.updateUserById(userId, {
            user_metadata: {
              deleted: false
            }
          });
        } catch (authError) {
          console.error("Auth reactivation error:", authError);
          // Don't fail the whole operation if auth update fails
        }

        return NextResponse.json({ success: true, message: "User reactivated successfully" });
      }
    }

    // Handle existing test group assignment logic
    const { userId: testUserId, testGroupIds, testTypeIdsByGroup } = body;

    // Validate input for test group assignment
    if (!testUserId || !Array.isArray(testGroupIds) || typeof testTypeIdsByGroup !== "object") {
      return NextResponse.json({ error: "userId, testGroupIds[], and testTypeIdsByGroup are required" }, { status: 400 });
    }

    // Fetch existing assignments for this agency
    const { data: existingAssignments, error: fetchError } = await supabase
      .from("agency_test_type_groups")
      .select("id, test_type_group_id")
      .eq("agency_id", testUserId);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const existingIds = new Set(
      (existingAssignments || []).map((entry) => entry.test_type_group_id)
    );

    // Remove test group assignments that are no longer selected
    const testGroupIdsToRemove = Array.from(existingIds).filter(
      (existingId) => !testGroupIds.includes(existingId)
    );
    if (testGroupIdsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("agency_test_type_groups")
        .delete()
        .eq("agency_id", testUserId)
        .in("test_type_group_id", testGroupIdsToRemove);

      if (deleteError) {
        if (
          typeof deleteError.message === "string" &&
          deleteError.message.includes("violates foreign key constraint")
        ) {
          return NextResponse.json(
            { error: "Cannot remove test group assignment because it is referenced by other records." },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    }

    // Add new assignments for test groups that don't already exist
    const newTestGroupIds = testGroupIds.filter((testGroupId: string) => !existingIds.has(testGroupId));
    if (newTestGroupIds.length > 0) {
      const inserts = newTestGroupIds.map((testGroupId: string) => ({
        agency_id: testUserId,
        test_type_group_id: testGroupId,
        assigned_test_type_ids: testTypeIdsByGroup[testGroupId] || [],
      }));
      const { error: insertError } = await supabase.from("agency_test_type_groups").insert(inserts);
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    // Update assigned_test_type_ids for all selected test groups
    for (const testGroupId of testGroupIds) {
      const assignment = (existingAssignments || []).find((a: any) => a.test_type_group_id === testGroupId);
      if (assignment) {
        const { error: updateError } = await supabase
          .from("agency_test_type_groups")
          .update({ assigned_test_type_ids: testTypeIdsByGroup[testGroupId] || [] })
          .eq("id", assignment.id);
        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete a test assignment from a user
export async function DELETE(req: NextRequest) {
  const { userId, testGroupId } = await req.json();

  if (!userId || !testGroupId) {
    return NextResponse.json({ error: "userId and testGroupId are required" }, { status: 400 });
  }

  // Remove the test group assignment from the agency_test_type_groups table
  const { error } = await supabase
    .from("agency_test_type_groups")
    .delete()
    .eq("agency_id", userId)
    .eq("test_type_group_id", testGroupId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
