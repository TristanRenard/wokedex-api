import type { HandlerResponse } from "hono/types"
import type { AuthenticatedContext } from "../middleware/auth.js"
import { clearImagesIndex, reindexAllImages } from "../services/meilisearch.js"
import umami from "../umami.js"
import getAllImages from "../utils/images/getAllImages.js"

const reindexController = async (
  c: AuthenticatedContext,
): Promise<HandlerResponse<number>> => {
  try {
    await umami.track("reindex_controller_started", {
      userId: c.user.id,
      userRole: c.user.role.toString(),
    })

    if (c.user.role < 2) {
      await umami.track("reindex_controller_insufficient_permissions", {
        userRole: c.user.role.toString(),
        requiredRole: "2",
      })

      return c.json({ message: "Admin access required" }, 403)
    }

    await umami.track("reindex_controller_fetching_images")
    const images = await getAllImages()
    await umami.track("reindex_controller_images_fetched", {
      imagesCount: images.length.toString(),
    })

    if (images.length === 0) {
      await umami.track("reindex_controller_no_images_found")

      return c.json(
        {
          message: "No images found in database",
          data: { indexed: 0 },
        },
        200,
      )
    }

    await umami.track("reindex_controller_clearing_index")
    await clearImagesIndex()
    await umami.track("reindex_controller_index_cleared")

    await umami.track("reindex_controller_preparing_documents")
    const imageDocs = images.map((image) => ({
      id: image.id,
      url: image.url,
      keywords: image.keywords,
      uploadedBy: "unknown",
      uploadedAt: image.createdAt.toISOString(),
      mimeType: "image/jpeg",
      size: 0,
    }))
    await umami.track("reindex_controller_documents_prepared", {
      documentsCount: imageDocs.length.toString(),
    })

    await umami.track("reindex_controller_reindexing_images")
    await reindexAllImages(imageDocs)
    await umami.track("reindex_controller_reindexing_completed", {
      indexedCount: images.length.toString(),
    })

    await umami.track("reindex_controller_success", {
      totalIndexed: images.length.toString(),
    })

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
    await umami.track("reindex_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return c.json(
      {
        message: error instanceof Error ? error.message : "Reindex failed",
      },
      500,
    )
  }
}

export default reindexController
