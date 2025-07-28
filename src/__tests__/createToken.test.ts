/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { users } from "../db/schema.js"
import type { UnpreparedUser } from "../types/user.js"
import createToken from "../utils/users/createToken.js"
import { createUser } from "../utils/users/createUser.js"
import { cleanDatabase } from "./helper.js"
import { testDb } from "./setup.js"

describe("createToken", () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  it("should create verification token successfully", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    const result = await createToken(user.hash, testDb as any)

    expect(result.verificationToken).toBeDefined()
    expect(typeof result.verificationToken).toBe("string")
    expect(result.verificationToken.length).toBeGreaterThan(0)
    expect(result.verificationTokenExpiresAt).toBeInstanceOf(Date)

    // Check that token was saved to database
    const [updatedUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user.hash))
    expect(updatedUser.verificationToken).toBe(result.verificationToken)
    expect(updatedUser.verificationTokenExpiresAt).toEqual(
      result.verificationTokenExpiresAt,
    )
  })

  it("should set expiration time to 15 minutes from now", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    const beforeCreation = new Date()
    const result = await createToken(user.hash, testDb as any)
    const afterCreation = new Date()

    expect(result.verificationTokenExpiresAt).toBeInstanceOf(Date)
    expect(result.verificationTokenExpiresAt.getTime()).toBeGreaterThan(
      beforeCreation.getTime(),
    )
    expect(result.verificationTokenExpiresAt.getTime()).toBeLessThanOrEqual(
      afterCreation.getTime() + 15 * 60 * 1000,
    )

    // Check that expiration is approximately 15 minutes from creation
    const timeDiff =
      result.verificationTokenExpiresAt.getTime() - beforeCreation.getTime()
    // At least 14 minutes
    expect(timeDiff).toBeGreaterThanOrEqual(14 * 60 * 1000)
    // At most 16 minutes
    expect(timeDiff).toBeLessThanOrEqual(16 * 60 * 1000)
  })

  it("should generate unique tokens for different users", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "test1@example.com",
      username: "testuser1",
    }
    const unpreparedUser2: UnpreparedUser = {
      email: "test2@example.com",
      username: "testuser2",
    }

    await createUser(unpreparedUser1, testDb as any)
    await createUser(unpreparedUser2, testDb as any)

    const [user1] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser1"))
    const [user2] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser2"))
    const result1 = await createToken(user1.hash, testDb as any)
    const result2 = await createToken(user2.hash, testDb as any)

    expect(result1.verificationToken).not.toBe(result2.verificationToken)
    expect(result1.verificationTokenExpiresAt).not.toEqual(
      result2.verificationTokenExpiresAt,
    )
  })

  it("should generate different tokens for same user on multiple calls", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    const result1 = await createToken(user.hash, testDb as any)
    const result2 = await createToken(user.hash, testDb as any)

    expect(result1.verificationToken).not.toBe(result2.verificationToken)
    expect(result1.verificationTokenExpiresAt).not.toEqual(
      result2.verificationTokenExpiresAt,
    )

    // Check that the second token overwrote the first in the database
    const [updatedUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user.hash))
    expect(updatedUser.verificationToken).toBe(result2.verificationToken)
    expect(updatedUser.verificationTokenExpiresAt).toEqual(
      result2.verificationTokenExpiresAt,
    )
  })

  it("should handle non-existent hash gracefully", async () => {
    const nonExistentHash = "non-existent-hash-123"
    // Should not throw error, but token won't be saved to database
    const result = await createToken(nonExistentHash, testDb as any)

    expect(result.verificationToken).toBeDefined()
    expect(result.verificationTokenExpiresAt).toBeInstanceOf(Date)
  })

  it("should generate tokens with valid format", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    const result = await createToken(user.hash, testDb as any)

    // CUID2 tokens typically start with a letter and contain alphanumeric characters
    expect(result.verificationToken).toMatch(/^[a-z][a-z0-9]*$/)
    expect(result.verificationToken.length).toBeGreaterThan(10)
  })

  it("should not affect other user fields", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    const originalId = user.id
    const originalHash = user.hash
    const originalUsername = user.username

    await createToken(user.hash, testDb as any)

    const [updatedUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user.hash))

    expect(updatedUser.id).toBe(originalId)
    expect(updatedUser.hash).toBe(originalHash)
    expect(updatedUser.username).toBe(originalUsername)
    expect(updatedUser.verificationToken).toBeDefined()
    expect(updatedUser.verificationTokenExpiresAt).toBeDefined()
  })

  it("should handle multiple rapid token creations", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(createToken(user.hash, testDb as any))
    }

    const results = await Promise.all(promises)

    // All should succeed and generate different tokens
    results.forEach((result) => {
      expect(result.verificationToken).toBeDefined()
      expect(result.verificationTokenExpiresAt).toBeInstanceOf(Date)
    })

    // Check that one of the generated tokens is saved in the database
    const [updatedUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user.hash))
    expect(updatedUser.verificationToken).toBeDefined()
    expect(
      results.some(
        (result) => result.verificationToken === updatedUser.verificationToken,
      ),
    ).toBe(true)
  })
})
