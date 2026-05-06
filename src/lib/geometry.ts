import type { BedPolygon } from "../types";

/** Shoelace formula for polygon area in square feet. */
export function polygonAreaSqFt(bed: BedPolygon): number {
  const pts = bed.points;
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/** Distance between two points. */
export function dist(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Zone like "6a" -> numeric rank for range comparisons. */
export function zoneRank(z: string): number {
  const m = z.match(/^(\d+)([ab])?$/i);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  const half = m[2]?.toLowerCase() === "b" ? 0.5 : 0;
  return n + half;
}

export function zoneInRange(zone: string, min: string, max: string): boolean {
  const z = zoneRank(zone);
  return z >= zoneRank(min) && z <= zoneRank(max);
}
