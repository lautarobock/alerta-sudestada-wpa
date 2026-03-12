import { NextResponse } from "next/server";
import { getRiverHeight } from "@/app/actions/riverHeight";

/**
 * API route for river height data.
 * Used by the service worker's periodicsync handler when the app is in background.
 */
export async function GET() {
  try {
    const data = await getRiverHeight();
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No data" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching river height:", error);
    return NextResponse.json(
      { error: "Failed to fetch river height" },
      { status: 500 }
    );
  }
}
