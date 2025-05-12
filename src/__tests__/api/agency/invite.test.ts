import { NextRequest } from "next/server";
import { POST } from "@/app/api/agency/invite/route";
import { supabase } from "@/lib/supabase";

describe("POST /api/agency/invite", () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest("http://localhost:3000/api/agency/invite", {
      method: "POST",
      body: JSON.stringify({
        email: "agency@example.com",
        name: "Test Agency",
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

  it("should return 403 if user is not lab_admin", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({
        data: { role: "agency" },
        error: null,
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should return 400 if email or name is missing", async () => {
    mockRequest = new NextRequest("http://localhost:3000/api/agency/invite", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Email and name are required");
  });

  it("should create agency invite", async () => {
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
        insert: jest.fn().mockResolvedValueOnce({
          error: null,
        }),
      });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
