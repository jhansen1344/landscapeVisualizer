/** Conversion helpers between feet (design unit) and other units. */
export const FT_TO_M = 0.3048;
export const ftToM = (ft: number) => ft * FT_TO_M;
export const mToFt = (m: number) => m / FT_TO_M;

/**
 * Pixels-per-foot for the designer canvas default zoom.
 * 20 px/ft gives a 40ft x 30ft bed plenty of room in a typical viewport.
 */
export const DEFAULT_PX_PER_FT = 20;
