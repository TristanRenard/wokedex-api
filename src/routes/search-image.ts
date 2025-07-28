import type { Context } from "hono"
import type { HandlerResponse } from "hono/types"
import searchImagesController from "../controllers/searchController.js"

const searchImages = async (c: Context): Promise<HandlerResponse<number>> =>
  await searchImagesController(c)

export default searchImages
