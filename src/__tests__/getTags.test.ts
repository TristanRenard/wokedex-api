/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { User } from "../db/schema.js"
import createTag from "../utils/tags/createTag.js"
import getTags from "../utils/tags/getTags.js"
import { createUser } from "../utils/users/createUser.js"
import { cleanDatabase } from "./helper.js"
import { testDb } from "./setup.js"

describe("getTags", () => {
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

  it("should return empty array when no tags exist", async () => {
    const result = await getTags({ database: testDb as any })
    expect(result).toEqual([])
  })

  it("should return only global tags when no userId provided", async () => {
    await createTag({ name: "Global Tag", database: testDb as any })
    await createTag({
      name: "User Tag",
      userId: testUser1.id,
      database: testDb as any,
    })

    const result = await getTags({ database: testDb as any })

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Global Tag")
    expect(result[0].user).toBeNull()
  })

  it("should return global and user tags when userId provided", async () => {
    await createTag({ name: "Global Tag", database: testDb as any })
    await createTag({
      name: "User Tag",
      userId: testUser1.id,
      database: testDb as any,
    })

    const result = await getTags({
      userId: testUser1.id,
      database: testDb as any,
    })

    expect(result).toHaveLength(2)
    const tagNames = result.map((tag) => tag.name).sort()
    expect(tagNames).toEqual(["Global Tag", "User Tag"])
  })

  it("should not return other users tags", async () => {
    await createTag({ name: "Global Tag", database: testDb as any })
    await createTag({
      name: "User1 Tag",
      userId: testUser1.id,
      database: testDb as any,
    })
    await createTag({
      name: "User2 Tag",
      userId: testUser2.id,
      database: testDb as any,
    })

    const result = await getTags({
      userId: testUser1.id,
      database: testDb as any,
    })

    expect(result).toHaveLength(2)
    const tagNames = result.map((tag) => tag.name).sort()
    expect(tagNames).toEqual(["Global Tag", "User1 Tag"])
    expect(tagNames).not.toContain("User2 Tag")
  })

  it("should return tags ordered by name", async () => {
    await createTag({ name: "Zebra Tag", database: testDb as any })
    await createTag({ name: "Alpha Tag", database: testDb as any })
    await createTag({ name: "Beta Tag", database: testDb as any })

    const result = await getTags({ database: testDb as any })

    expect(result).toHaveLength(3)
    expect(result[0].name).toBe("Alpha Tag")
    expect(result[1].name).toBe("Beta Tag")
    expect(result[2].name).toBe("Zebra Tag")
  })

  it("should handle mixed global and user tags ordering", async () => {
    await createTag({ name: "Zebra Global", database: testDb as any })
    await createTag({
      name: "Alpha User",
      userId: testUser1.id,
      database: testDb as any,
    })
    await createTag({ name: "Beta Global", database: testDb as any })

    const result = await getTags({
      userId: testUser1.id,
      database: testDb as any,
    })

    expect(result).toHaveLength(3)
    expect(result[0].name).toBe("Alpha User")
    expect(result[1].name).toBe("Beta Global")
    expect(result[2].name).toBe("Zebra Global")
  })

  it("should return correct tag structure", async () => {
    const tagData = {
      name: "Test Tag",
      userId: testUser1.id,
      keywords: ["test", "tag"],
      style: { color: "blue" },
      database: testDb as any,
    }
    await createTag(tagData)

    const result = await getTags({
      userId: testUser1.id,
      database: testDb as any,
    })

    expect(result).toHaveLength(1)
    const [tag] = result
    expect(tag).toHaveProperty("id")
    expect(tag).toHaveProperty("name", "Test Tag")
    expect(tag).toHaveProperty("user", testUser1.id)
    expect(tag).toHaveProperty("keywords", ["test", "tag"])
    expect(tag).toHaveProperty("style", { color: "blue" })
    expect(tag).toHaveProperty("createdAt")
    expect(tag).toHaveProperty("updatedAt")
  })
})
