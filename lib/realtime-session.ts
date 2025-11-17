import crypto from 'crypto';

export type SessionRole = 'customer' | 'admin';

export type SessionRecord = {
  token: string;
  role: SessionRole;
  referenceId: string;
  displayName?: string | null;
  metadata?: Record<string, any>;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  ttlMs: number;
};

const SESSION_TTL = 1000 * 60 * 30; // 30 minutes
const store = new Map<string, SessionRecord>();

export function createSession(input: {
  role: SessionRole;
  referenceId: string;
  displayName?: string | null;
  metadata?: Record<string, any>;
  ttlMs?: number;
}): SessionRecord {
  const now = Date.now();
  const ttlMs = input.ttlMs ?? SESSION_TTL;
  const session: SessionRecord = {
    token: crypto.randomUUID(),
    role: input.role,
    referenceId: input.referenceId,
    displayName: input.displayName ?? null,
    metadata: input.metadata ?? {},
    createdAt: now,
    lastSeenAt: now,
    expiresAt: now + ttlMs,
    ttlMs,
  };
  store.set(session.token, session);
  return session;
}

export function validateSession(token: string, role?: SessionRole): SessionRecord | null {
  if (!token) return null;
  const session = store.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    store.delete(token);
    return null;
  }
  if (role && session.role !== role) {
    return null;
  }
  return session;
}

export function touchSession(token: string, role?: SessionRole): SessionRecord | null {
  const session = validateSession(token, role);
  if (!session) return null;
  const now = Date.now();
  session.lastSeenAt = now;
  session.expiresAt = now + session.ttlMs;
  store.set(token, session);
  return session;
}

export function deleteSession(token: string) {
  store.delete(token);
}

export function serializeSession(session: SessionRecord) {
  return {
    token: session.token,
    role: session.role,
    referenceId: session.referenceId,
    displayName: session.displayName,
    metadata: session.metadata ?? {},
    createdAt: new Date(session.createdAt).toISOString(),
    lastSeenAt: new Date(session.lastSeenAt).toISOString(),
    expiresAt: new Date(session.expiresAt).toISOString(),
  };
}
