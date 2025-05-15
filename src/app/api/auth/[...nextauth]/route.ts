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
      agency_id?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
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
              auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
              },
            }
          );

          const {
            data: { user },
            error,
          } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            console.error("Supabase auth error:", error);
            throw new Error(error.message);
          }

          if (!user) {
            console.error("No user found after successful auth");
            throw new Error("No user found");
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
              // if (accounts.length > 0) {
              //   agency_id = accounts[0].agency_id;
              // }
            }
            if (!userError && userData) {
              agency_id = userData.agency_id;
              LoggedInUserData = userData;
            }
          } catch (error) {
            console.warn("Could not fetch accounts - this is optional:", error);
            // Continue with empty accounts array
          }

          return {
            id: user.id,
            email: user.email,
            name: LoggedInUserData?.full_name,
            accounts: accounts,
            agency_id,
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
        token.agency_id = (user as any).agency_id ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.accounts = (token.accounts as any[]) || [];
        session.user.agency_id =
          typeof token.agency_id === "string" ? token.agency_id : null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
