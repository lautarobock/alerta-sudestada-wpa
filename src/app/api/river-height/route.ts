import { NextResponse } from "next/server";

// Mock river height data
// In production, this would fetch from a real API
interface RiverHeightData {
  height: number;
  unit: string;
  timestamp: string;
  location: string;
  status: "normal" | "warning" | "alert" | "critical";
}

// Thresholds for alerts (in meters)
const THRESHOLDS = {
  normal: 0,
  warning: 2.5,
  alert: 3.0,
  critical: 3.5,
};

function getStatus(height: number): RiverHeightData["status"] {
  if (height >= THRESHOLDS.critical) return "critical";
  if (height >= THRESHOLDS.alert) return "alert";
  if (height >= THRESHOLDS.warning) return "warning";
  return "normal";
}

// Simulate realistic river height data with some variation
function generateMockData(): RiverHeightData {
  const baseHeight = 1.8;
  const variation = (Math.random() - 0.5) * 0.8; // ±0.4m variation
  const height = Math.max(0, baseHeight + variation);
  
  return {
    height: Math.round(height * 100) / 100, // Round to 2 decimals
    unit: "m",
    timestamp: new Date().toISOString(),
    location: "Río de la Plata - Puerto Buenos Aires",
    status: getStatus(height),
  };
}

export async function GET() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const data = generateMockData();
  return NextResponse.json(data);
}

