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

// Use the correct Test type
type Test = Database["public"]["Tables"]["test_types"]["Row"];

interface ApiResponse {
  tests: Test[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
}

export default function AdminTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
      setIsLoading(true);
      setError(null);
      const params = [`page=${currentPage}`, searchQuery ? `search=${searchQuery}` : ""]
        .filter(Boolean)
        .join("&");
      const response = await fetch(`/api/admin/tests?${params}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tests");
      }
      setTotalTests(data.total || 0);
      setTests(data.tests || data || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [currentPage, searchQuery]);

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
      setIsLoading(true);
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
      fetchTests();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete test");
    } finally {
      setIsLoading(false);
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
      <div className="p-4 sm:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Test Types</h1>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition"
            onClick={() => {
              setEditTest(null);
              setShowModal(true);
            }}
          >
            + Add Test Type
          </button>
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
                        <tr key={test.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{test.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-500">{test.test_code || "-"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-500">
                              {test.matrix_types?.join(", ") || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div>
                              <button
                                ref={(el: any) => el && menuButtonRefs.current.set(test.id, el)}
                                onClick={(e) => toggleActionMenu(test.id, e)}
                                className="inline-flex items-center justify-center p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                              >
                                <FiMoreVertical className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {totalPages > 0 && (
                <div className="p-5">
                  <Pagination
                    activePage={currentPage || 0}
                    setActivePage={setCurrentPage}
                    numberOfPage={totalPages}
                    numberOfRecords={totalTests}
                    itemsPerPage={10}
                  />
                </div>
              )}
            </div>
          ) : (
            <Card className="p-4 bg-white !shadow-none rounded-xl">
              <div className="flex items-center justify-center h-64">
                <span className="text-lg font-semibold">No tests found</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Dropdown menu portal */}
      {isMounted &&
        openActionMenu &&
        createPortal(
          <div
            className="fixed z-50"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
            ref={menuRef}
          >
            <div className="mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
              <div className="py-1" role="menu" aria-orientation="vertical">
                {tests.find((t) => t.id === openActionMenu) && (
                  <>
                    <button
                      onClick={() => {
                        handleViewClick(tests.find((t) => t.id === openActionMenu)!);
                        setOpenActionMenu(null);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                      role="menuitem"
                    >
                      <FiEye className="mr-3 h-5 w-5" />
                      View
                    </button>
                    <button
                      onClick={() => {
                        handleEditClick(tests.find((t) => t.id === openActionMenu)!);
                        setOpenActionMenu(null);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                      role="menuitem"
                    >
                      <FiEdit className="mr-3 h-5 w-5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteClick(openActionMenu);
                        setOpenActionMenu(null);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 hover:text-red-700 w-full text-left"
                      role="menuitem"
                    >
                      <ImBin className="mr-3 h-5 w-5" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      <AddEditTestModal
        open={showModal}
        test={editTest}
        onSaved={fetchTests}
        close={() => setShowModal(false)}
      />
      {/* View Test Modal */}
      {viewTest && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
            showViewModal ? "" : "hidden"
          }`}
        >
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowViewModal(false)}
          ></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-10 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Test Details</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowViewModal(false)}
              >
                &times;
              </button>
            </div>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-base text-gray-900">{viewTest.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-base text-gray-900">{viewTest.description || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Test Code</dt>
                <dd className="mt-1 text-base text-gray-900">{viewTest.test_code || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Matrix Types</dt>
                <dd className="mt-1 text-base text-gray-900">
                  {viewTest.matrix_types?.join(", ") || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-base text-gray-900">
                  {viewTest.created_at ? new Date(viewTest.created_at).toLocaleString() : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-500">{viewTest.id}</dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        open={openConfirmDeleteDialog}
        processing={isLoading}
        onConfirm={handleDeleteTest}
        setOpenModal={() => {
          setSelectedTest("");
          setOpenConfirmDeleteDialog(false);
        }}
      />
    </>
  );
}
