"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/stories/Button/Button";
import { Card } from "@/stories/Card/Card";
import { Label } from "@/stories/Label/Label";
import { User } from "@/types/user";
import { Chip } from "@material-tailwind/react";
import moment from "moment";
import { FiEdit } from "react-icons/fi";
import { GoClock } from "react-icons/go";
import { ImBin } from "react-icons/im";
import LoadingSpinner from "../../components/LoadingSpinner";

const Users = () => {
  const router = useRouter();
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const handleDeleteClick = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    // Add your delete logic here
    console.log("Delete user", userId);
  };

  useEffect(() => {
    fetchUserList();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-8">
      {userList.length > 0 ? (
        userList.map((user) => (
          <Card
            key={user.id}
            onClick={() => router.push(`/users/${user.id}`)}
            className="p-4 bg-white !shadow-none rounded-xl flex items-start justify-between cursor-pointer mb-4"
          >
            <div>
              <div className="flex gap-4">
                <Label
                  label={`#${user.id}`}
                  className="text-lg font-semibold"
                />
                <Chip
                  className="bg-blue-100 text-blue-700 capitalize py-1 px-2 rounded-full text-sm"
                  value={user.role || "User"}
                />
              </div>
              <div className="mt-2 text-lg">{user.full_name}</div>
              <div className="text-gray-600">{user.email}</div>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <GoClock />
                <span>
                  {moment(user.created_at).format("YYYY-MM-DD hh:mm A")}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                className="min-w-[110px]"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/user/edit/${user.id}`);
                }}
                label="Edit"
                icon={<FiEdit className="text-lg" />}
              />
              <Button
                className="min-w-[110px]"
                onClick={(e) => handleDeleteClick(e, user.id)}
                label="Delete"
                variant="danger"
                icon={<ImBin className="text-lg" />}
              />
            </div>
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
