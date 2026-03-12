export interface AlertThresholds {
  warning: number;
  alert: number;
  critical: number;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  warning: 2.5,
  alert: 3.0,
  critical: 3.5,
};

const STORAGE_KEY = 'alerta-sudestada-thresholds';

/**
 * Get alert thresholds from localStorage or return defaults
 */
export function getAlertThresholds(): AlertThresholds {
  if (typeof window === 'undefined') {
    return DEFAULT_THRESHOLDS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AlertThresholds;
      // Validate the stored values
      if (
        typeof parsed.warning === 'number' &&
        typeof parsed.alert === 'number' &&
        typeof parsed.critical === 'number' &&
        parsed.warning >= 0 &&
        parsed.alert > parsed.warning &&
        parsed.critical > parsed.alert
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading alert thresholds from localStorage:', error);
  }

  return DEFAULT_THRESHOLDS;
}

/**
 * Save alert thresholds to localStorage
 */
export function setAlertThresholds(thresholds: AlertThresholds): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Validate thresholds
    if (
      typeof thresholds.warning === 'number' &&
      typeof thresholds.alert === 'number' &&
      typeof thresholds.critical === 'number' &&
      thresholds.warning >= 0 &&
      thresholds.alert > thresholds.warning &&
      thresholds.critical > thresholds.alert
    ) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('thresholdsUpdated', { detail: thresholds }));
    } else {
      throw new Error('Invalid thresholds values');
    }
  } catch (error) {
    console.error('Error saving alert thresholds to localStorage:', error);
    throw error;
  }
}

/**
 * Reset thresholds to default values
 */
export function resetAlertThresholds(): AlertThresholds {
  setAlertThresholds(DEFAULT_THRESHOLDS);
  return DEFAULT_THRESHOLDS;
}

/**
 * Calculate alert status based on height and configured thresholds
 */
export function getStatusFromHeight(
  height: number,
  thresholds?: AlertThresholds
): "normal" | "warning" | "alert" | "critical" {
  const t = thresholds ?? getAlertThresholds();
  if (height >= t.critical) return "critical";
  if (height >= t.alert) return "alert";
  if (height >= t.warning) return "warning";
  return "normal";
}

/**
 * Get worst alert status from forecast values (for forecast-based notifications).
 * Returns null if no values, or { status, maxValue } for the worst status among all predictions.
 */
export function getWorstStatusFromForecast(
  values: { value: number }[],
  thresholds?: AlertThresholds
): { status: "normal" | "warning" | "alert" | "critical"; maxValue: number } | null {
  if (!values || values.length === 0) return null;
  const t = thresholds ?? getAlertThresholds();
  const statusOrder = { normal: 0, warning: 1, alert: 2, critical: 3 } as const;
  let worstStatus: "normal" | "warning" | "alert" | "critical" = "normal";
  let maxValue = 0;
  for (const v of values) {
    const s = getStatusFromHeight(v.value, t);
    if (statusOrder[s] > statusOrder[worstStatus]) {
      worstStatus = s;
      maxValue = v.value;
    } else if (s === worstStatus && v.value > maxValue) {
      maxValue = v.value;
    }
  }
  return { status: worstStatus, maxValue };
}
