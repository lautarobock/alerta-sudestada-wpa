import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSessionCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(clearSessionCookieOptions());
  return NextResponse.json({ success: true });
}
