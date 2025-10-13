/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { users } from "../db/schema.js"
import type { UnpreparedUser } from "../types/user.js"
import { createUser } from "../utils/users/createUser.js"
import setUsername from "../utils/users/setUsername.js"
import { cleanDatabase } from "./helper.js"
import { testDb } from "./setup.js"

describe("setUsername", () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  it("should update username successfully", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "oldusername",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "oldusername"))

    await setUsername(user.hash, "newusername", testDb as any)

    const [updatedUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user.hash))
    expect(updatedUser.username).toBe("newusername")
    expect(updatedUser.id).toBe(user.id)
    expect(updatedUser.hash).toBe(user.hash)
  })

  it("should update username to empty string", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "oldusername",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "oldusername"))

    await setUsername(user.hash, "", testDb as any)

    const [updatedUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user.hash))
    expect(updatedUser.username).toBe("")
  })

  it("should update username with special characters", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "oldusername",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "oldusername"))
    const specialUsername = "user@123!_-"
    await setUsername(user.hash, specialUsername, testDb as any)

    const [updatedUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user.hash))
    expect(updatedUser.username).toBe(specialUsername)
  })

  it("should update username with unicode characters", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "oldusername",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "oldusername"))
    const unicodeUsername = "usér123émojis🚀"
    await setUsername(user.hash, unicodeUsername, testDb as any)

    const [updatedUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user.hash))
    expect(updatedUser.username).toBe(unicodeUsername)
  })

  it("should update username with very long string", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "oldusername",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "oldusername"))
    const longUsername = "a".repeat(100)
    await setUsername(user.hash, longUsername, testDb as any)

    const [updatedUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user.hash))
    expect(updatedUser.username).toBe(longUsername)
  })

  it("should not affect other users when updating username", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "test1@example.com",
      username: "user1",
    }
    const unpreparedUser2: UnpreparedUser = {
      email: "test2@example.com",
      username: "user2",
    }

    await createUser(unpreparedUser1, testDb as any)
    await createUser(unpreparedUser2, testDb as any)

    const [user1] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "user1"))
    const [user2] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "user2"))

    await setUsername(user1.hash, "newuser1", testDb as any)

    const [updatedUser1] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user1.hash))
    const [updatedUser2] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user2.hash))

    expect(updatedUser1.username).toBe("newuser1")
    expect(updatedUser2.username).toBe("user2")
  })

  it("should handle multiple username updates for same user", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "initialusername",
    }

    await createUser(unpreparedUser, testDb as any)
    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "initialusername"))

    await setUsername(user.hash, "secondusername", testDb as any)
    await setUsername(user.hash, "thirdusername", testDb as any)
    await setUsername(user.hash, "finalusername", testDb as any)

    const [updatedUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.hash, user.hash))
    expect(updatedUser.username).toBe("finalusername")
  })

  it("should not throw error for non-existent hash", async () => {
    const nonExistentHash = "non-existent-hash-123"

    await expect(
      setUsername(nonExistentHash, "newusername", testDb as any),
    ).resolves.toBeUndefined()
  })
})
