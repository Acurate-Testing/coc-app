import { SampleStatus, UserRole } from '@/constants/enums';
import { authOptions } from '@/lib/auth-options';
import { supabase } from "@/lib/supabase";
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import moment from "moment";

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
    { field: 'notes', header: 'Notes' }
  ],
  
  // Additional columns for admin users
  adminColumns: [
    { field: 'agency_name', header: 'Agency' },
    { field: 'test_types', header: 'Test Types' },
  ]
};

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse search parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const agency = searchParams.get("agency") || "";

    // Role-based access control
    const isAgency = session.user.role === UserRole.AGENCY;
    const isLabAdmin = session.user.role === UserRole.LABADMIN;

    // Set up query
    let baseSelect = `
      *,
      account:accounts(name),
      sample_test_types(
        test_types(id, name)
      )
    `;

    if (isAgency || isLabAdmin) {
      baseSelect = `
        *,
        agency:agencies(name),
        account:accounts(name),
        sample_test_types(
          test_types(id, name)
        )
      `;
    }

    let query = supabase
      .from('samples')
      .select(baseSelect)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Apply search filter if provided
    if (search) {
      query = query.or(`project_id.ilike.%${search}%,pws_id.ilike.%${search}%,matrix_type.ilike.%${search}%`);
    }
    
    // Apply role-based filters
    if (isLabAdmin) {
      // Lab admin can only see submitted, pass, or fail samples
      query = query.in('status', [SampleStatus.Submitted, SampleStatus.Pass, SampleStatus.Fail]);
      
      // Apply additional status filter if provided
      if (status && status !== "All") {
        query = query.eq('status', status.toLowerCase());
      }
      
      // Lab admin can also filter by agency
      if (agency) {
        query = query.eq('agency_id', agency);
      }
    } else {
      // Regular users can only see their agency's samples
      query = query.eq('agency_id', token.agency_id);
      
      // Apply status filter if provided
      if (status && status !== "All") {
        query = query.eq('status', status.toLowerCase());
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 400 });
    }

    // Process the data for CSV format
    const csvData = processDataForCSV(data, isLabAdmin);
    
    // Create CSV headers
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', 'attachment; filename=samples-export.csv');
    
    // Return the CSV data
    return new NextResponse(csvData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Export samples error:", error);
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
      ...CSV_EXPORT_CONFIG.adminColumns.filter(col => col.field === 'agency_name'), // Insert Agency after PWS ID
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
      'created_at': sample.created_at ? new Date(sample.created_at).toLocaleString() : '',
      'temperature': sample.temperature || '',
      'chlorine_residual': sample.chlorine_residual || '',
      'sample_collected_at': sample.sample_collected_at ? new Date(sample.sample_collected_at).toLocaleString() : '',
      'notes': (sample.notes || '').replace(/"/g, '""') // Escape double quotes
    };

    // Add admin-specific fields if needed
    if (isLabAdmin) {
      rowDataObj['agency_name'] = sample.agency?.name || '';
      rowDataObj['test_types'] = sample.sample_test_types
        ? sample.sample_test_types
          .map((stt: any) => stt.test_types?.name || '')
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
