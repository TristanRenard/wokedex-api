import { Hono } from "hono"
import { searchCardsController } from "../controllers/searchCardsController.js"

const searchCards = new Hono()

searchCards.get("/", searchCardsController)

export default searchCards
