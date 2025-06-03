"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { User } from "@/types/user";
import moment from "moment";
import { Sample } from "@/types/sample";
import SignaturePad from "react-signature-canvas";
import { useMediaQuery } from "react-responsive";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import LoadingSpinner from "../../../../components/Common/LoadingSpinner";
import { BiCamera, BiCheck, BiPencil, BiX } from "react-icons/bi";

export default function TransferCOCPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [sampleData, setSampleData] = useState<Partial<Sample> | null>(null);
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sample data");
      }

      setSampleData(data.sample);

      // Check if sample has been transferred to Lab Admin
      const hasLabAdminTransfer = data.sample.coc_transfers?.some(
        (transfer: any) =>
          transfer.received_by === `${process.env.NEXT_PUBLIC_LAB_ADMIN_ID}`
      );

      if (hasLabAdminTransfer) {
        errorToast(
          "This sample has already been transferred to Lab Admin. No further transfers are allowed."
        );
        router.push(`/sample/${params.id}`);
      }
    } catch (error) {
      errorToast(
        error instanceof Error ? error.message : "Failed to fetch sample data"
      );
      router.push("/samples");
    }
  };

  const clearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      setSignatureData(null);
    }
  };

  const saveSignature = () => {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) return;

    try {
      const signatureDataUrl = sigPadRef.current.toDataURL("image/png");
      // Validate signature complexity
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = signatureDataUrl;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData?.data;

        // Check if signature has enough non-transparent pixels
        let nonTransparentPixels = 0;
        if (data) {
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) nonTransparentPixels++;
          }
        }

        if (nonTransparentPixels < 100) {
          errorToast("Please provide a more detailed signature");
          return;
        }

        setSignatureData(signatureDataUrl);
      };
    } catch (error) {
      errorToast("Failed to save signature");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      errorToast("Photo size must be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      errorToast("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result as string;

      img.onload = () => {
        // Compress image if needed
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setPhoto(compressedDataUrl);
      };

      img.onerror = () => {
        errorToast("Failed to load image");
      };
    };

    reader.onerror = () => {
      errorToast("Failed to read file");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      errorToast("Please select a user");
      return;
    }

    // Save signature before submitting if it hasn't been saved yet
    if (!signatureData && sigPadRef.current && !sigPadRef.current.isEmpty()) {
      saveSignature();
    }

    if (!signatureData) {
      errorToast("Please provide a signature");
      return;
    }

    try {
      setIsLoading(true);

      // Create form data for the COC transfer
      const formData = new FormData();
      if (photo) {
        formData.append("file", dataURLtoFile(photo, "handoff-photo.jpg"));
      }
      formData.append("received_by", selectedUser);
      formData.append("latitude", sampleData?.latitude?.toString() || "");
      formData.append("longitude", sampleData?.longitude?.toString() || "");
      formData.append("timestamp", timestamp.toISOString());
      formData.append("signature", signatureData);

      // Create the COC transfer
      const response = await fetch(`/api/samples/coc?sample_id=${params.id}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to transfer chain of custody");
      }

      successToast("Chain of custody transferred successfully");
      router.push(`/sample/${params.id}`);
    } catch (error) {
      errorToast(
        error instanceof Error
          ? error.message
          : "Failed to transfer chain of custody"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert data URL to File object
  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const fetchUsers = async () => {
    try {
      setIsFetchingUsers(true);
      const response = await fetch("/api/users?active=true");
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
          <div className="w-full grid grid-cols-1 gap-y-3">
            <div className="flex md:flex-row flex-col md:items-center justify-between">
              <div className="text-gray-500">Sample ID</div>
              <div className="font-semibold text-gray-900 pt-1">
                {params?.id}
              </div>
            </div>
            <div className="flex md:flex-row flex-col md:items-center justify-between">
              <div className="text-gray-500">Timestamp</div>
              <div className="text-gray-900">
                {!isEditing ? (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-800">
                      {moment(timestamp).format("YYYY-MM-DD hh:mm A")}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-themeColor hover:bg-gray-100 py-1.5 !px-0 border rounded-xl"
                    >
                      <BiPencil className="w-6 h-6 mx-auto" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="datetime-local"
                      value={moment(tempTimestamp).format("YYYY-MM-DDTHH:mm")}
                      onChange={(e) =>
                        setTempTimestamp(new Date(e.target.value))
                      }
                      className="form-input mt-1 !px-2 max-w-[220px]"
                    />
                    <button
                      onClick={handleConfirm}
                      className="text-green-600 hover:bg-gray-100 py-1.5 !px-0 border rounded-xl"
                      title="Save"
                    >
                      <BiCheck className="w-6 h-6 mx-auto" />
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-red-600 hover:bg-gray-100 py-1.5 !px-0 border rounded-xl"
                      title="Cancel"
                    >
                      <BiX className="w-6 h-6 mx-auto" />
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
            }}
            className="form-input bg-white w-full mt-1 mb-5"
            disabled={isFetchingUsers}
          >
            <option value="">Select User</option>
            <option value={process.env.NEXT_PUBLIC_LAB_ADMIN_ID}>
              LAB ADMIN
            </option>
            {users
              .filter((user) => user.id !== session?.user?.id)
              .map((user) => (
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
                  canvasProps={{
                    className: "w-full h-48",
                    width: 500,
                    height: 200,
                  }}
                />
              )}
              {!signatureData && (
                <BiPencil className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>
            <div className="flex items-center justify-between gap-4 mt-4">
              <Button
                label={isMobile ? "Clear" : "Clear Signature"}
                variant="outline-primary"
                size="large"
                disabled={!sigPadRef.current || sigPadRef.current.isEmpty()}
                onClick={clearSignature}
                className="w-full h-[50px]"
              />
              <Button
                label={isMobile ? "Save" : "Save Signature"}
                size="large"
                disabled={!sigPadRef.current || sigPadRef.current.isEmpty()}
                onClick={saveSignature}
                className="w-full h-[50px]"
              />
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
