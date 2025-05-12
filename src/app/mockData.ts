// Mock data for tests
export const mockTests = [
  { id: "Bacteriological", name: "Bacteriological" },
  { id: "Chemical", name: "Chemical" },
  { id: "Physical", name: "Physical" },
];

// Sample types
export const sampleTypes = [
  "Routine Sample",
  "Untreated Source",
  "Downstream Repeat",
  "Compliance Sample",
  "Special Investigation",
];

// Default samples
const defaultSamples = {
  drafts: [
    {
      id: 1001,
      accountNumber: "ACC002",
      matrixType: "Wastewater",
      samplePrivacy: "Private",
      pwsId: "PWS456",
      sampleId: "SAMPLE002",
      source: "Surface",
      sampleType: "Composite",
      compliance: "No",
      testSelection: ["Chemical", "Physical"],
      chlorineResidual: "0.7",
      originalSampleDate: "",
      isRepeatSample: false,
      gpsLocation: {
        lat: "40.7589",
        lng: "-73.9851",
      },
      timestamp: new Date().toISOString(),
      remarks: "Draft sample collection",
      status: "draft" as const,
      savedAt: new Date().toISOString(),
    },
  ],
  submissions: [
    {
      id: 1,
      accountNumber: "ACC001",
      matrixType: "Potable Water",
      samplePrivacy: "Public",
      pwsId: "PWS123",
      sampleId: "SAMPLE001",
      source: "Well",
      sampleType: "Grab",
      compliance: "Yes",
      testSelection: ["Bacteriological", "Chemical"],
      chlorineResidual: "0.5",
      originalSampleDate: "",
      isRepeatSample: false,
      gpsLocation: {
        lat: "40.7128",
        lng: "-74.0060",
      },
      timestamp: new Date().toISOString(),
      remarks: "Initial sample collection",
      status: "submitted" as const,
      submittedAt: new Date().toISOString(),
    },
  ],
};

// Shared storage for samples
export const mockStorage = {
  submissions: [...defaultSamples.submissions],
  drafts: [...defaultSamples.drafts],
};

// Helper function to get all samples (both drafts and submissions)
export const getAllSamples = () => {
  return [...mockStorage.drafts, ...mockStorage.submissions].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};
