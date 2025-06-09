"use client";
import React, { FC, useEffect, useRef, useState } from "react";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { Modal } from "@/stories/Modal/Modal";
import { errorToast, successToast } from "@/hooks/useCustomToast";

interface InviteUserModalProps {
  open: boolean;
  close: VoidFunction;
}

const InviteUserModal: FC<InviteUserModalProps> = ({ open, close }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInviting, setIsInviting] = useState<boolean>(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSendInvitation = async () => {
    if (!inviteForm.name || !inviteForm.email) {
      errorToast("Name and email are required");
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
          email: inviteForm.email,
          name: inviteForm.name,
          role: "agency", // Default role for invited users
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      successToast("Invitation sent successfully!");
      setInviteForm({ name: "", email: "" }); // Reset form
      close();
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
    <Modal
      title="Invite Customer User"
      open={open}
      close={close}
      staticModal={true}
      panelClassName="!max-w-[35rem]"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendInvitation();
        }}
      >
        <div className="mb-4">
          <label className="text-colorBlack font-medium mb-1 pl-0.5">
            Name
          </label>
          <input
            ref={inputRef}
            type="text"
            name="name"
            id="name"
            value={inviteForm.name}
            onChange={(e) => {
              setInviteForm({ ...inviteForm, name: e.target.value });
            }}
            className="form-input"
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
            value={inviteForm.email}
            onChange={(e) => {
              setInviteForm({ ...inviteForm, email: e.target.value });
            }}
            className="form-input"
            required
          />
        </div>
        <div className="flex justify-end space-x-4 pt-4">
          {isInviting ? (
            <LoadingButton
              className="!min-w-fit"
              label="Sending Invitation..."
            />
          ) : (
            <>
              <Button
                className="!min-w-fit"
                variant="white"
                size="large"
                label="Cancel"
                onClick={() => close()}
                disabled={isInviting}
                type="button"
              />
              <Button
                className="!min-w-fit"
                size="large"
                label="Send Invitation"
                disabled={isInviting}
                type="submit"
              />
            </>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default InviteUserModal;
