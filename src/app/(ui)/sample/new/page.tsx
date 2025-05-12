'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "../sample-form.css";
import Link from "next/link";
import { Database } from "@/types/supabase";
type Sample = Database["public"]["Tables"]["samples"]["Row"];

interface Account {
  id: string;
  name: string;
}
interface TestType {
  id: string;
  name: string;
}

export default function NewSamplePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isOffline, setIsOffline] = useState(false);
  const [showAddAnotherPopup, setShowAddAnotherPopup] = useState(false);
  const [formData, setFormData] = useState<Partial<Sample>>({
    project_id: '',
    agency_id: '',
    account_id: '',
    created_by: '',
    pws_id: '',
    matrix_type: '',
    latitude: undefined,
    longitude: undefined,
    sample_collected_at: '',
    temperature: undefined,
    notes: '',
    status: 'pending',
    pass_fail_notes: '',
    attachment_url: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [testTypes, setTestTypes] = useState<TestType[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    // Check online status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    // Get GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      });
    }

    // Fetch accounts from API
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/accounts");
        const data = await res.json();
        setUserAccounts(data.accounts || []);
      } catch (e) {
        setUserAccounts([]);
      }
    };
    fetchAccounts();

    // Fetch test types from API
    const fetchTestTypes = async () => {
      try {
        const res = await fetch("/api/test-types");
        const data = await res.json();
        setTestTypes(data.testTypes || []);
      } catch (e) {
        setTestTypes([]);
      }
    };
    fetchTestTypes();

    if (session?.user?.agency_id) {
      setFormData(prev => ({
        ...prev,
        agency_id: session.user.agency_id
      }));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [status, router, session]);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const submission = {
        ...formData,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        savedAt: new Date().toISOString()
      };
      const res = await fetch("/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission)
      });
      if (!res.ok) throw new Error("Failed to submit sample");
      router.push("/home");
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit. Please try again.');
    }
  };

  const handleSaveDraft = async () => {
    try {
      const draft = {
        ...formData,
        status: 'draft',
        savedAt: new Date().toISOString(),
      };
      const res = await fetch("/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      });
      if (!res.ok) throw new Error("Failed to save draft");
      router.push("/home");
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    }
  };

  const handleAddAnother = (retainDetails: boolean) => {
    if (retainDetails) {
      // Retain specific details
      const retainedData = {
        matrix_type: formData.matrix_type,
        latitude: formData.latitude,
        longitude: formData.longitude,
        sample_collected_at: formData.sample_collected_at,
        temperature: formData.temperature,
        notes: formData.notes,
        pass_fail_notes: formData.pass_fail_notes,
        attachment_url: formData.attachment_url,
      };
      setFormData({
        ...formData,
        ...retainedData,
        account_id: '',
        pws_id: '',
        project_id: '',
        agency_id: '',
        created_by: '',
        status: 'pending',
        updated_at: new Date().toISOString(),
      });
    } else {
      // Start fresh
      setFormData({
        project_id: '',
        agency_id: '',
        account_id: '',
        created_by: '',
        pws_id: '',
        matrix_type: '',
        latitude: undefined,
        longitude: undefined,
        sample_collected_at: '',
        temperature: undefined,
        notes: '',
        status: 'pending',
        pass_fail_notes: '',
        attachment_url: '',
        updated_at: new Date().toISOString(),
      });
    }
    setCurrentStep(1);
    setShowAddAnotherPopup(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-section">
            <h2 className="h5 mb-3">Account & Sample Information</h2>
            
            <div className="mb-2">
              <label className="form-label">Account Number</label>
              <select
                className="form-select"
                value={formData.account_id ?? ""}
                onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                required
              >
                <option value="">Select Account</option>
                {userAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.id} - {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Matrix Type</label>
              <select
                className="form-select"
                value={formData.matrix_type ?? ""}
                onChange={(e) => setFormData({...formData, matrix_type: e.target.value})}
              >
                <option value="">Select Matrix Type</option>
                <option value="Potable Water">Potable Water</option>
                <option value="Wastewater">Wastewater</option>
                <option value="Non-potable Water">Non-potable Water</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">PWS ID</label>
              <input
                type="text"
                className="form-control"
                value={formData.pws_id ?? ""}
                onChange={(e) => setFormData({...formData, pws_id: e.target.value})}
                placeholder="Enter PWS ID"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Sample ID</label>
              <input
                type="text"
                className="form-control"
                value={formData.project_id ?? ""}
                onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                placeholder="Enter Sample ID"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-section">
            <h2 className="h5 mb-4">Location & Time</h2>

            <div className="mb-3">
              <label className="form-label">GPS Location</label>
              <div className="form-control bg-light">
                {formData.latitude ? 
                  `${formData.latitude}° N, ${formData.longitude}° W` :
                  'Acquiring location...'
                }
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Date/Timestamp</label>
              <div className="form-control bg-light">
                {formData.created_at ? new Date(formData.created_at).toLocaleString() : ""}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-section">
            <h2 className="h5 mb-4">Temperature</h2>

            <div className="mb-3">
              <label className="form-label">Temperature</label>
              <input
                type="number"
                className="form-control"
                value={formData.temperature ?? ""}
                onChange={(e) => setFormData({...formData, temperature: e.target.value === '' ? undefined : Number(e.target.value)})}
                placeholder="Enter temperature"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="form-section">
            <h2 className="h5 mb-4">Notes</h2>

            <div className="mb-3">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                rows={4}
                value={formData.notes ?? ""}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Enter any additional notes"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="form-section">
            <h2 className="h5 mb-4">Pass/Fail Notes</h2>

            <div className="mb-3">
              <label className="form-label">Pass/Fail Notes</label>
              <textarea
                className="form-control"
                rows={4}
                value={formData.pass_fail_notes ?? ""}
                onChange={(e) => setFormData({...formData, pass_fail_notes: e.target.value})}
                placeholder="Enter pass/fail notes"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
    <div className="Sample-form-page">
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
                  <h1 className="h4 mb-0">New Sample</h1>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="step-indicator">
                    Step {currentStep} of 5
                  </div>
                  <div className="dropdown">
                    <button 
                      className="btn btn-link p-0"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-three-dots-vertical fs-4"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <button 
                          className="dropdown-item"
                          onClick={() => {
                            // Handle save draft
                            handleSaveDraft();
                          }}
                        >
                          <i className="bi bi-save me-2"></i>
                          Save as Draft
                        </button>
                      </li>
                      {currentStep === 5 && (
                        <li>
                          <button 
                            className="dropdown-item"
                            onClick={() => {
                              // Handle submit
                              handleSubmit();
                            }}
                          >
                            <i className="bi bi-check-circle me-2"></i>
                            Submit Sample
                          </button>
                        </li>
                      )}
                      <li>
                        <button 
                          className="dropdown-item"
                          onClick={() => {
                            // Handle new sample
                            if (currentStep === 5) {
                              // Logic to start new sample while retaining some values
                              const retainedData = {
                                matrix_type: formData.matrix_type,
                                latitude: formData.latitude,
                                longitude: formData.longitude,
                                sample_collected_at: formData.sample_collected_at,
                                temperature: formData.temperature,
                                notes: formData.notes,
                                pass_fail_notes: formData.pass_fail_notes,
                                attachment_url: formData.attachment_url,
                              };
                              setFormData({
                                ...formData,
                                ...retainedData,
                                account_id: '',
                                pws_id: '',
                                project_id: '',
                                agency_id: '',
                                created_by: '',
                                status: 'pending',
                                updated_at: new Date().toISOString(),
                              });
                              setCurrentStep(1);
                            }
                          }}
                        >
                          <i className="bi bi-plus-circle me-2"></i>
                          Add Another Sample
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6">
              <div className="progress-steps">
                <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                  <div className="step-number">1</div>
                  <div className="step-label">Account & Sample Info</div>
                </div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <div className="step-label">Location & Time</div>
                </div>
                <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                  <div className="step-number">3</div>
                  <div className="step-label">Temperature</div>
                </div>
                <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
                  <div className="step-number">4</div>
                  <div className="step-label">Notes</div>
                </div>
                <div className={`step ${currentStep >= 5 ? 'active' : ''}`}>
                  <div className="step-number">5</div>
                  <div className="step-label">Pass/Fail Notes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Banner */}
      {isOffline && (
        <div className="offline-banner">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-md-6">
                <i className="bi bi-wifi-off me-2"></i>
                Sample will sync once connected
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6">
              {renderStep()}
            </div>
          </div>
        </div>
      </main>

      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6">
              {currentStep === 5 ? (
                <>
                  {/* Submit button (full width) */}
                  <button
                    type="button"
                    className="btn btn-success w-100 mb-2"
                    onClick={handleSubmit}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Submit
                  </button>
                  
                  {/* Previous and Submit+Add Another in a row */}
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary flex-grow-1"
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Previous
                    </button>
                    <button
                      type="button"
                      className="btn btn-info flex-grow-1 text-white"
                      onClick={() => {
                        handleSubmit();
                        setShowAddAnotherPopup(true);
                      }}
                    >
                      Submit & Add Another
                    </button>
                  </div>
                </>
              ) : (
                // Regular navigation for other steps
                <div className="d-flex gap-2">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary flex-grow-1"
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Previous
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-success flex-grow-1"
                    onClick={() => setCurrentStep(currentStep + 1)}
                  >
                    <i className="bi bi-arrow-right ms-2"></i>
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Another Sample Popup */}
      {showAddAnotherPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Another Sample</h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setShowAddAnotherPopup(false)}
              ></button>
            </div>
            <div className="modal-body">
              <p className="text-center mb-4">
                Would you like to add a new sample using the same details as the previous one or start fresh?
              </p>
              <div className="d-flex flex-column gap-3">
                <button
                  type="button"
                  className="btn btn-success btn-lg w-100"
                  onClick={() => handleAddAnother(true)}
                >
                  <i className="bi bi-clipboard me-2"></i>
                  Retain Previous Details
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-lg w-100"
                  onClick={() => handleAddAnother(false)}
                >
                  <i className="bi bi-file-earmark me-2"></i>
                  Start Fresh
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-link text-secondary"
                onClick={() => setShowAddAnotherPopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 