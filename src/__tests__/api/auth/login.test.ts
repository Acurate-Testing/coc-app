import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";
import { supabase } from "@/lib/supabase";
import { setAuthCookie } from "@/lib/auth";

// Mock the auth cookie function
jest.mock("@/lib/auth", () => ({
  setAuthCookie: jest.fn().mockResolvedValue(undefined),
}));

describe("POST /api/auth/login", () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("should return 400 if email or password is missing", async () => {
    mockRequest = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Email and password are required");
  });

  it("should return 401 if login fails", async () => {
    mockRequest = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrongpassword",
      }),
    });

    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid login credentials");
  });

  it("should return user data on successful login", async () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      role: "user",
    };

    mockRequest = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: mockUser,
        session: { access_token: "test-token" },
      },
      error: null,
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toEqual(mockUser);
    expect(setAuthCookie).toHaveBeenCalledWith("test-token");
  });

  it("should return 500 if no session is created", async () => {
    mockRequest = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: "user-123" },
        session: null,
      },
      error: null,
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("No session created");
  });
});
