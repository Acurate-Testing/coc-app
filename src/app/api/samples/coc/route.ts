import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { SampleStatus } from "@/constants/enums";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { sendEmail } from "@/lib/email";
import { sampleDetailTemplate } from "@/lib/emailTemplates";

// Get bucket name from env or default
const COC_BUCKET = process.env.SUPABASE_COC_BUCKET || 'acurate-testing-data';
if (!COC_BUCKET) {
  throw new Error('Missing SUPABASE_COC_BUCKET environment variable');
}

const LAB_ADMIN_ID = process.env.NEXT_PUBLIC_LAB_ADMIN_ID;

export async function GET(
  request: NextRequest,
  { params }: { params: { sampleId: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { data, error } = await supabase
      .from("coc_transfers")
      .select(
        `
        *,
        transferred_by:users!transferred_by(full_name),
        received_by:users!received_by(full_name)
      `
      )
      .eq("sample_id", params.sampleId)
      .is("deleted_at", null)
      .order("timestamp", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transfers: data });
  } catch (error) {
    console.error("Get COC history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sampleId = searchParams.get("sample_id");

    // Parse FormData
    const formData = await request.formData();
    const received_by = formData.get("received_by") as string;
    const latitude = formData.get("latitude") as string;
    const longitude = formData.get("longitude") as string;
    const timestamp = formData.get("timestamp") as string;
    const signature = formData.get("signature") as string;
    const photo = formData.get("file") as File | null;

    if (!received_by || !signature) {
      return NextResponse.json(
        { error: "Received by and signature are required" },
        { status: 400 }
      );
    }

    // Verify sample exists and is not deleted
    const { data: sample, error: sampleError } = await supabase
      .from("samples")
      .select("*")
      .eq("id", sampleId)
      .is("deleted_at", null)
      .single();

    if (sampleError || !sample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    // Upload photo if provided
    let photo_url = null;
    if (photo) {
      const photoBuffer = await photo.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(COC_BUCKET)
        .upload(`${sampleId}/${Date.now()}.jpg`, photoBuffer, {
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

    // Create transfer record
    const { data: transfer, error } = await supabase
      .from("coc_transfers")
      .insert({
        sample_id: sampleId,
        transferred_by: session.user.id,
        received_by,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        timestamp,
        signature: encrypt(signature),
        photo_url
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const newStatus =
      received_by === LAB_ADMIN_ID
        ? SampleStatus.Submitted
        : SampleStatus.InCOC;

    // Update sample status
    const { error: updateError } = await supabase
      .from("samples")
      .update({
        status: newStatus,
      })
      .eq("id", sampleId);

    if (updateError) {
      console.error("Failed to update sample status:", updateError);
    }

    const { data: updatedSampleData, error: updatedSampleError } =
      await supabase
        .from("samples")
        .select(
          `
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
      `
        )
        .eq("id", sampleId)
        .is("deleted_at", null)
        .order("timestamp", { foreignTable: "coc_transfers", ascending: false })
        .single();

    if (updatedSampleError) {
      console.error("Failed to update sample status:", updateError);
    }

    if (
      received_by === LAB_ADMIN_ID &&
      updatedSampleData &&
      process.env.SMTP_EMAIL
    ) {
      const htmlEmailData = await sampleDetailTemplate(updatedSampleData);

      sendEmail({
        to: process.env.SMTP_EMAIL,
        subject: "Sample Submitted",
        text: "",
        html: htmlEmailData,
      });
    }

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error("Create COC transfer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}