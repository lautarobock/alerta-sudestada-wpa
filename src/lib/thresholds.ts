export interface AlertThresholds {
  warning: number;
  alert: number;
  critical: number;
}

/** Client-side placeholder until /api/auth/me loads */
export const DEFAULT_THRESHOLDS: AlertThresholds = {
  warning: 2.5,
  alert: 3.0,
  critical: 3.5,
};

const FALLBACK_THRESHOLDS = DEFAULT_THRESHOLDS;

export type AlertStatus = "normal" | "warning" | "alert" | "critical";

export function validateThresholds(thresholds: AlertThresholds): boolean {
  return (
    typeof thresholds.warning === "number" &&
    typeof thresholds.alert === "number" &&
    typeof thresholds.critical === "number" &&
    thresholds.warning >= 0 &&
    thresholds.alert > thresholds.warning &&
    thresholds.critical > thresholds.alert
  );
}

export function getStatusFromHeight(
  height: number,
  thresholds: AlertThresholds = FALLBACK_THRESHOLDS
): AlertStatus {
  if (height >= thresholds.critical) return "critical";
  if (height >= thresholds.alert) return "alert";
  if (height >= thresholds.warning) return "warning";
  return "normal";
}

export function getWorstStatusFromForecast(
  values: { value: number }[],
  thresholds: AlertThresholds
): { status: AlertStatus; maxValue: number } | null {
  if (!values || values.length === 0) return null;
  const statusOrder = { normal: 0, warning: 1, alert: 2, critical: 3 } as const;
  let worstStatus: AlertStatus = "normal";
  let maxValue = 0;
  for (const v of values) {
    const s = getStatusFromHeight(v.value, thresholds);
    if (statusOrder[s] > statusOrder[worstStatus]) {
      worstStatus = s;
      maxValue = v.value;
    } else if (s === worstStatus && v.value > maxValue) {
      maxValue = v.value;
    }
  }
  return { status: worstStatus, maxValue };
}
