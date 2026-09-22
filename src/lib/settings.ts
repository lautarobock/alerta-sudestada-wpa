import "server-only";

import clientPromise from "@/lib/mongodb";
import { validateThresholds, type AlertThresholds } from "@/lib/thresholds";
import { isLegacyWindSettings } from "@/lib/windAlerts";
import {
  SETTINGS_ID,
  defaultSettingsDoc,
  normalizeAppSettings,
  validateWindSettings,
  type AppSettings,
  type WindSettings,
} from "@/lib/settingsDefaults";

export type { AppSettings, WindSettings } from "@/lib/settingsDefaults";
export {
  SETTINGS_ID,
  DEFAULT_WIND_SETTINGS,
} from "@/lib/settingsDefaults";

async function settingsCollection() {
  const client = await clientPromise;
  return client.db("alerta-sudestada").collection<AppSettings>("settings");
}

async function persistNormalizedIfNeeded(raw: AppSettings): Promise<AppSettings> {
  const normalized = normalizeAppSettings(raw);
  const needsWindMigration =
    isLegacyWindSettings(raw.wind) ||
    JSON.stringify(raw.wind) !== JSON.stringify(normalized.wind);
  if (needsWindMigration) {
    const collection = await settingsCollection();
    await collection.updateOne(
      { _id: SETTINGS_ID },
      { $set: { wind: normalized.wind, updatedAt: new Date() } }
    );
  }
  return normalized;
}

export async function getAppSettings(): Promise<AppSettings> {
  const collection = await settingsCollection();
  const existing = await collection.findOne({ _id: SETTINGS_ID });
  if (existing) {
    return persistNormalizedIfNeeded(existing);
  }
  const doc = defaultSettingsDoc();
  try {
    await collection.insertOne(doc);
    return doc;
  } catch {
    const again = await collection.findOne({ _id: SETTINGS_ID });
    if (again) return persistNormalizedIfNeeded(again);
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
  return normalizeAppSettings(updated);
}
