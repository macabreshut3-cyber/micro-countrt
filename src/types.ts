export type MediumType = "YPD" | "MRS";
export type ColonyClass = "yeast" | "lactobacillus" | "bacillus" | "uncertain";

export interface SampleData {
  id: string;
  sampleId: string;
  productName: string;
  samplingDate: string;
  analyst: string;
  medium: MediumType;
  dilutionFactor: number;
  platedVolume: number;
  incubationTemperature: number;
  incubationTime: number;
  memo: string;
}

export interface ColonyData {
  id: string;
  x: number;
  y: number;
  radius: number;
  area: number;
  circularity: number;
  meanBrightness: number;
  class: ColonyClass;
  isManual: boolean;
}

export interface AppState {
  step: "form" | "camera" | "calibration" | "detection" | "review" | "result";
  sampleData: SampleData | null;
  rawImageSrc: string | null;
  calibratedImageSrc: string | null; // Cropped & adjusted
  colonies: ColonyData[];
  aiAnalysisText: string | null;
  qcWarnings: string[];
}
