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
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!session?.user?.id) return;

    // Fetch initial user data
    const fetchUserData = async () => {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("full_name, email, role, agency_id, active, deleted_at")
        .eq("id", session.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return;
      }

      // Check if account is deactivated (soft deleted or not active)
      if (userData?.deleted_at || userData?.active === false) {
        errorToast("Your account has deactivated.");
        router.push("/login");
        return;
      }

      if (userData?.full_name) {
        setName(userData.full_name);
      }

      // If user is an agency, fetch agency details
      if (userData?.role === "agency" && userData?.agency_id) {
        const { data: agencyData, error: agencyError } = await supabase
          .from("agencies")
          .select("name, contact_email, phone, street, city, state, zip")
          .eq("id", userData.agency_id)
          .single();

        if (agencyError) {
          console.error("Error fetching agency data:", agencyError);
          return;
        }

        if (agencyData) {
          setName(agencyData.name || userData.full_name);
          setPhone(agencyData.phone || "");
          setStreet(agencyData.street || "");
          setCity(agencyData.city || "");
          setState(agencyData.state || "");
          setZip(agencyData.zip || "");
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
          street: street || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
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

      successToast("Customer information updated successfully");
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
          // Customer Profile Form
          <Card className="p-6 !shadow-none rounded-xl">
            <h2 className="text-xl font-semibold mb-4">
              Update Customer Information
            </h2>
            <form onSubmit={handleAgencyUpdate} className="space-y-4">
              <div>
                <label htmlFor="name">Customer Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 form-input"
                  placeholder="Enter customer name"
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
                <label htmlFor="street">Street Address</label>
                <input
                  type="text"
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="mt-1 form-input"
                  placeholder="Enter street address"
                  required
                />
              </div>
              <div>
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 form-input"
                  placeholder="Enter city"
                  required
                />
              </div>
              <div>
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 form-input"
                  placeholder="Enter state"
                  required
                />
              </div>
              <div>
                <label htmlFor="zip">ZIP Code</label>
                <input
                  type="text"
                  id="zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="mt-1 form-input"
                  placeholder="Enter ZIP code"
                  required
                />
              </div>
              <Button
                label={
                  isLoading ? "Updating..." : "Update Customer Information"
                }
                size="large"
                type="submit"
                className="w-full h-[50px] mt-4"
                disabled={isLoading}
              />
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
              <Button
                label={isLoading ? "Updating..." : "Update Name"}
                size="large"
                type="submit"
                className="w-full h-[50px] mt-4"
                disabled={isLoading}
              />
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
