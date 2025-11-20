"use client";

import ConfirmationModal from "@/app/(ui)/components/Common/ConfirmationModal";
import LoadingSpinner from "@/app/(ui)/components/Common/LoadingSpinner";
import AssignTestModal from "@/app/(ui)/components/Users/AssignTestModal";
import EditUserAccessPopover from "@/app/(ui)/components/Users/EditUserAccessPopover";
import InviteUserModal from "@/app/(ui)/components/Users/InviteUserModal";
import { Button } from "@/stories/Button/Button";
import { useEffect, useState, useRef } from "react";
import { FaTrash } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";
import { FiMoreVertical } from "react-icons/fi";
import { LuPlus } from "react-icons/lu";
import { createPortal } from "react-dom";
import { errorToast, successToast } from "@/hooks/useCustomToast";

// Use the correct User/Agency type
type User = {
  id: string;
  name: string;
  contact_email: string;
  type?: 'agency' | 'user';
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  deleted_at?: string;
  role?: string;
  agency_id?: string;
  active?: boolean;
  accounts?: Account[];
  agency_test_type_groups?: AgencyTestTypeGroup[];
  assigned_test_group?: AssignedTestGroup[];
};

interface Account {
  id?: string;
  name: string;
  pws_id?: string;
}

interface AgencyTestTypeGroup {
  test_groups: {
    id: string;
    name: string;
  };
}

