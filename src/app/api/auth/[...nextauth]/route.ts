import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      accounts?: any[];
      role?: string | null;
      agency_id?: string | null;
      supabaseToken?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string | null;
    agency_id?: string | null;
    accounts?: any[];
    supabaseToken?: string;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Missing credentials");
          throw new Error("Email and password are required");
        }

        try {
          const cookieStore = cookies();
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              cookies: {
                get(name: string) {
                  return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                  cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                  cookieStore.set({ name, value: "", ...options });
                },
              },
            }
          );

          // Fetch user from Supabase with deleted_at IS NULL
          const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", credentials.email)
            .single();

          // Check for deleted or deactivated user
          if (error || !user || user.deleted_at || user.active === false) {
            // User not found, deleted, or deactivated
            const err = new Error("Your account has been deactivated");
            (err as any).code = "ACCOUNT_DEACTIVATED";
            throw err;
          }

          const {
            data: { session },
            error: authError,
          } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (authError) {
            console.error("Supabase auth error:", authError);
            throw new Error(authError.message);
          }

          if (!session) {
            console.error("No session found after successful auth");
            throw new Error("Authentication failed");
          }

          // Initialize accounts as empty array and agency_id as null
          let accounts = [];
          let agency_id = null;
          let LoggedInUserData = null;

          try {
            // Try to fetch agency accounts for the user
            const { data: accountsData, error: accountsError } = await supabase
              .from("accounts")
              .select("*")
              .eq("user_id", user.id);

            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("id", user.id)
              .single();

            if (!accountsError && accountsData) {
              accounts = accountsData;
            }
            if (!userError && userData) {
              agency_id = userData.agency_id;
              LoggedInUserData = userData;
            }
          } catch (error) {
            console.warn("Could not fetch accounts - this is optional:", error);
          }

          return {
            id: user.id,
            email: user.email || credentials.email,
            name: LoggedInUserData?.full_name,
            role: LoggedInUserData?.role,
            accounts: accounts,
            agency_id,
            supabaseToken: session.access_token,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accounts = (user as any).accounts || [];
        token.role = (user as any).role ?? null;
        token.agency_id = (user as any).agency_id ?? null;
        token.name = (user as any).name ?? null;
        token.supabaseToken = (user as any).supabaseToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.accounts = (token.accounts as any[]) || [];
        session.user.agency_id = token.agency_id;
        session.user.name = token.name;
        session.user.supabaseToken = token.supabaseToken;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
