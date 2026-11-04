/**
 * Simulated auth server (runs on-device for the demo).
 * Passwords are salted + hashed, sessions are opaque tokens, and every
 * private read/write is authorized against the session owner.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { PrivateProfile, ProfileUpdate, RegisterInput } from '../types/auth';
import { validateEmail, validateFullName, validatePassword, validateUsername } from './validation';

interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

interface Session {
  userId: string;
  expiresAt: number;
}

interface ServerDB {
  users: StoredUser[];
  sessions: Record<string, Session>;
  /** postId → userId. Never exposed publicly. */
  postOwners: Record<string, string>;
}

export class AuthError extends Error {
  status: number;
  field?: string;
  constructor(message: string, status: number, field?: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.field = field;
  }
}

export const DEMO_ACCOUNT = { email: 'demo@ctu.edu.ph', password: 'campus123' };

const DB_KEY = 'ctu-confession:server-db';
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7;
const INVALID_CREDENTIALS = 'That email and password don’t match our records. Please try again.';

let dbPromise: Promise<ServerDB> | null = null;

export const authService = {
  async register(input: RegisterInput): Promise<void> {
    await latency(900);
    const db = await getDB();
    const nameError = validateFullName(input.fullName);
    if (nameError) throw new AuthError(nameError, 400, 'fullName');
    const emailError = validateEmail(input.email);
    if (emailError) throw new AuthError(emailError, 400, 'email');
    const passwordError = validatePassword(input.password);
    if (passwordError) throw new AuthError(passwordError, 400, 'password');

    const email = normalize(input.email);
    if (db.users.some((u) => u.email === email)) {
      throw new AuthError('An account with this email already exists.', 409, 'email');
    }

    const salt = randomId();
    db.users.push({
      id: `u_${randomId(8)}`,
      fullName: input.fullName.trim(),
      email,
      username: uniqueUsername(db, email.split('@')[0]),
      salt,
      passwordHash: await hashPassword(input.password, salt),
      createdAt: new Date().toISOString()
    });
    await save(db);
  },

  async login(email: string, password: string): Promise<string> {
    await latency(800);
    const db = await getDB();
    const user = db.users.find((u) => u.email === normalize(email));
    // Hash even when the user is missing so response timing doesn't reveal which emails exist.
    const hash = await hashPassword(password, user?.salt ?? 'no-user');
    if (!user || !safeEqual(hash, user.passwordHash)) throw new AuthError(INVALID_CREDENTIALS, 401);

    const token = randomId(32);
    db.sessions[token] = { userId: user.id, expiresAt: Date.now() + SESSION_TTL };
    await save(db);
    return token;
  },

  async logout(token: string): Promise<void> {
    await latency(250);
    const db = await getDB();
    delete db.sessions[token];
    await save(db);
  },

  async getMe(token: string): Promise<PrivateProfile> {
    await latency(300);
    const db = await getDB();
    return toProfile(await requireUser(db, token));
  },

  async updateMe(token: string, update: ProfileUpdate): Promise<PrivateProfile> {
    await latency(700);
    const db = await getDB();
    const user = await requireUser(db, token);

    const nameError = validateFullName(update.fullName);
    if (nameError) throw new AuthError(nameError, 400, 'fullName');
    const usernameError = validateUsername(update.username);
    if (usernameError) throw new AuthError(usernameError, 400, 'username');
    const emailError = validateEmail(update.email);
    if (emailError) throw new AuthError(emailError, 400, 'email');

    const email = normalize(update.email);
    const username = update.username.trim().toLowerCase();
    if (db.users.some((u) => u.id !== user.id && u.email === email)) {
      throw new AuthError('That email is already used by another account.', 409, 'email');
    }
    if (db.users.some((u) => u.id !== user.id && u.username === username)) {
      throw new AuthError('That username is taken.', 409, 'username');
    }

    user.fullName = update.fullName.trim();
    user.email = email;
    user.username = username;
    await save(db);
    return toProfile(user);
  },

  /** Always resolves for valid emails so the response never reveals whether an account exists. */
  async requestPasswordReset(email: string): Promise<void> {
    await latency(900);
    const emailError = validateEmail(email);
    if (emailError) throw new AuthError(emailError, 400, 'email');
  },

  async listMyPostIds(token: string): Promise<string[]> {
    await latency(200);
    const db = await getDB();
    const user = await requireUser(db, token);
    return Object.keys(db.postOwners).filter((postId) => db.postOwners[postId] === user.id);
  },

  async claimPost(token: string, postId: string): Promise<void> {
    const db = await getDB();
    const user = await requireUser(db, token);
    if (db.postOwners[postId]) throw new AuthError('This post already has an owner.', 409);
    db.postOwners[postId] = user.id;
    await save(db);
  },

  async deletePost(token: string, postId: string): Promise<void> {
    await latency(300);
    const db = await getDB();
    const user = await requireUser(db, token);
    if (db.postOwners[postId] !== user.id) throw new AuthError('You can only delete your own confessions.', 403);
    delete db.postOwners[postId];
    await save(db);
  }
};

function getDB() {
  if (!dbPromise) dbPromise = initDB();
  return dbPromise;
}

async function initDB(): Promise<ServerDB> {
  try {
    const raw = await AsyncStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as ServerDB;
  } catch {
    // fall through to a fresh database
  }

  const salt = randomId();
  const demo: StoredUser = {
    id: 'u_demo',
    fullName: 'Maria Santos',
    email: DEMO_ACCOUNT.email,
    username: 'maria_s',
    salt,
    passwordHash: await hashPassword(DEMO_ACCOUNT.password, salt),
    createdAt: '2026-08-01T08:00:00.000Z'
  };
  const db: ServerDB = { users: [demo], sessions: {}, postOwners: { c119: demo.id, c104: demo.id } };
  await save(db);
  return db;
}

async function save(db: ServerDB) {
  try {
    await AsyncStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // storage unavailable — keep in memory only
  }
}

async function requireUser(db: ServerDB, token: string | null): Promise<StoredUser> {
  if (!token) throw new AuthError('Please log in to continue.', 401);
  const session = db.sessions[token];
  if (!session || session.expiresAt < Date.now()) {
    if (session) {
      delete db.sessions[token];
      await save(db);
    }
    throw new AuthError('Your session has expired. Please log in again.', 401);
  }
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) throw new AuthError('Please log in to continue.', 401);
  return user;
}

function toProfile(u: StoredUser): PrivateProfile {
  return { id: u.id, fullName: u.fullName, email: u.email, username: u.username, createdAt: u.createdAt };
}

function uniqueUsername(db: ServerDB, base: string) {
  const slug = (base.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16) || 'student').padEnd(3, '0');
  let candidate = slug;
  let n = 1;
  while (db.users.some((u) => u.username === candidate)) candidate = `${slug}${n++}`;
  return candidate;
}

function normalize(email: string) {
  return email.trim().toLowerCase();
}

function latency(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function randomId(bytes = 16) {
  return toHex(Crypto.getRandomBytes(bytes));
}

async function hashPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toHex(arr: Uint8Array) {
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}