"use client";

import { useSession } from "next-auth/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MultiSelect } from "react-multi-select-component";
import {
  County,
  MatrixType,
  PrivacyPolicy,
  SampleStatus,
  SampleType,
} from "@/constants/enums";
import {
  otherSampleTypeOptions,
  potableSourcesOptions,
  potableWaterSampleTypeOptions,
  wastewaterSourcesOptions,
} from "@/constants/utils";
import LoadingSpinner from "../Common/LoadingSpinner";
import { Sample, sampleInitialValues } from "@/types/sample";
import { Button } from "@/stories/Button/Button";
import AddAnotherSampleModal from "./AddAnotherSampleModal";
import { errorToast, successToast } from "@/hooks/useCustomToast";
import moment from "moment";
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
    "Temperature & Notes",
    "Review Details",
  ];
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(1);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAddAnotherPopup, setShowAddAnotherPopup] =
    useState<boolean>(false);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [formData, setFormData] =
    useState<Partial<Sample>>(sampleInitialValues);

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
  const getFilteredSampleTypes = () => {
    if (formData.matrix_type === MatrixType.PotableWater)
      return potableWaterSampleTypeOptions;
    return otherSampleTypeOptions;
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

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      setUserAccounts(data.accounts || []);
    } catch (e) {
      setUserAccounts([]);
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
    // if (navigator.geolocation) {
    //   navigator.geolocation.getCurrentPosition((position) => {
    //     setFormData((prev) => ({
    //       ...prev,
    //       latitude: position.coords.latitude,
    //       longitude: position.coords.longitude,
    //     }));
    //   });
    // }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = Number(position.coords.latitude.toFixed(2));
        const lon = Number(position.coords.longitude.toFixed(2));

        // Set the coordinates in your state
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
        }));

        // Fetch address using OpenStreetMap Nominatim
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
          );
          const data = await response.json();

          if (data && data.display_name) {
            setFormData((prev) => ({
              ...prev,
              address: data.display_name, // Add this to your formData state
            }));
          }
        } catch (error) {
          console.error("Failed to get address:", error);
        }
      });
    }

    // Fetch accounts from API

    fetchAccounts();

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
      successToast("Sample Created Successfully");

      router.push("/samples");
    } catch (error) {
      console.error("Error submitting form:", error);
      errorToast(
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
        project_id: formData.project_id,
        agency_id: session?.user?.agency_id,
        account_id: formData.project_id || "",
        created_by: session?.user?.id,
        matrix_type: formData.matrix_type,
        matrix_name: formData.matrix_name,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address,
        sample_collected_at: formData.sample_collected_at,
        temperature: formData.temperature,
        notes: formData.notes,
      };
      setFormData({
        ...formData,
        ...retainedData,
        pws_id: "",
      });
    } else {
      // Start fresh
      setFormData(sampleInitialValues);
    }
    setCurrentStep(1);
    setShowAddAnotherPopup(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <div className="mb-3">
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
            </div>

            <div className="mb-3">
              <label>Matrix Type *</label>
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
            {formData?.matrix_type === MatrixType.Other ? (
              <div className="mb-3">
                <label>Matrix Name</label>
                <input
                  type="text"
                  className="form-input mt-1"
                  value={formData.matrix_name ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, matrix_name: e.target.value })
                  }
                  placeholder="Enter other Matrix type"
                />
              </div>
            ) : (
              ""
            )}

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
              <label>Sample Type *</label>
              <select
                className="form-input bg-white mt-1"
                value={formData.sample_type ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, sample_type: e.target.value })
                }
              >
                <option value="">Select Sample Type</option>
                {getFilteredSampleTypes().map((sampleType) => (
                  <option key={sampleType} value={sampleType}>
                    {sampleType}
                  </option>
                ))}
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
              <label>Select Tests *</label>
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
              <label>Current GPS Location</label>
              <div className="form-input h-auto bg-white mt-1">
                {formData.address ? formData.address : ""}
                {/* {formData.latitude
                  ? `${formData.latitude.toFixed(
                      2
                    )}° N, ${formData?.longitude?.toFixed(2)}° W`
                  : "Acquiring location..."} */}
              </div>
            </div>

            {/* <div className="mb-3">
              <label>Sample Date</label>
              <div className="form-input bg-white mt-1 pt-4">
                {formData.created_at
                  ? new Date(formData.created_at).toLocaleString()
                  : ""}
              </div>
            </div> */}
            <div className="mb-3">
              <label htmlFor="sampleDate">Sample Date</label>
              <input
                type="datetime-local"
                id="sampleDate"
                name="sampleDate"
                className="form-input mt-1 w-full"
                value={moment(formData.sample_collected_at).format(
                  "YYYY-MM-DDTHH:mm"
                )}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sample_collected_at: new Date(e.target.value).toISOString(),
                  }))
                }
              />
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
            <div className="mb-3">
              <label>Remark</label>
              <textarea
                rows={4}
                value={formData.notes ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Enter remarks"
                className="form-input !h-auto mt-1"
              />
            </div>
          </div>
        );

      case 4:
        return (
          //This is to show preview
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-3">
                Account & Sample Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Account Number</p>
                  <p className="font-medium">
                    {userAccounts.find((acc) => acc.id === formData.account_id)
                      ?.name ||
                      formData.account_id ||
                      "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Matrix Type</p>
                  <p className="font-medium">{formData.matrix_type}</p>
                </div>
                {formData.matrix_type === MatrixType.PotableWater && (
                  <div>
                    <p className="text-sm text-gray-600">PWS ID</p>
                    <p className="font-medium">{formData.pws_id || "-"}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Project ID</p>
                  <p className="font-medium">{formData.project_id || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sample Type</p>
                  <p className="font-medium">{formData.sample_type || "-"}</p>
                </div>
                {(formData.matrix_type === MatrixType.PotableWater ||
                  formData.matrix_type === MatrixType.Wastewater) && (
                  <div>
                    <p className="text-sm text-gray-600">Source</p>
                    <p className="font-medium">{formData.source || "-"}</p>
                  </div>
                )}
                {formData.matrix_type === MatrixType.PotableWater && (
                  <div>
                    <p className="text-sm text-gray-600">Sample Privacy</p>
                    <p className="font-medium">
                      {formData.sample_privacy || "-"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-3">
                Location & Time Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">GPS Location</p>
                  <p className="font-medium">
                    {formData.latitude
                      ? `${formData.latitude}° N, ${formData.longitude}° W`
                      : "Not available"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date/Timestamp</p>
                  <p className="font-medium">
                    {formData.created_at
                      ? new Date(formData.created_at).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sample Location</p>
                  <p className="font-medium">
                    {formData.sample_location || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">County</p>
                  <p className="font-medium">{formData.county}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Selected Tests</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTests.map((test) => (
                      <span
                        key={test.id}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                      >
                        {test.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-3">
                Temperature & Notes
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="font-medium">
                    {formData.temperature
                      ? `${formData.temperature}°C`
                      : "Not recorded"}
                  </p>
                </div>
                {formData.matrix_type === MatrixType.PotableWater && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Compliance</p>
                      <p className="font-medium">
                        {formData.compliance || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Chlorine Residual</p>
                      <p className="font-medium">
                        {formData.chlorine_residual || "Not recorded"}
                      </p>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Remarks</p>
                  <p className="font-medium mt-1">
                    {formData.notes || "No remarks"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

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
      <div
        className={`w-full ${
          currentStep === 4 && !editMode
            ? "min-h-[calc(100vh-300px)]"
            : "min-h-[calc(100vh-228px)]"
        } mx-auto md:p-8 p-6`}
      >
        <main>{renderStep()}</main>
      </div>
      <div className="navigation-buttons px-4">
        {currentStep === 4 ? (
          editMode ? (
            // Edit mode layout: Update + Previous in one row
            <div className="flex flex-row-reverse gap-4">
              <Button
                label="Update"
                size="large"
                type="button"
                className="w-full h-[50px]"
                onClick={handleSubmit}
              />
              <Button
                label="Previous"
                size="large"
                type="button"
                variant="white"
                className="w-full h-[50px] hover:bg-gray-100"
                onClick={() => setCurrentStep(currentStep - 1)}
              />
            </div>
          ) : (
            // Non-edit mode layout: Submit alone, then Previous + Submit & Add Another
            <>
              <div className="mb-3">
                <Button
                  label="Submit"
                  size="large"
                  type="button"
                  className="w-full h-[50px]"
                  onClick={handleSubmit}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  label="Previous"
                  size="large"
                  type="button"
                  variant="white"
                  className="w-full h-[50px] hover:bg-gray-100"
                  onClick={() => setCurrentStep(currentStep - 1)}
                />
                <Button
                  label="Submit & Add Another"
                  type="button"
                  size="large"
                  variant="white"
                  className="w-full h-[50px] hover:bg-gray-100"
                  onClick={() => {
                    setShowAddAnotherPopup(true);
                    // handleSubmit();
                  }}
                />
              </div>
            </>
          )
        ) : (
          // Standard layout for steps 1, 2, and 3
          <div className="flex gap-3">
            <Button
              label={currentStep > 1 ? "Previous" : "Cancel"}
              size="large"
              type="button"
              variant="white"
              className="w-full h-[50px] hover:bg-gray-100"
              onClick={() =>
                currentStep > 1
                  ? setCurrentStep(currentStep - 1)
                  : router.push("/samples")
              }
            />
            <Button
              label="Next"
              size="large"
              className="w-full h-[50px]"
              onClick={() => setCurrentStep(currentStep + 1)}
            />
          </div>
        )}
      </div>
      <AddAnotherSampleModal
        open={showAddAnotherPopup}
        close={() => setShowAddAnotherPopup(false)}
        onChooseOption={(retainPrevious) =>
          retainPrevious ? handleAddAnother(retainPrevious) : handleSubmit()
        }
      />
    </>
  );
}
