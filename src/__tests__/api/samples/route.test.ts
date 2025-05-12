import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/samples/route";
import { supabase } from "@/lib/supabase";

describe("Samples API", () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest("http://localhost:3000/api/samples", {
      method: "GET",
    });
  });

  describe("GET /api/samples", () => {
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

    it("should return paginated samples list", async () => {
      const mockSamples = [
        { id: "1", project_id: "PROJ-1" },
        { id: "2", project_id: "PROJ-2" },
      ];

      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValueOnce({
          data: mockSamples,
          error: null,
          count: 2,
        }),
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.samples).toEqual(mockSamples);
      expect(data.total).toBe(2);
      expect(data.page).toBe(1);
    });
  });

  describe("POST /api/samples", () => {
    beforeEach(() => {
      mockRequest = new NextRequest("http://localhost:3000/api/samples", {
        method: "POST",
        body: JSON.stringify({
          project_id: "PROJ-1",
          agency_id: "agency-1",
          account_id: "account-1",
          matrix_type: "Water",
          temperature: 25,
        }),
      });
    });

    it("should return 400 if required fields are missing", async () => {
      mockRequest = new NextRequest("http://localhost:3000/api/samples", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("project_id is required");
    });

    it("should create new sample", async () => {
      const mockSample = {
        id: "new-id",
        project_id: "PROJ-1",
        agency_id: "agency-1",
        account_id: "account-1",
        status: "pending",
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: mockSample,
          error: null,
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sample).toEqual(mockSample);
    });
  });
});
