import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  getAppSettings,
  updateAppSettings,
  type AppSettings,
} from "@/lib/settings";

function serializeSettings(settings: AppSettings) {
  return {
    river: settings.river,
    wind: settings.wind,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const settings = await getAppSettings();
  return NextResponse.json(serializeSettings(settings));
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updated = await updateAppSettings({
      river: body.river,
      wind: body.wind,
    });
    return NextResponse.json(serializeSettings(updated));
  } catch (e) {
    const message = e instanceof Error ? e.message : "INVALID_SETTINGS";
    if (
      message === "INVALID_RIVER_THRESHOLDS" ||
      message === "INVALID_WIND_SETTINGS"
    ) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    console.error("Update settings error:", e);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
