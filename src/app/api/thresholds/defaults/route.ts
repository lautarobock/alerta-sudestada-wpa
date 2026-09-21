import { NextResponse } from "next/server";
import { getDefaultThresholds } from "@/lib/thresholds";

export async function GET() {
  return NextResponse.json(await getDefaultThresholds());
}
