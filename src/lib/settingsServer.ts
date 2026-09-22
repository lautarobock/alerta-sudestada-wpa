import "server-only";

import { getAppSettings } from "@/lib/settings";
import { windSettingsToAlertsConfig, type WindAlertsConfig } from "@/lib/windAlerts";

export async function getDefaultWindAlerts(): Promise<WindAlertsConfig> {
  const settings = await getAppSettings();
  return windSettingsToAlertsConfig(settings.wind);
}

export async function getDefaultWindSettings() {
  const settings = await getAppSettings();
  return settings.wind;
}
