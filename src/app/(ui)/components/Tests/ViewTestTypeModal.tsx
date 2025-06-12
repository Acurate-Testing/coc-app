"use client";

import { FC } from "react";
import { Modal } from "@/stories/Modal/Modal";

interface TestType {
  id: string;
  name: string;
  description: string | null;
  test_code: string | null;
  matrix_types: string[];
  created_at: string;
}

interface ViewTestTypeModalProps {
  open: boolean;
  close: () => void;
  testType: TestType | null;
}

const ViewTestTypeModal: FC<ViewTestTypeModalProps> = ({
  open,
  close,
  testType,
}) => {
  return (
    <Modal
      title="Test Type Details"
      open={open}
      close={close}
      staticModal
      panelClassName="lg:!max-w-[50%] sm:!max-w-[65%] !max-w-[100%] max-h-[80vh] overflow-y-auto"
    >
      {testType ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Test Name
              </label>
              <p className="text-base text-gray-900">{testType.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Test Code
              </label>
              <p className="text-base text-gray-900">
                {testType.test_code || "No test code"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Description
            </label>
            <p className="text-base text-gray-900">
              {testType.description || "No description provided"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Matrix Types
            </label>
            {testType.matrix_types && testType.matrix_types.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {testType.matrix_types.map((matrixType, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                  >
                    {matrixType}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No matrix types specified</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Created At
              </label>
              <p className="text-sm text-gray-900">
                {new Date(testType.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Test Type ID
            </label>
            <p className="text-sm text-gray-500 font-mono">{testType.id}</p>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">
          No test type data available
        </p>
      )}
    </Modal>
  );
};

export default ViewTestTypeModal;
