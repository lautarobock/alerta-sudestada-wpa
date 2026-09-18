import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { updateUserThresholds, toPublicUser } from "@/lib/auth/users";
import type { AlertThresholds } from "@/lib/thresholds";

export async function PUT(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const thresholds = body as AlertThresholds;
    const user = await updateUserThresholds(session.userId, thresholds);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_THRESHOLDS") {
      return NextResponse.json(
        { error: "Umbrales inválidos" },
        { status: 400 }
      );
    }
    console.error("Update thresholds error:", error);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
