import {
  formatWindSlotDate,
  windDirectionLabel,
  windSpeedKmh,
} from "@/lib/windDirection";
import {
  getWindSlotStatus,
  slotMatchesWindPrefs,
} from "@/lib/windAlerts";
import { resolveWindAlertsForSubscription } from "@/lib/windAlertsServer";
import clientPromise from "@/lib/mongodb";
import type { WindForecastSlot } from "@/types/windForecast";
import {
  appendNotifiedWindSlot,
  listPushSubscriptions,
  removeStaleSubscription,
  subscriptionNotifiedWindSlot,
} from "./subscriptions";
import { ensureWebPushConfigured, webpush } from "./webPush";

const STATUS_LABELS: Record<string, string> = {
  alert: "Alerta",
  critical: "Crítico",
};

export interface WindPushCheckResult {
  slotsChecked: number;
  notificationsSent: number;
  skipped: number;
  errors: number;
}

async function listFutureWindSlots(): Promise<WindForecastSlot[]> {
  const client = await clientPromise;
  const db = client.db("alerta-sudestada");
  const now = new Date();
  const docs = await db
    .collection("windForecast")
    .find({ dt: { $gt: now } })
    .sort({ dt: 1 })
    .toArray();

  return docs.map((doc) => ({
    dt: new Date(doc.dt),
    speed: doc.speed,
    deg: doc.deg,
    gust: doc.gust,
    insertedAt: new Date(doc.insertedAt),
    notifiedAt: doc.notifiedAt ? new Date(doc.notifiedAt) : null,
  }));
}

export async function runWindPushCheck(): Promise<WindPushCheckResult> {
  ensureWebPushConfigured();

  const slots = await listFutureWindSlots();
  if (slots.length === 0) {
    return {
      slotsChecked: 0,
      notificationsSent: 0,
      skipped: 0,
      errors: 0,
    };
  }

  const subs = await listPushSubscriptions();
  let notificationsSent = 0;
  let skipped = 0;
  let errors = 0;

  for (const slot of slots) {
    const dtIso = slot.dt.toISOString();

    for (const sub of subs) {
      if (subscriptionNotifiedWindSlot(sub, dtIso)) {
        skipped++;
        continue;
      }

      const prefs = await resolveWindAlertsForSubscription(sub);

      if (sub.userId && !prefs.notificationsEnabled) {
        skipped++;
        continue;
      }

      if (!slotMatchesWindPrefs(slot, prefs, "alert")) {
        skipped++;
        continue;
      }

      const status = getWindSlotStatus(slot, prefs);
      if (!status || (status !== "alert" && status !== "critical")) {
        skipped++;
        continue;
      }

      const dir = windDirectionLabel(slot.deg);
      const kmh = windSpeedKmh(slot.speed);
      const when = formatWindSlotDate(slot.dt);
      const label = STATUS_LABELS[status] ?? status;
      const payload = JSON.stringify({
        title: `🌬️ ${label} - Viento (pronóstico)`,
        body: `Viento del ${dir} ${kmh} km/h el ${when}`,
        tag: `wind-alert-${dtIso}`,
        data: { type: "wind", dt: dtIso, deg: slot.deg, kmh, status },
      });

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        );
        await appendNotifiedWindSlot(sub.endpoint, dtIso);
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
  }

  return {
    slotsChecked: slots.length,
    notificationsSent,
    skipped,
    errors,
  };
}
