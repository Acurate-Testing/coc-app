"use client";
import { MatrixType } from "@/constants/enums";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { Modal } from "@/stories/Modal/Modal";
import { Database } from "@/types/supabase";
import { FC, useEffect, useRef, useState } from "react";

type Test = Database["public"]["Tables"]["test_types"]["Row"];

interface AddEditTestModalProps {
  open: boolean;
  close: () => void;
  onSaved: () => void;
  test?: Test | null;
}

const AddEditTestModal: FC<AddEditTestModalProps> = ({
  open,
  close,
  onSaved,
  test,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ 
    name: "", 
    description: "",
    test_code: "",
    matrix_type: MatrixType.PotableWater
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        name: test?.name || "",
        description: test?.description || "",
        test_code: test?.test_code || "",
        matrix_type: test?.matrix_type || MatrixType.PotableWater,
      });
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, test]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    
    if (!form.test_code.trim()) {
      setError("Test code is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/tests", {
        method: test ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: test?.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save test");
      }
      successToast(`Test ${test ? "updated" : "created"} successfully`);
      onSaved();
      close();
    } catch (err) {
      console.error(err);
      errorToast(err instanceof Error ? err.message : "Failed to save test");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={test ? "Edit Test" : "Add Test"}
      open={open}
      close={close}
      staticModal
      panelClassName="lg:!max-w-[65%] sm:!max-w-[65%] !max-w-[100%]"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-600 rounded">{error}</div>
        )}
        <div className="mb-4">
          <label className="pl-0.5">Test Name</label>
          <input
            ref={inputRef}
            type="text"
            className="form-input mt-1"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              setError(null);
            }}
            required
          />
        </div>
        <div className="mb-4">
          <label className="pl-0.5">Test Code</label>
          <input
            type="text"
            className="form-input mt-1"
            value={form.test_code}
            onChange={(e) => {
              setForm({ ...form, test_code: e.target.value });
              setError(null);
            }}
            required
          />
        </div>
        <div className="mb-4">
          <label className="pl-0.5">Description</label>
          <textarea
            rows={4}
            className="form-input h-auto resize-none mt-1"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="mb-4">
          <label className="pl-0.5 block mb-2">Matrix Type</label>
          <div className=" grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4">
            {Object.values(MatrixType).map((type) => (
              <div 
                key={type}
                className={`flex items-center px-4 py-2 rounded-md border cursor-pointer ${
                  form.matrix_type === type 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300'
                }`}
                onClick={() => setForm({ ...form, matrix_type: type })}
              >
                <div className={`w-4 h-4 rounded-full mr-2 ${
                  form.matrix_type === type ? 'bg-blue-500' : 'bg-gray-200'
                }`}></div>
                <span>{type}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          {isSaving ? (
            <LoadingButton
              className="!min-w-fit"
              label={test ? "Updating..." : "Adding..."}
            />
          ) : (
            <>
              <Button
                variant="white"
                label="Cancel"
                className="!min-w-fit"
                type="button"
                onClick={close}
              />
              <Button
                className="!min-w-fit"
                label={test ? "Update" : "Add"}
                type="submit"
              />
            </>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default AddEditTestModal;
