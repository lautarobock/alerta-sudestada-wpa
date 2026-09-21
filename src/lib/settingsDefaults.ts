/** Client-safe settings types and defaults (no MongoDB). */

export const SETTINGS_ID = "global" as const;

export interface RiverSettings {
  warning: number;
  alert: number;
  critical: number;
}

export interface WindSettings {
  degMin: number;
  degMax: number;
  minKmh: number;
}

export interface AppSettings {
  _id: typeof SETTINGS_ID;
  river: RiverSettings;
  wind: WindSettings;
  updatedAt: Date;
}

export const DEFAULT_RIVER: RiverSettings = {
  warning: 2.5,
  alert: 3.0,
  critical: 3.5,
};

export const DEFAULT_WIND_SETTINGS: WindSettings = {
  degMin: 90,
  degMax: 180,
  minKmh: 40,
};

export function defaultSettingsDoc(): AppSettings {
  return {
    _id: SETTINGS_ID,
    river: { ...DEFAULT_RIVER },
    wind: { ...DEFAULT_WIND_SETTINGS },
    updatedAt: new Date(),
  };
}

export function validateWindSettings(wind: WindSettings): boolean {
  return (
    typeof wind.degMin === "number" &&
    typeof wind.degMax === "number" &&
    typeof wind.minKmh === "number" &&
    wind.degMin >= 0 &&
    wind.degMax <= 360 &&
    wind.degMin <= wind.degMax &&
    wind.minKmh >= 0
  );
}
