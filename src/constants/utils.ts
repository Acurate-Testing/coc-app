import { SampleSourceType, SampleType } from "./enums";

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
export const potableWaterSampleTypeOptions = [
  SampleType.Construction,
  SampleType.Downstream,
  SampleType.Upstream,
  SampleType.Enforcement,
  SampleType.Repeat,
  SampleType.RoutineSample,
  SampleType.Untreated,
  SampleType.Other,
];
export const otherSampleTypeOptions = [SampleType.Composite, SampleType.Grab];
