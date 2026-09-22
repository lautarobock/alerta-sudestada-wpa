/** Client-safe settings types and defaults (no MongoDB). */

import {
  defaultWindSettings,
  normalizeWindSettings,
  type WindSettings,
  validateWindSettings,
} from "@/lib/windAlerts";

export type { WindSettings } from "@/lib/windAlerts";
export { defaultWindSettings, validateWindSettings } from "@/lib/windAlerts";

export const SETTINGS_ID = "global" as const;

export interface RiverSettings {
  warning: number;
  alert: number;
  critical: number;
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

export const DEFAULT_WIND_SETTINGS: WindSettings = defaultWindSettings();

export function defaultSettingsDoc(): AppSettings {
  return {
    _id: SETTINGS_ID,
    river: { ...DEFAULT_RIVER },
    wind: defaultWindSettings(),
    updatedAt: new Date(),
  };
}

export function normalizeAppSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") {
    return defaultSettingsDoc();
  }
  const doc = raw as AppSettings;
  return {
    _id: SETTINGS_ID,
    river: {
      warning: doc.river?.warning ?? DEFAULT_RIVER.warning,
      alert: doc.river?.alert ?? DEFAULT_RIVER.alert,
      critical: doc.river?.critical ?? DEFAULT_RIVER.critical,
    },
    wind: normalizeWindSettings(doc.wind),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  };
}
