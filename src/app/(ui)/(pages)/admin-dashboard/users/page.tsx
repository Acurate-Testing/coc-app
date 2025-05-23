"use client";

import ConfirmationModal from "@/app/(ui)/components/Common/ConfirmationModal";
import LoadingSpinner from "@/app/(ui)/components/Common/LoadingSpinner";
import AssignTestModal from "@/app/(ui)/components/Users/AssignTestModal";
import EditUserAccessPopover from "@/app/(ui)/components/Users/EditUserAccessPopover";
import { Button } from "@/stories/Button/Button";
import { useEffect, useState, useRef } from "react";
import { FaTrash } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";
import { FiMoreVertical } from "react-icons/fi";
import { createPortal } from "react-dom";

// Use the correct User type
type User = {
  id: string;
  name: string;
  contact_email: string;
  accounts?: string[];
  assigned_tests?: AssignedTest[];
};

interface AssignedTest {
  id: string;
  name: string;
  test_code: string;
  matrix_type: string[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditAccessModal, setShowEditAccessModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] = useState<boolean>(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenActionMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }
      setUsers(data || []);

      if (selectedUser) {
        const updatedSelectedUser = data.find((user: User) => user.id === selectedUser.id);
        if (updatedSelectedUser) {
          setSelectedUser(updatedSelectedUser);
        }
      } else if (data && data.length > 0) {
        setSelectedUser(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const filteredUsers = users.filter((u) =>
    (u.name ?? "")
      .toLowerCase()
      .includes(search.toLowerCase()) ||
    (u.contact_email ?? "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleDeleteClick = (testId: string) => {
    setSelectedTest(testId);
    setOpenConfirmDeleteDialog(true);
  };

  const handleDeleteTest = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/admin/users`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser?.id,
          testId: selectedTest
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove test access");
      }

      fetchUsers();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to remove test access");
    } finally {
      setIsLoading(false);
      setOpenConfirmDeleteDialog(false);
      setSelectedTest("");
    }
  };

  const toggleActionMenu = (
    testId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const button = event.currentTarget;
    menuButtonRefs.current.set(testId, button);

    if (openActionMenu === testId) {
      setOpenActionMenu(null);
      return;
    }

    const rect = button.getBoundingClientRect();
    const isNearRightEdge = window.innerWidth - rect.right < 200;
    const isNearBottomEdge = window.innerHeight - rect.bottom < 150;

    const position = {
      top: isNearBottomEdge ? rect.top - 150 : rect.bottom + 5,
      left: isNearRightEdge ? rect.left - 150 : rect.left,
    };

    setMenuPosition(position);
    setOpenActionMenu(testId);
  };

  if (isInitialLoading) {
    return <LoadingSpinner />;
  }
  if (error) {
    return (
      <div className="min-h-screen w-full">
        <div className="max-w-md mx-auto p-4">
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row h-full min-h-[80vh]">
      {/* Sidebar */}
      <div className="w-full sm:w-72 bg-white border-r border-gray-100 p-2 sm:p-4 flex-shrink-0">
        <input
          className="w-full mb-4 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-col gap-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="flex items-center gap-2">
                <ImSpinner8 className="animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Loading users...</span>
              </div>
            </div>
          )}
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedUser?.id === user.id
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                {(user.name ?? "")[0] || "?"}
              </div>
              <div>
                <div className="font-medium text-sm">{user.name}</div>
                <div className="text-xs text-gray-400">{user.contact_email}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* Main Panel */}
      <div className="flex-1 p-2 sm:p-8 bg-gray-50 overflow-auto">
        {selectedUser && (
          <div className="w-full mx-auto">
            {/* User Info */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold">
                  {(selectedUser.name ?? "")[0] || "?"}
                </div>
                <div>
                  <div className="font-semibold text-lg">
                    {selectedUser.name}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {selectedUser.contact_email}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(
                      selectedUser.accounts || []
                    ).map((acc) => (
                      <span
                        key={acc}
                        className="bg-gray-200 text-gray-600 rounded-full px-3 py-1 text-xs font-medium"
                      >
                        {acc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                variant="outline-primary"
                label="Edit User Access"
                onClick={() => setShowEditAccessModal(true)}
              >
                Edit User Access
              </Button>
            </div>
            {/* Test Permissions */}
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-base">Test Permissions</div>
                <Button
                  label="+ Assign Test"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition"
                  onClick={() => setShowAssignModal(true)}
                >
                  + Assign Test
                </Button>
              </div>
              
              {/* Table view for tests, similar to tests page */}
              <div className="w-full">
                {(selectedUser.assigned_tests || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-base font-medium">
                    No tests assigned.
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <div className="rounded-xl overflow-hidden shadow">
                      <div className="w-full overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Test Name
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Test Code
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Matrix Type
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedUser.assigned_tests?.map((test) => (
                              <tr key={test.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">{test.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-gray-500">{test.test_code || "-"}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-gray-500">
                                    {test.matrix_type || "-"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <div>
                                    <button
                                      ref={(el: any) => el && menuButtonRefs.current.set(test.id, el)}
                                      onClick={(e) => toggleActionMenu(test.id, e)}
                                      className="inline-flex items-center justify-center p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                                    >
                                      <FiMoreVertical className="h-5 w-5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <AssignTestModal
              open={showAssignModal}
              close={() => setShowAssignModal(false)}
              userId={selectedUser.id}
              assignedTestIds={
                selectedUser.assigned_tests?.map((t) => t.id) || []
              }
              onAssigned={fetchUsers}
            />
            <EditUserAccessPopover
              open={showEditAccessModal}
              close={() => setShowEditAccessModal(false)}
              userId={selectedUser.id}
              existingAccounts={selectedUser.accounts || []}
              onUpdated={fetchUsers}
            />
            <ConfirmationModal
              open={openConfirmDeleteDialog}
              processing={isLoading}
              onConfirm={handleDeleteTest}
              setOpenModal={() => {
                setSelectedTest("");
                setOpenConfirmDeleteDialog(false);
              }}
              message="Are you sure you want to remove this test access?"
              buttonText="Remove"
            />
          </div>
        )}
      </div>
      
      {/* Dropdown menu portal */}
      {isMounted &&
        openActionMenu &&
        createPortal(
          <div
            className="fixed z-50"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
            ref={menuRef}
          >
            <div className="mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => {
                    handleDeleteClick(openActionMenu);
                    setOpenActionMenu(null);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 hover:text-red-700 w-full text-left"
                  role="menuitem"
                >
                  <FaTrash className="mr-3 h-5 w-5" />
                  Remove Access
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
