import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email";
import { sampleDetailTemplate } from "@/lib/emailTemplates";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { sampleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("samples")
      .select(
        `
      *,
      account:accounts(name),
      agency:agencies(name,street,city,state,zip),
      test_types:test_types(id,name),
      created_by_user:users(id, full_name),
        coc_transfers(
          id,
          transferred_by,
          received_by,
          timestamp,
          latitude,
          longitude,
          signature,
          photo_url,
          received_by_user:users!coc_transfers_received_by_fkey(id, full_name, email,role)
        )
      `
      )
      .eq("id", params.sampleId)
      .is("deleted_at", null)
      .order("timestamp", { foreignTable: "coc_transfers", ascending: false })
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    return NextResponse.json({ sample: data });
  } catch (error) {
    console.error("Get sample error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { sampleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.supabaseToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { sampleId } = params;
    const body = await request.json();
    const { is_update, original_status, account, agency, created_by_user, test_types, coc_transfers, address, test_group_id, ...updateData } = body;

    console.log("Updating sample:", {
      sampleId,
      is_update,
      original_status,
      new_status: updateData.status,
      test_group_id,
      test_types_count: test_types?.length || 0
    });

    // Include test_group_id in update data if provided
    if (test_group_id !== undefined) {
      updateData.test_group_id = test_group_id;
    }

    // Update the sample
    const { data: updatedSample, error: updateError } = await supabase
      .from("samples")
      .update(updateData)
      .eq("id", sampleId)
      .select(`
        *,
        account:accounts!samples_account_id_fkey(name),
        agency:agencies!samples_agency_id_fkey(name,street),
        created_by_user:users!samples_created_by_fkey(id, full_name),
        coc_transfers(
          id,
          transferred_by,
          received_by,
          timestamp,
          latitude,
          longitude,
          signature,
          photo_url,
          received_by_user:users!coc_transfers_received_by_fkey(id, full_name, email,role)
        )
      `)
      .single();

    if (updateError) {
      console.error("Error updating sample:", updateError);
      return NextResponse.json(
        { error: "Failed to update sample" },
        { status: 500 }
      );
    }

    // Handle test_types updates if provided
    if (test_types && Array.isArray(test_types)) {
      // First, delete existing test type associations
      const { error: deleteError } = await supabase
        .from("sample_test_types")
        .delete()
        .eq("sample_id", sampleId);

      if (deleteError) {
        console.error("Error deleting existing test types:", deleteError);
        // Continue with the operation - log but don't fail
      }

      // Then, insert new test type associations
      if (test_types.length > 0) {
        const testTypeEntries = test_types.map((testType: any) => ({
          sample_id: sampleId,
          test_type_id: testType.id,
        }));

        const { error: insertError } = await supabase
          .from("sample_test_types")
          .insert(testTypeEntries);

        if (insertError) {
          console.error("Error inserting new test types:", insertError);
          return NextResponse.json(
            { error: "Failed to update test types" },
            { status: 500 }
          );
        }
      }
    }

    // Fetch updated sample with test_types
    const { data: finalSample, error: fetchError } = await supabase
      .from("samples")
      .select(`
        *,
        account:accounts!samples_account_id_fkey(name),
        agency:agencies!samples_agency_id_fkey(name,street),
        test_types:test_types(id,name),
        created_by_user:users!samples_created_by_fkey(id, full_name),
        coc_transfers(
          id,
          transferred_by,
          received_by,
          timestamp,
          latitude,
          longitude,
          signature,
          photo_url,
          received_by_user:users!coc_transfers_received_by_fkey(id, full_name, email,role)
        )
      `)
      .eq("id", sampleId)
      .single();

    if (fetchError) {
      console.error("Error fetching updated sample:", fetchError);
      // Return the sample without test_types if fetch fails
    }

    const sampleToReturn = finalSample || updatedSample;

    console.log("Sample updated successfully:", {
      id: sampleToReturn.id,
      status: sampleToReturn.status,
      project_id: sampleToReturn.project_id,
      test_types_count: sampleToReturn.test_types?.length || 0
    });

    // Send email notification logic remains the same
    const shouldSendEmail = 
      (is_update && updateData.status === "submitted") ||
      (is_update && original_status === "submitted");

    if (shouldSendEmail) {
      console.log("Preparing to send email notification:", {
        original_status,
        new_status: updateData.status,
        is_submitted_update: original_status === "submitted"
      });

      try {
        console.log("Starting email template generation...");
        const emailHtml = await sampleDetailTemplate(sampleToReturn);
        console.log("Email template generated successfully, length:", emailHtml.length);

        const subject = updateData.status === "submitted" 
          ? `Sample ${sampleToReturn.project_id} has been submitted`
          : `Sample ${sampleToReturn.project_id} has been updated`;

        const text = updateData.status === "submitted"
          ? `Sample ${sampleToReturn.project_id} has been submitted. Please check the attached HTML email for details.`
          : `Sample ${sampleToReturn.project_id} has been updated. Please check the attached HTML email for details.`;

        await sendEmail({
          to: process.env.ADMIN_EMAIL || "",
          subject,
          text,
          html: emailHtml,
        });
        
      } catch (emailError) {
        console.error("Error in email sending process:", {
          error: emailError,
          message: emailError instanceof Error ? emailError.message : 'Unknown error',
          stack: emailError instanceof Error ? emailError.stack : undefined
        });
      }
    } else {
      console.log("No email sent - conditions not met:", {
        is_update,
        original_status,
        new_status: updateData.status,
        should_send: shouldSendEmail
      });
    }

    return NextResponse.json({ sample: sampleToReturn });
  } catch (error) {
    console.error("Error in PUT /api/samples/[sampleId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
