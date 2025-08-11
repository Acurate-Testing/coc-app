import "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    agency_id: string;
    supabaseToken: string;
    PWS_id_prefix?: string | null; // <-- Add this line
  }

  interface Session {
    user: User & {
      id: string;
      role: string;
      agency_id: string;
      supabaseToken: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    agency_id?: string | null;
  }
}
