"use client";
import { FC, useEffect, useState } from "react";
import { Modal } from "@/stories/Modal/Modal";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { successToast, errorToast } from "@/hooks/useCustomToast";
import { MultiSelect } from "react-multi-select-component";
import { Database } from "@/types/supabase";

interface AssignTestModalProps {
  open: boolean;
  close: () => void;
  userId: string;
  assignedTestGroupIds: string[];
  onAssigned: () => void;
}

type TestGroup = Database["public"]["Tables"]["test_groups"]["Row"];

const AssignTestModal: FC<AssignTestModalProps> = ({
  open,
  close,
  userId,
  assignedTestGroupIds,
  onAssigned,
}) => {
  const [testGroups, setTestGroups] = useState<TestGroup[]>([]);
  const [selected, setSelected] = useState<{ label: string; value: string }[]>(
    []
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchTestGroups = async () => {
      const res = await fetch("/api/test-groups");
      const data = await res.json();
      if (res.ok) {
        const list = data.groups || [];
        setTestGroups(list);
        setSelected(
          list
            .filter((tg: TestGroup) => assignedTestGroupIds?.includes(tg.id) || false)
            .map((tg: TestGroup) => ({ label: tg.name, value: tg.id }))
        );
      } else {
        errorToast(data.error || "Failed to load test groups");
      }
    };
    fetchTestGroups();
  }, [open, assignedTestGroupIds]);

  const handleAssign = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, testGroupIds: selected.map((s) => s.value) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign test groups");
      successToast("Test groups assigned successfully");
      onAssigned();
      close();
    } catch (err: any) {
      errorToast(err.message || "Failed to assign test groups");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title="Assign Test Groups"
      open={open}
      close={close}
      staticModal
      panelClassName="!max-w-md"
    >
      <div className="mb-4">
        <label>Select Test Group(s)</label>
        <MultiSelect
          className="z-2 w-full mt-1"
          options={testGroups.map((tg) => ({ label: tg.name, value: tg.id }))}
          value={selected}
          onChange={setSelected}
          labelledBy="Select Test Group(s)"
          overrideStrings={{
            selectSomeItems: "Select Test Group(s)",
            search: "Search Test Group(s)",
          }}
        />
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
              label="Assign"
              className="!min-w-fit"
              onClick={handleAssign}
            />
          </>
        )}
      </div>
    </Modal>
  );
};

export default AssignTestModal;
