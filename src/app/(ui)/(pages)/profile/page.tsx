"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FaAngleLeft } from "react-icons/fa";
import { Button } from "@/stories/Button/Button";
import { Card } from "@/stories/Card/Card";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!session?.user?.id) return;

    // Fetch initial user data
    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      if (data?.full_name) {
        setName(data.full_name);
      }
    };

    fetchUserData();
  }, [session?.user?.id, supabase]);

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!session?.user?.id) {
        throw new Error("No user found");
      }

      const { error } = await supabase
        .from("users")
        .update({ full_name: name })
        .eq("id", session.user.id);

      if (error) throw error;

      // Update the session with the new name
      await updateSession({
        ...session,
        user: {
          ...session.user,
          name: name,
        },
      });

      successToast("Name updated successfully");
    } catch (error) {
      errorToast("Failed to update name");
      console.error("Error updating name:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!session?.user?.id) {
        throw new Error("No user found");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      successToast("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      errorToast("Failed to update password");
      console.error("Error updating password:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Button
          label="Back"
          icon={<FaAngleLeft />}
          variant="icon"
          size="large"
          onClick={() => router.back()}
        />
        <div className="text-center mt-6">
          <p className="text-red-500">Please sign in to access your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button
        label="Back"
        icon={<FaAngleLeft />}
        variant="icon"
        size="large"
        onClick={() => router.back()}
      />

      <div className="space-y-8 mt-6">
        {/* Name Update Form */}
        <Card className="p-6 !shadow-none rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Update Name</h2>
          <form onSubmit={handleNameUpdate} className="space-y-4">
            <div>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 form-input"
                placeholder="Enter your full name"
                required
              />
            </div>

            {isLoading ? (
              <LoadingButton
                label="Updating..."
                size="large"
                className="h-[50px] mt-4"
                disabled
              />
            ) : (
              <Button
                label="Update Name"
                size="large"
                type="submit"
                className="w-full h-[50px] mt-4"
                disabled={isLoading}
              />
            )}
          </form>
        </Card>

        <Card className="p-6 !shadow-none rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 form-input"
                placeholder="********"
                required
              />
            </div>
            <div>
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 form-input"
                placeholder="********"
                required
                minLength={6}
              />
            </div>
            {isLoading ? (
              <LoadingButton
                label="Updating..."
                size="large"
                className="h-[50px] mt-4"
                disabled
              />
            ) : (
              <Button
                label="Update Password"
                size="large"
                type="submit"
                className="w-full h-[50px] mt-4"
                disabled={isLoading}
              />
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
