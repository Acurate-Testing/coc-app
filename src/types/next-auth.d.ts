import "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: string;
      agency_id?: string | null;
    };
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: string;
    agency_id?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    agency_id?: string | null;
  }
}
