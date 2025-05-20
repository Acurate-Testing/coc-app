"use client";

import { useEffect, useState } from "react";
import { Database } from "@/types/supabase";
import { Button } from "@/stories/Button/Button";
import { Card } from "@/stories/Card/Card";
import { Pagination } from "@/stories/Pagination/Pagination";
import { FiEdit } from "react-icons/fi";
import { ImBin } from "react-icons/im";
import ConfirmationModal from "@/app/(ui)/components/Common/ConfirmationModal";
import LoadingSpinner from "@/app/(ui)/components/Common/LoadingSpinner";
import AddEditTestModal from "@/app/(ui)/components/Tests/AddEditTestModal";

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
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] =
    useState<boolean>(false);

  const fetchTests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = [
        `page=${currentPage}`,
        searchQuery ? `search=${searchQuery}` : "",
      ]
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
  }, [currentPage]);

  useEffect(() => {
    if (searchQuery !== "") {
      const delayDebounceFn = setTimeout(() => {
        fetchTests();
      }, 1000);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery]);

  const handleEditClick = (test: Test) => {
    setEditTest(test);
    setShowModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedTest(id);
    setOpenConfirmDeleteDialog(true);
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
      setError(
        error instanceof Error ? error.message : "Failed to delete test"
      );
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Tests
          </h1>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition"
            onClick={() => {
              setEditTest(null);
              setShowModal(true);
            }}
          >
            + Add Test
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
        <div className="overflow-x-auto">
          {tests.length > 0 ? (
            <>
              {tests.map((test) => (
                <div key={test.id} className="mb-4">
                  <Card className="p-4 bg-white !shadow-none rounded-xl flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-lg">{test.name}</div>
                      <div className="text-gray-500 text-sm mb-2">
                        {test.description || "-"}
                      </div>
                      <div className="text-xs text-gray-400">
                        Code: {test.id}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        className="min-w-[110px]"
                        onClick={() => handleEditClick(test)}
                        label="Edit"
                        icon={<FiEdit className="text-lg" />}
                      />
                      <Button
                        className="min-w-[110px]"
                        onClick={() => handleDeleteClick(test.id)}
                        label="Delete"
                        variant="danger"
                        icon={<ImBin className="text-lg" />}
                      />
                    </div>
                  </Card>
                </div>
              ))}
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
            </>
          ) : (
            <Card className="p-4 bg-white !shadow-none rounded-xl">
              <div className="flex items-center justify-center h-64">
                <span className="text-lg font-semibold">No tests found</span>
              </div>
            </Card>
          )}
        </div>
      </div>
      <AddEditTestModal
        open={showModal}
        test={editTest}
        onSaved={fetchTests}
        close={() => setShowModal(false)}
      />
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
