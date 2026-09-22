import bcrypt from "bcryptjs";
import { ObjectId, type WithoutId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { type AlertThresholds, validateThresholds } from "@/lib/thresholds";
import { getDefaultThresholds } from "@/lib/thresholdsServer";
import { getDefaultWindAlerts } from "@/lib/settingsServer";
import {
  normalizeWindAlertsConfig,
  validateWindAlertsConfig,
  type WindAlertsConfig,
} from "@/lib/windAlerts";

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserDocument {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  thresholds: AlertThresholds;
  windAlerts?: WindAlertsConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  thresholds: AlertThresholds;
  windAlerts: WindAlertsConfig;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  thresholds: AlertThresholds;
  createdAt: Date;
  updatedAt: Date;
}

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePassword(password: string): boolean {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}

function adminEmailsFromEnv(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return adminEmailsFromEnv().includes(normalizeEmail(email));
}

export function getUserRole(
  user: Pick<UserDocument, "email" | "role">
): UserRole {
  if (isAdminEmail(user.email) || user.role === "admin") return "admin";
  return "user";
}

export function isAdminUser(
  user: Pick<UserDocument, "email" | "role">
): boolean {
  return getUserRole(user) === "admin";
}

export function toPublicUser(
  doc: UserDocument,
  windAlerts: WindAlertsConfig
): PublicUser {
  return {
    id: doc._id.toString(),
    email: doc.email,
    firstName: doc.firstName,
    lastName: doc.lastName,
    role: getUserRole(doc),
    thresholds: doc.thresholds,
    windAlerts,
  };
}

export async function resolveUserWindAlerts(
  doc: UserDocument
): Promise<WindAlertsConfig> {
  const defaults = await getDefaultWindAlerts();
  return normalizeWindAlertsConfig(doc.windAlerts, defaults);
}

export async function toPublicUserResolved(
  doc: UserDocument
): Promise<PublicUser> {
  return toPublicUser(doc, await resolveUserWindAlerts(doc));
}

async function usersCollection() {
  const client = await clientPromise;
  return client.db("alerta-sudestada").collection<WithoutId<UserDocument>>("users");
}

async function syncStoredRole(user: UserDocument): Promise<UserDocument> {
  const role = getUserRole(user);
  if (user.role === role) return user;
  const collection = await usersCollection();
  await collection.updateOne(
    { _id: user._id },
    { $set: { role, updatedAt: new Date() } }
  );
  return { ...user, role };
}

export async function findUserByEmail(
  email: string
): Promise<UserDocument | null> {
  const collection = await usersCollection();
  const user = await collection.findOne({ email: normalizeEmail(email) });
  return user ? syncStoredRole(user) : null;
}

export async function findUserById(
  id: string
): Promise<UserDocument | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await usersCollection();
  const user = await collection.findOne({ _id: new ObjectId(id) });
  return user ? syncStoredRole(user) : null;
}

export async function listUsers(): Promise<AdminUserListItem[]> {
  const collection = await usersCollection();
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((doc) => ({
    id: doc._id.toString(),
    email: doc.email,
    firstName: doc.firstName,
    lastName: doc.lastName,
    role: getUserRole(doc),
    thresholds: doc.thresholds,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));
}

export async function createUser(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<UserDocument> {
  const email = normalizeEmail(input.email);
  const collection = await usersCollection();
  const existing = await collection.findOne({ email });
  if (existing) {
    throw new Error("EMAIL_EXISTS");
  }
  const now = new Date();
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const role: UserRole = isAdminEmail(email) ? "admin" : "user";
  const doc = {
    email,
    passwordHash,
    firstName: input.firstName?.trim() || undefined,
    lastName: input.lastName?.trim() || undefined,
    role,
    thresholds: { ...(await getDefaultThresholds()) },
    windAlerts: { ...(await getDefaultWindAlerts()) },
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function verifyUserPassword(
  email: string,
  password: string
): Promise<UserDocument | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export async function updateUserThresholds(
  userId: string,
  thresholds: AlertThresholds
): Promise<UserDocument | null> {
  if (!validateThresholds(thresholds)) {
    throw new Error("INVALID_THRESHOLDS");
  }
  if (!ObjectId.isValid(userId)) return null;
  const collection = await usersCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: { thresholds, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ?? null;
}

export async function updateUserWindAlerts(
  userId: string,
  windAlerts: WindAlertsConfig
): Promise<UserDocument | null> {
  const defaults = await getDefaultWindAlerts();
  const normalized = normalizeWindAlertsConfig(windAlerts, defaults);
  if (!validateWindAlertsConfig(normalized)) {
    throw new Error("INVALID_WIND_ALERTS");
  }
  if (!ObjectId.isValid(userId)) return null;
  const collection = await usersCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: { windAlerts: normalized, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ?? null;
}
