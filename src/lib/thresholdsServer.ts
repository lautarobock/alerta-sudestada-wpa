import "server-only";

import { getAppSettings } from "@/lib/settings";
import {
  DEFAULT_THRESHOLDS,
  validateThresholds,
  type AlertThresholds,
} from "@/lib/thresholds";

const FALLBACK_THRESHOLDS = DEFAULT_THRESHOLDS;

/**
 * Global default river thresholds (anonymous users, push, new accounts).
 * Stored in MongoDB `settings` document `global`.
 */
export async function getDefaultThresholds(): Promise<AlertThresholds> {
  try {
    const settings = await getAppSettings();
    if (validateThresholds(settings.river)) {
      return settings.river;
    }
    console.warn("[thresholds] Invalid settings.river; using built-in fallback");
  } catch (e) {
    console.error("[thresholds] Failed to load settings:", e);
  }
  return { ...FALLBACK_THRESHOLDS };
}
