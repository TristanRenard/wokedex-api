/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { tags, type User } from "../db/schema.js"
import createTag from "../utils/tags/createTag.js"
import deleteTag from "../utils/tags/deleteTag.js"
import { createUser } from "../utils/users/createUser.js"
import { cleanDatabase } from "./helper.js"
import { testDb } from "./setup.js"

describe("deleteTag", () => {
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

  it("should delete a tag successfully", async () => {
    const tag = await createTag({
      name: "Tag to Delete",
      userId: testUser1.id,
      database: testDb as any,
    })

    await deleteTag({
      tagId: tag.id,
      userId: testUser1.id,
      database: testDb as any,
      role: 0,
    })

    const remainingTags = await testDb.select().from(tags)
    expect(remainingTags).toHaveLength(0)
  })

  it("should throw error when tag does not exist", async () => {
    await expect(
      deleteTag({
        tagId: "non-existent-id",
        userId: testUser1.id,
        database: testDb as any,
        role: 0,
      }),
    ).rejects.toThrow("Tag not found or not owned by user")
  })

  it("should throw error when user is not the owner", async () => {
    const tag = await createTag({
      name: "User 1 Tag",
      userId: testUser1.id,
      database: testDb as any,
    })

    await expect(
      deleteTag({
        tagId: tag.id,
        userId: testUser2.id,
        database: testDb as any,
        role: 0,
      }),
    ).rejects.toThrow("Tag not found or not owned by user")
  })

  it("should not allow deletion of global tags", async () => {
    const globalTag = await createTag({
      name: "Global Tag",
      database: testDb as any,
    })

    await expect(
      deleteTag({
        tagId: globalTag.id,
        userId: testUser1.id,
        database: testDb as any,
        role: 0,
      }),
    ).rejects.toThrow("Tag not found or not owned by user")
  })

  it("should allow owner to delete their own tag", async () => {
    const tag = await createTag({
      name: "My Tag",
      userId: testUser1.id,
      database: testDb as any,
    })

    await deleteTag({
      tagId: tag.id,
      userId: testUser1.id,
      database: testDb as any,
      role: 0,
    })

    const remainingTags = await testDb.select().from(tags)
    expect(remainingTags).toHaveLength(0)
  })

  it("should handle multiple deletions correctly", async () => {
    const tag1 = await createTag({
      name: "Tag 1",
      userId: testUser1.id,
      database: testDb as any,
    })
    const tag2 = await createTag({
      name: "Tag 2",
      userId: testUser1.id,
      database: testDb as any,
    })

    await deleteTag({
      tagId: tag1.id,
      userId: testUser1.id,
      database: testDb as any,
      role: 0,
    })

    const remainingTags = await testDb.select().from(tags)
    expect(remainingTags).toHaveLength(1)
    expect(remainingTags[0].id).toBe(tag2.id)
  })
})