interface AssignedTestGroup {
  id: string;
  name: string;
  assigned_test_type_ids?: string[];
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTestGroup, setSelectedTestGroup] = useState<string>(""); // Changed from selectedTest
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] = useState<boolean>(false);
  const [openConfirmDeleteUserDialog, setOpenConfirmDeleteUserDialog] = useState<boolean>(false);
  const [openConfirmReactivateUserDialog, setOpenConfirmReactivateUserDialog] = useState<boolean>(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Filter and pagination state
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'deleted'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10); // Reduced to make pagination more likely to appear

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
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch users";
      setError(errorMessage);
      errorToast(errorMessage);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters
  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.contact_email ?? "").toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = userFilter === 'all' || 
      (userFilter === 'active' && !u.deleted_at) ||
      (userFilter === 'deleted' && u.deleted_at);
    
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [userFilter, search]);

  const handleDeleteClick = (testGroupId: string) => {
    setSelectedTestGroup(testGroupId); // Changed from setSelectedTest
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
          testGroupId: selectedTestGroup, // Changed from testId
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove test access");
      }

      successToast("Test group access removed successfully");
      fetchUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove test access";
      setError(errorMessage);
      errorToast(errorMessage);
    } finally {
      setIsLoading(false);
      setOpenConfirmDeleteDialog(false);
      setSelectedTestGroup(""); // Changed from setSelectedTest
    }
  };

  // Updated function to handle user deletion
  const handleDeleteUser = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/admin/users/${selectedUser?.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }

      successToast(`${selectedUser?.type === 'agency' ? 'Account' : 'User'} deleted successfully`);
      fetchUsers(); // Refresh the list to show updated status
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
      setError(errorMessage);
      errorToast(errorMessage);
    } finally {
      setIsLoading(false);
      setOpenConfirmDeleteUserDialog(false);
    }
  };

  // Function to handle user reactivation
  const handleReactivateUser = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/admin/users`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reactivate",
          userId: selectedUser?.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reactivate user");
      }

      successToast(`${selectedUser?.type === 'agency' ? 'Account' : 'User'} reactivated successfully`);
      fetchUsers(); // Refresh the list to show updated status
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reactivate user";
      setError(errorMessage);
      errorToast(errorMessage);
    } finally {
      setIsLoading(false);
      setOpenConfirmReactivateUserDialog(false);
    }
  };

  const toggleActionMenu = (testId: string, event: React.MouseEvent<HTMLButtonElement>) => {
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
    <div className="flex flex-col sm:flex-row h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-full sm:w-80 bg-white border-r border-gray-200 p-4 flex-shrink-0 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 relative">
            <input
              className="w-full px-3 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="ml-3 p-2 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <LuPlus size={18} />
          </button>
        </div>
        
        {/* Filter Controls */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Filter</div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setUserFilter('active')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                userFilter === 'active'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setUserFilter('deleted')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                userFilter === 'deleted'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Deleted
            </button>
            <button
              onClick={() => setUserFilter('all')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                userFilter === 'all'
                  ? 'bg-white text-gray-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1 relative flex-1 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="flex items-center gap-2">
                <ImSpinner8 className="animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Loading users...</span>
              </div>
            </div>
          )}
                      <div className="flex-1 overflow-y-auto">
              {paginatedUsers.map((user) => (
                <button
                  key={user.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors w-full ${
                    selectedUser?.id === user.id
                      ? "bg-blue-50 text-blue-700"
                      : user.deleted_at
                      ? "hover:bg-red-50 text-red-700 opacity-75"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                user.deleted_at ? "bg-red-200 text-red-700" : "bg-gray-200"
              }`}>
                {(user.name ?? "")[0] || "?"}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm flex items-center gap-2">
                  {user.name}
                  {user.deleted_at && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                      Deleted
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">{user.contact_email}</div>
              </div>
            </button>
          ))}
            </div>
        </div>
        
        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 bg-white rounded-lg p-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}
                {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Main Panel */}
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">        
        {selectedUser ? (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* User Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {(selectedUser.name ?? "")[0] || "?"}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg flex items-center gap-2">
                    {selectedUser.name}
                    {selectedUser.deleted_at && (
                      <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        Deleted
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500 text-sm">{selectedUser.contact_email}</div>
                </div>
                <div className="flex gap-2">
                  {selectedUser.deleted_at ? (
                    <Button
                      variant="outline-primary"
                      label={`Reactivate ${selectedUser.type === 'agency' ? 'Account' : 'User'}`}
                      onClick={() => setOpenConfirmReactivateUserDialog(true)}
                    >
                      Reactivate {selectedUser.type === 'agency' ? 'Account' : 'User'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline-danger"
                      label={`Delete ${selectedUser.type === 'agency' ? 'Account' : 'User'}`}
                      onClick={() => setOpenConfirmDeleteUserDialog(true)}
                    >
                      Delete {selectedUser.type === 'agency' ? 'Account' : 'User'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Accounts Card */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-base">Account Access</h3>
                  <Button
                    variant="outline-primary"
                    label="Assign Account Id"
                    onClick={() => setShowEditAccessModal(true)}
                  >
                    Assign Account Id
                  </Button>
                </div>

                {(!selectedUser.accounts || selectedUser.accounts.length === 0) ? (
                  <div className="text-center py-8 text-gray-400 text-base font-medium">
                    No accounts assigned.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.accounts.map((acc) => (
                      <div
                        key={acc.id || acc.name}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{acc.name}</div>
                          {acc.pws_id && (
                            <div className="text-sm text-gray-500">PWS ID: {acc.pws_id}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* User Details */}
              <div className="grid grid-cols-1">
                {/* Contact Information */}
                <div className="">
                  <h3 className="text-md font-semibold text-black mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500 block">Email</span>
                      <span className="text-black">{selectedUser.contact_email}</span>
                    </div>
                    {selectedUser.phone && (
                      <div>
                        <span className="text-sm font-medium text-gray-500 block">Phone</span>
                        <span className="text-black">{selectedUser.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedUser.street || selectedUser.city || selectedUser.state || selectedUser.zip) && (
                  <div className="">
                    <h3 className="text-md font-semibold text-black my-3">Address</h3>
                    <div className="space-y-2">
                      {selectedUser.street && (
                        <div>
                          <span className="text-sm font-medium text-gray-500 block">Street</span>
                          <span className="text-black">{selectedUser.street}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {selectedUser.city && (
                          <div>
                            <span className="text-sm font-medium text-gray-500 block">City</span>
                            <span className="text-black">{selectedUser.city}</span>
                          </div>
                        )}
                        {selectedUser.state && (
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-500 block">State</span>
                            <span className="text-black">{selectedUser.state}</span>
                          </div>
                        )}
                        {selectedUser.zip && (
                          <div>
                            <span className="text-sm font-medium text-gray-500 block">ZIP</span>
                            <span className="text-black">{selectedUser.zip}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>



            {/* Test Permissions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-base">Test Permissions</div>
                <Button
                  label="+ Assign Test Type Group"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition"
                  onClick={() => setShowAssignModal(true)}
                >
                  + Assign Test Type Group
                </Button>
              </div>

              {/* Table view for tests, similar to tests page */}
              <div className="w-full">
                {(selectedUser.assigned_test_group || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-base font-medium">
                    No test groups assigned.
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <div className="rounded-xl overflow-hidden shadow">
                      <div className="w-full overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Test Group Name
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Test Group ID
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedUser.assigned_test_group?.map((testGroup) => (
                              <tr key={testGroup.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium text-gray-900 truncate max-w-xs" title={testGroup.name}>{testGroup.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-gray-500 truncate max-w-xs" title={testGroup.id}>{testGroup.id}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <div>
                                    <button
                                      ref={(el: any) =>
                                        el && menuButtonRefs.current.set(testGroup.id, el)
                                      }
                                      onClick={(e) => toggleActionMenu(testGroup.id, e)}
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
              assignedTestGroupIds={selectedUser.assigned_test_group?.map((t) => t.id) || []}
              assignedTestTypeIdsByGroup={
                selectedUser.assigned_test_group?.reduce((acc, group) => {
                  acc[group.id] = group.assigned_test_type_ids || [];
                  return acc;
                }, {} as Record<string, string[]>)
                || {}
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
                setSelectedTestGroup(""); // Changed from setSelectedTest
                setOpenConfirmDeleteDialog(false);
              }}
              message="Are you sure you want to remove this test access?"
              buttonText="Remove"
            />
            {/* Add confirmation modal for deletion */}
            <ConfirmationModal
              open={openConfirmDeleteUserDialog}
              processing={isLoading}
              onConfirm={handleDeleteUser}
              setOpenModal={() => setOpenConfirmDeleteUserDialog(false)}
              message={`Are you sure you want to delete this ${selectedUser?.type === 'agency' ? 'account' : 'user'}? This action cannot be undone.`}
              buttonText={`Delete ${selectedUser?.type === 'agency' ? 'Account' : 'User'}`}
            />
            {/* Add confirmation modal for reactivation */}
            <ConfirmationModal
              open={openConfirmReactivateUserDialog}
              processing={isLoading}
              onConfirm={handleReactivateUser}
              setOpenModal={() => setOpenConfirmReactivateUserDialog(false)}
              message={`Are you sure you want to reactivate this ${selectedUser?.type === 'agency' ? 'account' : 'user'}? ${selectedUser?.type === 'agency' ? 'The account and all associated users will be able to log in again.' : 'The user will be able to log in again.'}`}
              buttonText={`Reactivate ${selectedUser?.type === 'agency' ? 'Account' : 'User'}`}
            />
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
              <div className="text-gray-500 text-lg mb-2">Select an account to view details</div>
              <div className="text-gray-400 text-sm">
                Choose an account from the list to see their information and manage their permissions
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
              <div className="text-gray-500 text-lg mb-2">No accounts found</div>
              <div className="text-gray-400 text-sm">
                No accounts match your current filter criteria
              </div>
            </div>
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
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Invite Modal */}
      <InviteUserModal
        open={showInviteModal}
        close={() => {
          setShowInviteModal(false);
          fetchUsers(); // Refresh the list after inviting
        }}
      />
    </div>
  );
}
