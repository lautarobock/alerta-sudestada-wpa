const DIRECTIONS = [
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

export function windDirectionLabel(deg: number): string {
  return DIRECTIONS[Math.round(deg / 22.5) % 16];
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
