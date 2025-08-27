import { Hono } from "hono"
import {
  createTagController,
  getMyTags,
  getTagsController,
} from "../controllers/tagsController.js"
import { authMiddleware } from "./reindex.js"

const tags = new Hono()

tags.post("/", authMiddleware, createTagController as never)
tags.get("/myTags", authMiddleware, getMyTags as never)
tags.get("/", getTagsController as never)

export default tags
