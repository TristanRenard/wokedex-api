/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { type User } from "../db/schema.js"
import createTag from "../utils/tags/createTag.js"
import { createUser } from "../utils/users/createUser.js"
import { cleanDatabase } from "./helper.js"
import { testDb } from "./setup.js"

describe("createTag", () => {
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

  it("should create users correctly", () => {
    expect(testUser1.id).toBeDefined()
    expect(testUser2.id).toBeDefined()
    expect(testUser1.username).toBe("user1")
    expect(testUser2.username).toBe("user2")
  })

  it("should create a tag successfully", async () => {
    const tagData = {
      name: "Test Tag",
      userId: testUser1.id,
      keywords: ["test", "tag"],
      style: { color: "blue" },
      database: testDb as any,
    }
    const result = await createTag(tagData)

    expect(result).toBeDefined()
    expect(result.name).toBe("Test Tag")
    expect(result.user).toBe(testUser1.id)
    expect(result.keywords).toEqual(["test", "tag"])
    expect(result.style).toEqual({ color: "blue" })
    expect(result.id).toBeDefined()
    expect(result.createdAt).toBeDefined()
    expect(result.updatedAt).toBeDefined()
  })

  it("should create a global tag when userId is not provided", async () => {
    const tagData = {
      name: "Global Tag",
      keywords: ["global"],
      style: { color: "red" },
      database: testDb as any,
    }
    const result = await createTag(tagData)

    expect(result).toBeDefined()
    expect(result.name).toBe("Global Tag")
    expect(result.user).toBeNull()
    expect(result.keywords).toEqual(["global"])
    expect(result.style).toEqual({ color: "red" })
  })

  it("should use default values for optional parameters", async () => {
    const tagData = {
      name: "Default Tag",
      userId: testUser1.id,
      database: testDb as any,
    }
    const result = await createTag(tagData)

    expect(result).toBeDefined()
    expect(result.name).toBe("Default Tag")
    expect(result.user).toBe(testUser1.id)
    expect(result.keywords).toEqual([])
    expect(result.style).toEqual({})
  })

  it("should allow creating multiple tags with same name for same user", async () => {
    const tagData = {
      name: "Duplicate Tag",
      userId: testUser1.id,
      database: testDb as any,
    }
    const firstTag = await createTag(tagData)
    const secondTag = await createTag(tagData)

    expect(firstTag.id).not.toBe(secondTag.id)
    expect(firstTag.name).toBe("Duplicate Tag")
    expect(secondTag.name).toBe("Duplicate Tag")
    expect(firstTag.user).toBe(testUser1.id)
    expect(secondTag.user).toBe(testUser1.id)
  })

  it("should not throw error when tag with same name already exists globally", async () => {
    const globalTagData = {
      name: "Global Duplicate",
      database: testDb as any,
    }
    const userTagData = {
      name: "Global Duplicate",
      userId: testUser1.id,
      database: testDb as any,
    }
    const globalResult = await createTag(globalTagData)
    const userResult = await createTag(userTagData)

    expect(globalResult.id).not.toBe(userResult.id)
    expect(globalResult.name).toBe("Global Duplicate")
    expect(userResult.name).toBe("Global Duplicate")
    expect(globalResult.user).toBeNull()
    expect(userResult.user).toBe(testUser1.id)
  })

  it("should allow different users to have tags with same name", async () => {
    const tagData1 = {
      name: "Same Name",
      userId: testUser1.id,
      database: testDb as any,
    }
    const tagData2 = {
      name: "Same Name",
      userId: testUser2.id,
      database: testDb as any,
    }
    const result1 = await createTag(tagData1)
    const result2 = await createTag(tagData2)

    expect(result1.id).not.toBe(result2.id)
    expect(result1.name).toBe("Same Name")
    expect(result2.name).toBe("Same Name")
    expect(result1.user).toBe(testUser1.id)
    expect(result2.user).toBe(testUser2.id)
  })

  it("should allow global and user tags with same name", async () => {
    const globalTagData = {
      name: "Shared Name",
      database: testDb as any,
    }
    const userTagData = {
      name: "Shared Name",
      userId: testUser1.id,
      database: testDb as any,
    }
    const globalResult = await createTag(globalTagData)
    const userResult = await createTag(userTagData)

    expect(globalResult.id).not.toBe(userResult.id)
    expect(globalResult.name).toBe("Shared Name")
    expect(userResult.name).toBe("Shared Name")
    expect(globalResult.user).toBeNull()
    expect(userResult.user).toBe(testUser1.id)
  })
})
