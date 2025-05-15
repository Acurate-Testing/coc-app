import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/samples/coc/route";
import { supabase } from "@/lib/supabase";

describe("Chain of Custody API", () => {
  let mockRequest: NextRequest;
  const sampleId = "sample-123";

  beforeEach(() => {
    mockRequest = new NextRequest(
      `http://localhost:3000/api/samples/${sampleId}/coc`,
      {
        method: "GET",
      }
    );
  });

  describe("GET /api/samples/[sampleId]/coc", () => {
    it("should return 401 if not authenticated", async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const response = await GET(mockRequest, { params: { sampleId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return chain of custody history", async () => {
      const mockTransfers = [
        {
          id: "transfer-1",
          sample_id: sampleId,
          transferred_by: "user-1",
          received_by: "user-2",
        },
      ];

      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: mockTransfers,
          error: null,
        }),
      });

      const response = await GET(mockRequest, { params: { sampleId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transfers).toEqual(mockTransfers);
    });
  });

  describe("POST /api/samples/[sampleId]/coc", () => {
    beforeEach(() => {
      mockRequest = new NextRequest(
        `http://localhost:3000/api/samples/${sampleId}/coc`,
        {
          method: "POST",
          body: JSON.stringify({
            received_by: "user-2",
            latitude: 37.7749,
            longitude: -122.4194,
            signature: "base64-signature-data",
          }),
        }
      );
    });

    it("should return 400 if required fields are missing", async () => {
      mockRequest = new NextRequest(
        `http://localhost:3000/api/samples/${sampleId}/coc`,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );

      const response = await POST(mockRequest, { params: { sampleId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Received by and signature are required");
    });

    it("should create new transfer record", async () => {
      const mockTransfer = {
        id: "new-transfer",
        sample_id: sampleId,
        transferred_by: "user-1",
        received_by: "user-2",
        signature: "encrypted-signature",
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: "user-1" } },
        error: null,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: { id: sampleId },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: mockTransfer,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockResolvedValueOnce({
            error: null,
          }),
        });

      const response = await POST(mockRequest, { params: { sampleId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transfer).toEqual(mockTransfer);
    });

    it("should return 404 if sample not found", async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: "user-1" } },
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

      const response = await POST(mockRequest, { params: { sampleId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Sample not found");
    });
  });
});
