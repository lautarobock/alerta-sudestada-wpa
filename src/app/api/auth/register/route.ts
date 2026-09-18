import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createUser,
  normalizeEmail,
  validatePassword,
  toPublicUser,
} from "@/lib/auth/users";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const firstName =
      typeof body.firstName === "string" ? body.firstName : undefined;
    const lastName =
      typeof body.lastName === "string" ? body.lastName : undefined;

    if (!email || !normalizeEmail(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const user = await createUser({ email, password, firstName, lastName });
    const token = await createSessionToken({
      userId: user._id.toString(),
      email: user.email,
    });
    const cookieStore = await cookies();
    cookieStore.set(sessionCookieOptions(token));

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
  }
}
