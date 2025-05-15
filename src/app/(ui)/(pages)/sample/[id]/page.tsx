"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { User } from "@/types/user";
import { Sample } from "@/types/sample";
import moment from "moment";
import AccordionGroup from "@/app/(ui)/components/Common/AccordionGroup";
import {
  IoChatbubble,
  IoFlask,
  IoInformationCircleOutline,
} from "react-icons/io5";
import { LuWaves } from "react-icons/lu";
import { FaFilePdf, FaFingerprint } from "react-icons/fa";
import { PiRobotFill } from "react-icons/pi";

export default function InspectionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const sampleId = params?.id as string;
  const [currentStep, setCurrentStep] = useState(1);
  const [isOffline, setIsOffline] = useState(false);
  const [showAddAnotherPopup, setShowAddAnotherPopup] = useState(false);
  const [userList, setUserList] = useState<User[]>([]);
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

  useEffect(() => {
    const fetchSampleData = async () => {
      if (sampleId) {
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
        } catch (error) {
          console.error("Error fetching sample:", error);
          alert("Failed to load sample data. Please try again.");
        }
      }
    };

    fetchSampleData();
  }, [sampleId]);

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
            <div className="font-semibold text-gray-900">{formData.id}</div>
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
        <div className="flex gap-2">
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
          <div className="flex items-center justify-between">
            <div className="text-gray-500">GPS Location</div>
            <div className="font-semibold text-themeColor">
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
          Sample collected from main distribution line after 5 minutes of
          flushing. Weather conditions: Clear, 72°F.
        </div>
      ),
    },
    {
      id: "acc7",
      title: "Chain of Custody",
      content: (
        <div className="relative border-l-2 border-blue-500 ml-4 space-y-6">
          {formData?.coc_transfers &&
            formData?.coc_transfers.map((item, index) => (
              <div key={index} className="relative pl-6">
                {/* Blue dot */}
                <span className="absolute left-[-0.6rem] top-2.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></span>

                {/* Card */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {item?.user?.role || "Lab Technician"}
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
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item.received_by}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item?.user?.role || "Lab Technician"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PDF Icon */}
                  <FaFilePdf className="text-red-600 text-2xl mt-1" />
                </div>
              </div>
            ))}
        </div>
      ),
    },
  ];

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full md:p-8 p-6">
      <AccordionGroup items={accordionData} />
    </div>
  );
}
