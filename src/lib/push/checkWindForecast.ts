import {
  formatWindSlotDate,
  windDirectionLabel,
  windSpeedKmh,
} from "@/lib/windDirection";
import clientPromise from "@/lib/mongodb";
import type { WindForecastSlot } from "@/types/windForecast";
import {
  listPushSubscriptions,
  removeStaleSubscription,
} from "./subscriptions";
import { ensureWebPushConfigured, webpush } from "./webPush";

export interface WindPushCheckResult {
  slotsChecked: number;
  notificationsSent: number;
  slotsMarkedNotified: number;
  errors: number;
}

async function listPendingWindSlots(): Promise<WindForecastSlot[]> {
  const client = await clientPromise;
  const db = client.db("alerta-sudestada");
  const now = new Date();
  const docs = await db
    .collection("windForecast")
    .find({ dt: { $gt: now }, notifiedAt: null })
    .sort({ dt: 1 })
    .toArray();

  return docs.map((doc) => ({
    dt: new Date(doc.dt),
    speed: doc.speed,
    deg: doc.deg,
    gust: doc.gust,
    insertedAt: new Date(doc.insertedAt),
    notifiedAt: null,
  }));
}

async function markWindSlotNotified(dt: Date): Promise<void> {
  const client = await clientPromise;
  const db = client.db("alerta-sudestada");
  await db.collection("windForecast").updateOne(
    { dt },
    { $set: { notifiedAt: new Date() } }
  );
}

export async function runWindPushCheck(): Promise<WindPushCheckResult> {
  ensureWebPushConfigured();

  const slots = await listPendingWindSlots();
  if (slots.length === 0) {
    return {
      slotsChecked: 0,
      notificationsSent: 0,
      slotsMarkedNotified: 0,
      errors: 0,
    };
  }

  const subs = await listPushSubscriptions();
  let notificationsSent = 0;
  let slotsMarkedNotified = 0;
  let errors = 0;

  for (const slot of slots) {
    const dir = windDirectionLabel(slot.deg);
    const kmh = windSpeedKmh(slot.speed);
    const when = formatWindSlotDate(slot.dt);
    const dtIso = slot.dt.toISOString();
    const payload = JSON.stringify({
      title: "🌬️ Sudestada (pronóstico)",
      body: `Viento del ${dir} ${kmh} km/h el ${when}`,
      tag: `wind-alert-${dtIso}`,
      data: { type: "wind", dt: dtIso, deg: slot.deg, kmh },
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        );
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

    await markWindSlotNotified(slot.dt);
    slotsMarkedNotified++;
  }

  return {
    slotsChecked: slots.length,
    notificationsSent,
    slotsMarkedNotified,
    errors,
  };
}
