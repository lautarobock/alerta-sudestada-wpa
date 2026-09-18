import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserPassword, toPublicUser } from "@/lib/auth/users";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    const user = await verifyUserPassword(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      userId: user._id.toString(),
      email: user.email,
    });
    const cookieStore = await cookies();
    cookieStore.set(sessionCookieOptions(token));

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}
