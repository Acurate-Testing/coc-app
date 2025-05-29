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
    if (status === "authenticated" && session?.user) {
      const callbackUrl = searchParams.get("callbackUrl");
      // Only redirect if callbackUrl is not /login
      if (callbackUrl && callbackUrl !== "/login") {
        if (session.user.role === "lab_admin") {
          router.replace("/admin-dashboard/samples");
        } else {
          router.replace(callbackUrl);
        }
      } else {
        // Default redirect if no valid callbackUrl
        if (session.user.role === "lab_admin") {
          router.replace("/admin-dashboard/samples");
        } else {
          router.replace("/samples");
        }
      }
    }
  }, [session, status, router, searchParams]);

  const handleSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const callbackUrl = searchParams.get("callbackUrl");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl:
          callbackUrl && callbackUrl !== "/login" ? callbackUrl : "/samples",
      });

      if (result?.error) {
        console.error("Login error:", result.error);
        errorToast("Invalid credentials. Please try again.");
      } else if (result?.ok) {
        // Let the useEffect handle the redirection
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Login error:", error);
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
