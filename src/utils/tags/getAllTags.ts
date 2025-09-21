import { eq } from "drizzle-orm"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { alias } from "drizzle-orm/pg-core"
import { db as dbInstance } from "../../db/index.js"
import * as schema from "../../db/schema.js"
import { tags } from "../../db/schema.js"
import umami from "../../umami.js"

interface GetTagsParams {
  database?: NodePgDatabase<typeof schema>
}

const user = alias(schema.users, "user")
const getAllTags = async ({ database }: GetTagsParams = {}): Promise<
  schema.TagWithAuthor[]
> => {
  const db = database ?? dbInstance

  try {
    await umami.track("get_all_tags_started")

    const result = await db
      .select()
      .from(tags)
      .leftJoin(user, eq(tags.user, user))
      .orderBy(tags.name)

    await umami.track("get_all_tags_completed", {
      tagsCount: result.length.toString(),
    })

    return result
  } catch (error) {
    await umami.track("get_tags_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default getAllTags
