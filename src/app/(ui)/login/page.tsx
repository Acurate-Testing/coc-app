"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { errorToast } from "@/hooks/useCustomToast";
import { UserRole } from "@/constants/enums";

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
  const [deletedUserError, setDeletedUserError] = useState<string | null>(null);

  // Check if the user is deleted after login
  useEffect(() => {
    const checkDeletedUser = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          // Query the backend for the user's deleted_at status
          const res = await fetch(`/api/users?user_id=${session.user.id}`);
          const data = await res.json();
          // If user is deleted, sign out and show error
          if (data?.users?.length > 0 && data.users[0].deleted_at) {
            setDeletedUserError("This user has been deleted");
            await signIn("credentials", { redirect: false }); // force sign out
            // Optionally, you can call signOut() from next-auth if available
          } else {
            const callbackUrl = searchParams.get("callbackUrl");
            if (callbackUrl && callbackUrl !== "/login") {
              if (session.user.role === UserRole.LABADMIN) {
                router.replace("/admin-dashboard/samples");
              } else {
                router.replace(callbackUrl);
              }
            } else {
              if (session.user.role === UserRole.LABADMIN) {
                router.replace("/admin-dashboard/samples");
              } else {
                router.replace("/samples");
              }
            }
          }
        } catch (e) {
          // fallback: allow login if check fails
        }
      }
    };
    checkDeletedUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, searchParams]);

  // Add this function to handle sign-in errors
  function handleSignInError(error: any) {
    if (
      error?.message === "Your account has been deactivated" ||
      error?.toString().includes("Your account has been deactivated")
    ) {
      errorToast("Your account has been deactivated");
    } else if (
      error?.message === "CredentialsSignin" ||
      error?.toString().includes("CredentialsSignin")
    ) {
      errorToast("Invalid email or password");
    } else {
      errorToast(error?.message || "Failed to sign in");
    }
  }

  const handleSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    setDeletedUserError(null);
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
        handleSignInError(result.error);
      } else if (result?.ok) {
        // Let the useEffect handle the redirection and deleted user check
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      errorToast("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-10">
      <div className="card-shadow w-full max-w-md mx-auto p-8 rounded-2xl">
        <LoginHeader />
        {deletedUserError && (
          <div className="mb-4 text-center text-red-600 font-semibold">
            {deletedUserError}
          </div>
        )}
        <LoginForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onRegisterClick={() => router.push("/register")}
        />
      </div>
    </div>
  );
}
