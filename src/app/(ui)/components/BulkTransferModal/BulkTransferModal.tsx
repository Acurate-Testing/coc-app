"use client";

import React, { useRef, useState } from "react";
import { User } from "@/types/user";
import { format } from "date-fns";
import SignaturePad from "react-signature-canvas";
import { BiCamera, BiCheck, BiPencil, BiX } from "react-icons/bi";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { errorToast } from "@/hooks/useCustomToast";
import { IoIosArrowBack } from "react-icons/io";

interface BulkTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: string;
  users: User[];
  selectedSamples: string[];
  onTransfer: (signatureData: string, photo: string | null, timestamp: Date) => Promise<void>;
  isSubmitting: boolean;
}

const BulkTransferModal: React.FC<BulkTransferModalProps> = ({
  isOpen,
  onClose,
  selectedUser,
  users,
  selectedSamples,
  onTransfer,
  isSubmitting,
}) => {
  const [timestamp, setTimestamp] = useState(new Date());
  const [tempTimestamp, setTempTimestamp] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  
  const sigPadRef = useRef<SignaturePad>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(true);

  const handleConfirm = () => {
    setTimestamp(tempTimestamp);
    setIsEditing(false);
  };

  const clearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
    setSignatureData(null);
    setIsDrawingSignature(true);
  };

  const clearPhoto = () => {
    setPhoto(null);
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
        setIsDrawingSignature(false);
      };
    } catch (error) {
      errorToast("Failed to save signature");
    }
  };

  // Auto-save signature when user stops drawing
  const handleSignatureEnd = () => {
    // Add a small delay to ensure the signature is complete
    setTimeout(() => {
      if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
        saveSignature();
      }
    }, 100);
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

  const handleSubmit = async () => {
    // Save signature before submitting if it hasn't been saved yet
    if (!signatureData && sigPadRef.current && !sigPadRef.current.isEmpty()) {
      saveSignature();
      // Wait a moment for the signature to be saved
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!signatureData) {
      errorToast("Please provide a signature");
      return;
    }

    await onTransfer(signatureData, photo, timestamp);
  };

  if (!isOpen) return null;

  const selectedUserName = users.find(user => user.id === selectedUser)?.full_name || 
    (selectedUser === process.env.NEXT_PUBLIC_LAB_ADMIN_ID ? "LAB ADMIN" : "Selected User");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl h-screen sm:max-h-[90vh] overflow-auto">
        <button className="border-b border-gray-300 w-full p-2 text-start flex gap-3 items-center" onClick={onClose}><IoIosArrowBack className="w-5 h-5"/> Back</button>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Complete Bulk Transfer</h2>
          <p className="text-gray-600 mt-1">
            Transferring {selectedSamples.length} samples to {selectedUserName}
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Timestamp */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Transfer Timestamp</h3>
            <div className="text-gray-900">
              {!isEditing ? (
                <div className="flex items-center gap-3">
                  <span className="text-gray-800">
                    {format(timestamp, "yyyy-MM-dd hh:mm a")}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-themeColor hover:bg-gray-100 py-1.5 !px-3 border rounded-xl"
                  >
                    <BiPencil className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="datetime-local"
                    value={format(tempTimestamp, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setTempTimestamp(new Date(e.target.value))}
                    className="form-input mt-1 !px-2 max-w-[220px]"
                  />
                  <button
                    onClick={handleConfirm}
                    className="text-green-600 hover:bg-gray-100 py-1.5 !px-3 border rounded-xl"
                    title="Save"
                  >
                    <BiCheck className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-red-600 hover:bg-gray-100 py-1.5 !px-3 border rounded-xl"
                    title="Cancel"
                  >
                    <BiX className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Signature Section */}
          <div className="border rounded-lg p-4 shadow-sm bg-white mb-5">
            <h3 className="font-semibold text-gray-900 mb-1">
              Signature Required
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Please sign to confirm sample handoff
            </p>

            <div className="border rounded-md overflow-hidden bg-gray-50 relative">
              {signatureData && !isDrawingSignature ? (
                <div className="relative">
                  <img
                    src={signatureData}
                    alt="Signature"
                    className="w-full h-48 object-contain"
                  />
                </div>
              ) : (
                <div className="relative">
                  <SignaturePad
                    ref={sigPadRef}
                    penColor="#000000"
                    clearOnResize
                    onEnd={handleSignatureEnd}
                    canvasProps={{
                      className: "w-full h-48",
                      width: 500,
                      height: 200,
                    }}
                  />
                  <BiPencil className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>
            <div className="mt-4">
              <Button
                label="Clear Signature"
                variant="outline-primary"
                size="large"
                disabled={!signatureData && (!sigPadRef.current || sigPadRef.current.isEmpty())}
                onClick={clearSignature}
                className="w-full h-[50px]"
              />
            </div>
          </div>

          {/* Photo Section */}
          <div className="border rounded-lg p-4 shadow-sm bg-white">
            <h3 className="font-semibold text-gray-900 mb-1">
              Capture Handoff Photo (Optional)
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Take a photo with the recipient
            </p>

            <div className="border rounded-md overflow-hidden bg-gray-100 h-48 flex items-center justify-center relative">
              {photo ? (
                <div className="relative w-full h-full">
                  <img
                    src={photo}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <BiCamera className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="mt-4">
              <Button
                label="Clear Photo"
                variant="outline-primary"
                size="large"
                disabled={!photo}
                onClick={clearPhoto}
                className="w-full h-[50px]"
              />
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
        
        {/* Submit buttons */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-end gap-4">
            {isSubmitting ? (
              <LoadingButton
                label="Submitting..."
                size="large"
                className="w-[200px] h-[50px]"
              />
            ) : (
              <>
                <Button
                  label="Cancel"
                  variant="outline-primary"
                  size="large"
                  onClick={onClose}
                  className="w-[120px] h-[50px]"
                />
                <Button
                  label="Complete Transfer"
                  size="large"
                  onClick={handleSubmit}
                  className="w-[200px] h-[50px]"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkTransferModal;
