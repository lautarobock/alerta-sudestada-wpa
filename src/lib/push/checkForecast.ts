import { getForecast } from "@/app/actions/riverHeight";
import { getWorstStatusFromForecast } from "@/lib/thresholds";
import {
  listPushSubscriptions,
  resolveThresholdsForSubscription,
  markSubscriptionNotified,
  removeStaleSubscription,
} from "./subscriptions";
import { ensureWebPushConfigured, webpush } from "./webPush";

const STATUS_LABELS: Record<string, string> = {
  alert: "Alerta",
  critical: "Crítico",
};

export interface PushCheckResult {
  forecastMoment: string | null;
  subscriptionsChecked: number;
  notificationsSent: number;
  skipped: number;
  errors: number;
}

export async function runPushCheck(): Promise<PushCheckResult> {
  ensureWebPushConfigured();

  const forecast = await getForecast();
  if (!forecast?.values?.length) {
    return {
      forecastMoment: null,
      subscriptionsChecked: 0,
      notificationsSent: 0,
      skipped: 0,
      errors: 0,
    };
  }

  const forecastMoment = forecast.moment.toISOString();
  const subs = await listPushSubscriptions();

  let notificationsSent = 0;
  let skipped = 0;
  let errors = 0;

  for (const sub of subs) {
    if (sub.lastNotifiedForecastMoment === forecastMoment) {
      skipped++;
      continue;
    }

    const thresholds = await resolveThresholdsForSubscription(sub);
    const worst = getWorstStatusFromForecast(forecast.values, thresholds);
    if (
      !worst ||
      (worst.status !== "alert" && worst.status !== "critical")
    ) {
      skipped++;
      continue;
    }

    const label = STATUS_LABELS[worst.status] ?? worst.status;
    const payload = JSON.stringify({
      title: `🚨 ${label} - Río Luján (pronóstico)`,
      body: `El pronóstico indica que uno o más valores superarán ${worst.maxValue.toFixed(2)}m. Estado: ${label}`,
      data: { type: "river", height: worst.maxValue, status: worst.status },
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payload
      );
      await markSubscriptionNotified(sub.endpoint, forecastMoment);
      notificationsSent++;
    } catch (err: unknown) {
      const statusCode =
        err &&
        typeof err === "object" &&
        "statusCode" in err &&
        typeof (err as { statusCode: number }).statusCode === "number"
          ? (err as { statusCode: number }).statusCode
          : 0;
      if (statusCode === 404 || statusCode === 410) {
        await removeStaleSubscription(sub.endpoint);
      }
      errors++;
    }
  }

  return {
    forecastMoment,
    subscriptionsChecked: subs.length,
    notificationsSent,
    skipped,
    errors,
  };
}
