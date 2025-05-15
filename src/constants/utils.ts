import { SampleSourceType } from "./enums";

export const potableSourcesOptions = [
  SampleSourceType.Well,
  SampleSourceType.PlantTap,
  SampleSourceType.Distribution,
  SampleSourceType.RawWater,
  SampleSourceType.Reservoir,
  SampleSourceType.Spring,
  SampleSourceType.Surface,
];

export const wastewaterSourcesOptions = [
  SampleSourceType.Lagoon,
  SampleSourceType.Influent,
  SampleSourceType.Effluent,
];
