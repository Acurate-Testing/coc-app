import { MatrixType } from "@/constants/enums";
import { format } from "date-fns";

export const sampleDetailTemplate = async (sampleData: any) => {
  const sectionStyle =
    "margin-bottom: 1rem; background: #fff; border-radius: 12px;";
  const headerStyle =
    "padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; font-size: 18px; font-weight: 600; color: #2563EB; border-bottom: 1px solid #eee;";
  const buttonStyle =
    "background-color: #2563EB; color: white; padding: 6px 12px; border-radius: 4px; font-size: 14px; text-decoration: none; font-weight: normal;";
  const contentStyle = "padding: 12px 16px;";
  const labelStyle = "color: #6B7280; font-size: 14px;";
  const firstLabelWidth = "width: 435px;";
  const valueStyle = "color: #111827; font-size: 14px; font-weight: 600;";
  const rowStyle =
    "display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;";
  const pillStyle =
    "background-color: #DBEAFE; color: #2563EB; padding: 6px 10px; border-radius: 9999px; font-size: 14px; display: inline-block; margin-right: 6px; margin-bottom: 6px;";
  const remarkStyle = "color: #6B7280; font-size: 14px;";
  const cocBoxStyle =
    "background: #F9FAFB; padding: 8px; border-radius: 8px; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); margin-bottom: 8px;";
  const cocDateStyle = "font-size: 13px; color: #6B7280; margin-bottom: 2px;";
  const cocNameStyle = "font-weight: 600; color: #1e293b; font-size: 15px;";

  const renderRow = (label: string, value: string) =>
    `<div style=\"${rowStyle}\"><span style=\"${labelStyle}\">${label}:${" "}</span><span style=\"${valueStyle}\">${
      value || "-"
    }</span></div>`;

  const renderSection = (title: string, content: string, buttonLink?: { url: string, text: string }) =>
    `<div style=\"${sectionStyle}\">
      <div style=\"${headerStyle}\">
        <span style=\"${buttonLink ? `${firstLabelWidth}` : ''}\">${title}</span>
        ${buttonLink ? `<a href="${buttonLink.url}" style="${buttonStyle}" target="_blank">${buttonLink.text}</a>` : ''}
      </div>
      <div style=\"${contentStyle}\">${content}</div>
    </div>`;

  const testTypesHtml = sampleData?.test_types?.length
    ? sampleData.test_types
        .map((test: any) => `<span style=\"${pillStyle}\">${test.name}</span>`)
        .join("")
    : `<span style=\"color: #6B7280;\">No tests selected</span>`;

  const cocTransferHtml = sampleData?.coc_transfers?.length
    ? sampleData.coc_transfers
        .map(
          (item: any) =>
            `<div style="${cocBoxStyle}">
          <div>
            <div style="${cocDateStyle}">${item.timestamp ? format(new Date(item.timestamp), "yyyy-MM-dd hh:mm a") : "-"}</div>
            <div style="${cocNameStyle}">Tranferred to: <span style="font-weight:400;">${
              item.received_by_user.full_name
            }</span></div>
          </div>
        </div>`
        )
        .join("")
    : `<span style=\"color: #6B7280;\">No Chain Of Custody found</span>`;

  const getGpsLocation = (data: any) => {
    if (data.latitude && data.longitude) {
      const lat = parseFloat(data.latitude).toFixed(6);
      const lon = parseFloat(data.longitude).toFixed(6);
      return `${lat}, ${lon}`;
    }
    return "-";
  };

  return `<!DOCTYPE html>
<html>
  <body style=\"font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4;\">
    <div style=\"max-width: 600px; margin: 0 auto; padding: 24px;\">
      ${renderSection(
        "Basic Information",
        [
          renderRow("Sample ID", sampleData.id),
          renderRow("Customer", sampleData.agency?.name || "-"),
          renderRow("Account", sampleData.account?.name || "-"),
          renderRow("Status", sampleData.status || "-"),
          renderRow(
            "Matrix Type",
            sampleData.matrix_type +
              (sampleData.matrix_type === MatrixType.Other
                ? ` (${sampleData.matrix_name})`
                : "")
          ),
          renderRow("Sample Type", sampleData.sample_type),
          renderRow("Sample Privacy", sampleData.sample_privacy || "Public"),
          renderRow("Compliance", sampleData.compliance || "Compliant"),
        ].join(""),
        { url: `${process.env.NEXT_PUBLIC_APP_URL}/sample/${sampleData.id}` || '#', text: "View Full Report" }
      )}

      ${renderSection(
        "Source Information",
        [
          renderRow("Source", sampleData.source || "Not specified"),
          renderRow("Sample Location", sampleData.sample_location),
          renderRow("County", sampleData.county),
          renderRow("Temperature", sampleData.temperature ? `${sampleData.temperature}°C` : "-"),
        ].join("")
      )}

      ${renderSection(
        "Identifiers",
        [
          renderRow("Project ID", sampleData.project_id),
          renderRow("PWS ID", sampleData.pws_id || "Not applicable"),
          renderRow("Chlorine Residual", sampleData.chlorine_residual || "Not measured"),
        ].join("")
      )}

      ${renderSection("Test Selection", testTypesHtml)}

      ${renderSection(
        "System Fields",
        [
          renderRow("GPS Coordinates", getGpsLocation(sampleData)),
          renderRow(
            "Sample Date",
            sampleData?.sample_collected_at
              ? format(new Date(sampleData.sample_collected_at), "yyyy-MM-dd hh:mm a")
              : "-"
          ),
          renderRow("Created At", sampleData?.created_at ? format(new Date(sampleData.created_at), "yyyy-MM-dd hh:mm a") : "-"),
          renderRow("Updated At", sampleData?.updated_at ? format(new Date(sampleData.updated_at), "yyyy-MM-dd hh:mm a") : "-"),
        ].join("")
      )}

      ${renderSection(
        "Remarks",
        `<span style=\"${remarkStyle}\">${
          sampleData?.notes || "No remarks available"
        }</span>`
      )}

      ${renderSection("Chain of Custody", cocTransferHtml)}
    </div>
  </body>
</html>`;
};
