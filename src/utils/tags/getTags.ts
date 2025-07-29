import { sql } from "drizzle-orm"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { db } from "../../db/index.js"
import type * as schema from "../../db/schema.js"
import { tags, type Tag } from "../../db/schema.js"
import umami from "../../umami.js"

interface GetTagsParams {
  userId?: string
  database?: NodePgDatabase<typeof schema>
}

const getTags = async ({ userId, database }: GetTagsParams = {}): Promise<
  Tag[]
> => {
  const dbInstance = database ?? db

  try {
    await umami.track("get_tags_started", {
      hasUserId: userId ? "true" : "false",
    })

    let result: Tag[] = []

    if (userId) {
      result = await dbInstance
        .select()
        .from(tags)
        .where(sql`${tags.user} IS NULL OR ${tags.user} = ${userId}`)
        .orderBy(tags.name)
    } else {
      result = await dbInstance
        .select()
        .from(tags)
        .where(sql`${tags.user} IS NULL`)
        .orderBy(tags.name)
    }

    await umami.track("get_tags_completed", {
      tagsCount: result.length.toString(),
      hasUserId: userId ? "true" : "false",
    })

    return result
  } catch (error) {
    await umami.track("get_tags_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default getTags
