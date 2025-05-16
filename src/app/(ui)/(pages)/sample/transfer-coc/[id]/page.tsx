"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { User } from "@/types/user";
import { Sample } from "@/types/sample";
import SignaturePad from "react-signature-canvas";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import LoadingSpinner from "../../../../components/Common/LoadingSpinner";
import moment from "moment";
import { BiCamera, BiCheck, BiPencil, BiX } from "react-icons/bi";

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
  console.log("sampleData++++", sampleData);
  const [isEditing, setIsEditing] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date());
  const [tempTimestamp, setTempTimestamp] = useState(new Date());

  const sigPadRef = useRef<SignaturePad>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

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
      setSampleData(data.sample);
    } catch (error) {
      console.error("Error fetching sample:", error);
      errorToast("Failed to fetch sample data");
      router.push("/samples");
    }
  };

  const clearSignature = () => {
    sigPadRef.current?.clear();
    setSignatureData(null);
  };

  const saveSignature = () => {
    if (sigPadRef.current?.isEmpty()) return;
    setSignatureData(
      sigPadRef?.current
        ? sigPadRef?.current?.getTrimmedCanvas()?.toDataURL("image/png")
        : null
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
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

      const response = await fetch(`/api/samples/coc?sample_id=${params.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timestamp,
          received_by: selectedUser,
          latitude: sampleData?.latitude || null,
          longitude: sampleData?.longitude || null,
          signature: session?.user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to transfer chain of custody");
      }
      successToast("Chain of custody transferred successfully");
      router.push(`/sample/${params?.id}`);
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
                {!isEditing ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-800">
                      {moment(timestamp).format("YYYY-MM-DD hh:mm A")}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-themeColor hover:bg-gray-100 p-1.5 border rounded-lg"
                    >
                      <BiPencil className="w-6 h-6" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={moment(tempTimestamp).format("YYYY-MM-DDTHH:mm")}
                      onChange={(e) =>
                        setTempTimestamp(new Date(e.target.value))
                      }
                      className="border rounded-lg px-3 py-1 h-11 text-sm"
                    />
                    <button
                      onClick={handleConfirm}
                      className="text-green-600 hover:bg-gray-100 p-1.5 border rounded-lg"
                      title="Save"
                    >
                      <BiCheck className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-red-600 hover:bg-gray-100 p-1.5 border rounded-lg"
                      title="Cancel"
                    >
                      <BiX className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full min-h-[calc(100vh-218px)] mx-auto md:p-8 p-6">
        <div className="">
          <label className="block font-medium mb-2">Transfer To</label>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setError("");
            }}
            className="form-input bg-white w-full mt-1 mb-5"
            disabled={isFetchingUsers}
          >
            <option value="">Select User</option>
            <option value="59398b60-0d7c-43a7-b2c1-4f0c259c1199">
              LAB ADMIN
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} ({user.email})
              </option>
            ))}
          </select>
          <div className="border rounded-lg p-4 shadow-sm bg-white mb-5">
            <h3 className="font-semibold text-gray-900 mb-1">
              Signature Required
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Please sign to confirm sample handoff
            </p>

            <div className="border rounded-md overflow-hidden bg-gray-50 relative">
              {signatureData ? (
                <img
                  src={signatureData}
                  alt="Signature"
                  className="w-full h-48 object-contain"
                />
              ) : (
                <SignaturePad
                  ref={sigPadRef}
                  penColor="#000000"
                  clearOnResize
                  canvasProps={{ className: "w-full h-48" }}
                  onEnd={saveSignature}
                />
              )}
              {!signatureData && (
                <BiPencil className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>
            <div className="flex items-center justify-between gap-4 mt-4">
              <Button
                label="Clear Signature"
                variant="outline-primary"
                size="large"
                disabled={
                  sigPadRef?.current ? sigPadRef?.current.isEmpty() : false
                }
                onClick={clearSignature}
                className="w-full h-[50px]"
              />
              {sigPadRef.current ? (
                <Button
                  label="Upload Signature"
                  size="large"
                  disabled={sigPadRef.current.isEmpty()}
                  onClick={saveSignature}
                  className="w-full h-[50px]"
                />
              ) : (
                ""
              )}
            </div>
          </div>

          {/* Photo Section */}
          <div className="border rounded-lg p-4 shadow-sm bg-white">
            <h3 className="font-semibold text-gray-900 mb-1">
              Capture Handoff Photo
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Take a photo with the recipient
            </p>

            <div className="border rounded-md overflow-hidden bg-gray-100 h-48 flex items-center justify-center relative">
              {photo ? (
                <img
                  src={photo}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
              ) : (
                <BiCamera className="w-8 h-8 text-gray-400" />
              )}
            </div>

            <label htmlFor="photo-upload" className="block mt-3">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div className="cursor-pointer bg-blue-600 text-white py-3 w-full text-center rounded-lg flex justify-center items-center gap-2 font-semibold h-[50px]">
                <BiCamera className="w-6 h-6" />
                Take Photo
              </div>
            </label>
          </div>
        </div>
      </div>
      <div className="navigation-buttons !px-6">
        <div className="flex items-center justify-center gap-4">
          {isLoading ? (
            <LoadingButton
              label="Submitting"
              size="large"
              className="w-full h-[50px]"
            />
          ) : (
            <>
              <Button
                label="Cancel"
                size="large"
                variant="white"
                type="button"
                className="w-full h-[50px]"
                onClick={() => router.push(`/sample/${params.id}`)}
              />
              <Button
                label="Submit"
                size="large"
                type="button"
                className="w-full h-[50px]"
                onClick={handleSubmit}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
