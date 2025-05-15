"use client";

import { useSession } from "next-auth/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Database } from "@/types/supabase";
import { MultiSelect } from "react-multi-select-component";
import {
  County,
  MatrixType,
  PrivacyPolicy,
  SampleType,
} from "@/constants/enums";
import {
  potableSourcesOptions,
  wastewaterSourcesOptions,
} from "@/constants/utils";
import LoadingSpinner from "../LoadingSpinner";
import { Sample } from "@/types/sample";
import { Button } from "@/stories/Button/Button";
// type Sample = Database["public"]["Tables"]["samples"]["Row"];

interface Account {
  id: string;
  name: string;
}
interface TestType {
  id: string;
  name: string;
}

export default function SampleForm() {
  // "Pass/Fail Notes",
  const steps = [
    "Account & Sample Info",
    "Location & Time",
    "Temperature",
    "Notes",
  ];
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(1);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAddAnotherPopup, setShowAddAnotherPopup] = useState(false);
  const [formData, setFormData] = useState<Partial<Sample>>({
    project_id: "",
    agency_id: null,
    account_id: null,
    created_by: null,
    pws_id: "",
    source: "",
    matrix_type: "",
    sample_type: "",
    chlorine_residual: "",
    sample_privacy: null,
    compliance: null,
    sample_location: "",
    coc_transfers: [],
    test_types: [],
    latitude: undefined,
    longitude: undefined,
    temperature: undefined,
    notes: "",
    status: "pending",
    pass_fail_notes: "",
    attachment_url: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [selectedTests, setSelectedTests] = useState<TestType[]>([]);
  const editMode = pathname.includes("edit");
  const sampleId = params?.sampleId as string;

  const getFilteredSources = () => {
    if (formData.matrix_type === MatrixType.PotableWater)
      return potableSourcesOptions;
    if (formData.matrix_type === MatrixType.Wastewater)
      return wastewaterSourcesOptions;
    return [];
  };

  const fetchTestTypes = async () => {
    try {
      const res = await fetch("/api/test-types");
      const data = await res.json();
      setTestTypes(data.testTypes || []);
    } catch (error) {
      console.error("Error fetching test types:", error);
      setTestTypes([]);
    }
  };

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
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
      });
    }

    // Fetch accounts from API
    // const fetchAccounts = async () => {
    //   try {
    //     const res = await fetch("/api/accounts");
    //     const data = await res.json();
    //     setUserAccounts(data.accounts || []);
    //   } catch (e) {
    //     setUserAccounts([]);
    //   }
    // };
    // fetchAccounts();

    // Fetch test types from API
    // const fetchTestTypes = async () => {
    //   try {
    //     const res = await fetch("/api/test-types");
    //     const data = await res.json();
    //     setTestTypes(data.testTypes || []);
    //   } catch (e) {
    //     setTestTypes([]);
    //   }
    // };
    // fetchTestTypes();
    if (session?.user?.agency_id) {
      setFormData((prev) => ({
        ...prev,
        // coc_transfers:
        //   formData.coc_transfers?.[formData.coc_transfers.length - 1]
        //     ?.received_by || "",
        created_by: session?.user?.id,
        agency_id: session.user.agency_id,
      }));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [status, router, session]);

  useEffect(() => {
    fetchTestTypes();
  }, []);

  const handleTestSelection = (
    selectedOptions: { label: string; value: string }[]
  ) => {
    const selectedTestTypes = selectedOptions.map((option) => ({
      id: option.value,
      name: option.label,
    }));
    setSelectedTests(selectedTestTypes);
    setFormData((prev) => ({
      ...prev,
      test_types: selectedTestTypes,
    }));
  };

  const fetchSampleData = async () => {
    if (editMode && sampleId) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/samples/${sampleId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch sample data");
        }
        const data = await response.json();
        setFormData(data.sample);
        setSelectedTests(data.sample.test_types);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching sample:", error);
        setIsLoading(false);
        alert("Failed to load sample data. Please try again.");
      }
    }
  };

  useEffect(() => {
    fetchSampleData();
  }, [editMode, sampleId]);

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
        status: "submitted",
        saved_at: new Date().toISOString(),
      };

      const url = editMode ? `/api/samples/${sampleId}` : "/api/samples";
      console.log("Submitting to URL:", url);

      const res = await fetch(url, {
        method: editMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || `Failed to ${editMode ? "update" : "add"} sample`
        );
      }

      router.push("/samples");
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(
        `Failed to ${editMode ? "update" : "add"} sample. Please try again.`
      );
    }
  };

  const handleSaveDraft = async () => {
    try {
      const draft = {
        ...formData,
        status: "draft",
        saved_at: new Date().toISOString(),
      };

      const url = editMode
        ? `/api/samples/${params?.sampleId}`
        : "/api/samples";
      const method = editMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!res.ok)
        throw new Error(`Failed to ${editMode ? "update" : "save"} draft`);
      router.push("/smaples");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert(
        `Failed to ${editMode ? "update" : "save"} draft. Please try again.`
      );
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
        account_id: "",
        pws_id: "",
        project_id: "",
        agency_id: "",
        created_by: "",
        status: "pending",
        updated_at: new Date().toISOString(),
      });
    } else {
      // Start fresh
      setFormData({
        project_id: "",
        agency_id: "",
        account_id: "",
        created_by: "",
        pws_id: "",
        matrix_type: "",
        latitude: undefined,
        longitude: undefined,
        temperature: undefined,
        notes: "",
        status: "pending",
        pass_fail_notes: "",
        attachment_url: "",
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
          <div>
            {/* <div className="mb-3">
              <label>Account Number</label>
              <select
                className="form-input bg-white mt-1"
                value={formData.account_id ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, account_id: e.target.value })
                }
                required
              >
                <option value="">Select Account</option>
                {userAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.id} - {account.name}
                  </option>
                ))}
              </select>
            </div> */}
            {/* <div className="mb-3">
                <label>Transfer COC</label>
                <select
                  className="form-input bg-white mt-1"
                  value={formData?.coc_transfers}
                  onChange={(e) =>
                    setFormData({ ...formData, coc_transfers: e.target.value })
                  }
                >
                  <option value="">Select COC</option>
                  {userList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user?.full_name} ({user?.email})
                    </option>
                  ))}
                </select>
              </div> */}

            <div className="mb-3">
              <label>Matrix Type</label>
              <select
                className="form-input bg-white mt-1"
                value={formData.matrix_type ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, matrix_type: e.target.value })
                }
              >
                <option value="">Select Matrix Type</option>
                {Object.values(MatrixType).map((matrix) => (
                  <option key={matrix} value={matrix}>
                    {matrix}
                  </option>
                ))}
              </select>
            </div>
            {formData?.matrix_type === MatrixType.PotableWater ? (
              <div className="mb-3">
                <label>PWS ID</label>
                <input
                  type="text"
                  className="form-input mt-1"
                  value={formData.pws_id ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, pws_id: e.target.value })
                  }
                  placeholder="Enter PWS ID"
                />
              </div>
            ) : (
              ""
            )}

            <div className="mb-3">
              <label>Project ID</label>
              <input
                type="text"
                className="form-input mt-1"
                value={formData.project_id ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, project_id: e.target.value })
                }
                placeholder="Enter Project ID"
              />
            </div>
            <div className="mb-3">
              <label>Sample Type</label>
              <select
                className="form-input bg-white mt-1"
                value={formData.sample_type ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, sample_type: e.target.value })
                }
              >
                <option value="">Select Sample Type</option>
                <option value={SampleType.Composite}>
                  {SampleType.Composite}
                </option>
                <option value={SampleType.Grab}>{SampleType.Grab}</option>
              </select>
            </div>

            {(formData.matrix_type === MatrixType.PotableWater ||
              formData.matrix_type === MatrixType.Wastewater) && (
              <div className="mb-3">
                <label>Source</label>
                <select
                  className="form-input bg-white mt-1"
                  value={formData.source ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                >
                  <option value="">Select Source</option>
                  {getFilteredSources().map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.matrix_type === MatrixType.PotableWater && (
              <div className="mb-3">
                <label>Sample Privacy</label>
                <select
                  className="form-input bg-white mt-1"
                  value={formData.sample_privacy ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sample_privacy: e.target.value as PrivacyPolicy,
                    })
                  }
                >
                  <option value="">Select Sample Privacy</option>
                  <option value={PrivacyPolicy.Private}>
                    {PrivacyPolicy.Private}
                  </option>
                  <option value={PrivacyPolicy.Public}>
                    {PrivacyPolicy.Public}
                  </option>
                </select>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <div className="mb-3">
              <label>GPS Location</label>
              <div className="form-input mt-1">
                {formData.latitude
                  ? `${formData.latitude}° N, ${formData.longitude}° W`
                  : "Acquiring location..."}
              </div>
            </div>

            <div className="mb-3">
              <label>Date/Timestamp</label>
              <div className="form-input mt-1">
                {formData.created_at
                  ? new Date(formData.created_at).toLocaleString()
                  : ""}
              </div>
            </div>
            <div className="mb-3">
              <label>Sample Location</label>
              <input
                type="text"
                className="form-input mt-1"
                value={formData.sample_location ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, sample_location: e.target.value })
                }
                placeholder="Enter Sample Location"
              />
            </div>
            <div className="mb-3">
              <label>County</label>
              <select
                className="form-input bg-white mt-1"
                value={formData.county ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, county: e.target.value })
                }
              >
                <option value="">Select County</option>
                {Object.values(County).map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <div className="mb-3">
              <label>Select Tests</label>
              <MultiSelect
                className="z-2 w-full mt-1"
                options={testTypes.map((test) => ({
                  label:
                    test.name.length > 25
                      ? test.name.substring(0, 25) + "..."
                      : test.name,
                  value: test.id,
                }))}
                value={selectedTests.map((test) => ({
                  label: test.name,
                  value: test.id,
                }))}
                onChange={handleTestSelection}
                labelledBy="Select Test(s)"
                overrideStrings={{
                  selectSomeItems: "Select Test(s)",
                  search: "Search Test(s)",
                }}
              />
            </div>
            <div className="mb-3">
              <label>Temperature</label>
              <input
                type="number"
                className="form-input mt-1"
                value={formData.temperature ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    temperature:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
                placeholder="Enter temperature"
              />
            </div>
            {formData.matrix_type === MatrixType.PotableWater && (
              <div className="mb-3">
                <label>Compliance</label>
                <select
                  className="form-input bg-white mt-1"
                  value={formData.compliance ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compliance: e.target.value as "Yes" | "No",
                    })
                  }
                >
                  <option value="">Select Compliance</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            )}
            {formData.matrix_type === MatrixType.PotableWater && (
              <div className="mb-3">
                <label>Chlorine Residual</label>
                <input
                  type="text"
                  className="form-input mt-1"
                  value={formData.chlorine_residual ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chlorine_residual: e.target.value,
                    })
                  }
                  placeholder="Enter Chlorine Residual"
                />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div>
            <div className="mb-3">
              <label>Notes</label>
              <textarea
                rows={4}
                value={formData.notes ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Enter any additional notes"
                className="form-input !h-auto mt-1"
              />
            </div>
            <div className="mb-3">
              <label>Pass/Fail Notes</label>
              <textarea
                rows={4}
                value={formData.pass_fail_notes ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, pass_fail_notes: e.target.value })
                }
                placeholder="Enter pass/fail notes"
                className="form-input !h-auto mt-1"
              />
            </div>
          </div>
        );

      // case 5:
      //   return (
      //     <div className="form-section">
      //       <h2 className="text-xl font-semibold mb-4">Pass/Fail Notes</h2>

      //       <div className="mb-3">
      //         <label>Pass/Fail Notes</label>
      //         <textarea
      //           className="form-control"
      //           rows={4}
      //           value={formData.pass_fail_notes ?? ""}
      //           onChange={(e) =>
      //             setFormData({ ...formData, pass_fail_notes: e.target.value })
      //           }
      //           placeholder="Enter pass/fail notes"
      //         />
      //       </div>
      //     </div>
      //   );

      default:
        return null;
    }
  };

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="bg-white px-8 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-blue-600 font-semibold">
            Step {currentStep} of {steps.length}
          </div>
          <div className="text-sm text-gray-500">{steps[currentStep - 1]}</div>
        </div>
        <div className="flex gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full ${
                idx <= currentStep - 1 ? "bg-blue-600" : "bg-gray-200"
              }
            `}
            />
          ))}
        </div>
      </div>
      <div className="w-full min-h-[calc(100vh-152px)] mx-auto md:p-8 p-6">
        <main>{renderStep()}</main>
        {showAddAnotherPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h2 className="text-lg font-semibold">Add Another Sample</h2>
                <button onClick={() => setShowAddAnotherPopup(false)}>
                  <i className="bi bi-x text-xl text-gray-500 hover:text-gray-700"></i>
                </button>
              </div>
              <p className="text-center text-sm mb-4">
                Would you like to add a new sample using the same details as the
                previous one or start fresh?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  onClick={() => handleAddAnother(true)}
                >
                  <i className="bi bi-clipboard mr-2"></i> Retain Previous
                  Details
                </button>
                <button
                  className="border border-gray-300 py-2 rounded hover:bg-gray-100"
                  onClick={() => handleAddAnother(false)}
                >
                  <i className="bi bi-file-earmark mr-2"></i> Start Fresh
                </button>
              </div>
              <div className="text-center mt-4">
                <button
                  className="text-sm text-gray-500 hover:underline"
                  onClick={() => setShowAddAnotherPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="navigation-buttons">
        <div className="px-4">
          {currentStep === 4 ? (
            <>
              <Button
                label={editMode ? "Update" : "Submit"}
                size="large"
                type="button"
                className="w-full h-[50px] mb-3"
                onClick={handleSubmit}
              />
              <div className="flex gap-3">
                <Button
                  label="Previous"
                  size="large"
                  type="button"
                  variant="white"
                  className="w-full h-[50px] hover:bg-gray-100"
                  onClick={() => setCurrentStep(currentStep - 1)}
                />
                {!editMode && (
                  <Button
                    label="Submit & Add Another"
                    type="button"
                    size="large"
                    variant="white"
                    className="w-full h-[50px] hover:bg-gray-100"
                    onClick={() => {
                      handleSubmit();
                      setShowAddAnotherPopup(true);
                    }}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  label="Previous"
                  size="large"
                  type="button"
                  variant="white"
                  className="w-full h-[50px] hover:bg-gray-100"
                  onClick={() => setCurrentStep(currentStep - 1)}
                />
              )}

              <Button
                label="Next"
                size="large"
                className="w-full h-[50px]"
                onClick={() => setCurrentStep(currentStep + 1)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
