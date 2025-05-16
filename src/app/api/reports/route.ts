import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { PDFDocument } from "pdf-lib";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["lab_admin", "agency"]);
    if (session instanceof NextResponse) return session;

    const {
      startDate,
      endDate,
      agencyId,
      format = "pdf",
      emailTo,
    } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    // Fetch samples
    let query = supabase
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
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .is("deleted_at", null);

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    const { data: samples, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let reportData: string | Buffer;

    if (format === "pdf") {
      // Generate PDF report
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();

      // Add content to PDF
      page.drawText("Sample Report", {
        x: 50,
        y: height - 50,
        size: 20,
      });

      // Add sample data
      let y = height - 100;
      for (const sample of samples) {
        page.drawText(`Sample ID: ${sample.id}`, {
          x: 50,
          y,
          size: 12,
        });
        y -= 20;
      }

      const pdfBytes = await pdfDoc.save();
      reportData = Buffer.from(pdfBytes);
    } else {
      // Generate CSV report
      const headers = [
        "ID",
        "Project ID",
        "Agency",
        "Account",
        "Status",
        "Created At",
      ];
      const rows = samples.map((sample) => [
        sample.id,
        sample.project_id,
        sample.agency?.name,
        sample.account?.name,
        sample.status,
        sample.created_at,
      ]);

      reportData = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");
    }

    // Send email if requested
    if (emailTo) {
      await sendEmail({
        to: emailTo,
        subject: "Sample Report",
        text: "Please find attached the sample report.",
        html: "<p>Please find attached the sample report.</p>",
      });
    }

    return NextResponse.json({
      success: true,
      data: reportData.toString("base64"),
      format,
    });
  } catch (error) {
    console.error("Generate report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
