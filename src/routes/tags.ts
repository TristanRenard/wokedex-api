import { Hono } from "hono"
import {
  createTagController,
  getTagsController,
} from "../controllers/tagsController.js"
import { authMiddleware } from "./reindex.js"

const tags = new Hono()

tags.post("/", authMiddleware, createTagController as never)
tags.get("/myTags", authMiddleware, getTagsController as never)
tags.get("/", getTagsController as never)

export default tags
