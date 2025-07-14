import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { encrypt } from "@/lib/encryption";
import { SampleStatus } from "@/constants/enums";
import { sendEmail } from "@/lib/email";
import { sampleDetailTemplate } from "@/lib/emailTemplates";

// Get bucket name from env or default
const COC_BUCKET = process.env.SUPABASE_COC_BUCKET || 'acurate-testing-data';
if (!COC_BUCKET) {
  throw new Error('Missing SUPABASE_COC_BUCKET environment variable');
}

const LAB_ADMIN_ID = process.env.NEXT_PUBLIC_LAB_ADMIN_ID;

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse FormData
    const formData = await request.formData();
    const receivedBy = formData.get("receivedBy") as string;
    const timestamp = formData.get("timestamp") as string;
    const signature = formData.get("signature") as string;
    const photo = formData.get("file") as File | null;
    const sampleIdsJson = formData.get("sampleIds") as string;

    if (!sampleIdsJson || !receivedBy || !signature) {
      return NextResponse.json(
        { error: "Sample IDs, recipient, and signature are required" },
        { status: 400 }
      );
    }

    // Parse sample IDs
    const sampleIds = JSON.parse(sampleIdsJson);
    if (!Array.isArray(sampleIds) || sampleIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty sample IDs" },
        { status: 400 }
      );
    }

    // Upload photo if provided
    let photo_url = null;
    if (photo) {
      const photoBuffer = await photo.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(COC_BUCKET)
        .upload(`bulk-transfers/${Date.now()}.jpg`, photoBuffer, {
          contentType: photo.type,
          upsert: true
        });

      if (uploadError) {
        console.error("Failed to upload photo:", uploadError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(COC_BUCKET)
          .getPublicUrl(uploadData.path);
        photo_url = publicUrl;
      }
    }

    // Encrypt the signature
    const encryptedSignature = encrypt(signature);
    
    // Determine the new status based on recipient
    const newStatus = receivedBy === LAB_ADMIN_ID
      ? SampleStatus.Submitted
      : SampleStatus.InCOC;

    // Get latitude/longitude from the first sample (or defaults)
    const { data: firstSample } = await supabase
      .from("samples")
      .select("latitude, longitude")
      .eq("id", sampleIds[0])
      .single();

    const latitude = firstSample?.latitude || null;
    const longitude = firstSample?.longitude || null;

    // Create transfer records for each sample
    const transfersToInsert = sampleIds.map(sampleId => ({
      sample_id: sampleId,
      transferred_by: session.user.id,
      received_by: receivedBy,
      timestamp,
      signature: encryptedSignature,
      photo_url,
      latitude,
      longitude
    }));

    const { data: transfers, error: transferError } = await supabase
      .from("coc_transfers")
      .insert(transfersToInsert)
      .select();

    if (transferError) {
      return NextResponse.json(
        { error: "Failed to create transfer records: " + transferError.message },
        { status: 500 }
      );
    }

    // Update sample statuses
    const { error: updateError } = await supabase
      .from("samples")
      .update({ status: newStatus })
      .in("id", sampleIds);

    if (updateError) {
      console.error("Failed to update sample statuses:", updateError);
      // Continue despite error to return partial success
    }

    // Send email notifications for lab admin transfers
    if (receivedBy === LAB_ADMIN_ID && process.env.ADMIN_EMAIL) {
      try {
        // Fetch sample details for email
        const { data: samples } = await supabase
          .from("samples")
          .select(`
            *,
            account:accounts(name),
            agency:agencies(name),
            test_types:test_types(id,name),
            coc_transfers(
              id,
              transferred_by,
              received_by,
              timestamp,
              latitude,
              longitude,
              signature,
              received_by_user:users!coc_transfers_received_by_fkey(id, full_name, email,role)
            )
          `)
          .in("id", sampleIds)
          .is("deleted_at", null)
          .order("timestamp", { foreignTable: "coc_transfers", ascending: false });

        // Send email for each sample
        for (const sample of samples || []) {
          const htmlEmailData = await sampleDetailTemplate(sample);
          await sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `Sample ${sample.project_id || sample.id} Submitted`,
            text: "",
            html: htmlEmailData,
          });
        }
      } catch (emailError) {
        console.error("Failed to send email notifications:", emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      transferCount: transfers.length,
      message: `Successfully transferred ${transfers.length} samples` 
    });
  } catch (error) {
    console.error("Bulk transfer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
