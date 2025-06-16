import { MatrixType } from "@/constants/enums";
import { format } from "date-fns";

export const sampleDetailTemplate = async (sampleData: any) => {
  const containerStyle = "max-width: 800px; margin: 0 auto; padding: 24px; font-family: Arial, sans-serif; background: #f4f4f4;";
  const cardStyle = "background: #fff; border-radius: 12px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);";
  const headerStyle = "padding: 16px 20px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; border-radius: 12px 12px 0 0;";
  const titleStyle = "font-size: 20px; font-weight: 600; color: #1f2937; margin: 0; text-align: center;";
  const tableStyle = "width: 100%; border-collapse: collapse; margin: 0;";
  const labelCellStyle = "padding: 12px 16px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #f3f4f6; vertical-align: top; width: 35%; background: #f9fafb;";
  const valueCellStyle = "padding: 12px 16px; color: #111827; border-bottom: 1px solid #f3f4f6; vertical-align: top; word-wrap: break-word;";
  const statusBadgeStyle = "display: inline-block; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600;";
  const buttonStyle = "background-color: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; font-size: 16px; text-decoration: none; font-weight: 600; display: inline-block; margin: 20px auto; text-align: center;";
  const cocTimelineStyle = "position: relative;";
  const cocItemStyle = "background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; position: relative;";
  const cocDateStyle = "font-size: 12px; color: #64748b; margin-bottom: 4px;";
  const cocNameStyle = "font-weight: 600; color: #1e293b; font-size: 14px;";

  const formatValue = (value: any, isMultiline = false) => {
    if (value === null || value === undefined || value === "") return "-";
    return isMultiline ? value.replace(/\n/g, "<br>") : value;
  };

  const getStatusBadge = (status: string) => {
    let badgeColor = "background: #fef3c7; color: #92400e;"; // default yellow
    if (status === "Pass") badgeColor = "background: #d1fae5; color: #065f46;";
    else if (status === "Fail") badgeColor = "background: #fee2e2; color: #991b1b;";
    
    return `<span style="${statusBadgeStyle} ${badgeColor}">${status}</span>`;
  };

  const formatTestSelection = () => {
    if (!sampleData?.test_types?.length) {
      return "No tests selected";
    }
    
    const lines = [];
    if (sampleData.test_group?.name) {
      lines.push(`Group: ${sampleData.test_group.name}`);
    }
    
    sampleData.test_types.forEach((test: any) => {
      lines.push(`Test: ${test.name}`);
    });
    
    return lines.join("<br>");
  };

  const formatCocTransfers = () => {
    const cocTransfers = sampleData?.coc_transfers || [];
    if (cocTransfers.length === 0) {
      return "No transfers recorded";
    }
    
    return cocTransfers.map((transfer: any, index: number) => {
      const isLabAdminTransfer = transfer.received_by_user?.id === process.env.NEXT_PUBLIC_LAB_ADMIN_ID;
      const timestamp = transfer.timestamp ? format(new Date(transfer.timestamp), "MMM d, yyyy h:mm a") : "No timestamp";
      const receivedBy = isLabAdminTransfer ? "Lab Admin" : transfer.received_by_user?.full_name || "Unknown";
      
      return `<div style="${cocItemStyle}">
        <div style="${cocDateStyle}">${timestamp}</div>
        <div style="${cocNameStyle}">Transferred to: ${receivedBy}</div>
      </div>`;
    }).join("");
  };

  const getGpsLocation = (data: any) => {
    if (data.latitude && data.longitude) {
      const lat = parseFloat(data.latitude).toFixed(6);
      const lon = parseFloat(data.longitude).toFixed(6);
      return `${lat}, ${lon}`;
    }
    return "-";
  };

  const tableRows = [
    { label: "Sample ID", value: sampleData.id },
    { label: "Project ID", value: sampleData.project_id },
    { label: "PWS ID", value: sampleData.pws_id },
    { label: "Customer", value: sampleData.agency?.name },
    { label: "Account", value: sampleData.account?.name },
    { label: "Created By", value: sampleData.created_by_user?.full_name || "(Sampler)" },
    { label: "County", value: sampleData.county },
    { label: "Sample Privacy", value: sampleData.sample_privacy || "Public" },
    { label: "Compliance", value: sampleData.compliance || "Compliant" },
    { label: "Matrix Type", value: sampleData.matrix_type + (sampleData.matrix_type === MatrixType.Other ? ` (${sampleData.matrix_name})` : "") },
    { label: "Sample Location", value: sampleData.sample_location },
    { label: "GPS Location", value: getGpsLocation(sampleData) },
    { label: "Source", value: sampleData.source || "Not specified" },
    { label: "Sample Type", value: sampleData.sample_type },
    { label: "Temperature", value: sampleData.temperature ? `${sampleData.temperature}°C` : "-" },
    { label: "Chlorine Residual", value: sampleData.chlorine_residual || "Not measured" },
    { label: "Sample Date", value: sampleData?.sample_collected_at ? format(new Date(sampleData.sample_collected_at), "yyyy-MM-dd hh:mm a") : "-" },
    { label: "Test Selection", value: formatTestSelection(), isMultiline: true },
    { label: "Remarks", value: sampleData?.notes || "No remarks available" },
    { label: "Created At", value: sampleData?.created_at ? format(new Date(sampleData.created_at), "yyyy-MM-dd hh:mm a") : "-" },
    { label: "Updated At", value: sampleData?.updated_at ? format(new Date(sampleData.updated_at), "yyyy-MM-dd hh:mm a") : "-" },
  ];

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Report - ${sampleData.id}</title>
  </head>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4; line-height: 1.6;">
    <div style="${containerStyle}">
      <!-- Header -->
      <div style="${cardStyle}">
        <div style="${headerStyle}">
          <h1 style="${titleStyle}">Accurate Testing Labs - Sample Report</h1>
        </div>
      </div>

      <!-- Status Badge -->
      ${sampleData.status ? `
      <div style="${cardStyle}">
        <div style="padding: 16px 20px;">
          <div style="margin-bottom: 16px;">
            <strong style="color: #4b5563;">Status:</strong> ${getStatusBadge(sampleData.status)}
          </div>
          ${(sampleData.status === "Pass" || sampleData.status === "Fail") && sampleData.pass_fail_notes ? `
          <div>
            <strong style="color: #4b5563;">Pass/Fail Notes:</strong>
            <span style="color: #111827;">${sampleData.pass_fail_notes}</span>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <!-- Main Report Table -->
      <div style="${cardStyle}">
        <div style="padding: 20px;">
          <table style="${tableStyle}">
            <tbody>
              ${tableRows.map(row => `
                <tr>
                  <td style="${labelCellStyle}">${row.label}</td>
                  <td style="${valueCellStyle}">
                    ${row.isMultiline ? 
                      `<div style="white-space: pre-wrap;">${formatValue(row.value, true)}</div>` : 
                      formatValue(row.value)
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Chain of Custody -->
      <div style="${cardStyle}">
        <div style="${headerStyle}">
          <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0;">Chain of Custody</h2>
        </div>
        <div style="padding: 20px;">
          <div style="${cocTimelineStyle}">
            ${formatCocTransfers()}
          </div>
        </div>
      </div>

      <!-- View Full Report Button -->
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/sample/${sampleData.id}" style="${buttonStyle}" target="_blank">
          View Full Report
        </a>
      </div>
    </div>
  </body>
</html>`;
};
