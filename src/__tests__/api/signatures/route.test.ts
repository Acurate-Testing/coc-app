import { NextRequest } from "next/server";
import { POST } from "@/app/api/signatures/route";
import { supabase } from "@/lib/supabase";

describe("POST /api/signatures", () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest("http://localhost:3000/api/signatures", {
      method: "POST",
      body: JSON.stringify({
        sampleId: "sample-123",
        signature: "base64-signature-data",
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

  it("should return 400 if sampleId or signature is missing", async () => {
    mockRequest = new NextRequest("http://localhost:3000/api/signatures", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Sample ID and signature are required");
  });

  it("should return 404 if sample not found", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

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

    expect(response.status).toBe(404);
    expect(data.error).toBe("Sample not found");
  });

  it("should store encrypted signature", async () => {
    const mockSignature = {
      id: "signature-123",
      sample_id: "sample-123",
      signature: "encrypted-signature-data",
      created_by: "user-123",
    };

    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: "sample-123" },
          error: null,
        }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: mockSignature,
          error: null,
        }),
      });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.signature).toEqual(mockSignature);
  });

  it("should handle database error", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: "sample-123" },
          error: null,
        }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: "Database error" },
        }),
      });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Database error");
  });
});
