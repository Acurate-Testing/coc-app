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
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!session?.user?.id) return;

    // Fetch initial user data
    const fetchUserData = async () => {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("full_name, email, role, agency_id")
        .eq("id", session.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return;
      }

      if (userData?.full_name) {
        setName(userData.full_name);
      }

      // If user is an agency, fetch agency details
      if (userData?.role === "agency" && userData?.agency_id) {
        const { data: agencyData, error: agencyError } = await supabase
          .from("agencies")
          .select("name, contact_email, phone, address")
          .eq("id", userData.agency_id)
          .single();

        if (agencyError) {
          console.error("Error fetching agency data:", agencyError);
          return;
        }

        if (agencyData) {
          setName(agencyData.name || userData.full_name);
          setPhone(agencyData.phone || "");
          setAddress(agencyData.address || "");
        }
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

  const handleAgencyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!session?.user?.id || !session?.user?.agency_id) {
        throw new Error("No user or agency found");
      }

      // Update agency information
      const { error: agencyError } = await supabase
        .from("agencies")
        .update({
          name: name,
          phone: phone || null,
          address: address || null,
        })
        .eq("id", session.user.agency_id);

      if (agencyError) throw agencyError;

      // Update the user's name in the users table
      const { error: userError } = await supabase
        .from("users")
        .update({ full_name: name })
        .eq("id", session.user.id);

      if (userError) throw userError;

      // Update the session with the new name
      await updateSession({
        ...session,
        user: {
          ...session.user,
          name: name,
        },
      });

      successToast("Agency information updated successfully");
    } catch (error) {
      errorToast("Failed to update agency information");
      console.error("Error updating agency information:", error);
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
        {session.user.role === "agency" ? (
          // Agency Profile Form
          <Card className="p-6 !shadow-none rounded-xl">
            <h2 className="text-xl font-semibold mb-4">
              Update Agency Information
            </h2>
            <form onSubmit={handleAgencyUpdate} className="space-y-4">
              <div>
                <label htmlFor="name">Agency Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 form-input"
                  placeholder="Enter agency name"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 form-input"
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div>
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 form-input"
                  placeholder="Enter agency address"
                  required
                  rows={3}
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
                  label="Update Agency Information"
                  size="large"
                  type="submit"
                  className="w-full h-[50px] mt-4"
                  disabled={isLoading}
                />
              )}
            </form>
          </Card>
        ) : (
          // User/Admin Name Update Form
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
        )}
      </div>
    </div>
  );
}
