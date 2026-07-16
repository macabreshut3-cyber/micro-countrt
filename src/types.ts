export type MediumType = "YPD" | "MRS";
export type ColonyClass = "yeast" | "lactobacillus" | "bacillus" | "uncertain";

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
  step: "start" | "camera" | "calibration" | "detection" | "review" | "result";
  medium: MediumType | null;
  rawImageSrc: string | null;
  calibratedImageSrc: string | null; // Cropped & adjusted
  colonies: ColonyData[];
  aiAnalysisText: string | null;
  qcWarnings: string[];
}

