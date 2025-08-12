"use client";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { Modal } from "@/stories/Modal/Modal";
import { FC, useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

interface Account {
  id?: string;
  name: string;
  pws_id?: string;
}

interface EditUserAccessPopoverProps {
  open: boolean;
  close: () => void;
  userId: string;
  existingAccounts: Account[];
  onUpdated: () => void;
}

const EditUserAccessPopover: FC<EditUserAccessPopoverProps> = ({
  open,
  close,
  userId,
  existingAccounts = [],
  onUpdated,
}) => {
  const [accounts, setAccounts] = useState<Account[]>(existingAccounts);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountPwsId, setNewAccountPwsId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAccounts(existingAccounts);
    }
  }, [open, existingAccounts]);

  const handleAddAccount = () => {
    if (!newAccountName.trim()) return;
    
    // Check if the account already exists
    if (!accounts.some(acc => acc.name === newAccountName.trim())) {
      setAccounts([...accounts, { 
        name: newAccountName.trim(), 
        pws_id: newAccountPwsId.trim() || undefined 
      }]);
    }
    setNewAccountName("");
    setNewAccountPwsId("");
  };

  const handleRemoveAccount = (accountToRemove: string) => {
    setAccounts(accounts.filter((acc) => acc.name !== accountToRemove));
  };

  const handleUpdatePwsId = (accountName: string, pwsId: string) => {
    setAccounts(accounts.map(acc => 
      acc.name === accountName 
        ? { ...acc, pws_id: pwsId.trim() || undefined }
        : acc
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/accounts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          accounts: accounts
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
      title="Assign Account Id"
      open={open}
      close={close}
      staticModal
      panelClassName="!max-w-2xl"
    >
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Account
        </label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter account name"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            value={newAccountPwsId}
            onChange={(e) => setNewAccountPwsId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter PWS ID (optional)"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <Button
          label="Add Account"
          className="!min-w-fit"
          onClick={handleAddAccount}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Accounts
        </label>
        {accounts.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No accounts assigned</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {accounts.map((acc) => (
              <div 
                key={acc.name}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50"
              >
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-gray-500 block">Account Name</span>
                    <span className="text-sm font-medium">{acc.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">PWS ID</span>
                    <input
                      type="text"
                      value={acc.pws_id || ""}
                      onChange={(e) => handleUpdatePwsId(acc.name, e.target.value)}
                      placeholder="Enter PWS ID"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <Button
                  label=""
                  variant="icon"
                  className="text-red-500 hover:text-red-700 !h-fit ml-2"
                  onClick={() => handleRemoveAccount(acc.name)}
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
