"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import LoadingSpinner from "../../components/Common/LoadingSpinner";
import { useSession } from "next-auth/react";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import { useMediaQuery } from "react-responsive";
import { format } from "date-fns";
import { IoSearch } from "react-icons/io5";
import { IoMailOutline, IoTrashOutline, IoRefreshOutline } from "react-icons/io5";
import { LuPlus } from "react-icons/lu";

const Users = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isReactivating, setIsReactivating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(0);

  const fetchUserList = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/users?includeDeleted=true");
      const data = await res.json();
      setUserList(data.users || []);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setUserList([]);
      setIsLoading(false);
    }
  };

  const handleResendInvite = async (userId: string) => {
    try {
      setIsResending(userId);
      const response = await fetch(
        `/api/users/resend-invite?user_id=${userId}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to resend invitation");
      }

      successToast("Invitation resent successfully");
      fetchUserList(); // Refresh the list
    } catch (error) {
      console.error("Error resending invitation:", error);
      errorToast(
        error instanceof Error ? error.message : "Failed to resend invitation"
      );
    } finally {
      setIsResending(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      setIsDeleting(userId);
      const response = await fetch(`/api/users?user_id=${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      successToast("User deleted successfully");
      fetchUserList(); // Refresh the list
    } catch (error) {
      errorToast(
        error instanceof Error ? error.message : "Failed to delete user"
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to reactivate this user?")) {
      return;
    }

    try {
      setIsReactivating(userId);
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reactivate",
          userId: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reactivate user");
      }

      successToast("User reactivated successfully");
      fetchUserList(); // Refresh the list
    } catch (error) {
      errorToast(
        error instanceof Error ? error.message : "Failed to reactivate user"
      );
    } finally {
      setIsReactivating(null);
    }
  };

  useEffect(() => {
    fetchUserList();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const filteredUsers = userList.filter((user) =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full md:p-8 p-4 md:!pt-0">
      <div className="relative bg-gray-50">
        {session?.user.role === "agency" && (
          <button
            onClick={() => router.push("/member/invite")}
            className="fixed z-[50] bottom-24 right-8 bg-themeColor hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-colors duration-200 w-16 h-16 flex items-center justify-center"
            aria-label="Invite new member"
          >
            <LuPlus size={30} />
          </button>
        )}
      </div>
      <div className="flex gap-4 items-center">
        <div className="w-full pb-6 pt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <IoSearch className="text-themeColor pointer-events-none h-6 w-6 absolute top-1/2 transform -translate-y-1/2 left-4 z-[1]" />
            <input
              id="user-search"
              className={`font-medium rounded-lg py-3 px-4 bg-white text-base appearance-none block !pl-14 form-input h-[60px]`}
              value={searchQuery}
              type="search"
              placeholder="Search users"
              onChange={(e) => {
                const { value } = e.target;
                setCurrentPage(0);
                setSearchQuery(value);
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className={`bg-white rounded-lg shadow-sm p-6 border ${
              user.deleted_at ? "border-red-200 bg-red-50" : "border-gray-100"
            }`}
          >
            <div className="flex items-start justify-between mb-4 flex-col">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {user.full_name}
                </h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 w-full">
                {user.role === "user" && !user.active && (
                  <button
                    onClick={() => handleResendInvite(user.id)}
                    disabled={isResending === user.id}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center bg-blue-50"
                    aria-label="Resend invitation"
                    title="Resend invitation"
                  >
                    {isResending === user.id ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <IoMailOutline size={20} />
                    )}
                  </button>
                )}
                {user.deleted_at && (
                  <button
                    onClick={() => handleReactivateUser(user.id)}
                    disabled={isReactivating === user.id}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center justify-center bg-green-50"
                    aria-label="Reactivate user"
                    title="Reactivate"
                  >
                    {isReactivating === user.id ? (
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <IoRefreshOutline size={20} />
                    )}
                  </button>
                )}
                {session?.user.role === "agency" &&
                  session?.user.id !== user.id && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isDeleting === user.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center bg-red-50"
                      aria-label="Delete user"
                      title="Delete"
                    >
                      {isDeleting === user.id ? (
                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <IoTrashOutline size={20} />
                      )}
                    </button>
                  )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Role:</span>
                <span className="font-medium text-gray-900">
                  {user.role
                    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    : "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Status:</span>
                <span
                  className={`font-medium ${
                    user.deleted_at 
                      ? "text-red-600" 
                      : user.active 
                        ? "text-green-600" 
                        : "text-yellow-600"
                  }`}
                >
                  {user.deleted_at ? "Deleted" : user.active ? "Active" : "Pending"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Created:</span>
                <span className="font-medium text-gray-900">
                  {user.created_at &&
                    format(new Date(user.created_at), "yyyy-MM-dd hh:mm a")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;
