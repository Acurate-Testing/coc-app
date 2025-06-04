import { MatrixType } from "@/constants/enums";
import { format } from "date-fns";

export const sampleDetailTemplate = async (sampleData: any) => {
  const sectionStyle =
    "padding: 10px; border-bottom: 1px solid #eee; margin-bottom: 10px;";
  const labelStyle = "font-weight: bold; color: #666; margin-bottom: 5px;";
  const valueStyle = "color: #333;";

  const formatDate = (date: string | Date) => {
    if (!date) return "N/A";
    return format(new Date(date), "yyyy-MM-dd hh:mm a");
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">Sample Details</h2>
      
      <div style="${sectionStyle}">
        <div style="${labelStyle}">Sample ID</div>
        <div style="${valueStyle}">${sampleData.id || "N/A"}</div>
      </div>

      <div style="${sectionStyle}">
        <div style="${labelStyle}">Matrix Type</div>
        <div style="${valueStyle}">${sampleData.matrix_type || "N/A"}</div>
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
