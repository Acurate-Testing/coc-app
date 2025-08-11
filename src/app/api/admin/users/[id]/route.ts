import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Soft delete from both users and agencies tables if record exists
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const recordId = params.id;

  if (!recordId) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    const results = [];
    let foundRecord = false;

    // Check and soft delete from users table
    const { data: existingUser, error: userFetchError } = await supabase
      .from("users")
      .select("id, deleted_at, active")
      .eq("id", recordId)
      .single();

    if (!userFetchError && existingUser) {
      foundRecord = true;
      
      // Check if user is not already deleted
      if (!existingUser.deleted_at) {
        const { data: userData, error: userUpdateError } = await supabase
          .from("users")
          .update({
            deleted_at: new Date().toISOString(),
            active: false
          })
          .eq("id", recordId)
          .select();

        if (userUpdateError) {
          return NextResponse.json(
            { error: `Error deleting user: ${userUpdateError.message}` },
            { status: 500 }
          );
        }

        results.push({
          type: "user",
          action: "deleted",
          data: userData[0]
        });
      } else {
        results.push({
          type: "user",
          action: "already_deleted",
          data: existingUser
        });
      }
    }

    // Check and soft delete from agencies table
    const { data: existingAgency, error: agencyFetchError } = await supabase
      .from("agencies")
      .select("id, deleted_at")
      .eq("id", recordId)
      .single();

    if (!agencyFetchError && existingAgency) {
      foundRecord = true;
      
      // Check if agency is not already deleted
      if (!existingAgency.deleted_at) {
        const { data: agencyData, error: agencyUpdateError } = await supabase
          .from("agencies")
          .update({
            deleted_at: new Date().toISOString()
          })
          .eq("id", recordId)
          .select();

        if (agencyUpdateError) {
          return NextResponse.json(
            { error: `Error deleting agency: ${agencyUpdateError.message}` },
            { status: 500 }
          );
        }

        results.push({
          type: "agency",
          action: "deleted",
          data: agencyData[0]
        });
      } else {
        results.push({
          type: "agency",
          action: "already_deleted",
          data: existingAgency
        });
      }
    }

    // If no record found in either table
    if (!foundRecord) {
      return NextResponse.json(
        { error: "Record not found in users or agencies table" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Soft delete operation completed",
      results: results
    });

  } catch (error) {
    console.error("Error during soft delete operation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}