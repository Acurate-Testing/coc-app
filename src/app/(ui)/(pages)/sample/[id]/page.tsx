"use client";
import AccordionGroup from "@/app/(ui)/components/Common/AccordionGroup";
import ConfirmationModal from "@/app/(ui)/components/Common/ConfirmationModal";
import LoadingSpinner from "@/app/(ui)/components/Common/LoadingSpinner";
import Modal from "@/app/(ui)/components/Common/Modal";
import TextArea from "@/app/(ui)/components/Form/TextArea";
import { MatrixType, SampleStatus, UserRole } from "@/constants/enums";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import { Button } from "@/stories/Button/Button";
import { Sample } from "@/types/sample";
import { User } from "@/types/user";
import moment from "moment";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { FaAngleLeft, FaFingerprint } from "react-icons/fa";
import { ImBin } from "react-icons/im";
import {
  IoChatbubble,
  IoFlask,
  IoInformationCircleOutline,
  IoPrintOutline,
} from "react-icons/io5";
import { LuWaves } from "react-icons/lu";
import { MdOutlineUpdate } from "react-icons/md";
import { PiRobotFill } from "react-icons/pi";

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
  const [openStatusUpdateModal, setOpenStatusUpdateModal] = useState<boolean>(false);
  const [statusNotes, setStatusNotes] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<'pass' | 'fail' | null>(null);

  const isLabAdmin = session?.user?.role === UserRole.LABADMIN;

  const fetchUserList = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUserList(data.users || []);
    } catch (error) {
      console.log(error);
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
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch sample data");
        }
        const data = await response.json();
        if (data.sample) {
          setFormData(data.sample);
          handleGetLocation(
            Number(data.sample.latitude.toFixed(2)),
            Number(data.sample.longitude.toFixed(2))
          );
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching sample:", error);
        setIsLoading(false);
        errorToast("Failed to load sample data. Please try again.");
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete sample");
      }

      setOpenConfirmDeleteDialog(false);
      router.push("/samples");
    } catch (error) {
      console.error("Error deleting sample:", error);
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
      setSelectedStatus('pass');
    } else if (formData.status === SampleStatus.Fail) {
      setSelectedStatus('fail');
    } else {
      setSelectedStatus(null);
    }
    
    setStatusNotes(formData.pass_fail_notes || "");
    setOpenStatusUpdateModal(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedStatus) {
      errorToast("Please select a status");
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/samples/${sampleId}/change-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedStatus,
          notes: statusNotes
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update sample status");
      }

      setFormData((prev) => ({
        ...prev,
        status: selectedStatus === "pass" ? SampleStatus.Pass : SampleStatus.Fail,
        pass_fail_notes: statusNotes,
      }));

      successToast(`Sample status updated to ${selectedStatus}`);
      setOpenStatusUpdateModal(false);
      setStatusNotes("");
      setSelectedStatus(null);
      
      fetchSampleData();
    } catch (error) {
      console.error("Error updating sample status:", error);
      errorToast(
        error instanceof Error ? error.message : "Failed to update sample status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelStatusUpdate = () => {
    setOpenStatusUpdateModal(false);
    setStatusNotes("");
    setSelectedStatus(null);
  };

  const getAccordionData = () => {
    let data = [
      {
        id: "acc1",
        title: "Basic Information",
        icon: (
          <IoInformationCircleOutline size={22} color="var(--color-primary)" />
        ),
        content: (
          <div className="grid grid-cols-1 gap-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Sample ID</div>
              <div className="font-semibold text-gray-900 truncate md:max-w-[unset] max-w-[160px]">
                {formData.id}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Created By</div>
              <div className="text-gray-900">{formData.created_by_user?.full_name || "-"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Status</div>
              <div className={`font-semibold ${
                formData.status === SampleStatus.Pass ? 'text-green-600' : 
                formData.status === SampleStatus.Fail ? 'text-red-600' : 'text-gray-900'
              }`}>
                {formData.status || "Pending"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Matrix Type</div>

              <div className="text-gray-900">
                {formData.matrix_type}{" "}
                {formData.matrix_type === MatrixType.Other
                  ? `(${formData.matrix_name})`
                  : ""}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Sample Type</div>
              <div className="text-gray-900">{formData.sample_type || "-"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Sample Privacy</div>
              <div className="text-gray-900">
                {formData.sample_privacy || "-"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Compliance</div>
              <div className="text-gray-900">{formData.compliance || "-"}</div>
            </div>
          </div>
        ),
      },
      {
        id: "acc2",
        title: "Source Information",
        icon: <LuWaves size={22} color="var(--color-primary)" />,
        content: (
          <div className="grid grid-cols-1 gap-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Source</div>
              <div className="font-semibold text-gray-900">
                {formData.source || "-"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Sample Location</div>
              <div className="text-gray-900">
                {formData.sample_location || "-"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">County</div>
              <div className="text-gray-900">{formData.county || "-"}</div>
            </div>
          </div>
        ),
      },
      {
        id: "acc3",
        title: "Identifiers",
        icon: <FaFingerprint size={22} color="var(--color-primary)" />,
        content: (
          <div className="grid grid-cols-1 gap-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Project ID</div>
              <div className="font-semibold text-gray-900">
                {formData.project_id || "-"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">PWS ID</div>
              <div className="text-gray-900">{formData.pws_id || "-"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Chlorine Residual</div>
              <div className="text-gray-900">
                {formData.chlorine_residual || "-"}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "acc4",
        title: "Test Selection",
        icon: <IoFlask size={22} color="var(--color-primary)" />,
        content: (
          <div className="flex flex-wrap gap-2">
            {formData?.test_types?.length ? (
              formData?.test_types.map((test, index) => (
                <span
                  key={test.id}
                  className="bg-[#DBEAFE] text-themeColor px-2.5 py-1.5 rounded-full text-sm"
                >
                  {test.name}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No tests selected</span>
            )}
          </div>
        ),
      },
      {
        id: "acc5",
        title: "System Fields",
        icon: <PiRobotFill size={22} color="var(--color-primary)" />,
        content: (
          <div className="grid grid-cols-1 gap-y-3 text-sm">
            <div className="flex items-center justify-between gap-10">
              <div className="text-gray-500">Current GPS Location</div>
              <div className="md:max-w-[unset] max-w-[120px] break-all font-semibold text-themeColor">
              {/* ${formData.latitude}° N, ${formData.longitude}° W */}
                {formData.address}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-500">Sample Date</div>
              <div className="text-gray-900">
                {moment(formData?.sample_collected_at).format(
                  "YYYY-MM-DD hh:mm A"
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "acc6",
        title: "Remarks",
        icon: <IoChatbubble size={22} color="var(--color-primary)" />,
        content: (
          <div className="text-gray-500">
            {formData?.notes || "No remarks available"}
          </div>
        ),
      },
    ];

    const cocItem = {
      id: "acc7",
      title: "Chain of Custody",
      ...(isLabAdmin ? {} : { buttonText: "+ COC", buttonAction: handleCOCModalOpen }),
      content: (
        <div className="relative border-l-2 border-themeColor ml-4 space-y-6">
          {formData?.coc_transfers && formData.coc_transfers.length > 0 ? (
            formData?.coc_transfers.map((item, index) => (
              <div key={index} className="relative pl-6">
                <span className="absolute left-[-0.55rem] top-4 w-4 h-4 rounded-full bg-themeColor border-2 border-white"></span>

                <div className="bg-gray-50 p-4 rounded-lg shadow-sm flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">
                      {moment(item.timestamp).format("YYYY-MM-DD hh:mm A")}
                    </p>
                    <h3 className="font-semibold text-gray-800">
                      Tranferred to:{" "}
                      <span className="!font-normal">
                        {item.received_by_user.full_name}
                      </span>
                    </h3>
                  </div>
                  {/* <FaFilePdf className="text-red-600 text-2xl mt-1" /> */}
                </div>
              </div>
            ))
          ) : (
            <span className="text-gray-500"> No Chain Of Custody found</span>
          )}
        </div>
      ),
    };

    const deleteItem = {
      id: "acc8",
      title: "Action",
      buttonText: "Delete",
      variant: "danger",
      buttonIcon: <ImBin className="text-lg" />,
      buttonAction: handleDeleteClick,
      content: "",
      initiallyOpen: false,
    };

    const accordionData = [
      ...data,
      cocItem,
      ...(isLabAdmin ? [] : [deleteItem]),
    ];

    return accordionData;
  };

  const handlePrint = () => {
    // Create a container for the print content
    const container = document.createElement("div");
    container.className = "w-full md:p-8 p-6";

    getAccordionData().forEach((item) => {
      if (item.id === "acc8") return;
      const itemDiv = document.createElement("div");
      itemDiv.className = "mb-4";

      // Create accordion header
      const headerDiv = document.createElement("div");
      headerDiv.className = "bg-white rounded-xl";

      const headerContent = document.createElement("div");
      headerContent.className = "px-4 py-3 flex items-center gap-2 text-lg";

      // Only render icon if it exists
      if ("icon" in item && item.icon) {
        const iconDiv = document.createElement("div");
        const tempIconDiv = document.createElement("div");
        ReactDOM.render(item.icon, tempIconDiv);
        iconDiv.innerHTML = tempIconDiv.innerHTML;
        headerContent.appendChild(iconDiv);
      }

      // Add title
      const titleSpan = document.createElement("span");
      titleSpan.textContent = item.title;
      headerContent.appendChild(titleSpan);

      headerDiv.appendChild(headerContent);
      itemDiv.appendChild(headerDiv);

      // Add content
      const contentDiv = document.createElement("div");
      contentDiv.className = "px-4 py-3";

      if (React.isValidElement(item.content)) {
        const tempDiv = document.createElement("div");
        ReactDOM.render(item.content, tempDiv);
        contentDiv.innerHTML = tempDiv.innerHTML;
      } else {
        contentDiv.textContent = String(item.content);
      }

      itemDiv.appendChild(contentDiv);
      container.appendChild(itemDiv);
    });

    // Create print window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Sample Details</title>
            <style>
              body { 
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
              }
              .w-full { width: 100%; }
              .md\\:p-8 { padding: 2rem; }
              .p-6 { padding: 1.5rem; }
              .mb-4 { margin-bottom: 1rem; }
              .bg-white { background-color: white; }
              .rounded-xl { border-radius: 0.75rem; }
              .px-4 { padding-left: 1rem; padding-right: 1rem; }
              .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
              .flex { display: flex; }
              .items-center { align-items: center; }
              .gap-2 { gap: 0.5rem; }
              .text-lg { font-size: 1.125rem; }
              .text-gray-500 { color: #6B7280; }
              .text-gray-900 { color: #111827; }
              .font-semibold { font-weight: 600; }
              .grid { display: grid; }
              .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
              .gap-y-3 { row-gap: 0.75rem; }
              .text-sm { font-size: 0.875rem; }
              .justify-between { justify-content: space-between; }
              .bg-\\[\\#DBEAFE\\] { background-color: #DBEAFE; }
              .text-themeColor { color: var(--color-primary); }
              .px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
              .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
              .rounded-full { border-radius: 9999px; }
              .border-l-2 { border-left-width: 2px; }
              .border-blue-500 { border-color: #3B82F6; }
              .ml-4 { margin-left: 1rem; }
              .space-y-6 > * + * { margin-top: 1.5rem; }
              .relative { position: relative; }
              .pl-6 { padding-left: 1.5rem; }
              .absolute { position: absolute; }
              .left-\\[-0\\.6rem\\] { left: -0.6rem; }
              .top-2\\.5 { top: 0.625rem; }
              .w-3 { width: 0.75rem; }
              .h-3 { height: 0.75rem; }
              .rounded-full { border-radius: 9999px; }
              .bg-blue-600 { background-color: #2563EB; }
              .border-2 { border-width: 2px; }
              .border-white { border-color: white; }
              .bg-gray-50 { background-color: #F9FAFB; }
              .p-4 { padding: 1rem; }
              .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
              .mt-4 { margin-top: 1rem; }
              .gap-3 { gap: 0.75rem; }
              .text-2xl { font-size: 1.5rem; }
              .text-red-600 { color: #DC2626; }
              .mt-1 { margin-top: 0.25rem; }
              @media print {
                body { padding: 20px; }
              }
            </style>
              <script>
              window.onafterprint = function() {
                window.close();
              };
            </script>
          </head>
          <body>
            ${container.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
          onClick={() => router.push(isLabAdmin ? "/admin-dashboard/samples" : "/samples")}
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
      <AccordionGroup items={getAccordionData()} />
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
                  selectedStatus === 'pass' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300'
                }`} 
                onClick={() => setSelectedStatus('pass')}
              >
                <div className={`w-4 h-4 rounded-full mr-2 ${
                  selectedStatus === 'pass' ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
                <span>Pass</span>
              </div>
              
              <div 
                className={`flex items-center px-4 py-2 rounded-md border cursor-pointer ${
                  selectedStatus === 'fail' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300'
                }`} 
                onClick={() => setSelectedStatus('fail')}
              >
                <div className={`w-4 h-4 rounded-full mr-2 ${
                  selectedStatus === 'fail' ? 'bg-red-500' : 'bg-gray-200'
                }`}></div>
                <span>Fail</span>
              </div>
            </div>
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
    </div>
  );
}
