import { NextResponse } from "next/server";
import { DEFAULT_THRESHOLDS } from "@/lib/thresholds";

export async function GET() {
  return NextResponse.json(DEFAULT_THRESHOLDS);
}
