import { MatrixType } from "@/constants/enums";
import { format } from "date-fns";

export const sampleDetailTemplate = async (sampleData: any) => {
  const sectionStyle =
    "padding: 10px; border-bottom: 1px solid #eee; margin-bottom: 10px;";
  const labelStyle = "font-weight: bold; color: #666; margin-bottom: 5px;";
  const valueStyle = "color: #333;";

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return format(new Date(date), "yyyy-MM-dd hh:mm a");
  };

  const renderCocTransfers = (transfers: any[]) => {
    if (!transfers?.length) return "No transfers recorded";
    
    return transfers.map(transfer => `
      <div style="margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
        <div style="${labelStyle}">Transfer Date</div>
        <div style="${valueStyle}">${formatDate(transfer.timestamp)}</div>
        <div style="${labelStyle}">Transferred By</div>
        <div style="${valueStyle}">${transfer.transferred_by_user?.full_name || "N/A"}</div>
        <div style="${labelStyle}">Received By</div>
        <div style="${valueStyle}">${transfer.received_by_user?.full_name || "N/A"}</div>
        ${transfer.notes ? `
          <div style="${labelStyle}">Notes</div>
          <div style="${valueStyle}">${transfer.notes}</div>
        ` : ""}
      </div>
    `).join("");
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">Sample Details</h2>
      
      <div style="${sectionStyle}">
        <div style="${labelStyle}">Sample ID</div>
        <div style="${valueStyle}">${sampleData.id || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Project ID</div>
        <div style="${valueStyle}">${sampleData.project_id || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Matrix Type</div>
        <div style="${valueStyle}">${sampleData.matrix_type || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Sample Type</div>
        <div style="${valueStyle}">${sampleData.sample_type || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Sample Privacy</div>
        <div style="${valueStyle}">${sampleData.sample_privacy || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Compliance</div>
        <div style="${valueStyle}">${sampleData.compliance || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Source</div>
        <div style="${valueStyle}">${sampleData.source || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Sample Location</div>
        <div style="${valueStyle}">${sampleData.sample_location || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">County</div>
        <div style="${valueStyle}">${sampleData.county || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">PWS ID</div>
        <div style="${valueStyle}">${sampleData.pws_id || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Chlorine Residual</div>
        <div style="${valueStyle}">${sampleData.chlorine_residual || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Temperature</div>
        <div style="${valueStyle}">${sampleData.temperature || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Sample Date</div>
        <div style="${valueStyle}">${formatDate(sampleData.sample_collected_at)}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Location</div>
        <div style="${valueStyle}">
          ${sampleData.latitude && sampleData.longitude
            ? `${sampleData.latitude}, ${sampleData.longitude}`
            : "N/A"}
        </div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Status</div>
        <div style="${valueStyle}">${sampleData.status || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Test Types</div>
        <div style="${valueStyle}">
          ${sampleData.test_types?.map((test: any) => test.name).join(", ") || "N/A"}
        </div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Notes</div>
        <div style="${valueStyle}">${sampleData.notes || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Chain of Custody Transfers</div>
        <div style="${valueStyle}">
          ${renderCocTransfers(sampleData.coc_transfers)}
        </div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Created At</div>
        <div style="${valueStyle}">${formatDate(sampleData.created_at)}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Updated At</div>
        <div style="${valueStyle}">${formatDate(sampleData.updated_at)}</div>
      </div>
    </div>
  `;
};
