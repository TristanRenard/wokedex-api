/* eslint-disable no-console */
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

  // Debug: Log des paramètres d'entrée
  if (process.env.NODE_ENV !== "production") {
    console.log("[CreateTag Debug] Function called with params:", {
      name,
      userId,
      keywordsCount: keywords.length,
      keywords,
      hasStyle: Object.keys(style).length > 0,
      styleKeys: Object.keys(style),
      usingCustomDatabase: Boolean(database),
    })
  }

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[CreateTag Debug] Tracking create_tag_started event")
    }

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

    if (process.env.NODE_ENV !== "production") {
      console.log("[CreateTag Debug] Inserting tag into database:", {
        newTag: {
          ...newTag,
          style: JSON.stringify(newTag.style),
        },
      })
    }

    const startTime = Date.now()
    const [createdTag] = await db.insert(tags).values(newTag).returning()
    const dbDuration = Date.now() - startTime

    if (process.env.NODE_ENV !== "production") {
      console.log("[CreateTag Debug] Tag created successfully:", {
        tagId: createdTag.id,
        dbDuration: `${dbDuration}ms`,
        createdAt: createdTag.createdAt,
        isCustom: Boolean(userId),
      })
    }

    await umami.track("create_tag_completed", {
      tagId: createdTag.id,
      isCustom: userId ? "true" : "false",
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[CreateTag Debug] Returning created tag")
    }

    return createdTag
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[CreateTag Debug] Error occurred:", {
        error,
        errorMessage: error instanceof Error ? error.message : "unknown",
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : typeof error,
        inputParams: { name, userId, keywordsCount: keywords.length },
      })
    }

    await umami.track("create_tag_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    throw error
  }
}

export default createTag
