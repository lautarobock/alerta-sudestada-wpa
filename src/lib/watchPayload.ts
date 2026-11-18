import type { ForecastData } from "@/types/forecast";
import {
  getStatusFromHeight,
  type AlertStatus,
  type AlertThresholds,
} from "@/lib/thresholds";

export interface WatchReading {
  height: number;
  timestamp: string;
  location: string;
  status: AlertStatus;
}

export interface WatchEvent {
  mode: "high" | "low";
  v: number;
  ts: number;
}

export interface WatchPeak {
  v: number;
  ts: number;
  s: AlertStatus;
}

export interface WatchPayload {
  h: number;
  prev?: number;
  s: AlertStatus;
  ts: number;
  loc: string;
  next?: WatchEvent;
  peak?: WatchPeak;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function unixSeconds(date: Date): number | null {
  const ms = date.getTime();
  if (Number.isNaN(ms)) {
    return null;
  }
  return Math.floor(ms / 1000);
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Compact payload for the Connect IQ widget.
 * `river` is newest-first, as returned by getRiverHeight().
 * Future high/low points come from the latest forecast.
 */
export function buildWatchPayload(
  river: WatchReading[],
  forecast: ForecastData | null,
  thresholds: AlertThresholds,
  now: Date = new Date()
): WatchPayload | null {
  if (!river || river.length === 0) {
    return null;
  }

  const latest = river[0];
  const ts = unixSeconds(new Date(latest.timestamp));
  if (ts == null || !Number.isFinite(latest.height)) {
    return null;
  }

  const payload: WatchPayload = {
    h: round2(latest.height),
    s: latest.status,
    ts,
    loc: latest.location,
  };

  if (river.length > 1 && Number.isFinite(river[1].height)) {
    payload.prev = round2(river[1].height);
  }

  const nowMs = now.getTime();
  const future = (forecast?.values ?? [])
    .map((point) => ({
      mode: point.mode,
      value: point.value,
      date: asDate(point.date),
    }))
    .filter(
      (point) =>
        (point.mode === "high" || point.mode === "low") &&
        Number.isFinite(point.value) &&
        !Number.isNaN(point.date.getTime()) &&
        point.date.getTime() > nowMs
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (future.length === 0) {
    return payload;
  }

  const next = future[0];
  const nextTs = unixSeconds(next.date);
  if (nextTs != null) {
    payload.next = {
      mode: next.mode,
      v: round2(next.value),
      ts: nextTs,
    };
  }

  let peak = future[0];
  for (const point of future) {
    if (point.value > peak.value) {
      peak = point;
    }
  }
  const peakTs = unixSeconds(peak.date);
  if (peakTs != null) {
    payload.peak = {
      v: round2(peak.value),
      ts: peakTs,
      s: getStatusFromHeight(peak.value, thresholds),
    };
  }

  return payload;
}
