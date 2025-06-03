"use client";

import ConfirmationModal from "@/app/(ui)/components/Common/ConfirmationModal";
import LoadingSpinner from "@/app/(ui)/components/Common/LoadingSpinner";
import AddEditTestModal from "@/app/(ui)/components/Tests/AddEditTestModal";
import { Card } from "@/stories/Card/Card";
import { Pagination } from "@/stories/Pagination/Pagination";
import { Database } from "@/types/supabase";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiEdit, FiEye, FiMoreVertical } from "react-icons/fi";
import { ImBin } from "react-icons/im";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLoadingState } from "@/hooks/useLoadingState";
import { LoadingButton } from "@/stories/Button/LoadingButton";
import { TestsResponse } from "@/types/api";
import { errorToast } from "@/hooks/useCustomToast";

type Test = Database["public"]["Tables"]["test_types"]["Row"];

interface ApiResponse {
  tests: Test[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
}

export default function AdminTestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tests, setTests] = useState<TestsResponse["items"]>([]);
  const { isLoading, withLoading } = useLoadingState();
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalTests, setTotalTests] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editTest, setEditTest] = useState<Test | null>(null);
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] = useState<boolean>(false);
  const [viewTest, setViewTest] = useState<Test | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [isMounted, setIsMounted] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const fetchTests = async () => {
    try {
      setError(null);
      const params = [`page=${currentPage}`, searchQuery ? `search=${searchQuery}` : ""]
        .filter(Boolean)
        .join("&");
      const response = await fetch(`/api/admin/tests?${params}`);
      const data: TestsResponse = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tests");
      }
      setTotalTests(data.total || 0);
      setTests(data.items || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tests");
      errorToast(err instanceof Error ? err.message : "Failed to fetch tests");
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      withLoading(fetchTests, "Loading tests...");
    }
  }, [status, currentPage]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      withLoading(fetchTests, "Searching tests...");
    }, 1000);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenActionMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleEditClick = (test: Test) => {
    setEditTest(test);
    setShowModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedTest(id);
    setOpenConfirmDeleteDialog(true);
  };

  const handleViewClick = (test: Test) => {
    setViewTest(test);
    setShowViewModal(true);
  };

  const handleDeleteTest = async () => {
    try {
      await withLoading(async () => {
        const response = await fetch(`/api/admin/tests`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedTest }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete test");
        }
        setOpenConfirmDeleteDialog(false);
        setSelectedTest("");
        await fetchTests();
      }, "Deleting test...");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete test");
    }
  };

  const toggleActionMenu = (testId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    menuButtonRefs.current.set(testId, button);

    if (openActionMenu === testId) {
      setOpenActionMenu(null);
      return;
    }

    // Get button position
    const rect = button.getBoundingClientRect();
    const isNearRightEdge = window.innerWidth - rect.right < 200;
    const isNearBottomEdge = window.innerHeight - rect.bottom < 150;

    // Calculate position based on boundaries
    const position = {
      top: isNearBottomEdge ? rect.top - 150 : rect.bottom + 5,
      left: isNearRightEdge ? rect.left - 150 : rect.left,
    };

    setMenuPosition(position);
    setOpenActionMenu(testId);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
      <div className="p-4 sm:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Test Types</h1>
          <LoadingButton
            label="Add Test Type"
            onClick={() => {
              setEditTest(null);
              setShowModal(true);
            }}
            variant="primary"
            ariaLabel="Add new test type"
          />
        </div>
        <div className="w-full pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <input
              id="test-search"
              className={`font-medium rounded-lg py-2.5 px-4 bg-white text-base appearance-none block form-input`}
              value={searchQuery}
              type="search"
              placeholder="Search tests"
              onChange={(e) => {
                setCurrentPage(0);
                setSearchQuery(e.target.value);
              }}
              aria-label="Search tests"
            />
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          {tests.length > 0 ? (
            <div className="w-full">
              <div className="rounded-xl overflow-hidden shadow">
                <div className="w-full overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-300">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-sm font-medium text-gray-800 uppercase tracking-wider"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-sm font-medium text-gray-800 uppercase tracking-wider"
                        >
                          Test Type Code
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-sm font-medium text-gray-800 uppercase tracking-wider"
                        >
                          Matrix Type
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-sm font-medium text-gray-800 uppercase tracking-wider w-24"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tests.map((test) => (
                        <tr key={test.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{test.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{test.test_code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {test.matrix_types?.join(", ") || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <LoadingButton
                                label="View"
                                onClick={() => handleViewClick(test)}
                                variant="outline-primary"
                                icon={<FiEye className="text-lg" />}
                                ariaLabel={`View test ${test.name}`}
                              />
                              <LoadingButton
                                label="Edit"
                                onClick={() => handleEditClick(test)}
                                variant="outline-primary"
                                icon={<FiEdit className="text-lg" />}
                                ariaLabel={`Edit test ${test.name}`}
                              />
                              <LoadingButton
                                label="Delete"
                                onClick={() => handleDeleteClick(test.id)}
                                variant="danger"
                                icon={<ImBin className="text-lg" />}
                                ariaLabel={`Delete test ${test.name}`}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {totalPages > 1 && (
                <div className="p-5">
                  <Pagination
                    activePage={currentPage || 0}
                    setActivePage={handlePageChange}
                    numberOfPage={totalPages}
                    numberOfRecords={totalTests}
                    itemsPerPage={10}
                  />
                </div>
              )}
            </div>
          ) : isLoading ? (
            <LoadingSpinner />
          ) : (
            <Card className="p-4 bg-white !shadow-none rounded-xl">
              <div className="flex items-center justify-center h-64">
                <span className="text-lg font-semibold text-gray-500">No tests found</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {isMounted && showModal && (
        <AddEditTestModal
          open={showModal}
          test={editTest}
          close={() => {
            setShowModal(false);
            setEditTest(null);
          }}
          onSaved={async () => {
            setShowModal(false);
            setEditTest(null);
            await fetchTests();
          }}
        />
      )}

      {isMounted && showViewModal && viewTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">{viewTest.name}</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewTest(null);
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close view modal"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Test Type Code</h3>
                <p className="mt-1">{viewTest.test_code}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Matrix Types</h3>
                <p className="mt-1">{viewTest.matrix_types?.join(", ") || "-"}</p>
              </div>
              {viewTest.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{viewTest.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isMounted && openConfirmDeleteDialog && (
        <ConfirmationModal
          open={openConfirmDeleteDialog}
          setOpenModal={setOpenConfirmDeleteDialog}
          onConfirm={handleDeleteTest}
          processing={isLoading}
          message="Are you sure you want to delete this test type? This action cannot be undone."
          buttonText="Delete"
          whiteButtonText="Cancel"
        />
      )}
    </>
  );
}
