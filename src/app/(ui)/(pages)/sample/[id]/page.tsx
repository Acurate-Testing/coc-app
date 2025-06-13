"use client";
import ConfirmationModal from "@/app/(ui)/components/Common/ConfirmationModal";
import LoadingSpinner from "@/app/(ui)/components/Common/LoadingSpinner";
import Modal from "@/app/(ui)/components/Common/Modal";
import TextArea from "@/app/(ui)/components/Form/TextArea";
import { MatrixType, SampleStatus, UserRole } from "@/constants/enums";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import { Button } from "@/stories/Button/Button";
import { Sample } from "@/types/sample";
import { User } from "@/types/user";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { FaAngleLeft, FaFingerprint, FaSignature } from "react-icons/fa";
import { ImBin } from "react-icons/im";
import {
  IoChatbubble,
  IoFlask,
  IoInformationCircleOutline,
  IoPrintOutline,
} from "react-icons/io5";
import { LuWaves, LuSignature } from "react-icons/lu";
import { MdOutlineUpdate } from "react-icons/md";
import { PiRobotFill } from "react-icons/pi";
import { BiCamera, BiImage } from "react-icons/bi";
import { supabase } from "@/lib/supabase";

const LAB_ADMIN_ID = process.env.NEXT_PUBLIC_LAB_ADMIN_ID;

