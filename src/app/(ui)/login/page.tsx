"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import "./login.css";

// Dynamically import the form component
const LoginForm = dynamic(() => import('@/app/(ui)/login/components/LoginForm'), {
  loading: () => (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  ),
});

// Dynamically import the header component
const LoginHeader = dynamic(() => import('./components/LoginHeader'), {
  loading: () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
    </div>
  ),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();

  // Handle session changes
  useEffect(() => {
    if (session?.user?.role === "lab_admin") {
      router.push("/admin-dashboard");
    } else if (session) {
      router.push(searchParams.get("callbackUrl") || "/dashboard");
    }
  }, [session, router, searchParams]);

  const handleSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: searchParams.get("callbackUrl") || "/dashboard",
      });

      if (result?.error) {
        // Handle specific error messages
        switch (result.error) {
          case "CredentialsSignin":
            setError("Invalid email or password");
            break;
          case "Email and password are required":
            setError("Please enter both email and password");
            break;
          case "No user found":
            setError("No account found with this email");
            break;
          default:
            setError(result.error);
        }
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-10">
      <div className="card-shadow max-w-md mx-auto p-8 rounded-2xl">
        <LoginHeader />
        <LoginForm 
          onSubmit={handleSubmit}
          error={error}
          isLoading={isLoading}
          onRegisterClick={() => router.push("/register")}
        />
      </div>
    </div>
  );
}
