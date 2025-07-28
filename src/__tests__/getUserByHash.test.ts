/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { UnpreparedUser } from "../types/user.js"
import { createUser } from "../utils/users/createUser.js"
import getUserByHash from "../utils/users/getUserByHash.js"
import { cleanDatabase } from "./helper.js"
import { testDb } from "./setup.js"

describe("getUserByHash", () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  it("should return user when user exists with given hash", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }
    const createdUser = await createUser(unpreparedUser, testDb as any)
    const foundUser = await getUserByHash(createdUser.hash, testDb as any)

    expect(foundUser).toBeDefined()
    expect(foundUser.id).toBe(createdUser.id)
    expect(foundUser.username).toBe("testuser")
    expect(foundUser.hash).toBe(createdUser.hash)
  })

  it("should return undefined when user does not exist", async () => {
    const nonExistentHash =
      "96b42d8e75897d4d9cf1805a912c643e92c0cbfdaa98628ecadc2f84c62bfefd"
    const foundUser = await getUserByHash(nonExistentHash, testDb as any)

    expect(foundUser).toBeUndefined()
  })

  it("should handle case insensitive email hash lookup", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "TEST@EXAMPLE.COM",
      username: "testuser1",
    }
    const user1 = await createUser(unpreparedUser1, testDb as any)
    const foundUser = await getUserByHash(user1.hash, testDb as any)

    expect(foundUser).toBeDefined()
    expect(foundUser.id).toBe(user1.id)
    expect(foundUser.username).toBe("testuser1")
  })

  it("should handle emails with whitespace hash lookup", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "  test@example.com  ",
      username: "testuser1",
    }
    const user1 = await createUser(unpreparedUser1, testDb as any)
    const foundUser = await getUserByHash(user1.hash, testDb as any)

    expect(foundUser).toBeDefined()
    expect(foundUser.id).toBe(user1.id)
    expect(foundUser.username).toBe("testuser1")
  })

  it("should handle special characters in email hash", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test+tag@example.com",
      username: "testuser",
    }
    const createdUser = await createUser(unpreparedUser, testDb as any)
    const foundUser = await getUserByHash(createdUser.hash, testDb as any)

    expect(foundUser).toBeDefined()
    expect(foundUser.id).toBe(createdUser.id)
    expect(foundUser.username).toBe("testuser")
    expect(foundUser.hash).toBe(createdUser.hash)
  })

  it("should return correct user when multiple users exist", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "user1@example.com",
      username: "user1",
    }
    const unpreparedUser2: UnpreparedUser = {
      email: "user2@example.com",
      username: "user2",
    }
    const user1 = await createUser(unpreparedUser1, testDb as any)
    const user2 = await createUser(unpreparedUser2, testDb as any)
    const foundUser1 = await getUserByHash(user1.hash, testDb as any)
    const foundUser2 = await getUserByHash(user2.hash, testDb as any)

    expect(foundUser1).toBeDefined()
    expect(foundUser1.id).toBe(user1.id)
    expect(foundUser1.username).toBe("user1")

    expect(foundUser2).toBeDefined()
    expect(foundUser2.id).toBe(user2.id)
    expect(foundUser2.username).toBe("user2")

    expect(foundUser1.id).not.toBe(foundUser2.id)
    expect(foundUser1.hash).not.toBe(foundUser2.hash)
  })

  it("should handle empty hash", async () => {
    const foundUser = await getUserByHash("", testDb as any)
    expect(foundUser).toBeUndefined()
  })

  it("should handle very long hash", async () => {
    const longHash = "a".repeat(64)
    const foundUser = await getUserByHash(longHash, testDb as any)
    expect(foundUser).toBeUndefined()
  })

  it("should handle invalid hash format", async () => {
    const invalidHash = "invalid-hash-format"
    const foundUser = await getUserByHash(invalidHash, testDb as any)
    expect(foundUser).toBeUndefined()
  })

  it("should return user with all expected fields", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }
    const createdUser = await createUser(unpreparedUser, testDb as any)
    const foundUser = await getUserByHash(createdUser.hash, testDb as any)

    expect(foundUser).toBeDefined()
    expect(foundUser.id).toBeDefined()
    expect(foundUser.username).toBe("testuser")
    expect(foundUser.hash).toBeDefined()
    expect(foundUser.verificationToken).toBeNull()
    expect(foundUser.verificationTokenExpiresAt).toBeNull()
    expect(foundUser.verifiedAt).toBeNull()
    expect(foundUser.createdAt).toBeInstanceOf(Date)
    expect(foundUser.lastLogin).toBeNull()
    expect(foundUser.role).toBeDefined()
  })
})
