import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { TestType } from "@/types/sample";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { SampleStatus } from "@/constants/enums";
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
      agency:agencies(name),
      test_types:test_types(id,name),
      created_by_user:users(id, full_name),
      test_group:test_groups(id, name, description),
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
      test_group_id
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
        agency:agencies!samples_agency_id_fkey(name),
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
      .single();

    if (updateError) {
      console.error("Error updating sample:", updateError);
      return NextResponse.json(
        { error: "Failed to update sample" },
        { status: 500 }
      );
    }

    console.log("Sample updated successfully:", {
      id: updatedSample.id,
      status: updatedSample.status,
      project_id: updatedSample.project_id
    });

    // Send email notification in these cases:
    // 1. When status changes to "submitted"
    // 2. When any field is updated for a sample that is already in "submitted" status
    const shouldSendEmail = 
      (is_update && updateData.status === "submitted") || // Status changed to submitted
      (is_update && original_status === "submitted"); // Sample was already submitted

    if (shouldSendEmail) {
      console.log("Preparing to send email notification:", {
        original_status,
        new_status: updateData.status,
        is_submitted_update: original_status === "submitted"
      });

      try {
        const emailHtml = await sampleDetailTemplate(updatedSample);
        console.log("Email template generated successfully");

        const subject = updateData.status === "submitted" 
          ? `Sample ${updatedSample.project_id} has been submitted`
          : `Sample ${updatedSample.project_id} has been updated`;

        const text = updateData.status === "submitted"
          ? `Sample ${updatedSample.project_id} has been submitted. Please check the attached HTML email for details.`
          : `Sample ${updatedSample.project_id} has been updated. Please check the attached HTML email for details.`;

        await sendEmail({
          to: "dev.accuratetesting@gmail.com",
          subject,
          text,
          html: emailHtml,
        });
        console.log("Email sent successfully");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    } else {
      console.log("No email sent - conditions not met:", {
        is_update,
        original_status,
        new_status: updateData.status,
        should_send: shouldSendEmail
      });
    }

    return NextResponse.json({ sample: updatedSample });
  } catch (error) {
    console.error("Error in PUT /api/samples/[sampleId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
