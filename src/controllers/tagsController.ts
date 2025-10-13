import type { HandlerResponse } from "hono/types"
import { db as dbInstance } from "../db/index.js"
import type { AuthenticatedContext } from "../middleware/auth.js"
import type { OptionalAuthContext } from "../middleware/optionalAuth.js"
import umami from "../umami.js"
import createTag from "../utils/tags/createTag.js"
import deleteTag from "../utils/tags/deleteTag.js"
import getTagById from "../utils/tags/getTagById.js"
import getTags from "../utils/tags/getTags.js"

export const createTagController = async (
  c: AuthenticatedContext,
  database = dbInstance,
): Promise<HandlerResponse<number>> => {
  try {
    await umami.track("create_tag_controller_started")

    const body = await c.req.json()
    const { name, keywords, style } = body
    const userId = c.user.id

    if (!name || typeof name !== "string") {
      await umami.track("create_tag_controller_error", {
        error: "invalid_name",
      })

      return c.json({ error: "Name is required and must be a string" }, 400)
    }

    const tag = await createTag({
      name,
      userId,
      keywords: keywords ?? [],
      style: style ?? {},
      database,
    })

    await umami.track("create_tag_controller_completed", {
      tagId: tag.id,
    })

    return c.json(tag, 201)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    await umami.track("create_tag_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return c.json({ error: "Internal server error", err: error }, 500)
  }
}

export const deleteTagController = async (
  c: AuthenticatedContext,
  database = dbInstance,
): Promise<Response> => {
  try {
    await umami.track("delete_tag_controller_started")

    const tagId = c.req.param("id")
    const userId = c.user.id
    const { role } = c.user

    if (!tagId) {
      await umami.track("delete_tag_controller_error", {
        error: "missing_tag_id",
      })

      return c.json({ error: "Tag ID is required" }, 400)
    }

    await deleteTag({ tagId, userId, role, database })

    await umami.track("delete_tag_controller_completed", {
      tagId,
    })

    return c.json({ message: "Tag deleted successfully" }, 200)
  } catch (error) {
    await umami.track("delete_tag_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    if (
      error instanceof Error &&
      error.message === "Tag not found or not owned by user"
    ) {
      return c.json({ error: "Tag not found or not owned by user" }, 404)
    }

    return c.json({ error: "Internal server error", err: error }, 500)
  }
}

export const getTagByIdController = async (
  c: OptionalAuthContext,
  database = dbInstance,
): Promise<HandlerResponse<number>> => {
  try {
    await umami.track("get_tag_by_id_controller_started")

    const tagId = c.req.param("id")

    if (!tagId) {
      await umami.track("get_tag_by_id_controller_error", {
        error: "missing_tag_id",
      })

      return c.json({ error: "Tag ID is required" }, 400)
    }

    const userId = c.user?.id
    const tag = await getTagById({ tagId, userId, database })

    if (!tag) {
      await umami.track("get_tag_by_id_controller_error", {
        error: "tag_not_found",
      })

      return c.json({ error: "Tag not found" }, 404)
    }

    await umami.track("get_tag_by_id_controller_completed", {
      tagId,
      hasUserId: userId ? "true" : "false",
    })

    return c.json(tag, 200)
  } catch (error) {
    await umami.track("get_tag_by_id_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return c.json({ error: "Internal server error", err: error }, 500)
  }
}

export const getTagsController = async (
  c: AuthenticatedContext,
): Promise<Response> => {
  const db = dbInstance

  try {
    await umami.track("get_tags_controller_started")

    const userId = c?.user?.id
    const tags = await getTags({ userId, database: db })

    await umami.track("get_tags_controller_completed", {
      tagsCount: tags.length.toString(),
      hasUserId: userId ? "true" : "false",
    })

    return c.json(tags, 200)
  } catch (error) {
    await umami.track("get_tags_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return c.json({ error: "Internal server error", err: error }, 500)
  }
}
