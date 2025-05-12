import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/test-types/route";
import { supabase } from "@/lib/supabase";

describe("Test Types API", () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest("http://localhost:3000/api/test-types", {
      method: "GET",
    });
  });

  describe("GET /api/test-types", () => {
    it("should return 401 if not authenticated", async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return test types list", async () => {
      const mockTestTypes = [
        { id: "1", name: "Test Type 1" },
        { id: "2", name: "Test Type 2" },
      ];

      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: mockTestTypes,
          error: null,
        }),
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.testTypes).toEqual(mockTestTypes);
    });
  });

  describe("POST /api/test-types", () => {
    beforeEach(() => {
      mockRequest = new NextRequest("http://localhost:3000/api/test-types", {
        method: "POST",
        body: JSON.stringify({
          name: "New Test Type",
          description: "Test description",
        }),
      });
    });

    it("should return 400 if name is missing", async () => {
      mockRequest = new NextRequest("http://localhost:3000/api/test-types", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Name is required");
    });

    it("should create new test type", async () => {
      const mockTestType = {
        id: "new-id",
        name: "New Test Type",
        description: "Test description",
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: mockTestType,
          error: null,
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.testType).toEqual(mockTestType);
    });
  });
});
