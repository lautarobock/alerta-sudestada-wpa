import clientPromise from "@/lib/mongodb";
import {
  DEFAULT_THRESHOLDS,
  validateThresholds,
  type AlertThresholds,
} from "@/lib/thresholds";

export const SETTINGS_ID = "global" as const;

export interface WindSettings {
  degMin: number;
  degMax: number;
  minKmh: number;
}

export interface AppSettings {
  _id: typeof SETTINGS_ID;
  river: AlertThresholds;
  wind: WindSettings;
  updatedAt: Date;
}

export const DEFAULT_WIND_SETTINGS: WindSettings = {
  degMin: 90,
  degMax: 180,
  minKmh: 40,
};

function defaultSettingsDoc(): AppSettings {
  return {
    _id: SETTINGS_ID,
    river: { ...DEFAULT_THRESHOLDS },
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

async function settingsCollection() {
  const client = await clientPromise;
  return client.db("alerta-sudestada").collection<AppSettings>("settings");
}

export async function getAppSettings(): Promise<AppSettings> {
  const collection = await settingsCollection();
  const existing = await collection.findOne({ _id: SETTINGS_ID });
  if (existing) {
    return existing;
  }
  const doc = defaultSettingsDoc();
  try {
    await collection.insertOne(doc);
    return doc;
  } catch {
    const again = await collection.findOne({ _id: SETTINGS_ID });
    if (again) return again;
    throw new Error("Failed to seed app settings");
  }
}

export async function updateAppSettings(input: {
  river?: AlertThresholds;
  wind?: WindSettings;
}): Promise<AppSettings> {
  if (input.river && !validateThresholds(input.river)) {
    throw new Error("INVALID_RIVER_THRESHOLDS");
  }
  if (input.wind && !validateWindSettings(input.wind)) {
    throw new Error("INVALID_WIND_SETTINGS");
  }

  await getAppSettings();
  const collection = await settingsCollection();
  const set: Partial<AppSettings> = { updatedAt: new Date() };
  if (input.river) set.river = input.river;
  if (input.wind) set.wind = input.wind;

  await collection.updateOne({ _id: SETTINGS_ID }, { $set: set });
  const updated = await collection.findOne({ _id: SETTINGS_ID });
  if (!updated) throw new Error("Settings not found after update");
  return updated;
}
