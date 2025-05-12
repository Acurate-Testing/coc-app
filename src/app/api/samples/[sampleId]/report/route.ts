import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { PDFDocument } from "pdf-lib";
import { decrypt } from "@/lib/encryption";

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
      data: pdfBytes.toString("base64"),
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
