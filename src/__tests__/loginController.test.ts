/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import loginController from "../controllers/loginController.js"
import { users } from "../db/schema.js"
import type { UnpreparedUser } from "../types/user.js"
import { cleanDatabase } from "./helper.js"
import { testDb } from "./setup.js"

const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined)

describe("loginController", () => {
  beforeEach(async () => {
    await cleanDatabase()
    consoleSpy.mockClear()
  })

  afterEach(async () => {
    await cleanDatabase()
    consoleSpy.mockRestore()
  })

  it("should create new user when user does not exist", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await loginController(unpreparedUser, testDb as any)

    const [createdUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    expect(createdUser).toBeDefined()
    expect(createdUser.username).toBe("testuser")
    expect(createdUser.hash).toBeDefined()
    expect(createdUser.id).toBeDefined()
  })

  it("should find existing user when user already exists", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser",
    }

    await loginController(unpreparedUser, testDb as any)
    const firstUserCount = (await testDb.select().from(users)).length

    await loginController(unpreparedUser, testDb as any)
    const secondUserCount = (await testDb.select().from(users)).length

    expect(secondUserCount).toBe(firstUserCount)
  })

  it("should handle case insensitive email lookup", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "TEST@EXAMPLE.COM",
      username: "testuser1",
    }
    const unpreparedUser2: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser2",
    }

    await loginController(unpreparedUser1, testDb as any)
    const firstUserCount = (await testDb.select().from(users)).length

    await loginController(unpreparedUser2, testDb as any)
    const secondUserCount = (await testDb.select().from(users)).length

    expect(secondUserCount).toBe(firstUserCount)
  })

  it("should handle emails with whitespace", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "test@example.com",
      username: "testuser1",
    }
    const unpreparedUser2: UnpreparedUser = {
      email: "  test@example.com  ",
      username: "testuser2",
    }

    await loginController(unpreparedUser1, testDb as any)
    const firstUserCount = (await testDb.select().from(users)).length

    await loginController(unpreparedUser2, testDb as any)
    const secondUserCount = (await testDb.select().from(users)).length

    expect(secondUserCount).toBe(firstUserCount)
  })

  it("should handle special characters in email", async () => {
    const unpreparedUser: UnpreparedUser = {
      email: "test+tag@example.com",
      username: "testuser",
    }

    await loginController(unpreparedUser, testDb as any)

    const [createdUser] = await testDb
      .select()
      .from(users)
      .where(eq(users.username, "testuser"))
    expect(createdUser).toBeDefined()
    expect(createdUser.username).toBe("testuser")
    expect(createdUser.hash).toBeDefined()
  })

  it("should not create duplicate users for same email", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "test@example.com",
      username: "user1",
    }
    const unpreparedUser2: UnpreparedUser = {
      email: "test@example.com",
      username: "user2",
    }

    await loginController(unpreparedUser1, testDb as any)
    await loginController(unpreparedUser2, testDb as any)

    const allUsers = await testDb.select().from(users)
    expect(allUsers).toHaveLength(1)
  })

  it("should handle different usernames with same email", async () => {
    const unpreparedUser1: UnpreparedUser = {
      email: "test@example.com",
      username: "user1",
    }
    const unpreparedUser2: UnpreparedUser = {
      email: "test@example.com",
      username: "user2",
    }

    await loginController(unpreparedUser1, testDb as any)
    await loginController(unpreparedUser2, testDb as any)

    const allUsers = await testDb.select().from(users)
    expect(allUsers).toHaveLength(1)
    expect(allUsers[0].username).toBe("user1")
  })
})
