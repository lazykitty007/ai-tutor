import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { withConnection } from "@/lib/db/client";
import { hashPassword, verifyPassword, type PasswordCredential } from "./password";

const SESSION_DAYS = 30;

export type UserAccount = {
  id: string;
  email: string;
  displayName: string;
};

export type SessionToken = {
  token: string;
  expiresAt: Date;
};

type UserCredentialRow = RowDataPacket & {
  id: string;
  email: string;
  display_name: string | null;
  password_hash: string;
  password_salt: string;
  password_algorithm: PasswordCredential["passwordAlgorithm"];
};

type SessionUserRow = RowDataPacket & {
  id: string;
  email: string;
  display_name: string | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toMysqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 23).replace("T", " ");
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function mapUser(row: Pick<UserCredentialRow, "id" | "email" | "display_name">): UserAccount {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name || row.email,
  };
}

export async function registerUserWithPassword(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<UserAccount> {
  const email = normalizeEmail(input.email);
  const credential = await hashPassword(input.password);
  const userId = randomUUID();

  return withConnection(async (connection) => {
    await connection.beginTransaction();

    try {
      await connection.query(
        `INSERT INTO users (id, email, display_name, auth_provider)
         VALUES (?, ?, ?, 'password')`,
        [userId, email, input.displayName?.trim() || email],
      );
      await connection.query(
        `INSERT INTO user_credentials (user_id, password_hash, password_salt, password_algorithm)
         VALUES (?, ?, ?, ?)`,
        [userId, credential.passwordHash, credential.passwordSalt, credential.passwordAlgorithm],
      );
      await connection.commit();

      return {
        id: userId,
        email,
        displayName: input.displayName?.trim() || email,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

export async function verifyUserPassword(emailInput: string, password: string): Promise<UserAccount | null> {
  const email = normalizeEmail(emailInput);

  return withConnection(async (connection) => {
    const [rows] = await connection.query<UserCredentialRow[]>(
      `SELECT u.id, u.email, u.display_name, uc.password_hash, uc.password_salt, uc.password_algorithm
       FROM users u
       INNER JOIN user_credentials uc ON uc.user_id = u.id
       WHERE u.email = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [email],
    );
    const row = rows[0];

    if (!row) {
      return null;
    }

    const valid = await verifyPassword(password, {
      passwordHash: row.password_hash,
      passwordSalt: row.password_salt,
      passwordAlgorithm: row.password_algorithm,
    });

    return valid ? mapUser(row) : null;
  });
}

export async function createSessionForUser(userId: string, userAgent?: string): Promise<SessionToken> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await withConnection(async (connection) => {
    await connection.query(
      `INSERT INTO user_sessions (id, user_id, token_hash, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), userId, tokenHash, userAgent || null, toMysqlDateTime(expiresAt)],
    );
  });

  return { token, expiresAt };
}

export async function getUserBySessionToken(token: string | undefined): Promise<UserAccount | null> {
  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  return withConnection(async (connection) => {
    const [rows] = await connection.query<SessionUserRow[]>(
      `SELECT u.id, u.email, u.display_name
       FROM user_sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?
         AND s.revoked_at IS NULL
         AND s.expires_at > UTC_TIMESTAMP(3)
         AND u.deleted_at IS NULL
       LIMIT 1`,
      [tokenHash],
    );

    if (!rows[0]) {
      return null;
    }

    await connection.query(
      "UPDATE user_sessions SET last_seen_at = UTC_TIMESTAMP(3) WHERE token_hash = ?",
      [tokenHash],
    );

    return mapUser(rows[0]);
  });
}

export async function revokeSessionToken(token: string | undefined): Promise<void> {
  if (!token) {
    return;
  }

  await withConnection(async (connection) => {
    await connection.query(
      "UPDATE user_sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE token_hash = ?",
      [hashSessionToken(token)],
    );
  });
}
