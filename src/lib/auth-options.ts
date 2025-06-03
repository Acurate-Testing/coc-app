import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "./supabase";
import { handleAuthError } from "./error-handling";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            const appError = handleAuthError(error);
            throw new Error(appError.message);
          }

          if (!data.user || !data.user.email) {
            throw new Error("User not found");
          }

          // Get user role and agency info
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("role, agency_id, full_name")
            .eq("id", data.user.id)
            .single();

          if (userError || !userData) {
            throw new Error("Failed to fetch user data");
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: userData.full_name || data.user.email.split('@')[0],
            role: userData.role,
            agency_id: userData.agency_id,
            supabaseToken: data.session?.access_token,
          };
        } catch (error) {
          const appError = handleAuthError(error);
          throw new Error(appError.message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.agency_id = user.agency_id;
        token.name = user.name;
        token.supabaseToken = user.supabaseToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.agency_id = token.agency_id;
        session.user.name = token.name;
        session.user.supabaseToken = token.supabaseToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
