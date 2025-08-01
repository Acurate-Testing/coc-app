import { SampleStatus, UserRole } from '@/constants/enums';
import { authOptions } from '@/lib/auth-options';
import { supabase } from "@/lib/supabase";
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { format } from "date-fns";
import { requireRole } from "@/lib/auth";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

// Define CSV export column configurations
// This makes header changes easy without changing the rest of the code
const CSV_EXPORT_CONFIG = {
  // Base columns available to all users
  baseColumns: [
    { field: 'project_id', header: 'Project ID' },
    { field: 'pws_id', header: 'PWS ID' },
    { field: 'matrix_type', header: 'Matrix Type' },
    { field: 'sample_type', header: 'Sample Type' },
    { field: 'sample_location', header: 'Sample Location' },
    { field: 'status', header: 'Status' },
    { field: 'created_at', header: 'Created At' },
    { field: 'temperature', header: 'Temperature' },
    { field: 'chlorine_residual', header: 'Chlorine Residual' },
    { field: 'sample_collected_at', header: 'Sample Collected At' },
    { field: 'notes', header: 'Notes' },
    { field: "source", header: "Source" },
  ],
  
  // Additional columns for admin users
  adminColumns: [
    { field: 'agency_name', header: 'Customer' },
    { field: 'test_types', header: 'Test Types' },
  ]
};