const COCTransferItem = ({
  transfer,
  onImageSelect,
}: {
  transfer: any;
  onImageSelect: (type: "signature" | "photo", url: string) => void;
}) => {
  const [signature, setSignature] = useState<string | null>(null);
  const isLabAdminTransfer = transfer.received_by_user?.id === LAB_ADMIN_ID;

  useEffect(() => {
    const decryptSignature = async () => {
      if (transfer.signature) {
        try {
          const signatureData = transfer.signature.startsWith("base64-")
            ? transfer.signature.substring(7)
            : transfer.signature;

          // Use API endpoint for decryption
          const res = await fetch("/api/encryption/decrypt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: signatureData }),
          });
          if (!res.ok) throw new Error("Failed to decrypt signature");
          const { decrypted } = await res.json();
          setSignature(decrypted);
        } catch (error) {
          console.error("Error decrypting signature:", error);
        }
      }
    };
    decryptSignature();
  }, [transfer.signature]);

  return (
    <div className="relative mb-6 last:mb-0">
      {/* Header */}
      <div className="flex justify-between items-start mb-1">
        <div className="text-xs text-gray-500 font-medium leading-tight pt-1">
          {format(new Date(transfer.timestamp), "MMM d, yyyy h:mm a")}
          {/* Transfer text */}
          <h3
            className={`text-base font-semibold m-0 transfer-text ${
              isLabAdminTransfer ? "text-green-800" : "text-blue-900"
            }`}
          >
            {isLabAdminTransfer ? (
              "Transferred to Lab"
            ) : (
              <>
                <span className="font-bold">Transferred to:</span>{" "}
                <span className="ml-1">
                  {transfer.received_by_user?.full_name}
                </span>
              </>
            )}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {transfer.photo_url && (
            <button
              type="button"
              title="View Photo"
              onClick={() => onImageSelect("photo", transfer.photo_url)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100 text-green-600 hover:scale-105 transition-transform"
            >
              <BiImage className="w-5 h-5" />
            </button>
          )}
          {signature && (
            <button
              type="button"
              title="View Signature"
              onClick={() => onImageSelect("signature", signature)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100 text-green-600 hover:scale-105 transition-transform"
            >
              <LuSignature className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function InspectionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const sampleId = params?.id as string;
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<Sample>>({});
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] =
    useState<boolean>(false);
  const [openStatusUpdateModal, setOpenStatusUpdateModal] =
    useState<boolean>(false);
  const [statusNotes, setStatusNotes] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<"pass" | "fail" | null>(
    null
  );
  const [selectedImage, setSelectedImage] = useState<{
    type: "signature" | "photo";
    url: string;
  } | null>(null);
  const [temperature, setTemperature] = useState<number | undefined>(undefined);

  const isLabAdmin = session?.user?.role === UserRole.LABADMIN;

  const fetchUserList = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUserList(data.users || []);
    } catch (error) {
      setUserList([]);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchSampleData = async () => {
    if (sampleId) {
      setIsLoading(true);
      try {
        fetchUserList();

        const response = await fetch(`/api/samples/${sampleId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch sample data");
        }

        if (data.sample) {
          setFormData(data.sample);
          handleGetLocation(
            Number(data.sample.latitude?.toFixed(2) || 0),
            Number(data.sample.longitude?.toFixed(2) || 0)
          );
        }
      } catch (error) {
        errorToast(
          error instanceof Error ? error.message : "Failed to load sample data"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteClick = () => {
    setOpenConfirmDeleteDialog(true);
  };

  const handleDeleteSample = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/samples?id=${params?.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete sample");
      }

      setOpenConfirmDeleteDialog(false);
      successToast("Sample deleted successfully");
      router.push("/samples");
    } catch (error) {
      errorToast(
        error instanceof Error ? error.message : "Failed to delete sample"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLocation = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();

      if (data && data.display_name) {
        setFormData((prev) => ({
          ...prev,
          address: data.display_name, // Add this to your formData state
        }));
      }
    } catch (error) {
      console.error("Failed to get address:", error);
    }
  };

  useEffect(() => {
    fetchSampleData();
  }, [sampleId]);

  const handleCOCModalOpen = () => {
    router.push(`/sample/transfer-coc/${sampleId}`);
  };

  const handleUpdateStatus = () => {
    // Pre-select the status based on current sample status
    if (formData.status === SampleStatus.Pass) {
      setSelectedStatus("pass");
    } else if (formData.status === SampleStatus.Fail) {
      setSelectedStatus("fail");
    } else {
      setSelectedStatus(null);
    }

    setStatusNotes(formData.pass_fail_notes || "");
    setOpenStatusUpdateModal(true);
  };

  const handleSaveStatus = async () => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("samples")
        .update({
          status:
            selectedStatus === "pass" ? SampleStatus.Pass : SampleStatus.Fail,
          pass_fail_notes: statusNotes,
          temperature: temperature,
        })
        .eq("id", sampleId);

      if (error) throw error;

      setOpenStatusUpdateModal(false);
      setSelectedStatus(null);
      setStatusNotes("");
      setTemperature(undefined);
      fetchSampleData();
      successToast("Sample status updated successfully");
    } catch (error) {
      errorToast("Failed to update sample status");
      console.error("Error updating sample status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelStatusUpdate = () => {
    setOpenStatusUpdateModal(false);
    setStatusNotes("");
    setSelectedStatus(null);
  };

  const getReportData = () => {
    const cocTransfers = formData?.coc_transfers || [];
    const lastIsLabAdmin =
      cocTransfers.length > 0 && cocTransfers[0].received_by === LAB_ADMIN_ID;

    // Format test selection with one line per selection
    const formatTestSelection = () => {
      if (!formData?.test_types?.length) {
        return "No tests selected";
      }
      
      const lines = [];
      if (formData.test_group?.name) {
        lines.push(`Group: ${formData.test_group.name}`);
      }
      
      formData.test_types.forEach(test => {
        lines.push(`${test.name}`);
      });
      
      return lines.join("\n");
    };

    // Format Chain of Custody transfers
    const formatCocTransfers = () => {
      if (cocTransfers.length === 0) {
        return "No transfers recorded";
      }
      
      return cocTransfers.map((transfer: any, index: number) => {
        const isLabAdminTransfer = transfer.received_by_user?.id === LAB_ADMIN_ID;
        const timestamp = transfer.timestamp ? format(new Date(transfer.timestamp), "MMM d, yyyy h:mm a") : "No timestamp";
        const receivedBy = isLabAdminTransfer ? "Lab Admin" : transfer.received_by_user?.full_name || "Unknown";
        
        return `${index + 1}. ${timestamp} - Transferred to: ${receivedBy}`;
      }).join("\n");
    };

    return {
      basicInfo: [
        { label: "Sample ID", value: formData.id },
        { label: "Project ID", value: formData.project_id || "" },
        { label: "PWS ID", value: formData.pws_id || "" },
        { label: "Account Name", value: formData.account?.name || "" },
        { label: "Address", value: formData.address || "" },
        { label: "Created By", value: formData.created_by_user?.full_name || "(Sampler)" },
        { label: "County", value: formData.county || "" },
        { label: "Sample Privacy", value: formData.sample_privacy || "" },
        { label: "Compliance", value: formData.compliance || "" },
        { label: "Matrix Type", value: `${formData.matrix_type}${formData.matrix_type === MatrixType.Other ? ` (${formData.matrix_name})` : ""}` || "" },
        { label: "Sample Location", value: formData.sample_location || "" },
        { label: "GPS Location", value: formData.latitude && formData.longitude ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}` : "" },
        { label: "Source", value: formData.source || "" },
        { label: "Sample Type", value: formData.sample_type || "" },
        { label: "Chlorine Residual", value: formData.chlorine_residual || "" },
        { label: "Sample Date", value: formData?.sample_collected_at ? format(new Date(formData.sample_collected_at), "yyyy-MM-dd hh:mm a") : "" },
        { label: "Test Selection", value: formatTestSelection(), isMultiline: true },
        { label: "Remarks", value: formData?.notes || "" },
        { label: "Chain of Custody", value: formatCocTransfers(), isMultiline: true },
      ],
      cocTransfers,
      lastIsLabAdmin,
      showDeleteButton: !isLabAdmin && !lastIsLabAdmin && 
        formData.status !== SampleStatus.Submitted && 
        formData.status !== SampleStatus.Pass
    };
  };

  const handlePrint = () => {
    const reportData = getReportData();
    
    // Create print content with table format
    const printContent = `
      <div class="print-container">
      <h1 class="print-title">Accurate Testing Labs</h1>
      <h1 class="print-title2">Sample Report</h1>
        <table class="print-table">
          <tbody>
            ${reportData.basicInfo.map(field => `
              <tr>
                <td class="print-label">${field.label}</td>
                <td class="print-value">${field.isMultiline ? `<span class="multiline-text">${field.value || ''}</span>` : (field.value || '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Create print window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Report - ${formData.id}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                padding: 20px;
              }
              
              .print-container {
                max-width: 800px;
                margin: 0 auto;
              }
              
              .print-title {
                font-size: 24px;
                font-weight: bold;
                margin: 10px 0;
              }

              .print-title2 {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 20px;
                border-bottom: 1px solid #333;
                padding-bottom: 10px;
              }
              
              .print-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                border: 1px solid #ccc;
              }
              
              .print-table tr {
                border-bottom: 1px solid #e5e5e5;
              }
              
              .print-table tr:last-child {
                border-bottom: none;
              }
              
              .print-label {
                padding: 8px 12px;
                font-weight: bold;
                vertical-align: top;
                width: 35%;
                color: #333;
                border-right: 1px solid #e5e5e5;
              }
              
              .print-value {
                padding: 8px 12px;
                vertical-align: top;
                word-wrap: break-word;
                background-color: white;
              }
              
              .multiline-text {
                white-space: pre-wrap;
                margin: 0;
              }
              
              @media print {
                body {
                  padding: 0;
                }
                
                .print-container {
                  max-width: none;
                }
                
                .print-label {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
            </style>
            <script>
              window.onload = function() {
                window.print();
              };
              window.onafterprint = function() {
                window.close();
              };
            </script>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (status === "loading" || isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full md:p-8 p-6">
      <div className="flex justify-between items-center mb-4">
        <Button
          label="Back"
          icon={<FaAngleLeft />}
          variant="icon"
          size="large"
          onClick={() =>
            router.push(isLabAdmin ? "/admin-dashboard/samples" : "/samples")
          }
        />
        <div className="flex gap-3">
          {isLabAdmin && (
            <Button
              variant="outline-primary"
              size="large"
              label="Update Status"
              icon={<MdOutlineUpdate size={20} />}
              onClick={handleUpdateStatus}
            />
          )}
          <Button
            variant="primary"
            size="large"
            label="Print"
            icon={<IoPrintOutline size={20} />}
            onClick={handlePrint}
          />
        </div>
      </div>

      {/* Simple Table Report View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Sample Report</h2>
        </div>
        
        <div className="px-6 py-4">
          {/* Status Badge */}
          {formData.status && (
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    formData.status === SampleStatus.Pass
                      ? "bg-green-100 text-green-800"
                      : formData.status === SampleStatus.Fail
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {formData.status}
                </span>
              </div>
              {(formData.status === SampleStatus.Pass || formData.status === SampleStatus.Fail) && formData.pass_fail_notes && (
                <div className="mt-2">
                  <span className="text-sm font-medium text-gray-500">Pass/Fail Notes:</span>
                  <span className="ml-2 text-sm text-gray-900">{formData.pass_fail_notes}</span>
                </div>
              )}
            </div>
          )}

          {/* Simple Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <tbody>
                {getReportData().basicInfo.map((field, index) => (
                  <tr key={index} className="border border-gray-200 ">
                    <td className="p-3 pr-4 text-sm font-medium text-gray-600 align-top w-1/3 border-r border-gray-200">
                      {field.label}
                    </td>
                    <td className="p-3 text-sm text-gray-900 break-words">
                      {field.isMultiline ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm">{field.value || ""}</pre>
                      ) : (
                        field.value || ""
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chain of Custody Section */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Chain of Custody</h3>
            {!isLabAdmin && !getReportData().lastIsLabAdmin && (
              <Button
                variant="primary"
                size="large"
                label="+ COC"
                onClick={() => router.push(`/sample/transfer-coc/${params.id}`)}
              />
            )}
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="relative pl-6">
            {/* Timeline vertical line */}
            <div
              className="absolute left-0 top-2.5 bottom-2.5 w-0.5 bg-blue-200"
              style={{ zIndex: 0 }}
            />
            <div className="space-y-6">
              {getReportData().cocTransfers.map((transfer: any, idx: number) => {
                const isLabAdminTransfer =
                  transfer.received_by_user?.id === LAB_ADMIN_ID;
                return (
                  <div key={transfer.id} className="relative">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-[-0.6rem] top-2.5 w-3 h-3 rounded-full border-2 ${
                        isLabAdminTransfer
                          ? "bg-green-600 border-green-600"
                          : "bg-blue-600 border-blue-600"
                      } z-10`}
                    />
                    <div
                      className={`ml-4 ${
                        isLabAdminTransfer
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      } border rounded-lg p-4 shadow-sm`}
                    >
                      <COCTransferItem
                        transfer={transfer}
                        onImageSelect={(type, url) =>
                          setSelectedImage({ type, url })
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Action */}
      {getReportData().showDeleteButton && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-red-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
              <Button
                variant="danger"
                size="large"
                label="Delete Sample"
                icon={<ImBin className="text-lg" />}
                onClick={handleDeleteClick}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={openConfirmDeleteDialog}
        processing={isLoading}
        onConfirm={handleDeleteSample}
        setOpenModal={() => {
          setOpenConfirmDeleteDialog(false);
        }}
      />

      <Modal
        open={openStatusUpdateModal}
        title="Update Sample Status"
        onClose={handleCancelStatusUpdate}
        size="md"
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="flex gap-4">
              <div
                className={`flex items-center px-4 py-2 rounded-md border cursor-pointer ${
                  selectedStatus === "pass"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300"
                }`}
                onClick={() => setSelectedStatus("pass")}
              >
                <div
                  className={`w-4 h-4 rounded-full mr-2 ${
                    selectedStatus === "pass" ? "bg-green-500" : "bg-gray-200"
                  }`}
                ></div>
                <span>Pass</span>
              </div>

              <div
                className={`flex items-center px-4 py-2 rounded-md border cursor-pointer ${
                  selectedStatus === "fail"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
                onClick={() => setSelectedStatus("fail")}
              >
                <div
                  className={`w-4 h-4 rounded-full mr-2 ${
                    selectedStatus === "fail" ? "bg-red-500" : "bg-gray-200"
                  }`}
                ></div>
                <span>Fail</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Temperature (°C)
            </label>
            <input
              type="number"
              className="form-input w-full"
              value={temperature}
              onChange={(e) =>
                setTemperature(
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
              placeholder="Enter temperature"
            />
          </div>

          <TextArea
            label="Notes"
            placeholder="Enter notes about the sample status"
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            rows={4}
          />

          <div className="flex justify-end mt-6 gap-4">
            <Button
              variant="outline-primary"
              size="large"
              label="Cancel"
              onClick={handleCancelStatusUpdate}
            />
            <Button
              variant="primary"
              size="large"
              label="Save"
              disabled={updatingStatus || !selectedStatus}
              onClick={handleSaveStatus}
              // loading={updatingStatus}
            />
          </div>
        </div>
      </Modal>
      {/* Image Preview Modal */}
      <Modal
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title={
          selectedImage?.type === "signature" ? "Signature" : "Handoff Photo"
        }
      >
        <div className="p-4">
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={selectedImage.url}
                alt={
                  selectedImage.type === "signature"
                    ? "Signature"
                    : "Handoff Photo"
                }
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
