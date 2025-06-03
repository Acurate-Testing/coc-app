"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/stories/Button/Button";
import { Card } from "@/stories/Card/Card";
import { Label } from "@/stories/Label/Label";
import { User } from "@/types/user";
import { Chip } from "@material-tailwind/react";
import moment from "moment";
import { GoClock } from "react-icons/go";
import { ImBin } from "react-icons/im";
import LoadingSpinner from "../../components/Common/LoadingSpinner";
import { LuPlus } from "react-icons/lu";
import { useSession } from "next-auth/react";
import { UserRole } from "@/constants/enums";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import { useMediaQuery } from "react-responsive";
import { IoMdRefresh } from "react-icons/io";

const Users = () => {
  const router = useRouter();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const { data: session } = useSession();
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchUserList = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      setUserList(data.users || []);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
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

  useEffect(() => {
    fetchUserList();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="md:p-8 p-6">
      <div className="relative bg-gray-50">
        {session?.user.role === UserRole.AGENCY && (
          <button
            onClick={() => router.push("/member/invite")}
            className="fixed bottom-8 right-8 bg-themeColor hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-colors duration-200"
          >
            <LuPlus size={30} />
          </button>
        )}
      </div>
      {userList.length > 0 ? (
        userList.map((user) => (
          <Card
            key={user.id}
            className="p-4 bg-white !shadow-none rounded-xl flex items-start justify-between gap-4 mb-4"
          >
            <div className="flex flex-col">
              <div className="flex gap-4">
                <Chip
                  className="bg-blue-100 text-themeColor capitalize py-1 px-2 rounded-full text-sm"
                  value={
                    user.role === UserRole.LABADMIN
                      ? "Lab Admin"
                      : user.role === UserRole.AGENCY
                      ? "Admin"
                      : "Member"
                  }
                />
              </div>
              <div className="flex mt-2 text-lg">
                <Label label={user.full_name} className="text-xl font-medium" />
              </div>
              <div>
                <Label
                  label={user.email}
                  className="text-lg text-gray-600 break-all"
                />
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <GoClock className="text-lg" />
                <span>
                  {moment(user.created_at).format("YYYY-MM-DD hh:mm A")}
                </span>
              </div>
            </div>

            {session?.user.id !== user.id && (
              <div className="flex flex-col gap-3">
                {session?.user.role === UserRole.AGENCY && !user.active && (
                  <Button
                    className="md:min-w-[100px]"
                    variant="white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResendInvite(user.id);
                    }}
                    disabled={isResending === user.id}
                    label={
                      isMobile
                        ? ""
                        : isResending === user.id
                        ? "Resending..."
                        : "Resend Invite"
                    }
                    icon={<IoMdRefresh className="text-lg" />}
                  />
                )}
                {session?.user.role === UserRole.AGENCY && (
                  <Button
                    className="md:min-w-[100px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUser(user.id);
                    }}
                    disabled={
                      isDeleting === user.id || session?.user.id === user.id
                    }
                    label={
                      isMobile
                        ? ""
                        : isDeleting === user.id
                        ? "Deleting..."
                        : "Delete"
                    }
                    variant="danger"
                    icon={<ImBin className="text-lg" />}
                  />
                )}
              </div>
            )}
          </Card>
        ))
      ) : (
        <Card className="p-4 bg-white !shadow-none rounded-xl">
          <div className="flex items-center justify-center h-64">
            <Label label="No users found" className="text-lg font-semibold" />
          </div>
        </Card>
      )}
    </div>
  );
};

export default Users;
