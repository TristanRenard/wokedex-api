/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import verifyController from "../controllers/verifyController.js"
import { users } from "../db/schema.js"
import type { UnpreparedUser } from "../types/user.js"
import createToken from "../utils/users/createToken.js"
import { createUser } from "../utils/users/createUser.js"
import { cleanDatabase } from "./helper.js"
import { testDb } from "./setup.js"

// Mock console.log to avoid noise in tests
const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined)

describe("verifyController", () => {
  beforeEach(async () => {
    await cleanDatabase()
    consoleSpy.mockClear()
  })

  afterEach(async () => {
    await cleanDatabase()
    consoleSpy.mockRestore()
  })

  it("should verify user successfully with valid token and username", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    const { verificationToken } = await createToken(user.hash, testDb as any)

    // Set verifiedAt to simulate a verified user
    await testDb
      .update(users)
      .set({ verifiedAt: new Date() })
      .where(eq(users.hash, user.hash))

    const jwt = await verifyController(
      "newusername",
      verificationToken,
      testDb as any,
    )

    expect(jwt).toBeDefined()
    expect(typeof jwt).toBe("string")
    expect(jwt.length).toBeGreaterThan(0)

    // Check that user was updated
    const [updatedUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user.hash))
    expect(updatedUser.username).toBe("newusername")
    expect(updatedUser.verificationToken).toBeNull()
    expect(updatedUser.verificationTokenExpiresAt).toBeNull()
    expect(updatedUser.verifiedAt).toBeInstanceOf(Date)
  })

  it("should verify user successfully without username", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    const { verificationToken } = await createToken(user.hash, testDb as any)

    // Set verifiedAt to simulate a verified user
    await testDb
      .update(users)
      .set({ verifiedAt: new Date() })
      .where(eq(users.hash, user.hash))

    const jwt = await verifyController("", verificationToken, testDb as any)

    expect(jwt).toBeDefined()
    expect(typeof jwt).toBe("string")
    expect(jwt.length).toBeGreaterThan(0)

    // Check that username was not changed
    const [updatedUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user.hash))
    expect(updatedUser.username).toBe("testuser")
    expect(updatedUser.verificationToken).toBeNull()
    expect(updatedUser.verificationTokenExpiresAt).toBeNull()
  })

  it("should throw error when verificationToken is missing", async () => {
    await expect(
      verifyController("username", "", testDb as any),
    ).rejects.toThrow("Username and verificationToken are required")
  })

  it("should throw error when both username and verificationToken are missing", async () => {
    await expect(verifyController("", "", testDb as any)).rejects.toThrow(
      "Username and verificationToken are required",
    )
  })

  it("should throw error when user is not found", async () => {
    const invalidToken = "invalid-token-123"
    await expect(
      verifyController("username", invalidToken, testDb as any),
    ).rejects.toThrow("User not found")
  })

  it("should throw error when user is not verified", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    const { verificationToken } = await createToken(user.hash, testDb as any)

    // Don't set verifiedAt - user should not be verified

    await expect(
      verifyController("username", verificationToken, testDb as any),
    ).rejects.toThrow("User cannot be verified")
  })

  it("should throw error when verification token is expired", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    const { verificationToken } = await createToken(user.hash, testDb as any)
    // Set verifiedAt and expired token
    // 1 hour ago
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60)
    await testDb
      .update(users)
      .set({
        verifiedAt: new Date(),
        verificationTokenExpiresAt: expiredDate,
      })
      .where(eq(users.hash, user.hash))

    await expect(
      verifyController("username", verificationToken, testDb as any),
    ).rejects.toThrow("Verification token expired")
  })

  it("should handle JWT generation failure", async () => {
    // Mock JWT_SECRET to be undefined to simulate JWT generation failure
    const originalJwtSecret = process.env.JWT_SECRET
    delete process.env.JWT_SECRET

    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    const { verificationToken } = await createToken(user.hash, testDb as any)

    // Set verifiedAt to simulate a verified user
    await testDb
      .update(users)
      .set({ verifiedAt: new Date() })
      .where(eq(users.hash, user.hash))

    await expect(
      verifyController("username", verificationToken, testDb as any),
    ).rejects.toThrow("secretOrPrivateKey must have a value")

    // Restore JWT_SECRET
    process.env.JWT_SECRET = originalJwtSecret
  })
})
