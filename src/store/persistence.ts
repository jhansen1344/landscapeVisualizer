import LZString from "lz-string";
import type { Design, RegionSelection } from "../types";

const LS_DESIGNS = "lv.designs.v1";
const LS_CURRENT = "lv.currentDesignId.v1";
const LS_REGION = "lv.region.v1";

export function loadDesigns(): Design[] {
  try {
    const raw = localStorage.getItem(LS_DESIGNS);
    return raw ? (JSON.parse(raw) as Design[]) : [];
  } catch {
    return [];
  }
}

export function saveDesigns(designs: Design[]) {
  localStorage.setItem(LS_DESIGNS, JSON.stringify(designs));
}

export function loadCurrentDesignId(): string | null {
  return localStorage.getItem(LS_CURRENT);
}

export function saveCurrentDesignId(id: string | null) {
  if (id) localStorage.setItem(LS_CURRENT, id);
  else localStorage.removeItem(LS_CURRENT);
}

export function loadRegion(): RegionSelection | null {
  try {
    const raw = localStorage.getItem(LS_REGION);
    return raw ? (JSON.parse(raw) as RegionSelection) : null;
  } catch {
    return null;
  }
}

export function saveRegion(r: RegionSelection) {
  localStorage.setItem(LS_REGION, JSON.stringify(r));
}

// ---- URL hash codec ----
// We embed the minimum state needed to re-render a design into the URL hash.
export function encodeDesignToHash(design: Design): string {
  const json = JSON.stringify(design);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeDesignFromHash(hash: string): Design | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash);
    if (!json) return null;
    return JSON.parse(json) as Design;
  } catch {
    return null;
  }
}
