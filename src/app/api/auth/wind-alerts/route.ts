import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { toPublicUserResolved, updateUserWindAlerts } from "@/lib/auth/users";
import type { WindAlertsConfig } from "@/lib/windAlerts";

export async function PUT(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const windAlerts = body as WindAlertsConfig;
    const user = await updateUserWindAlerts(session.userId, windAlerts);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ user: await toPublicUserResolved(user) });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_WIND_ALERTS") {
      return NextResponse.json(
        { error: "Configuración de viento inválida" },
        { status: 400 }
      );
    }
    console.error("Update wind alerts error:", error);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