// Helper function to format dates
const formatDate = (date: string | Date | null) => {
  if (!date) return '';
  return format(new Date(date), "yyyy-MM-dd hh:mm a");
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.supabaseToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const agencyId = searchParams.get("agencyId") || "";

    const supabase = createRouteHandlerClient({ cookies });

    let query = supabase
      .from("samples")
      .select(`
        *,
        created_by_user:users!samples_created_by_fkey(id, full_name, email),
        agency:agencies!samples_agency_id_fkey(id, name, street, city, state, zip),
        account:accounts!samples_account_id_fkey(id, name),
        test_types:test_types(id, name, test_code),
        coc_transfers(
          id,
          transferred_by,
          transferred_by_user:users!coc_transfers_transferred_by_fkey(id, full_name, email),
          received_by,
          received_by_user:users!coc_transfers_received_by_fkey(id, full_name, email),
          timestamp,
          latitude,
          longitude,
          signature,
          photo_url
        )
      `)
      .is("deleted_at", null);

    if (search) {
      query = query.or(
        `project_id.ilike.%${search}%,sample_location.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    if (status) {
      query = query.in("status", status.split(","));
    }

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    const { data: samples, error } = await query;

    if (error) {
      console.error("Error fetching samples for export:", error);
      return NextResponse.json(
        { error: "Failed to fetch samples" },
        { status: 500 }
      );
    }

    // Define CSV headers
    const headers = [
      "Project ID",
      "Matrix Type",
      "Sample Type",
      "Sample Location",
      "Sample Privacy",
      "Status",
      "Sample Collected At",
      "Temperature",
      "Pass/Fail Notes",
      "County",
      "Compliance",
      "Chlorine Residual",
      "PWS ID",
      "GPS Coordinates",
      "Customer",
      "Sampler",
      "Customer Address",
      "Account",
      "Test Types",
      "Test Code",
      "Source",
      "Chain of Custody",
      "Created At",
      "Updated At",
      "Notes" // Moved Notes to the last position
    ];

    // Convert samples to CSV rows
    const rows = samples.map((sample) => {
      const gpsLocation = sample.latitude && sample.longitude 
        ? `${sample.latitude}, ${sample.longitude}`
        : "-";

      const testTypes = sample.test_types
        ?.map((test: any) => test.name)
        .join(", ") || "-";

      const testCodes = sample.test_types
        ?.map((test: any) => test.test_code || "")
        .filter(Boolean)
        .join(", ") || "-";

      const cocInfo = sample.coc_transfers
        ?.map((transfer: any) => {
          const from = transfer.transferred_by_user?.full_name || transfer.transferred_by_user?.email || "-";
          const to = transfer.received_by_user?.full_name || transfer.received_by_user?.email || "-";
          const timestamp = transfer.timestamp ? format(new Date(transfer.timestamp), "yyyy-MM-dd HH:mm:ss") : "-";
          return `${from} → ${to} (${timestamp})`;
        })
        .join(" | ") || "-";

      // Format customer address as a complete string
      const customerAddress = sample.agency 
        ? [
            sample.agency.street,
            sample.agency.city,
            sample.agency.state,
            sample.agency.zip
          ]
            .filter(Boolean)
            .join(", ")
        : "-";

      return [
        sample.project_id || "-",
        sample.matrix_type || "-",
        sample.sample_type || "-",
        sample.sample_location || "-",
        sample.sample_privacy || "-",
        sample.status || "-",
        sample.sample_collected_at ? format(new Date(sample.sample_collected_at), "yyyy-MM-dd HH:mm:ss") : "-",
        sample.temperature?.toString() || "-",
        sample.pass_fail_notes || "-",
        sample.county || "-",
        sample.compliance || "-",
        sample.chlorine_residual || "-",
        sample.pws_id || "-",
        gpsLocation,
        sample.created_by_user?.full_name || sample.created_by_user?.email || "-",
        sample.agency?.name || "-",
        customerAddress,
        sample.account?.name || "-",
        testTypes,
        testCodes,
        sample.source || "-",
        cocInfo,
        sample.created_at ? format(new Date(sample.created_at), "yyyy-MM-dd HH:mm:ss") : "-",
        sample.updated_at ? format(new Date(sample.updated_at), "yyyy-MM-dd HH:mm:ss") : "-",
        sample.notes || "-" // Notes moved to last
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");

    // Create response with CSV file
    const response = new NextResponse(csvContent);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="samples-export-${format(new Date(), "yyyy-MM-dd")}.csv"`
    );

    return response;
  } catch (error) {
    console.error("Error in GET /api/samples/export:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function processDataForCSV(data: any[], isLabAdmin: boolean): string {
  // Select columns based on user role
  let columns = [...CSV_EXPORT_CONFIG.baseColumns];
  
  // Add admin columns for admin users
  if (isLabAdmin) {
    columns = [
      ...columns.slice(0, 2), // Project ID, PWS ID
      ...CSV_EXPORT_CONFIG.adminColumns.filter(col => col.field === 'agency_name'), // Insert Customer after PWS ID
      ...columns.slice(2), // Rest of base columns
      ...CSV_EXPORT_CONFIG.adminColumns.filter(col => col.field === 'test_types') // Test Types at the end
    ];
  }
  
  // Generate CSV headers row
  const headerRow = columns.map(col => `"${col.header}"`).join(',');
  
  // Process data rows
  const dataRows = data.map(sample => {
    // Create a data object with all the transformed values
    const rowDataObj: Record<string, string> = {
      'project_id': sample.project_id || '',
      'pws_id': sample.pws_id || '',
      'matrix_type': sample.matrix_type || '',
      'sample_type': sample.sample_type || '',
      'sample_location': sample.sample_location || '',
      'status': getStatusLabel(sample.status),
      'created_at': formatDate(sample.created_at),
      'temperature': sample.temperature || '',
      'chlorine_residual': sample.chlorine_residual || '',
      'sample_collected_at': formatDate(sample.sample_collected_at),
      'notes': (sample.notes || '').replace(/"/g, '""') // Escape double quotes
    };

    // Add admin-specific fields if needed
    if (isLabAdmin) {
      rowDataObj['agency_name'] = sample.agency?.name || '';
      rowDataObj['test_types'] = sample.test_types
        ? sample.test_types
          .map((tt: any) => tt.name || '')
          .filter(Boolean)
          .join(', ')
        : '';
    }

    // Map each column to its corresponding data value
    const rowValues = columns.map(col => {
      const value = rowDataObj[col.field] || '';
      return `"${value}"`;
    });
    
    return rowValues.join(',');
  });

  // Combine header and data rows to form the CSV content
  return [headerRow, ...dataRows].join('\n');
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "pending": return "Pending";
    case "in_coc": return "In Chain of Custody";
    case "submitted": return "Submitted";
    case "pass": return "Passed";
    case "fail": return "Failed";
    default: return status || '';
  }
}
