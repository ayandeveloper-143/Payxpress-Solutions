import { Router } from "express";
import { getCart, saveCart } from "../controllers/cart.controller.js";

const cartRouter = Router();

cartRouter.get("/cart", getCart);
cartRouter.put("/cart", saveCart);

export default cartRouter;
