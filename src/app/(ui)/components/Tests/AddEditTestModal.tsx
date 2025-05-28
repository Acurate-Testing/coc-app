"use client";
import { MatrixType } from "@/constants/enums";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { Modal } from "@/stories/Modal/Modal";
import { Database } from "@/types/supabase";
import { FC, useEffect, useRef, useState } from "react";
import { useFocusManagement } from "@/app/(ui)/hooks/useFocusManagement";

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
  const containerRef = useFocusManagement<HTMLFormElement>({
    trapFocus: true,
    restoreFocus: true,
    focusFirstOnMount: true,
    isActive: open
  });

  const [form, setForm] = useState({ 
    name: "", 
    description: "",
    test_code: "",
    matrix_types: [MatrixType.PotableWater] as MatrixType[]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        name: test?.name || "",
        description: test?.description || "",
        test_code: test?.test_code || "",
        matrix_types: (test?.matrix_types as MatrixType[]) || [MatrixType.PotableWater],
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
        ref={containerRef}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {error && (
          <div 
            className="mb-4 p-2 bg-red-50 text-red-600 rounded"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}
        <div className="mb-4">
          <label 
            htmlFor="test-name"
            className="pl-0.5"
          >
            Test Name
          </label>
          <input
            ref={inputRef}
            id="test-name"
            type="text"
            className="form-input mt-1"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              setError(null);
            }}
            required
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? "error-message" : undefined}
          />
        </div>
        <div className="mb-4">
          <label 
            htmlFor="test-code"
            className="pl-0.5"
          >
            Test Code
          </label>
          <input
            id="test-code"
            type="text"
            className="form-input mt-1"
            value={form.test_code}
            onChange={(e) => {
              setForm({ ...form, test_code: e.target.value });
              setError(null);
            }}
            required
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? "error-message" : undefined}
          />
        </div>
        <div className="mb-4">
          <label 
            htmlFor="test-description"
            className="pl-0.5"
          >
            Description
          </label>
          <textarea
            id="test-description"
            rows={4}
            className="form-input h-auto resize-none mt-1"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2">
          {isSaving ? (
            <LoadingButton
              className="!min-w-fit"
              label="Saving..."
              aria-busy="true"
            />
          ) : (
            <>
              <Button
                className="!min-w-fit"
                variant="white"
                size="large"
                label="Cancel"
                onClick={() => close()}
                disabled={isSaving}
                type="button"
              />
              <Button
                className="!min-w-fit"
                size="large"
                label="Save"
                disabled={isSaving}
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
