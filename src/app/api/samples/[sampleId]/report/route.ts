import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { PDFDocument } from "pdf-lib";
import { decrypt } from "@/lib/encryption";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { sampleId: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Fetch sample with all related data
    const { data: sample, error } = await supabase
      .from("samples")
      .select(
        `
        *,
        agency:agencies(name),
        account:accounts(name),
        test_types:test_types(name),
        coc_transfers(
          id,
          transferred_by,
          received_by,
          timestamp,
          latitude,
          longitude,
          signature
        )
      `
      )
      .eq("id", params.sampleId)
      .eq("deleted_at", null)
      .single();

    if (error || !sample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    // Generate PDF report
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    // Add header
    page.drawText("Sample Report", {
      x: 50,
      y: height - 50,
      size: 20,
    });

    // Add sample details
    let y = height - 100;
    const details = [
      `Sample ID: ${sample.id}`,
      `Project ID: ${sample.project_id}`,
      `Agency: ${sample.agency?.name}`,
      `Account: ${sample.account?.name}`,
      `Status: ${sample.status}`,
      `Created At: ${new Date(sample.created_at).toLocaleString()}`,
      `Matrix Type: ${sample.matrix_type || "N/A"}`,
      `Temperature: ${sample.temperature || "N/A"}°C`,
      `Notes: ${sample.notes || "N/A"}`,
    ];

    for (const detail of details) {
      page.drawText(detail, {
        x: 50,
        y,
        size: 12,
      });
      y -= 20;
    }

    // Add test types
    y -= 20;
    page.drawText("Test Types:", {
      x: 50,
      y,
      size: 14,
    });
    y -= 20;

    for (const testType of sample.test_types) {
      page.drawText(`- ${testType.name}`, {
        x: 70,
        y,
        size: 12,
      });
      y -= 20;
    }

    // Add chain of custody history
    y -= 20;
    page.drawText("Chain of Custody History:", {
      x: 50,
      y,
      size: 14,
    });
    y -= 20;

    for (const transfer of sample.coc_transfers) {
      const transferDetails = [
        `Transfer ID: ${transfer.id}`,
        `Transferred By: ${transfer.transferred_by}`,
        `Received By: ${transfer.received_by}`,
        `Timestamp: ${new Date(transfer.timestamp).toLocaleString()}`,
        `Location: ${transfer.latitude}, ${transfer.longitude}`,
        `Signature: ${transfer.signature ? "Present" : "Missing"}`,
      ];

      for (const detail of transferDetails) {
        page.drawText(detail, {
          x: 70,
          y,
          size: 12,
        });
        y -= 20;
      }
      y -= 10;
    }

    const pdfBytes = await pdfDoc.save();

    return NextResponse.json({
      success: true,
      data: Buffer.from(pdfBytes).toString("base64"),
      format: "pdf",
    });
  } catch (error) {
    console.error("Generate sample report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { sampleId: string } }
) {
  try {
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

    const { report_data } = await request.json();

    // Verify user has access to this sample
    const { data: sample, error: sampleError } = await supabase
      .from("samples")
      .select("agency_id")
      .eq("id", params.sampleId)
      .single();

    if (sampleError || !sample) {
      return NextResponse.json(
        { error: "Sample not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this agency
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("agency_id, role")
      .eq("id", session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only allow lab admin to create reports
    if (user.role !== "lab_admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update the sample with report data
    const { error: updateError } = await supabase
      .from("samples")
      .update({
        report_data,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id,
      })
      .eq("id", params.sampleId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update sample" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report update error:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
