"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "../../components/Common/LoadingSpinner";
import { Card } from "@/stories/Card/Card";
import { Button } from "@/stories/Button/Button";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto mt-5 px-4">
      <Card className="rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Dashboard</h3>
          <Button
            label="Logout"
            variant="danger"
            size="large"
            onClick={handleLogout}
          />
        </div>
        <div className="px-6 py-4">
          <h4 className="text-lg font-semibold text-gray-700">
            Welcome, {session?.user?.name}!
          </h4>
          <p className="text-gray-600 mt-1">
            You are logged in as: {session?.user?.email}
          </p>

          <div className="mt-6">
            <h5 className="text-md font-medium text-gray-800 mb-3">
              Your Account Information
            </h5>
            <ul className="space-y-2">
              <li className="bg-gray-50 p-3 rounded border">
                <strong className="text-gray-700">Name:</strong>{" "}
                {session?.user?.name}
              </li>
              <li className="bg-gray-50 p-3 rounded border">
                <strong className="text-gray-700">Email:</strong>{" "}
                {session?.user?.email}
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
