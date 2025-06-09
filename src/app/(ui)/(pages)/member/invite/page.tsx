"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/hooks/useCustomToast";

const InviteMember = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isInviting, setIsInviting] = useState<boolean>(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleSendInvitation = async () => {
    if (!inviteForm.name || !inviteForm.email) {
      errorToast("Name and email are required");
      return;
    }

    if (!session) {
      errorToast("You must be logged in to send invitations");
      return;
    }

    setIsInviting(true);

    try {
      const response = await fetch(`/api/users/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agency_id: session?.user?.agency_id,
          email: inviteForm.email,
          name: inviteForm.name,
          role: session?.user?.role === "labadmin" ? "agency" : "user",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "You are not authorized to send invitations. Please log in again."
          );
        } else if (response.status === 403) {
          throw new Error(
            "You don't have permission to send invitations. Only lab admins and agency users can send invitations."
          );
        }
        throw new Error(data.error || "Failed to send invitation");
      }

      router.push("/members");
    } catch (error) {
      console.error("Error sending invitation:", error);
      errorToast(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <>
      <div className="w-full min-h-[calc(100vh-154px)] mx-auto md:p-8 p-6">
        <form>
          <div className="mb-4">
            <label className="text-colorBlack font-medium mb-1 pl-0.5">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter name"
              value={inviteForm.name}
              onChange={(e) => {
                setInviteForm({ ...inviteForm, name: e.target.value });
              }}
              className="form-input mt-1"
              autoFocus
              required
            />
          </div>
          <div className="mb-4">
            <label className="text-colorBlack font-medium mb-1 pl-0.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Enter email"
              value={inviteForm.email}
              onChange={(e) => {
                setInviteForm({ ...inviteForm, email: e.target.value });
              }}
              className="form-input mt-1"
              required
            />
          </div>
        </form>
      </div>
      <div className="navigation-buttons">
        <div className="flex justify-center items-center gap-4 px-6">
          {isInviting ? (
            <LoadingButton
              className="w-full h-[50px]"
              size="large"
              label="Sending Invitation..."
            />
          ) : (
            <>
              <Button
                className="w-full h-[50px] hover:bg-gray-100"
                variant="white"
                size="large"
                label="Cancel"
                onClick={() => router.push("/members")}
                disabled={isInviting}
                type="button"
              />
              <Button
                className="w-full h-[50px]"
                size="large"
                label="Send Invitation"
                disabled={isInviting}
                type="submit"
                onClick={handleSendInvitation}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default InviteMember;
