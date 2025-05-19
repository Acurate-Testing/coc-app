"use client";

import { useEffect, useState } from "react";
import { Database } from "@/types/supabase";
import { Button } from "@/stories/Button/Button";
import { Card } from "@/stories/Card/Card";
import ConfirmationModal from "@/app/(ui)/components/Common/ConfirmationModal";
import LoadingSpinner from "@/app/(ui)/components/Common/LoadingSpinner";
import AssignTestModal from "@/app/(ui)/components/Users/AssignTestModal";

// Use the correct User type
type User = Database["public"]["Tables"]["users"]["Row"] & {
  accounts?: string[];
  assigned_tests?: AssignedTest[];
};

interface AssignedTest {
  id: string;
  name: string;
  code: string;
  matrix_types: string[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] =
    useState<boolean>(false);

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
      if (!selectedUser && data && data.length > 0) setSelectedUser(data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);
  const filteredUsers = users.filter((u) =>
    (u.full_name ?? "")
      .toLowerCase()
      .includes(search.toLowerCase()) ||
    (u.email ?? "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleDeleteClick = (testId: string) => {
    setSelectedTest(testId);
    setOpenConfirmDeleteDialog(true);
  };

  const handleDeleteTest = async () => {
    // Implement API call to unassign/delete test from user
    setOpenConfirmDeleteDialog(false);
    setSelectedTest("");
    // Optionally refetch users or update state
  };

  if (isLoading) {
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
        <div className="flex flex-col gap-1">
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
                {(user.full_name ?? "")[0] || "?"}
              </div>
              <div>
                <div className="font-medium text-sm">{user.full_name}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* Main Panel */}
      <div className="flex-1 p-2 sm:p-8 bg-gray-50">
        {selectedUser && (
          <div className="max-w-3xl mx-auto">
            {/* User Info */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold">
                  {(selectedUser.full_name ?? "")[0] || "?"}
                </div>
                <div>
                  <div className="font-semibold text-lg">
                    {selectedUser.full_name}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {selectedUser.email}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(
                      selectedUser.accounts || [
                        "Lab Corp",
                        "City Water",
                        "EnviroTech",
                      ]
                    ).map((acc) => (
                      <span
                        key={acc}
                        className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-xs font-medium"
                      >
                        {acc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                label="Edit User Access"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition"
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
              {/* Card view for mobile */}
              <div className="block sm:hidden">
                {(selectedUser.assigned_tests || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-base font-medium">
                    No tests assigned.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {selectedUser.assigned_tests?.map((test) => (
                      <div
                        key={test.id}
                        className="rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2 bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-medium">
                            Test Name
                          </span>
                          <span className="text-base font-semibold text-gray-700">
                            {test.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-medium">
                            Code
                          </span>
                          <span className="text-base text-gray-700 font-medium">
                            {test.code}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-medium">
                            Matrix Types
                          </span>
                          <span className="flex gap-2 flex-wrap">
                            {test?.matrix_types?.map((mt) => (
                              <span
                                key={mt}
                                className="bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-medium"
                              >
                                {mt}
                              </span>
                            ))}
                          </span>
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                          <Button
                            label=""
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <span className="sr-only">Edit</span>✏️
                          </Button>
                          <Button
                            label=""
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteClick(test.id)}
                          >
                            <span className="sr-only">Delete</span>🗑️
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Table view for desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Test Name
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Code
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Matrix Types
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedUser.assigned_tests || []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-8 text-gray-400 text-base font-medium"
                        >
                          No tests assigned.
                        </td>
                      </tr>
                    ) : (
                      selectedUser.assigned_tests?.map((test) => (
                        <tr
                          key={test.id}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">{test.name}</td>
                          <td className="px-6 py-4">{test.code}</td>
                          <td className="px-6 py-4">
                            <span className="flex gap-2 flex-wrap">
                              {test?.matrix_types?.map((mt) => (
                                <span
                                  key={mt}
                                  className="bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-medium"
                                >
                                  {mt}
                                </span>
                              ))}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                label=""
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <span className="sr-only">Edit</span>✏️
                              </Button>
                              <Button
                                label=""
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteClick(test.id)}
                              >
                                <span className="sr-only">Delete</span>🗑️
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
            <ConfirmationModal
              open={openConfirmDeleteDialog}
              processing={isLoading}
              onConfirm={handleDeleteTest}
              setOpenModal={() => {
                setSelectedTest("");
                setOpenConfirmDeleteDialog(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
