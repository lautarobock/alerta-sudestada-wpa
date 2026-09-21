import { getSessionFromCookies } from "@/lib/auth/session";
import { findUserById, isAdminUser, type UserDocument } from "@/lib/auth/users";

export async function requireAdmin(): Promise<UserDocument | null> {
  const session = await getSessionFromCookies();
  if (!session) return null;
  const user = await findUserById(session.userId);
  if (!user || !isAdminUser(user)) return null;
  return user;
}
