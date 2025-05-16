"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { errorToast } from "@/hooks/useCustomToast";

// Dynamically import the form component
const LoginForm = dynamic(
  () => import("@/app/(ui)/components/Auth/LoginForm"),
  {
    loading: () => (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    ),
  }
);

// Dynamically import the header component
const LoginHeader = dynamic(() => import("../components/Auth/LoginHeader"), {
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
            errorToast("Invalid email or password");
            break;
          case "Email and password are required":
            errorToast("Please enter both email and password");
            break;
          case "No user found":
            errorToast("No account found with this email");
            break;
          default:
            errorToast(result.error);
        }
      }
    } catch (error) {
      errorToast("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-10">
      <div className="card-shadow w-full max-w-md mx-auto p-8 rounded-2xl">
        <LoginHeader />
        <LoginForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onRegisterClick={() => router.push("/register")}
        />
      </div>
    </div>
  );
}
