import { users } from "../db/schema.js"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import type { UnpreparedUser } from "../types/user.js"
import { createUser } from "../utils/users/createUser.js"
import { cleanDatabase } from "./helper.js"
import { testDb } from "./setup.js"

describe("createUser", () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  it("should create a user successfully", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser"
    }

    await createUser(unpreparedUser, testDb as any)

    const [createdUser] = await testDb.select().from(users).where(eq(users.username, "testuser"))
    expect(createdUser).toBeDefined()

    expect(createdUser.username).toBe("testuser")
    expect(createdUser.id).not.toBe(createdUser.hash)
    expect(createdUser.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(createdUser.verificationToken).toBeNull()
    expect(createdUser.verifiedAt).toBeNull()
    expect(createdUser.createdAt).toBeInstanceOf(Date)
  })

  it("should generate consistent hash for same email", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser"
    }

    await createUser(unpreparedUser, testDb as any)

    const [createdUser] = await testDb.select().from(users).where(eq(users.username, "testuser"))
    const expectedHash = "eb009fbc5c915bea2c09c363280beb377cca0a3e7bee59df2d7c59ec7870dddc"
    expect(createdUser.hash).toBe(expectedHash)
    expect(createdUser.id).not.toBe(expectedHash)
    expect(createdUser.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it("should handle case insensitive email for hash generation", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "TEST@EXAMPLE.COM",
      username: "testuser1"
    }
    const unpreparedUser2: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser2"
    }

    await createUser(unpreparedUser1, testDb as any)
    const [user1] = await testDb.select().from(users).where(eq(users.username, "testuser1"))
    await testDb.delete(users).where(eq(users.id, user1.id))
    await createUser(unpreparedUser2, testDb as any)

    const [user2] = await testDb.select().from(users).where(eq(users.username, "testuser2"))

    expect(user1.hash).toBe(user2.hash)
    expect(user1.id).not.toBe(user2.id)
  })

  it("should handle emails with whitespace", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "  test@example.com  ",
      username: "testuser"
    }

    await createUser(unpreparedUser, testDb as any)

    const [createdUser] = await testDb.select().from(users).where(eq(users.username, "testuser"))
    const expectedHash = "eb009fbc5c915bea2c09c363280beb377cca0a3e7bee59df2d7c59ec7870dddc"
    expect(createdUser.hash).toBe(expectedHash)
  })

  it("should set verification fields to null for new users", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser"
    }

    await createUser(unpreparedUser, testDb as any)

    const [createdUser] = await testDb.select().from(users).where(eq(users.username, "testuser"))

    expect(createdUser.verificationToken).toBeNull()
    expect(createdUser.verifiedAt).toBeNull()
    expect(createdUser.verificationTokenExpiresAt).toBeNull()
  })

  it("should set createdAt timestamp", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser"
    }
    const beforeCreation = new Date()
    await createUser(unpreparedUser, testDb as any)
    const afterCreation = new Date()
    const [createdUser] = await testDb.select().from(users).where(eq(users.username, "testuser"))

    expect(createdUser.createdAt).toBeInstanceOf(Date)
    expect(createdUser.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000)
    expect(createdUser.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000)
  })

  it("should set lastLogin to null for new users", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser"
    }

    await createUser(unpreparedUser, testDb as any)

    const [createdUser] = await testDb.select().from(users).where(eq(users.username, "testuser"))

    expect(createdUser.lastLogin).toBeNull()
  })

  it("should return null on successful creation", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser"
    }
    const result = await createUser(unpreparedUser, testDb as any)
    expect(result).toBeNull()
  })

  it("should not allow creating users with same email but different usernames", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "test@example.com",
      username: "user1"
    }
    const unpreparedUser2: UnpreparedUser = {
      email: "test@example.com",
      username: "user2"
    }

    await createUser(unpreparedUser1, testDb as any)

    await expect(createUser(unpreparedUser2, testDb as any)).rejects.toThrow(
      'Email "test@example.com" is already registered'
    )

    const allUsers = await testDb.select().from(users)
    expect(allUsers).toHaveLength(1)
  })

  it("should handle special characters in email", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test+tag@example.com",
      username: "testuser"
    }

    await createUser(unpreparedUser, testDb as any)

    const [createdUser] = await testDb.select().from(users).where(eq(users.username, "testuser"))
    expect(createdUser).toBeDefined()

    expect(createdUser.username).toBe("testuser")
    expect(createdUser.hash).toHaveLength(64)
    expect(createdUser.id).not.toBe(createdUser.hash)
    expect(createdUser.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it("should throw error when creating user with duplicate username", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "user1@example.com",
      username: "testuser"
    }
    const unpreparedUser2: UnpreparedUser = {
      email: "user2@example.com",
      username: "testuser"
    }

    await createUser(unpreparedUser1, testDb as any)

    await expect(createUser(unpreparedUser2, testDb as any)).rejects.toThrow(
      'Username "testuser" is already taken'
    )

    const allUsers = await testDb.select().from(users).where(eq(users.username, "testuser"))
    expect(allUsers).toHaveLength(1)
  })

  it("should throw error when creating user with duplicate email", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "test@example.com",
      username: "user1"
    }
    const unpreparedUser2: UnpreparedUser = {
      email: "test@example.com",
      username: "user2"
    }

    await createUser(unpreparedUser1, testDb as any)

    await expect(createUser(unpreparedUser2, testDb as any)).rejects.toThrow(
      'Email "test@example.com" is already registered'
    )

    const allUsers = await testDb.select().from(users)
    expect(allUsers).toHaveLength(1)
  })

  it("should throw error when creating user with both duplicate username and email", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser"
    }
    const unpreparedUser2: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser"
    }

    await createUser(unpreparedUser1, testDb as any)

    await expect(createUser(unpreparedUser2, testDb as any)).rejects.toThrow(
      'Username "testuser" is already taken'
    )

    const allUsers = await testDb.select().from(users)
    expect(allUsers).toHaveLength(1)
  })
}) 