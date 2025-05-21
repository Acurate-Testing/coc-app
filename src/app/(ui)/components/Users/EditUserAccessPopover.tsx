"use client";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { Modal } from "@/stories/Modal/Modal";
import { FC, useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

interface EditUserAccessPopoverProps {
  open: boolean;
  close: () => void;
  userId: string;
  existingAccounts: string[];
  onUpdated: () => void;
}

const EditUserAccessPopover: FC<EditUserAccessPopoverProps> = ({
  open,
  close,
  userId,
  existingAccounts = [],
  onUpdated,
}) => {
  const [accounts, setAccounts] = useState<{ label: string; value: string }[]>(
    existingAccounts.map((acc) => ({ label: acc, value: acc }))
  );
  const [newAccount, setNewAccount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAccounts(existingAccounts.map((acc) => ({ label: acc, value: acc })));
    }
  }, [open, existingAccounts]);

  const handleAddAccount = () => {
    if (!newAccount.trim()) return;
    
    // Check if the account already exists
    if (!accounts.some(acc => acc.value === newAccount.trim())) {
      setAccounts([...accounts, { label: newAccount.trim(), value: newAccount.trim() }]);
    }
    setNewAccount("");
  };

  const handleRemoveAccount = (accountToRemove: string) => {
    setAccounts(accounts.filter((acc) => acc.value !== accountToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/accounts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          accounts: accounts.map(acc => acc.value) 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update user access");
      }
      
      successToast("User access updated successfully");
      onUpdated();
      close();
    } catch (error) {
      errorToast(error instanceof Error ? error.message : "Failed to update user access");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAccount();
    }
  };

  return (
    <Modal
      title="Edit User Access"
      open={open}
      close={close}
      staticModal
      panelClassName="!max-w-md"
    >
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Account Access
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newAccount}
            onChange={(e) => setNewAccount(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter account name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <Button
            label="Add"
            className="!min-w-fit"
            onClick={handleAddAccount}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Access
        </label>
        {accounts.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No accounts assigned</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {accounts.map((acc) => (
              <div 
                key={acc.value}
                className="flex items-center justify-between pl-3 border border-gray-200 rounded-md bg-gray-50"
              >
                <span className="text-sm">{acc.label}</span>
                <Button
                  label=""
                  variant="icon"
                  className="text-red-500 hover:text-red-700 !h-fit"
                  onClick={() => handleRemoveAccount(acc.value)}
                  icon={<FaTrash size={14} />}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        {isSaving ? (
          <LoadingButton label="Saving..." className="!min-w-fit" />
        ) : (
          <>
            <Button
              variant="white"
              label="Cancel"
              className="!min-w-fit"
              onClick={close}
            />
            <Button
              label="Save Changes"
              className="!min-w-fit"
              onClick={handleSave}
            />
          </>
        )}
      </div>
    </Modal>
  );
};

export default EditUserAccessPopover;
