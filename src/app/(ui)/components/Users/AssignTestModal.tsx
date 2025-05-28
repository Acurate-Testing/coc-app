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
  assignedTestIds: string[];
  onAssigned: () => void;
}

type Test = Database["public"]["Tables"]["test_types"]["Row"];

const AssignTestModal: FC<AssignTestModalProps> = ({
  open,
  close,
  userId,
  assignedTestIds,
  onAssigned,
}) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [selected, setSelected] = useState<{ label: string; value: string }[]>(
    []
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchTests = async () => {
      const res = await fetch("/api/admin/tests");
      const data = await res.json();
      if (res.ok) {
        const list = data.tests || data;
        setTests(list);
        setSelected(
          list
            .filter((t: Test) => assignedTestIds.includes(t.id))
            .map((t: Test) => ({ label: t.name, value: t.id }))
        );
      } else {
        errorToast(data.error || "Failed to load tests");
      }
    };
    fetchTests();
  }, [open, assignedTestIds]);

  const handleAssign = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, testIds: selected.map((s) => s.value) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign test types");
      successToast("Tests assigned successfully");
      onAssigned();
      close();
    } catch (err: any) {
      errorToast(err.message || "Failed to assign test types");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title="Assign Test Type"
      open={open}
      close={close}
      staticModal
      panelClassName="!max-w-md"
    >
      <div className="mb-4">
        <label>Select Test Type(s)</label>
        <MultiSelect
          className="z-2 w-full mt-1"
          options={tests.map((t) => ({ label: t.name, value: t.id }))}
          value={selected}
          onChange={setSelected}
          labelledBy="Select Test Type(s)"
          overrideStrings={{
            selectSomeItems: "Select Test Type(s)",
            search: "Search Test Type(s)",
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
