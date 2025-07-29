/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { users } from "../db/schema.js"
import type { UnpreparedUser } from "../types/user.js"
import createToken from "../utils/users/createToken.js"
import { createUser } from "../utils/users/createUser.js"
import getUserByVerificationToken from "../utils/users/getUserByVerificationToken.js"
import { cleanDatabase } from "./helper.js"
import { testDb } from "./setup.js"

describe("getUserByVerificationToken", () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  it("should find user with valid verification token", async () => {
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
    const foundUser = await getUserByVerificationToken(
      verificationToken,
      testDb as any,
    )

    expect(foundUser).toBeDefined()
    expect(foundUser?.id).toBe(user.id)
    expect(foundUser?.hash).toBe(user.hash)
    expect(foundUser?.username).toBe(user.username)
    expect(foundUser?.verificationToken).toBe(verificationToken)
  })

  it("should return null for invalid verification token", async () => {
    const invalidToken = "invalid-token-123"
    const foundUser = await getUserByVerificationToken(
      invalidToken,
      testDb as any,
    )

    expect(foundUser).toBeNull()
  })

  it("should return null for empty verification token", async () => {
    const foundUser = await getUserByVerificationToken("", testDb as any)

    expect(foundUser).toBeNull()
  })

  it("should handle case sensitive token matching", async () => {
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
    const modifiedToken = verificationToken.toUpperCase()
    const foundUser = await getUserByVerificationToken(
      modifiedToken,
      testDb as any,
    )

    expect(foundUser).toBeNull()
  })

  it("should work with multiple users having different tokens", async () => {
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
    const { verificationToken: token1 } = await createToken(
      user1.hash,
      testDb as any,
    )
    const { verificationToken: token2 } = await createToken(
      user2.hash,
      testDb as any,
    )
    const foundUser1 = await getUserByVerificationToken(token1, testDb as any)
    const foundUser2 = await getUserByVerificationToken(token2, testDb as any)

    expect(foundUser1).toBeDefined()
    expect(foundUser1?.username).toBe("testuser1")
    expect(foundUser2).toBeDefined()
    expect(foundUser2?.username).toBe("testuser2")
    expect(foundUser1?.id).not.toBe(foundUser2?.id)
  })

  it("should return null when token is partially matching", async () => {
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
    const partialToken = verificationToken.substring(
      0,
      verificationToken.length - 5,
    )
    const foundUser = await getUserByVerificationToken(
      partialToken,
      testDb as any,
    )

    expect(foundUser).toBeNull()
  })
})
