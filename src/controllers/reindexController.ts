import type { HandlerResponse } from "hono/types"
import type { AuthenticatedContext } from "../middleware/auth.js"
import { clearImagesIndex, reindexAllImages } from "../services/meilisearch.js"
import getAllImages from "../utils/images/getAllImages.js"

const reindexController = async (
  c: AuthenticatedContext,
): Promise<HandlerResponse<number>> => {
  try {
    if (c.user.role < 2) {
      return c.json({ message: "Admin access required" }, 403)
    }

    const images = await getAllImages()

    if (images.length === 0) {
      return c.json(
        {
          message: "No images found in database",
          data: { indexed: 0 },
        },
        200,
      )
    }

    await clearImagesIndex()

    const imageDocs = images.map((image) => ({
      id: image.id,
      url: image.url,
      keywords: image.keywords,
      uploadedBy: "unknown",
      uploadedAt: image.createdAt.toISOString(),
      mimeType: "image/jpeg",
      size: 0,
    }))

    await reindexAllImages(imageDocs)

    return c.json(
      {
        message: "Images reindexed successfully",
        data: {
          indexed: images.length,
          total: images.length,
        },
      },
      200,
    )
  } catch (error: unknown) {
    return c.json(
      {
        message: error instanceof Error ? error.message : "Reindex failed",
      },
      500,
    )
  }
}

export default reindexController
