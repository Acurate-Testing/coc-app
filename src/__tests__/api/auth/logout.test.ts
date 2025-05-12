import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/logout/route";
import { supabase } from "@/lib/supabase";

describe("POST /api/auth/logout", () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
    });
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("should return 500 if logout fails", async () => {
    supabase.auth.signOut.mockResolvedValueOnce({
      error: { message: "Logout failed" },
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Logout failed");
  });

  it("should return success on successful logout", async () => {
    supabase.auth.signOut.mockResolvedValueOnce({
      error: null,
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
