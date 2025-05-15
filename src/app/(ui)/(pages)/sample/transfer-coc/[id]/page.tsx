"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { User } from "@/types/user";
import { Sample } from "@/types/sample";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import LoadingSpinner from "../../../../components/Common/LoadingSpinner";
import moment from "moment";
import { BiCheck, BiPencil, BiX } from "react-icons/bi";

export default function TransferCOCPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [error, setError] = useState("");
  const [sampleData, setSampleData] = useState<Partial<Sample> | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date());
  const [tempTimestamp, setTempTimestamp] = useState(new Date());

  const handleConfirm = () => {
    setTimestamp(tempTimestamp);
    setIsEditing(false);
  };

  const fetchSampleData = async () => {
    try {
      const response = await fetch(`/api/samples/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sample data");
      }
      const data = await response.json();
      setSampleData(data);
    } catch (error) {
      console.error("Error fetching sample:", error);
      errorToast("Failed to fetch sample data");
      router.push("/samples");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      setError("Please select a user");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        `/api/samples/coc?sample_id=${sampleData?.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            received_by: selectedUser,
            latitude: sampleData?.latitude || null,
            longitude: sampleData?.longitude || null,
            signature: session?.user.id,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to transfer chain of custody");
      }

      successToast("Chain of custody transferred successfully");
      router.push(`/sample/${params.id}`);
    } catch (error) {
      console.error("Transfer error:", error);
      errorToast(
        error instanceof Error
          ? error.message
          : "Failed to transfer chain of custody"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsFetchingUsers(true);
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      errorToast("Failed to fetch users");
    } finally {
      setIsFetchingUsers(false);
    }
  };

  useEffect(() => {
    fetchSampleData();
    fetchUsers();
  }, []);

  if (!sampleData) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="bg-white md:px-8 px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="w-full grid grid-cols-1 gap-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Sample ID</div>
              <div className="font-semibold text-gray-900">{params?.id}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Timestamp</div>
              <div className="text-gray-900">
                {/* {moment(new Date().toISOString()).format("YYYY-MM-DD hh:mm A")} */}
                {!isEditing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800">
                      {moment(timestamp).format("YYYY-MM-DD hh:mm A")}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <BiPencil className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={moment(tempTimestamp).format("YYYY-MM-DD hh:mm A")}
                      onChange={(e) =>
                        setTempTimestamp(new Date(e.target.value))
                      }
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <button
                      onClick={handleConfirm}
                      className="text-green-600 hover:text-green-800"
                      title="Save"
                    >
                      <BiCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-gray-400 hover:text-red-500"
                      title="Cancel"
                    >
                      <BiX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full min-h-[calc(100vh-218px)] mx-auto md:p-8 p-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-semibold mb-6">
            Transfer Chain of Custody
          </h1>
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Sample Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <span className="font-medium">Sample ID:</span> {sampleData.id}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Sample Type:</span>{" "}
                {sampleData.sample_type || "N/A"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Location:</span>{" "}
                {sampleData.sample_location || "N/A"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Status:</span>{" "}
                {sampleData.status || "N/A"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Transfer To
              </label>
              <select
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  setError("");
                }}
                className="form-input bg-white w-full"
                disabled={isFetchingUsers}
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>
              {error && (
                <span className="flex items-center font-medium tracking-wide text-dangerRed text-xs mt-1">
                  {error}
                </span>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              {isLoading ? (
                <LoadingButton className="!min-w-fit" label="Transferring..." />
              ) : (
                <>
                  <Button
                    className="!min-w-fit"
                    variant="white"
                    label="Cancel"
                    onClick={() => router.push(`/sample/${params.id}`)}
                    disabled={isLoading}
                  />
                  <Button
                    className="!min-w-fit"
                    label="Transfer"
                    type="submit"
                    disabled={isLoading || isFetchingUsers}
                  />
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
