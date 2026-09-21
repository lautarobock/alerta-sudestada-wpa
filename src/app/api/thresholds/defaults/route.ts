import { NextResponse } from "next/server";
import { getDefaultThresholds } from "@/lib/thresholdsServer";

export async function GET() {
  return NextResponse.json(await getDefaultThresholds());
}
