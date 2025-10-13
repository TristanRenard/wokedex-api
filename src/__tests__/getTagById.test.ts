/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { User } from "../db/schema.js"
import createTag from "../utils/tags/createTag.js"
import getTagById from "../utils/tags/getTagById.js"
import { createUser } from "../utils/users/createUser.js"
import { cleanDatabase } from "./helper.js"
import { testDb } from "./setup.js"

describe("getTagById", () => {
  let testUser1: User = {} as User
  let testUser2: User = {} as User

  beforeEach(async () => {
    await cleanDatabase()

    testUser1 = await createUser(
      {
        email: "user1@example.com",
        username: "user1",
      },
      testDb as any,
    )

    testUser2 = await createUser(
      {
        email: "user2@example.com",
        username: "user2",
      },
      testDb as any,
    )
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  it("should return null when tag does not exist", async () => {
    const result = await getTagById({
      tagId: "non-existent-id",
      database: testDb as any,
    })
    expect(result).toBeNull()
  })

  it("should return global tag when no userId provided", async () => {
    const tag = await createTag({ name: "Global Tag", database: testDb as any })
    const result = await getTagById({ tagId: tag.id, database: testDb as any })

    expect(result).toBeDefined()
    expect(result?.name).toBe("Global Tag")
    expect(result?.user).toBeNull()
  })

  it("should return user tag when userId matches", async () => {
    const tag = await createTag({
      name: "User Tag",
      userId: testUser1.id,
      database: testDb as any,
    })
    const result = await getTagById({
      tagId: tag.id,
      userId: testUser1.id,
      database: testDb as any,
    })

    expect(result).toBeDefined()
    expect(result?.name).toBe("User Tag")
    expect(result?.user).toBe(testUser1.id)
  })

  it("should return global tag when userId provided but tag is global", async () => {
    const tag = await createTag({ name: "Global Tag", database: testDb as any })
    const result = await getTagById({
      tagId: tag.id,
      userId: testUser1.id,
      database: testDb as any,
    })

    expect(result).toBeDefined()
    expect(result?.name).toBe("Global Tag")
    expect(result?.user).toBeNull()
  })

  it("should not return user tag when userId does not match", async () => {
    const tag = await createTag({
      name: "User Tag",
      userId: testUser1.id,
      database: testDb as any,
    })
    const result = await getTagById({
      tagId: tag.id,
      userId: testUser2.id,
      database: testDb as any,
    })

    expect(result).toBeNull()
  })

  it("should not return user tag when no userId provided", async () => {
    const tag = await createTag({
      name: "User Tag",
      userId: testUser1.id,
      database: testDb as any,
    })
    const result = await getTagById({ tagId: tag.id, database: testDb as any })

    expect(result).toBeNull()
  })

  it("should return correct tag structure", async () => {
    const tagData = {
      name: "Test Tag",
      userId: testUser1.id,
      keywords: ["test", "tag"],
      style: { color: "blue" },
      database: testDb as any,
    }
    const createdTag = await createTag(tagData)
    const result = await getTagById({
      tagId: createdTag.id,
      userId: testUser1.id,
      database: testDb as any,
    })

    expect(result).toBeDefined()
    expect(result).toHaveProperty("id", createdTag.id)
    expect(result).toHaveProperty("name", "Test Tag")
    expect(result).toHaveProperty("user", testUser1.id)
    expect(result).toHaveProperty("keywords", ["test", "tag"])
    expect(result).toHaveProperty("style", { color: "blue" })
    expect(result).toHaveProperty("createdAt")
    expect(result).toHaveProperty("updatedAt")
  })

  it("should handle multiple tags correctly", async () => {
    const globalTag = await createTag({
      name: "Global Tag",
      database: testDb as any,
    })
    const userTag = await createTag({
      name: "User Tag",
      userId: testUser1.id,
      database: testDb as any,
    })
    const globalResult = await getTagById({
      tagId: globalTag.id,
      database: testDb as any,
    })
    const userResult = await getTagById({
      tagId: userTag.id,
      userId: testUser1.id,
      database: testDb as any,
    })

    expect(globalResult).toBeDefined()
    expect(globalResult?.name).toBe("Global Tag")
    expect(globalResult?.user).toBeNull()

    expect(userResult).toBeDefined()
    expect(userResult?.name).toBe("User Tag")
    expect(userResult?.user).toBe(testUser1.id)
  })

  it("should handle case sensitivity correctly", async () => {
    const tag = await createTag({
      name: "Test Tag",
      userId: testUser1.id,
      database: testDb as any,
    })
    const modifiedId = tag.id.toUpperCase()
    const result = await getTagById({
      tagId: modifiedId,
      userId: testUser1.id,
      database: testDb as any,
    })

    expect(result).toBeNull()
  })
})
