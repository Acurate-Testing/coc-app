"use client";

import ConfirmationModal from "@/app/(ui)/components/Common/ConfirmationModal";
import LoadingSpinner from "@/app/(ui)/components/Common/LoadingSpinner";
import SampleOverview from "@/app/(ui)/components/Samples/SampleOverview";
import { SampleStatus } from "@/constants/enums";
import { Button } from "@/stories/Button/Button";
import { Card } from "@/stories/Card/Card";
import { Label } from "@/stories/Label/Label";
import { Pagination } from "@/stories/Pagination/Pagination";
import { Database } from "@/types/supabase";
import { Chip } from "@/stories/Chip/Chip";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { FiDownload, FiEdit, FiUser } from "react-icons/fi";
import { GoClock } from "react-icons/go";
import { ImBin } from "react-icons/im";
import { IoFlask, IoSearch } from "react-icons/io5";
import { useMediaQuery } from "react-responsive";
import { format } from "date-fns";
import Link from "next/link";

type BaseSample = Database["public"]["Tables"]["samples"]["Row"];

// Extended Sample type with creator information
interface Sample {
  id: string;
  project_id: string;
  matrix_type: string;
  matrix_name: string;
  sample_type: string;
  sample_location: string;
  sample_privacy: string;
  status: string;
  sample_collected_at: string;
  created_at: string;
  updated_at: string;
  temperature: number;
  notes: string;
  pass_fail_notes: string;
  attachment_url: string;
  latitude: number;
  longitude: number;
  county: string;
  compliance: string;
  chlorine_residual: string;
  pws_id: string;
  created_by: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  agency: {
    id: string;
    name: string;
  };
  account: {
    id: string;
    name: string;
  };
}

interface Agency {
  id: string;
  name: string;
  contact_email: string;
}

interface ApiResponse {
  samples: Sample[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
  data?: any[];
  items?: any[];
}

interface AdminSamplesClientProps {
  initialSamples: Sample[];
  initialAgencies: Agency[];
  userRole: string;
}

export default function AdminSamplesClient({
  initialSamples,
  initialAgencies,
  userRole,
}: AdminSamplesClientProps) {
  const router = useRouter();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");
  const [samples, setSamples] = useState<Sample[]>(initialSamples);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [limitPerPage, setLimitPerPage] = useState(10);
  const [totalSamples, setTotalSamples] = useState(initialSamples.length);
  const [totalPages, setTotalPages] = useState(
    Math.ceil(initialSamples.length / 10)
  );
  const [selectedSample, setSelectedSample] = useState<string>("");
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] =
    useState<boolean>(false);
  const [agencies, setAgencies] = useState<Agency[]>(initialAgencies);
  const [selectedAgency, setSelectedAgency] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [agenciesLoading, setAgenciesLoading] = useState(true);

  const fetchSamples = async () => {
    try {
      setIsLoading(true);
      let url = `/api/admin/samples?page=${currentPage}&limit=${limitPerPage}`;

      if (selectedAgency) {
        url += `&agency=${selectedAgency}`;
      }

      if (searchQuery) {
        url += `&search=${searchQuery}`;
      }

      // For admin users, when "All" is selected, we want to show submitted, passed, and failed samples
      if (userRole === "lab_admin" && activeTab === "All") {
        url += `&status=submitted,pass,fail`;
      } else if (activeTab !== "All") {
        url += `&status=${activeTab}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch samples");
      }
      const data = await response.json();
      setSamples(data.samples || []);
      setTotalSamples(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch samples"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "lab_admin") {
      setActiveTab(SampleStatus.Submitted);
    } else {
      setActiveTab("All");
    }
  }, [userRole]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(
      () => {
        fetchSamples();
      },
      searchQuery ? 1000 : 0
    );
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, activeTab, limitPerPage, selectedAgency, searchQuery]);

  // Fetch agencies
  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const response = await fetch("/api/agencies");
        if (!response.ok) {
          throw new Error("Failed to fetch agencies");
        }
        const data = await response.json();
        setAgencies(data.agencies);
      } catch (error) {
        console.error("Error fetching agencies:", error);
        setError("Failed to load agencies");
      } finally {
        setAgenciesLoading(false);
      }
    };

    fetchAgencies();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "!bg-[#FEF3C7] !text-[#B45309]";
      case "in_coc":
        return "!bg-[#DBEAFE] !text-[#1D4ED8]";
      case "submitted":
        return "!bg-[#E9D5FF] !text-[#7E22CE]";
      case "pass":
        return "!bg-[#d1fae5] !text-[#065f46]";
      case "fail":
        return "!bg-[#fee2e2] !text-[#dc2626]";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in_coc":
        return "In Chain of Custody";
      case "submitted":
        return "Submitted";
      case "pass":
        return "Passed";
      case "fail":
        return "Failed";
      default:
        return status;
    }
  };

  const handleEditClick = (e: any, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSample(id);
    router.push(`/sample/edit/${id}`);
  };

  const handleDeleteClick = (e: any, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSample(id);
    setOpenConfirmDeleteDialog(true);
  };

  const handleDeleteSample = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/samples?id=${selectedSample}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete sample");
      }
      setOpenConfirmDeleteDialog(false);
      setSelectedSample("");
      fetchSamples();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete sample"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const params = [
        searchQuery ? `search=${searchQuery}` : "",
        activeTab !== "All" ? `status=${activeTab}` : "",
        selectedAgency ? `agencyId=${selectedAgency}` : "",
      ]
        .filter(Boolean)
        .join("&");

      const response = await fetch(`/api/samples/export?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to export samples");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `samples-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export samples");
    } finally {
      setIsExporting(false);
    }
  };

