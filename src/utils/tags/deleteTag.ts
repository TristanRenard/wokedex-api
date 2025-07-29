import { sql } from "drizzle-orm"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { db } from "../../db/index.js"
import type * as schema from "../../db/schema.js"
import { tags } from "../../db/schema.js"
import umami from "../../umami.js"

interface DeleteTagParams {
  tagId: string
  userId: string
  role: number
  database?: NodePgDatabase<typeof schema>
}

const deleteTag = async ({
  tagId,
  userId,
  role = 0,
  database,
}: DeleteTagParams): Promise<boolean> => {
  const dbInstance = database ?? db

  try {
    await umami.track("delete_tag_started", {
      tagId,
      userId,
    })

    let existingTag: schema.Tag[] = []

    if (role >= 2) {
      existingTag = await dbInstance
        .select()
        .from(tags)
        .where(sql`${tags.id} = ${tagId}`)
        .limit(1)
    } else {
      existingTag = await dbInstance
        .select()
        .from(tags)
        .where(sql`${tags.id} = ${tagId} AND ${tags.user} = ${userId}`)
        .limit(1)
    }

    if (existingTag.length === 0) {
      await umami.track("delete_tag_error", {
        error: "tag_not_found_or_not_owned",
      })
      throw new Error("Tag not found or not owned by user")
    }

    if (role >= 2) {
      await dbInstance.delete(tags).where(sql`${tags.id} = ${tagId}`)
    } else {
      await dbInstance
        .delete(tags)
        .where(sql`${tags.id} = ${tagId} AND ${tags.user} = ${userId}`)
    }

    await umami.track("delete_tag_completed", {
      tagId,
      userId,
    })

    return true
  } catch (error) {
    await umami.track("delete_tag_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default deleteTag
