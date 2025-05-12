'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "../sample-form.css";
import Link from "next/link";
import { mockStorage, mockTests } from "../../../mockData";

export default function InspectionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isOffline, setIsOffline] = useState(false);
  const [showAddAnotherPopup, setShowAddAnotherPopup] = useState(false);
  const [formData, setFormData] = useState({
    accountNumber: '',
    matrixType: '',
    samplePrivacy: '',
    pwsId: '',
    sampleId: '',
    source: '',
    sampleType: '',
    compliance: '',
    testSelection: [] as string[],
    chlorineResidual: '',
    originalSampleDate: '',
    isRepeatSample: false,
    gpsLocation: {
      lat: '',
      lng: '',
    },
    timestamp: new Date().toISOString(),
    remarks: ''
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="inspection-detail-page">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6">
              <div className="d-flex justify-content-between align-items-center py-3">
                <div className="d-flex align-items-center">
                  <button
                    className="btn btn-link me-3"
                    onClick={() => router.back()}
                  >
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <h1 className="h4 mb-0">Inspection Details</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6">
              <div className="section">
                <div className="section-header">
                  <h2>Sample Information</h2>
                  <i className="bi bi-chevron-down"></i>
                </div>
                <div className="section-content">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Sample ID</label>
                      <span>{formData.sampleId}</span>
                    </div>
                    <div className="info-item">
                      <label>Matrix Type</label>
                      <span>{formData.matrixType}</span>
                    </div>
                    <div className="info-item">
                      <label>Sample Privacy</label>
                      <span>{formData.samplePrivacy}</span>
                    </div>
                    <div className="info-item">
                      <label>PWS ID</label>
                      <span>{formData.pwsId}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <h2>Source & Details</h2>
                  <i className="bi bi-chevron-down"></i>
                </div>
                <div className="section-content">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Source</label>
                      <span>{formData.source}</span>
                    </div>
                    <div className="info-item">
                      <label>Sample Type</label>
                      <span>{formData.sampleType}</span>
                    </div>
                    <div className="info-item">
                      <label>Compliance</label>
                      <span>{formData.compliance}</span>
                    </div>
                    <div className="info-item">
                      <label>Chlorine Residual</label>
                      <span>{formData.chlorineResidual}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <h2>Test Selection</h2>
                  <i className="bi bi-chevron-down"></i>
                </div>
                <div className="section-content">
                  <div className="test-chips">
                    {formData.testSelection.map((test) => (
                      <div key={test} className="test-chip">
                        {test}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <h2>Location & Time</h2>
                  <i className="bi bi-chevron-down"></i>
                </div>
                <div className="section-content">
                  <div className="map-preview">
                    <i className="bi bi-geo-alt"></i>
                    <span>
                      {formData.gpsLocation.lat
                        ? `${formData.gpsLocation.lat}° N, ${formData.gpsLocation.lng}° W`
                        : "Location not available"}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Date/Time</label>
                    <span>{new Date(formData.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <h2>Additional Remarks</h2>
                  <i className="bi bi-chevron-down"></i>
                </div>
                <div className="section-content">
                  <div className="info-item">
                    <span>{formData.remarks || "No remarks added"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 