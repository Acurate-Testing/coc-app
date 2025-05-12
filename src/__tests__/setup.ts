import { supabase } from "@/lib/supabase";

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.ENCRYPTION_KEY = "test-encryption-key-32-chars-long!!!!!";
process.env.SENDGRID_API_KEY = "test-sendgrid-key";
process.env.SENDGRID_FROM_EMAIL = "test@example.com";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

// Mock Supabase client
jest.mock("@/lib/supabase");

// Mock SendGrid
jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

// Mock crypto
jest.mock("crypto", () => ({
  randomBytes: jest.fn(() => Buffer.from("test-token")),
}));

// Mock cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));
