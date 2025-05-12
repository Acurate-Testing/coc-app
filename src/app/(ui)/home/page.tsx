'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import "./home.css";
import { Database } from "@/types/supabase";

type Sample = Database['public']['Tables']['samples']['Row'];

interface ApiResponse {
  samples: Sample[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
}

// interface Sample {
//   id: number;
//   accountNumber: string;
//   matrixType: string;
//   samplePrivacy: string;
//   pwsId: string;
//   sampleId: string;
//   source: string;
//   sampleType: string;
//   compliance: string;
//   testSelection: string[];
//   chlorineResidual: string;
//   originalSampleDate: string;
//   isRepeatSample: boolean;
//   gpsLocation: {
//     lat: string;
//     lng: string;
//   };
//   timestamp: string;
//   remarks: string;
//   status: 'draft' | 'submitted';
//   savedAt?: string;
//   submittedAt?: string;
// }

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const searchParams = new URLSearchParams({
          page: currentPage.toString(),
          search: searchQuery,
          ...(activeTab !== "All" && { status: activeTab.toLowerCase() })
        });

        const response = await fetch(`/api/samples?${searchParams}`);
        const data: ApiResponse = await response.json();

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch samples');
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setSamples(data.samples);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error('Error fetching samples:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch samples');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchSamples();
    }
  }, [status, currentPage, searchQuery, activeTab, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterOpen]);

  const filteredSamples = samples.filter((sample: Sample) => {
    const matchesSearch = 
      (sample.project_id?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (sample.pws_id?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (sample.matrix_type?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    if (activeTab === "All") return matchesSearch;
    return matchesSearch && sample.status === activeTab.toLowerCase();
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-neutral-200">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Sample['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_coc':
        return 'bg-blue-100 text-blue-800';
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'pass':
        return 'bg-emerald-100 text-emerald-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Sample['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_coc':
        return 'In Chain of Custody';
      case 'submitted':
        return 'Submitted';
      case 'pass':
        return 'Passed';
      case 'fail':
        return 'Failed';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-200">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Samples</h1>
          <button
            onClick={() => router.push('/sample/new')}
            style={{ padding: '20px' }}
            className="py-2 px-6 border border-dashed border-green-600 bg-green-50 text-green-600 rounded-lg flex items-center justify-center gap-2 hover:bg-green-100"
          >
            <span className="text-xl mr-1 align-middle">+</span>
            <span className="align-middle">New Sample</span>
          </button>
        </div>
        
        {/* Search and Filter Section */}
        <div className="flex gap-4 items-center mb-4">
          {/* Search Bar */}
          <div className="relative flex-grow">
            <input
              type="text"
              className="w-full p-3 pl-10 bg-white rounded-lg border border-gray-200"
              placeholder="Search samples..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <i className="bi bi-search"></i>
            </span>
          </div>

          {/* Bootstrap-like Filter Dropdown */}
          <div className="relative btn-group" ref={filterRef}>
            <button
              type="button"
              className="btn btn-light border border-gray-200 flex items-center gap-2 dropdown-toggle px-4 py-2 rounded-lg shadow-sm"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((open) => !open)}
            >
              <i className="bi bi-funnel text-xl text-gray-500"></i>
              <span className="text-gray-700 text-sm font-medium">
                {activeTab}
              </span>
            </button>
            {filterOpen && (
              <ul className="dropdown-menu show absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-0">
                {["All", "Pending", "In COC", "Submitted", "Pass", "Fail"].map((status) => (
                  <li key={status}>
                    <button
                      className={`dropdown-item w-full text-left px-4 py-2 text-sm ${activeTab === status ? 'bg-gray-100 font-semibold' : ''}`}
                      onClick={() => { setActiveTab(status); setFilterOpen(false); }}
                    >
                      {status}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sample Cards */}
        <div className="space-y-3">
          {filteredSamples.map((sample: Sample) => (
            <div
              key={sample.id}
              className="bg-white p-4 rounded-lg shadow-sm"
              onClick={() => router.push(`/sample/${sample.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs ${getStatusColor(sample.status)}`}>
                    {getStatusLabel(sample.status)}
                  </span>
                </div>
                <button className="text-gray-400">
                  <i className="bi bi-three-dots-vertical"></i>
                </button>
              </div>

              <h3 className="font-semibold mb-1">Project ID: {sample.project_id}</h3>
              
              <div className="flex items-center text-gray-600 mb-2">
                <i className="bi bi-water me-2"></i>
                <span>{sample.matrix_type || 'N/A'}</span>
              </div>

              <div className="flex items-center text-gray-600 mb-2">
                <i className="bi bi-geo-alt me-2"></i>
                <span>PWS ID: {sample.pws_id || 'N/A'}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <i className="bi bi-clock me-2"></i>
                <span>{new Date(sample.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 