
import { Router } from "express";
import { getCart, saveCart, cartBreakdown } from "../controllers/cart.controller.js";

const cartRouter = Router();


cartRouter.get("/cart", getCart);
cartRouter.put("/cart", saveCart);
cartRouter.post("/cart/breakdown", cartBreakdown);

export default cartRouter;
