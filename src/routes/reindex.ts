import type { HandlerResponse } from "hono/types"
import reindexController from "../controllers/reindexController.js"
import {
  authMiddleware,
  type AuthenticatedContext,
} from "../middleware/auth.js"

const reindex = async (
  c: AuthenticatedContext,
): Promise<HandlerResponse<number>> => await reindexController(c)

export { authMiddleware }
export default reindex
