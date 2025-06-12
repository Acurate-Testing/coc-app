"use client";

import ConfirmationModal from "@/app/(ui)/components/Common/ConfirmationModal";
import LoadingSpinner from "@/app/(ui)/components/Common/LoadingSpinner";
import AddEditTestModal from "@/app/(ui)/components/Tests/AddEditTestModal";
import AddEditGroupModal from "@/app/(ui)/components/Tests/AddEditGroupModal";
import ViewTestGroupModal from "@/app/(ui)/components/Tests/ViewTestGroupModal";
import ViewTestTypeModal from "@/app/(ui)/components/Tests/ViewTestTypeModal";
import { Card } from "@/stories/Card/Card";
import { Pagination } from "@/stories/Pagination/Pagination";
import { Database } from "@/types/supabase";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiEdit, FiEye, FiMoreVertical } from "react-icons/fi";
import { ImBin } from "react-icons/im";

type TestGroup = Database["public"]["Tables"]["test_groups"]["Row"];
type Test = Database["public"]["Tables"]["test_types"]["Row"];

interface ApiResponse {
  groups: TestGroup[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
}

export default function AdminTestsPage() {
  const [testGroups, setTestGroups] = useState<TestGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<TestGroup[]>([]);
  const [allTests, setAllTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editTest, setEditTest] = useState<Test | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editGroup, setEditGroup] = useState<TestGroup | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] = useState<boolean>(false);
  const [viewGroupId, setViewGroupId] = useState<string | null>(null);
  const [showViewGroupModal, setShowViewGroupModal] = useState(false);
  const [viewTestType, setViewTestType] = useState<Test | null>(null);
  const [showViewTestTypeModal, setShowViewTestTypeModal] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [isMounted, setIsMounted] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupTests, setGroupTests] = useState<{ label: string; value: string }[]>([]);
  const [selectedTab, setSelectedTab] = useState<'groups' | 'tests'>('groups');

  const menuRef = useRef<HTMLDivElement>(null);

  // Filter functions
  const filterGroups = (groups: TestGroup[], query: string) => {
    if (!query.trim()) return groups;
    return groups.filter(group =>
      group.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  const filterTests = (tests: Test[], query: string) => {
    if (!query.trim()) return tests;
    return tests.filter(test =>
      test.name.toLowerCase().includes(query.toLowerCase()) ||
      test.test_code?.toLowerCase().includes(query.toLowerCase()) ||
      test.matrix_types?.some(matrix => matrix.toLowerCase().includes(query.toLowerCase()))
    );
  };

  // Apply search filter whenever searchQuery or data changes
  useEffect(() => {
    setFilteredGroups(filterGroups(testGroups, searchQuery));
  }, [testGroups, searchQuery]);

  useEffect(() => {
    setFilteredTests(filterTests(allTests, searchQuery));
  }, [allTests, searchQuery]);

  const getTestDetails = (group: TestGroup) => {
    const tests = group.test_types || [];
    const testCodes = tests.map((test) => test.test_code).filter(Boolean).join(", ") || "-";
    const matrixTypes = [...new Set(tests.flatMap((test) => test.matrix_types || []))].join(", ") || "-";

    return {
      testCodes,
      matrixTypes,
      testCount: tests.length
    };
  };

  const fetchTestGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/test-groups');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch test groups");
      }
      setTestGroups(data.groups || []);
      setTotalGroups(data.groups?.length || 0);
      setTotalPages(Math.ceil((data.groups?.length || 0) / 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch test groups");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllTests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/test-types');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tests");
      }
      setAllTests(data.testTypes || []);
    } catch (err) {
      console.error('Failed to fetch all tests:', err);
      setError(err instanceof Error ? err.message : "Failed to fetch tests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTab === 'groups') {
      fetchTestGroups();
    } else {
      fetchAllTests();
    }
    if (selectedTab === 'groups' && allTests.length === 0) {
      fetchAllTests();
    }
  }, [selectedTab]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(
      () => {
        if (selectedTab === 'groups') {
          fetchTestGroups();
        } else {
          fetchAllTests();
        }
      },
      searchQuery ? 1000 : 0
    );
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchQuery, selectedTab]);

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

  const handleEditGroupClick = (group: TestGroup) => {
    setEditGroup(group);
    setShowGroupModal(true);
    setShowAddGroupModal(false); // Ensure add modal is closed
  };

  const handleDeleteGroup = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/test-groups/${selectedItem}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete test group");
      }
      setOpenConfirmDeleteDialog(false);
      setSelectedItem("");
      fetchTestGroups();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete test group"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewGroupClick = (group: TestGroup) => {
    setViewGroupId(group.id);
    setShowViewGroupModal(true);
  };

  // Test Type Handlers
  const handleEditTestClick = (test: Test) => {
    setEditTest(test);
    setShowTestModal(true);
  };

  const handleViewTestTypeClick = (test: Test) => {
    setViewTestType(test);
    setShowViewTestTypeModal(true);
    setOpenActionMenu(null); // Close the action menu
  };

  const handleDeleteTest = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/tests`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedItem }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete test");
      }

      // Success - close modal and refresh
      setOpenConfirmDeleteDialog(false);
      setSelectedItem("");
      setOpenActionMenu(null);

      // Refresh the test types list
      await fetchAllTests();

      // If we're viewing groups and this test was part of groups, refresh groups too
      if (selectedTab === 'groups') {
        await fetchTestGroups();
      }

    } catch (error) {
      console.error('Delete test error:', error);
      setError(
        error instanceof Error ? error.message : "Failed to delete test type"
      );
      // Don't close the modal on error so user can see the error message
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedItem(id);
    setOpenConfirmDeleteDialog(true);
  };

  const toggleActionMenu = (
    groupId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const button = event.currentTarget;
    menuButtonRefs.current.set(groupId, button);

    if (openActionMenu === groupId) {
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
    setOpenActionMenu(groupId);
  };

  // When tests change or modal opens, set all as options for group modal
  useEffect(() => {
    if ((showAddGroupModal || showGroupModal) && allTests.length > 0) {
      // Only set if not already set to prevent loops
      const currentTestIds = groupTests.map(t => t.value);
      const newTestIds = allTests.map(t => t.id);

      if (JSON.stringify(currentTestIds.sort()) !== JSON.stringify(newTestIds.sort())) {
        // Only update if it's for a new group (not editing)
        if (!editGroup) {
          setGroupTests([]);
        }
      }
    }
  }, [showAddGroupModal, showGroupModal, allTests.length]);

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
      <div className="p-4 sm:p-8  mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Test Management
          </h1>
          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition"
              onClick={() => {
                setEditGroup(null);
                setGroupName("");
                setGroupTests([]);
                setShowAddGroupModal(true);
              }}
            >
              + Add Group
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition"
              onClick={() => {
                setEditTest(null);
                setShowTestModal(true);
              }}
            >
              + Add Test Type
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md">
            <button
              onClick={() => setSelectedTab('groups')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-200 shadow-sm ${selectedTab === 'groups'
                  ? 'bg-blue-700 text-white '
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              Test Groups
            </button>
            <button
              onClick={() => setSelectedTab('tests')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-200 shadow-sm ${selectedTab === 'tests'
                  ? 'bg-blue-700 text-white '
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              Test Types
            </button>
          </div>
        </div>

        <div className="w-full pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <input
              id="test-search"
              className={`font-medium rounded-lg py-2.5 px-4 bg-white text-base appearance-none block form-input`}
              value={searchQuery}
              type="search"
              placeholder={selectedTab === 'groups' ? "Search test groups" : "Search test types"}
              onChange={(e) => {
                setCurrentPage(0);
                setSearchQuery(e.target.value);
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto w-full">
            {selectedTab === 'groups' ? (
              // Test Groups Table
              filteredGroups.length > 0 ? (
                <div className="w-full">
                  <div className="rounded-xl overflow-hidden shadow">
                    <div className="w-full overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-300">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800 uppercase tracking-wider">
                              Group Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800 uppercase tracking-wider">
                              Total Test
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800 uppercase tracking-wider">
                              Test Type Code
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800 uppercase tracking-wider">
                              Matrix Type
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-sm font-medium text-gray-800 uppercase tracking-wider w-24">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredGroups.map((group) => {
                            const testDetails = getTestDetails(group);
                            return (
                              <tr key={group.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div
                                    className="font-medium text-gray-900 truncate max-w-xs"
                                    title={group.name}
                                  >
                                    {group.name}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div
                                    className="text-gray-500 truncate max-w-xs"
                                    title={`${testDetails.testCount} test types`}
                                  >
                                    {testDetails.testCount} test types
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div
                                    className="text-gray-500 truncate max-w-xs "
                                    title={testDetails.testCodes}
                                  >
                                    {testDetails.testCodes}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div
                                    className="text-gray-500 truncate max-w-xs"
                                    title={testDetails.matrixTypes}
                                  >
                                    {testDetails.matrixTypes}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <div>
                                    <button
                                      ref={(el: any) =>
                                        el &&
                                        menuButtonRefs.current.set(group.id, el)
                                      }
                                      onClick={(e) => toggleActionMenu(group.id, e)}
                                      className="inline-flex items-center justify-center p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                                    >
                                      <FiMoreVertical className="h-5 w-5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {totalPages > 1 && (
                    <div className="p-5">
                      <Pagination
                        activePage={currentPage || 0}
                        setActivePage={setCurrentPage}
                        numberOfPage={totalPages}
                        numberOfRecords={totalGroups}
                        itemsPerPage={10}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Card className="p-4 bg-white !shadow-none rounded-xl">
                  <div className="flex items-center justify-center h-64">
                    <span className="text-lg font-semibold">No test groups found</span>
                  </div>
                </Card>
              )
            ) : (
              // Test Types Table
              filteredTests.length > 0 ? (
                <div className="w-full">
                  <div className="rounded-xl overflow-hidden shadow">
                    <div className="w-full overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-300">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800 uppercase tracking-wider">
                              Test Code
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800 uppercase tracking-wider">
                              Matrix Types
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-sm font-medium text-gray-800 uppercase tracking-wider w-24">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredTests.map((test) => (
                            <tr key={test.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className="font-medium text-gray-900 truncate max-w-xs"
                                  title={test.name}
                                >
                                  {test.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className="text-gray-500 truncate max-w-xs"
                                  title={test.test_code || '-'}
                                >
                                  {test.test_code || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className="text-gray-500 truncate max-w-xs"
                                  title={test.matrix_types?.join(', ') || '-'}
                                >
                                  {test.matrix_types?.join(', ') || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div>
                                  <button
                                    ref={(el: any) =>
                                      el &&
                                      menuButtonRefs.current.set(test.id, el)
                                    }
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
                </div>
              ) : (
                <Card className="p-4 bg-white !shadow-none rounded-xl">
                  <div className="flex items-center justify-center h-64">
                    <span className="text-lg font-semibold">No test types found</span>
                  </div>
                </Card>
              )
            )}
          </div>
        )}
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
                {selectedTab === 'groups' && testGroups.find((g) => g.id === openActionMenu) && (
                  <>
                    <button
                      onClick={() => {
                        handleViewGroupClick(testGroups.find((g) => g.id === openActionMenu)!);
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
                        handleEditGroupClick(testGroups.find((g) => g.id === openActionMenu)!);
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
                {selectedTab === 'tests' && allTests.find((t) => t.id === openActionMenu) && (
                  <>
                    <button
                      onClick={() => {
                        handleViewTestTypeClick(allTests.find((t) => t.id === openActionMenu)!);
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
                        handleEditTestClick(allTests.find((t) => t.id === openActionMenu)!);
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

      {/* Test Type Modal */}
      <AddEditTestModal
        open={showTestModal}
        test={editTest}
        onSaved={fetchAllTests}
        close={() => setShowTestModal(false)}
      />

      <AddEditGroupModal
        open={showGroupModal || showAddGroupModal}
        group={editGroup ? {
          id: editGroup.id,
          name: editGroup.name,
          description: editGroup.description,
          test_type_ids: editGroup.test_type_ids,
          test_types: editGroup.test_types?.map(test => ({
            id: test.id,
            name: test.name,
            test_code: test.test_code || '',
            matrix_types: test.matrix_types,
            description: test.description
          }))
        } : null}
        onSaved={fetchTestGroups}
        close={() => {
          setShowGroupModal(false);
          setShowAddGroupModal(false);
          setEditGroup(null);
          setGroupName("");
          setGroupTests([]);
        }}
        tests={allTests}
        groupName={groupName}
        setGroupName={setGroupName}
        groupTests={groupTests}
        setGroupTests={setGroupTests}
        onGroupCreated={fetchTestGroups}
      />

      <ViewTestGroupModal
        open={showViewGroupModal}
        close={() => {
          setShowViewGroupModal(false);
          setViewGroupId(null);
        }}
        groupId={viewGroupId}
      />

      <ViewTestTypeModal
        open={showViewTestTypeModal}
        close={() => {
          setShowViewTestTypeModal(false);
          setViewTestType(null);
        }}
        testType={viewTestType}
      />

      <ConfirmationModal
        open={openConfirmDeleteDialog}
        processing={isLoading}
        onConfirm={selectedTab === 'groups' ? handleDeleteGroup : handleDeleteTest}
        setOpenModal={() => {
          setSelectedItem("");
          setOpenConfirmDeleteDialog(false);
        }}
      />
    </>
  );
}
