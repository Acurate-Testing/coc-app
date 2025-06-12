"use client";

import { FC, useEffect, useState } from "react";
import { Modal } from "@/stories/Modal/Modal";
import LoadingSpinner from "@/app/(ui)/components/Common/LoadingSpinner";
import { errorToast } from "@/hooks/useCustomToast";

interface TestType {
  id: string;
  name: string;
  test_code: string | null;
  matrix_types: string[];
  description: string | null;
}

interface TestGroup {
  id: string;
  name: string;
  description: string | null;
  test_type_ids: string[];
  created_at: string;
  updated_at: string | null;
  test_types?: TestType[];
}

interface ViewTestGroupModalProps {
  open: boolean;
  close: () => void;
  groupId: string | null;
}

const ViewTestGroupModal: FC<ViewTestGroupModalProps> = ({
  open,
  close,
  groupId,
}) => {
  const [group, setGroup] = useState<TestGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGroupDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/test-groups/${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch test group details");
      }
      
      setGroup(data.group);
    } catch (error) {
      console.error("Error fetching test group details:", error);
      errorToast(error instanceof Error ? error.message : "Failed to fetch test group details");
      close();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && groupId) {
      fetchGroupDetails(groupId);
    } else {
      setGroup(null);
    }
  }, [open, groupId]);

  return (
    <Modal
      title="Test Group Details"
      open={open}
      close={close}
      staticModal
      panelClassName="lg:!max-w-[65%] sm:!max-w-[65%] !max-w-[100%]  max-h-[80vh] overflow-y-auto"
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : group ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Group Name
              </label>
              <p className="text-base text-gray-900">{group.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Created At
              </label>
              <p className="text-base text-gray-900">
                {new Date(group.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Description
            </label>
            <p className="text-base text-gray-900">
              {group.description || "No description provided"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Test Types ({group.test_types?.length || 0})
            </label>
            {group.test_types && group.test_types.length > 0 ? (
              <div className="space-y-3">
                {group.test_types.map((testType) => (
                  <div
                    key={testType.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{testType.name}</h4>
                      {testType.test_code && (
                        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                          {testType.test_code}
                        </span>
                      )}
                    </div>
                    
                    {testType.description && (
                      <p className="text-sm text-gray-600 mb-2">{testType.description}</p>
                    )}
                    
                    {testType.matrix_types && testType.matrix_types.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {testType.matrix_types.map((matrixType, index) => (
                          <span
                            key={index}
                            className="inline-block text-xs bg-[#DBEAFE] text-themeColor px-2 py-1 rounded"
                          >
                            {matrixType}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No test types assigned to this group</p>
            )}
          </div>

        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">No group data available</p>
      )}
    </Modal>
  );
};

export default ViewTestGroupModal;
