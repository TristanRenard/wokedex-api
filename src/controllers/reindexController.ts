import type { HandlerResponse } from "hono/types"
import type { AuthenticatedContext } from "../middleware/auth.js"
import {
  clearCardsIndex,
  clearImagesIndex,
  reindexAllCards,
  reindexAllImages,
  type CardDocument,
  type ImageDocument,
} from "../services/meilisearch.js"
import umami from "../umami.js"
import getCards from "../utils/cards/getCards.js"
import getAllImages from "../utils/images/getAllImages.js"
import getUserById from "../utils/users/getUserById.js"

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
    await reindexAllImages(imageDocs as ImageDocument[])
    await umami.track("reindex_controller_images_reindexing_completed", {
      indexedCount: images.length.toString(),
    })

    await umami.track("reindex_controller_fetching_cards")
    const cards = await getCards()
    await umami.track("reindex_controller_cards_fetched", {
      cardsCount: cards.length.toString(),
    })

    if (cards.length > 0) {
      await umami.track("reindex_controller_clearing_cards_index")
      await clearCardsIndex()
      await umami.track("reindex_controller_cards_index_cleared")

      await umami.track("reindex_controller_preparing_cards_documents")
      const cardDocs: CardDocument[] = []

      for (const card of cards) {
        // eslint-disable-next-line no-await-in-loop
        const owner = await getUserById(card.ownerId ?? "")
        cardDocs.push({
          id: card.id,
          slug: card.slug,
          title: card.title ?? "",
          status: card.status ?? "draft",
          level: card.level ?? 0,
          talent: card.talent,
          object: card.object,
          pv: card.pv ?? 0,
          acidity: card.acidity ?? 0,
          based: card.based ?? 0,
          da: card.da ?? 0,
          image: card.image ?? {},
          doom: card.doom ?? 0,
          competence1: card.competence1,
          competence2: card.competence2,
          competence3: card.competence3,
          competence4: card.competence4,
          degen: card.degen ?? 0,
          ownerId: card.ownerId ?? "",
          ownerUsername: owner?.username ?? "",
          createdAt: card.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: card.updatedAt?.toISOString() ?? new Date().toISOString(),
        })
      }

      await umami.track("reindex_controller_cards_documents_prepared", {
        documentsCount: cardDocs.length.toString(),
      })

      await umami.track("reindex_controller_reindexing_cards")
      await reindexAllCards(cardDocs)
      await umami.track("reindex_controller_cards_reindexing_completed", {
        indexedCount: cards.length.toString(),
      })
    }

    const totalIndexed = images.length + cards.length
    await umami.track("reindex_controller_success", {
      totalIndexed: images.length.toString(),
    })

    return c.json(
      {
        message: "Images and cards reindexed successfully",
        data: {
          indexed: totalIndexed,
          images: images.length,
          cards: cards.length,
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
