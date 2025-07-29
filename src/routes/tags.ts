import { Hono } from "hono"
import {
  createTagController,
  deleteTagController,
  getTagByIdController,
  getTagsController,
} from "../controllers/tagsController.js"
import { authMiddleware } from "../middleware/auth.js"
import { optionalAuthMiddleware } from "../middleware/optionalAuth.js"

const tags = new Hono()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
tags.get("/", authMiddleware, getTagsController as any)
tags.get("/:id", optionalAuthMiddleware, getTagByIdController)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
tags.post("/", authMiddleware, createTagController as any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
tags.delete("/:id", authMiddleware, deleteTagController as any)

export default tags
