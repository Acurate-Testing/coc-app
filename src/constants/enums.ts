export const enum UserRole {
  LABADMIN = "lab_admin",
  USER = "user",
  AGENCY = "agency",
}
export enum MatrixType {
  PotableWater = "Potable Water",
  Wastewater = "Wastewater",
  NonPotableWater = "Non-potable Water",
  Soil = "Soil",
}

export enum SampleStatus {
  Pending = "pending",
  InCOC = "in_coc",
  Submitted = "submitted",
  Pass = "pass",
  Fail = "fail",
}

export enum SampleType {
  Composite = "Composite",
  Grab = "Grab",
}

export enum SampleSourceType {
  Well = "Well",
  PlantTap = "Plant Tap",
  Distribution = "Distribution",
  RawWater = "Raw Water",
  Reservoir = "Reservoir",
  Spring = "Spring",
  Surface = "Surface",
  Lagoon = "Lagoon",
  Influent = "Influent",
  Effluent = "Effluent",
}

export enum County {
  Benewah = "Benewah",
  Bonner = "Bonner",
  Boundary = "Boundary",
  Kootenai = "Kootenai",
  Shoshone = "Shoshone",
}
export enum PrivacyPolicy {
  Private = "Private",
  Public = "Public",
}
