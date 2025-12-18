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
export function getStatusFromHeight(height: number): "normal" | "warning" | "alert" | "critical" {
  const thresholds = getAlertThresholds();
  
  if (height >= thresholds.critical) return "critical";
  if (height >= thresholds.alert) return "alert";
  if (height >= thresholds.warning) return "warning";
  return "normal";
}
