import { sql } from "drizzle-orm"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { db } from "../../db/index.js"
import type * as schema from "../../db/schema.js"
import { tags, type Tag } from "../../db/schema.js"
import umami from "../../umami.js"

interface GetTagByIdParams {
  tagId: string
  userId?: string
  database?: NodePgDatabase<typeof schema>
}

const getTagById = async ({
  tagId,
  userId,
  database,
}: GetTagByIdParams): Promise<Tag | null> => {
  const dbInstance = database ?? db

  try {
    await umami.track("get_tag_by_id_started", {
      tagId,
      hasUserId: userId ? "true" : "false",
    })

    let result: Tag[] = []

    if (userId) {
      result = await dbInstance
        .select()
        .from(tags)
        .where(
          sql`${tags.id} = ${tagId} AND (${tags.user} IS NULL OR ${tags.user} = ${userId})`,
        )
        .limit(1)
    } else {
      result = await dbInstance
        .select()
        .from(tags)
        .where(sql`${tags.id} = ${tagId} AND ${tags.user} IS NULL`)
        .limit(1)
    }

    const tag = result.length > 0 ? result[0] : null

    await umami.track("get_tag_by_id_completed", {
      tagId,
      found: tag ? "true" : "false",
      hasUserId: userId ? "true" : "false",
    })

    return tag
  } catch (error) {
    await umami.track("get_tag_by_id_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default getTagById
