import plantsJson from "../data/plants.json";
import type { Plant, RegionSelection } from "../types";
import { zoneInRange } from "./geometry";

export const ALL_PLANTS: Plant[] = plantsJson as Plant[];

const plantMap = new Map(ALL_PLANTS.map((p) => [p.id, p]));

export function getPlant(id: string): Plant | undefined {
  return plantMap.get(id);
}

export function filterPlants(
  region: RegionSelection,
  query: string = "",
  filters: {
    sun?: string;
    moisture?: string;
    habit?: string;
  } = {}
): Plant[] {
  const q = query.trim().toLowerCase();
  return ALL_PLANTS.filter((p) => {
    if (!region.showAll) {
      if (region.ecoregion && !p.ecoregions.includes(region.ecoregion))
        return false;
      if (region.zone && !zoneInRange(region.zone, p.zoneMin, p.zoneMax))
        return false;
    }
    if (filters.sun && p.sun !== filters.sun) return false;
    if (filters.moisture && p.moisture !== filters.moisture) return false;
    if (filters.habit && p.habit !== filters.habit) return false;
    if (q) {
      const hay = `${p.commonName} ${p.scientificName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Initials for the call-out label (e.g., "EP" for Echinacea purpurea). */
export function plantInitials(p: Plant): string {
  const parts = p.scientificName.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return p.commonName
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