  const getAgencyName = (id: string | null) =>
    agencies.find((a) => a.id === id)?.name || id || "-";

  // Use useCallback to memoize the SampleOverview component
  const renderSampleOverview = useCallback(
    () => <SampleOverview key="sample-overview" />,
    [] // Empty dependency array since we want it to render only once
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen w-full">
        <div className="max-w-md mx-auto p-4">
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isMobile && renderSampleOverview()}
      <div className="w-full md:p-8 p-6 !pt-0">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Samples</h1>
        </div>
        <div className="flex gap-4 items-center">
          <div className="w-full pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative ">
              <IoSearch className="text-themeColor pointer-events-none h-6 w-6 absolute top-1/2 transform -translate-y-1/2 left-4 z-[1]" />
              <input
                id="sample-search"
                className={`font-medium rounded-lg py-2.5 px-4 bg-white w-full text-base appearance-none block !pl-14 form-input h-[60px] ${
                  !searchQuery && !(samples && samples.length)
                    ? "cursor-not-allowed"
                    : ""
                } text-base appearance-none block !pl-10 form-input`}
                value={searchQuery}
                type="search"
                placeholder="Search"
                onChange={(e) => {
                  const { value } = e.target;
                  setCurrentPage(0);
                  setSearchQuery(value);
                }}
                disabled={!searchQuery && !(samples && samples.length)}
              />
            </div>
            <div className="col-span-1">
              <select
                id="agency"
                name="agency"
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="form-input bg-white w-full"
                disabled={agenciesLoading}
              >
                <option value="">All Customers</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name} ({agency.contact_email})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <select
                id="type"
                name="type"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="form-input bg-white w-full"
              >
                <option value="All">All</option>
                <option value={SampleStatus.Submitted}>Submitted</option>
                <option value={SampleStatus.Pass}>Pass</option>
                <option value={SampleStatus.Fail}>Fail</option>
              </select>
            </div>
            <div className="col-span-1 flex items-center justify-start lg:justify-end">
              <Button
                className="primary"
                label="Export CSV"
                onClick={handleExportCSV}
                disabled={isExporting || !samples.length}
                icon={<FiDownload className="text-lg" />}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {samples?.length > 0 ? (
            <>
              {samples.map((sample) => (
                <div key={sample.id} className="mb-4">
                  <Card
                    onClick={() => router.push(`/sample/${sample.id}`)}
                    className="p-4 bg-white !shadow-none rounded-xl flex items-start justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex gap-4">
                        <div>
                          <Label
                            label={`#${sample.project_id || "N/A"}`}
                            className="text-lg font-semibold"
                          />
                        </div>
                        <div>
                          <Chip
                            value={getStatusLabel(sample?.status as string)}
                            className={`${getStatusColor(
                              sample?.status as string
                            )} capitalize flex items-center justify-center py-1.5 w-fit rounded-full text-sm`}
                            color={
                              sample?.status === "pending"
                                ? "yellow"
                                : sample?.status === "in_coc"
                                ? "blue"
                                : sample?.status === "submitted"
                                ? "purple"
                                : sample?.status === "pass"
                                ? "green"
                                : sample?.status === "fail"
                                ? "red"
                                : "gray"
                            }
                          />
                        </div>
                      </div>
                      <div className="flex items-center md:gap-4 gap-2">
                        <Button
                          className="md:!min-w-fit !p-3 !cursor-default"
                          label=""
                          variant="icon"
                          icon={<IoFlask className="text-lg text-gray-600" />}
                        />
                        <Label
                          label={sample?.matrix_type || "-"}
                          className="text-lg"
                        />
                      </div>
                      <div className="flex items-center md:gap-4 gap-2">
                        <Button
                          className="md:!min-w-fit !p-3 !cursor-default"
                          label=""
                          variant="icon"
                          icon={
                            <FaLocationDot className="text-lg text-gray-600" />
                          }
                        />
                        <Label
                          label={sample?.sample_location || "-"}
                          className="text-lg"
                        />
                      </div>
                      <div className="flex items-center md:gap-4 gap-2">
                        <Button
                          className="md:!min-w-fit !p-3 !cursor-default"
                          label=""
                          variant="icon"
                          icon={<GoClock className="text-lg text-gray-600" />}
                        />
                        <Label
                          label={format(
                            new Date(sample?.created_at),
                            "yyyy-MM-dd hh:mm a"
                          )}
                          className="text-lg"
                        />
                      </div>
                      {/* creator information */}
                      {/* <div className="flex items-center md:gap-4 gap-2">
                        <Button
                          className="md:!min-w-fit !p-3 !cursor-default"
                          label=""
                          variant="icon"
                          icon={<FiUser className="text-lg text-gray-600" />}
                        />
                        <Label
                          label={
                            sample?.created_by?.full_name
                              ? `Created by: ${sample.created_by.full_name}`
                              : sample?.created_by?.email
                              ? `Created by: ${sample.created_by.email}`
                              : "Created by: -"
                          }
                          className="text-lg"
                        />
                      </div> */}
                      <div className="flex items-center md:gap-4 gap-2">
                        <Button
                          className="md:!min-w-fit !p-3 !cursor-default"
                          label=""
                          variant="icon"
                          icon={<FiUser className="text-lg text-gray-600" />}
                        />
                        <Label
                          label={
                            sample?.account?.name
                              ? `Account: ${sample.account.name}`
                              : "Account: -"
                          }
                          className="text-lg"
                        />
                      </div>
                      <div className="flex items-center md:gap-4 gap-2">
                        <Button
                          className="md:!min-w-fit !p-3 !cursor-default"
                          label=""
                          variant="icon"
                          icon={<FiUser className="text-lg text-gray-600" />}
                        />
                        <Label
                          label={
                            sample?.agency?.name
                              ? `Customer: ${sample.agency.name}`
                              : "Customer: -"
                          }
                          className="text-lg"
                        />
                      </div>
                    </div>
                    {/* <div className="flex flex-col gap-2">
                      <Button
                        className="min-w-[110px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/sample/edit/${sample.id}`);
                        }}
                        label="Edit"
                        icon={<FiEdit className="text-lg" />}
                      />
                      <Button
                        className="min-w-[110px]"
                        onClick={(e) => handleDeleteClick(e, sample.id)}
                        label="Delete"
                        variant="danger"
                        icon={<ImBin className="text-lg" />}
                      />
                    </div> */}
                  </Card>
                </div>
              ))}
              {totalPages && (
                <div className="p-5">
                  <Pagination
                    activePage={currentPage || 0}
                    setActivePage={setCurrentPage}
                    numberOfPage={totalPages}
                    numberOfRecords={totalSamples}
                    itemsPerPage={limitPerPage || 10}
                    setItemsPerPage={setLimitPerPage}
                  />
                </div>
              )}
            </>
          ) : (
            <Card className="p-4 bg-white !shadow-none rounded-xl">
              <div className="flex items-center justify-center h-64">
                <Label
                  label="No samples found"
                  className="text-lg font-semibold"
                />
              </div>
            </Card>
          )}
        </div>
      </div>
      <ConfirmationModal
        open={openConfirmDeleteDialog}
        processing={isLoading}
        onConfirm={handleDeleteSample}
        setOpenModal={() => {
          setSelectedSample("");
          setOpenConfirmDeleteDialog(false);
        }}
      />
    </>
  );
}
