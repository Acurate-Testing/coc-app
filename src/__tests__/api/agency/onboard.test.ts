import { NextRequest } from "next/server";
import { POST } from "@/app/api/agency/onboard/route";
import { supabase } from "@/lib/supabase";

describe("POST /api/agency/onboard", () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest("http://localhost:3000/api/agency/onboard", {
      method: "POST",
      body: JSON.stringify({
        token: "valid-token",
        name: "Test Agency",
        address: "123 Test St",
        contactEmail: "agency@example.com",
        password: "password123",
      }),
    });
  });

  it("should return 400 if required fields are missing", async () => {
    mockRequest = new NextRequest("http://localhost:3000/api/agency/onboard", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("All fields are required");
  });

  it("should return 400 if invite token is invalid", async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({
        data: null,
        error: null,
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid or expired invite token");
  });

  it("should create agency and admin user", async () => {
    const mockAgency = {
      id: "agency-123",
      name: "Test Agency",
      contact_email: "agency@example.com",
    };

    const mockUser = {
      id: "user-123",
      email: "agency@example.com",
      role: "agency",
    };

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { created_by: "admin-123" },
          error: null,
        }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: mockAgency,
          error: null,
        }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({
          error: null,
        }),
      })
      .mockReturnValueOnce({
        delete: jest.fn().mockResolvedValueOnce({
          error: null,
        }),
      });

    (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
      data: {
        user: mockUser,
        session: { access_token: "test-token" },
      },
      error: null,
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.agency).toEqual(mockAgency);
    expect(data.user).toEqual(mockUser);
  });

  it("should handle auth signup error", async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({
        data: { created_by: "admin-123" },
        error: null,
      }),
    });

    (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: "Email already exists" },
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Email already exists");
  });
});
