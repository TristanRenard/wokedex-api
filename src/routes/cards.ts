import { Hono } from "hono"
import {
  createCardController,
  deleteCardController,
  getCardByIdController,
  getCardBySlugController,
  getCardsController,
  updateCardController,
} from "../controllers/cardsController.js"
import { authMiddleware } from "../middleware/auth.js"
import { optionalAuthMiddleware } from "../middleware/optionalAuth.js"

const cards = new Hono()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
cards.get("/", authMiddleware, getCardsController as any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
cards.post("/", authMiddleware, createCardController as any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
cards.put("/:id", authMiddleware, updateCardController as any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
cards.delete("/:id", authMiddleware, deleteCardController as any)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
cards.get("/:id", optionalAuthMiddleware, getCardByIdController as any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
cards.get("/slug/:slug", optionalAuthMiddleware, getCardBySlugController as any)

export default cards
