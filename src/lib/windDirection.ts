export const WIND_DIRECTIONS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSO",
  "SO",
  "OSO",
  "O",
  "ONO",
  "NO",
  "NNO",
] as const;

export type WindDirectionLabel = (typeof WIND_DIRECTIONS)[number];

export const WIND_DIRECTION_COUNT = WIND_DIRECTIONS.length;

export function degToDirectionIndex(deg: number): number {
  return Math.round(deg / 22.5) % WIND_DIRECTION_COUNT;
}

export function windDirectionLabel(deg: number): string {
  return WIND_DIRECTIONS[degToDirectionIndex(deg)];
}

export function windSpeedKmh(speedMs: number): number {
  return Math.round(speedMs * 3.6);
}

export function formatWindSlotDate(dt: Date): string {
  return dt.toLocaleString("es-AR", {
    weekday: "long",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

/** Sectors whose center bearing (meteorological “from”) lies in [degMin, degMax]. */
export function directionsFromDegRange(
  degMin: number,
  degMax: number
): boolean[] {
  const dirs = Array(WIND_DIRECTION_COUNT).fill(false) as boolean[];
  for (let i = 0; i < WIND_DIRECTION_COUNT; i++) {
    const center = i * 22.5;
    if (center >= degMin && center <= degMax) {
      dirs[i] = true;
    }
  }
  return dirs;
}
