import {
  degToDirectionIndex,
  directionsFromDegRange,
  WIND_DIRECTION_COUNT,
  windSpeedKmh,
} from "@/lib/windDirection";
import {
  validateThresholds,
  type AlertStatus,
  type AlertThresholds,
} from "@/lib/thresholds";

export interface WindSpeedKmhThresholds extends AlertThresholds {}

export interface WindSettings {
  speedKmh: WindSpeedKmhThresholds;
  directions: boolean[];
}

export interface WindAlertsConfig {
  notificationsEnabled: boolean;
  speedKmh: WindSpeedKmhThresholds;
  directions: boolean[];
}

export interface WindSlotLike {
  speed: number;
  deg: number;
}

export const DEFAULT_WIND_SPEED_KMH: WindSpeedKmhThresholds = {
  warning: 30,
  alert: 40,
  critical: 55,
};

export function defaultWindDirectionsEastToSouth(): boolean[] {
  return directionsFromDegRange(90, 180);
}

export function defaultWindSettings(): WindSettings {
  return {
    speedKmh: { ...DEFAULT_WIND_SPEED_KMH },
    directions: defaultWindDirectionsEastToSouth(),
  };
}

export function windSettingsToAlertsConfig(wind: WindSettings): WindAlertsConfig {
  return {
    notificationsEnabled: true,
    speedKmh: { ...wind.speedKmh },
    directions: [...wind.directions],
  };
}

export interface LegacyWindSettings {
  degMin: number;
  degMax: number;
  minKmh: number;
}

export function isLegacyWindSettings(
  wind: unknown
): wind is LegacyWindSettings {
  if (!wind || typeof wind !== "object") return false;
  const w = wind as Record<string, unknown>;
  return (
    typeof w.degMin === "number" &&
    typeof w.degMax === "number" &&
    typeof w.minKmh === "number" &&
    !("speedKmh" in w)
  );
}

export function migrateLegacyWindSettings(
  legacy: LegacyWindSettings
): WindSettings {
  const alert = legacy.minKmh;
  return {
    speedKmh: {
      warning: Math.max(0, alert - 10),
      alert,
      critical: alert + 15,
    },
    directions: directionsFromDegRange(legacy.degMin, legacy.degMax),
  };
}

function coerceDirectionFlag(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0" || s === "") return false;
  }
  return Boolean(value);
}

export function normalizeDirections(
  directions: boolean[] | undefined
): boolean[] {
  if (!directions || directions.length !== WIND_DIRECTION_COUNT) {
    return defaultWindDirectionsEastToSouth();
  }
  return directions.map(coerceDirectionFlag);
}

export function normalizeWindSettings(wind: unknown): WindSettings {
  if (isLegacyWindSettings(wind)) {
    return migrateLegacyWindSettings(wind);
  }
  if (wind && typeof wind === "object" && "speedKmh" in wind) {
    const w = wind as WindSettings;
    return {
      speedKmh: {
        warning: w.speedKmh?.warning ?? DEFAULT_WIND_SPEED_KMH.warning,
        alert: w.speedKmh?.alert ?? DEFAULT_WIND_SPEED_KMH.alert,
        critical: w.speedKmh?.critical ?? DEFAULT_WIND_SPEED_KMH.critical,
      },
      directions: normalizeDirections(w.directions),
    };
  }
  return defaultWindSettings();
}

export function validateWindSpeedThresholds(
  speedKmh: WindSpeedKmhThresholds
): boolean {
  return validateThresholds(speedKmh);
}

export function validateWindSettings(wind: WindSettings): boolean {
  if (!validateWindSpeedThresholds(wind.speedKmh)) return false;
  if (wind.directions.length !== WIND_DIRECTION_COUNT) return false;
  return wind.directions.some(Boolean);
}

export function validateWindAlertsConfig(config: WindAlertsConfig): boolean {
  if (!validateWindSpeedThresholds(config.speedKmh)) return false;
  if (config.directions.length !== WIND_DIRECTION_COUNT) return false;
  if (config.notificationsEnabled && !config.directions.some(Boolean)) {
    return false;
  }
  return true;
}

export function getWindSpeedStatus(
  kmh: number,
  speedKmh: WindSpeedKmhThresholds
): AlertStatus {
  if (kmh >= speedKmh.critical) return "critical";
  if (kmh >= speedKmh.alert) return "alert";
  if (kmh >= speedKmh.warning) return "warning";
  return "normal";
}

export type WindMatchMinStatus = "warning" | "alert" | "critical";

export function slotMatchesWindPrefs(
  slot: WindSlotLike,
  config: Pick<WindAlertsConfig, "speedKmh" | "directions">,
  minStatus: WindMatchMinStatus = "alert"
): boolean {
  const idx = degToDirectionIndex(slot.deg);
  if (!config.directions[idx]) return false;

  const kmh = windSpeedKmh(slot.speed);
  const status = getWindSpeedStatus(kmh, config.speedKmh);
  const order = { normal: 0, warning: 1, alert: 2, critical: 3 } as const;
  const minOrder = order[minStatus];
  return order[status] >= minOrder;
}

export function getWindSlotStatus(
  slot: WindSlotLike,
  config: Pick<WindAlertsConfig, "speedKmh" | "directions">
): AlertStatus | null {
  if (!slotMatchesWindPrefs(slot, config, "alert")) return null;
  return getWindSpeedStatus(windSpeedKmh(slot.speed), config.speedKmh);
}

export function normalizeWindAlertsConfig(
  raw: unknown,
  fallback: WindAlertsConfig
): WindAlertsConfig {
  if (!raw || typeof raw !== "object") {
    return { ...fallback, speedKmh: { ...fallback.speedKmh }, directions: [...fallback.directions] };
  }
  const c = raw as Partial<WindAlertsConfig>;
  return {
    notificationsEnabled:
      typeof c.notificationsEnabled === "boolean"
        ? c.notificationsEnabled
        : fallback.notificationsEnabled,
    speedKmh: {
      warning: c.speedKmh?.warning ?? fallback.speedKmh.warning,
      alert: c.speedKmh?.alert ?? fallback.speedKmh.alert,
      critical: c.speedKmh?.critical ?? fallback.speedKmh.critical,
    },
    directions: normalizeDirections(c.directions ?? fallback.directions),
  };
}
