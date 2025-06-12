import { FC, useState, useEffect } from "react";
import { MultiSelect } from "react-multi-select-component";
import { successToast, errorToast } from "@/hooks/useCustomToast";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";

interface AddEditGroupModalProps {
  open: boolean;
  close: () => void;
  tests: { id: string; name: string }[];
  groupName: string;
  setGroupName: (name: string) => void;
  groupTests: { label: string; value: string }[];
  setGroupTests: (tests: { label: string; value: string }[]) => void;
  onGroupCreated?: () => void;
  group?: {
    id: string;
    name: string;
    description: string | null;
    test_type_ids: string[];
    test_types?: { id: string; name: string; test_code: string; matrix_types: string[]; description: string | null; }[];
  } | null;
  onSaved?: () => void;
  onRefresh?: () => void; // Add this to ensure data refetch
}

const AddEditGroupModal: FC<AddEditGroupModalProps> = ({
  open,
  close,
  tests,
  groupName,
  setGroupName,
  groupTests,
  setGroupTests,
  onGroupCreated,
  group,
  onSaved,
  onRefresh,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [initialized, setInitialized] = useState(false);

  const isEditing = !!group;

  // Initialize form with group data when editing - only once per group change
  useEffect(() => {
    if (group && open && !initialized) {
      setGroupName(group.name);
      setDescription(group.description || "");
      if (group.test_types) {
        setGroupTests(group.test_types.map(t => ({ label: t.name, value: t.id })));
      } else if (group.test_type_ids) {
        const selectedTests = tests.filter(t => group.test_type_ids.includes(t.id));
        setGroupTests(selectedTests.map(t => ({ label: t.name, value: t.id })));
      }
      setInitialized(true);
    } else if (open && !group && !initialized) {
      setGroupName("");
      setDescription("");
      setGroupTests([]);
      setInitialized(true);
    }
  }, [group, open, initialized]);

  // Reset initialization flag when modal closes or group changes
  useEffect(() => {
    if (!open) {
      setInitialized(false);
    }
  }, [open]);

  useEffect(() => {
    setInitialized(false);
  }, [group?.id]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      errorToast("Group name is required");
      return;
    }

    if (groupTests.length === 0) {
      errorToast("At least one test type must be selected");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const url = isEditing ? `/api/test-groups/${group.id}` : "/api/test-groups";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: description.trim() || null,
          test_type_ids: groupTests.map(test => test.value),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} test group`);
      }

      const data = await response.json();
      successToast(`Test group ${isEditing ? 'updated' : 'created'} successfully`);
      
      // Reset form after successful creation/update
      setGroupName("");
      setDescription("");
      setGroupTests([]);
      
      // Trigger data refetch
      if (onRefresh) {
        onRefresh();
      }
      
      // Notify parent component
      if (onSaved) {
        onSaved();
      } else if (onGroupCreated) {
        onGroupCreated();
      }
      
      close();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} test group:`, error);
      errorToast(error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} test group`);
      // Don't close modal or navigate on error - just show toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={close} />
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-10 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Test Group' : 'Add Test Group'}
          </h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={close}
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="form-input w-full"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              required
              placeholder="Enter group name"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="form-input w-full h-20 resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter group description (optional)"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Select Test Types <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              className="z-2 w-full mt-1"
              options={tests.map((t) => ({ label: t.name, value: t.id }))}
              value={groupTests}
              onChange={setGroupTests}
              labelledBy="Select Test Types"
              disabled={isSubmitting}
              overrideStrings={{
                selectSomeItems: "Select Test Types",
                search: "Search Test Types",
              }}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            {isSubmitting ? (
              <LoadingButton label={`${isEditing ? 'Updating' : 'Creating'}...`} className="!min-w-fit" />
            ) : (
              <>
                <Button
                  type="button"
                  variant="white"
                  label="Cancel"
                  onClick={close}
                  disabled={isSubmitting}
                  className="!min-w-fit"
                />
                <Button
                  type="submit"
                  label={isEditing ? 'Update Group' : 'Create Group'}
                  disabled={!groupName || groupTests.length === 0}
                  className="!min-w-fit"
                />
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditGroupModal;
