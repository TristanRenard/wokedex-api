import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { db as dbInstance } from "../../db/index.js"
import type * as schema from "../../db/schema.js"
import { tags, type NewTag, type Tag } from "../../db/schema.js"
import umami from "../../umami.js"

interface CreateTagParams {
  name: string
  userId?: string
  keywords?: string[]
  style?: Record<string, unknown>
  database?: NodePgDatabase<typeof schema>
}

const createTag = async ({
  name,
  userId,
  keywords = [],
  style = {},
  database,
}: CreateTagParams): Promise<Tag> => {
  const db = database ?? dbInstance

  try {
    await umami.track("create_tag_started", {
      hasName: name ? "true" : "false",
      hasUserId: userId ? "true" : "false",
      keywordsCount: keywords.length.toString(),
    })

    const newTag: NewTag = {
      name,
      user: userId ?? null,
      keywords,
      style,
    }
    const [createdTag] = await db.insert(tags).values(newTag).returning()

    await umami.track("create_tag_completed", {
      tagId: createdTag.id,
      isCustom: userId ? "true" : "false",
    })

    return createdTag
  } catch (error) {
    await umami.track("create_tag_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default createTag
