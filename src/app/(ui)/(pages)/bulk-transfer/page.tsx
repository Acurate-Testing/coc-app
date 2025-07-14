"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/stories/Button/Button';
import { SampleStatus } from '@/constants/enums';
import { IoSearch } from 'react-icons/io5';
import { Sample } from '@/types/sample';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { errorToast, successToast } from '@/hooks/useCustomToast';
import { User } from '@/types/user';
import { format } from 'date-fns';
import { Card } from '@/stories/Card/Card';
import { Label } from '@/stories/Label/Label';
import { Chip } from '@/stories/Chip/Chip';
import { FaLocationDot } from 'react-icons/fa6';
import { GoClock } from 'react-icons/go';
import { IoFlask } from 'react-icons/io5';
import { Pagination } from '@/stories/Pagination/Pagination';
import BulkTransferModal from '../../components/BulkTransferModal/BulkTransferModal';

function BulkTransferPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalSamples, setTotalSamples] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch samples with status pending or in_coc
  const fetchSamples = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/samples?status=${SampleStatus.Pending},${SampleStatus.InCOC}&search=${searchQuery}&page=${currentPage}&limit=${itemsPerPage}`
      );
      const data = await response.json();
      setSamples(data.samples || []);
      setTotalSamples(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      errorToast("Failed to fetch samples");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users for transfer dropdown
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users?active=true");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      errorToast("Failed to fetch users");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSamples();
    fetchUsers();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(0); // Reset to first page when searching
      fetchSamples();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSamples(samples.map(sample => sample.id as string));
    } else {
      setSelectedSamples([]);
    }
  };

  const handleSelectSample = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSamples(prev => [...prev, id]);
    } else {
      setSelectedSamples(prev => prev.filter(sampleId => sampleId !== id));
    }
  };

  // Convert data URL to File object (helper function)
  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleInitiateTransfer = () => {
    if (!selectedUser) {
      errorToast("Please select a recipient");
      return;
    }

    if (selectedSamples.length === 0) {
      errorToast("Please select at least one sample");
      return;
    }

    // Open the transfer modal
    setShowTransferModal(true);
  };

  const handleBulkTransfer = async (signatureData: string, photo: string | null, timestamp: Date) => {
    if (!selectedUser) {
      errorToast("Please select a recipient");
      return;
    }

    if (selectedSamples.length === 0) {
      errorToast("Please select at least one sample");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create form data for the COC transfer
      const formData = new FormData();
      formData.append("sampleIds", JSON.stringify(selectedSamples));
      formData.append("receivedBy", selectedUser);
      formData.append("timestamp", timestamp.toISOString());
      formData.append("signature", signatureData);
      if (photo) {
        formData.append("file", dataURLtoFile(photo, "bulk-handoff-photo.jpg"));
      }
      
      const response = await fetch("/api/samples/bulk-transfer", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to transfer samples");
      }

      const data = await response.json();
      successToast(`Successfully transferred ${data.transferCount || selectedSamples.length} samples`);
      
      // Close the modal and refresh the sample list
      setShowTransferModal(false);
      fetchSamples();
      setSelectedSamples([]);
    } catch (error) {
      errorToast(error instanceof Error ? error.message : "Failed to transfer samples");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pending";
      case "in_coc": return "In COC";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "!bg-[#FEF3C7] !text-[#B45309]";
      case "in_coc": return "!bg-[#DBEAFE] !text-[#1D4ED8]";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Bulk Sample Transfer</h1>
        <p className="text-gray-600 mt-2">Select multiple samples to transfer them at once</p>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <IoSearch className="text-themeColor h-6 w-6 absolute z-10 top-1/2 transform -translate-y-1/2 left-4" />
          <input
            className="font-medium rounded-lg sm:max-w-[400px] py-3 px-4 bg-white text-base appearance-none block w-full !pl-14 form-input h-[60px]"
            value={searchQuery}
            type="search"
            placeholder="Search samples"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-1/3">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="form-input bg-white h-[60px] w-full"
          >
            <option value="">Select Recipient</option>
            <option value={process.env.NEXT_PUBLIC_LAB_ADMIN_ID}>LAB ADMIN</option>
            {users
              .filter(user => user.id !== session?.user?.id)
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
          </select>
        </div>
        
        <Button
          label="Transfer Selected"
          size="large"
          className="h-[60px]"
          onClick={handleInitiateTransfer}
          disabled={isSubmitting || selectedSamples.length === 0 || !selectedUser}
        />
      </div>

      {samples.length > 0 ? (
        <>
          <div className="mb-4 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-5 w-5 text-blue-600 border-gray-300 rounded mr-3"
                checked={selectedSamples.length === samples.length && samples.length > 0}
                onChange={handleSelectAll}
              />
              <span className="font-medium">Select All ({samples.length})</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {samples.map((sample) => (
              <Card key={sample.id} className="p-4 bg-white !shadow-none rounded-xl border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded mr-4 mt-1"
                      checked={selectedSamples.includes(sample.id as string)}
                      onChange={(e) => handleSelectSample(sample.id as string, e.target.checked)}
                    />
                    <div>
                      <div className="flex flex-row items-center md:gap-4 gap-2 mb-2">
                        <div>
                          <Label
                            label={`#${sample.project_id || "N/A"}`}
                            className="text-lg font-semibold"
                          />
                        </div>
                        <div>
                          <Chip
                            value={getStatusLabel(sample?.status as string)}
                            className={`${getStatusColor(sample?.status as string)} capitalize flex items-center justify-center py-1.5 w-fit rounded-full text-sm`}
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
                          icon={<FaLocationDot className="text-lg text-gray-600" />}
                        />
                        <Label
                          label={sample?.sample_location || "—"}
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
                          label={sample?.created_at && format(new Date(sample.created_at), "yyyy-MM-dd HH:mm")}
                          className="text-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {totalPages > 0 && (
            <div className="mt-6">
              <Pagination
                activePage={currentPage}
                setActivePage={setCurrentPage}
                numberOfPage={totalPages}
                numberOfRecords={totalSamples}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No samples found with pending or in-coc status</p>
        </div>
      )}

      {/* Bulk Transfer Modal */}
      <BulkTransferModal 
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        selectedUser={selectedUser}
        users={users}
        selectedSamples={selectedSamples}
        onTransfer={handleBulkTransfer}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default BulkTransferPage;