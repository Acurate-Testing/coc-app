"use client";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import LoadingSpinner from "../../../components/Common/LoadingSpinner";
import { User } from "@/types/user";
import { Sample } from "@/types/sample";
import moment from "moment";
import AccordionGroup from "@/app/(ui)/components/Common/AccordionGroup";
import {
  IoChatbubble,
  IoFlask,
  IoInformationCircleOutline,
  IoPrintOutline,
} from "react-icons/io5";
import { LuWaves } from "react-icons/lu";
import { FaFilePdf, FaFingerprint } from "react-icons/fa";
import { PiRobotFill } from "react-icons/pi";
import { Button } from "@/stories/Button/Button";
import ReactDOM from "react-dom";
import { errorToast } from "@/hooks/useCustomToast";
import { UserRole } from "@/constants/enums";

export default function InspectionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const sampleId = params?.id as string;
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<Sample>>({});

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
          // setSpecificSample(data.sample);
          setFormData(data.sample);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching sample:", error);
        setIsLoading(false);
        errorToast("Failed to load sample data. Please try again.");
      }
    }
  };

  useEffect(() => {
    fetchSampleData();
  }, [sampleId]);

  const handleCOCModalOpen = () => {
    router.push(`/sample/transfer-coc/${sampleId}`);
  };

  const accordionData = [
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
            <div className="text-gray-500">Matrix Type</div>
            <div className="text-gray-900">{formData.matrix_type}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-500">Sample Type</div>
            <div className="text-gray-900">{formData.sample_type}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-500">Sample Privacy</div>
            <div className="text-gray-900">{formData.sample_privacy}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-500">Compliance</div>
            <div className="text-gray-900">{formData.compliance}</div>
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
            <div className="font-semibold text-gray-900">{formData.source}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-500">Location</div>
            <div className="text-gray-900">{formData.sample_location}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-500">County</div>
            <div className="text-gray-900">{formData.county}</div>
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
              {formData.project_id}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-500">PWS ID</div>
            <div className="text-gray-900">{formData.pws_id}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-500">Chlorine Residual</div>
            <div className="text-gray-900">{formData.chlorine_residual}</div>
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
            <div className="text-gray-500">GPS Location</div>
            <div className="md:max-w-[unset] max-w-[120px] break-all font-semibold text-themeColor">
              ${formData.latitude}° N, ${formData.longitude}° W
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-500">Timestamp</div>
            <div className="text-gray-900">
              {moment(formData?.created_at).format("YYYY-MM-DD hh:mm A")}
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
    {
      id: "acc7",
      title: "Chain of Custody",
      buttonText: "+ COC",
      buttonAction: handleCOCModalOpen,
      content: (
        <div className="relative border-l-2 border-blue-500 ml-4 space-y-6">
          {formData?.coc_transfers && formData.coc_transfers.length > 0 ? (
            formData?.coc_transfers.map((item, index) => (
              <div key={index} className="relative pl-6">
                {/* Blue dot */}
                <span className="absolute left-[-0.45rem] top-2.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></span>

                {/* Card */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {item?.received_by_user?.role === UserRole.LABADMIN
                        ? "Lab Admin"
                        : item?.received_by_user?.role === UserRole.AGENCY
                        ? "Admin"
                        : "Member"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {moment(item.timestamp).format("YYYY-MM-DD hh:mm A")}
                    </p>

                    <div className="flex items-center gap-3 mt-4">
                      {/* <img
                        src={item.user.avatar}
                        alt={item.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      /> */}
                      <div className="flex items-center justify-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-themeColor text-sm font-medium uppercase bg-gray-300">
                          {item.received_by_user.full_name &&
                            (item.received_by_user.full_name.includes(" ")
                              ? item.received_by_user.full_name
                                  .split(" ")
                                  .map((n: string) => n.charAt(0).toUpperCase())
                                  .join("")
                              : item.received_by_user.full_name
                                  .slice(0, 2)
                                  .toUpperCase())}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {item.received_by_user.full_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item?.received_by_user?.role === UserRole.LABADMIN
                              ? "Lab Admin"
                              : item?.received_by_user?.role === UserRole.AGENCY
                              ? "Admin"
                              : "Member"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PDF Icon */}
                  {/* <FaFilePdf className="text-red-600 text-2xl mt-1" /> */}
                </div>
              </div>
            ))
          ) : (
            <span className="text-gray-500"> No Chain Of Custody found</span>
          )}
        </div>
      ),
    },
  ];

  const handlePrint = () => {
    // Create a container for the print content
    const container = document.createElement("div");
    container.className = "w-full md:p-8 p-6";

    // Process each accordion item
    accordionData.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "mb-4";

      // Create accordion header
      const headerDiv = document.createElement("div");
      headerDiv.className = "bg-white rounded-xl";

      const headerContent = document.createElement("div");
      headerContent.className = "px-4 py-3 flex items-center gap-2 text-lg";

      // Add icon if exists
      if (item.icon) {
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
      <div className="flex justify-end mb-4">
        <Button
          variant="primary"
          size="large"
          label="Print"
          icon={<IoPrintOutline size={20} />}
          onClick={handlePrint}
        />
      </div>
      <AccordionGroup items={accordionData} />
    </div>
  );
}
