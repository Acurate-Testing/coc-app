import { NextRequest } from "next/server";
import { POST } from "@/app/api/reports/route";
import { supabase } from "@/lib/supabase";

describe("POST /api/reports", () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        format: "pdf",
      }),
    });
  });

  it("should return 401 if not authenticated", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 403 if user is not lab_admin or agency", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({
        data: { role: "user" },
        error: null,
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should return 400 if dates are missing", async () => {
    mockRequest = new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Start date and end date are required");
  });

  it("should generate PDF report", async () => {
    const mockSamples = [
      {
        id: "sample-1",
        project_id: "PROJ-1",
        agency: { name: "Agency 1" },
        account: { name: "Account 1" },
        status: "pending",
        created_at: "2024-01-15",
      },
    ];

    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { role: "lab_admin" },
          error: null,
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({
          data: mockSamples,
          error: null,
        }),
      });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.format).toBe("pdf");
    expect(data.data).toBeDefined();
  });

  it("should generate CSV report", async () => {
    mockRequest = new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        format: "csv",
      }),
    });

    const mockSamples = [
      {
        id: "sample-1",
        project_id: "PROJ-1",
        agency: { name: "Agency 1" },
        account: { name: "Account 1" },
        status: "pending",
        created_at: "2024-01-15",
      },
    ];

    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { role: "lab_admin" },
          error: null,
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({
          data: mockSamples,
          error: null,
        }),
      });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.format).toBe("csv");
    expect(data.data).toBeDefined();
  });
});
