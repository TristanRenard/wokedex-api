import type { AuthenticatedContext } from "../middleware/auth.js"
import type { OptionalAuthContext } from "../middleware/optionalAuth.js"
import umami from "../umami.js"
import createCard from "../utils/cards/createCard.js"
import deleteCard from "../utils/cards/deleteCard.js"
import getCardById from "../utils/cards/getCardById.js"
import getCardBySlug from "../utils/cards/getCardBySlug.js"
import getCards from "../utils/cards/getCards.js"
import updateCard from "../utils/cards/updateCard.js"

export const createCardController = async (
  c: AuthenticatedContext,
): Promise<Response> => {
  try {
    await umami.track("create_card_controller_started")

    const body = await c.req.json()
    const {
      title,
      status,
      level,
      tag1,
      tag2,
      talent,
      object,
      pv,
      acidity,
      based,
      da,
      doom,
      competence1,
      competence1Tag,
      competence2,
      competence2Tag,
      competence3,
      competence3Tag,
      competence4,
      competence4Tag,
      degen,
      imageId,
    } = body
    const userId = c.user.id
    const { username } = c.user

    if (!title || typeof title !== "string") {
      await umami.track("create_card_controller_error", {
        error: "invalid_title",
      })

      return c.json({ error: "Title is required and must be a string" }, 400)
    }

    if (!username) {
      await umami.track("create_card_controller_error", {
        error: "user_has_no_username",
      })

      return c.json({ error: "User must have a username to create cards" }, 400)
    }

    const card = await createCard({
      title,
      ownerId: userId,
      username,
      status,
      level,
      tag1,
      tag2,
      talent,
      object,
      pv,
      acidity,
      based,
      da,
      doom,
      competence1,
      competence1Tag,
      competence2,
      competence2Tag,
      competence3,
      competence3Tag,
      competence4,
      competence4Tag,
      degen,
      imageId,
    })

    await umami.track("create_card_controller_completed", {
      cardId: card.id,
      slug: card.slug,
    })

    return c.json(card, 201)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    await umami.track("create_card_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return c.json({ error: "Internal server error", err: error }, 500)
  }
}

export const getCardsController = async (
  c: AuthenticatedContext,
): Promise<Response> => {
  try {
    await umami.track("get_cards_controller_started")

    const userId = c.user.id
    const status = c.req.query("status")
    const limit = parseInt(c.req.query("limit") ?? "100", 10)
    const offset = parseInt(c.req.query("offset") ?? "0", 10)
    const cards = await getCards({
      ownerId: userId,
      status,
      limit,
      offset,
    })

    await umami.track("get_cards_controller_completed", {
      cardsCount: cards.length.toString(),
      hasStatus: status ? "true" : "false",
    })

    return c.json(cards, 200)
  } catch (error) {
    await umami.track("get_cards_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return c.json({ error: "Internal server error", err: error }, 500)
  }
}

export const getCardByIdController = async (
  c: OptionalAuthContext,
): Promise<Response> => {
  try {
    await umami.track("get_card_by_id_controller_started")

    const cardId = c.req.param("id")

    if (!cardId) {
      await umami.track("get_card_by_id_controller_error", {
        error: "missing_card_id",
      })

      return c.json({ error: "Card ID is required" }, 400)
    }

    const userId = c.user?.id
    const role = c.user?.role ?? 0
    const card = await getCardById({ cardId, userId, role })

    if (!card) {
      await umami.track("get_card_by_id_controller_error", {
        error: "card_not_found",
      })

      return c.json({ error: "Card not found" }, 404)
    }

    await umami.track("get_card_by_id_controller_completed", {
      cardId,
      hasUserId: userId ? "true" : "false",
    })

    return c.json(card, 200)
  } catch (error) {
    await umami.track("get_card_by_id_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return c.json({ error: "Internal server error", err: error }, 500)
  }
}

export const getCardBySlugController = async (
  c: OptionalAuthContext,
): Promise<Response> => {
  try {
    await umami.track("get_card_by_slug_controller_started")

    const slug = c.req.param("slug")

    if (!slug) {
      await umami.track("get_card_by_slug_controller_error", {
        error: "missing_slug",
      })

      return c.json({ error: "Slug is required" }, 400)
    }

    const userId = c.user?.id
    const role = c.user?.role ?? 0
    const card = await getCardBySlug({ slug, userId, role })

    if (!card) {
      await umami.track("get_card_by_slug_controller_error", {
        error: "card_not_found",
      })

      return c.json({ error: "Card not found" }, 404)
    }

    await umami.track("get_card_by_slug_controller_completed", {
      slug,
      hasUserId: userId ? "true" : "false",
    })

    return c.json(card, 200)
  } catch (error) {
    await umami.track("get_card_by_slug_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return c.json({ error: "Internal server error", err: error }, 500)
  }
}

export const updateCardController = async (
  c: AuthenticatedContext,
): Promise<Response> => {
  try {
    await umami.track("update_card_controller_started")

    const cardId = c.req.param("id")
    const body = await c.req.json()
    const {
      title,
      username,
      status,
      level,
      tag1,
      tag2,
      talent,
      object,
      pv,
      acidity,
      based,
      da,
      doom,
      competence1,
      competence1Tag,
      competence2,
      competence2Tag,
      competence3,
      competence3Tag,
      competence4,
      competence4Tag,
      degen,
      imageId,
    } = body
    const userId = c.user.id
    const { role } = c.user

    if (!cardId) {
      await umami.track("update_card_controller_error", {
        error: "missing_card_id",
      })

      return c.json({ error: "Card ID is required" }, 400)
    }

    const card = await updateCard({
      cardId,
      userId,
      role,
      title,
      username,
      status,
      level,
      tag1,
      tag2,
      talent,
      object,
      pv,
      acidity,
      based,
      da,
      doom,
      competence1,
      competence1Tag,
      competence2,
      competence2Tag,
      competence3,
      competence3Tag,
      competence4,
      competence4Tag,
      degen,
      imageId,
    })

    await umami.track("update_card_controller_completed", {
      cardId,
      userId,
    })

    return c.json(card, 200)
  } catch (error) {
    await umami.track("update_card_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    if (
      error instanceof Error &&
      error.message === "Card not found or not owned by user"
    ) {
      return c.json({ error: "Card not found or not owned by user" }, 404)
    }

    return c.json({ error: "Internal server error", err: error }, 500)
  }
}

export const deleteCardController = async (
  c: AuthenticatedContext,
): Promise<Response> => {
  try {
    await umami.track("delete_card_controller_started")

    const cardId = c.req.param("id")
    const userId = c.user.id
    const { role } = c.user

    if (!cardId) {
      await umami.track("delete_card_controller_error", {
        error: "missing_card_id",
      })

      return c.json({ error: "Card ID is required" }, 400)
    }

    await deleteCard({ cardId, userId, role })

    await umami.track("delete_card_controller_completed", {
      cardId,
    })

    return c.json({ message: "Card deleted successfully" }, 200)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    await umami.track("delete_card_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    if (
      error instanceof Error &&
      error.message === "Card not found or not owned by user"
    ) {
      return c.json({ error: "Card not found or not owned by user" }, 404)
    }

    return c.json({ error: "Internal server error", err: error }, 500)
  }
}
