import bcrypt from "bcryptjs";
import { ObjectId, type WithoutId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import {
  DEFAULT_THRESHOLDS,
  type AlertThresholds,
  validateThresholds,
} from "@/lib/thresholds";

export interface UserDocument {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  thresholds: AlertThresholds;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  thresholds: AlertThresholds;
}

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePassword(password: string): boolean {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}

export function toPublicUser(doc: UserDocument): PublicUser {
  return {
    id: doc._id.toString(),
    email: doc.email,
    firstName: doc.firstName,
    lastName: doc.lastName,
    thresholds: doc.thresholds,
  };
}

async function usersCollection() {
  const client = await clientPromise;
  return client.db("alerta-sudestada").collection<WithoutId<UserDocument>>("users");
}

export async function findUserByEmail(
  email: string
): Promise<UserDocument | null> {
  const collection = await usersCollection();
  return collection.findOne({ email: normalizeEmail(email) });
}

export async function findUserById(
  id: string
): Promise<UserDocument | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await usersCollection();
  return collection.findOne({ _id: new ObjectId(id) });
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
  const doc = {
    email,
    passwordHash,
    firstName: input.firstName?.trim() || undefined,
    lastName: input.lastName?.trim() || undefined,
    thresholds: { ...DEFAULT_THRESHOLDS },
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
