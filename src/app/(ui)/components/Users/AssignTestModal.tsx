"use client";
import { FC, useEffect, useState, useCallback } from "react";
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
  assignedTestTypeIdsByGroup?: Record<string, string[]>; // make optional
  onAssigned: () => void;
}

type TestGroup = Database["public"]["Tables"]["test_groups"]["Row"];

const AssignTestModal: FC<AssignTestModalProps> = ({
  open,
  close,
  userId,
  assignedTestGroupIds,
  assignedTestTypeIdsByGroup = {}, // default to empty object
  onAssigned,
}) => {
  const [testGroups, setTestGroups] = useState<TestGroup[]>([]);
  const [selected, setSelected] = useState<{ label: string; value: string }[]>([]);
  const [testTypes, setTestTypes] = useState<{ label: string; value: string; groupId: string }[]>([]);
  const [selectedTestTypes, setSelectedTestTypes] = useState<{ label: string; value: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [preselectedTestTypeIds, setPreselectedTestTypeIds] = useState<string[]>([]);

  // Fetch assigned test type ids for user when modal opens
  useEffect(() => {
    if (!open || !userId) return;
    const fetchAssignedTestTypes = async () => {
      try {
        const res = await fetch(`/api/admin/users/assigned-test-types?userId=${userId}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.testTypes)) {
          setPreselectedTestTypeIds(data.testTypes.map((tt: any) => tt.id));
        } else {
          setPreselectedTestTypeIds([]);
        }
      } catch {
        setPreselectedTestTypeIds([]);
      }
    };
    fetchAssignedTestTypes();
  }, [open, userId]);

  // Fetch test groups and preselect assigned ones
  useEffect(() => {
    if (!open) return;
    setIsLoadingGroups(true);
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
      setIsLoadingGroups(false);
    };
    fetchTestGroups();
  }, [open, assignedTestGroupIds]);

  // Use test_types from selected test groups and preselect assigned test types
  useEffect(() => {
    if (!open || selected.length === 0) {
      setTestTypes([]);
      setSelectedTestTypes([]);
      return;
    }
    setIsLoadingTypes(true);
    const selectedGroupIds = selected.map(s => s.value);
    const selectedGroups = testGroups.filter(tg => selectedGroupIds.includes(tg.id));
    const allTestTypes: any[] = [];
    selectedGroups.forEach(group => {
      if (Array.isArray(group.test_types)) {
        group.test_types.forEach((tt: any) => {
          if (!allTestTypes.some(existing => existing.id === tt.id)) {
            allTestTypes.push(tt);
          }
        });
      }
    });
    const testTypeOptions = allTestTypes.map((tt: any) => ({
      label: tt.name,
      value: tt.id,
      groupId: "",
    }));
    setTestTypes(testTypeOptions);

    // Preselect assigned test types for selected groups using assignedTestTypeIdsByGroup
    const assignedIds = selectedGroupIds.flatMap(gid => assignedTestTypeIdsByGroup[gid] || []);
    setSelectedTestTypes(
      testTypeOptions.filter(opt => assignedIds.includes(opt.value))
    );
    setIsLoadingTypes(false);
  }, [selected, testGroups, open, assignedTestTypeIdsByGroup]);

  const handleAssign = async () => {
    setIsSaving(true);
    try {
      // Build a mapping of groupId -> assigned test type IDs for each selected group
      const selectedGroupIds = selected.map((s) => s.value);
      const testTypeIdsByGroup: Record<string, string[]> = {};
      selectedGroupIds.forEach((groupId) => {
        // Only include test types that belong to this group
        const group = testGroups.find((tg) => tg.id === groupId);
        const groupTestTypes = group?.test_types ?? [];
        if (group) {
          testTypeIdsByGroup[groupId] = selectedTestTypes
            .filter((tt) => groupTestTypes.some((gtt: any) => gtt.id === tt.value))
            .map((tt) => tt.value);
        } else {
          testTypeIdsByGroup[groupId] = [];
        }
      });

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          testGroupIds: selectedGroupIds,
          testTypeIdsByGroup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign test groups");
      successToast("Test groups and test types assigned successfully");
      onAssigned();
      close();
    } catch (err: any) {
      errorToast(err.message || "Failed to assign test groups/types");
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
        {isLoadingGroups ? (
          <div className="flex items-center py-2 text-gray-500">
            <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-2 border-gray-400 border-t-blue-500 rounded-full inline-block"></span>
            Loading test groups...
          </div>
        ) : (
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
        )}
      </div>
      {selected.length > 0 && !isLoadingGroups && (
        <div className="mb-4">
          <label>Select Test Type(s)</label>
          {isLoadingTypes ? (
            <div className="flex items-center py-2 text-gray-500">
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-2 border-gray-400 border-t-blue-500 rounded-full inline-block"></span>
              Loading test types...
            </div>
          ) : (
            <MultiSelect
              className="z-2 w-full mt-1"
              options={testTypes}
              value={selectedTestTypes}
              onChange={setSelectedTestTypes}
              labelledBy="Select Test Type(s)"
              overrideStrings={{
                selectSomeItems: "Select Test Type(s)",
                search: "Search Test Type(s)",
              }}
            />
          )}
        </div>
      )}
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
              disabled={selected.length === 0 || selectedTestTypes.length === 0}
            />
          </>
        )}
      </div>
    </Modal>
  );
};

export default AssignTestModal;
