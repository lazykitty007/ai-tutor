import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as postLogin } from "@/app/api/auth/login/route";
import { POST as postRegister } from "@/app/api/auth/register/route";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionForUser, registerUserWithPassword, verifyUserPassword } from "@/lib/auth/repository";

vi.mock("@/lib/auth/repository", () => ({
  createSessionForUser: vi.fn(),
  registerUserWithPassword: vi.fn(),
  verifyUserPassword: vi.fn(),
}));

describe("auth password helpers", () => {
  it("hashes passwords with a salt and verifies the original password only", async () => {
    const credential = await hashPassword("secret-pass");

    expect(credential.passwordHash).not.toBe("secret-pass");
    expect(credential.passwordSalt.length).toBeGreaterThan(16);
    await expect(verifyPassword("secret-pass", credential)).resolves.toBe(true);
    await expect(verifyPassword("wrong-pass", credential)).resolves.toBe(false);
  });
});

describe("auth API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a parent account and sets the session cookie", async () => {
    vi.mocked(registerUserWithPassword).mockResolvedValue({
      id: "user_registered",
      email: "parent@example.com",
      displayName: "小宇家长",
    });
    vi.mocked(createSessionForUser).mockResolvedValue({
      token: "session_token_registered",
      expiresAt: new Date("2026-07-20T00:00:00.000Z"),
    });

    const response = await postRegister(
      new Request("http://test.local/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "parent@example.com",
          password: "secret-pass",
          displayName: "小宇家长",
        }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      ok: true,
      data: { user: { id: "user_registered", email: "parent@example.com" } },
    });
    expect(response.headers.get("set-cookie")).toContain("ai_tutor_session=session_token_registered");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("logs in with email and password and sets the session cookie", async () => {
    vi.mocked(verifyUserPassword).mockResolvedValue({
      id: "user_seed_parent",
      email: "parent@example.com",
      displayName: "小宇家长",
    });
    vi.mocked(createSessionForUser).mockResolvedValue({
      token: "session_token_login",
      expiresAt: new Date("2026-07-20T00:00:00.000Z"),
    });

    const response = await postLogin(
      new Request("http://test.local/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "parent@example.com",
          password: "secret-pass",
        }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(createSessionForUser).toHaveBeenCalledWith("user_seed_parent", undefined);
    expect(response.headers.get("set-cookie")).toContain("ai_tutor_session=session_token_login");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("rejects invalid login credentials", async () => {
    vi.mocked(verifyUserPassword).mockResolvedValue(null);

    const response = await postLogin(
      new Request("http://test.local/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "parent@example.com",
          password: "bad-pass",
        }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
  });
});
