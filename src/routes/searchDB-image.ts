import type { Context } from "hono"
import type { HandlerResponse } from "hono/types"
import searchImagesDBController from "../controllers/searchDBController.js"

const searchImagesDB = async (c: Context): Promise<HandlerResponse<number>> =>
  await searchImagesDBController(c)

export default searchImagesDB
