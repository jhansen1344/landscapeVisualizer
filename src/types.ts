export type Habit = "forb" | "grass" | "shrub" | "tree";
export type Sun = "full" | "part" | "shade";
export type Moisture = "dry" | "medium" | "wet";

export interface Plant {
  id: string;
  commonName: string;
  scientificName: string;
  habit: Habit;
  sun: Sun;
  moisture: Moisture;
  matureHeightFt: number;
  matureSpreadFt: number;
  bloomColor: string;
  bloomMonths: number[];
  zoneMin: string;
  zoneMax: string;
  ecoregions: string[];
  swatchColor: string;
  notes?: string;
  modelUrl?: string;
}

export interface PlacedPlant {
  /** unique instance id */
  uid: string;
  /** plant id reference */
  plantId: string;
  /** position in feet from bed origin (top-left of design area) */
  x: number;
  y: number;
  /** optional rotation in radians (for grasses/shrubs with oriented icons) */
  rotation?: number;
  /** override quantity for cluster markers; default 1 */
  quantity?: number;
}

export interface BedPolygon {
  /** polygon points in feet */
  points: { x: number; y: number }[];
}

export type DesignMode = "plan" | "grid";

export interface Design {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  mode: DesignMode;
  /** bed outline polygon (empty array = no bed defined yet) */
  bed: BedPolygon;
  plants: PlacedPlant[];
  /** snapshot of region filter used at creation */
  region?: { ecoregion?: string; zone?: string };
}

export interface RegionSelection {
  ecoregion?: string;
  zone?: string;
  showAll?: boolean;
}
