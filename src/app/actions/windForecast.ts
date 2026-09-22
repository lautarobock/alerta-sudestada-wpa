"use server";

import { resolveWindAlertsForSession } from "@/lib/windAlertsServer";
import { slotMatchesWindPrefs } from "@/lib/windAlerts";
import clientPromise from "@/lib/mongodb";
import type { WindForecastSlot } from "@/types/windForecast";

export async function getWindForecast(): Promise<WindForecastSlot[]> {
  try {
    const prefs = await resolveWindAlertsForSession();
    const client = await clientPromise;
    const db = client.db("alerta-sudestada");
    const now = new Date();
    const docs = await db
      .collection("windForecast")
      .find({ dt: { $gt: now } })
      .sort({ dt: 1 })
      .toArray();

    const slots = docs.map((doc) => ({
      dt: new Date(doc.dt),
      speed: doc.speed,
      deg: doc.deg,
      gust: doc.gust,
      insertedAt: new Date(doc.insertedAt),
      notifiedAt: doc.notifiedAt ? new Date(doc.notifiedAt) : null,
    }));

    return slots.filter((slot) => slotMatchesWindPrefs(slot, prefs, "alert"));
  } catch (error) {
    console.error("Error fetching wind forecast from MongoDB:", error);
    return [];
  }
}
