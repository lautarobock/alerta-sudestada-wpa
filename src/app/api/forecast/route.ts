import { NextResponse } from "next/server";
import { getForecast } from "@/app/actions/riverHeight";

/**
 * API route for forecast data.
 * Used by the service worker's periodicsync handler for forecast-based alerts.
 */
export async function GET() {
  try {
    const data = await getForecast();
    if (!data) {
      return NextResponse.json({ error: "No forecast" }, { status: 404 });
    }
    // Serialize dates for JSON
    return NextResponse.json({
      moment: data.moment.toISOString(),
      values: data.values.map((v) => ({
        date: v.date.toISOString(),
        mode: v.mode,
        value: v.value,
      })),
    });
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return NextResponse.json(
      { error: "Failed to fetch forecast" },
      { status: 500 }
    );
  }
}
