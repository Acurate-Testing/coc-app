"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Database } from "@/types/supabase";
import { IoFlask, IoSearch } from "react-icons/io5";
import LoadingSpinner from "../../components/Common/LoadingSpinner";
import { Label } from "@/stories/Label/Label";
import moment from "moment";
import { Button } from "@/stories/Button/Button";
import { LuPlus } from "react-icons/lu";
import SampleOverview from "../../components/Samples/SampleOverview";
import { Card } from "@/stories/Card/Card";
import { GoClock } from "react-icons/go";
import { FaLocationDot } from "react-icons/fa6";
import { Pagination } from "@/stories/Pagination/Pagination";
import { FiEdit } from "react-icons/fi";
import { Chip } from "@material-tailwind/react";
import { SampleStatus } from "@/constants/enums";
import { useMediaQuery } from "react-responsive";
import { RiTestTubeFill } from "react-icons/ri";
import { Sample } from "@/types/sample";
import { errorToast } from "@/hooks/useCustomToast";

// type Sample = Database["public"]["Tables"]["samples"]["Row"];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SampleStatus | "All">("All");
  const [samples, setSamples] = useState<Partial<Sample>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isPageChanging, setIsPageChanging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalSamples, setTotalSamples] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchSamples = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/samples?page=${currentPage}${
          searchQuery ? `&search=${searchQuery}` : ""
        }${activeTab !== "All" ? `&status=${activeTab}` : ""}
        `
      );
      const data: any = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch samples");
      }

      if (data.error) {
        throw new Error(data.error);
      }
      setTotalSamples(data.total);
      setSamples(data.samples);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Error fetching samples:", err);
      errorToast(
        err instanceof Error ? err.message : "Failed to fetch samples"
      );
    } finally {
      setIsLoading(false);
      setIsSearching(false);
      setIsPageChanging(false);
    }
  };

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
        return "In COC";
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

  useEffect(() => {
    if (status === "authenticated") {
      fetchSamples();
    }
  }, [status, currentPage, activeTab]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      fetchSamples();
    }, 1000);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setIsPageChanging(true);
    setCurrentPage(page);
  };

  // const filteredSamples = samples?.filter((sample: Sample) => {
  //   const matchesSearch =
  //     (sample.project_id?.toLowerCase().includes(searchQuery.toLowerCase()) ??
  //       false) ||
  //     (sample.pws_id?.toLowerCase().includes(searchQuery.toLowerCase()) ??
  //       false) ||
  //     (sample.matrix_type?.toLowerCase().includes(searchQuery.toLowerCase()) ??
  //       false);

  //   if (activeTab === "All") return matchesSearch;
  //   return matchesSearch && sample.status === activeTab.toLowerCase();
  // });

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
      {!isMobile && <SampleOverview />}
      <div className="relative bg-gray-50">
        <button
          onClick={() => router.push("/sample/add")}
          className="fixed z-[50] bottom-24 right-8 bg-themeColor hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-colors duration-200"
        >
          <LuPlus size={30} />
        </button>
      </div>
      <div className="w-full md:p-8 p-6 md:!pt-0">
        <div className="flex gap-4 items-center">
          <div className="w-full pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="relative">
              <IoSearch className="text-themeColor pointer-events-none h-5 w-5 absolute top-1/2 transform -translate-y-1/2 left-3 z-[1] ml-2" />
              <input
                id="sample-search"
                className={`font-medium rounded-lg py-2.5 px-4 bg-white text-base appearance-none block !pl-12 form-input`}
                value={searchQuery}
                type="search"
                placeholder="Search"
                onChange={(e) => {
                  const { value } = e.target;
                  setCurrentPage(0);
                  setSearchQuery(value);
                }}
              />
            </div>
            <div />
            <div>
              <select
                id="type"
                name="type"
                value={activeTab}
                onChange={(e) => {
                  setCurrentPage(0);
                  setActiveTab(e.target.value as SampleStatus | "All");
                }}
                className="form-input h-[60px] md:h-full bg-white"
              >
                <option value="All">All</option>
                <option value={SampleStatus.Pending}>Pending</option>
                <option value={SampleStatus.InCOC}>In COC</option>
                <option value={SampleStatus.Submitted}>Submitted</option>
                <option value={SampleStatus.Pass}>Pass</option>
                <option value={SampleStatus.Fail}>Fail</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {samples.length > 0 ? (
            <>
              {samples.map((sample) => (
                <div key={sample.id} className="mb-4">
                  <Card
                    onClick={() => router.push(`/sample/${sample.id}`)}
                    className="p-4 bg-white !shadow-none rounded-xl flex items-start justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex flex-row items-center md:gap-4 gap-2">
                        <div>
                          <Label
                            label={`#${sample.project_id || "N/A"}`}
                            className="text-lg font-semibold"
                          />
                        </div>
                        <div>
                          <Chip
                            className={`${getStatusColor(
                              sample?.status as string
                            )} capitalize flex items-center justify-center py-1.5 w-fit rounded-full text-sm`}
                            value={getStatusLabel(sample?.status as string)}
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
                          label={moment(sample?.created_at).format(
                            "YYYY-MM-DD hh:mm A"
                          )}
                          className="text-lg"
                        />
                      </div>
                      <div className="flex items-center justify-start md:gap-4 gap-2">
                        <Button
                          className="md:!min-w-fit !p-3 !cursor-default"
                          label=""
                          variant="icon"
                          icon={
                            <RiTestTubeFill className="text-xl text-gray-600" />
                          }
                        />
                        <div className="flex items-center flex-wrap gap-2">
                          {sample?.test_types &&
                          sample?.test_types?.length > 0 ? (
                            sample?.test_types?.map((item, index) => (
                              <div key={index}>
                                {item?.name && (
                                  <div className="bg-[#DBEAFE] text-themeColor px-2.5 py-1.5 rounded-full text-sm">
                                    {item?.name}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500">
                              No tests selected
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        className="md:min-w-[110px] !bg-[#DBEAFE]"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/sample/edit/${sample.id}`);
                        }}
                        variant="icon"
                        label={isMobile ? "" : "Edit"}
                        icon={<FiEdit className="text-lg" />}
                      />
                      {/* <Button
                        className="md:min-w-[110px]"
                        onClick={(e) => handleDeleteClick(e, sample.id)}
                        label={isMobile ? "" : "Delete"}
                        variant="danger"
                        icon={<ImBin className="text-lg" />}
                      /> */}
                    </div>
                  </Card>
                </div>
              ))}
              {totalPages > 1 && (
                <div>
                  <Pagination
                    activePage={currentPage || 0}
                    setActivePage={handlePageChange}
                    numberOfPage={totalPages}
                    numberOfRecords={totalSamples}
                    itemsPerPage={10}
                  />
                </div>
              )}
            </>
          ) : isLoading || isSearching || isPageChanging ? (
            <LoadingSpinner />
          ) : (
            <Card className="p-4 bg-white !shadow-none rounded-xl">
              <div className="flex items-center justify-center h-64">
                <Label
                  label={
                    activeTab !== "All"
                      ? "No sample found based on your applied filter."
                      : "No samples found"
                  }
                  className="text-lg font-semibold text-gray-500"
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
